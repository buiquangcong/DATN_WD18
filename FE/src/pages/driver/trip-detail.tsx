import { Typography, Card, Row, Col, Button, Table, Tag, Space, Spin, Modal, Input, Descriptions, Badge, message, Divider, Tooltip, Select } from "antd";
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
  QrcodeOutlined,
  ScanOutlined,
} from "@ant-design/icons";
import { ClientLayout } from "./layout";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Html5Qrcode } from "html5-qrcode";
import dayjs from "dayjs";

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

  // QR Scan states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [html5QrCodeInstance, setHtml5QrCodeInstance] = useState<Html5Qrcode | null>(null);

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
    if (trip && trip.departureTime) {
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

  const playBeep = (isError = false) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(isError ? 220 : 800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (isError ? 0.3 : 0.15));

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + (isError ? 0.3 : 0.15));
    } catch (e) {
      console.error("Audio Context beep failed", e);
    }
  };

  const handleScanSuccess = async (decodedText: string, instance: Html5Qrcode) => {
    if (!trip) return;

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
      const currentTripId = trip?._id;

      if (String(bookingTripId) !== String(currentTripId)) {
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

      const bookingRes = await axios.get(`http://localhost:3000/api/booking/trip/${tripId}`);
      setBookings(bookingRes.data.data || []);
      
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
          const instance = new Html5Qrcode("trip-detail-qr-reader");
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
  };

  const handleCameraChange = async (value: string) => {
    setSelectedCameraId(value);
    await stopScanner();
    startScanner(value);
  };

  useEffect(() => {
    if (isScannerOpen) {
      Html5Qrcode.getCameras()
        .then((devices) => {
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
          console.error("Lỗi lấy danh sách camera:", err);
          message.error("Vui lòng cấp quyền truy cập camera!");
        });
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isScannerOpen]);

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
          let isTimeValid = true;
          if (trip && trip.departureTime) {
            const now = dayjs();
            const departure = dayjs(trip.departureTime);
            const diffMinutes = now.diff(departure, "minute");
            isTimeValid = diffMinutes >= -15 && diffMinutes <= 15;
          }

          return (
            <Tooltip title={isTimeValid ? "Check-in vé này" : "Chỉ được phép check-in trong khoảng từ 15 phút trước đến 15 phút sau giờ xe chạy"}>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleQuickCheckIn(record.orderCode)}
                disabled={!isTimeValid}
                style={isTimeValid ? { background: "#52c41a", borderColor: "#52c41a" } : {}}
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

  // ===== Seat Map matching customer Booking.tsx =====
  const [activeFloor, setActiveFloor] = useState(1);

  const isSleeper = trip?.bus?.type === "Sleeper";

  const getGridColsCount = (): number => {
    if (!trip?.bus) return 4;
    const { capacity, type } = trip.bus;
    if (capacity === 16) return 4;
    if (capacity === 29) return 5;
    if (capacity === 45) return 5;
    if (type === "Sleeper" || capacity === 38 || capacity === 34) return 5;
    return 4;
  };

  const getMappedColIndex = (seat: any): number => {
    if (!trip?.bus) return seat.colIndex;
    const { capacity } = trip.bus;
    if (capacity === 45) {
      if (seat.rowIndex <= 10) {
        if (seat.colIndex === 1) return 1;
        if (seat.colIndex === 2) return 2;
        if (seat.colIndex === 3) return 4;
        if (seat.colIndex === 4) return 5;
      }
    }
    return seat.colIndex;
  };

  const totalCols = getGridColsCount();

  const LegendItem = ({ label, status, isSleeperType }: { label: string; status: string; isSleeperType: boolean }) => {
    let seatColor = "#ffffff";
    let borderColor = "#cbd5e1";
    let pillowColor = "#f1f5f9";
    let armColor = "#cbd5e1";

    if (status === "HOLDING") {
      seatColor = "#fff1f2";
      borderColor = "#f43f5e";
      pillowColor = "#ffe4e6";
      armColor = "#fda4af";
    } else if (status === "BOOKED") {
      seatColor = "#f1f5f9";
      borderColor = "#cbd5e1";
      pillowColor = "#e2e8f0";
      armColor = "#e2e8f0";
    }

    return (
      <Space size="small" style={{ margin: "4px 12px" }}>
        <div style={{ position: "relative", width: 22, height: isSleeperType ? 26 : 22 }}>
          {isSleeperType ? (
            <>
              <div style={{ position: "absolute", inset: 0, backgroundColor: seatColor, border: `1.5px solid ${borderColor}`, borderRadius: 4 }} />
              <div style={{ position: "absolute", top: 2, left: 3, right: 3, height: 5, backgroundColor: pillowColor, border: `1px solid ${borderColor}`, borderRadius: 1.5 }} />
              <div style={{ position: "absolute", bottom: 2, left: 3, right: 3, height: 8, backgroundColor: status === "HOLDING" ? "#fecdd3" : status === "BOOKED" ? "#cbd5e1" : "#fafafa", borderTop: `1px dashed ${borderColor}`, borderRadius: "0 0 2px 2px" }} />
            </>
          ) : (
            <>
              <div style={{ position: "absolute", top: 3, bottom: 0, left: 2, right: 2, backgroundColor: seatColor, border: `1.5px solid ${borderColor}`, borderRadius: "3px 3px 4px 4px" }} />
              <div style={{ position: "absolute", top: 0, left: "25%", right: "25%", height: 3, backgroundColor: seatColor, border: `1.5px solid ${borderColor}`, borderBottom: "none", borderRadius: "2px 2px 0 0" }} />
              <div style={{ position: "absolute", top: 5, bottom: 2, left: 0, width: 2, backgroundColor: armColor, borderRadius: 0.5 }} />
              <div style={{ position: "absolute", top: 5, bottom: 2, right: 0, width: 2, backgroundColor: armColor, borderRadius: 0.5 }} />
            </>
          )}
        </div>
        <Text style={{ fontSize: "13px", fontWeight: 500, color: "#475569" }}>{label}</Text>
      </Space>
    );
  };

  const renderBusFloor = (floorNum: number) => {
    const isSleeperBus = trip?.bus?.type === "Sleeper";
    const seatsInFloor = trip?.seats?.filter((s: any) => (s.floor || 1) === floorNum) || [];
    const showCockpit = floorNum === 1;

    // Build booked seats from bookings
    const checkedInSeats = new Set<string>();
    bookings.forEach((b) => {
      if (b.status === "Đã check-in") {
        b.seats.forEach((s) => checkedInSeats.add(s));
      }
    });

    return (
      <div style={{
        position: "relative",
        background: "#f8fafc",
        border: "4px solid #cbd5e1",
        borderRadius: "32px 32px 16px 16px",
        padding: "24px 16px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
        marginTop: 10,
      }}>
        <style>{`
          .driver-seat-btn .seat-base,
          .driver-sleeper-btn .sleeper-base {
            transition: all 0.2s;
          }
        `}</style>

        {/* Windshield */}
        <div style={{
          height: 16,
          background: "linear-gradient(to bottom, #475569, #1e293b)",
          borderRadius: "12px 12px 2px 2px",
          marginBottom: 16,
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            top: 4,
            left: "50%",
            transform: "translateX(-50%)",
            width: 40,
            height: 2,
            backgroundColor: "#94a3b8",
            borderRadius: 1,
          }} />
        </div>

        {/* Side Mirrors */}
        <div style={{ position: "absolute", top: 24, left: -6, width: 6, height: 18, background: "#334155", borderRadius: "3px 0 0 3px" }} />
        <div style={{ position: "absolute", top: 24, right: -6, width: 6, height: 18, background: "#334155", borderRadius: "0 3px 3px 0" }} />

        {/* Grid container */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
          gap: "12px 10px",
        }}>
          {/* Row 1: Cockpit Area (only for Floor 1) */}
          {showCockpit && (
            <>
              {/* Driver steering wheel */}
              <div style={{
                gridColumnStart: 1,
                gridRowStart: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 44,
              }}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  color: "#64748b",
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(-45deg)" }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                  <span style={{ fontSize: "8px", marginTop: 2, fontWeight: 700, letterSpacing: 0.5 }}>LÁI XE</span>
                </div>
              </div>

              {/* Cockpit Empty space */}
              {Array.from({ length: totalCols - 2 }).map((_, idx) => (
                <div key={`empty-cockpit-${idx}`} style={{ gridColumnStart: idx + 2, gridRowStart: 1 }} />
              ))}

              {/* Entrance Door */}
              <div style={{
                gridColumnStart: totalCols,
                gridRowStart: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 44,
              }}>
                <div style={{
                  border: "1.5px dashed #cbd5e1",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: "8px",
                  color: "#64748b",
                  fontWeight: 700,
                  textAlign: "center",
                  lineHeight: "1.2",
                  backgroundColor: "#f1f5f9",
                }}>
                  CỬA<br />LÊN
                </div>
              </div>
            </>
          )}

          {/* Seats */}
          {seatsInFloor.map((seat: any) => {
            const isAvailable = seat.status === "AVAILABLE";
            const isHolding = seat.status === "HOLDING";
            const isBooked = seat.status === "BOOKED";
            const isCheckedIn = checkedInSeats.has(seat.seatCode);
            const gridRow = showCockpit ? seat.rowIndex + 1 : seat.rowIndex;
            const gridCol = getMappedColIndex(seat);

            if (isSleeperBus) {
              let baseBg = "#ffffff";
              let borderCol = "#cbd5e1";
              let txtCol = "#334155";
              let pillowBg = "#f1f5f9";
              let blanketBg = "#f8fafc";
              let shd = "0 2px 4px rgba(0, 0, 0, 0.04)";

              if (isCheckedIn) {
                baseBg = "#f0f5ff";
                borderCol = "#597ef7";
                txtCol = "#1d39c4";
                pillowBg = "#d6e4ff";
                blanketBg = "#adc6ff";
                shd = "0 4px 12px rgba(89, 126, 247, 0.15)";
              } else if (isHolding) {
                baseBg = "#fff1f2";
                borderCol = "#f43f5e";
                txtCol = "#be123c";
                pillowBg = "#ffe4e6";
                blanketBg = "#fecdd3";
              } else if (isBooked) {
                baseBg = "#f1f5f9";
                borderCol = "#e2e8f0";
                txtCol = "#94a3b8";
                pillowBg = "#cbd5e1";
                blanketBg = "#e2e8f0";
                shd = "none";
              }

              return (
                <Tooltip key={seat.seatCode} title={`${seat.seatCode} - ${isCheckedIn ? "Đã check-in" : seat.status === "BOOKED" ? "Đã đặt" : seat.status === "HOLDING" ? "Đang giữ" : "Trống"}`}>
                  <div
                    className="driver-sleeper-btn"
                    style={{
                      gridColumnStart: gridCol,
                      gridRowStart: gridRow,
                      position: "relative",
                      height: 62,
                      width: "100%",
                      cursor: "default",
                    }}
                  >
                    <div style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      color: txtCol,
                    }}>
                      {/* Bed Body */}
                      <div className="sleeper-base" style={{
                        position: "absolute",
                        top: 2,
                        bottom: 2,
                        left: 2,
                        right: 2,
                        backgroundColor: baseBg,
                        border: `2px solid ${borderCol}`,
                        borderRadius: 8,
                        boxShadow: shd,
                      }} />
                      {/* Pillow */}
                      <div style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        right: 6,
                        height: 10,
                        backgroundColor: pillowBg,
                        border: `1px solid ${borderCol}`,
                        borderRadius: 3,
                        zIndex: 1,
                      }} />
                      {/* Blanket */}
                      <div style={{
                        position: "absolute",
                        bottom: 6,
                        left: 6,
                        right: 6,
                        height: 16,
                        backgroundColor: blanketBg,
                        borderTop: `1px dashed ${borderCol}`,
                        borderRadius: "0 0 4px 4px",
                        opacity: 0.8,
                      }} />
                      {/* Seat Code Text */}
                      <span style={{
                        position: "relative",
                        zIndex: 2,
                        fontSize: "11px",
                        fontWeight: 500,
                        marginTop: "22px",
                      }}>
                        {seat.seatCode}
                      </span>
                    </div>
                  </div>
                </Tooltip>
              );
            } else {
              let baseBg = "#ffffff";
              let borderCol = "#cbd5e1";
              let txtCol = "#334155";
              let armBg = "#cbd5e1";
              let shd = "0 2px 4px rgba(0, 0, 0, 0.04)";

              if (isCheckedIn) {
                baseBg = "#f0f5ff";
                borderCol = "#597ef7";
                txtCol = "#1d39c4";
                armBg = "#597ef7";
                shd = "0 4px 12px rgba(89, 126, 247, 0.15)";
              } else if (isHolding) {
                baseBg = "#fff1f2";
                borderCol = "#f43f5e";
                txtCol = "#be123c";
                armBg = "#fda4af";
              } else if (isBooked) {
                baseBg = "#f1f5f9";
                borderCol = "#e2e8f0";
                txtCol = "#94a3b8";
                armBg = "#cbd5e1";
                shd = "none";
              }

              return (
                <Tooltip key={seat.seatCode} title={`${seat.seatCode} - ${isCheckedIn ? "Đã check-in" : seat.status === "BOOKED" ? "Đã đặt" : seat.status === "HOLDING" ? "Đang giữ" : "Trống"}`}>
                  <div
                    className="driver-seat-btn"
                    style={{
                      gridColumnStart: gridCol,
                      gridRowStart: gridRow,
                      position: "relative",
                      height: 50,
                      width: "100%",
                      cursor: "default",
                    }}
                  >
                    <div style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      color: txtCol,
                    }}>
                      {/* Cushion Base */}
                      <div className="seat-base" style={{
                        position: "absolute",
                        top: 8,
                        bottom: 2,
                        left: 4,
                        right: 4,
                        backgroundColor: baseBg,
                        border: `2px solid ${borderCol}`,
                        borderRadius: "6px 6px 8px 8px",
                        boxShadow: shd,
                      }} />
                      {/* Headrest */}
                      <div style={{
                        position: "absolute",
                        top: 2,
                        width: "50%",
                        height: 8,
                        backgroundColor: baseBg,
                        border: `2px solid ${borderCol}`,
                        borderBottom: "none",
                        borderRadius: "3px 3px 0 0",
                        zIndex: 1,
                      }} />
                      {/* Armrests */}
                      <div style={{
                        position: "absolute",
                        top: 14,
                        bottom: 6,
                        left: 1,
                        width: 4,
                        backgroundColor: armBg,
                        borderRadius: "2px",
                        opacity: 0.8,
                      }} />
                      <div style={{
                        position: "absolute",
                        top: 14,
                        bottom: 6,
                        right: 1,
                        width: 4,
                        backgroundColor: armBg,
                        borderRadius: "2px",
                        opacity: 0.8,
                      }} />
                      {/* Seat Code Text */}
                      <span style={{
                        position: "relative",
                        zIndex: 2,
                        fontSize: "11px",
                        fontWeight: 500,
                        marginTop: "6px",
                      }}>
                        {seat.seatCode}
                      </span>
                    </div>
                  </div>
                </Tooltip>
              );
            }
          })}

          {/* WC Box (only for 34 capacity) */}
          {trip?.bus?.capacity === 34 && (
            <div style={{
              gridColumnStart: 5,
              gridRowStart: showCockpit ? 7 : 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#cbd5e1",
              border: "2px solid #94a3b8",
              borderRadius: 8,
              color: "#475569",
              fontSize: "12px",
              fontWeight: 700,
              height: 62,
            }}>
              WC
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSeatMap = () => {
    if (!trip?.seats?.length) return <Text type="secondary">Không có dữ liệu ghế</Text>;

    const isSleeperBus = trip?.bus?.type === "Sleeper";

    return (
      <div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24, flexWrap: "wrap", borderBottom: "1px solid #f0f0f0", paddingBottom: 16 }}>
          <LegendItem label="Trống" status="AVAILABLE" isSleeperType={!!isSleeperBus} />
          <LegendItem label="Đang giữ chỗ" status="HOLDING" isSleeperType={!!isSleeperBus} />
          <LegendItem label="Đã đặt" status="BOOKED" isSleeperType={!!isSleeperBus} />
        </div>

        {/* Floor switcher for Sleeper */}
        {isSleeperBus && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div style={{
              display: "inline-flex",
              padding: 4,
              background: "#f1f5f9",
              borderRadius: 10,
              border: "1px solid #e2e8f0"
            }}>
              <button
                onClick={() => setActiveFloor(1)}
                style={{
                  padding: "6px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: activeFloor === 1 ? "#ffffff" : "transparent",
                  color: activeFloor === 1 ? "#2563eb" : "#64748b",
                  boxShadow: activeFloor === 1 ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.2s"
                }}
              >
                Tầng dưới (Tầng 1)
              </button>
              <button
                onClick={() => setActiveFloor(2)}
                style={{
                  padding: "6px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: activeFloor === 2 ? "#ffffff" : "transparent",
                  color: activeFloor === 2 ? "#2563eb" : "#64748b",
                  boxShadow: activeFloor === 2 ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.2s"
                }}
              >
                Tầng trên (Tầng 2)
              </button>
            </div>
          </div>
        )}

        {/* Bus rendering */}
        <Row gutter={[24, 24]} justify="center">
          {isSleeperBus ? (
            <>
              <Col span={24} md={12} style={{ display: activeFloor === 1 ? "block" : "none" }}>
                <div style={{ textAlign: "center", marginBottom: 12, fontWeight: 700, color: "#1e3a8a", fontSize: "14px" }}>
                  TẦNG DƯỚI (TẦNG 1)
                </div>
                {renderBusFloor(1)}
              </Col>
              <Col span={24} md={12} style={{ display: activeFloor === 2 ? "block" : "none" }}>
                <div style={{ textAlign: "center", marginBottom: 12, fontWeight: 700, color: "#1e3a8a", fontSize: "14px" }}>
                  TẦNG TRÊN (TẦNG 2)
                </div>
                {renderBusFloor(2)}
              </Col>
            </>
          ) : (
            <Col span={24} sm={16} md={14}>
              <div style={{ textAlign: "center", marginBottom: 12, fontWeight: 700, color: "#1e3a8a", fontSize: "14px" }}>
                SƠ ĐỒ VỊ TRÍ GHẾ
              </div>
              {renderBusFloor(1)}
            </Col>
          )}
        </Row>
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
                  {trip.journey?.quangDuong || "N/A"} km
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
            <Button
              type="primary"
              icon={<QrcodeOutlined />}
              onClick={() => {
                setCheckInModal(false);
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

        {/* Style CSS cho hiệu ứng quét camera */}
        <style>{`
          #trip-detail-qr-reader {
            width: 100% !important;
            border: none !important;
            border-radius: 12px;
            overflow: hidden;
          }
          #trip-detail-qr-reader video {
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
              <div id="trip-detail-qr-reader" className="w-full h-full"></div>
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
              <p className="text-xs text-gray-500 font-semibold text-amber-700">
                Chuyến hiện tại: {trip?.journey?.diemDi} → {trip?.journey?.diemDen} ({trip?.departureTime ? new Date(trip.departureTime).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}) : ""})
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Đưa mã QR trên vé khách hàng trước camera. Hệ thống sẽ tự động đối chiếu chuyến xe.
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </ClientLayout>
  );
}
