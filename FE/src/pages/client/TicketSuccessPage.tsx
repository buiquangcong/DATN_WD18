import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button, Result, Typography, Row, Col, Divider, Space, Flex } from "antd";
import { HomeOutlined, QrcodeOutlined, PrinterOutlined } from "@ant-design/icons";
import { ClientLayout } from "./layout";

const { Title, Text } = Typography;

export default function TicketSuccessPage(): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();

  // Nhận dữ liệu an toàn từ trang đặt vé chuyển sang kèm giá trị mặc định dự phòng
  const ticketData = location.state || {
    ticketCode: `NB-${Math.floor(100000 + Math.random() * 900000)}`,
    customerName: "Khách hàng NETBUS",
    busName: "Xe NETBUS Luxury",
    journey: "Hà Nội → Nghệ An",
    seats: ["A1D"],
    totalPrice: 250000,
    departureTime: "Đang cập nhật..."
  };

  return (
    <ClientLayout>
      <div style={{ background: "#f5f7fa", minHeight: "100vh", padding: "40px 0" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px" }}>
          
          <Result
            status="success"
            title={<Title level={3} style={{ margin: 0, color: "#52c41a" }}>ĐẶT VÉ THÀNH CÔNG!</Title>}
            subTitle="Hệ thống đã ghi nhận mã đặt chỗ của bạn. Vui lòng kiểm tra thông tin vé dưới đây."
            style={{ padding: "24px 0" }}
          />

          {/* GIAO DIỆN CHIẾC VÉ (TICKET CARD) */}
          <Card 
            bordered={false} 
            style={{ 
              borderRadius: "16px", 
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              overflow: "hidden"
            }}
            styles={{ body: { padding: "32px" } }}
          >
            {/* 🌟 BANNER LOGO THƯƠNG HIỆU NETBUS & MÃ QR */}
            <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
              {/* KHỐI LOGO BÊN TRÁI ĐÃ TÍCH HỢP ĐƯỜNG DẪN ẢNH CỦA BẠN */}
              <Flex align="center" gap={12}>
                <img 
                  src="/assets/images/Logo.png" 
                  alt="NETBUS Logo" 
                  style={{ 
                    height: "45px", 
                    objectFit: "contain",
                    display: "block"
                  }} 
                />
                <Space direction="vertical" size={0}>
                  <Text strong style={{ fontSize: "16px", color: "#166534", letterSpacing: "1px", lineHeight: 1.2 }}>
                    NETBUS
                  </Text>
                  <Text type="secondary" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
                    HÀNH TRÌNH XANH
                  </Text>
                </Space>
              </Flex>

              {/* MÃ QR BÊN PHẢI */}
              <QrcodeOutlined style={{ fontSize: "42px", color: "#166534" }} />
            </Flex>

            <Divider style={{ margin: "16px 0", borderColor: "#f0f0f0" }} />

            {/* MÃ VÉ ĐIỆN TỬ */}
            <div style={{ marginBottom: 20 }}>
              <Text type="secondary" style={{ fontSize: "12px", letterSpacing: "1px" }}>MÃ VÉ ĐIỆN TỬ</Text>
              <Title level={4} style={{ margin: 0, color: "#111827", letterSpacing: "1px" }}>
                {ticketData.ticketCode}
              </Title>
            </div>

            <Divider style={{ margin: "16px 0", borderStyle: "dashed", borderColor: "#d9d9d9" }} />

            {/* CHI TIẾT NỘI DUNG VÉ */}
            <Space direction="vertical" size="middle" style={{ display: "flex", width: "100%" }}>
              
              {/* Thông tin hành khách */}
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>Họ và tên hành khách</Text>
                  <Text strong style={{ fontSize: "16px", color: "#111827", textTransform: "uppercase" }}>
                    {ticketData.customerName}
                  </Text>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>Chuyến xe</Text>
                  <Text strong style={{ fontSize: "15px" }}>{ticketData.busName}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>Tuyến đường</Text>
                  <Text strong style={{ fontSize: "15px" }}>{ticketData.journey}</Text>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>Thời gian khởi hành</Text>
                  <Text strong>{ticketData.departureTime || "Xem trên lịch trình"}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>Vị trí giường/ghế</Text>
                  <Text strong style={{ color: "#1890ff", fontSize: "16px" }}>
                    {ticketData.seats.join(", ")}
                  </Text>
                </Col>
              </Row>
            </Space>

            {/* Đường cắt răng cưa của vé */}
            <Divider style={{ margin: "24px 0", borderStyle: "dashed", borderColor: "#166534", borderWidth: "1.5px" }} />

            {/* Footer vé & Tính tiền */}
            <Flex justify="space-between" align="center">
              <Text strong style={{ fontSize: "16px" }}>Trạng thái thanh toán:</Text>
              <Text strong style={{ color: "#52c41a", backgroundColor: "#f6ffed", border: "1px solid #b7eb8f", padding: "4px 12px", borderRadius: "4px" }}>
                Đã xác nhận
              </Text>
            </Flex>

            <Flex justify="space-between" align="center" style={{ marginTop: 16 }}>
              <Text strong style={{ fontSize: "16px" }}>Tổng tiền thanh toán:</Text>
              <Title level={3} style={{ margin: 0, color: "#ff4d4f", fontWeight: 800 }}>
                {ticketData.totalPrice.toLocaleString("vi-VN")}đ
              </Title>
            </Flex>
          </Card>

          {/* CÁC NÚT TƯƠNG TÁC */}
          <Space size="middle" style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
            <Button 
              icon={<HomeOutlined />} 
              size="large" 
              onClick={() => navigate("/khachhang/trip")}
              style={{ borderRadius: "8px" }}
            >
              Quay về trang chủ
            </Button>
            <Button 
              type="primary" 
              icon={<PrinterOutlined />} 
              size="large" 
              onClick={() => window.print()}
              style={{ borderRadius: "8px", background: "#166534", borderColor: "#166534" }}
            >
              In vé / Chụp màn hình
            </Button>
          </Space>

        </div>
      </div>
    </ClientLayout>
  );
}