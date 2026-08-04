import { Typography, Card, Row, Col, Button, Table, Tag, Space, Spin, Modal, Input, Descriptions, Badge, message, Divider, Tooltip } from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  PhoneOutlined,
  CarOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { ClientLayout } from "./layout";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;

interface Booking {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  seats: string[];
  totalPrice: number;
  orderCode: number;
  status: string;
  createdAt: string;
}

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [checkInModal, setCheckInModal] = useState(false);
  const [checkInOrderCode, setCheckInOrderCode] = useState("");
  const [checkInLoading, setCheckInLoading] = useState(false);

  useEffect(() => {
    if (!tripId) return;

    const fetchData = async () => {
      try {
        const [tripRes, bookingRes] = await Promise.all([
          axios.get(`http://localhost:3000/api/trip/${tripId}`),
          axios.get(`http://localhost:3000/api/booking/trip/${tripId}`),
        ]);

        setTrip(tripRes.data);
        setBookings(bookingRes.data.data || []);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        message.error("Không thể tải thông tin chuyến xe");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tripId]);

  const handleCheckIn = async () => {
    if (!checkInOrderCode.trim()) {
      message.warning("Vui lòng nhập mã vé");
      return;
    }

    setCheckInLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/api/booking/checkin", {
        orderCode: checkInOrderCode.trim(),
      });

      message.success(res.data.message || "Check-in thành công!");
      setCheckInModal(false);
      setCheckInOrderCode("");

      // Reload bookings
      const bookingRes = await axios.get(`http://localhost:3000/api/booking/trip/${tripId}`);
      setBookings(bookingRes.data.data || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || "Check-in thất bại");
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleQuickCheckIn = async (orderCode: number) => {
    try {
      const res = await axios.post("http://localhost:3000/api/booking/checkin", {
        orderCode,
      });

      message.success(res.data.message || "Check-in thành công!");

      // Reload bookings
      const bookingRes = await axios.get(`http://localhost:3000/api/booking/trip/${tripId}`);
      setBookings(bookingRes.data.data || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || "Check-in thất bại");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Đã xác nhận": return "green";
      case "Đã check-in": return "blue";
      case "Chờ xác nhận": return "orange";
      case "Đã huỷ": return "red";
      default: return "default";
    }
  };

  const getTripStatusColor = (status: string) => {
    switch (status) {
      case "sắp chạy": return "blue";
      case "đang chạy": return "green";
      case "hoàn thành": return "cyan";
      case "huỷ": return "red";
      default: return "default";
    }
  };

  const bookingColumns = [
    {
      title: "Mã vé",
      dataIndex: "orderCode",
      key: "orderCode",
      render: (code: number) => (
        <Text strong style={{ color: "#1890ff" }}>#{code}</Text>
      ),
    },
    {
      title: "Hành khách",
      key: "user",
      render: (_: any, record: Booking) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            <UserOutlined style={{ marginRight: 4 }} />
            {record.user?.username || record.user?.email || "N/A"}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.user?.email || ""}
          </Text>
        </Space>
      ),
    },
    {
      title: "Ghế đã đặt",
      dataIndex: "seats",
      key: "seats",
      render: (seats: string[]) => (
        <Space wrap>
          {seats.map((seat) => (
            <Tag key={seat} color="geekblue">{seat}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          {price?.toLocaleString("vi-VN")}đ
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={
          status === "Đã check-in" ? <CheckCircleOutlined /> :
          status === "Đã huỷ" ? <CloseCircleOutlined /> : undefined
        }>
          {status}
        </Tag>
      ),
    },
    {
      title: "Thời gian đặt",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: Booking) => {
        if (record.status === "Đã xác nhận") {
          return (
            <Tooltip title="Check-in vé này">
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleQuickCheckIn(record.orderCode)}
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
              >
                Check-in
              </Button>
            </Tooltip>
          );
        }
        if (record.status === "Đã check-in") {
          return (
            <Tag color="blue" icon={<CheckCircleOutlined />}>
              Đã lên xe
            </Tag>
          );
        }
        return <Text type="secondary">—</Text>;
      },
    },
  ];

  // Seat map rendering
  const renderSeatMap = () => {
    if (!trip?.seats?.length) return <Text type="secondary">Không có dữ liệu ghế</Text>;

    const maxFloor = Math.max(...trip.seats.map((s: any) => s.floor || 1));
    const floors = [];

    for (let floor = 1; floor <= maxFloor; floor++) {
      const floorSeats = trip.seats.filter((s: any) => (s.floor || 1) === floor);
      const maxRow = Math.max(...floorSeats.map((s: any) => s.rowIndex));
      const maxCol = Math.max(...floorSeats.map((s: any) => s.colIndex));

      const grid = [];
      for (let r = 0; r <= maxRow; r++) {
        const row = [];
        for (let c = 0; c <= maxCol; c++) {
          const seat = floorSeats.find((s: any) => s.rowIndex === r && s.colIndex === c);
          row.push(seat);
        }
        grid.push(row);
      }

      floors.push(
        <div key={floor} style={{ marginBottom: 16 }}>
          {maxFloor > 1 && (
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Tầng {floor}
            </Text>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            {grid.map((row, ri) => (
              <div key={ri} style={{ display: "flex", gap: 6 }}>
                {row.map((seat: any, ci: number) => {
                  if (!seat) {
                    return <div key={ci} style={{ width: 44, height: 44 }} />;
                  }

                  let bgColor = "#f0f0f0";
                  let textColor = "#333";
                  let borderColor = "#d9d9d9";

                  if (seat.status === "BOOKED") {
                    bgColor = "#ff4d4f";
                    textColor = "#fff";
                    borderColor = "#ff4d4f";
                  } else if (seat.status === "HOLDING") {
                    bgColor = "#faad14";
                    textColor = "#fff";
                    borderColor = "#faad14";
                  } else {
                    bgColor = "#52c41a";
                    textColor = "#fff";
                    borderColor = "#52c41a";
                  }

                  return (
                    <Tooltip key={ci} title={`${seat.seatCode} - ${seat.status}`}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          background: bgColor,
                          color: textColor,
                          border: `2px solid ${borderColor}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "default",
                        }}
                      >
                        {seat.seatCode}
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div>
        {floors}
        <Divider />
        <Space size="large">
          <Space>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: "#52c41a" }} />
            <Text type="secondary">Trống</Text>
          </Space>
          <Space>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: "#ff4d4f" }} />
            <Text type="secondary">Đã đặt</Text>
          </Space>
          <Space>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: "#faad14" }} />
            <Text type="secondary">Đang giữ</Text>
          </Space>
        </Space>
      </div>
    );
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex justify-center items-center h-[500px]">
          <Spin size="large" />
        </div>
      </ClientLayout>
    );
  }

  if (!trip) {
    return (
      <ClientLayout>
        <div style={{ padding: "32px 0", textAlign: "center" }}>
          <Title level={3}>Không tìm thấy chuyến xe</Title>
          <Button type="primary" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
      </ClientLayout>
    );
  }

  const totalBookedSeats = trip.seats?.filter((s: any) => s.status === "BOOKED").length || 0;
  const totalSeats = trip.seats?.length || 0;
  const confirmedBookings = bookings.filter((b) => b.status === "Đã xác nhận" || b.status === "Đã check-in");

  return (
    <ClientLayout>
      <div style={{ padding: "32px 0" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ marginBottom: 16 }}
          >
            Quay lại
          </Button>

          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ marginBottom: 0 }}>
                Chi tiết chuyến xe
              </Title>
              <Text type="secondary">
                Mã chuyến: <Text strong>{trip._id?.slice(-6).toUpperCase()}</Text>
              </Text>
            </Col>

            <Col>
              <Space>
                <Tag color={getTripStatusColor(trip.status)} style={{ fontSize: 14, padding: "4px 16px" }}>
                  {trip.status?.toUpperCase()}
                </Tag>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setCheckInModal(true)}
                  style={{ background: "#722ed1", borderColor: "#722ed1" }}
                >
                  Check-in vé
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Trip Information */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <EnvironmentOutlined style={{ color: "#52c41a" }} />
                  <Text strong>Thông tin chuyến xe</Text>
                </Space>
              }
              style={{ height: "100%" }}
            >
              <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                <Descriptions.Item label="Tuyến đường">
                  <Text strong>
                    {trip.journey?.diemDi} → {trip.journey?.diemDen}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Khoảng cách">
                  {trip.journey?.khoangCach || "N/A"} km
                </Descriptions.Item>
                <Descriptions.Item label="Khởi hành">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {new Date(trip.departureTime).toLocaleString("vi-VN")}
                </Descriptions.Item>
                <Descriptions.Item label="Đến nơi">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {new Date(trip.arrivalTime).toLocaleString("vi-VN")}
                </Descriptions.Item>
                <Descriptions.Item label="Xe">
                  <CarOutlined style={{ marginRight: 4 }} />
                  {trip.bus?.name || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Giá vé">
                  <Text strong style={{ color: "#52c41a" }}>
                    {trip.ticketPrice?.toLocaleString("vi-VN")}đ
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tài xế">
                  <UserOutlined style={{ marginRight: 4 }} />
                  {trip.staff?.ten || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="SĐT tài xế">
                  <PhoneOutlined style={{ marginRight: 4 }} />
                  {trip.staff?.sdt || "N/A"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Thống kê nhanh" style={{ height: "100%" }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card
                    size="small"
                    style={{ textAlign: "center", background: "#f6ffed", borderColor: "#b7eb8f" }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>Ghế đã đặt</Text>
                    <Title level={3} style={{ margin: 0, color: "#52c41a" }}>
                      {totalBookedSeats}/{totalSeats}
                    </Title>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card
                    size="small"
                    style={{ textAlign: "center", background: "#e6f7ff", borderColor: "#91d5ff" }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>Đơn đặt vé</Text>
                    <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
                      {bookings.length}
                    </Title>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card
                    size="small"
                    style={{ textAlign: "center", background: "#f9f0ff", borderColor: "#d3adf7" }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>Đã check-in</Text>
                    <Title level={3} style={{ margin: 0, color: "#722ed1" }}>
                      {bookings.filter((b) => b.status === "Đã check-in").length}
                    </Title>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card
                    size="small"
                    style={{ textAlign: "center", background: "#fff7e6", borderColor: "#ffd591" }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>Doanh thu</Text>
                    <Title level={4} style={{ margin: 0, color: "#fa8c16" }}>
                      {confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0).toLocaleString("vi-VN")}đ
                    </Title>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Seat Map */}
        <Card
          title={
            <Space>
              <InfoCircleOutlined style={{ color: "#1890ff" }} />
              <Text strong>Sơ đồ ghế</Text>
            </Space>
          }
          style={{ marginBottom: 32 }}
        >
          {renderSeatMap()}
        </Card>

        {/* Bookings Table */}
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: "#722ed1" }} />
              <Text strong>Danh sách hành khách ({bookings.length})</Text>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setCheckInModal(true)}
              style={{ background: "#722ed1", borderColor: "#722ed1" }}
            >
              Check-in vé
            </Button>
          }
        >
          <Table
            dataSource={bookings}
            columns={bookingColumns}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 900 }}
            locale={{ emptyText: "Chưa có hành khách nào đặt vé cho chuyến này" }}
          />
        </Card>

        {/* Check-in Modal */}
        <Modal
          title={
            <Space>
              <CheckCircleOutlined style={{ color: "#722ed1" }} />
              <span>Check-in vé hành khách</span>
            </Space>
          }
          open={checkInModal}
          onCancel={() => {
            setCheckInModal(false);
            setCheckInOrderCode("");
          }}
          onOk={handleCheckIn}
          confirmLoading={checkInLoading}
          okText="Xác nhận Check-in"
          cancelText="Huỷ"
          okButtonProps={{ style: { background: "#722ed1", borderColor: "#722ed1" } }}
        >
          <div style={{ padding: "16px 0" }}>
            <Text style={{ display: "block", marginBottom: 12 }}>
              Nhập mã vé (Order Code) của hành khách để xác nhận lên xe:
            </Text>
            <Input
              placeholder="Nhập mã vé, ví dụ: 123456"
              value={checkInOrderCode}
              onChange={(e) => setCheckInOrderCode(e.target.value)}
              size="large"
              prefix={<CheckCircleOutlined style={{ color: "#bfbfbf" }} />}
              onPressEnter={handleCheckIn}
              style={{ borderRadius: 8 }}
            />
          </div>
        </Modal>
      </div>
    </ClientLayout>
  );
}
