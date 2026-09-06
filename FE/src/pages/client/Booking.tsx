import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Row, Col, Button, Space, Typography, message, Spin, Alert, Flex, Tooltip, Tag, Segmented } from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { ClientLayout } from "./layout";

const { Title, Text } = Typography;

interface Seat {
    seatCode: string;
    rowIndex: number;
    colIndex: number;
    floor: number;
    status: "AVAILABLE" | "HOLDING" | "BOOKED";
    heldBy: string | null;
    expiresAt: string | null;
}

interface FareRule {
    weekdayPrice: number;
    weekendPrice: number;
}

interface DetailedTrip {
    _id: string;
    departureTime: string;
    journey: {
        diemDi: string;
        diemDen: string;
        price: number;
    };
    fareRule?: FareRule;
    bus: {
        name: string;
        type: string;
        capacity: number; // 🌟 Thêm trường để lấy đúng số chỗ phục vụ tính toán Grid
        licensePlates?: string;
    };
    seats: Seat[];
}

export default function BookingSeats(): React.ReactElement {
    const { tripId } = useParams<{ tripId: string }>();
    const navigate = useNavigate();

    const [trip, setTrip] = useState<DetailedTrip | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [bookingLoading, setBookingLoading] = useState<boolean>(false); 
    const [chosenSeatCodes, setChosenSeatCodes] = useState<string[]>([]);
    const [activeFloor, setActiveFloor] = useState<number>(1);
    const [viewFloorTab, setViewFloorTab] = useState<string>("all");

    useEffect(() => {
        const fetchTripDetails = async () => {
            if (!tripId) {
                message.error("Không tìm thấy mã chuyến xe trên URL!");
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`http://localhost:3000/api/trip/${tripId}`);
                if (response.data) {
                    const tripData = response.data.data ? response.data.data : response.data;
                    setTrip(tripData);

                    // Tự động tích chọn những ghế đang được giữ bởi chính tài khoản này
                    const userString = localStorage.getItem("user");
                    const userObj = userString ? JSON.parse(userString) : null;
                    if (userObj && userObj._id && tripData.seats) {
                        const heldSeats = tripData.seats
                            .filter((s: Seat) => {
                                if (s.status !== "HOLDING" || !s.heldBy) return false;
                                const heldById = typeof s.heldBy === "object" ? (s.heldBy as any)._id : s.heldBy;
                                return String(heldById) === String(userObj._id);
                            })
                            .map((s: Seat) => s.seatCode);
                        setChosenSeatCodes(heldSeats);
                    }
                }
            } catch (error) {
                console.error("Lỗi chi tiết khi gọi API sơ đồ ghế:", error);
                message.error("Không thể tải sơ đồ ghế!");
            } finally {
                setLoading(false);
            }
        };

        fetchTripDetails();
    }, [tripId]);

    const getSingleTicketPrice = (): number => {
        if (!trip) return 0;
        if (!trip.departureTime) return trip.journey?.price || 0;

        const departureDate = new Date(trip.departureTime);

        if (trip.fareRule) {
            if (departureDate.getDay() === 0 || departureDate.getDay() === 6) {
                return trip.fareRule.weekendPrice;
            } else {
                return trip.fareRule.weekdayPrice;
            }
        }
        return trip.journey?.price || 0;
    };

    const calculatedTotalAmount = getSingleTicketPrice() * chosenSeatCodes.length;
    const getGridColsCount = (): number => {
        if (!trip || !trip.bus) return 4;
        const { capacity, type } = trip.bus;
        if (type === "Sleeper" || capacity === 38 || capacity === 34) return 5; // Xe giường nằm có 3 dãy giường + 2 lối đi
        if (capacity <= 10 || type === "Limousine") return 3; // Limousine 3 cột (Ghế trái - Lối đi - Ghế phải)
        if (capacity === 16) return 4;
        if (capacity === 29) return 5;
        if (capacity === 45) return 5;
        return 4;
    };

    const getMappedColIndex = (seat: Seat): number => {
        if (!trip || !trip.bus) return seat.colIndex;
        const { capacity } = trip.bus;
        if (capacity === 45) {
            if (seat.rowIndex <= 10) {
                if (seat.colIndex === 1) return 1;
                if (seat.colIndex === 2) return 2;
                if (seat.colIndex === 3) return 4;
                if (seat.colIndex === 4) return 5;
            }
        }
        return seat.colIndex;
    };

    const handleConfirmBooking = async (): Promise<void> => {
        if (chosenSeatCodes.length === 0) {
            message.warning("Vui lòng chọn ít nhất một vị trí trước khi tiếp tục!");
            return;
        }

        const userString = localStorage.getItem("user");
        const userObj = userString ? JSON.parse(userString) : null;

        if (!userObj || !userObj._id) {
            message.error("Vui lòng đăng nhập tài khoản trước khi thực hiện đặt vé!");
            navigate("/khachhang/login"); 
            return;
        }

        setBookingLoading(true);

        try {
            const bookingBody = {
                user: userObj._id,      
                trip: tripId,            
                seats: chosenSeatCodes
            };

            const bookingResponse = await axios.post("http://localhost:3000/api/booking/add", bookingBody);
            const createdBookingId = bookingResponse.data?.data?._id;
            const serverOrderCode = bookingResponse.data?.data?.orderCode;

            if (!createdBookingId) {
                throw new Error("Không nhận được mã đơn hàng từ hệ thống!");
            }

            const paymentResponse = await axios.post("http://localhost:3000/api/payment/create-link", {
                bookingId: createdBookingId
            });

            if (paymentResponse.data && paymentResponse.data.checkoutUrl) {
                message.success("Đặt vé thành công! Đang chuyển hướng đến cổng thanh toán trực tuyến...");
                
                const myOrderCode = paymentResponse.data?.orderCode || serverOrderCode || createdBookingId.slice(-6).toUpperCase();

                const ticketStorageData = {
                    id: createdBookingId,
                    ticketCode: `NB-${myOrderCode}`,
                    customerName: userObj?.username || "Hành khách NETBUS",
                    busName: trip?.bus?.name || "Xe NETBUS Luxury",
                    licensePlate: trip?.bus?.licensePlates || "29B-123.45",
                    journey: `${trip?.journey?.diemDi || "Điểm đi"} → ${trip?.journey?.diemDen || "Điểm đến"}`,
                    seats: chosenSeatCodes,
                    totalPrice: calculatedTotalAmount,
                    departureTime: trip?.departureTime 
                        ? new Date(trip.departureTime).toLocaleString("vi-VN", {
                            dateStyle: "short",
                            timeStyle: "short"
                          })
                        : "Đang cập nhật..."
                };

                localStorage.setItem("latest_ticket_success", JSON.stringify(ticketStorageData));
                window.location.href = paymentResponse.data.checkoutUrl;
                return; 
            } else {
                message.error("Đơn hàng đã tạo nhưng hệ thống không phản hồi link QR thanh toán!");
            }

        } catch (error: any) {
            console.error("Lỗi trong luồng đặt vé và thanh toán:", error);
            const errorMsg = error.response?.data?.message || error.message || "Xử lý đặt vé thất bại, vui lòng thử lại!";
            message.error(errorMsg);
        } finally {
            setBookingLoading(false);
        }
    };

    const handleSeatClick = (seat: Seat): void => {
        const userString = localStorage.getItem("user");
        const userObj = userString ? JSON.parse(userString) : null;
        
        const isUserHeld = seat.status === "HOLDING" && seat.heldBy && 
            (typeof seat.heldBy === "object" ? String((seat.heldBy as any)._id) : String(seat.heldBy)) === String(userObj?._id);

        if (seat.status !== "AVAILABLE" && !isUserHeld) return;

        if (chosenSeatCodes.includes(seat.seatCode)) {
            setChosenSeatCodes(chosenSeatCodes.filter(code => code !== seat.seatCode));
        } else {
            setChosenSeatCodes([...chosenSeatCodes, seat.seatCode]);
        }
    };

    if (loading) {
        return (
            <ClientLayout>
                <Flex align="center" justify="center" style={{ padding: "100px 0", background: "#f5f7fa", minHeight: "100vh" }}>
                    <Spin size="large" tip="Đang tải sơ đồ vị trí..." />
                </Flex>
            </ClientLayout>
        );
    }

    if (!trip) {
        return (
            <ClientLayout>
                <div style={{ textAlign: "center", padding: "50px 0" }}>
                    <Alert message="Lỗi tải dữ liệu" description={`Không tìm thấy thông tin cho Trip ID: ${tripId}`} type="error" showIcon style={{ maxWidth: 500, margin: "0 auto" }} />
                    <Button onClick={() => navigate(-1)} style={{ marginTop: 20 }}>Quay lại</Button>
                </div>
            </ClientLayout>
        );
    }

    const isSleeper = trip.bus?.type === "Sleeper";
    const totalCols = getGridColsCount();

    const renderSeatItem = (seat: Seat, showCockpit: boolean) => {
        const isSelected = chosenSeatCodes.includes(seat.seatCode);
        const isAvailable = seat.status === "AVAILABLE";
        const isHolding = seat.status === "HOLDING";
        const isBooked = seat.status === "BOOKED";

        const userString = localStorage.getItem("user");
        const userObj = userString ? JSON.parse(userString) : null;
        const isUserHeld = isHolding && seat.heldBy && 
            (typeof seat.heldBy === "object" ? String((seat.heldBy as any)._id) : String(seat.heldBy)) === String(userObj?._id);

        const canClick = isAvailable || isUserHeld;
        const gridRow = showCockpit ? seat.rowIndex + 1 : seat.rowIndex;
        const gridCol = getMappedColIndex(seat);

        let statusText = "Còn trống";
        if (isSelected) statusText = "Đang chọn";
        else if (isHolding) statusText = isUserHeld ? "Bạn đang giữ chỗ" : "Đang có người giữ chỗ";
        else if (isBooked) statusText = "Đã bán";

        if (isSleeper) {
            let containerClasses = "group relative h-[62px] w-full rounded-xl transition-all duration-200 transform";
            let frameClasses = "absolute inset-0 rounded-xl border-2 transition-colors";
            let pillowClasses = "absolute top-1.5 left-2 right-2 h-2.5 rounded-sm border transition-colors";
            let footClasses = "absolute bottom-1.5 left-2 right-2 h-2 rounded-b-sm border-t border-dashed transition-colors";
            let textClasses = "text-[12px] font-bold tracking-wide transition-colors";

            if (isSelected) {
                containerClasses += " ring-2 ring-emerald-500 scale-105 shadow-md z-10 cursor-pointer";
                frameClasses += " bg-emerald-50/90 border-emerald-500";
                pillowClasses += " bg-emerald-200 border-emerald-400";
                footClasses += " bg-emerald-100 border-emerald-300";
                textClasses += " text-emerald-700 font-extrabold";
            } else if (isHolding && !isUserHeld) {
                containerClasses += " cursor-not-allowed opacity-90";
                frameClasses += " bg-rose-50/90 border-rose-400";
                pillowClasses += " bg-rose-200 border-rose-300";
                footClasses += " bg-rose-100 border-rose-200";
                textClasses += " text-rose-700 font-bold";
            } else if (isBooked) {
                containerClasses += " cursor-not-allowed opacity-60";
                frameClasses += " bg-slate-100 border-slate-200";
                pillowClasses += " bg-slate-200 border-slate-300";
                footClasses += " bg-slate-100 border-slate-200";
                textClasses += " text-slate-400 font-medium";
            } else {
                // AVAILABLE
                containerClasses += " hover:-translate-y-0.5 hover:shadow-sm cursor-pointer";
                frameClasses += " bg-white border-slate-300 group-hover:border-emerald-400 group-hover:bg-slate-50";
                pillowClasses += " bg-slate-100 border-slate-200 group-hover:bg-emerald-100/60";
                footClasses += " bg-slate-50 border-slate-200";
                textClasses += " text-slate-700 group-hover:text-emerald-700";
            }

            return (
                <Tooltip
                    key={seat.seatCode}
                    title={
                        <div className="text-xs">
                            <p className="font-bold text-emerald-400">Giường: {seat.seatCode}</p>
                            <p>Tầng: {seat.floor === 1 ? "Tầng 1 (Dưới)" : "Tầng 2 (Trên)"}</p>
                            <p>Trạng thái: {statusText}</p>
                        </div>
                    }
                >
                    <div
                        onClick={() => canClick && handleSeatClick(seat)}
                        style={{
                            gridColumnStart: gridCol,
                            gridRowStart: gridRow,
                        }}
                        className={containerClasses}
                    >
                        {/* Khung giường */}
                        <div className={frameClasses} />
                        {/* Gối đầu */}
                        <div className={pillowClasses} />
                        {/* Tấm ga đệm chân */}
                        <div className={footClasses} />
                        {/* Mã số giường */}
                        <div className="relative z-10 h-full flex flex-col items-center justify-center pt-2">
                            <span className={textClasses}>
                                {seat.seatCode}
                            </span>
                        </div>
                    </div>
                </Tooltip>
            );
        }

        // Xe ghế ngồi (Seater)
        let containerClasses = "group relative h-[52px] w-full rounded-lg transition-all duration-200 transform";
        let headrestClasses = "absolute top-0.5 left-1/4 right-1/4 h-2 rounded-t border-t-2 border-x-2 transition-colors";
        let cushionClasses = "absolute top-2.5 bottom-0 inset-x-1 rounded-lg border-2 transition-colors";
        let armLeftClasses = "absolute top-4 bottom-1.5 left-0 w-1 rounded-full transition-colors";
        let armRightClasses = "absolute top-4 bottom-1.5 right-0 w-1 rounded-full transition-colors";
        let textClasses = "text-[12px] font-bold tracking-wide transition-colors";

        if (isSelected) {
            containerClasses += " ring-2 ring-emerald-500 scale-105 shadow-md z-10 cursor-pointer";
            headrestClasses += " bg-emerald-100 border-emerald-500";
            cushionClasses += " bg-emerald-50/90 border-emerald-500";
            armLeftClasses += " bg-emerald-400";
            armRightClasses += " bg-emerald-400";
            textClasses += " text-emerald-700 font-extrabold";
        } else if (isHolding && !isUserHeld) {
            containerClasses += " cursor-not-allowed opacity-90";
            headrestClasses += " bg-rose-100 border-rose-400";
            cushionClasses += " bg-rose-50/90 border-rose-400";
            armLeftClasses += " bg-rose-300";
            armRightClasses += " bg-rose-300";
            textClasses += " text-rose-700 font-bold";
        } else if (isBooked) {
            containerClasses += " cursor-not-allowed opacity-60";
            headrestClasses += " bg-slate-200 border-slate-300";
            cushionClasses += " bg-slate-100 border-slate-200";
            armLeftClasses += " bg-slate-200";
            armRightClasses += " bg-slate-200";
            textClasses += " text-slate-400 font-medium";
        } else {
            // AVAILABLE
            containerClasses += " hover:-translate-y-0.5 hover:shadow-sm cursor-pointer";
            headrestClasses += " bg-slate-100 border-slate-300 group-hover:border-emerald-400";
            cushionClasses += " bg-white border-slate-300 group-hover:border-emerald-400 group-hover:bg-slate-50";
            armLeftClasses += " bg-slate-300 group-hover:bg-emerald-400";
            armRightClasses += " bg-slate-300 group-hover:bg-emerald-400";
            textClasses += " text-slate-700 group-hover:text-emerald-700";
        }

        return (
            <Tooltip
                key={seat.seatCode}
                title={
                    <div className="text-xs">
                        <p className="font-bold text-emerald-400">Ghế: {seat.seatCode}</p>
                        <p>Trạng thái: {statusText}</p>
                    </div>
                }
            >
                <div
                    onClick={() => canClick && handleSeatClick(seat)}
                    style={{
                        gridColumnStart: gridCol,
                        gridRowStart: gridRow,
                    }}
                    className={containerClasses}
                >
                    {/* Tựa đầu ghế */}
                    <div className={headrestClasses} />
                    {/* Thân đệm ghế */}
                    <div className={cushionClasses} />
                    {/* Tay vịn 2 bên */}
                    <div className={armLeftClasses} />
                    <div className={armRightClasses} />
                    {/* Mã số ghế */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-center pt-2">
                        <span className={textClasses}>
                            {seat.seatCode}
                        </span>
                    </div>
                </div>
            </Tooltip>
        );
    };

    const renderBus = (floorNum: number) => {
        const seatsInFloor = trip.seats?.filter((s: Seat) => (s.floor || 1) === floorNum) || [];
        const showCockpit = floorNum === 1;

        return (
            <div
                className="relative w-full max-w-[270px] bg-white border-[3px] border-slate-300 rounded-t-[36px] rounded-b-[20px] p-4 shadow-sm hover:shadow-md transition-shadow"
                style={{ minHeight: isSleeper ? "460px" : "380px" }}
            >
                {/* Gương chiếu hậu 2 bên */}
                <div className="absolute top-6 -left-2 w-2 h-5 bg-slate-700 rounded-l-md" />
                <div className="absolute top-6 -right-2 w-2 h-5 bg-slate-700 rounded-r-md" />

                {/* Kính chắn gió phía trước */}
                <div className="relative h-4 bg-gradient-to-b from-slate-700 to-slate-900 rounded-t-xl rounded-b-xs mb-4 flex items-center justify-center">
                    <div className="w-10 h-0.5 bg-slate-400 rounded-full" />
                </div>

                {/* Grid sơ đồ ghế / giường */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
                        gap: isSleeper ? "12px 8px" : "10px 6px",
                    }}
                >
                    {/* Hàng 1: Khoang lái & Cửa lên xuống (Chỉ tầng 1) */}
                    {showCockpit && (
                        <>
                            {/* Vị trí Tài xế */}
                            <div
                                style={{ gridColumnStart: 1, gridRowStart: 1 }}
                                className="flex items-center justify-center h-10"
                            >
                                <div className="flex flex-col items-center text-slate-500">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        style={{ transform: "rotate(-45deg)" }}
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="2" x2="12" y2="22" />
                                        <line x1="2" y1="12" x2="22" y2="12" />
                                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                                    </svg>
                                    <span className="text-[8px] font-bold mt-0.5 tracking-wider">TÀI XẾ</span>
                                </div>
                            </div>

                            {/* Khoảng trống táp-lô (chỉ vẽ nếu vị trí đó không có ghế A1) */}
                            {Array.from({ length: totalCols - 2 }).map((_, idx) => {
                                const col = idx + 2;
                                const hasSeatHere = seatsInFloor.some(
                                    (s: Seat) => s.colIndex === col && s.rowIndex === 0
                                );
                                if (hasSeatHere) return null;
                                return (
                                    <div
                                        key={`cockpit-blank-${idx}`}
                                        style={{ gridColumnStart: col, gridRowStart: 1 }}
                                    />
                                );
                            })}

                            {/* Cửa lên xe (chỉ vẽ nếu cột cuối chưa bị ghế A2 chiếm) */}
                            {!seatsInFloor.some((s: Seat) => s.colIndex === totalCols && s.rowIndex === 0) && (
                                <div
                                    style={{ gridColumnStart: totalCols, gridRowStart: 1 }}
                                    className="flex items-center justify-center h-10"
                                >
                                    <div className="border border-dashed border-emerald-400 bg-emerald-50/60 text-emerald-700 text-[8px] p-1 text-center font-bold rounded-md leading-tight">
                                        CỬA
                                        <br />
                                        LÊN
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Các vị trí ghế thực tế */}
                    {seatsInFloor.map((seat: Seat) => renderSeatItem(seat, showCockpit))}
                </div>

                {/* Đuôi xe */}
                <div className="mt-5 pt-3 border-t border-dashed border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-medium px-1">
                    <span>Đuôi xe</span>
                    {isSleeper && <span>WC / Lối thoát</span>}
                    <span>Hàng sau</span>
                </div>
            </div>
        );
    };

    return (
        <ClientLayout>
            <div style={{ background: "#f5f7fa", minHeight: "100vh", padding: "30px 0" }}>
                <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px" }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
                        Quay lại danh sách chuyến
                    </Button>

                    <Row gutter={[24, 24]}>
                        {/* Cột trái: Sơ đồ ghế nâng cấp CSS Grid */}
                        <Col span={24} lg={15}>
                            <Card title={`Chọn vị trí ${isSleeper ? "giường nằm" : "ghế ngồi"}`}>
                                
                                {/* Mô tả chú thích màu sắc trạng thái ghế */}
                                <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 py-2 px-3 mb-4 text-xs text-gray-600 bg-white border border-gray-100 rounded-lg shadow-2xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded border-2 border-slate-300 bg-white flex items-center justify-center text-[9px] font-bold text-slate-700">
                                            A1
                                        </div>
                                        <span>{isSleeper ? "Giường trống" : "Ghế trống"}</span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center text-[9px] font-bold text-emerald-700">
                                            ✓
                                        </div>
                                        <span>Đang chọn</span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded border-2 border-rose-400 bg-rose-50 flex items-center justify-center text-[9px] font-bold text-rose-600">
                                            ⌛
                                        </div>
                                        <span>Đang giữ chỗ</span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded border-2 border-slate-200 bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-400">
                                            ✕
                                        </div>
                                        <span>Đã bán</span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded border border-dashed border-emerald-400 bg-emerald-50/60 flex items-center justify-center text-[7px] font-bold text-emerald-700">
                                            CỬA
                                        </div>
                                        <span>Cửa lên</span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-[9px]">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="2" x2="12" y2="22" />
                                                <line x1="2" y1="12" x2="22" y2="12" />
                                            </svg>
                                        </div>
                                        <span>Khoang tài xế</span>
                                    </div>
                                </div>

                                {/* Bộ chuyển đổi tầng cho xe giường nằm nếu muốn xem riêng */}
                                {isSleeper && (
                                    <div className="flex justify-center mb-4">
                                        <Segmented
                                            options={[
                                                { label: "Cả 2 tầng (Song song)", value: "all" },
                                                { label: "Tầng 1 (Tầng dưới - Dãy A)", value: "1" },
                                                { label: "Tầng 2 (Tầng trên - Dãy B)", value: "2" },
                                            ]}
                                            value={viewFloorTab}
                                            onChange={(val) => setViewFloorTab(val as string)}
                                            className="bg-slate-100 p-1 font-medium text-xs"
                                        />
                                    </div>
                                )}

                                <div className="pt-2">
                                    {isSleeper ? (
                                        <div className="flex flex-col md:flex-row justify-center items-start gap-8">
                                            {(viewFloorTab === "all" || viewFloorTab === "1") && (
                                                <div className="flex-1 w-full flex flex-col items-center">
                                                    <div className="mb-2 text-center">
                                                        <Tag color="green" className="font-semibold px-3 py-0.5 text-xs rounded-full">
                                                            TẦNG 1 (TẦNG DƯỚI) ({trip.seats?.filter((s: Seat) => (s.floor || 1) === 1).length || 0} giường)
                                                        </Tag>
                                                    </div>
                                                    {renderBus(1)}
                                                </div>
                                            )}
                                            {(viewFloorTab === "all" || viewFloorTab === "2") && (
                                                <div className="flex-1 w-full flex flex-col items-center">
                                                    <div className="mb-2 text-center">
                                                        <Tag color="green" className="font-semibold px-3 py-0.5 text-xs rounded-full">
                                                            TẦNG 2 (TẦNG TRÊN) ({trip.seats?.filter((s: Seat) => (s.floor || 1) === 2).length || 0} giường)
                                                        </Tag>
                                                    </div>
                                                    {renderBus(2)}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="mb-2 text-center">
                                                <Tag color="green" className="font-semibold px-3 py-0.5 text-xs rounded-full">
                                                    SƠ ĐỒ BỐ TRÍ ({trip.seats?.length || 0} ghế)
                                                </Tag>
                                            </div>
                                            {renderBus(1)}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Col>

                        {/* Cột phải: Tính tiền */}
                        <Col span={24} lg={9}>
                            <Card title="Thông tin đặt vé">
                                <Space direction="vertical" size="middle" style={{ display: "flex", marginBottom: 24 }}>
                                    <div>
                                        <Text type="secondary">Tên xe:</Text>
                                        <Title level={5} style={{ margin: 0 }}>{trip.bus?.name || "Xe NETBUS Luxury"}</Title>
                                    </div>
                                    <div>
                                        <Text type="secondary">Hành trình:</Text>
                                        <Text strong style={{ display: "block", fontSize: "15px" }}>
                                            {trip.journey?.diemDi} → {trip.journey?.diemDen}
                                        </Text>
                                    </div>
                                    <div>
                                        <Text type="secondary">Đơn giá vé:</Text>
                                        <Text strong style={{ display: "block", fontSize: "15px", color: "#52c41a" }}>
                                            {getSingleTicketPrice().toLocaleString("vi-VN")}đ / vé
                                        </Text>
                                    </div>
                                    <div>
                                        <Text type="secondary">{isSleeper ? "Giường chọn:" : "Ghế chọn:"}</Text>
                                        <Text strong style={{ display: "block", fontSize: 16, color: "#1890ff" }}>
                                            {chosenSeatCodes.join(", ") || "Chưa chọn"}
                                        </Text>
                                    </div>
                                </Space>

                                <Flex justify="space-between" align="center" style={{ marginBottom: 24, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
                                    <Text strong>Tổng tiền:</Text>
                                    <Title level={3} style={{ fontSize: 22, color: "#ff4d4f", fontWeight: 800, margin: 0 }}>
                                        {calculatedTotalAmount.toLocaleString("vi-VN")}đ
                                    </Title>
                                </Flex>

                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    icon={<CheckCircleOutlined />}
                                    loading={bookingLoading}
                                    disabled={chosenSeatCodes.length === 0}
                                    style={{
                                        background: chosenSeatCodes.length > 0 ? "#52c41a" : "#f5f5f5",
                                        borderColor: chosenSeatCodes.length > 0 ? "#52c41a" : "#d9d9d9",
                                        height: 48,
                                        borderRadius: 6,
                                        fontWeight: 600
                                    }}
                                    onClick={handleConfirmBooking}
                                >
                                    Xác nhận đặt vé
                                </Button>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </ClientLayout>
    );
}