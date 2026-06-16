import { Card, Row, Col, Input, DatePicker, Button, Tag, Space, Typography, } from "antd";

import { EnvironmentOutlined, SearchOutlined, } from "@ant-design/icons";
import { ClientLayout } from "./layout";

const { Title, Text } = Typography;

const schedules = [
  {
    departure: "06:00",
    arrival: "11:30",
    type: "VIP 21 Cabin",
    price: "540.000đ",
    seats: 12,
  },
  {
    departure: "08:30",
    arrival: "14:30",
    type: "32 Giường",
    price: "350.000đ",
    seats: 24,
  },
  {
    departure: "22:00",
    arrival: "06:30",
    type: "34 Giường VIP",
    price: "450.000đ",
    seats: 6,
  },
];

export default function Trip() {
  return (
    <ClientLayout>
      <div>
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

        <div
          style={{
            maxWidth: 1200,
            margin: "-50px auto 40px",
            padding: "0 20px",
          }}
        >
          <Card>
            <Row gutter={16}>
              <Col span={7}>
                <Input
                  prefix={<EnvironmentOutlined />}
                  placeholder="Hà Nội"
                  size="large"
                />
              </Col>

              <Col span={7}>
                <Input
                  prefix={<EnvironmentOutlined />}
                  placeholder="Nghệ An"
                  size="large"
                />
              </Col>

              <Col span={5}>
                <DatePicker
                  style={{ width: "100%" }}
                  size="large"
                />
              </Col>

              <Col span={5}>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  size="large"
                  block
                >
                  Find Schedules
                </Button>
              </Col>
            </Row>
          </Card>
        </div>

        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 20px",
          }}
        >
          <Space wrap>
            <Text strong>Filter by Bus:</Text>

            <Button type="primary" shape="round">
              All Types
            </Button>

            <Button shape="round">
              VIP 21 Cabin
            </Button>

            <Button shape="round">
              32 Giường
            </Button>

            <Button shape="round">
              38 Giường
            </Button>
          </Space>
        </div>

        <div
          style={{
            maxWidth: 1200,
            margin: "30px auto",
            padding: "0 20px",
          }}
        >
          <Space
            direction="vertical"
            size="large"
            style={{ width: "100%" }}
          >
            {schedules.map((item, index) => (
              <Card key={index}>
                <Row align="middle">
                  <Col span={4}>
                    <Title level={3}>{item.departure}</Title>
                    <Text>Departure</Text>
                  </Col>

                  <Col span={4}>
                    <Title level={3}>{item.arrival}</Title>
                    <Text>Arrival</Text>
                  </Col>

                  <Col span={6}>
                    <Title level={5}>{item.type}</Title>

                    <Tag color="green">
                      ECO FRIENDLY
                    </Tag>
                  </Col>

                  <Col span={5}>
                    <Title
                      level={4}
                      style={{ color: "#166e00" }}
                    >
                      {item.price}
                    </Title>

                    <Text>
                      {item.seats} seats left
                    </Text>
                  </Col>

                  <Col span={5}>
                    <Button
                      type="primary"
                      size="large"
                      block
                    >
                      Select
                    </Button>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>

          <div
            style={{
              textAlign: "center",
              marginTop: 30,
            }}
          >
            <Button size="large">
              Load Later Schedules
            </Button>
          </div>
        </div>

        <div
          style={{
            background: "#f5f5f5",
            padding: "80px 0",
            marginTop: 50,
          }}
        >
          <Row
            gutter={32}
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "0 20px",
            }}
          >
            <Col span={8}>
              <Card>
                <Title level={4}>
                  Safety First
                </Title>

                <Text>
                  Over 12 Golden Steering Wheel
                  awards for safety and
                  operational excellence.
                </Text>
              </Card>
            </Col>

            <Col span={8}>
              <Card>
                <Title level={4}>
                  Eco-Friendly
                </Title>

                <Text>
                  Electric vehicles and
                  carbon-offset programs.
                </Text>
              </Card>
            </Col>

            <Col span={8}>
              <Card>
                <Title level={4}>
                  Free Transit
                </Title>

                <Text>
                  Complimentary shuttle
                  services in major cities.
                </Text>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </ClientLayout>
  );
}