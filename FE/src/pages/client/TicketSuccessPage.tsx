import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Result, Typography, Row, Col, Space, Flex, Tag, QRCode } from "antd";
import { HomeOutlined, QrcodeOutlined, PrinterOutlined, ClockCircleOutlined, UserOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { ClientLayout } from "./layout";

const { Title, Text } = Typography;

interface TicketData {
  id?: string;
  ticketCode: string;
  customerName: string;
  busName: string;
  licensePlate?: string;
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
    id: "BK-NEW",
    ticketCode: "NB-585674",
    customerName: "Hành khách NETBUS",
    busName: "Xe NETBUS Luxury",
    licensePlate: "29B-123.45",
    journey: "Hành trình → Trống",
    seats: ["Chưa chọn"],
    totalPrice: 0,
    departureTime: "Đang cập nhật..."
  };

  const parts = finalData.journey.split("→");
  const diemDi = parts[0]?.trim() || "Điểm đi";
  const diemDen = parts[1]?.trim() || "Điểm đến";

  const qrValue = `--- VÉ ĐIỆN TỬ NETBUS ---
Mã vé: ${finalData.id || finalData.ticketCode}
Mã Code: ${finalData.ticketCode}
Hành khách: ${finalData.customerName}
Chuyến xe: ${finalData.busName} (${finalData.journey})
BKS: ${finalData.licensePlate || "29B-123.45"}
Vị trí ghế: ${finalData.seats.join(", ")}
Khởi hành: ${finalData.departureTime}`;

  let departureDate = "---";
  let departureTimeOnly = "---";
  try {
    const d = new Date(finalData.departureTime);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      departureDate = `${day}/${month}/${year}`;
      
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      departureTimeOnly = `${hours}:${minutes}`;
    } else {
      const prts = finalData.departureTime.split(" ");
      if (prts.length === 2) {
        departureTimeOnly = prts[0];
        departureDate = prts[1];
      }
    }
  } catch (e) {}

  const routeDisplay = `${diemDi} - ${diemDen}`.toUpperCase();

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
        .ticket-container {
          display: flex;
          width: 100%;
          max-width: 840px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          position: relative;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          margin: 0 auto;
        }
        .ticket-qr-side {
          flex: 1.1;
          background: #ffffff;
          border-right: 2px dashed #16a34a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
        }
        .qr-code-wrapper {
          padding: 6px;
          border: 1px solid #16a34a;
          border-radius: 14px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 104px;
          height: 104px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
        }
        .qr-code-wrapper canvas, .qr-code-wrapper svg {
          display: block !important;
          margin: 0 auto !important;
          padding: 0 !important;
          max-width: none !important;
          max-height: none !important;
          width: 90px !important;
          height: 90px !important;
        }
        .ticket-main {
          flex: 2.8;
          padding: 24px;
          position: relative;
          background: radial-gradient(circle at -10% 50%, rgba(22, 163, 74, 0.06) 0%, transparent 60%),
                      radial-gradient(circle at 100% 100%, rgba(22, 163, 74, 0.08) 0%, transparent 50%);
        }
        .ticket-stub {
          flex: 1;
          background: #f4fbf7;
          border-left: 2px dashed #16a34a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 12px;
          position: relative;
        }
        .ticket-qr-notch-top {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          z-index: 10;
        }
        .ticket-qr-notch-bottom {
          position: absolute;
          bottom: -10px;
          right: -10px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          z-index: 10;
        }
        .ticket-stub-notch-top {
          position: absolute;
          top: -10px;
          left: -10px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          z-index: 10;
        }
        .ticket-stub-notch-bottom {
          position: absolute;
          bottom: -10px;
          left: -10px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          z-index: 10;
        }
        .ticket-field {
          display: flex;
          border: 1px solid #16a34a;
          border-radius: 8px;
          background: #ffffff;
          overflow: hidden;
          margin-bottom: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }
        .ticket-label {
          background: #0f2d1e;
          color: #ffffff;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 100px;
          text-align: center;
          letter-spacing: 0.5px;
        }
        .ticket-value {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: bold;
          color: #1e293b;
          display: flex;
          align-items: center;
        }
        .ticket-stub-vertical {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          display: flex;
          align-items: center;
          gap: 6px;
          color: #14532d;
        }
      `}</style>

      <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: "40px 0" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 16px" }}>
          
          <div className="no-print">
            <Result
              status="success"
              title={<Title level={4} style={{ margin: 0, color: "#16a34a" }}>ĐẶT VÉ THÀNH CÔNG!</Title>}
              subTitle="Cảm ơn bạn đã lựa chọn NETBUS"
              style={{ padding: "0 0 24px 0" }}
            />
          </div>

          {/* KHỐI VÉ TOÀN DIỆN */}
          <div className="ticket-container">
            {/* LEFT QR PANEL */}
            <div className="ticket-qr-side">
              {/* Notches on the right edge of QR side */}
              <div className="ticket-qr-notch-top"></div>
              <div className="ticket-qr-notch-bottom"></div>

              <div className="qr-code-wrapper">
                <QRCode value={finalData.id || finalData.ticketCode} size={90} bordered={false} />
              </div>
              <span style={{ fontSize: 9, color: "#16a34a", fontWeight: "bold", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: "10px" }}>
                Quét check-in
              </span>
            </div>

            {/* MAIN TICKET */}
            <div className="ticket-main">
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img src="/assets/images/Logo.png" alt="NETBUS" style={{ height: "26px", objectFit: "contain" }} />
                  <span style={{ fontSize: 18, fontWeight: "bold", color: "#14532d", letterSpacing: "0.5px" }}>NetBus</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: "bold", color: "#16a34a", letterSpacing: "1px" }}>NETBUS - CHẠM LÀ ĐI</span>
              </div>

              {/* Fields */}
              <div className="ticket-field">
                <div className="ticket-label">Hành khách</div>
                <div className="ticket-value" style={{ textTransform: "uppercase" }}>{finalData.customerName}</div>
              </div>

              <div className="ticket-field">
                <div className="ticket-label">Tuyến đường</div>
                <div className="ticket-value" style={{ color: "#14532d" }}>{routeDisplay}</div>
              </div>

              <Row gutter={12}>
                <Col span={12}>
                  <div className="ticket-field">
                    <div className="ticket-label" style={{ minWidth: 65 }}>Tên xe</div>
                    <div className="ticket-value">{finalData.busName}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="ticket-field">
                    <div className="ticket-label" style={{ minWidth: 55 }}>BKS</div>
                    <div className="ticket-value" style={{ color: "#14532d" }}>{finalData.licensePlate || "29B-123.45"}</div>
                  </div>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <div className="ticket-field">
                    <div className="ticket-label" style={{ minWidth: 65 }}>Ngày đi</div>
                    <div className="ticket-value">{departureDate}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="ticket-field">
                    <div className="ticket-label" style={{ minWidth: 70 }}>Giờ chạy</div>
                    <div className="ticket-value">{departureTimeOnly}</div>
                  </div>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <div className="ticket-field">
                    <div className="ticket-label" style={{ minWidth: 65 }}>Số ghế</div>
                    <div className="ticket-value" style={{ color: "#0284c7" }}>{finalData.seats.join(", ")}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="ticket-field">
                    <div className="ticket-label" style={{ minWidth: 70 }}>Giá vé</div>
                    <div className="ticket-value" style={{ color: "#ef4444" }}>
                      {finalData.totalPrice.toLocaleString("vi-VN")} VNĐ
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#e8f5e9", border: "2px solid #a5d6a7", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <span style={{ fontSize: 16 }}>🌿</span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>
                  * Vui lòng chụp màn hình hoặc in vé khi lên xe
                </div>
              </div>
            </div>

            {/* STUB (CUỐNG VÉ) */}
            <div className="ticket-stub">
              {/* Notches on the left edge of stub */}
              <div className="ticket-stub-notch-top"></div>
              <div className="ticket-stub-notch-bottom"></div>

              <div className="ticket-stub-vertical">
                <span style={{ fontSize: 10, color: "#16a34a", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "2px" }}>
                  Cuống vé
                </span>
                <span style={{ fontSize: 16, fontWeight: "800", letterSpacing: "1px", margin: "6px 0" }}>
                  NetBus
                </span>
                <span style={{ fontSize: 10, fontWeight: "700", color: "#64748b" }}>
                  VÉ SỐ: <span style={{ color: "#0f172a" }}>{finalData.ticketCode}</span>
                </span>
                <span style={{ fontSize: 9, color: "#16a34a", fontWeight: "bold", marginTop: "10px", letterSpacing: "1px" }}>
                  KHÁCH HÀNG GIỮ
                </span>
              </div>
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
