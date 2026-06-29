import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Dùng để chuyển hướng trang
import { Card, Row, Col, Input, DatePicker, Button, Tag, Space, Typography, message } from "antd";
import { EnvironmentOutlined, SearchOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { ClientLayout } from "./layout";

const { Title, Text } = Typography;

interface FareRule {
  weekdayPrice: number;
  weekendPrice: number;
}

interface Journey {
  diemDi: string;
  diemDen: string;
  thoiGianDiChuyen: string;
  price: number; 
}

interface Bus {
  name: string;
  type: string;
}

interface Seat {
  status: string;
}

interface TripData {
  _id: string;
  journey: Journey;
  fareRule: FareRule; // Nhận cấu trúc dữ liệu fareRule từ Backend gộp qua
  bus: Bus;
  departureTime: string;
  arrivalTime: string;
  status: string;
  seats: Seat[];
}

export default function Trip(): React.ReactElement {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate(); // Hook chuyển hướng của React Router V6

  const fetchTrips = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get<{ data?: TripData[] } & TripData[]>("http://localhost:3000/api/trip");
      if (response.data && "data" in response.data && Array.isArray(response.data.data)) {
        setTrips(response.data.data);
      } else if (Array.isArray(response.data)) {
        setTrips(response.data as unknown as TripData[]);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách chuyến:", error);
      message.error("Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const formatTime = (dateString: string): string => {
    if (!dateString) return "--:--";
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const getAvailableSeatsCount = (seatsArray: Seat[]): number => {
    if (!seatsArray) return 0;
    return seatsArray.filter(seat => seat.status === "AVAILABLE").length;
  };

  // 🌟 HÀM TÍNH TOÁN GIÁ VÉ THỰC TẾ ĐỒNG BỘ VỚI BACKEND
  const getTicketPrice = (item: TripData): number => {
    if (!item.departureTime) return item.journey?.price || 0;
    
    const departureDate = new Date(item.departureTime);
    
    // Nếu có cấu hình fareRule từ hệ thống
    if (item.fareRule) {
      // getDay() trả về 0 (Chủ Nhật) và 6 (Thứ 7) -> Tính giá cuối tuần
      if (departureDate.getDay() === 0 || departureDate.getDay() === 6) {
        return item.fareRule.weekendPrice;
      } else {
        return item.fareRule.weekdayPrice;
      }
    }
    
    // Phương án dự phòng nếu chưa kịp cập nhật hoặc không tìm thấy fareRule
    return item.journey?.price || 0;
  };

  return (
    <ClientLayout>
      <div>
        {/* Banner */}
        <div
          style={{
            height: 350,
            background:
              "linear-gradient(rgba(22,110,0,.4), rgba(22,110,0,.4)), url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e') center/cover",
            display: "flex",
            alignItems: "center",
            padding: "0 80px",
            color: "#fff",
          }}
        >
          <div>
            <Title style={{ color: "#fff", marginBottom: 10 }}>
              Journey with <span style={{ color: "#93fb75" }}>Purpose</span>
            </Title>

            <Text style={{ color: "#fff", fontSize: 16 }}>
              Reliable, eco-friendly transport connecting Hanoi, Nghe An,
              Ha Tinh and beyond.
            </Text>
          </div>
        </div>

        {/* Thanh tìm kiếm nhanh */}
        <div
          style={{
            maxWidth: 1200,
            margin: "-50px auto 40px",
            padding: "0 20px",
          }}
        >
          <Card>
            <Row gutter={16}>
              <Col span={8}><Input prefix={<EnvironmentOutlined />} placeholder="Điểm đi" size="large" /></Col>
              <Col span={8}><Input prefix={<EnvironmentOutlined />} placeholder="Điểm đến" size="large" /></Col>
              <Col span={4}><DatePicker style={{ width: "100%" }} size="large" /></Col>
              <Col span={4}>
                <Button type="primary" icon={<SearchOutlined />} size="large" block loading={loading} onClick={fetchTrips}>Tìm kiếm</Button>
              </Col>
            </Row>
          </Card>
        </div>

        {/* Danh sách chuyến xe đổ về */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {trips.map((item: TripData) => (
              <Card 
                key={item._id}
                style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #eef2f6" }}
                styles={{ body: { padding: "20px 24px" } }}
              >
                <Row align="middle" justify="space-between">
                  {/* Thời gian & Lộ trình */}
                  <Col span={8}>
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      <div>
                        <Title level={3} style={{ margin: 0, color: "#1a1a1a", fontSize: "22px" }}>
                          {formatTime(item.departureTime)}
                        </Title>
                        <Text strong style={{ color: "#777", display: "block", marginTop: 4 }}>
                          {item.journey?.diemDi || "Hà Nội"}
                        </Text>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", minWidth: 30 }}>
                        <ArrowRightOutlined style={{ color: "#bfbfbf", fontSize: "16px" }} />
                      </div>
                      
                      <div>
                        <Title level={3} style={{ margin: 0, color: "#1a1a1a", fontSize: "22px" }}>
                          {formatTime(item.arrivalTime)}
                        </Title>
                        <Text strong style={{ color: "#777", display: "block", marginTop: 4 }}>
                          {item.journey?.diemDen || "Phú Thọ"}
                        </Text>
                      </div>
                    </div>
                  </Col>

                  {/* Thông tin kết cấu loại xe */}
                  <Col span={4} style={{ textAlign: "center" }}>
                    <Text strong style={{ fontSize: 15, display: "block", marginBottom: 4 }}>
                      {item.bus?.name || "Xe NETBUS Luxury"}
                    </Text>
                    <Tag color="blue" style={{ borderRadius: 4, padding: "2px 8px" }}>
                      {item.bus?.type === "Sleeper" ? "Giường nằm" : "Ghế ngồi"}
                    </Tag>
                  </Col>

                  {/* Giá thực tế (Tính theo FareRule) & Quỹ ghế trống */}
                  <Col span={4} style={{ textAlign: "center" }}>
                    <Title level={3} style={{ color: "#ff4d4f", margin: 0, fontWeight: 700, fontSize: "20px" }}>
                      {/* 🌟 ĐÃ SỬA: Gọi hàm getTicketPrice thay cho item.journey.price */}
                      {`${getTicketPrice(item).toLocaleString("vi-VN")}đ`}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13, display: "block", marginTop: 4 }}>
                      {getAvailableSeatsCount(item.seats)} chỗ trống
                    </Text>
                  </Col>

                  {/* Nút đặt vé */}
                  <Col span={4}>
                    <Button 
                      type="primary" 
                      size="large" 
                      block
                      style={{ borderRadius: 6, fontWeight: 600, height: 44, background: "#166e00", borderColor: "#166e00" }}
                      onClick={() => navigate(`/khachhang/booking/${item._id}`)}
                    >
                      Đặt vé
                    </Button>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        </div>
      </div>
    </ClientLayout>
  );
}