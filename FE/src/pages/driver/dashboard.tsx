import { Row, Col, Card, Typography, Button, Avatar, Badge, Progress, List, Space, Table, Tag, Modal, Input, message, Select } from "antd";
import { BellOutlined, UserOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, LoginOutlined, ScanOutlined, QrcodeOutlined } from "@ant-design/icons";
import { ClientLayout } from "./layout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Html5Qrcode } from "html5-qrcode";
import dayjs from "dayjs";

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

  // QR Scan check-in states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [scannedBooking, setScannedBooking] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [html5QrCodeInstance, setHtml5QrCodeInstance] = useState<Html5Qrcode | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [activeTripForScan, setActiveTripForScan] = useState<any | null>(null);

  // Check-in option modal states
  const [isCheckInOptionModalOpen, setIsCheckInOptionModalOpen] = useState(false);
  const [activeTripForOption, setActiveTripForOption] = useState<any | null>(null);

  // Customer List states
  const [isCustomerListOpen, setIsCustomerListOpen] = useState(false);
  const [selectedTripForList, setSelectedTripForList] = useState<any | null>(null);
  const [tripBookings, setTripBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const loadTrips = async (sId: string) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/trip/staff/${sId}`);
      if (res.data && res.data.success) {
        setTrips(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi fetch trips", err);
    }
  };

  const loadAttendance = async (sId: string) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/attendance/staff-trips/${sId}`);
      if (res.data && res.data.success) {
        setAttendanceMap(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi fetch attendance", err);
    }
  };

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
          loadTrips(user.staffId);
          loadAttendance(user.staffId);
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
      if (staffId) {
        loadTrips(staffId);
      }
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

  const playBeep = (isError = false) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(isError ? 220 : 800, audioCtx.currentTime); // low pitch for error, high for success
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (isError ? 0.3 : 0.15));

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + (isError ? 0.3 : 0.15));
    } catch (e) {
      console.error("Audio Context beep failed", e);
    }
  };

  const handleScanSuccess = async (decodedText: string, instance: Html5Qrcode) => {
    let bookingId = decodedText.trim();
    if (decodedText.includes("Mã vé:")) {
      const match = decodedText.match(/Mã vé:\s*([^\n\r]+)/);
      if (match && match[1]) {
        bookingId = match[1].trim();
      }
    }

    try {
      let bookingData: any = null;
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(bookingId);
      
      if (isObjectId) {
        const res = await axios.get(`http://localhost:3000/api/booking/${bookingId}`);
        bookingData = res.data;
      } else {
        const bookingsRes = await axios.get("http://localhost:3000/api/booking");
        const allBookings = bookingsRes.data || [];
        bookingData = allBookings.find((b: any) => String(b.orderCode) === bookingId);
      }

      if (!bookingData) {
        playBeep(true);
        message.error("Không tìm thấy thông tin vé!");
        return;
      }

      const bookingTripId = bookingData.trip?._id || bookingData.trip;

      let targetTrip = activeTripForScan;
      if (!targetTrip) {
        targetTrip = todayTrips.find((t) => String(t._id) === String(bookingTripId));
      }

      if (!targetTrip) {
        playBeep(true);
        message.error("Vé không thuộc chuyến xe nào của bạn hôm nay!");
        return;
      }

      if (String(bookingTripId) !== String(targetTrip._id)) {
        playBeep(true);
        const journeyDi = bookingData.trip?.journey?.diemDi || "Chưa rõ";
        const journeyDen = bookingData.trip?.journey?.diemDen || "Chưa rõ";
        const departureTime = bookingData.trip?.departureTime 
          ? new Date(bookingData.trip.departureTime).toLocaleString("vi-VN") 
          : "Chưa rõ";

        Modal.error({
          title: "Sai chuyến xe!",
          content: (
            <div>
              <p className="font-semibold text-red-600">Khách hàng đã quét nhầm vé của chuyến xe khác!</p>
              <p className="mt-2">Hành trình vé này: <strong>{journeyDi} → {journeyDen}</strong></p>
              <p>Giờ khởi hành: <strong>{departureTime}</strong></p>
            </div>
          ),
          okText: "Đã hiểu"
        });
        return;
      }

      if (targetTrip.status === "hoàn thành" || targetTrip.status === "Hoàn thành") {
        playBeep(true);
        message.error("Chuyến xe đã hoàn thành, không thể check-in!");
        return;
      }

      if (targetTrip.departureTime) {
        const now = dayjs();
        const departure = dayjs(targetTrip.departureTime);
        const diffMinutes = now.diff(departure, "minute");

        if (diffMinutes < -15 || diffMinutes > 15) {
          playBeep(true);
          message.error("Chỉ được phép check-in trong khoảng từ 15 phút trước đến 15 phút sau giờ xe chạy!");
          return;
        }
      }

      if (bookingData.status === "Đã check-in" || bookingData.status === "Đã checkin" || bookingData.status === "Hoàn thành") {
        playBeep(true);
        message.error("Vé này đã được check-in trước đó!");
        return;
      }

      if (bookingData.status === "Đã huỷ") {
        playBeep(true);
        message.error("Vé này đã bị hủy trên hệ thống!");
        return;
      }

      if (bookingData.status === "Chờ xác nhận") {
        playBeep(true);
        message.error("Vé này chưa được xác nhận thanh toán!");
        return;
      }

      await stopScanner(instance);
      
      await axios.put(`http://localhost:3000/api/booking/update/${bookingData._id}`, {
        status: "Đã check-in"
      });

      playBeep();
      setTimeout(playBeep, 150);

      message.success(`Tự động Check-in thành công cho khách hàng ${bookingData.user?.username || "NETBUS"}!`);

      if (staffId) {
        loadTrips(staffId);
      }
      
      setIsScannerOpen(false);
    } catch (err) {
      console.error("Lỗi quét hoặc check-in vé:", err);
      playBeep(true);
      message.error("Quét vé thất bại. Vé không hợp lệ hoặc lỗi kết nối!");
    }
  };

  const startScanner = async (cameraId: string) => {
    if (!cameraId) return;
    try {
      setIsScanning(true);
      setTimeout(async () => {
        try {
          const instance = new Html5Qrcode("driver-qr-reader");
          setHtml5QrCodeInstance(instance);
          await instance.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
            },
            (decodedText) => {
              handleScanSuccess(decodedText, instance);
            },
            () => {}
          );
        } catch (err: any) {
          console.error("Lỗi khi start camera:", err);
          message.error("Không thể kích hoạt camera: " + err.message);
          setIsScanning(false);
        }
      }, 300);
    } catch (err: any) {
      console.error(err);
      setIsScanning(false);
    }
  };

  const stopScanner = async (instance?: Html5Qrcode | null) => {
    const activeInstance = instance || html5QrCodeInstance;
    if (activeInstance && activeInstance.isScanning) {
      try {
        await activeInstance.stop();
        setHtml5QrCodeInstance(null);
      } catch (err) {
        console.error("Lỗi khi dừng camera:", err);
      }
    }
    setIsScanning(false);
  };

  const handleCloseScanner = async () => {
    await stopScanner();
    setIsScannerOpen(false);
    setScannedBooking(null);
  };

  const handleCameraChange = async (value: string) => {
    setSelectedCameraId(value);
    await stopScanner();
    startScanner(value);
  };

  useEffect(() => {
    let isCurrent = true;
    if (isScannerOpen) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (!isCurrent) return;
          if (devices && devices.length > 0) {
            setCameras(devices);
            const backCamera = devices.find((device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("environment") ||
              device.label.toLowerCase().includes("sau")
            );
            const defaultId = backCamera ? backCamera.id : devices[0].id;
            setSelectedCameraId(defaultId);
            startScanner(defaultId);
          } else {
            message.error("Không tìm thấy camera khả dụng!");
          }
        })
        .catch((err) => {
          if (!isCurrent) return;
          console.error("Lỗi lấy danh sách camera:", err);
          message.error("Vui lòng cấp quyền truy cập camera!");
        });
    } else {
      stopScanner();
    }
    return () => {
      isCurrent = false;
      stopScanner();
    };
  }, [isScannerOpen]);

  const fetchTripBookings = async (tripId: string) => {
    if (!tripId) return;
    setBookingsLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/booking/trip/${tripId}`);
      setTripBookings(res.data.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách khách đặt:", err);
      message.error("Không thể tải danh sách khách đặt vé!");
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleOpenCustomerList = async (trip: any) => {
    setSelectedTripForList(trip);
    setIsCustomerListOpen(true);
    await fetchTripBookings(trip._id);
  };

  const handleDirectCheckin = async (bookingId: string, customerName: string, trip: any) => {
    if (trip.status === "hoàn thành" || trip.status === "Hoàn thành") {
      playBeep(true);
      message.error("Chuyến xe đã hoàn thành, không thể check-in!");
      return;
    }

    if (trip.departureTime) {
      const now = dayjs();
      const departure = dayjs(trip.departureTime);
      const diffMinutes = now.diff(departure, "minute");

      if (diffMinutes < -15 || diffMinutes > 15) {
        playBeep(true);
        message.error("Chỉ được phép check-in trong khoảng từ 15 phút trước đến 15 phút sau giờ xe chạy!");
        return;
      }
    }

    try {
      await axios.put(`http://localhost:3000/api/booking/update/${bookingId}`, {
        status: "Đã check-in"
      });

      playBeep();
      setTimeout(playBeep, 150);

      message.success(`Check-in thành công cho khách hàng ${customerName}!`);

      if (staffId) {
        loadTrips(staffId);
      }
      await fetchTripBookings(trip._id);
    } catch (error: any) {
      console.error("Lỗi check-in:", error);
      message.error(error.response?.data?.message || "Check-in thất bại!");
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
      title: "Số ghế",
      render: (_: any, record: any) => {
        const booked = record.seats?.filter((seat: any) => seat.status === "BOOKED").length || 0;
        const total = record.seats?.length || 0;
        return (
          <Tag
            color="blue"
            className="cursor-pointer hover:opacity-75 font-semibold"
            onClick={() => handleOpenCustomerList(record)}
          >
            {booked}/{total}
          </Tag>
        );
      },
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
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<ScanOutlined />}
            onClick={() => {
              setActiveTripForOption(record);
              setIsCheckInOptionModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-md text-xs font-semibold flex items-center"
          >
            Check-in vé
          </Button>
          <Button type="link" onClick={() => navigate(`/taixe/trip/${record._id}`)}>
            Chi tiết
          </Button>
        </Space>
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
                disabledReason = `Chỉ được chấm công trước 15 phút`;
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
          <Button
            type="primary"
            icon={<QrcodeOutlined />}
            onClick={() => {
              setCheckInModal(false);
              setActiveTripForScan(null);
              setIsScannerOpen(true);
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 border-none rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-xs mb-4"
            style={{ height: 40 }}
          >
            Quét QR Code bằng Camera
          </Button>

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

      {/* Style CSS cho hiệu ứng quét camera */}
      <style>{`
        #driver-qr-reader {
          width: 100% !important;
          border: none !important;
          border-radius: 12px;
          overflow: hidden;
        }
        #driver-qr-reader video {
          border-radius: 12px;
          object-fit: cover !important;
        }
        .scanner-container {
          position: relative;
          width: 100%;
          max-width: 300px;
          height: 300px;
          margin: 10px auto;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          background: #000;
        }
        .scanner-overlay {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(34, 197, 94, 0.15);
          border-radius: 16px;
          pointer-events: none;
          z-index: 10;
        }
        .scanner-laser {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(to right, transparent, #22c55e, transparent);
          box-shadow: 0 0 6px 2px rgba(34, 197, 94, 0.5);
          animation: scan 2.5s linear infinite;
          z-index: 11;
        }
        .scanner-corner {
          position: absolute;
          width: 16px;
          height: 16px;
          border-color: #22c55e;
          border-style: solid;
          z-index: 12;
        }
        .scanner-corner-tl { top: 20px; left: 20px; border-width: 3px 0 0 3px; border-top-left-radius: 6px; }
        .scanner-corner-tr { top: 20px; right: 20px; border-width: 3px 3px 0 0; border-top-right-radius: 6px; }
        .scanner-corner-bl { bottom: 20px; left: 20px; border-width: 0 0 3px 3px; border-bottom-left-radius: 6px; }
        .scanner-corner-br { bottom: 20px; right: 20px; border-width: 0 3px 3px 0; border-bottom-right-radius: 6px; }
        @keyframes scan {
          0% { top: 20px; }
          50% { top: 280px; }
          100% { top: 20px; }
        }
      `}</style>

      {/* Modal Quét QR Code để checkin vé */}
      <Modal
        open={isScannerOpen}
        title={
          <Space className="text-gray-800">
            <QrcodeOutlined className="text-emerald-600 text-lg" />
            <span className="font-bold text-lg">Quét QR Check-in Hành Khách</span>
          </Space>
        }
        onCancel={handleCloseScanner}
        footer={null}
        width={480}
        destroyOnClose
        centered
        className="rounded-2xl"
      >
        <div className="space-y-4 pt-2 flex flex-col items-center">
          {cameras.length > 0 && (
            <div className="w-full space-y-1">
              <label className="text-xs text-gray-500 font-medium">Chọn Thiết Bị Camera:</label>
              <Select
                className="w-full"
                size="large"
                value={selectedCameraId}
                onChange={handleCameraChange}
                options={cameras.map((cam) => ({
                  value: cam.id,
                  label: cam.label || `Camera ${cameras.indexOf(cam) + 1}`,
                }))}
              />
            </div>
          )}

          <div className="scanner-container">
            <div id="driver-qr-reader" className="w-full h-full"></div>
            {isScanning && (
              <>
                <div className="scanner-overlay"></div>
                <div className="scanner-laser"></div>
                <div className="scanner-corner scanner-corner-tl"></div>
                <div className="scanner-corner scanner-corner-tr"></div>
                <div className="scanner-corner scanner-corner-bl"></div>
                <div className="scanner-corner scanner-corner-br"></div>
              </>
            )}
          </div>

          <div className="text-center px-4">
            {activeTripForScan ? (
              <p className="text-xs text-gray-500 font-semibold text-amber-700">
                Chuyến hiện tại: {activeTripForScan.journey?.diemDi} → {activeTripForScan.journey?.diemDen} ({activeTripForScan.departureTime ? new Date(activeTripForScan.departureTime).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}) : ""})
              </p>
            ) : (
              <p className="text-xs text-gray-500 font-semibold text-purple-700">
                Chế độ: Quét nhanh mọi chuyến đi của bạn hôm nay
              </p>
            )}
            <p className="text-[11px] text-gray-400 mt-1">
              Đưa mã QR trên vé khách hàng trước camera. Hệ thống sẽ tự động đối chiếu chuyến xe.
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal hiển thị Danh sách khách hàng đặt vé của chuyến */}
      <Modal
        open={isCustomerListOpen}
        title={
          <Space className="text-gray-800">
            <TeamOutlined className="text-blue-600 text-lg" />
            <span className="font-bold text-lg">Danh sách hành khách đặt vé</span>
          </Space>
        }
        onCancel={() => {
          setIsCustomerListOpen(false);
          setTripBookings([]);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsCustomerListOpen(false);
              setTripBookings([]);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={800}
        centered
        destroyOnClose
      >
        <div className="space-y-4 pt-2">
          {selectedTripForList && (
            <div className="p-3 bg-slate-50 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
              <div>
                Hành trình: <strong className="text-blue-600 text-sm">{selectedTripForList.journey?.diemDi} → {selectedTripForList.journey?.diemDen}</strong>
              </div>
              <div>
                Khởi hành: <strong>{new Date(selectedTripForList.departureTime).toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                Xe: <strong>{selectedTripForList.bus?.name || "N/A"}</strong>
              </div>
            </div>
          )}

          <Table
            columns={[
              {
                title: "Hành khách",
                render: (_: any, record: any) => (
                  <div>
                    <div className="font-semibold text-gray-800">{record.user?.username || "Hành khách NETBUS"}</div>
                    <div className="text-xs text-gray-400">{record.user?.email || "Chưa cập nhật"}</div>
                  </div>
                ),
              },
              {
                title: "Số điện thoại",
                render: (_: any, record: any) => (
                  <span>{record.user?.phone || record.user?.sdt || "---"}</span>
                ),
              },
              {
                title: "Ghế đặt",
                dataIndex: "seats",
                render: (seats: string[]) => (
                  <Space size={4} wrap>
                    {seats?.map(seat => (
                      <Tag color="cyan" key={seat} className="font-semibold">{seat}</Tag>
                    ))}
                  </Space>
                ),
              },
              {
                title: "Tổng tiền",
                dataIndex: "totalPrice",
                render: (price: number) => (
                  <span className="font-medium text-red-500 text-xs">
                    {(price || 0).toLocaleString("vi-VN")} đ
                  </span>
                ),
              },
              {
                title: "Trạng thái",
                dataIndex: "status",
                render: (status: string) => {
                  let color = "orange";
                  if (status === "Đã check-in" || status === "Đã checkin" || status === "Hoàn thành") color = "blue";
                  else if (status === "Đã xác nhận") color = "green";
                  else if (status === "Đã huỷ") color = "red";
                  return <Tag color={color}>{status}</Tag>;
                },
              },
              {
                title: "Hành động",
                key: "action",
                render: (_: any, record: any) => {
                  if (record.status === "Đã check-in" || record.status === "Đã checkin" || record.status === "Hoàn thành") {
                    return <span className="text-gray-400 font-medium text-xs">✓ Đã check-in</span>;
                  }
                  if (record.status === "Đã huỷ") {
                    return <span className="text-red-400 font-medium text-xs">Vé đã hủy</span>;
                  }
                  return (
                    <Button
                      type="primary"
                      size="small"
                      className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-md text-xs font-semibold"
                      onClick={() => handleDirectCheckin(record._id, record.user?.username || "Khách hàng", selectedTripForList)}
                    >
                      Check-in
                    </Button>
                  );
                },
              },
            ]}
            dataSource={tripBookings}
            rowKey="_id"
            loading={bookingsLoading}
            pagination={{
              pageSize: 5,
              showTotal: (total) => `Tổng số ${total} lượt đặt vé`,
            }}
            size="small"
            locale={{
              emptyText: "Chưa có hành khách nào đặt vé cho chuyến xe này.",
            }}
          />
        </div>
      </Modal>

      {/* Modal Lựa chọn Check-in vé */}
      <Modal
        open={isCheckInOptionModalOpen}
        title={
          <Space>
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
            <span className="font-bold">Lựa chọn Check-in vé</span>
          </Space>
        }
        onCancel={() => {
          setIsCheckInOptionModalOpen(false);
          setActiveTripForOption(null);
        }}
        footer={null}
        width={400}
        centered
        destroyOnClose
        className="rounded-2xl"
      >
        <div className="space-y-4 py-2 flex flex-col items-center">
          {activeTripForOption && (
            <p className="text-xs text-gray-500 text-center mb-2">
              Chuyến đi: <strong className="text-gray-700">{activeTripForOption.journey?.diemDi} → {activeTripForOption.journey?.diemDen}</strong><br />
              Khởi hành: {new Date(activeTripForOption.departureTime).toLocaleString("vi-VN")}
            </p>
          )}
          
          <Button
            type="primary"
            size="large"
            icon={<QrcodeOutlined />}
            onClick={() => {
              setIsCheckInOptionModalOpen(false);
              setActiveTripForScan(activeTripForOption);
              setIsScannerOpen(true);
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl font-bold flex items-center justify-center gap-2"
            style={{ height: 48 }}
          >
            Quét QR Check-in
          </Button>

          <Button
            type="default"
            size="large"
            icon={<TeamOutlined />}
            onClick={() => {
              setIsCheckInOptionModalOpen(false);
              handleOpenCustomerList(activeTripForOption);
            }}
            className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl font-bold flex items-center justify-center gap-2"
            style={{ height: 48 }}
          >
            Danh sách khách hàng
          </Button>

          <Button
            size="large"
            onClick={() => {
              setIsCheckInOptionModalOpen(false);
              setActiveTripForOption(null);
            }}
            className="w-full rounded-xl font-medium mt-2"
            style={{ height: 40 }}
          >
            Hủy
          </Button>
        </div>
      </Modal>
    </div>
    </ClientLayout>
  );
}