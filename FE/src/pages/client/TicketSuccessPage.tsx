import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Result, Typography, Row, Col, Space, Flex, Tag } from "antd";
import { HomeOutlined, QrcodeOutlined, PrinterOutlined, ClockCircleOutlined, UserOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { ClientLayout } from "./layout";

const { Title, Text } = Typography;

interface TicketData {
  ticketCode: string;
  customerName: string;
  busName: string;
  journey: string;
  seats: string[];
  totalPrice: number;
  departureTime: string;
}

export default function TicketSuccessPage(): React.ReactElement {
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketData | null>(null);

  useEffect(() => {
    // 🌟 ĐỒNG BỘ TRỰC TIẾP: Bốc thẳng cụm dữ liệu Booking từ localStorage lên
    const cachedTicket = localStorage.getItem("latest_ticket_success");
    
    if (cachedTicket) {
      setTicket(JSON.parse(cachedTicket));
      
      // Xóa luôn bộ nhớ tạm sau khi đã lấy xong để bảo mật thông tin, tránh bị lưu rác
      // localStorage.removeItem("latest_ticket_success"); 
    }
  }, []);

  // Nếu trong bộ nhớ tạm chưa có dữ liệu (hoặc khách cố tình vào link trực tiếp)
  const finalData = ticket || {
    ticketCode: "NB-585674",
    customerName: "Hành khách NETBUS",
    busName: "Xe NETBUS Luxury",
    journey: "Hành trình → Trống",
    seats: ["Chưa chọn"],
    totalPrice: 0,
    departureTime: "Đang cập nhật..."
  };

  const parts = finalData.journey.split("→");
  const diemDi = parts[0]?.trim() || "Điểm đi";
  const diemDen = parts[1]?.trim() || "Điểm đến";

  return (
    <ClientLayout>
      <style>{`
        @media print {
          body, div, card, img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          @page { margin: 10mm; }
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
            <div style={{ background: "#1e293b", padding: "28px 24px 24px 24px", color: "#ffffff" }}>
              <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                <Flex align="center" gap={10}>
                  <img src="/assets/images/Logo.png" alt="NETBUS" style={{ height: "32px", objectFit: "contain" }} />
                  <Text strong style={{ color: "#ffffff", fontSize: "16px", letterSpacing: "1px" }}>NETBUS</Text>
                </Flex>
                <Tag style={{ borderRadius: "20px", backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "2px 12px", fontWeight: 600 }}>
                  Đã xác nhận
                </Tag>
              </Flex>

              <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                <Space direction="vertical" size={2}>
                  <Text style={{ color: "#cbd5e1", fontSize: "12px", textTransform: "uppercase" }}>Điểm đi</Text>
                  <Text strong style={{ color: "#ffffff", fontSize: "20px" }}>{diemDi}</Text>
                </Space>
                <div style={{ color: "#64748b", fontSize: "20px" }}>➔</div>
                <Space direction="vertical" size={2} style={{ textAlign: "right" }}>
                  <Text style={{ color: "#cbd5e1", fontSize: "12px", textTransform: "uppercase" }}>Điểm đến</Text>
                  <Text strong style={{ color: "#ffffff", fontSize: "20px" }}>{diemDen}</Text>
                </Space>
              </Flex>

              <Flex align="center" gap={8} style={{ color: "#cbd5e1", fontSize: "13px" }}>
                <EnvironmentOutlined style={{ color: "#38bdf8" }} />
                <Text style={{ color: "#cbd5e1" }}>Dịch vụ: <span style={{ color: "#ffffff", fontWeight: 500 }}>{finalData.busName}</span></Text>
              </Flex>
            </div>

            <div style={{ background: "#ffffff", position: "relative", height: "24px", overflow: "hidden", display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: "-12px", width: "24px", height: "24px", borderRadius: "50%", background: "#f1f5f9" }}></div>
              <div style={{ width: "100%", borderTop: "2px dashed #e2e8f0", margin: "0 20px" }}></div>
              <div style={{ position: "absolute", right: "-12px", width: "24px", height: "24px", borderRadius: "50%", background: "#f1f5f9" }}></div>
            </div>

            <div style={{ background: "#ffffff", padding: "4px 24px 28px 24px" }}>
              <Row gutter={[16, 20]}>
                <Col span={12}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: "11px", textTransform: "uppercase" }}>Hành khách</Text>
                    <Flex align="center" gap={6}>
                      <UserOutlined style={{ color: "#64748b", fontSize: "13px" }} />
                      <Text strong style={{ color: "#0f172a", fontSize: "14px" }}>{finalData.customerName}</Text>
                    </Flex>
                  </Space>
                </Col>

                <Col span={12}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: "11px", textTransform: "uppercase" }}>Thời gian đi</Text>
                    <Flex align="center" gap={6}>
                      <ClockCircleOutlined style={{ color: "#64748b", fontSize: "13px" }} />
                      <Text strong style={{ color: "#0f172a", fontSize: "14px" }}>{finalData.departureTime}</Text>
                    </Flex>
                  </Space>
                </Col>

                <Col span={12}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: "11px", textTransform: "uppercase" }}>Vị trí giường</Text>
                    <Text strong style={{ color: "#0284c7", fontSize: "15px" }}>{finalData.seats.join(", ")}</Text>
                  </Space>
                </Col>

                <Col span={12}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: "11px", textTransform: "uppercase" }}>Mã vé điện tử</Text>
                    <Text strong style={{ color: "#334155", fontSize: "14px" }}>{finalData.ticketCode}</Text>
                  </Space>
                </Col>
              </Row>

              <div style={{ height: "1px", background: "#f1f5f9", margin: "24px 0 16px 0" }}></div>

              <Flex justify="space-between" align="center">
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: "11px", textTransform: "uppercase" }}>Tổng tiền thanh toán</Text>
                  <Title level={3} style={{ margin: 0, color: "#ef4444", fontWeight: 800 }}>
                    {finalData.totalPrice.toLocaleString("vi-VN")}đ
                  </Title>
                </Space>

                <div style={{ padding: "8px", border: "1px solid #e2e8f0", borderRadius: "14px", background: "#f8fafc" }}>
                  <QrcodeOutlined style={{ fontSize: "44px", color: "#0f172a" }} />
                </div>
              </Flex>
            </div>
          </div>

          <Space size="middle" className="no-print" style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
            <Button icon={<HomeOutlined />} size="large" onClick={() => navigate("/khachhang/trip")} style={{ borderRadius: "12px", height: "44px" }}>
              Về trang chủ
            </Button>
            <Button type="primary" icon={<PrinterOutlined />} size="large" onClick={() => window.print()} style={{ borderRadius: "12px", background: "#166534", borderColor: "#166534", height: "44px" }}>
              In / Chụp màn hình
            </Button>
          </Space>

        </div>
      </div>
    </ClientLayout>
  );
}