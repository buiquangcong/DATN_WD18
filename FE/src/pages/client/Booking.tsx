import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Row, Col, Button, Space, Typography, message, Spin, Alert, Flex } from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { ClientLayout } from "./layout";

const { Title, Text, Paragraph } = Typography;

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

interface DetailedTrip {
    _id: string;
    departureTime: string;
    journey: {
        diemDi: string;
        diemDen: string;
        price: number;
    };
    bus: {
        name: string;
        type: string;
        licensePlates: string;
    };
    seats: Seat[];
}

export default function BookingSeats(): React.ReactElement {
    // Lấy tham số :tripId từ URL hệ thống
    const { tripId } = useParams<{ tripId: string }>();
    const navigate = useNavigate();

    const [trip, setTrip] = useState<DetailedTrip | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [bookingLoading, setBookingLoading] = useState<boolean>(false); // State quản lý loading khi nhấn nút đặt vé
    const [chosenSeatCodes, setChosenSeatCodes] = useState<string[]>([]);

    useEffect(() => {
        const fetchTripDetails = async () => {
            if (!tripId) {
                message.error("Không tìm thấy mã chuyến xe trên URL!");
                setLoading(false);
                return;
            }

            try {
                // Gọi API lấy sơ đồ ghế từ Backend
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

const handleConfirmBooking = async (): Promise<void> => {
    if (chosenSeatCodes.length === 0) {
        message.warning("Vui lòng chọn ít nhất một giường trước khi tiếp tục!");
        return;
    }

    // 1. Trích xuất thông tin người dùng đang đăng nhập từ localStorage
    const userString = localStorage.getItem("user");
    const userObj = userString ? JSON.parse(userString) : null;

    if (!userObj || !userObj._id) {
        message.error("Vui lòng đăng nhập tài khoản trước khi thực hiện đặt vé!");
        navigate("/login"); 
        return;
    }

    setBookingLoading(true);

    try {
        // 2. Thiết lập Object Payload đồng bộ 100% với Backend yêu cầu
        const bookingBody = {
            user: userObj._id,       // ID người dùng thực tế
            trip: tripId,            // Khớp trường 'trip' chuẩn chỉnh
            seats: chosenSeatCodes,  // Mảng danh sách mã ghế lựa chọn
        };

        console.log("Gửi dữ liệu lên API đặt vé:", bookingBody);

        // 3. Tiến hành POST dữ liệu vào đúng link api/booking/add của bạn
        const response = await axios.post("http://localhost:3000/api/booking/add", bookingBody);

        if (response.data && trip) {
            // 🎲 TẠO MÃ VÉ NGẪU NHIÊN: NB-XXXXXX
            const randomTicketCode = `NB-${Math.floor(100000 + Math.random() * 900000)}`;

            message.success("Đặt vé thành công! Đang chuyển hướng hiển thị vé...");
            
            // 🌟 LẤY CHÍNH XÁC TỪ TRƯỜNG USERNAME (Nếu không có mới dự phòng chuỗi khác)
            const customerName = userObj.username || "Khách hàng NETBUS";

            // Điều hướng sang trang hiển thị vé thành công kèm theo dữ liệu qua state
            navigate("/khachhang/booking/success", {
                state: {
                    ticketCode: randomTicketCode,
                    customerName: customerName, // Truyền username qua đây
                    busName: trip.bus?.name || "Xe NETBUS Luxury",
                    journey: `${trip.journey?.diemDi} → ${trip.journey?.diemDen}`,
                    seats: chosenSeatCodes,
                    totalPrice: (trip.journey?.price || 0) * chosenSeatCodes.length,
                    departureTime: trip.departureTime
                }
            });
        }
    } catch (error: any) {
        console.error("Lỗi khi gọi API đặt vé:", error);
        const errorMsg = error.response?.data?.message || "Đặt vé thất bại, vui lòng thử lại!";
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
                        <Col xs={24} lg={15}>
                            <Card title="Chọn vị trí giường nằm">
                                <Row gutter={[24, 24]} justify="center">
                                    <Col xs={24} sm={12}>
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
                                        <Col xs={24} sm={12}>
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
                        <Col xs={24} lg={9}>
                            <Card title="Thông tin đặt vé">
                                <Space direction="vertical" size="middle" style={{ display: "flex", marginBottom: 24 }}>
                                    <div>
                                        <Text type="secondary">Tên xe:</Text>
                                        <Title level={5} style={{ margin: 0 }}>{trip.bus?.name || "Đang cập nhật..."}</Title>
                                    </div>
                                    <div>
                                        <Text type="secondary">Hành trình:</Text>
                                        <Text strong style={{ display: "block", fontSize: "15px" }}>
                                            {trip.journey?.diemDi} → {trip.journey?.diemDen}
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
                                    <Text style={{ fontSize: 20, color: "#ff4d4f", fontWeight: 800 }}>
                                        {((trip.journey?.price || 0) * chosenSeatCodes.length).toLocaleString("vi-VN")}đ
                                    </Text>
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