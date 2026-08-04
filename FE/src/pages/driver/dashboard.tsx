import { Row, Col, Card, Typography, Button, Avatar, Badge, Progress, List, Space, Table, Tag, Modal, Input, message } from "antd";
import { BellOutlined, UserOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, LoginOutlined, ScanOutlined } from "@ant-design/icons";
import { ClientLayout } from "./layout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;

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
  const navigate = useNavigate();
  const [driverName, setDriverName] = useState("Tài xế");
  const [trips, setTrips] = useState<any[]>([]);
  const [staffId, setStaffId] = useState("");

  // Attendance state
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, any>>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Check-in state
  const [checkInModal, setCheckInModal] = useState(false);
  const [checkInOrderCode, setCheckInOrderCode] = useState("");
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInResult, setCheckInResult] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") {
      try {
        const user = JSON.parse(userStr);
        if (user.displayName) {
          setDriverName(user.displayName);
        }
        if (user.staffId) {
          setStaffId(user.staffId);
          axios.get(`http://localhost:3000/api/trip/staff/${user.staffId}`)
            .then(res => {
              if (res.data && res.data.success) {
                setTrips(res.data.data);
              }
            })
            .catch(err => console.error("Lỗi fetch trips", err));

          // Fetch attendance map
          axios.get(`http://localhost:3000/api/attendance/staff-trips/${user.staffId}`)
            .then(res => {
              if (res.data && res.data.success) {
                setAttendanceMap(res.data.data);
              }
            })
            .catch(err => console.error("Lỗi fetch attendance", err));
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

  // Attendance handlers
  const handleAttendanceCheckIn = async (tripId: string) => {
    setAttendanceLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/api/attendance/checkin", {
        staffId,
        tripId,
      });
      message.success(res.data.message || "Chấm công thành công!");
      setAttendanceMap(prev => ({
        ...prev,
        [tripId]: { status: "checked_in", checkInTime: new Date().toISOString() },
      }));
    } catch (err: any) {
      message.error(err.response?.data?.message || "Chấm công thất bại");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleAttendanceCheckOut = async (tripId: string) => {
    setAttendanceLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/api/attendance/checkout", {
        staffId,
        tripId,
      });
      message.success(res.data.message || "Check-out thành công!");
      setAttendanceMap(prev => ({
        ...prev,
        [tripId]: { ...prev[tripId], status: "checked_out", checkOutTime: new Date().toISOString() },
      }));
    } catch (err: any) {
      message.error(err.response?.data?.message || "Check-out thất bại");
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Ticket check-in handler
  const handleTicketCheckIn = async () => {
    if (!checkInOrderCode.trim()) {
      message.warning("Vui lòng nhập mã vé");
      return;
    }

    setCheckInLoading(true);
    setCheckInResult(null);
    try {
      const res = await axios.post("http://localhost:3000/api/booking/checkin", {
        orderCode: checkInOrderCode.trim(),
      });

      setCheckInResult({
        success: true,
        message: res.data.message,
        data: res.data.data,
      });
      message.success(res.data.message || "Check-in vé thành công!");
    } catch (err: any) {
      setCheckInResult({
        success: false,
        message: err.response?.data?.message || "Check-in thất bại",
      });
      message.error(err.response?.data?.message || "Check-in thất bại");
    } finally {
      setCheckInLoading(false);
    }
  };

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
      render: (_: any, record: any) => (
        <Button type="link" onClick={() => navigate(`/taixe/trip/${record._id}`)}>
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
      </Row>

      {/* Action Buttons: Chấm công + Check-in vé */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col>
          <Button
            type="primary"
            size="large"
            icon={<ClockCircleOutlined />}
            onClick={() => setAttendanceModal(true)}
            style={{
              background: "linear-gradient(135deg, #52c41a, #389e0d)",
              borderColor: "#389e0d",
              borderRadius: 12,
              height: 48,
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(82, 196, 26, 0.3)",
            }}
          >
            🕐 Chấm công
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            size="large"
            icon={<ScanOutlined />}
            onClick={() => {
              setCheckInModal(true);
              setCheckInResult(null);
              setCheckInOrderCode("");
            }}
            style={{
              background: "linear-gradient(135deg, #722ed1, #531dab)",
              borderColor: "#531dab",
              borderRadius: 12,
              height: 48,
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(114, 46, 209, 0.3)",
            }}
          >
            🎫 Check-in vé
          </Button>
        </Col>
      </Row>

      {/* Main Section */}
      <Row gutter={[24, 24]}>
        {/* Active Trips */}
        <Col xs={24}>
          <Card title={<Text strong style={{ color: "#52c41a" }}>DANH SÁCH CHUYẾN XE HÔM NAY CỦA {driverName.toUpperCase()}</Text>}>
            {todayTrips.length === 0 ? (
                <Text type="secondary">Hôm nay chưa có chuyến đi nào được phân công cho bạn.</Text>
            ) : (
                <Table 
                  dataSource={todayTrips} 
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

      {/* Attendance Modal */}
      <Modal
        title={
          <Space>
            <ClockCircleOutlined style={{ color: "#52c41a" }} />
            <span>Chấm công chuyến xe hôm nay</span>
          </Space>
        }
        open={attendanceModal}
        onCancel={() => setAttendanceModal(false)}
        footer={null}
        width={700}
      >
        {todayTrips.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Text type="secondary">Hôm nay bạn chưa có chuyến xe nào.</Text>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {todayTrips.map((trip) => {
              const att = attendanceMap[trip._id];
              const isCheckedIn = att?.status === "checked_in";
              const isCheckedOut = att?.status === "checked_out";

              // Tính thời gian còn lại đến giờ khởi hành
              const now = new Date();
              const departureTime = new Date(trip.departureTime);
              const diffMs = departureTime.getTime() - now.getTime();
              const diffMinutes = Math.floor(diffMs / (1000 * 60));

              // Điều kiện chấm công: trước giờ chạy 15 phút và xe chưa chạy
              const isTripRunning = trip.status === "đang chạy";
              const isTooEarly = diffMinutes > 15;
              const canCheckIn = !isTooEarly && !isTripRunning && !isCheckedIn && !isCheckedOut;

              // Thông báo lý do không thể chấm công
              let disabledReason = "";
              if (isTripRunning) {
                disabledReason = "🚌 Xe đang chạy, không thể chấm công";
              } else if (isTooEarly) {
                disabledReason = `⏳ Còn ${diffMinutes} phút nữa mới đến giờ khởi hành. Chỉ được chấm công trước 15 phút`;
              }

              return (
                <Card key={trip._id} size="small" style={{
                  borderLeft: isCheckedOut ? "4px solid #52c41a" : isCheckedIn ? "4px solid #1890ff" : "4px solid #d9d9d9",
                }}>
                  <Row justify="space-between" align="middle">
                    <Col flex="auto">
                      <Text strong>
                        {trip.journey?.diemDi} → {trip.journey?.diemDen}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Mã: {trip._id?.slice(-6).toUpperCase()} · Khởi hành: {new Date(trip.departureTime).toLocaleString("vi-VN")}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Xe: {trip.bus?.name || "N/A"} · Trạng thái: <Tag color={trip.status === "đang chạy" ? "green" : trip.status === "sắp chạy" ? "blue" : "default"} style={{ fontSize: 11 }}>{trip.status}</Tag>
                      </Text>
                      {att?.checkInTime && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="success" style={{ fontSize: 12 }}>
                            ✅ Check-in: {new Date(att.checkInTime).toLocaleString("vi-VN")}
                          </Text>
                        </div>
                      )}
                      {att?.checkOutTime && (
                        <div>
                          <Text style={{ fontSize: 12, color: "#722ed1" }}>
                            🏁 Check-out: {new Date(att.checkOutTime).toLocaleString("vi-VN")}
                          </Text>
                        </div>
                      )}
                      {/* Hiển thị lý do không thể chấm công */}
                      {!isCheckedIn && !isCheckedOut && disabledReason && (
                        <div style={{ marginTop: 6 }}>
                          <Text style={{ fontSize: 12, color: isTripRunning ? "#ff4d4f" : "#faad14" }}>
                            {disabledReason}
                          </Text>
                        </div>
                      )}
                    </Col>
                    <Col>
                      {isCheckedOut ? (
                        <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: 13, padding: "4px 12px" }}>
                          Hoàn thành
                        </Tag>
                      ) : isCheckedIn ? (
                        <Button
                          type="primary"
                          danger
                          icon={<LoginOutlined />}
                          loading={attendanceLoading}
                          onClick={() => handleAttendanceCheckOut(trip._id)}
                        >
                          Check-out
                        </Button>
                      ) : (
                        <Button
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          loading={attendanceLoading}
                          onClick={() => handleAttendanceCheckIn(trip._id)}
                          disabled={!canCheckIn}
                          style={canCheckIn
                            ? { background: "#52c41a", borderColor: "#52c41a" }
                            : {}
                          }
                        >
                          Check-in
                        </Button>
                      )}
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Check-in Vé Modal */}
      <Modal
        title={
          <Space>
            <ScanOutlined style={{ color: "#722ed1" }} />
            <span>Check-in vé hành khách</span>
          </Space>
        }
        open={checkInModal}
        onCancel={() => {
          setCheckInModal(false);
          setCheckInOrderCode("");
          setCheckInResult(null);
        }}
        footer={null}
        width={520}
      >
        <div style={{ padding: "16px 0" }}>
          <Text style={{ display: "block", marginBottom: 12 }}>
            Nhập mã vé (Order Code) của hành khách để xác nhận lên xe:
          </Text>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              placeholder="Nhập mã vé, ví dụ: 123456"
              value={checkInOrderCode}
              onChange={(e) => setCheckInOrderCode(e.target.value)}
              size="large"
              prefix={<ScanOutlined style={{ color: "#bfbfbf" }} />}
              onPressEnter={handleTicketCheckIn}
              style={{ borderRadius: "8px 0 0 8px" }}
            />
            <Button
              type="primary"
              size="large"
              loading={checkInLoading}
              onClick={handleTicketCheckIn}
              style={{
                background: "#722ed1",
                borderColor: "#722ed1",
                borderRadius: "0 8px 8px 0",
                fontWeight: 700,
              }}
            >
              Check-in
            </Button>
          </Space.Compact>

          {/* Check-in Result */}
          {checkInResult && (
            <Card
              size="small"
              style={{
                marginTop: 20,
                borderColor: checkInResult.success ? "#52c41a" : "#ff4d4f",
                background: checkInResult.success ? "#f6ffed" : "#fff2f0",
              }}
            >
              {checkInResult.success ? (
                <div>
                  <Space style={{ marginBottom: 8 }}>
                    <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                    <Text strong style={{ color: "#52c41a" }}>{checkInResult.message}</Text>
                  </Space>
                  {checkInResult.data && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">Mã vé: </Text>
                      <Text strong>#{checkInResult.data.orderCode}</Text>
                      <br />
                      <Text type="secondary">Ghế: </Text>
                      <Space>
                        {checkInResult.data.seats?.map((s: string) => (
                          <Tag key={s} color="blue">{s}</Tag>
                        ))}
                      </Space>
                      <br />
                      <Text type="secondary">Tổng tiền: </Text>
                      <Text strong style={{ color: "#52c41a" }}>
                        {checkInResult.data.totalPrice?.toLocaleString("vi-VN")}đ
                      </Text>
                    </div>
                  )}
                </div>
              ) : (
                <Space>
                  <span style={{ color: "#ff4d4f", fontSize: 20 }}>✗</span>
                  <Text strong style={{ color: "#ff4d4f" }}>{checkInResult.message}</Text>
                </Space>
              )}
            </Card>
          )}
        </div>
      </Modal>
    </div>
    </ClientLayout>
  );
}