import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Result, Typography, Row, Col, Space, Flex, Tag } from "antd";
import { HomeOutlined, QrcodeOutlined, PrinterOutlined, ClockCircleOutlined, UserOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { ClientLayout } from "./layout";

const { Title, Text } = Typography;

export default function TicketSuccessPage(): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();

  const ticketData = location.state || {
    ticketCode: `NB-${Math.floor(100000 + Math.random() * 900000)}`,
    customerName: "Khách hàng NETBUS",
    busName: "Xe NETBUS Luxury",
    journey: "Hà Nội → Nghệ An",
    seats: ["A1D"],
    totalPrice: 250000,
    departureTime: "Đang cập nhật..."
  };

  const parts = ticketData.journey.split("→");
  const diemDi = parts[0]?.trim() || "Điểm đi";
  const diemDen = parts[1]?.trim() || "Điểm đến";

  return (
    <ClientLayout>
      {/* 🌟 THÊM STYLE FIX LỖI IN ẤN */}
      <style>{`
        @media print {
          /* Ép trình duyệt giữ nguyên màu nền và hình ảnh khi in */
          body, div, card, img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Ẩn các nút quay về và nút in khi xuất file */
          .no-print {
            display: none !important;
          }
          /* Đảm bảo trang in không bị xén lề */
          @page {
            margin: 10mm;
          }
        }
      `}</style>

      <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: "40px 0" }}>
        <div style={{ maxWidth: 450, margin: "0 auto", padding: "0 16px" }}>
          
          <div className="no-print">
            <Result
              status="success"
              title={<Title level={4} style={{ margin: 0, color: "#16a34a" }}>ĐẶT VÉ THÀNH CÔNG!</Title>}
              subTitle="Cảm ơn bạn đã lựa chọn NETBUS"
              style={{ padding: "0 0 24px 0" }}
            />
          </div>

          {/* KHỐI VÉ TOÀN DIỆN */}
          <div style={{
            borderRadius: "30px",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
            overflow: "hidden",
            background: "#ffffff"
          }}>
            
            {/* PHẦN TRÊN CỦA VÉ - NỀN TỐI */}
            <div style={{
              background: "#1e293b", 
              padding: "28px 24px 24px 24px",
              color: "#ffffff"
            }}>
              {/* Header */}
              <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                <Flex align="center" gap={10}>
                  <img 
                    src="/assets/images/Logo.png" 
                    alt="NETBUS Logo" 
                    style={{ height: "32px", objectFit: "contain" }} 
                  />
                  <Text strong style={{ color: "#ffffff", fontSize: "16px", letterSpacing: "1px" }}>
                    NETBUS
                  </Text>
                </Flex>
                <Tag style={{ borderRadius: "20px",backgroundColor:"#16a34a", color: "#fff", border: "none", padding: "2px 12px", fontWeight: 600 }}>
                  Đã xác nhận
                </Tag>
              </Flex>

              {/* Thông tin chặng đi (ĐÃ TĂNG ĐỘ ĐẬM MÀU CHỮ ĐỂ KHI IN KHÔNG BỊ MỜ) */}
              <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                <Space direction="vertical" size={2}>
                  <Text style={{ color: "#cbd5e1", fontSize: "12px", textTransform: "uppercase", fontWeight: 500 }}>
                    Điểm đi
                  </Text>
                  <Text strong style={{ color: "#ffffff", fontSize: "20px" }}>{diemDi}</Text>
                </Space>

                <div style={{ color: "#64748b", fontSize: "20px", fontWeight: 300 }}>➔</div>

                <Space direction="vertical" size={2} style={{ textAlign: "right" }}>
                  <Text style={{ color: "#cbd5e1", fontSize: "12px", textTransform: "uppercase", fontWeight: 500 }}>
                    Điểm đến
                  </Text>
                  <Text strong style={{ color: "#ffffff", fontSize: "20px" }}>{diemDen}</Text>
                </Space>
              </Flex>

              <Flex align="center" gap={8} style={{ color: "#cbd5e1", fontSize: "13px" }}>
                <EnvironmentOutlined style={{ color: "#38bdf8" }} />
                <Text style={{ color: "#cbd5e1" }}>Dịch vụ: <span style={{ color: "#ffffff", fontWeight: 500 }}>{ticketData.busName}</span></Text>
              </Flex>
            </div>

            {/* ✂️ ĐƯỜNG CẮT VÉ: ĐÃ FIX CỐ ĐỊNH CHIỀU CAO (KHÔNG BỊ NHẢY KHI IN) */}
            <div style={{
              background: "#ffffff",
              position: "relative",
              height: "24px",
              overflow: "hidden", // Không cho vòng tròn tràn xuống phần dưới
              display: "flex",
              alignItems: "center"
            }}>
              {/* Lỗ khuyết bên trái */}
              <div style={{
                position: "absolute",
                left: "-12px",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#f1f5f9" 
              }}></div>

              {/* Đường đứt nét */}
              <div style={{
                width: "100%",
                borderTop: "2px dashed #e2e8f0",
                margin: "0 20px"
              }}></div>

              {/* Lỗ khuyết bên phải */}
              <div style={{
                position: "absolute",
                right: "-12px",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#f1f5f9"
              }}></div>
            </div>

            {/* PHẦN DƯỚI CỦA VÉ - NỀN TRẮNG */}
            <div style={{
              background: "#ffffff",
              padding: "4px 24px 28px 24px"
            }}>
              <Row gutter={[16, 20]}>
                <Col span={12}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Hành khách
                    </Text>
                    <Flex align="center" gap={6}>
                      <UserOutlined style={{ color: "#64748b", fontSize: "13px" }} />
                      <Text strong style={{ color: "#0f172a", fontSize: "14px" }}>
                        {ticketData.customerName}
                      </Text>
                    </Flex>
                  </Space>
                </Col>

                <Col span={12}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Thời gian đi
                    </Text>
                    <Flex align="center" gap={6}>
                      <ClockCircleOutlined style={{ color: "#64748b", fontSize: "13px" }} />
                      <Text strong style={{ color: "#0f172a", fontSize: "14px" }}>
                        {ticketData.departureTime || "Đang cập nhật"}
                      </Text>
                    </Flex>
                  </Space>
                </Col>

                <Col span={12}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Vị trí giường
                    </Text>
                    <Text strong style={{ color: "#0284c7", fontSize: "15px" }}>
                      {ticketData.seats.join(", ")}
                    </Text>
                  </Space>
                </Col>

                <Col span={12}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Mã vé điện tử
                    </Text>
                    <Text strong style={{ color: "#334155", fontSize: "14px", letterSpacing: "0.5px" }}>
                      {ticketData.ticketCode}
                    </Text>
                  </Space>
                </Col>
              </Row>

              <div style={{ height: "1px", background: "#f1f5f9", margin: "24px 0 16px 0" }}></div>

              {/* Phần tiền & Mã QR */}
              <Flex justify="space-between" align="center">
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Tổng tiền thanh toán
                  </Text>
                  <Title level={3} style={{ margin: 0, color: "#ef4444", fontWeight: 800 }}>
                    {ticketData.totalPrice.toLocaleString("vi-VN")}đ
                  </Title>
                </Space>

                <div style={{
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  background: "#f8fafc"
                }}>
                  <QrcodeOutlined style={{ fontSize: "44px", color: "#0f172a" }} />
                </div>
              </Flex>
            </div>

          </div>

          {/* NÚT TƯƠNG TÁC (SẼ TỰ ĐỘNG ẨN KHI IN) */}
          <Space size="middle" className="no-print" style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
            <Button 
              icon={<HomeOutlined />} 
              size="large" 
              onClick={() => navigate("/khachhang/trip")}
              style={{ borderRadius: "12px", height: "44px" }}
            >
              Về trang chủ
            </Button>
            <Button 
              type="primary" 
              icon={<PrinterOutlined />} 
              size="large" 
              onClick={() => window.print()}
              style={{ 
                borderRadius: "12px", 
                background: "#166534", 
                borderColor: "#166534",
                height: "44px" 
              }}
            >
              In / Chụp màn hình
            </Button>
          </Space>

        </div>
      </div>
    </ClientLayout>
  );
}