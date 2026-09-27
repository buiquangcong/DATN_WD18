import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Spin, Flex, Typography, Button, Result } from "antd";
import { ArrowLeftOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { ClientLayout } from "./layout";

const { Text, Title } = Typography;

export default function BookingCancelPage(): React.ReactElement {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(true);

    const orderCode = searchParams.get("orderCode");
    const tripId = searchParams.get("tripId");

    useEffect(() => {
        const handleCancel = async () => {
            // Xóa bộ nhớ vé tạm
            localStorage.removeItem("latest_ticket_success");

            if (orderCode) {
                try {
                    await axios.post("http://localhost:3000/api/payment/cancel", { orderCode });
                } catch (err) {
                    console.error("Lỗi khi hủy đơn và nhả ghế:", err);
                }
            }

            setProcessing(false);

            // Tự động chuyển về trang danh sách chuyến sau 2 giây
            setTimeout(() => {
                navigate(`/khachhang/trip?status=cancelled&orderCode=${orderCode || ""}`);
            }, 2000);
        };

        handleCancel();
    }, [orderCode, navigate]);

    return (
        <ClientLayout>
            <Flex align="center" justify="center" style={{ minHeight: "70vh", padding: "40px 20px" }}>
                {processing ? (
                    <Flex vertical align="center" gap="middle">
                        <Spin size="large" />
                        <Text strong style={{ fontSize: 16 }}>Đang xử lý hủy đơn và giải phóng ghế ngồi...</Text>
                    </Flex>
                ) : (
                    <Result
                        status="warning"
                        icon={<CloseCircleOutlined style={{ color: "#faad14" }} />}
                        title="Đã hủy hoặc hết hạn thanh toán"
                        subTitle="Thời gian đếm ngược 5 phút đã kết thúc hoặc bạn đã hủy giao dịch trên PayOS. Vị trí ghế của bạn đã được giải phóng thành công."
                        extra={[
                            <Button 
                                type="primary" 
                                key="backTrip" 
                                icon={<ArrowLeftOutlined />}
                                style={{ backgroundColor: "#00AB55", borderColor: "#00AB55" }}
                                onClick={() => navigate(`/khachhang/trip?status=cancelled&orderCode=${orderCode || ""}`)}
                            >
                                Quay lại danh sách chuyến xe
                            </Button>
                        ]}
                    />
                )}
            </Flex>
        </ClientLayout>
    );
}
