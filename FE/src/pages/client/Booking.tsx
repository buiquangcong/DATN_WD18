import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Row, Col, Button, Space, Typography, message, Spin, Alert, Flex } from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { ClientLayout } from "./layout";

const { Title, Text } = Typography;

// Định nghĩa Interface dữ liệu giường/ghế
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
    fareRule?: FareRule; // 🌟 Thêm fareRule từ Backend để đồng bộ tính giá vé
    bus: {
        name: string;
        type: string;
        licensePlates: string;
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
                    if (response.data.data) {
                        setTrip(response.data.data);
                    } else {
                        setTrip(response.data as DetailedTrip);
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

    // 🌟 HÀM TÍNH ĐƠN GIÁ VÉ THỰC TẾ DỰA TRÊN NGÀY ĐI (ĐỒNG BỘ VỚI DANH SÁCH CHUYẾN)
    const getSingleTicketPrice = (): number => {
        if (!trip) return 0;
        if (!trip.departureTime) return trip.journey?.price || 0;

        const departureDate = new Date(trip.departureTime);

        if (trip.fareRule) {
            // Thứ 7 (6) hoặc Chủ Nhật (0) áp dụng giá cuối tuần
            if (departureDate.getDay() === 0 || departureDate.getDay() === 6) {
                return trip.fareRule.weekendPrice;
            } else {
                return trip.fareRule.weekdayPrice;
            }
        }
        return trip.journey?.price || 0;
    };

    // Tính toán tổng số tiền dựa trên đơn giá chuẩn và số lượng ghế chọn
    const calculatedTotalAmount = getSingleTicketPrice() * chosenSeatCodes.length;

    const handleConfirmBooking = async (): Promise<void> => {
        if (chosenSeatCodes.length === 0) {
            message.warning("Vui lòng chọn ít nhất một giường trước khi tiếp tục!");
            return;
        }

        const userString = localStorage.getItem("user");
        const userObj = userString ? JSON.parse(userString) : null;

        if (!userObj || !userObj._id) {
            message.error("Vui lòng đăng nhập tài khoản trước khi thực hiện đặt vé!");
            navigate("/login"); 
            return;
        }

        setBookingLoading(true);

        try {
            // --- BƯỚC 1: GỬI THÔNG TIN LÊN ĐỂ TẠO ĐƠN BOOKING & GIỮ GHẾ TẠM THỜI ---
            const bookingBody = {
                user: userObj._id,      
                trip: tripId,            
                seats: chosenSeatCodes
            };

            console.log("Bước 1: Gọi API tạo đơn đặt vé:", bookingBody);
            const bookingResponse = await axios.post("http://localhost:3000/api/booking/add", bookingBody);

            const createdBookingId = bookingResponse.data?.data?._id;
            // Lấy mã orderCode từ phản hồi của API Booking (nếu có trả về kèm)
            const serverOrderCode = bookingResponse.data?.data?.orderCode;

            if (!createdBookingId) {
                throw new Error("Không nhận được mã đơn hàng từ hệ thống!");
            }

            // --- BƯỚC 2: DÙNG BOOKING ID VỪA TẠO ĐỂ LẤY LINK QR THANH TOÁN PAYOS ---
            console.log("Bước 2: Gọi API lấy link QR PayOS cho đơn hàng:", createdBookingId);
            const paymentResponse = await axios.post("http://localhost:3000/api/payment/create-link", {
                bookingId: createdBookingId
            });

            // --- BƯỚC 3: CHUYỂN HƯỚNG SANG CỔNG THANH TOÁN & ĐỒNG BỘ DỮ LIỆU SANG VÉ CHUYỂN TIẾP ---
            if (paymentResponse.data && paymentResponse.data.checkoutUrl) {
                message.success("Đặt vé thành công! Đang chuyển hướng đến cổng thanh toán trực tuyến...");
                
                // Trích xuất mã hiển thị hóa đơn (Lấy từ PayOS hoặc Backend Booking, hoặc cắt từ đuôi ID nếu trống)
                const myOrderCode = paymentResponse.data?.orderCode || serverOrderCode || createdBookingId.slice(-6).toUpperCase();

                const ticketStorageData = {
                    ticketCode: `NB-${myOrderCode}`,
                    customerName: userObj?.name || "Hành khách NETBUS",
                    busName: trip?.bus?.name || "Xe NETBUS Luxury",
                    journey: `${trip?.journey?.diemDi || "Điểm đi"} → ${trip?.journey?.diemDen || "Điểm đến"}`,
                    seats: chosenSeatCodes,
                    totalPrice: calculatedTotalAmount, // Tổng tiền thật tính dựa trên FareRule
                    departureTime: trip?.departureTime 
                        ? new Date(trip.departureTime).toLocaleString("vi-VN", {
                            dateStyle: "short",
                            timeStyle: "short"
                          })
                        : "Đang cập nhật..."
                };

                // Lưu gói dữ liệu gọn gàng vào localStorage để TicketSuccessPage bốc lên trực tiếp
                localStorage.setItem("latest_ticket_success", JSON.stringify(ticketStorageData));

                // Thực hiện chuyển hướng người dùng sang trang thanh toán của PayOS
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
        if (seat.status !== "AVAILABLE") return;
        if (chosenSeatCodes.includes(seat.seatCode)) {
            setChosenSeatCodes(chosenSeatCodes.filter(code => code !== seat.seatCode));
        } else {
            setChosenSeatCodes([...chosenSeatCodes, seat.seatCode]);
        }
    };

    const getSeatStyle = (seat: Seat): React.CSSProperties => {
        if (seat.status === "BOOKED") return { background: "#e0e0e0", color: "#9e9e9e", cursor: "not-allowed", border: "1px solid #d5d5d5" };
        if (seat.status === "HOLDING") return { background: "#ffeaf2", color: "#ff4d4f", cursor: "not-allowed", border: "1px solid #ffccc7" };
        if (chosenSeatCodes.includes(seat.seatCode)) return { background: "#e6f7ff", color: "#1890ff", border: "2px solid #1890ff", fontWeight: "bold" };
        return { background: "#ffffff", color: "#262626", border: "1px solid #d9d9d9" };
    };

    if (loading) {
        return (
            <ClientLayout>
                <Flex align="center" justify="center" style={{ padding: "100px 0", background: "#f5f7fa", minHeight: "100vh" }}>
                    <Spin size="large" tip="Đang tải sơ đồ giường nằm..." />
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

    return (
        <ClientLayout>
            <div style={{ background: "#f5f7fa", minHeight: "100vh", padding: "30px 0" }}>
                <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px" }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
                        Quay lại danh sách chuyến
                    </Button>

                    <Row gutter={[24, 24]}>
                        {/* Cột trái: Sơ đồ ghế */}
                        <Col span={24} lg={15}>
                            <Card title="Chọn vị trí giường nằm">
                                <Row gutter={[24, 24]} justify="center">
                                    <Col span={24} sm={12}>
                                        <div style={{ textAlign: "center", marginBottom: 12, fontWeight: 600, color: "#1890ff" }}>TẦNG DƯỚI (TẦNG 1)</div>
                                        <div style={{ background: "#fafafa", padding: 16, borderRadius: 8, border: "1px solid #f0f0f0" }}>
                                            <Row gutter={[12, 14]}>
                                                {trip.seats?.filter((s: Seat) => s.floor === 1).map((seat: Seat) => (
                                                    <Col span={8} key={seat.seatCode}>
                                                        <button
                                                            style={{ width: "100%", height: 48, borderRadius: 6, transition: "all 0.2s", fontSize: 12, ...getSeatStyle(seat) }}
                                                            disabled={seat.status !== "AVAILABLE"}
                                                            onClick={() => handleSeatClick(seat)}
                                                        >
                                                            {seat.seatCode}
                                                        </button>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    </Col>

                                    {/* Tầng 2 */}
                                    {trip.seats?.filter((s: Seat) => s.floor === 2).length > 0 && (
                                        <Col span={24} sm={12}>
                                            <div style={{ textAlign: "center", marginBottom: 12, fontWeight: 600, color: "#722ed1" }}>TẦNG TRÊN (TẦNG 2)</div>
                                            <div style={{ background: "#fafafa", padding: 16, borderRadius: 8, border: "1px solid #f0f0f0" }}>
                                                <Row gutter={[12, 14]}>
                                                    {trip.seats?.filter((s: Seat) => s.floor === 2).map((seat: Seat) => (
                                                        <Col span={8} key={seat.seatCode}>
                                                            <button
                                                                style={{ width: "100%", height: 48, borderRadius: 6, transition: "all 0.2s", fontSize: 12, ...getSeatStyle(seat) }}
                                                                disabled={seat.status !== "AVAILABLE"}
                                                                onClick={() => handleSeatClick(seat)}
                                                            >
                                                                {seat.seatCode}
                                                            </button>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </div>
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
                                        <Text type="secondary">Giường chọn:</Text>
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