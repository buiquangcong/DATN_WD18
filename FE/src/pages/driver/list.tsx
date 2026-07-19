import {Typography,Card,Row,Col,Button,Table,Tag,Statistic,Space,Spin,} from "antd";
import {EnvironmentOutlined,CarOutlined,DownloadOutlined,FilterOutlined,RightOutlined,} from "@ant-design/icons";
import { ClientLayout } from "./layout";
import { useEffect, useState } from "react";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;

<<<<<<< HEAD
// Thay bằng _id của staff trong MongoDB
const STAFF_ID = "6a39a1b27d903a00d9d0b493";

=======
>>>>>>> main
interface Trip {
  _id: string;
  departureTime: string;
  arrivalTime: string;
  status: string;

  journey: {
    diemDi: string;
    diemDen: string;
  };

  bus: {
    name: string;
  };
}

export default function ListTaixePage() {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);

<<<<<<< HEAD
  useEffect(() => {
    axios
      .get( `http://localhost:3000/api/trip/staff/${STAFF_ID}` )
      .then((res) => {
        setTrips(res.data.data);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const currentTrip =
    trips.find((item) => item.status === "đang chạy") ||
    trips[0];

  const columns = [
    {
      title: "Mã chuyến",
      render: (_: any, record: Trip) =>
        record._id.slice(-6).toUpperCase(),
    },
    {
      title: "Tuyến đường",
      render: (_: any, record: Trip) =>
        `${record.journey?.diemDi} → ${record.journey?.diemDen}`,
    },
    {
      title: "Khởi hành",
      render: (_: any, record: Trip) =>
        new Date(record.departureTime).toLocaleString("vi-VN"),
    },
    {
      title: "Xe",
      render: (_: any, record: Trip) =>
        record.bus?.name,
    },
    {
      title: "Trạng thái",
      render: (_: any, record: Trip) => {
        let color = "default";

        if (record.status === "sắp chạy") color = "blue";
        if (record.status === "đang chạy") color = "green";
        if (record.status === "hoàn thành") color = "cyan";
        if (record.status === "huỷ") color = "red";

        return (
          <Tag color={color}>
            {record.status}
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

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex justify-center items-center h-[500px]">
          <Spin size="large" />
        </div>
      </ClientLayout>
    );
  }
    return (
    <ClientLayout>
      <div style={{ padding: "32px 0" }}>
        {/* Welcome */}
        <div style={{ marginBottom: 40 }}>
          <Title level={1}>Chuyến xe của tôi</Title>

          <Paragraph type="secondary">
            Theo dõi các chuyến xe được phân công.
          </Paragraph>
        </div>

        {/* Current Trip */}
        <Card
          style={{
            marginBottom: 40,
            border: "2px solid #52c41a",
            borderRadius: 12,
          }}
        >
          {currentTrip ? (
            <Row justify="space-between" align="middle" gutter={[24, 24]}>
              <Col flex="auto">
                <Space direction="vertical" size="middle">
                  <Tag color="green">
                    {currentTrip.status.toUpperCase()}
                  </Tag>

                  <Text type="secondary">
                    Mã chuyến: {currentTrip._id.slice(-6).toUpperCase()}
                  </Text>

                  <Title level={2}>
                    {currentTrip.journey?.diemDi}

                    <RightOutlined
                      style={{
                        margin: "0 12px",
                      }}
                    />

                    {currentTrip.journey?.diemDen}
                  </Title>

=======

  useEffect(() => {
    let currentStaffId = "";
    try {
      const userStr = localStorage.getItem("user");
      if (userStr && userStr !== "undefined") {
        const user = JSON.parse(userStr);
        currentStaffId = user.staffId;
      }
    } catch (e) {
      console.error("Lỗi parse user info", e);
    }

    if (!currentStaffId) {
      setLoading(false);
      return;
    }

    axios
      .get(`http://localhost:3000/api/trip/staff/${currentStaffId}`)
      .then((res) => {
        setTrips(res.data.data);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const currentTrip =
    trips.find((item) => item.status === "đang chạy") ||
    trips[0];

  const columns = [
    {
      title: "Mã chuyến",
      render: (_: any, record: Trip) =>
        record._id.slice(-6).toUpperCase(),
    },
    {
      title: "Tuyến đường",
      render: (_: any, record: Trip) =>
        `${record.journey?.diemDi} → ${record.journey?.diemDen}`,
    },
    {
      title: "Khởi hành",
      render: (_: any, record: Trip) =>
        new Date(record.departureTime).toLocaleString("vi-VN"),
    },
    {
      title: "Xe",
      render: (_: any, record: Trip) =>
        record.bus?.name,
    },
    {
      title: "Trạng thái",
      render: (_: any, record: Trip) => {
        let color = "default";

        if (record.status === "sắp chạy") color = "blue";
        if (record.status === "đang chạy") color = "green";
        if (record.status === "hoàn thành") color = "cyan";
        if (record.status === "huỷ") color = "red";

        return (
          <Tag color={color}>
            {record.status}
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

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex justify-center items-center h-[500px]">
          <Spin size="large" />
        </div>
      </ClientLayout>
    );
  }
    return (
    <ClientLayout>
      <div style={{ padding: "32px 0" }}>
        {/* Welcome */}
        <div style={{ marginBottom: 40 }}>
          <Title level={1}>Chuyến xe của tôi</Title>

          <Paragraph type="secondary">
            Theo dõi các chuyến xe được phân công.
          </Paragraph>
        </div>

        {/* Current Trip */}
        <Card
          style={{
            marginBottom: 40,
            border: "2px solid #52c41a",
            borderRadius: 12,
          }}
        >
          {currentTrip ? (
            <Row justify="space-between" align="middle" gutter={[24, 24]}>
              <Col flex="auto">
                <Space direction="vertical" size="middle">
                  <Tag color="green">
                    {currentTrip.status.toUpperCase()}
                  </Tag>

                  <Text type="secondary">
                    Mã chuyến: {currentTrip._id.slice(-6).toUpperCase()}
                  </Text>

                  <Title level={2}>
                    {currentTrip.journey?.diemDi}

                    <RightOutlined
                      style={{
                        margin: "0 12px",
                      }}
                    />

                    {currentTrip.journey?.diemDen}
                  </Title>

>>>>>>> main
                  <Row gutter={32}>
                    <Col>
                      <Text type="secondary">
                        Khởi hành
                      </Text>
                      <br />

                      <strong>
                        {new Date(
                          currentTrip.departureTime
                        ).toLocaleString("vi-VN")}
                      </strong>
                    </Col>

                    <Col>
                      <Text type="secondary">
                        Đến nơi
                      </Text>
                      <br />

                      <strong>
                        {new Date(
                          currentTrip.arrivalTime
                        ).toLocaleString("vi-VN")}
                      </strong>
                    </Col>

                    <Col>
                      <Text type="secondary">
                        Biển số xe
                      </Text>
                      <br />

                      <strong>
                        {currentTrip.bus?.name}
                      </strong>
                    </Col>
                  </Row>
                </Space>
              </Col>

              <Col>
                <Button
                  type="primary"
                  icon={<EnvironmentOutlined />}
                  size="large"
                >
                  Xem chi tiết
                </Button>
              </Col>
            </Row>
          ) : (
            <div className="text-center py-10">
              Không có chuyến xe nào
            </div>
          )}
        </Card>

        {/* Danh sách chuyến */}
        <Card
          title="Danh sách chuyến xe"
          extra={
            <Space>
              <Button icon={<FilterOutlined />} />
              <Button icon={<DownloadOutlined />} />
            </Space>
          }
        >
          <Table
            loading={loading}
            columns={columns}
            dataSource={trips}
            rowKey="_id"
            pagination={{
              pageSize: 5,
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
                title="Tổng chuyến"
                value={trips.length}
              />
              <Text type="secondary">
                Được phân công
              </Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Đang chạy"
                value={
                  trips.filter(
                    (item) =>
                      item.status === "đang chạy"
                  ).length
                }
              />
              <Text type="secondary">
                Hiện tại
              </Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Hoàn thành"
                value={
                  trips.filter(
                    (item) =>
                      item.status === "hoàn thành"
                  ).length
                }
                prefix={<CarOutlined />}
              />
              <Text type="secondary">
                Tổng chuyến
              </Text>
            </Card>
          </Col>
        </Row>
      </div>
    </ClientLayout>
  );
}
