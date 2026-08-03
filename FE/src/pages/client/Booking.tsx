import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Row, Col, Button, Space, Typography, message, Spin, Alert, Flex } from "antd";
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
        if (capacity === 16) return 4;
        if (capacity === 29) return 5;
        if (capacity === 45) return 5;
        if (type === "Sleeper" || capacity === 38 || capacity === 34) return 5; // Xe giường nằm có 3 dãy giường + 2 lối đi
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
                    customerName: userObj?.name || "Hành khách NETBUS",
                    busName: trip?.bus?.name || "Xe NETBUS Luxury",
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

    const LegendItem = ({ label, status, isSleeper }: { label: string; status: "AVAILABLE" | "SELECTED" | "HOLDING" | "BOOKED"; isSleeper: boolean }) => {
        let seatColor = "#ffffff";
        let borderColor = "#cbd5e1";
        let pillowColor = "#f1f5f9";
        let armColor = "#cbd5e1";
        
        if (status === "SELECTED") {
            seatColor = "#eff6ff";
            borderColor = "#2563eb";
            pillowColor = "#dbeafe";
            armColor = "#3b82f6";
        } else if (status === "HOLDING") {
            seatColor = "#fff1f2";
            borderColor = "#f43f5e";
            pillowColor = "#ffe4e6";
            armColor = "#fda4af";
        } else if (status === "BOOKED") {
            seatColor = "#f1f5f9";
            borderColor = "#cbd5e1";
            pillowColor = "#e2e8f0";
            armColor = "#e2e8f0";
        }
        
        return (
            <Space size="small" style={{ margin: "4px 12px" }}>
                <div style={{ position: "relative", width: 22, height: isSleeper ? 26 : 22 }}>
                    {isSleeper ? (
                        <>
                            <div style={{ position: "absolute", inset: 0, backgroundColor: seatColor, border: `1.5px solid ${borderColor}`, borderRadius: 4 }} />
                            <div style={{ position: "absolute", top: 2, left: 3, right: 3, height: 5, backgroundColor: pillowColor, border: `1px solid ${borderColor}`, borderRadius: 1.5 }} />
                            <div style={{ position: "absolute", bottom: 2, left: 3, right: 3, height: 8, backgroundColor: status === "SELECTED" ? "#bfdbfe" : status === "HOLDING" ? "#fecdd3" : status === "BOOKED" ? "#cbd5e1" : "#fafafa", borderTop: `1px dashed ${borderColor}`, borderRadius: "0 0 2px 2px" }} />
                        </>
                    ) : (
                        <>
                            <div style={{ position: "absolute", top: 3, bottom: 0, left: 2, right: 2, backgroundColor: seatColor, border: `1.5px solid ${borderColor}`, borderRadius: "3px 3px 4px 4px" }} />
                            <div style={{ position: "absolute", top: 0, left: "25%", right: "25%", height: 3, backgroundColor: seatColor, border: `1.5px solid ${borderColor}`, borderBottom: "none", borderRadius: "2px 2px 0 0" }} />
                            <div style={{ position: "absolute", top: 5, bottom: 2, left: 0, width: 2, backgroundColor: armColor, borderRadius: 0.5 }} />
                            <div style={{ position: "absolute", top: 5, bottom: 2, right: 0, width: 2, backgroundColor: armColor, borderRadius: 0.5 }} />
                        </>
                    )}
                </div>
                <Text style={{ fontSize: "13px", fontWeight: 500, color: "#475569" }}>{label}</Text>
            </Space>
        );
    };

    const renderBus = (floorNum: number) => {
        const isSleeperBus = trip.bus?.type === "Sleeper";
        const seatsInFloor = trip.seats?.filter((s: Seat) => s.floor === floorNum) || [];
        const showCockpit = floorNum === 1;

        const userString = localStorage.getItem("user");
        const userObj = userString ? JSON.parse(userString) : null;

        return (
            <div className="bus-shell" style={{
                position: "relative",
                background: "#f8fafc",
                border: "4px solid #cbd5e1",
                borderRadius: "32px 32px 16px 16px",
                padding: "24px 16px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
                marginTop: 10,
            }}>
                <style>{`
                    .seat-btn:hover:not(:disabled) .seat-base {
                        transform: translateY(-1.5px);
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
                    }
                    .sleeper-btn:hover:not(:disabled) .sleeper-base {
                        transform: translateY(-1.5px);
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
                    }
                `}</style>

                {/* Windshield */}
                <div style={{
                    height: 16,
                    background: "linear-gradient(to bottom, #475569, #1e293b)",
                    borderRadius: "12px 12px 2px 2px",
                    marginBottom: 16,
                    position: "relative",
                }}>
                    <div style={{
                        position: "absolute",
                        top: 4,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 40,
                        height: 2,
                        backgroundColor: "#94a3b8",
                        borderRadius: 1,
                    }} />
                </div>

                {/* Side Mirrors */}
                <div className="mirror-left" style={{ position: "absolute", top: 24, left: -6, width: 6, height: 18, background: "#334155", borderRadius: "3px 0 0 3px" }} />
                <div className="mirror-right" style={{ position: "absolute", top: 24, right: -6, width: 6, height: 18, background: "#334155", borderRadius: "0 3px 3px 0" }} />

                {/* Grid container */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
                    gap: "12px 10px",
                }}>
                    {/* Row 1: Cockpit Area (only for Floor 1) */}
                    {showCockpit && (
                        <>
                            {/* Driver steering wheel */}
                            <div style={{
                                gridColumnStart: 1,
                                gridRowStart: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: 44,
                            }}>
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    color: "#64748b",
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(-45deg)" }}>
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="2" x2="12" y2="22" />
                                        <line x1="2" y1="12" x2="22" y2="12" />
                                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                                    </svg>
                                    <span style={{ fontSize: "8px", marginTop: 2, fontWeight: 700, letterSpacing: 0.5 }}>LÁI XE</span>
                                </div>
                            </div>

                            {/* Cockpit Empty space / console */}
                            {Array.from({ length: totalCols - 2 }).map((_, idx) => (
                                <div key={`empty-cockpit-${idx}`} style={{ gridColumnStart: idx + 2, gridRowStart: 1 }} />
                            ))}

                            {/* Entrance Door */}
                            <div style={{
                                gridColumnStart: totalCols,
                                gridRowStart: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: 44,
                            }}>
                                <div style={{
                                    border: "1.5px dashed #cbd5e1",
                                    borderRadius: 6,
                                    padding: "4px 8px",
                                    fontSize: "8px",
                                    color: "#64748b",
                                    fontWeight: 700,
                                    textAlign: "center",
                                    lineHeight: "1.2",
                                    backgroundColor: "#f1f5f9",
                                }}>
                                    CỬA<br />LÊN
                                </div>
                            </div>
                        </>
                    )}

                    {/* Seats */}
                    {seatsInFloor.map((seat: Seat) => {
                        const isSelected = chosenSeatCodes.includes(seat.seatCode);
                        const isAvailable = seat.status === "AVAILABLE";
                        const isHolding = seat.status === "HOLDING";
                        const isBooked = seat.status === "BOOKED";
                        const isUserHeld = isHolding && seat.heldBy && 
                            (typeof seat.heldBy === "object" ? String((seat.heldBy as any)._id) : String(seat.heldBy)) === String(userObj?._id);

                        const canClick = isAvailable || isUserHeld;
                        const gridRow = showCockpit ? seat.rowIndex + 1 : seat.rowIndex;
                        const gridCol = getMappedColIndex(seat);

                        if (isSleeperBus) {
                            let baseBg = "#ffffff";
                            let borderCol = "#cbd5e1";
                            let txtCol = "#334155";
                            let pillowBg = "#f1f5f9";
                            let blanketBg = "#f8fafc";
                            let shd = "0 2px 4px rgba(0, 0, 0, 0.04)";

                            if (isSelected) {
                                baseBg = "#eff6ff";
                                borderCol = "#2563eb";
                                txtCol = "#1d4ed8";
                                pillowBg = "#dbeafe";
                                blanketBg = "#bfdbfe";
                                shd = "0 4px 12px rgba(37, 99, 235, 0.15)";
                            } else if (isHolding && !isUserHeld) {
                                baseBg = "#fff1f2";
                                borderCol = "#f43f5e";
                                txtCol = "#be123c";
                                pillowBg = "#ffe4e6";
                                blanketBg = "#fecdd3";
                            } else if (isBooked) {
                                baseBg = "#f1f5f9";
                                borderCol = "#e2e8f0";
                                txtCol = "#94a3b8";
                                pillowBg = "#cbd5e1";
                                blanketBg = "#e2e8f0";
                                shd = "none";
                            }

                            return (
                                <button
                                    key={seat.seatCode}
                                    disabled={!canClick}
                                    onClick={() => handleSeatClick(seat)}
                                    style={{
                                        gridColumnStart: gridCol,
                                        gridRowStart: gridRow,
                                        position: "relative",
                                        height: 62,
                                        width: "100%",
                                        background: "transparent",
                                        border: "none",
                                        padding: 0,
                                        cursor: canClick ? "pointer" : "not-allowed",
                                        outline: "none",
                                        transition: "all 0.2s",
                                    }}
                                    className="sleeper-btn"
                                >
                                    <div style={{
                                        position: "relative",
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        color: txtCol,
                                    }}>
                                        {/* Bed Body */}
                                        <div className="sleeper-base" style={{
                                            position: "absolute",
                                            top: 2,
                                            bottom: 2,
                                            left: 2,
                                            right: 2,
                                            backgroundColor: baseBg,
                                            border: `2px solid ${borderCol}`,
                                            borderRadius: 8,
                                            boxShadow: shd,
                                            transition: "all 0.2s",
                                        }} />
                                        {/* Pillow */}
                                        <div style={{
                                            position: "absolute",
                                            top: 6,
                                            left: 6,
                                            right: 6,
                                            height: 10,
                                            backgroundColor: pillowBg,
                                            border: `1px solid ${borderCol}`,
                                            borderRadius: 3,
                                            zIndex: 1,
                                            transition: "all 0.2s",
                                        }} />
                                        {/* Blanket */}
                                        <div style={{
                                            position: "absolute",
                                            bottom: 6,
                                            left: 6,
                                            right: 6,
                                            height: 16,
                                            backgroundColor: blanketBg,
                                            borderTop: `1px dashed ${borderCol}`,
                                            borderRadius: "0 0 4px 4px",
                                            opacity: 0.8,
                                        }} />
                                        {/* Seat Code Text */}
                                        <span style={{
                                            position: "relative",
                                            zIndex: 2,
                                            fontSize: "11px",
                                            fontWeight: isSelected ? 700 : 500,
                                            marginTop: "22px",
                                        }}>
                                            {seat.seatCode}
                                        </span>
                                    </div>
                                </button>
                            );
                        } else {
                            let baseBg = "#ffffff";
                            let borderCol = "#cbd5e1";
                            let txtCol = "#334155";
                            let armBg = "#cbd5e1";
                            let shd = "0 2px 4px rgba(0, 0, 0, 0.04)";

                            if (isSelected) {
                                baseBg = "#eff6ff";
                                borderCol = "#2563eb";
                                txtCol = "#1d4ed8";
                                armBg = "#3b82f6";
                                shd = "0 4px 12px rgba(37, 99, 235, 0.15)";
                            } else if (isHolding && !isUserHeld) {
                                baseBg = "#fff1f2";
                                borderCol = "#f43f5e";
                                txtCol = "#be123c";
                                armBg = "#fda4af";
                            } else if (isBooked) {
                                baseBg = "#f1f5f9";
                                borderCol = "#e2e8f0";
                                txtCol = "#94a3b8";
                                armBg = "#cbd5e1";
                                shd = "none";
                            }

                            return (
                                <button
                                    key={seat.seatCode}
                                    disabled={!canClick}
                                    onClick={() => handleSeatClick(seat)}
                                    style={{
                                        gridColumnStart: gridCol,
                                        gridRowStart: gridRow,
                                        position: "relative",
                                        height: 50,
                                        width: "100%",
                                        background: "transparent",
                                        border: "none",
                                        padding: 0,
                                        cursor: canClick ? "pointer" : "not-allowed",
                                        outline: "none",
                                        transition: "all 0.2s",
                                    }}
                                    className="seat-btn"
                                >
                                    <div style={{
                                        position: "relative",
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        color: txtCol,
                                    }}>
                                        {/* Cushion Base */}
                                        <div className="seat-base" style={{
                                            position: "absolute",
                                            top: 8,
                                            bottom: 2,
                                            left: 4,
                                            right: 4,
                                            backgroundColor: baseBg,
                                            border: `2px solid ${borderCol}`,
                                            borderRadius: "6px 6px 8px 8px",
                                            boxShadow: shd,
                                            transition: "all 0.2s",
                                        }} />
                                        {/* Headrest */}
                                        <div style={{
                                            position: "absolute",
                                            top: 2,
                                            width: "50%",
                                            height: 8,
                                            backgroundColor: baseBg,
                                            border: `2px solid ${borderCol}`,
                                            borderBottom: "none",
                                            borderRadius: "3px 3px 0 0",
                                            zIndex: 1,
                                            transition: "all 0.2s",
                                        }} />
                                        {/* Armrests */}
                                        <div style={{
                                            position: "absolute",
                                            top: 14,
                                            bottom: 6,
                                            left: 1,
                                            width: 4,
                                            backgroundColor: armBg,
                                            borderRadius: "2px",
                                            opacity: 0.8,
                                        }} />
                                        <div style={{
                                            position: "absolute",
                                            top: 14,
                                            bottom: 6,
                                            right: 1,
                                            width: 4,
                                            backgroundColor: armBg,
                                            borderRadius: "2px",
                                            opacity: 0.8,
                                        }} />
                                        {/* Seat Code Text */}
                                        <span style={{
                                            position: "relative",
                                            zIndex: 2,
                                            fontSize: "11px",
                                            fontWeight: isSelected ? 700 : 500,
                                            marginTop: "6px",
                                        }}>
                                            {seat.seatCode}
                                        </span>
                                    </div>
                                </button>
                            );
                        }
                    })}

                    {/* WC Box (only for 34 capacity) */}
                    {trip.bus?.capacity === 34 && (
                        <div style={{
                            gridColumnStart: 5,
                            gridRowStart: showCockpit ? 7 : 6,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#cbd5e1",
                            border: "2px solid #94a3b8",
                            borderRadius: 8,
                            color: "#475569",
                            fontSize: "12px",
                            fontWeight: 700,
                            height: 62,
                        }}>
                            WC
                        </div>
                    )}
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
                                <Flex gap="small" justify="center" style={{ marginBottom: 24, flexWrap: "wrap", borderBottom: "1px solid #f0f0f0", paddingBottom: 16 }}>
                                    <LegendItem label="Trống" status="AVAILABLE" isSleeper={isSleeper} />
                                    <LegendItem label="Đang chọn" status="SELECTED" isSleeper={isSleeper} />
                                    <LegendItem label="Đang giữ chỗ" status="HOLDING" isSleeper={isSleeper} />
                                    <LegendItem label="Đã bán" status="BOOKED" isSleeper={isSleeper} />
                                </Flex>

                                {/* Responsive floor switcher for Sleeper bus */}
                                {isSleeper && (
                                    <Flex justify="center" style={{ marginBottom: 20 }} className="md:hidden">
                                        <div style={{
                                            display: "inline-flex",
                                            padding: 4,
                                            background: "#f1f5f9",
                                            borderRadius: 10,
                                            border: "1px solid #e2e8f0"
                                        }}>
                                            <button
                                                onClick={() => setActiveFloor(1)}
                                                style={{
                                                    padding: "6px 16px",
                                                    fontSize: "13px",
                                                    fontWeight: 600,
                                                    borderRadius: 8,
                                                    border: "none",
                                                    cursor: "pointer",
                                                    background: activeFloor === 1 ? "#ffffff" : "transparent",
                                                    color: activeFloor === 1 ? "#2563eb" : "#64748b",
                                                    boxShadow: activeFloor === 1 ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                                                    transition: "all 0.2s"
                                                }}
                                            >
                                                Tầng dưới (Tầng 1)
                                            </button>
                                            <button
                                                onClick={() => setActiveFloor(2)}
                                                style={{
                                                    padding: "6px 16px",
                                                    fontSize: "13px",
                                                    fontWeight: 600,
                                                    borderRadius: 8,
                                                    border: "none",
                                                    cursor: "pointer",
                                                    background: activeFloor === 2 ? "#ffffff" : "transparent",
                                                    color: activeFloor === 2 ? "#2563eb" : "#64748b",
                                                    boxShadow: activeFloor === 2 ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                                                    transition: "all 0.2s"
                                                }}
                                            >
                                                Tầng trên (Tầng 2)
                                            </button>
                                        </div>
                                    </Flex>
                                )}

                                <Row gutter={[24, 24]} justify="center">
                                    {isSleeper ? (
                                        <>
                                            {/* TẦNG DƯỚI / TẦNG 1 */}
                                            <Col span={24} md={12} className={activeFloor === 1 ? "block" : "hidden md:block"}>
                                                <div style={{ textAlign: "center", marginBottom: 12, fontWeight: 700, color: "#1e3a8a", fontSize: "14px" }}>
                                                    TẦNG DƯỚI (TẦNG 1)
                                                </div>
                                                {renderBus(1)}
                                            </Col>

                                            {/* TẦNG TRÊN / TẦNG 2 */}
                                            <Col span={24} md={12} className={activeFloor === 2 ? "block" : "hidden md:block"}>
                                                <div style={{ textAlign: "center", marginBottom: 12, fontWeight: 700, color: "#1e3a8a", fontSize: "14px" }}>
                                                    TẦNG TRÊN (TẦNG 2)
                                                </div>
                                                {renderBus(2)}
                                            </Col>
                                        </>
                                    ) : (
                                        <Col span={24} sm={16} md={14}>
                                            <div style={{ textAlign: "center", marginBottom: 12, fontWeight: 700, color: "#1e3a8a", fontSize: "14px" }}>
                                                SƠ ĐỒ VỊ TRÍ GHẾ
                                            </div>
                                            {renderBus(1)}
                                        </Col>
                                    )}
                                </Row>
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