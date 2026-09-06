import { Typography, Card, Row, Col, Button, Table, Tag, Space, Spin, Modal, Input, Descriptions, Badge, message, Divider, Tooltip, Select, Segmented } from "antd";
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
      title: "Thời gian đặt",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString("vi-VN"),
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
      render: (status: string) => {
        if (status === "Đã xác nhận") {
          return <Tag color="orange">Chưa check-in</Tag>;
        }
        if (status === "Đã check-in") {
          return (
            <Tag color="blue" icon={<CheckCircleOutlined />}>
              Đã lên xe
            </Tag>
          );
        }
        return <Tag color={getStatusColor(status)}>{status}</Tag>;
      },
    },
  ];

  // ===== Seat Map matching Admin SeatMapModal.tsx =====
  const [activeFloor, setActiveFloor] = useState(1);
  const [viewFloorTab, setViewFloorTab] = useState<string>("all");

  const isSleeper = trip?.bus?.type === "Sleeper";

  const getGridColsCount = (): number => {
    if (!trip?.bus) return 4;
    const { capacity, type } = trip.bus;
    if (type === "Sleeper" || capacity === 38 || capacity === 34) return 5;
    if (capacity <= 10 || type === "Limousine") return 3; // Limousine 3 cột
    if (capacity === 16) return 4;
    if (capacity === 29) return 5;
    if (capacity === 45) return 5;
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

  const renderSeatItem = (seat: any, showCockpit: boolean, checkedInSeats: Set<string>) => {
    const isAvailable = seat.status === "AVAILABLE";
    const isHolding = seat.status === "HOLDING";
    const isBooked = seat.status === "BOOKED";
    const isCheckedIn = checkedInSeats.has(seat.seatCode);

    const gridRow = showCockpit ? seat.rowIndex + 1 : seat.rowIndex;
    const gridCol = getMappedColIndex(seat);

    // Tìm thông tin đơn đặt vé tương ứng (nếu có) để hiển thị chi tiết cho tài xế
    const bookingOfSeat = bookings.find((b) => b.seats?.includes(seat.seatCode));

    let statusText = "Còn trống";
    if (isCheckedIn) statusText = "Đã check-in lên xe";
    else if (isBooked) statusText = "Đã đặt vé (chờ check-in)";
    else if (isHolding) statusText = "Đang giữ chỗ";

    if (isSleeper) {
      let containerClasses = "group relative h-[62px] w-full rounded-xl transition-all duration-200 transform";
      let frameClasses = "absolute inset-0 rounded-xl border-2 transition-colors";
      let pillowClasses = "absolute top-1.5 left-2 right-2 h-2.5 rounded-sm border transition-colors";
      let footClasses = "absolute bottom-1.5 left-2 right-2 h-2 rounded-b-sm border-t border-dashed transition-colors";
      let textClasses = "text-[12px] font-bold tracking-wide transition-colors";

      if (isCheckedIn) {
        containerClasses += " ring-2 ring-blue-500 scale-105 shadow-md z-10";
        frameClasses += " bg-blue-50/90 border-blue-500";
        pillowClasses += " bg-blue-200 border-blue-400";
        footClasses += " bg-blue-100 border-blue-300";
        textClasses += " text-blue-700 font-extrabold";
      } else if (isHolding) {
        containerClasses += " opacity-90";
        frameClasses += " bg-rose-50/90 border-rose-400";
        pillowClasses += " bg-rose-200 border-rose-300";
        footClasses += " bg-rose-100 border-rose-200";
        textClasses += " text-rose-700 font-bold";
      } else if (isBooked) {
        containerClasses += " shadow-xs";
        frameClasses += " bg-slate-100 border-slate-300";
        pillowClasses += " bg-slate-200 border-slate-300";
        footClasses += " bg-slate-100 border-slate-200";
        textClasses += " text-slate-600 font-bold";
      } else {
        // AVAILABLE
        frameClasses += " bg-white border-slate-300";
        pillowClasses += " bg-slate-100 border-slate-200";
        footClasses += " bg-slate-50 border-slate-200";
        textClasses += " text-slate-700";
      }

      return (
        <Tooltip
          key={seat.seatCode}
          title={
            <div className="text-xs">
              <p className="font-bold text-blue-400">Giường: {seat.seatCode}</p>
              <p>Tầng: {seat.floor === 1 ? "Tầng 1 (Dưới)" : "Tầng 2 (Trên)"}</p>
              <p>Trạng thái: <strong>{statusText}</strong></p>
              {bookingOfSeat && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-600 text-slate-200">
                  <p>Khách: <strong>{bookingOfSeat.user?.username || (bookingOfSeat as any).customerName || "Hành khách"}</strong></p>
                  {((bookingOfSeat.user as any)?.phone || (bookingOfSeat as any).phone) && (
                    <p>SĐT: <strong>{(bookingOfSeat.user as any)?.phone || (bookingOfSeat as any).phone}</strong></p>
                  )}
                  <p>Mã vé: <strong>NB-{bookingOfSeat.orderCode || bookingOfSeat._id?.slice(-6).toUpperCase()}</strong></p>
                </div>
              )}
            </div>
          }
        >
          <div
            style={{
              gridColumnStart: gridCol,
              gridRowStart: gridRow,
              cursor: "default",
            }}
            className={containerClasses}
          >
            {/* Khung giường */}
            <div className={frameClasses} />
            {/* Gối đầu */}
            <div className={pillowClasses} />
            {/* Tấm ga đệm chân */}
            <div className={footClasses} />
            {/* Mã số giường */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center pt-2">
              <span className={textClasses}>
                {seat.seatCode}
              </span>
            </div>
          </div>
        </Tooltip>
      );
    }

    // Seater (Ghế ngồi)
    let containerClasses = "group relative h-[52px] w-full rounded-lg transition-all duration-200 transform";
    let headrestClasses = "absolute top-0.5 left-1/4 right-1/4 h-2 rounded-t border-t-2 border-x-2 transition-colors";
    let cushionClasses = "absolute top-2.5 bottom-0 inset-x-1 rounded-lg border-2 transition-colors";
    let armLeftClasses = "absolute top-4 bottom-1.5 left-0 w-1 rounded-full transition-colors";
    let armRightClasses = "absolute top-4 bottom-1.5 right-0 w-1 rounded-full transition-colors";
    let textClasses = "text-[12px] font-bold tracking-wide transition-colors";

    if (isCheckedIn) {
      containerClasses += " ring-2 ring-blue-500 scale-105 shadow-md z-10";
      headrestClasses += " bg-blue-100 border-blue-500";
      cushionClasses += " bg-blue-50/90 border-blue-500";
      armLeftClasses += " bg-blue-400";
      armRightClasses += " bg-blue-400";
      textClasses += " text-blue-700 font-extrabold";
    } else if (isHolding) {
      containerClasses += " opacity-90";
      headrestClasses += " bg-rose-100 border-rose-400";
      cushionClasses += " bg-rose-50/90 border-rose-400";
      armLeftClasses += " bg-rose-300";
      armRightClasses += " bg-rose-300";
      textClasses += " text-rose-700 font-bold";
    } else if (isBooked) {
      containerClasses += " shadow-xs";
      headrestClasses += " bg-slate-200 border-slate-300";
      cushionClasses += " bg-slate-100 border-slate-300";
      armLeftClasses += " bg-slate-300";
      armRightClasses += " bg-slate-300";
      textClasses += " text-slate-600 font-bold";
    } else {
      // AVAILABLE
      headrestClasses += " bg-slate-100 border-slate-300";
      cushionClasses += " bg-white border-slate-300";
      armLeftClasses += " bg-slate-300";
      armRightClasses += " bg-slate-300";
      textClasses += " text-slate-700";
    }

    return (
      <Tooltip
        key={seat.seatCode}
        title={
          <div className="text-xs">
            <p className="font-bold text-blue-400">Ghế: {seat.seatCode}</p>
            <p>Trạng thái: <strong>{statusText}</strong></p>
            {bookingOfSeat && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-600 text-slate-200">
                <p>Khách: <strong>{bookingOfSeat.user?.username || (bookingOfSeat as any).customerName || "Hành khách"}</strong></p>
                {((bookingOfSeat.user as any)?.phone || (bookingOfSeat as any).phone) && (
                  <p>SĐT: <strong>{(bookingOfSeat.user as any)?.phone || (bookingOfSeat as any).phone}</strong></p>
                )}
                <p>Mã vé: <strong>NB-{bookingOfSeat.orderCode || bookingOfSeat._id?.slice(-6).toUpperCase()}</strong></p>
              </div>
            )}
          </div>
        }
      >
        <div
          style={{
            gridColumnStart: gridCol,
            gridRowStart: gridRow,
            cursor: "default",
          }}
          className={containerClasses}
        >
          {/* Tựa đầu ghế */}
          <div className={headrestClasses} />
          {/* Thân đệm ghế */}
          <div className={cushionClasses} />
          {/* Tay vịn 2 bên */}
          <div className={armLeftClasses} />
          <div className={armRightClasses} />
          {/* Mã số ghế */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center pt-2">
            <span className={textClasses}>
              {seat.seatCode}
            </span>
          </div>
        </div>
      </Tooltip>
    );
  };

  const renderBusFloor = (floorNum: number) => {
    const seatsInFloor = trip?.seats?.filter((s: any) => (s.floor || 1) === floorNum) || [];
    const showCockpit = floorNum === 1;

    // Build booked seats from bookings
    const checkedInSeats = new Set<string>();
    bookings.forEach((b) => {
      if (b.status === "Đã check-in" || b.status === "Đã checkin") {
        b.seats?.forEach((s) => checkedInSeats.add(s));
      }
    });

    return (
      <div
        className="relative w-full max-w-[270px] bg-white border-[3px] border-slate-300 rounded-t-[36px] rounded-b-[20px] p-4 shadow-sm hover:shadow-md transition-shadow"
        style={{ minHeight: isSleeper ? "460px" : "380px" }}
      >
        {/* Gương chiếu hậu 2 bên */}
        <div className="absolute top-6 -left-2 w-2 h-5 bg-slate-700 rounded-l-md" />
        <div className="absolute top-6 -right-2 w-2 h-5 bg-slate-700 rounded-r-md" />

        {/* Kính chắn gió phía trước */}
        <div className="relative h-4 bg-gradient-to-b from-slate-700 to-slate-900 rounded-t-xl rounded-b-xs mb-4 flex items-center justify-center">
          <div className="w-10 h-0.5 bg-slate-400 rounded-full" />
        </div>

        {/* Grid sơ đồ ghế / giường */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
            gap: isSleeper ? "12px 8px" : "10px 6px",
          }}
        >
          {/* Hàng 1: Khoang lái & Cửa lên xuống (Chỉ tầng 1) */}
          {showCockpit && (
            <>
              {/* Vị trí Tài xế */}
              <div
                style={{ gridColumnStart: 1, gridRowStart: 1 }}
                className="flex items-center justify-center h-10"
              >
                <div className="flex flex-col items-center text-slate-500">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{ transform: "rotate(-45deg)" }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                  <span className="text-[8px] font-bold mt-0.5 tracking-wider">TÀI XẾ</span>
                </div>
              </div>

              {/* Khoảng trống táp-lô (chỉ vẽ nếu vị trí đó không có ghế A1) */}
              {Array.from({ length: totalCols - 2 }).map((_, idx) => {
                const col = idx + 2;
                const hasSeatHere = seatsInFloor.some(
                  (s: any) => s.colIndex === col && s.rowIndex === 0
                );
                if (hasSeatHere) return null;
                return (
                  <div
                    key={`cockpit-blank-${idx}`}
                    style={{ gridColumnStart: col, gridRowStart: 1 }}
                  />
                );
              })}

              {/* Cửa lên xe (chỉ vẽ nếu cột cuối chưa bị ghế A2 chiếm) */}
              {!seatsInFloor.some((s: any) => s.colIndex === totalCols && s.rowIndex === 0) && (
                <div
                  style={{ gridColumnStart: totalCols, gridRowStart: 1 }}
                  className="flex items-center justify-center h-10"
                >
                  <div className="border border-dashed border-emerald-400 bg-emerald-50/60 text-emerald-700 text-[8px] p-1 text-center font-bold rounded-md leading-tight">
                    CỬA
                    <br />
                    LÊN
                  </div>
                </div>
              )}
            </>
          )}

          {/* Các vị trí ghế thực tế */}
          {seatsInFloor.map((seat: any) => renderSeatItem(seat, showCockpit, checkedInSeats))}
        </div>

        {/* Đuôi xe */}
        <div className="mt-5 pt-3 border-t border-dashed border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-medium px-1">
          <span>Đuôi xe</span>
          {isSleeper && <span>WC / Lối thoát</span>}
          <span>Hàng sau</span>
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
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 py-2 px-3 mb-4 text-xs text-gray-600 bg-white border border-gray-100 rounded-lg shadow-2xs">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded border-2 border-slate-300 bg-white flex items-center justify-center text-[9px] font-bold text-slate-700">
              A1
            </div>
            <span>{isSleeperBus ? "Giường trống" : "Ghế trống"}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded border-2 border-blue-500 bg-blue-50 flex items-center justify-center text-[9px] font-bold text-blue-700">
              ✓
            </div>
            <span>Đã check-in</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded border-2 border-slate-300 bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600">
              B1
            </div>
            <span>Đã đặt (chờ đón)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded border-2 border-rose-400 bg-rose-50 flex items-center justify-center text-[9px] font-bold text-rose-600">
              ⌛
            </div>
            <span>Đang giữ chỗ</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded border border-dashed border-emerald-400 bg-emerald-50/60 flex items-center justify-center text-[7px] font-bold text-emerald-700">
              CỬA
            </div>
            <span>Cửa lên</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-[9px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <span>Khoang tài xế</span>
          </div>
        </div>

        {/* Floor switcher for Sleeper */}
        {isSleeperBus && (
          <div className="flex justify-center mb-4">
            <Segmented
              options={[
                { label: "Cả 2 tầng (Song song)", value: "all" },
                { label: "Tầng 1 (Tầng dưới - Dãy A)", value: "1" },
                { label: "Tầng 2 (Tầng trên - Dãy B)", value: "2" },
              ]}
              value={viewFloorTab}
              onChange={(val) => setViewFloorTab(val as string)}
              className="bg-slate-100 p-1 font-medium text-xs"
            />
          </div>
        )}

        {/* Bus rendering */}
        <div className="pt-2">
          {isSleeperBus ? (
            <div className="flex flex-col md:flex-row justify-center items-start gap-8">
              {(viewFloorTab === "all" || viewFloorTab === "1") && (
                <div className="flex-1 w-full flex flex-col items-center">
                  <div className="mb-2 text-center">
                    <Tag color="green" className="font-semibold px-3 py-0.5 text-xs rounded-full">
                      TẦNG 1 (TẦNG DƯỚI) ({trip?.seats?.filter((s: any) => (s.floor || 1) === 1).length || 0} giường)
                    </Tag>
                  </div>
                  {renderBusFloor(1)}
                </div>
              )}
              {(viewFloorTab === "all" || viewFloorTab === "2") && (
                <div className="flex-1 w-full flex flex-col items-center">
                  <div className="mb-2 text-center">
                    <Tag color="green" className="font-semibold px-3 py-0.5 text-xs rounded-full">
                      TẦNG 2 (TẦNG TRÊN) ({trip?.seats?.filter((s: any) => (s.floor || 1) === 2).length || 0} giường)
                    </Tag>
                  </div>
                  {renderBusFloor(2)}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="mb-2 text-center">
                <Tag color="green" className="font-semibold px-3 py-0.5 text-xs rounded-full">
                  SƠ ĐỒ BỐ TRÍ ({trip?.seats?.length || 0} ghế)
                </Tag>
              </div>
              {renderBusFloor(1)}
            </div>
          )}
        </div>
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
  const confirmedBookings = bookings.filter(
    (b) =>
      b.status === "Đã xác nhận" ||
      b.status === "Đã check-in" ||
      b.status === "Đã checkin" ||
      b.status === "Hoàn thành"
  );

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
                <Descriptions.Item label="Khởi hành(dự kiến)">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {new Date(trip.departureTime).toLocaleString("vi-VN")}
                </Descriptions.Item>
                <Descriptions.Item label="Đến nơi (dự kiến)">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {new Date(trip.arrivalTime).toLocaleString("vi-VN")}
                </Descriptions.Item>
                <Descriptions.Item label="Xe">
                  <CarOutlined style={{ marginRight: 4 }} />
                  {trip.bus?.name || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Biển số xe">
                  <CarOutlined style={{ marginRight: 4 }} />
                  <Text strong style={{ color: "#1890ff" }}>
                    {trip.bus?.licensePlates || "N/A"}
                  </Text>
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
                      {confirmedBookings.length}
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
                      {bookings.filter((b) => b.status === "Đã check-in" || b.status === "Đã checkin" || b.status === "Hoàn thành").length}
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
              <Text strong>Danh sách hành khách ({confirmedBookings.length})</Text>
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
            dataSource={confirmedBookings}
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
