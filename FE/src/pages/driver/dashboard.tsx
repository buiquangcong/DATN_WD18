import { Row, Col, Card, Typography, Button, Avatar, Badge, Progress, List, Space, Table, Tag } from "antd";
import { BellOutlined, UserOutlined, TeamOutlined, CarOutlined, SafetyCertificateOutlined, } from "@ant-design/icons";
import { ClientLayout } from "./layout";
import { useEffect, useState } from "react";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;

const notifications = [
  {
    type: "HỆ THỐNG",
    content: "Bảo trì xe NB-2024E đã hoàn tất. Xe sẵn sàng phục vụ.",
    time: "10 phút trước",
  },
  {
    type: "ĐIỀU HÀNH",
    content: "Cập nhật lộ trình mới cho tuyến cao tốc 5B.",
    time: "2 giờ trước",
  },
  {
    type: "CẢNH BÁO",
    content: "Dự báo thời tiết xấu tại khu vực Hải Phòng chiều nay.",
    time: "4 giờ trước",
  },
];

export default function DriverDashboard() {
  const [driverName, setDriverName] = useState("Tài xế");
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") {
      try {
        const user = JSON.parse(userStr);
        if (user.displayName) {
          setDriverName(user.displayName);
        }
        if (user.staffId) {
          axios.get(`http://localhost:3000/api/trip/staff/${user.staffId}`)
            .then(res => {
              if (res.data && res.data.success) {
                setTrips(res.data.data);
              }
            })
            .catch(err => console.error("Lỗi fetch trips", err));
        }
      } catch (e) {
        console.error("Lỗi parse user", e);
      }
    }
  }, []);

  // Lấy giờ hiện tại để chào đúng buổi
  const currentHour = new Date().getHours();
  let greeting = "Chào buổi sáng";
  if (currentHour >= 12 && currentHour < 18) {
    greeting = "Chào buổi chiều";
  } else if (currentHour >= 18) {
    greeting = "Chào buổi tối";
  }

  // Lấy các chuyến đi trong ngày hôm nay từ API
  const todayTrips = trips.filter((trip) => {
    if (!trip.departureTime) return false;
    const tripDate = new Date(trip.departureTime);
    const today = new Date();
    return tripDate.toLocaleDateString("vi-VN") === today.toLocaleDateString("vi-VN");
  });

  const todayTripsCount = todayTrips.length;

  // Tính tổng số hành khách (số lượng ghế đã đặt - status là "BOOKED") của ngày hôm nay
  const todayPassengersCount = todayTrips.reduce((total, trip) => {
    if (!trip.seats || !Array.isArray(trip.seats)) return total;
    const bookedSeatsCount = trip.seats.filter((seat: any) => seat.status === "BOOKED").length;
    return total + bookedSeatsCount;
  }, 0);

  const columns = [
    {
      title: "Mã chuyến",
      render: (_: any, record: any) => record._id?.slice(-6).toUpperCase(),
    },
    {
      title: "Tuyến đường",
      render: (_: any, record: any) =>
        `${record.journey?.diemDi || record.journey?.startPoint || "Chưa rõ"} → ${record.journey?.diemDen || record.journey?.endPoint || "Chưa rõ"}`,
    },
    {
      title: "Khởi hành",
      render: (_: any, record: any) =>
        new Date(record.departureTime).toLocaleString("vi-VN"),
    },
    {
      title: "Xe",
      render: (_: any, record: any) =>
        record.bus?.name || record.bus?.licensePlate || "N/A",
    },
    {
      title: "Trạng thái",
      render: (_: any, record: any) => {
        let color = "default";
        if (record.status === "sắp chạy") color = "blue";
        if (record.status === "đang chạy") color = "green";
        if (record.status === "Hoàn thành" || record.status === "hoàn thành") color = "cyan";
        if (record.status === "huỷ") color = "red";
        return (
          <Tag color={color}>
            {record.status || "Đang chờ"}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      render: () => (
        <Button type="link">
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <ClientLayout>
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2}>{greeting}, {driverName}!</Title>
          <Text type="secondary">
            Chúc bạn một hành trình an toàn và xanh mát hôm nay.
          </Text>
        </Col>

        <Col>
          <Space size="large">
            <Badge dot>
              <BellOutlined style={{ fontSize: 22 }} />
            </Badge>

            <Avatar
              size={50}
              icon={<UserOutlined />}
            />
          </Space>
        </Col>
      </Row>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Text type="secondary">Chuyến đi hôm nay</Text>
            <Title level={2}>{String(todayTripsCount).padStart(2, '0')}</Title>
            <Text style={{ color: "#52c41a" }}>Green trip</Text>
          </Card>
        </Col>

        {/* <Col xs={24} md={12} lg={6}>
          <Card>
            <Text type="secondary">Giờ lái trong tháng</Text>
            <Title level={2}>142h</Title>
            <Text type="secondary">Mục tiêu: 160h</Text>
          </Card>
        </Col> */}

         <Col xs={24} md={12} lg={6}>
          <Card>
            <Text type="secondary">Tổng hành khách</Text>
            <Title level={2}>{String(todayPassengersCount).padStart(2, '0')}</Title>
            <TeamOutlined
              style={{
                fontSize: 24,
                color: "#52c41a",
              }}
            />
          </Card>
        </Col>

        {/* <Col xs={24} md={12} lg={6}>
          <Card>
            <Text type="secondary">Điểm an toàn</Text>
            <Title level={2} style={{ color: "#52c41a" }}>
              98.5
            </Title>
            <SafetyCertificateOutlined
              style={{
                fontSize: 24,
                color: "#52c41a",
              }}
            />
          </Card>
        </Col> */}
      </Row>

      {/* Main Section */}
      <Row gutter={[24, 24]}>
        {/* Active Trips */}
        <Col xs={24}>
          <Card title={<Text strong style={{ color: "#52c41a" }}>DANH SÁCH CHUYẾN XE CỦA {driverName.toUpperCase()}</Text>}>
            {trips.length === 0 ? (
                <Text type="secondary">Hiện chưa có chuyến đi nào được phân công cho bạn.</Text>
            ) : (
                <Table 
                  dataSource={trips} 
                  columns={columns} 
                  rowKey="_id"
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: 800 }}
                />
            )}
          </Card>
        </Col>

        {/* Notifications */}
        <Col xs={24} lg={8}>
          <Card title="Thông báo">
            <List
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item>
                  <div>
                    <Text strong>{item.type}</Text>
                    <br />
                    <Text>{item.content}</Text>
                    <br />
                    <Text type="secondary">
                      {item.time}
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Weekly Performance */}
      <Card
        title="Hiệu suất lái xe hàng tuần"
        style={{ marginTop: 24 }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Text>Eco Score</Text>
            <Progress percent={85} />
          </Col>

          <Col xs={24} md={12}>
            <Text>Đúng giờ</Text>
            <Progress percent={92} />
          </Col>

          <Col xs={24} md={12}>
            <Text>Tiết kiệm nhiên liệu</Text>
            <Progress percent={78} />
          </Col>

          <Col xs={24} md={12}>
            <Text>Hiệu suất tuyến</Text>
            <Progress percent={88} />
          </Col>
        </Row>
      </Card>
    </div>
    </ClientLayout>
  );
}