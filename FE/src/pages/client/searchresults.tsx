import {Row, Col, Card, Input, Button, DatePicker, Typography, Space, Tag,} from "antd";
import { SearchOutlined, EnvironmentOutlined,} from "@ant-design/icons";
import { ClientLayout } from "./layout";

const { Title, Text } = Typography;

const schedules = [
  {
    id: 1,
    departure: "06:00",
    arrival: "11:30",
    type: "VIP 21 Cabin",
    price: "540.000đ",
    seats: 12,
  },
  {
    id: 2,
    departure: "08:30",
    arrival: "14:30",
    type: "32 Giường",
    price: "350.000đ",
    seats: 24,
  },
  {
    id: 3,
    departure: "22:00",
    arrival: "06:30",
    type: "34 Giường VIP",
    price: "450.000đ",
    seats: 6,
  },
];

export default function SearchResults() {
  return (
    <ClientLayout>
    <div style={{ paddingTop: 100 }}>
      {/* Banner */}
      <div
        style={{
          height: 300,
          background:
            "linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.4)),url('https://images.unsplash.com/photo-1503376780353-7e6692767b70') center/cover",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Title style={{ color: "#fff" }}>
            Find Your Journey
          </Title>

          <Text style={{ color: "#fff" }}>
            Search and book bus tickets quickly
          </Text>
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          maxWidth: 1200,
          margin: "-40px auto 40px",
          padding: "0 20px",
        }}
      >
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={7}>
              <Input
                size="large"
                prefix={<EnvironmentOutlined />}
                placeholder="Điểm đi"
              />
            </Col>

            <Col xs={24} md={7}>
              <Input
                size="large"
                prefix={<EnvironmentOutlined />}
                placeholder="Điểm đến"
              />
            </Col>

            <Col xs={24} md={5}>
              <DatePicker
                size="large"
                style={{ width: "100%" }}
              />
            </Col>

            <Col xs={24} md={5}>
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                block
              >
                Tìm chuyến
              </Button>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Filter */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto 30px",
          padding: "0 20px",
        }}
      >
        <Space wrap>
          <Button type="primary">Tất cả</Button>
          <Button>VIP 21 Cabin</Button>
          <Button>32 Giường</Button>
          <Button>34 Giường VIP</Button>
        </Space>
      </div>

      {/* Danh sách chuyến */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 20px 50px",
        }}
      >
        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%" }}
        >
          {schedules.map((item) => (
            <Card key={item.id}>
              <Row align="middle">
                <Col xs={24} md={4}>
                  <Title level={3}>
                    {item.departure}
                  </Title>
                  <Text>Khởi hành</Text>
                </Col>

                <Col xs={24} md={4}>
                  <Title level={3}>
                    {item.arrival}
                  </Title>
                  <Text>Đến nơi</Text>
                </Col>

                <Col xs={24} md={6}>
                  <Title level={5}>
                    {item.type}
                  </Title>

                  <Tag color="green">
                    Còn chỗ
                  </Tag>
                </Col>

                <Col xs={24} md={5}>
                  <Title
                    level={4}
                    style={{ color: "#00AB55" }}
                  >
                    {item.price}
                  </Title>

                  <Text>
                    {item.seats} ghế trống
                  </Text>
                </Col>

                <Col xs={24} md={5}>
                  <Button
                    type="primary"
                    size="large"
                    block
                  >
                    Chọn chuyến
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