import { Typography, Card, Row, Col, Button, Table, Tag, Statistic, Space, } from "antd";
import { EnvironmentOutlined, CarOutlined, DownloadOutlined, FilterOutlined, RightOutlined, } from "@ant-design/icons";
import { ClientLayout } from "./layout";


const { Title, Text, Paragraph } = Typography;

const tripData = [
  {
    key: 1,
    tripId: "#NB-9925",
    route: "Hanoi → Sapa",
    date: "Oct 24, 06:15 PM",
    bus: "E-BUS 201",
    status: "Upcoming",
  },
  {
    key: 2,
    tripId: "#NB-9810",
    route: "Da Nang → Hue",
    date: "Oct 22, 10:00 AM",
    bus: "E-BUS 115",
    status: "Completed",
  },
  {
    key: 3,
    tripId: "#NB-9755",
    route: "HCM City → Can Tho",
    date: "Oct 21, 02:30 PM",
    bus: "E-BUS 505",
    status: "Completed",
  },
  {
    key: 4,
    tripId: "#NB-9701",
    route: "Hanoi → Hai Phong",
    date: "Oct 20, 09:00 AM",
    bus: "E-BUS 202",
    status: "Completed",
  },
];

export default function ListTaixePage() {
  const columns = [
    {
      title: "Trip ID",
      dataIndex: "tripId",
    },
    {
      title: "Route",
      dataIndex: "route",
    },
    {
      title: "Date & Time",
      dataIndex: "date",
    },
    {
      title: "Bus No.",
      dataIndex: "bus",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) =>
        status === "Upcoming" ? (
          <Tag color="green">{status}</Tag>
        ) : (
          <Tag>{status}</Tag>
        ),
    },
    {
      title: "Actions",
      render: () => (
        <Button type="link">
          View Details
        </Button>
      ),
    },
  ];

  return (
    <ClientLayout>
    <div style={{ padding: "32px 0" }}>
      {/* Welcome */}
      <div style={{ marginBottom: 40 }}>
        <Title level={1}>My Trips</Title>

        <Paragraph type="secondary">
          Manage your assigned routes and monitor fleet sustainability goals.
        </Paragraph>
      </div>

      {/* Current Mission */}
      <Card
        style={{
          marginBottom: 40,
          border: "2px solid #52c41a",
        }}
      >
        <Row
          justify="space-between"
          align="middle"
          gutter={[24, 24]}
        >
          <Col flex="auto">
            <Space direction="vertical" size="middle">
              <Tag color="green">
                IN PROGRESS
              </Tag>

              <Text type="secondary">
                TRIP ID: #NB-9921
              </Text>

              <Title level={2}>
                Hanoi
                <RightOutlined
                  style={{ margin: "0 12px" }}
                />
                Nghe An
              </Title>

              <Row gutter={32}>
                <Col>
                  <Text type="secondary">
                    Departure
                  </Text>
                  <br />
                  <strong>
                    Today, 08:30 AM
                  </strong>
                </Col>

                <Col>
                  <Text type="secondary">
                    Bus Number
                  </Text>
                  <br />
                  <strong>E-BUS 402</strong>
                </Col>

                <Col>
                  <Text type="secondary">
                    Eco Impact
                  </Text>
                  <br />
                  <span
                    style={{
                      color: "#52c41a",
                      fontWeight: 600,
                    }}
                  >
                    12kg CO₂ Saved
                  </span>
                </Col>
              </Row>
            </Space>
          </Col>

          <Col>
            <Button
              type="primary"
              size="large"
              icon={<EnvironmentOutlined />}
            >
              Resume Navigation
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card
        title="Upcoming & Past Trips"
        extra={
          <Space>
            <Button icon={<FilterOutlined />} />
            <Button icon={<DownloadOutlined />} />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={tripData}
          pagination={{
            pageSize: 4,
          }}
        />
      </Card>

      {/* Statistics */}
      <Row
        gutter={[24, 24]}
        style={{ marginTop: 40 }}
      >
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Driver Performance"
              value={98.2}
              suffix="%"
            />
            <Text type="secondary">
              On-time
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Carbon Avoided"
              value={420}
              suffix="kg"
            />
            <Text type="secondary">
              This Month
            </Text>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Passengers Served"
              value={1204}
              prefix={<CarOutlined />}
            />
            <Text type="secondary">
              Travelers
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
    </ClientLayout>
  );
}
