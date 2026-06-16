import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Dùng để chuyển hướng trang
import { Card, Row, Col, Input, DatePicker, Button, Tag, Space, Typography, message } from "antd";
import { EnvironmentOutlined, SearchOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { ClientLayout } from "./layout";

const { Title, Text } = Typography;

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
  bus: Bus;
  departureTime: string;
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

  return (
    <ClientLayout>
      <div style={{ background: "#f5f7fa", minHeight: "100vh", paddingBottom: 50 }}>
        {/* Hero Section */}
        <div style={{ height: 220, background: "linear-gradient(rgba(22,110,0,.5), rgba(22,110,0,.5)), url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e') center/cover", display: "flex", alignItems: "center", padding: "0 80px", color: "#fff" }}>
          <Title style={{ color: "#fff", margin: 0 }}>Tìm Kiếm Chuyến Xe</Title>
        </div>

        {/* Tìm kiếm */}
        <div style={{ maxWidth: 1100, margin: "-30px auto 30px", padding: "0 20px" }}>
          <Card style={{ borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
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

        {/* Danh sách chuyến */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {trips.map((item: TripData) => (
              <Card 
                key={item._id}
                style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #eef2f6" }}
                bodyStyle={{ padding: "20px 24px" }}
              >
                <Row align="middle" justify="space-between">
                  {/* Thời gian & Lộ trình */}
                  <Col span={5}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div>
                        <Title level={3} style={{ margin: 0, color: "#1a1a1a" }}>{formatTime(item.departureTime)}</Title>
                        <Text strong style={{ color: "#555" }}>{item.journey?.diemDi || "Hà Nội"}</Text>
                      </div>
                      <ArrowRightOutlined style={{ color: "#ccc" }} />
                      <div>
                        <Title level={3} style={{ margin: 0, color: "#1a1a1a" }}>--:--</Title>
                        <Text strong style={{ color: "#555" }}>{item.journey?.diemDen || "Phú Thọ"}</Text>
                      </div>
                    </div>
                  </Col>

                  {/* Thông tin Xe */}
                  <Col span={5} style={{ textAlign: "center" }}>
                    <Text strong style={{ fontSize: 15, display: "block", marginBottom: 4 }}>{item.bus?.name}</Text>
                    <Tag color="blue" style={{ borderRadius: 4 }}>{item.bus?.type === "Sleeper" ? "Giường nằm" : "Ghế ngồi"}</Tag>
                  </Col>

                  {/* Giá & Chỗ trống */}
                  <Col span={5} style={{ textAlign: "center" }}>
                    <Title level={4} style={{ color: "#ff4d4f", margin: 0, fontWeight: 700 }}>
                      {item.journey?.price ? `${item.journey.price.toLocaleString("vi-VN")}đ` : "0đ"}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>{getAvailableSeatsCount(item.seats)} chỗ trống</Text>
                  </Col>

                  {/* Hành động */}
                  <Col span={4}>
                    <Button 
                      type="primary" 
                      size="large" 
                      block
                      style={{ borderRadius: 6, fontWeight: 600, height: 44, background: "#166e00", borderColor: "#166e00" }}
                      onClick={() => navigate(`/khachhang/booking/${item._id}`)} // Chuyển hướng sang trang độc lập
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