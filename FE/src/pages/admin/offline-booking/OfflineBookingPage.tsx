import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Radio,
  Button,
  Card,
  Space,
  Tag,
  Row,
  Col,
  Flex,
  Spin,
  Alert,
  Modal,
  Divider,
  Table,
} from "antd";
import {
  CreditCardOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  QrcodeOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface UserType {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  sdt?: string;
}

interface TripType {
  _id: string;
  journey: {
    _id: string;
    diemDi: string;
    diemDen: string;
    price: number;
    name?: string;
  };
  bus: {
    _id: string;
    name: string;
    type: "Sleeper" | "Seat";
    capacity: number;
    licensePlates: string;
  };
  departureTime: string;
  ticketPrice: number;
  seats: {
    seatCode: string;
    status: "AVAILABLE" | "HOLDING" | "BOOKED";
    floor?: number;
    rowIndex: number;
    colIndex: number;
    heldBy?: any;
  }[];
}

function OfflineBookingPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  // List States
  const [trips, setTrips] = useState<TripType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripType | null>(null);
  
  // Seating States
  const [chosenSeatCodes, setChosenSeatCodes] = useState<string[]>([]);
  const [activeFloor, setActiveFloor] = useState<number>(1);
  
  // Loading States
  const [tripsLoading, setTripsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [tripDetailLoading, setTripDetailLoading] = useState(false);
  const [bookingSubmitLoading, setBookingSubmitLoading] = useState(false);
  
  // Form conditional fields
  const [customerType, setCustomerType] = useState<"guest" | "existing">("guest");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "payos">("cash");

  // PayOS modal state
  const [isPayOSModalOpen, setIsPayOSModalOpen] = useState(false);
  const [payOSUrl, setPayOSUrl] = useState("");
  const [currentBookingId, setCurrentBookingId] = useState("");
  const [pendingTicketData, setPendingTicketData] = useState<any>(null);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessionPaymentMethods, setSessionPaymentMethods] = useState<{ [key: string]: string }>({});

  const fetchBookingHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/api/booking");
      const sorted = (res.data || []).sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setBookingHistory(sorted);
    } catch (err) {
      console.error("Lỗi tải lịch sử đặt vé:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const playBeep = (isError = false) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (isError) {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.35);
      } else {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      }
    } catch (e) {
      console.error("Audio Context beep failed", e);
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setTripsLoading(true);
      setUsersLoading(true);
      try {
        // Load trips
        const tripRes = await axios.get("http://localhost:3000/api/trip");
        const allTrips = tripRes.data || [];
        // Lọc các chuyến sắp chạy hoặc đang chạy
        const activeTrips = allTrips.filter(
          (t: any) => t.status === "sắp chạy" || t.status === "đang chạy"
        );
        setTrips(activeTrips);

        // Load users for existing accounts
        const userRes = await axios.get("http://localhost:3000/api/tk");
        const allUsers = userRes.data || [];
        // Lọc tài khoản hành khách thường
        const regularUsers = allUsers.filter((u: any) => u.role === "user");
        setUsers(regularUsers);
      } catch (err) {
        console.error("Lỗi tải dữ liệu ban đầu:", err);
        toast.error("Không thể tải danh sách chuyến đi hoặc khách hàng!");
      } finally {
        setTripsLoading(false);
        setUsersLoading(false);
      }
    };
    fetchInitialData();
    fetchBookingHistory();
  }, []);

  // Fetch detailed selected trip
  const handleTripChange = async (tripId: string) => {
    if (!tripId) {
      setSelectedTrip(null);
      setChosenSeatCodes([]);
      return;
    }
    setTripDetailLoading(true);
    setChosenSeatCodes([]);
    try {
      const res = await axios.get(`http://localhost:3000/api/trip/${tripId}`);
      setSelectedTrip(res.data);
    } catch (err) {
      console.error("Lỗi lấy chi tiết chuyến xe:", err);
      toast.error("Không tải được chi tiết sơ đồ ghế của chuyến này!");
    } finally {
      setTripDetailLoading(false);
    }
  };

  // Seat click handler
  const handleSeatClick = (seatCode: string, status: string) => {
    if (status === "BOOKED") return;
    if (chosenSeatCodes.includes(seatCode)) {
      setChosenSeatCodes(chosenSeatCodes.filter((code) => code !== seatCode));
    } else {
      setChosenSeatCodes([...chosenSeatCodes, seatCode]);
    }
  };

  // Seating grid configurations matching Booking.tsx
  const getGridColsCount = (): number => {
    if (!selectedTrip || !selectedTrip.bus) return 4;
    const { capacity, type } = selectedTrip.bus;
    if (capacity === 16) return 4;
    if (capacity === 29) return 5;
    if (capacity === 45) return 5;
    if (type === "Sleeper" || capacity === 38 || capacity === 34) return 5;
    return 4;
  };

  const getMappedColIndex = (seat: any): number => {
    if (!selectedTrip || !selectedTrip.bus) return seat.colIndex;
    const { capacity } = selectedTrip.bus;
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

  const getSingleTicketPrice = (): number => {
    if (!selectedTrip) return 0;
    const departureDate = new Date(selectedTrip.departureTime);
    // Nếu có fareRule & đi cuối tuần thì áp weekendPrice
    const isWeekend = departureDate.getDay() === 0 || departureDate.getDay() === 6;
    if ((selectedTrip as any).fareRule) {
      return isWeekend
        ? (selectedTrip as any).fareRule.weekendPrice
        : (selectedTrip as any).fareRule.weekdayPrice;
    }
    return selectedTrip.journey?.price || selectedTrip.ticketPrice || 0;
  };

  const ticketPrice = getSingleTicketPrice();
  const totalAmount = ticketPrice * chosenSeatCodes.length;

  // Submit Counter Booking Form
  const onFinish = async (values: any) => {
    if (chosenSeatCodes.length === 0) {
      toast.error("Vui lòng chọn ít nhất một số ghế trên sơ đồ!");
      playBeep(true);
      return;
    }

    setBookingSubmitLoading(true);
    try {
      let finalUserId = "";

      // 1. Xử lý tài khoản khách hàng
      if (customerType === "existing") {
        if (!values.userId) {
          throw new Error("Vui lòng chọn tài khoản khách hàng trong danh sách!");
        }
        finalUserId = values.userId;
      } else {
        // Khách vãng lai mới: Tự tạo tài khoản vãng lai
        if (!values.username || !values.phone) {
          throw new Error("Vui lòng điền đầy đủ Tên và Số điện thoại khách hàng!");
        }
        
        // Đăng ký user vãng lai
        const emailVal = values.email || `${values.phone}@netbus.vn`;
        
        const registerUserRes = await axios.post("http://localhost:3000/api/tk/add", {
          username: values.username,
          email: emailVal,
          password: "123456",
          role: "user",
        });

        const createdUser = registerUserRes.data?.data || registerUserRes.data;
        if (!createdUser?._id) {
          throw new Error("Tự động đăng ký tài khoản khách vãng lai thất bại!");
        }
        finalUserId = createdUser._id;
      }

      // 2. Tạo đơn Booking (mặc định status ban đầu: Chờ xác nhận)
      const bookingBody = {
        user: finalUserId,
        trip: selectedTrip?._id,
        seats: chosenSeatCodes,
      };

      const bookingRes = await axios.post("http://localhost:3000/api/booking/add", bookingBody);
      const createdBooking = bookingRes.data?.data || bookingRes.data;

      if (!createdBooking?._id) {
        throw new Error("Không thể khởi tạo đơn đặt vé trên hệ thống!");
      }

      const bookingId = createdBooking._id;

      const ticketStorageData = {
        id: bookingId,
        ticketCode: `NB-${createdBooking.orderCode || bookingId.slice(-6).toUpperCase()}`,
        customerName: values.username || (customerType === "existing" ? (users.find(u => u._id === finalUserId)?.username || "Khách hàng") : "Khách vãng lai"),
        busName: selectedTrip?.bus?.name || "Xe NETBUS Luxury",
        licensePlate: selectedTrip?.bus?.licensePlates || "29B-123.45",
        journey: `${selectedTrip?.journey?.diemDi || "Điểm đi"} → ${selectedTrip?.journey?.diemDen || "Điểm đến"}`,
        seats: [...chosenSeatCodes],
        totalPrice: totalAmount,
        departureTime: selectedTrip?.departureTime 
          ? new Date(selectedTrip.departureTime).toLocaleString("vi-VN", {
              dateStyle: "short",
              timeStyle: "short"
            })
          : "Đang cập nhật..."
      };

      // 3. Xử lý theo hình thức thanh toán
      if (paymentMethod === "cash") {
        // Thanh toán TIỀN MẶT tại quầy: Cập nhật trực tiếp lên trạng thái nhân viên chọn
        const targetStatus = values.bookingStatus || "Đã xác nhận";
        
        await axios.put(`http://localhost:3000/api/booking/update/${bookingId}`, {
          status: targetStatus,
        });

        playBeep();
        setTimeout(playBeep, 150); // Bíp đôi thành công
        toast.success("Đặt vé tiền mặt thành công! Đang chuyển hướng in vé...");
        
        // Reset form & reload sơ đồ ghế
        setChosenSeatCodes([]);
        localStorage.setItem("latest_ticket_success", JSON.stringify(ticketStorageData));
        setSessionPaymentMethods(prev => ({ ...prev, [bookingId]: "cash" }));
        fetchBookingHistory();
        
        setTimeout(() => {
          navigate("/khachhang/booking/success");
        }, 1500);
      } else {
        // Thanh toán CHUYỂN KHOẢN qua PayOS
        setPendingTicketData(ticketStorageData);
        setSessionPaymentMethods(prev => ({ ...prev, [bookingId]: "payos" }));
        
        const paymentRes = await axios.post("http://localhost:3000/api/payment/create-link", {
          bookingId: bookingId,
        });

        if (paymentRes.data?.checkoutUrl) {
          setPayOSUrl(paymentRes.data.checkoutUrl);
          setCurrentBookingId(bookingId);
          setIsPayOSModalOpen(true);
          
          // Mở tab cổng thanh toán mới để quét QR PayOS
          window.open(paymentRes.data.checkoutUrl, "_blank");
          toast.success("Đã tạo liên kết thanh toán PayOS! Đang mở tab mới...");
        } else {
          throw new Error("Hệ thống không trả về link thanh toán PayOS hợp lệ!");
        }
      }
    } catch (err: any) {
      console.error("Lỗi đặt vé quầy:", err);
      toast.error(err.response?.data?.message || err.message || "Đặt vé thất bại!");
      playBeep(true);
    } finally {
      setBookingSubmitLoading(false);
    }
  };

  // PayOS completion refresh
  const handlePayOSComplete = async () => {
    setIsPayOSModalOpen(false);
    
    if (pendingTicketData) {
      if (currentBookingId) {
        setSessionPaymentMethods(prev => ({ ...prev, [currentBookingId]: "payos" }));
      }
      localStorage.setItem("latest_ticket_success", JSON.stringify(pendingTicketData));
      toast.success("Thanh toán thành công! Đang chuyển hướng in vé...");
      setTimeout(() => {
        navigate("/khachhang/booking/success");
      }, 1000);
    } else {
      setChosenSeatCodes([]);
      if (selectedTrip?._id) {
        await handleTripChange(selectedTrip._id);
      }
      form.resetFields(["username", "phone", "email"]);
      toast.success("Đã hoàn tất kiểm tra và tải lại sơ đồ ghế!");
      fetchBookingHistory();
    }
  };

  // Render visual seat item
  const renderSeatElement = (seat: any, totalCols: number, isSleeperBus: boolean, showCockpit: boolean) => {
    const isSelected = chosenSeatCodes.includes(seat.seatCode);
    const isAvailable = seat.status === "AVAILABLE";
    const isHolding = seat.status === "HOLDING";
    const isBooked = seat.status === "BOOKED";

    const gridRow = showCockpit ? seat.rowIndex + 1 : seat.rowIndex;
    const gridCol = getMappedColIndex(seat);

    let baseBg = "#ffffff";
    let borderCol = "#cbd5e1";
    let txtCol = "#334155";
    let pillowBg = "#f1f5f9";
    let armBg = "#cbd5e1";

    if (isSelected) {
      baseBg = "#eff6ff";
      borderCol = "#2563eb";
      txtCol = "#1d4ed8";
      pillowBg = "#dbeafe";
      armBg = "#3b82f6";
    } else if (isHolding) {
      baseBg = "#fff1f2";
      borderCol = "#f43f5e";
      txtCol = "#be123c";
      pillowBg = "#ffe4e6";
      armBg = "#fda4af";
    } else if (isBooked) {
      baseBg = "#f1f5f9";
      borderCol = "#cbd5e1";
      txtCol = "#94a3b8";
      pillowBg = "#cbd5e1";
      armBg = "#cbd5e1";
    }

    if (isSleeperBus) {
      return (
        <button
          key={seat.seatCode}
          type="button"
          disabled={isBooked}
          onClick={() => handleSeatClick(seat.seatCode, seat.status)}
          style={{
            gridColumnStart: gridCol,
            gridRowStart: gridRow,
            position: "relative",
            height: 58,
            width: "100%",
            background: "transparent",
            border: "none",
            cursor: isBooked ? "not-allowed" : "pointer",
            outline: "none",
          }}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Bed Body */}
            <div
              style={{
                position: "absolute",
                inset: "2px",
                backgroundColor: baseBg,
                border: `2px solid ${borderCol}`,
                borderRadius: 8,
                boxShadow: isSelected ? "0 4px 12px rgba(37, 99, 235, 0.15)" : "none",
                transition: "all 0.2s",
              }}
            />
            {/* Pillow */}
            <div
              style={{
                position: "absolute",
                top: 6,
                left: 6,
                right: 6,
                height: 10,
                backgroundColor: pillowBg,
                border: `1px solid ${borderCol}`,
                borderRadius: 1.5,
              }}
            />
            {/* Text */}
            <span
              style={{
                position: "relative",
                zIndex: 2,
                fontSize: "11px",
                fontWeight: isSelected ? 700 : 500,
                color: txtCol,
                marginTop: 10,
              }}
            >
              {seat.seatCode}
            </span>
          </div>
        </button>
      );
    } else {
      // Standard Seat Bus
      return (
        <button
          key={seat.seatCode}
          type="button"
          disabled={isBooked}
          onClick={() => handleSeatClick(seat.seatCode, seat.status)}
          style={{
            gridColumnStart: gridCol,
            gridRowStart: gridRow,
            position: "relative",
            height: 48,
            width: "100%",
            background: "transparent",
            border: "none",
            cursor: isBooked ? "not-allowed" : "pointer",
            outline: "none",
          }}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Seat Body */}
            <div
              style={{
                position: "absolute",
                top: 6,
                bottom: 0,
                left: 3,
                right: 3,
                backgroundColor: baseBg,
                border: `2.0px solid ${borderCol}`,
                borderRadius: "6px 6px 8px 8px",
                boxShadow: isSelected ? "0 4px 8px rgba(37, 99, 235, 0.12)" : "none",
              }}
            />
            {/* Headrest */}
            <div
              style={{
                position: "absolute",
                top: 1,
                width: "45%",
                height: 8,
                backgroundColor: baseBg,
                border: `2px solid ${borderCol}`,
                borderBottom: "none",
                borderRadius: "3px 3px 0 0",
              }}
            />
            {/* Armrests */}
            <div style={{ position: "absolute", top: 12, bottom: 4, left: 1, width: 3, backgroundColor: armBg, borderRadius: 1 }} />
            <div style={{ position: "absolute", top: 12, bottom: 4, right: 1, width: 3, backgroundColor: armBg, borderRadius: 1 }} />
            
            {/* Text */}
            <span
              style={{
                position: "relative",
                zIndex: 2,
                fontSize: "11px",
                fontWeight: isSelected ? 700 : 500,
                color: txtCol,
                marginTop: 4,
              }}
            >
              {seat.seatCode}
            </span>
          </div>
        </button>
      );
    }
  };

  const renderBusLayout = (floorNum: number) => {
    if (!selectedTrip) return null;
    const isSleeperBus = selectedTrip.bus?.type === "Sleeper";
    const seatsInFloor = selectedTrip.seats?.filter((s) => s.floor === floorNum) || [];
    const showCockpit = floorNum === 1;
    const totalCols = getGridColsCount();

    return (
      <div
        className="mx-auto max-w-[280px]"
        style={{
          position: "relative",
          background: "#ffffff",
          border: "4px solid #cbd5e1",
          borderRadius: "32px 32px 16px 16px",
          padding: "24px 16px 16px 16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
          marginTop: 10,
        }}
      >
        {/* Windshield */}
        <div
          style={{
            height: 14,
            background: "linear-gradient(to bottom, #475569, #1e293b)",
            borderRadius: "10px 10px 2px 2px",
            marginBottom: 16,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 4,
              left: "50%",
              transform: "translateX(-50%)",
              width: 30,
              height: 2,
              backgroundColor: "#94a3b8",
              borderRadius: 1,
            }}
          />
        </div>

        {/* Side mirrors */}
        <div style={{ position: "absolute", top: 20, left: -6, width: 6, height: 16, background: "#334155", borderRadius: "3px 0 0 3px" }} />
        <div style={{ position: "absolute", top: 20, right: -6, width: 6, height: 16, background: "#334155", borderRadius: "0 3px 3px 0" }} />

        {/* Grid Seats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
            gap: "12px 10px",
          }}
        >
          {/* Driver Cockpit */}
          {showCockpit && (
            <>
              <div className="flex items-center justify-center h-10" style={{ gridColumnStart: 1, gridRowStart: 1 }}>
                <div className="flex flex-col items-center text-gray-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: "rotate(-45deg)" }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                  <span className="text-[7px] mt-0.5 font-bold tracking-wider">LÁI XE</span>
                </div>
              </div>
              {Array.from({ length: totalCols - 2 }).map((_, idx) => (
                <div key={`empty-cockpit-${idx}`} style={{ gridColumnStart: idx + 2, gridRowStart: 1 }} />
              ))}
              <div className="flex items-center justify-center h-10" style={{ gridColumnStart: totalCols, gridRowStart: 1 }}>
                <div className="border border-dashed border-gray-300 bg-slate-50 text-gray-400 text-[7px] p-1 text-center font-bold rounded">
                  CỬA LÊN
                </div>
              </div>
            </>
          )}

          {/* Render real seats */}
          {seatsInFloor.map((seat) => renderSeatElement(seat, totalCols, isSleeperBus, showCockpit))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đặt vé tại quầy (Offline Booking)</h1>
          <p className="text-gray-500 text-sm">Hệ thống hỗ trợ nhân viên phòng vé đặt vé trực tiếp và thu tiền mặt hoặc thanh toán QR PayOS.</p>
        </div>
        <Button 
          type="primary" 
          icon={<ShoppingCartOutlined />} 
          onClick={() => navigate("/admin/offline-booking/history")}
          className="bg-emerald-600 hover:bg-emerald-700 h-10 font-bold rounded-lg self-start md:self-auto"
        >
          Xem lịch sử đặt vé tại quầy
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {/* Column 1: Selection and Customer Form */}
        <Col span={24} lg={13}>
          <Card title={<Space><ShoppingCartOutlined className="text-green-600" /><span className="font-semibold text-base">Thông tin đặt vé</span></Space>} className="shadow-xs rounded-xl">
            <Form form={form} layout="vertical" onFinish={onFinish}>
              {/* Trip Selection dropdown */}
              <Form.Item
                label="Chọn Chuyến xe (Trip)"
                name="tripId"
                rules={[{ required: true, message: "Vui lòng chọn chuyến xe đi!" }]}
              >
                <Select
                  showSearch
                  placeholder="Tìm chuyến đi (Nơi đi - Nơi đến hoặc giờ đi...)"
                  loading={tripsLoading}
                  onChange={handleTripChange}
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={trips.map((t) => ({
                    value: t._id,
                    label: `${t.journey?.diemDi} → ${t.journey?.diemDen} | Khởi hành: ${new Date(t.departureTime).toLocaleString("vi-VN")} | Xe: ${t.bus?.name} (${t.bus?.licensePlates}) | ${t.ticketPrice.toLocaleString("vi-VN")} đ`,
                  }))}
                />
              </Form.Item>

              {/* Trip summary card if selected */}
              {selectedTrip && (
                <div className="p-4 bg-slate-50 border rounded-xl space-y-2 text-xs text-gray-600 mb-5">
                  <div className="flex justify-between">
                    <span>Hành trình:</span>
                    <strong className="text-blue-600 text-sm">{selectedTrip.journey?.diemDi} → {selectedTrip.journey?.diemDen}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian đi:</span>
                    <strong>{new Date(selectedTrip.departureTime).toLocaleString("vi-VN")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Phương tiện xe:</span>
                    <strong>{selectedTrip.bus?.name} ({selectedTrip.bus?.licensePlates} - {selectedTrip.bus?.type === "Sleeper" ? "Giường nằm" : "Ghế ngồi"} {selectedTrip.bus?.capacity} chỗ)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Đơn giá vé:</span>
                    <strong className="text-red-500">{ticketPrice.toLocaleString("vi-VN")} đ / ghế</strong>
                  </div>
                </div>
              )}

              <Divider style={{ margin: "16px 0" }} />

              {/* Customer Type radio */}
              <Form.Item label="Đối tượng khách hàng" name="customerType" initialValue="guest">
                <Radio.Group onChange={(e) => setCustomerType(e.target.value)}>
                  <Radio.Button value="guest">Khách vãng lai mới</Radio.Button>
                  <Radio.Button value="existing">Khách hàng cũ (Đã có tài khoản)</Radio.Button>
                </Radio.Group>
              </Form.Item>

              {/* Conditional customer forms */}
              {customerType === "existing" ? (
                <Form.Item
                  label="Chọn tài khoản khách hàng"
                  name="userId"
                  rules={[{ required: true, message: "Vui lòng chọn tài khoản khách đặt!" }]}
                >
                  <Select
                    showSearch
                    placeholder="Tìm theo Tên hoặc Email hoặc Số điện thoại..."
                    loading={usersLoading}
                    filterOption={(input, option) =>
                      (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                    options={users.map((u) => ({
                      value: u._id,
                      label: `${u.username} | Email: ${u.email} | SĐT: ${u.phone || u.sdt || "Chưa cập nhật"}`,
                    }))}
                  />
                </Form.Item>
              ) : (
                <div className="bg-slate-50/50 p-4 border border-dashed rounded-xl space-y-4 mb-4">
                  <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">Thông tin khách hàng mới</span>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Họ và Tên khách hàng"
                        name="username"
                        rules={[{ required: customerType === "guest", message: "Vui lòng nhập tên!" }]}
                      >
                        <Input placeholder="Nguyễn Văn A" prefix={<UserOutlined className="text-gray-400" />} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Số điện thoại liên hệ"
                        name="phone"
                        rules={[{ required: customerType === "guest", message: "Vui lòng nhập SĐT!" }]}
                      >
                        <Input placeholder="0987xxxxxx" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    label="Địa chỉ Email (Không bắt buộc)"
                    name="email"
                  >
                    <Input placeholder="customer@gmail.com" />
                  </Form.Item>
                </div>
              )}

              <Divider style={{ margin: "16px 0" }} />

              {/* Payment Method Radio */}
              <Form.Item label="Phương thức thanh toán tại quầy" name="paymentMethod" initialValue="cash">
                <Radio.Group onChange={(e) => setPaymentMethod(e.target.value)} className="w-full">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Radio.Button value="cash" className="w-full text-center h-11 flex items-center justify-center gap-2 font-semibold">
                        <DollarOutlined className="text-green-600 text-lg" /> Tiền mặt
                      </Radio.Button>
                    </Col>
                    <Col span={12}>
                      <Radio.Button value="payos" className="w-full text-center h-11 flex items-center justify-center gap-2 font-semibold">
                        <CreditCardOutlined className="text-blue-600 text-lg" /> Chuyển khoản (PayOS)
                      </Radio.Button>
                    </Col>
                  </Row>
                </Radio.Group>
              </Form.Item>

              {/* Booking status for cash booking */}
              {paymentMethod === "cash" && (
                <Form.Item
                  label="Trạng thái khi hoàn thành đặt vé"
                  name="bookingStatus"
                  initialValue="Đã xác nhận"
                  help="Chọn Đã xác nhận nếu khách hàng đã giao tiền mặt cho bạn."
                >
                  <Select
                    options={[
                      { label: "Đã xác nhận (Đã thu tiền mặt)", value: "Đã xác nhận" },
                      { label: "Đã checkin (Lên xe luôn)", value: "Đã checkin" },
                      { label: "Chờ xác nhận (Tạm giữ chỗ)", value: "Chờ xác nhận" },
                    ]}
                  />
                </Form.Item>
              )}

              {paymentMethod === "payos" && (
                <Alert
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  message="Lưu ý về Chuyển khoản PayOS"
                  description="Sau khi click Đặt vé, hệ thống sẽ tạo link QR thanh toán PayOS. Hệ thống tự động chuyển trạng thái sang Đã xác nhận khi khách quét QR thanh toán thành công!"
                  className="mb-4"
                />
              )}

              {/* Display selection summary */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/80 flex justify-between items-center text-emerald-800 mb-5">
                <div>
                  Ghế đang chọn:{" "}
                  {chosenSeatCodes.length > 0 ? (
                    chosenSeatCodes.map((c) => (
                      <Tag color="emerald" key={c} className="font-bold">{c}</Tag>
                    ))
                  ) : (
                    <span className="text-gray-400 font-medium italic">Chưa chọn ghế</span>
                  )}
                </div>
                <div>
                  Thành tiền: <strong className="text-red-500 text-lg font-extrabold">{totalAmount.toLocaleString("vi-VN")} đ</strong>
                </div>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                loading={bookingSubmitLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-bold rounded-xl border-none shadow-md"
                disabled={!selectedTrip}
              >
                Xác nhận Đặt vé Quầy
              </Button>
            </Form>
        </Card>
      </Col>

      {/* Column 2: Interactive Seat Map layout */}
      <Col span={24} lg={11}>
        <Card
          title={
            <Space>
              <TeamOutlined className="text-blue-600" />
              <span className="font-semibold text-base">Sơ đồ chọn vị trí ghế</span>
            </Space>
          }
          className="shadow-xs rounded-xl text-center min-h-[500px]"
        >
          {tripDetailLoading ? (
            <Flex align="center" justify="center" style={{ height: 350 }}>
              <Spin size="large" tip="Đang tải sơ đồ ghế..." />
            </Flex>
          ) : !selectedTrip ? (
            <Flex align="center" justify="center" style={{ height: 350 }}>
              <div className="text-gray-400">
                <InfoCircleOutlined className="text-4xl mb-3 block mx-auto text-gray-300" />
                Vui lòng chọn chuyến xe ở cột bên trái để hiển thị sơ đồ vị trí ghế
              </div>
            </Flex>
          ) : (
            <div className="space-y-4">
              {/* Legend items */}
              <Flex gap="small" justify="center" wrap="wrap" className="border-b pb-4 mb-2 text-xs">
                <Space><div className="w-4 h-4 bg-white border border-gray-300 rounded" /><span>Trống</span></Space>
                <Space><div className="w-4 h-4 bg-blue-100 border border-blue-600 rounded" /><span>Đang chọn</span></Space>
                <Space><div className="w-4 h-4 bg-red-100 border border-red-400 rounded" /><span>Đang giữ</span></Space>
                <Space><div className="w-4 h-4 bg-slate-100 border border-gray-300 rounded" /><span>Đã bán</span></Space>
              </Flex>

              {/* Sleeper bus floors switch tab */}
              {selectedTrip.bus?.type === "Sleeper" ? (
                <div>
                  <Flex justify="center" style={{ marginBottom: 16 }}>
                    <div className="inline-flex p-1 bg-slate-100 rounded-xl border">
                      <button
                         type="button"
                         onClick={() => setActiveFloor(1)}
                         className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                           activeFloor === 1 ? "bg-white text-blue-600 shadow-xs" : "text-gray-500 bg-transparent"
                         }`}
                      >
                        Tầng 1 (Dưới)
                      </button>
                      <button
                         type="button"
                         onClick={() => setActiveFloor(2)}
                         className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                           activeFloor === 2 ? "bg-white text-blue-600 shadow-xs" : "text-gray-500 bg-transparent"
                         }`}
                      >
                        Tầng 2 (Trên)
                      </button>
                    </div>
                  </Flex>

                  <Row gutter={16} justify="center">
                    <Col span={24} className={activeFloor === 1 ? "block" : "hidden"}>
                      <div className="text-blue-900 font-bold text-xs mb-1">TẦNG DƯỚI (TẦNG 1)</div>
                      {renderBusLayout(1)}
                    </Col>
                    <Col span={24} className={activeFloor === 2 ? "block" : "hidden"}>
                      <div className="text-blue-900 font-bold text-xs mb-1">TẦNG TRÊN (TẦNG 2)</div>
                      {renderBusLayout(2)}
                    </Col>
                  </Row>
                </div>
              ) : (
                <div>
                  <div className="text-blue-900 font-bold text-xs mb-1">SƠ ĐỒ VỊ TRÍ GHẾ</div>
                  {renderBusLayout(1)}
                </div>
              )}
            </div>
          )}
        </Card>
      </Col>
    </Row>


    {/* PayOS Modal Link */}
    <Modal
      open={isPayOSModalOpen}
      title={
        <Space>
          <QrcodeOutlined className="text-blue-600 text-lg" />
          <span className="font-bold text-lg">Cổng Thanh Toán Chuyển Khoản (PayOS)</span>
        </Space>
      }
      onCancel={handlePayOSComplete}
      footer={[
        <Button key="paid" type="primary" className="bg-emerald-600 hover:bg-emerald-700" onClick={handlePayOSComplete}>
          Hoàn tất đặt vé & tải lại sơ đồ
        </Button>,
      ]}
      width={550}
      centered
      destroyOnClose
    >
      <div className="space-y-4 pt-3 text-center">
        <p className="text-sm text-gray-600">
          Link thanh toán PayOS QR đã được tạo thành công cho đơn đặt vé này. Nhân viên hãy hướng dẫn khách hàng quét mã QR trên màn hình hoặc click nút bên dưới:
        </p>

        <div className="p-4 bg-slate-50 border rounded-xl inline-block max-w-full">
          <Button
            type="primary"
            icon={<QrcodeOutlined />}
            size="large"
            className="bg-blue-600 hover:bg-blue-700 font-bold px-8 h-12"
            onClick={() => window.open(payOSUrl, "_blank")}
          >
            Mở Cổng QR Thanh Toán (PayOS)
          </Button>
          <div className="text-xs text-gray-400 mt-2">
            * Tab thanh toán PayOS được mở trong cửa sổ mới.
          </div>
        </div>

        <Alert
          type="warning"
          message="Khách hàng quét mã & chuyển khoản"
          description="Sau khi khách hàng chuyển khoản xong, trạng thái của ghế trên sơ đồ sẽ tự động chuyển sang Đã bán (đỏ) thông qua Webhook PayOS của hệ thống."
          showIcon
        />
      </div>
    </Modal>
  </div>
  );
}

export default OfflineBookingPage;
