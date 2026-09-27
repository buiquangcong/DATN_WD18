import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { 
    Card, 
    Row, 
    Col, 
    Button, 
    Typography, 
    Progress, 
    Tag, 
    Space, 
    message, 
    Spin, 
    Flex, 
    Divider, 
    QRCode, 
    Tooltip, 
    Alert 
} from "antd";
import { 
    ClockCircleOutlined, 
    CopyOutlined, 
    CloseCircleOutlined, 
    CheckCircleOutlined, 
    ArrowLeftOutlined, 
    QrcodeOutlined,
    BankOutlined,
    SafetyCertificateOutlined
} from "@ant-design/icons";
import { ClientLayout } from "./layout";

const { Title, Text } = Typography;

interface PaymentData {
    checkoutUrl: string;
    orderCode: number | string;
    expiredAt?: number;
    qrCode?: string;
    accountNumber?: string;
    accountName?: string;
    bin?: string;
    amount?: number;
    description?: string;
    bookingId?: string;
    tripId?: string;
}

export default function PaymentCheckoutPage(): React.ReactElement {
    const { orderCode } = useParams<{ orderCode: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [timeLeft, setTimeLeft] = useState<number>(300); // 5 phút = 300 giây
    const isCancelledRef = useRef<boolean>(false);

    const tripId = searchParams.get("tripId") || paymentData?.tripId || "";

    // 1. Tải thông tin thanh toán khi vào trang
    useEffect(() => {
        const initData = () => {
            // Đọc dữ liệu đã cache khi tạo link ở trang trước
            const cachedPaymentStr = localStorage.getItem("pending_payment_data");
            if (cachedPaymentStr) {
                try {
                    const parsed = JSON.parse(cachedPaymentStr);
                    if (String(parsed.orderCode) === String(orderCode)) {
                        setPaymentData(parsed);
                        
                        // Tính toán thời gian còn lại nếu có expiredAt
                        if (parsed.expiredAt) {
                            const nowSec = Math.floor(Date.now() / 1000);
                            const remaining = parsed.expiredAt - nowSec;
                            setTimeLeft(remaining > 0 ? remaining : 0);
                        }
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("Lỗi đọc pending_payment_data:", e);
                }
            }

            // Nếu không có cache, truy vấn thông tin trạng thái từ Server
            if (orderCode) {
                axios.get(`http://localhost:3000/api/payment/status/${orderCode}`)
                    .then(res => {
                        if (res.data?.booking) {
                            const b = res.data.booking;
                            setPaymentData({
                                checkoutUrl: `https://pay.payos.vn/web/${orderCode}`,
                                orderCode: b.orderCode,
                                amount: b.totalPrice,
                                description: `Ghe-${b.seats.join("-")}`.slice(0, 25),
                                tripId: typeof b.trip === "object" ? b.trip?._id : b.trip,
                                bookingId: b._id
                            });
                        }
                    })
                    .catch(err => {
                        console.error("Lỗi lấy trạng thái đơn:", err);
                        message.error("Không tìm thấy thông tin đơn thanh toán!");
                    })
                    .finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        };

        initData();
    }, [orderCode]);

    // 2. Countdown timer đếm ngược 5 phút
    useEffect(() => {
        if (loading) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeoutExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [loading]);

    // 3. Polling kiểm tra trạng thái thanh toán thành công từ Webhook PayOS (mỗi 2.5 giây)
    useEffect(() => {
        if (loading || isCancelledRef.current || !orderCode) return;

        const checkStatusInterval = setInterval(async () => {
            try {
                const res = await axios.get(`http://localhost:3000/api/payment/status/${orderCode}`);
                if (res.data?.status === "Đã xác nhận") {
                    clearInterval(checkStatusInterval);
                    message.success("Thanh toán thành công! Đang chuyển đến vé điện tử...");
                    localStorage.removeItem("pending_payment_data");
                    setTimeout(() => {
                        navigate(`/khachhang/booking/success?orderCode=${orderCode}`);
                    }, 1000);
                } else if (res.data?.status === "Đã huỷ") {
                    clearInterval(checkStatusInterval);
                    handleCancelPayment(false);
                }
            } catch (err) {
                // Bỏ qua lỗi kết nối polling
            }
        }, 2500);

        return () => clearInterval(checkStatusInterval);
    }, [loading, orderCode, navigate]);

    // Lắng nghe postMessage từ PayOS Iframe (nếu nhúng iframe)
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.origin.includes("payos.vn")) {
                try {
                    const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
                    if (data?.type === "payment_response") {
                        if (data?.data?.status === "PAID") {
                            message.success("Thanh toán thành công qua PayOS!");
                            navigate(`/khachhang/booking/success?orderCode=${orderCode}`);
                        } else if (data?.data?.status === "CANCELLED") {
                            handleCancelPayment(false);
                        }
                    }
                } catch (err) {
                    // Ignore JSON parse error
                }
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [orderCode, navigate]);

    // Xử lý khi hết hạn 5 phút
    const handleTimeoutExpire = async () => {
        if (isCancelledRef.current) return;
        isCancelledRef.current = true;

        message.warning("Đã hết thời gian thanh toán (5 phút)! Đơn hàng đã bị hủy và ghế đã được giải phóng.");

        try {
            await axios.post("http://localhost:3000/api/payment/cancel", { orderCode });
        } catch (e) {
            console.error("Lỗi hủy đơn khi timeout:", e);
        }

        localStorage.removeItem("pending_payment_data");
        localStorage.removeItem("latest_ticket_success");

        navigate(`/khachhang/trip?status=cancelled&orderCode=${orderCode || ""}`);
    };

    // Xử lý khi người dùng chủ động bấm nút "Hủy thanh toán"
    const handleCancelPayment = async (manualClick = true) => {
        if (isCancelledRef.current) return;
        isCancelledRef.current = true;

        if (manualClick) {
            message.info("Đang hủy đơn và giải phóng vị trí ghế...");
        }

        try {
            await axios.post("http://localhost:3000/api/payment/cancel", { orderCode });
        } catch (e) {
            console.error("Lỗi khi hủy đơn:", e);
        }

        localStorage.removeItem("pending_payment_data");
        localStorage.removeItem("latest_ticket_success");

        navigate(`/khachhang/trip?status=cancelled&orderCode=${orderCode || ""}`);
    };

    // Sao chép nội dung vào Clipboard
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        message.success(`Đã sao chép ${label}!`);
    };

    const formatTimer = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    if (loading) {
        return (
            <ClientLayout>
                <Flex align="center" justify="center" style={{ minHeight: "80vh" }}>
                    <Spin size="large" tip="Đang chuẩn bị cổng thanh toán PayOS..." />
                </Flex>
            </ClientLayout>
        );
    }

    const progressPercent = Math.max(0, Math.min(100, Math.round((timeLeft / 300) * 100)));
    const accountNum = paymentData?.accountNumber || "VQRQAMIVL8064";
    const accountName = paymentData?.accountName || "BUI QUANG CONG";
    const bankName = "Ngân hàng TMCP Quân đội (MB Bank)";
    const transferAmount = paymentData?.amount ? Number(paymentData.amount).toLocaleString("vi-VN") : "0";
    const transferContent = paymentData?.description || `Ghe-${orderCode}`;

    return (
        <ClientLayout>
            <div style={{ background: "#f4f6f8", minHeight: "100vh", padding: "30px 15px 60px" }}>
                <div style={{ maxWidth: 900, margin: "0 auto" }}>
                    
                    {/* Header: Thanh đếm ngược 5 phút cực kỳ nổi bật */}
                    <Card 
                        style={{ 
                            borderRadius: 20, 
                            marginBottom: 20, 
                            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                            border: timeLeft <= 60 ? "2px solid #ff4d4f" : "1px solid #e2e8f0",
                            background: "#fff"
                        }}
                        bodyStyle={{ padding: "24px 28px" }}
                    >
                        <Row gutter={[16, 16]} align="middle" justify="space-between">
                            <Col xs={24} md={14}>
                                <Flex align="center" gap="middle">
                                    <div 
                                        style={{ 
                                            width: 56, 
                                            height: 56, 
                                            borderRadius: 16, 
                                            background: timeLeft <= 60 ? "#fff1f0" : "#fffbe6",
                                            display: "flex", 
                                            alignItems: "center", 
                                            justifyContent: "center",
                                            border: timeLeft <= 60 ? "1px solid #ffa39e" : "1px solid #ffe58f"
                                        }}
                                    >
                                        <ClockCircleOutlined 
                                            style={{ 
                                                fontSize: 28, 
                                                color: timeLeft <= 60 ? "#cf1322" : "#d48806" 
                                            }} 
                                        />
                                    </div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                                            Thời gian giữ ghế & hoàn tất thanh toán
                                        </Text>
                                        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                                            <span 
                                                style={{ 
                                                    fontSize: 32, 
                                                    fontWeight: 800, 
                                                    fontFamily: "monospace",
                                                    color: timeLeft <= 60 ? "#cf1322" : "#00AB55"
                                                }}
                                            >
                                                {formatTimer(timeLeft)}
                                            </span>
                                            <Tag color={timeLeft <= 60 ? "error" : "success"} style={{ fontSize: 13, fontWeight: 700, padding: "2px 10px", borderRadius: 8 }}>
                                                {timeLeft <= 60 ? "Sắp hết thời gian!" : "Đang đếm ngược"}
                                            </Tag>
                                        </div>
                                    </div>
                                </Flex>
                            </Col>

                            <Col xs={24} md={10} style={{ textAlign: "right" }}>
                                <Button 
                                    danger 
                                    icon={<CloseCircleOutlined />} 
                                    size="large"
                                    onClick={() => handleCancelPayment(true)}
                                    style={{ borderRadius: 10, fontWeight: 600 }}
                                >
                                    Hủy thanh toán & Nhả ghế
                                </Button>
                            </Col>
                        </Row>

                        <div style={{ marginTop: 16 }}>
                            <Progress 
                                percent={progressPercent} 
                                showInfo={false} 
                                strokeColor={timeLeft <= 60 ? "#ff4d4f" : { "0%": "#00AB55", "100%": "#52c41a" }}
                                style={{ margin: 0 }}
                            />
                            <Flex justify="space-between" style={{ marginTop: 6, fontSize: 12, color: "#8c8c8c" }}>
                                <span>* Sau 5 phút không chuyển khoản, hệ thống sẽ tự động hủy đơn và nhả ghế ngồi.</span>
                                <span>Mã đơn: #{orderCode}</span>
                            </Flex>
                        </div>
                    </Card>

                    {/* Giao diện thanh toán VietQR chính thức */}
                    <Card 
                        style={{ 
                            borderRadius: 20, 
                            boxShadow: "0 10px 30px rgba(0,0,0,0.06)", 
                            border: "none",
                            overflow: "hidden" 
                        }}
                        bodyStyle={{ padding: "32px 30px" }}
                    >
                            <Alert
                                type="info"
                                showIcon
                                message={<span style={{ fontWeight: 600 }}>Hướng dẫn thanh toán</span>}
                                description="Mở App Ngân hàng bất kỳ để quét mã VietQR hoặc chuyển khoản chính xác số tiền và nội dung bên dưới."
                                style={{ marginBottom: 28, borderRadius: 12 }}
                            />

                            <Row gutter={[36, 28]} align="middle">
                                {/* Cột trái: Mã QR VietQR */}
                                <Col xs={24} md={11} style={{ textAlign: "center" }}>
                                    <div 
                                        style={{ 
                                            background: "#fff", 
                                            padding: "20px", 
                                            borderRadius: 20, 
                                            display: "inline-block",
                                            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                                            border: "1px solid #f0f0f0"
                                        }}
                                    >
                                        <div style={{ marginBottom: 12 }}>
                                            <span style={{ color: "#d9381e", fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>
                                                VIET<span style={{ color: "#005baa" }}>QR</span>
                                            </span>
                                            <Tag color="gold" style={{ marginLeft: 8, fontWeight: 700, borderRadius: 6 }}>PRO</Tag>
                                        </div>

                                        {paymentData?.qrCode ? (
                                            <QRCode 
                                                value={paymentData.qrCode} 
                                                size={220} 
                                                bordered={false} 
                                                errorLevel="M" 
                                            />
                                        ) : (
                                            <img 
                                                src={`https://img.vietqr.io/image/970422-${accountNum}-compact2.png?amount=${paymentData?.amount || 0}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`}
                                                alt="Mã QR thanh toán VietQR"
                                                style={{ width: 220, height: 220, objectFit: "contain", borderRadius: 8 }}
                                            />
                                        )}

                                        <Flex justify="center" align="center" gap="middle" style={{ marginTop: 14 }}>
                                            <Tag color="cyan" style={{ fontSize: 11, fontWeight: 700, borderRadius: 6 }}>Napas 247</Tag>
                                            <Tag color="blue" style={{ fontSize: 11, fontWeight: 700, borderRadius: 6 }}>MB Bank</Tag>
                                        </Flex>
                                    </div>

                                    <div style={{ marginTop: 16 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            * Hệ thống tự động xác nhận đơn ngay khi tiền vào tài khoản
                                        </Text>
                                    </div>
                                </Col>

                                {/* Cột phải: Thông tin chuyển khoản chi tiết */}
                                <Col xs={24} md={13}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                        
                                        {/* Ngân hàng */}
                                        <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Ngân hàng thụ hưởng</Text>
                                            <Text strong style={{ fontSize: 15, color: "#1e293b" }}>{bankName}</Text>
                                        </div>

                                        {/* Chủ tài khoản */}
                                        <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Chủ tài khoản</Text>
                                            <Text strong style={{ fontSize: 15, color: "#1e293b", textTransform: "uppercase" }}>{accountName}</Text>
                                        </div>

                                        {/* Số tài khoản */}
                                        <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                            <Flex justify="space-between" align="center">
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Số tài khoản</Text>
                                                    <Text strong style={{ fontSize: 18, color: "#005baa", fontFamily: "monospace" }}>{accountNum}</Text>
                                                </div>
                                                <Button 
                                                    icon={<CopyOutlined />} 
                                                    size="small" 
                                                    onClick={() => copyToClipboard(accountNum, "Số tài khoản")}
                                                >
                                                    Sao chép
                                                </Button>
                                            </Flex>
                                        </div>

                                        {/* Số tiền */}
                                        <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                            <Flex justify="space-between" align="center">
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Số tiền chuyển khoản</Text>
                                                    <Text strong style={{ fontSize: 20, color: "#d9381e" }}>{transferAmount} đ</Text>
                                                </div>
                                                <Button 
                                                    icon={<CopyOutlined />} 
                                                    size="small" 
                                                    onClick={() => copyToClipboard(String(paymentData?.amount || 0), "Số tiền")}
                                                >
                                                    Sao chép
                                                </Button>
                                            </Flex>
                                        </div>

                                        {/* Nội dung chuyển khoản */}
                                        <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                            <Flex justify="space-between" align="center">
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Nội dung chuyển khoản (bắt buộc)</Text>
                                                    <Text strong style={{ fontSize: 17, color: "#1e293b", fontFamily: "monospace" }}>{transferContent}</Text>
                                                </div>
                                                <Button 
                                                    icon={<CopyOutlined />} 
                                                    size="small" 
                                                    onClick={() => copyToClipboard(transferContent, "Nội dung chuyển khoản")}
                                                >
                                                    Sao chép
                                                </Button>
                                            </Flex>
                                        </div>

                                    </div>
                                </Col>
                            </Row>
                        </Card>

                    {/* Footer hỗ trợ */}
                    <div style={{ textAlign: "center", marginTop: 24 }}>
                        <Space split={<Divider type="vertical" />}>
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>
                                <SafetyCertificateOutlined style={{ color: "#00AB55", marginRight: 4 }} />
                                Bảo mật chuẩn PCI-DSS & Ngân hàng MB Bank
                            </span>
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>
                                Hỗ trợ: 1900 6868
                            </span>
                        </Space>
                    </div>

                </div>
            </div>
        </ClientLayout>
    );
}
