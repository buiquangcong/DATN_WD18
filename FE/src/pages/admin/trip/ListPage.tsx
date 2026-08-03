import { Popconfirm, Space, Table, Button, Tag, Modal, Divider, Input, Select, Card } from "antd";
import { useCRUD, useDetail } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Html5Qrcode } from "html5-qrcode";
import toast from "react-hot-toast";
import axios from "axios";
import { QrcodeOutlined, TeamOutlined } from "@ant-design/icons";

interface BookingType {
  _id: string;
  orderCode?: number | string;
  user?: {
    _id: string;
    username: string;
    email: string;
    phone?: string;
    sdt?: string;
  };
  trip?: any;
  seats: string[];
  totalPrice: number;
  status: string;
}

const bookingStatusColorMap: Record<string, string> = {
  "Đã xác nhận": "green",
  "Đã huỷ": "red",
  "Hoàn thành": "blue",
  "Đã checkin": "blue",
  "Đã check-in": "blue",
  "Chờ xác nhận": "orange",
};

interface DiemType {
  _id?: string;
  diaDiem: string;
  offsetMinutes: number;
}

interface JourneyType {
  _id: string;
  diemDi: string;
  diemDen: string;
  quangDuong?: number;
  thoiGianDiChuyen?: string;
  diemDon?: DiemType[];
  diemTra?: DiemType[];
}

interface BusType {
  _id: string;
  name: string;
  licensePlates: string;
  capacity: number;
  type?: string;
  status?: string;
}

interface FareRuleType {
  _id: string;
  weekdayPrice: number;
  weekendPrice: number;
  holidayPrice: number;
  capacity: number;
}

interface staffType {
  _id: string;
  ten: string;
  email: string;
  sdt: string;
  cccd: string;
  chucVu: string;
}

interface TripType {
  _id: string;
  journey: JourneyType;
  bus: BusType;
  staff: staffType;
  fareRule: FareRuleType;
  departureTime: string;
  ticketPrice: number;
  arrivalTime: string;
  status: "sắp chạy" | "đang chạy" | "hoàn thành" | "huỷ";

  seats: {
    seatCode: string;
    status: "AVAILABLE" | "HOLDING" | "BOOKED";
  }[];
}

interface BookingType {
  _id: string;

  user?: {
    _id: string;
    username: string;
    email: string;
  };

  trip?: {
    _id: string;
  };

  seats: string[];
  totalPrice: number;

  status:
    | "Chờ xác nhận"
    | "Đã xác nhận"
    | "Đã huỷ"
    | "Hoàn thành";

  createdAt: string;
}

const bookingStatusColorMap: Record<string, string> = {
  "Đã xác nhận": "green",
  "Đã huỷ": "red",
  "Hoàn thành": "blue",
  "Chờ xác nhận": "orange",
};

function TripListPage() {
  const navigate = useNavigate();
  const { list, Delete } = useCRUD("trip");
  const { list: bookings } = useCRUD("booking");

  const [selectedId, setSelectedId] = useState<string>();
  const [open, setOpen] = useState(false);

  // State cho modal danh sách khách đặt vé (bấm vào ô Số ghế)
  const [selectedBookingTripId, setSelectedBookingTripId] = useState<string>();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // State quản lý tìm kiếm và bộ lọc trạng thái
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const { data: trip, isLoading } = useDetail("trip", selectedId);

  // State và Logic quét mã QR Check-in Khách
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [scannedBooking, setScannedBooking] = useState<BookingType | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [html5QrCodeInstance, setHtml5QrCodeInstance] = useState<Html5Qrcode | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

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
    if (!trip) return;

    // Kiểm tra chuyến xe đã hoàn thành hay chưa
    if (trip.status === "hoàn thành") {
      playBeep(true);
      toast.error("Chuyến xe đã hoàn thành, không thể check-in!");
      return;
    }

    // Kiểm tra thời gian check-in (chỉ được phép trước/sau giờ xe chạy 15 phút)
    if (trip.departureTime) {
      const now = dayjs();
      const departure = dayjs(trip.departureTime);
      const diffMinutes = now.diff(departure, "minute");

      if (diffMinutes < -15 || diffMinutes > 15) {
        playBeep(true);
        toast.error("Chỉ được phép check-in trong khoảng từ 15 phút trước đến 15 phút sau giờ xe chạy!");
        return;
      }
    }

    // Trích xuất mã vé ID từ nội dung QR nếu có định dạng text
    let bookingId = decodedText;
    if (decodedText.includes("Mã vé:")) {
      const match = decodedText.match(/Mã vé:\s*([^\n\r]+)/);
      if (match && match[1]) {
        bookingId = match[1].trim();
      }
    }

    try {
      // Gọi API lấy chi tiết đặt vé
      const res = await axios.get(`http://localhost:3000/api/booking/${bookingId}`);
      const bookingData = res.data;

      if (!bookingData) {
        playBeep(true);
        toast.error("Không tìm thấy thông tin vé!");
        return;
      }

      // Kiểm tra xem vé có thuộc đúng chuyến xe hiện tại đang xem hay không
      const tripIdOfBooking = bookingData.trip?._id || bookingData.trip;
      const currentTripId = trip?._id;

      if (String(tripIdOfBooking) !== String(currentTripId)) {
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
              <p className="text-xs text-gray-500 mt-2">* Vui lòng kiểm tra lại vé của khách hàng hoặc đổi chuyến xe phù hợp.</p>
            </div>
          ),
          okText: "Đã hiểu"
        });
        return;
      }

      // Kiểm tra trạng thái của vé
      if (bookingData.status === "Hoàn thành" || bookingData.status === "Đã checkin" || bookingData.status === "Đã check-in") {
        playBeep(true);
        toast.error(`Vé này đã được check-in trước đó!`);
        return;
      }

      if (bookingData.status === "Đã huỷ") {
        playBeep(true);
        toast.error(`Vé này đã bị hủy trên hệ thống!`);
        return;
      }

      // TIẾN HÀNH TỰ ĐỘNG CHECK-IN NGAY LẬP TỨC
      await stopScanner(instance);
      
      await axios.put(`http://localhost:3000/api/booking/update/${bookingData._id}`, {
        status: "Đã checkin"
      });

      playBeep();
      setTimeout(playBeep, 150); // Bíp đôi

      toast.success(`Tự động Check-in thành công cho khách hàng ${bookingData.user?.username || "NETBUS"}!`);

      // Làm mới dữ liệu chuyến xe hiện tại và bảng danh sách
      window.dispatchEvent(new Event("storage"));
      
      setIsScannerOpen(false);
    } catch (err: any) {
      console.error("Lỗi khi quét hoặc check-in vé:", err);
      
      // Fallback: Tìm theo orderCode nếu là số
      const searchCode = bookingId.trim();
      if (/^\d+$/.test(searchCode)) {
        try {
          const bookingsRes = await axios.get("http://localhost:3000/api/booking");
          const allBookings = bookingsRes.data || [];
          const foundBooking = allBookings.find(
            (b: any) => String(b.orderCode) === searchCode
          );

          if (foundBooking) {
            const tripIdOfBooking = foundBooking.trip?._id || foundBooking.trip;
            const currentTripId = trip?._id;

            if (String(tripIdOfBooking) !== String(currentTripId)) {
              playBeep(true);
              const journeyDi = foundBooking.trip?.journey?.diemDi || "Chưa rõ";
              const journeyDen = foundBooking.trip?.journey?.diemDen || "Chưa rõ";
              const departureTime = foundBooking.trip?.departureTime 
                ? new Date(foundBooking.trip.departureTime).toLocaleString("vi-VN") 
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

            if (foundBooking.status === "Hoàn thành" || foundBooking.status === "Đã checkin" || foundBooking.status === "Đã check-in") {
              playBeep(true);
              toast.error(`Vé này đã được check-in trước đó!`);
              return;
            }

            if (foundBooking.status === "Đã huỷ") {
              playBeep(true);
              toast.error(`Vé này đã bị hủy trên hệ thống!`);
              return;
            }

            await stopScanner(instance);
            
            await axios.put(`http://localhost:3000/api/booking/update/${foundBooking._id}`, {
              status: "Đã checkin"
            });

            playBeep();
            setTimeout(playBeep, 150);

            toast.success(`Tự động Check-in thành công cho khách hàng ${foundBooking.user?.username || "NETBUS"}!`);

            window.dispatchEvent(new Event("storage"));
            setIsScannerOpen(false);
            return;
          }
        } catch (e) {}
      }
      playBeep(true);
      toast.error("Quét vé thất bại. Vé không hợp lệ hoặc lỗi kết nối!");
    }
  };

  const startScanner = async (cameraId: string) => {
    if (!cameraId) return;
    try {
      setIsScanning(true);
      setTimeout(async () => {
        try {
          const instance = new Html5Qrcode("trip-qr-reader");
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
            () => {
              // Bỏ qua lỗi đọc camera định kỳ
            }
          );
        } catch (err: any) {
          console.error("Lỗi khi start camera:", err);
          toast.error("Không thể kích hoạt camera: " + err.message);
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

  const handleConfirmCheckin = async () => {
    if (!scannedBooking) return;
    setIsCheckingIn(true);
    try {
      await axios.put(`http://localhost:3000/api/booking/update/${scannedBooking._id}`, {
        status: "Hoàn thành"
      });

      playBeep();
      setTimeout(playBeep, 150);

      toast.success(`Check-in thành công cho khách hàng ${scannedBooking.user?.username || "NETBUS"}!`);

      // Làm mới dữ liệu chuyến xe hiện tại và bảng danh sách
      window.dispatchEvent(new Event("storage"));
      
      setScannedBooking(null);
      setIsScannerOpen(false);
    } catch (error: any) {
      console.error("Lỗi check-in:", error);
      toast.error(error.response?.data?.message || "Check-in thất bại!");
    } finally {
      setIsCheckingIn(false);
    }
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
            toast.error("Không tìm thấy camera khả dụng!");
          }
        })
        .catch((err) => {
          console.error("Lỗi lấy danh sách camera:", err);
          toast.error("Vui lòng cấp quyền truy cập camera!");
        });
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isScannerOpen]);

  useEffect(() => {
    if (trip) setOpen(true);
  }, [trip]);

  // State và Logic xem Danh sách khách đặt vé
  const [isCustomerListOpen, setIsCustomerListOpen] = useState(false);
  const [tripBookings, setTripBookings] = useState<BookingType[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const fetchTripBookings = async (currentTripId: string) => {
    if (!currentTripId) return;
    setBookingsLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/api/booking");
      const allBookings = res.data || [];
      const filtered = allBookings.filter(
        (b: any) => String(b.trip?._id || b.trip) === String(currentTripId)
      );
      setTripBookings(filtered);
    } catch (err) {
      console.error("Lỗi lấy danh sách khách đặt:", err);
      toast.error("Không thể tải danh sách khách đặt vé!");
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleOpenCustomerList = async () => {
    if (!trip?._id) return;
    setIsCustomerListOpen(true);
    await fetchTripBookings(trip._id);
  };

  const handleDirectCheckin = async (bookingId: string, customerName: string) => {
    if (!trip) return;

    // Kiểm tra chuyến xe đã hoàn thành hay chưa
    if (trip.status === "hoàn thành") {
      playBeep(true);
      toast.error("Chuyến xe đã hoàn thành, không thể check-in!");
      return;
    }

    // Kiểm tra thời gian check-in (chỉ được phép trước/sau giờ xe chạy 15 phút)
    if (trip.departureTime) {
      const now = dayjs();
      const departure = dayjs(trip.departureTime);
      const diffMinutes = now.diff(departure, "minute");

      if (diffMinutes < -15 || diffMinutes > 15) {
        playBeep(true);
        toast.error("Chỉ được phép check-in trong khoảng từ 15 phút trước đến 15 phút sau giờ xe chạy!");
        return;
      }
    }

    try {
      await axios.put(`http://localhost:3000/api/booking/update/${bookingId}`, {
        status: "Đã checkin"
      });

      playBeep();
      setTimeout(playBeep, 150);

      toast.success(`Check-in thành công cho khách hàng ${customerName}!`);
      
      // Đồng bộ làm mới bảng ở trang chính
      window.dispatchEvent(new Event("storage"));

      // Làm mới danh sách trong modal hiện tại
      if (trip?._id) {
        await fetchTripBookings(trip._id);
      }
    } catch (error: any) {
      console.error("Lỗi check-in:", error);
      toast.error(error.response?.data?.message || "Check-in thất bại!");
    }
  };

  const handleView = (id: string) => {
    setSelectedId(id);
  };

  const handleViewBookings = (tripId: string) => {
    setSelectedBookingTripId(tripId);
    setBookingModalOpen(true);
  };

  const statusColorMap: Record<string, string> = {
    "sắp chạy": "blue",
    "đang chạy": "green",
    "hoàn thành": "gray",
    "huỷ": "red",
  };

  // Logic lọc dữ liệu
  const filteredList = list?.filter((item: TripType) => {
    const searchLower = searchText.toLowerCase().trim();

    const matchesSearch =
      !searchLower ||
      item.journey?.diemDi?.toLowerCase().includes(searchLower) ||
      item.journey?.diemDen?.toLowerCase().includes(searchLower) ||
      item.bus?.name?.toLowerCase().includes(searchLower) ||
      item.bus?.licensePlates?.toLowerCase().includes(searchLower) ||
      item.staff?.ten?.toLowerCase().includes(searchLower);

    const matchesStatus =
      selectedStatus === "All" || item.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const selectedBookingTrip = (list || []).find(
    (t: TripType) => t._id === selectedBookingTripId
  );

  const tripBookings = (bookings || []).filter(
    (b: BookingType) => b.trip?._id === selectedBookingTripId
  );

  const bookingColumns: ColumnsType<BookingType> = [
    {
      title: "Khách hàng",
      render: (_, record) => record.user?.username || "Hành khách NETBUS",
    },
    {
      title: "Email",
      render: (_, record) => record.user?.email || "Chưa cập nhật",
    },
    {
      title: "Ghế",
      render: (_, record) => (
        <Tag color="blue">{record.seats?.join(", ") || "Chưa chọn"}</Tag>
      ),
    },
    {
      title: "Tổng tiền",
      render: (_, record) => (
        <span className="text-green-600 font-semibold">
          {(record.totalPrice || 0).toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      title: "Trạng thái",
      render: (_, record) => (
        <Tag color={bookingStatusColorMap[record.status] || "orange"}>
          {record.status || "Chờ xác nhận"}
        </Tag>
      ),
    },
    {
      title: "Ngày đặt",
      render: (_, record) =>
        record.createdAt
          ? new Date(record.createdAt).toLocaleString("vi-VN")
          : "Đang cập nhật...",
    },
  ];

  const columns: ColumnsType<TripType> = [
    {
      title: "Tuyến đường",
      render: (_, record) => (
        <strong>
          {record.journey?.diemDi} → {record.journey?.diemDen}
        </strong>
      ),
    },
    {
      title: "Xe",
      render: (_, record) => (
        <span>
          {record.bus?.name} ({record.bus?.licensePlates})
        </span>
      ),
    },
    {
      title: "Thời gian khởi hành",
      dataIndex: "departureTime",
      render: (time: string) => (
        <span>{time ? new Date(time).toLocaleString("vi-VN") : "---"}</span>
      ),
    },
    {
      title: "Thời gian đến",
      render: (_, record) =>
        record.arrivalTime
          ? new Date(record.arrivalTime).toLocaleString("vi-VN")
          : "---",
    },
    {
      title: "Giá vé",
      render: (_, record) => (
        <span className="text-green-600 font-medium">
          {record.ticketPrice?.toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      title: "Số ghế",
      render: (_, record) => {
        const booked =
          record.seats?.filter((seat) => seat.status === "BOOKED").length || 0;
        const total = record.bus?.capacity || 0;

        return (
          <Tag
            color="blue"
            className="cursor-pointer hover:opacity-75"
            onClick={() => handleViewBookings(record._id)}
          >
            {booked}/{total}
          </Tag>
        );
      },
    },
    {
      title: "Nhân viên",
      render: (_, record) => (
        <span>{record.staff?.ten || "Chưa phân công"}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: string) => (
        <Tag color={statusColorMap[status] || "default"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleView(record._id)}>Xem</Button>

          <Button
            type="primary"
            onClick={() => navigate(`/admin/trip/edit/${record._id}`)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xoá chuyến xe"
            onConfirm={() => Delete(record._id)}
            okText="Có"
            cancelText="Không"
            okButtonProps={{ danger: true }}
          >
            <Button danger>Xoá</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Chuyến Đi</h1>
          <p className="text-sm text-gray-500">
            Quản lý thông tin lịch trình, xe, tài xế và giá vé cho từng chuyến.
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          className="bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm font-semibold rounded-lg"
          onClick={() => navigate("/admin/trip/add")}
        >
          Thêm Chuyến Mới
        </Button>
      </div>

      {/* CARD BỘ LỌC VÀ BẢNG */}
      <Card className="shadow-xs border border-gray-100 rounded-xl bg-white">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input.Search
              placeholder="Tìm theo tuyến đường, tên xe, biển số hoặc nhân viên..."
              allowClear
              size="large"
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
              className="w-full"
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              placeholder="Lọc theo trạng thái"
              size="large"
              className="w-full"
              defaultValue="All"
              onChange={(value) => setSelectedStatus(value)}
              options={[
                { value: "All", label: "Tất cả trạng thái" },
                { value: "sắp chạy", label: "Sắp chạy" },
                { value: "đang chạy", label: "Đang chạy" },
                { value: "hoàn thành", label: "Hoàn thành" },
                { value: "huỷ", label: "Huỷ" },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredList}
            rowKey="_id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng số ${total} chuyến đi`,
            }}
          />
        </div>
      </Card>

      {/* MODAL CHI TIẾT */}
      <Modal
        title={
          trip
            ? `${trip.journey?.diemDi ?? ""} → ${trip.journey?.diemDen ?? ""}`
            : "Chi tiết chuyến"
        }
        open={open}
        onCancel={() => {
          setOpen(false);
          setSelectedId(undefined);
        }}
        footer={
          <Space>
            {trip && (
              <>
                <Button
                  type="default"
                  icon={<TeamOutlined />}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-medium flex items-center gap-1.5 shadow-xs"
                  onClick={handleOpenCustomerList}
                >
                  Danh sách khách đặt
                </Button>
                <Button
                  type="primary"
                  icon={<QrcodeOutlined />}
                  className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-lg font-medium flex items-center gap-1.5 shadow-xs"
                  onClick={() => setIsScannerOpen(true)}
                >
                  Quét QR Check-in Khách
                </Button>
              </>
            )}
            <Button
              onClick={() => {
                setOpen(false);
                setSelectedId(undefined);
              }}
            >
              Đóng
            </Button>
          </Space>
        }
        width={900}
      >
        {!trip ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Tuyến đường</p>
                <p className="font-medium">
                  {trip.journey?.diemDi} → {trip.journey?.diemDen}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Quãng đường</p>
                <p>{trip.journey?.quangDuong} km</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Thời gian di chuyển</p>
                <p>{trip.journey?.thoiGianDiChuyen}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Giá ngày thường</p>
                <p className="text-green-600 font-semibold">
                  {trip.ticketPrice?.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Giá cuối tuần</p>
                <p className="text-orange-600 font-semibold">
                  {trip.fareRule?.weekendPrice?.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Giá ngày lễ</p>
                <p className="text-red-600 font-semibold">
                  {trip.fareRule?.holidayPrice?.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Thời gian khởi hành</p>
                <p>{new Date(trip.departureTime).toLocaleString("vi-VN")}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Trạng thái chuyến</p>
                <Tag color={statusColorMap[trip.status]}>
                  {trip.status}
                </Tag>
              </div>
            </div>

            <Divider />

            {/* BUS INFO */}
            <div>
              <h3 className="font-semibold mb-2">Thông tin xe</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Tên xe</p>
                  <p>{trip.bus?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Biển số</p>
                  <p>{trip.bus?.licensePlates}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Số ghế</p>
                  <p>{trip.bus?.capacity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Loại xe</p>
                  <p>{trip.bus?.type || "Không có"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Trạng thái xe</p>
                  <p>{trip.bus?.status}</p>
                </div>
              </div>
            </div>

            <Divider />

            {/* PICKUP POINTS */}
            <div>
              <h3 className="font-semibold mb-2">Điểm đón</h3>
              <div className="space-y-1">
                {trip.journey?.diemDon?.map((item: DiemType, index: number) => (
                  <p key={item._id || index}>
                    🕒{" "}
                    {dayjs(trip.departureTime)
                      .add(item.offsetMinutes, "minute")
                      .format("DD/MM/YYYY HH:mm")}{" "}
                    - 📍 {item.diaDiem}
                  </p>
                ))}
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="font-semibold mb-2">Điểm trả</h3>
              <div className="space-y-1">
                {trip.journey?.diemTra?.map((item: DiemType, index: number) => (
                  <p key={item._id || index}>
                    🕒{" "}
                    {dayjs(trip.arrivalTime)
                      .subtract(item.offsetMinutes, "minute")
                      .format("DD/MM/YYYY HH:mm")}{" "}
                    - 📍 {item.diaDiem}
                  </p>
                ))}
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="font-semibold mb-2">Nhân viên phụ trách</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Họ tên</p>
                  <p>{trip.staff?.ten}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p>{trip.staff?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Số điện thoại</p>
                  <p>{trip.staff?.sdt}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">CCCD</p>
                  <p>{trip.staff?.cccd}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Chức vụ</p>
                  <p>{trip.staff?.chucVu}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL DANH SÁCH KHÁCH ĐẶT VÉ - mở khi bấm vào ô Số ghế */}
      <Modal
        title={
          selectedBookingTrip
            ? `Danh sách khách đặt vé: ${selectedBookingTrip.journey?.diemDi} → ${selectedBookingTrip.journey?.diemDen}`
            : "Danh sách khách đặt vé"
        }
        open={bookingModalOpen}
        onCancel={() => {
          setBookingModalOpen(false);
          setSelectedBookingTripId(undefined);
        }}
        footer={
          <Button
            onClick={() => {
              setBookingModalOpen(false);
              setSelectedBookingTripId(undefined);
            }}
          >
            Đóng
          </Button>
        }
        width={900}
      >
        {selectedBookingTrip && (
          <div className="mb-4 text-sm text-gray-500">
            Khởi hành:{" "}
            {new Date(selectedBookingTrip.departureTime).toLocaleString("vi-VN")}{" "}
            — Xe: {selectedBookingTrip.bus?.name} (
            {selectedBookingTrip.bus?.licensePlates})
          </div>
        )}

        <Table
          rowKey="_id"
          dataSource={tripBookings}
          columns={bookingColumns}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: "Chưa có khách nào đặt vé chuyến này" }}
        />
      {/* Style CSS cho hiệu ứng quét camera */}
      <style>{`
        #trip-qr-reader {
          width: 100% !important;
          border: none !important;
          border-radius: 12px;
          overflow: hidden;
        }
        #trip-qr-reader video {
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
          {!scannedBooking ? (
            <>
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
                <div id="trip-qr-reader" className="w-full h-full"></div>
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
            </>
          ) : (
            /* HIỂN THỊ THÔNG TIN VÉ ĐÃ QUÉT */
            <div className="w-full space-y-4">
              <Card className="border border-gray-100 rounded-xl bg-slate-50/50 shadow-xs" styles={{ body: { padding: 16 } }}>
                <div className="text-center pb-2.5 border-b mb-3">
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Thông tin vé của khách</h3>
                  <Tag color="blue" className="font-bold text-xs uppercase px-2.5 py-0.5 mt-1 rounded-full">
                    {scannedBooking.orderCode ? `NB-${scannedBooking.orderCode}` : "NB-XXXXXX"}
                  </Tag>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hành khách:</span>
                    <span className="font-semibold text-gray-800">{scannedBooking.user?.username || "Hành khách NETBUS"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Số điện thoại:</span>
                    <span className="text-gray-700">{scannedBooking.user?.phone || scannedBooking.user?.sdt || "Không có"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Giờ đi của chuyến:</span>
                    <span className="font-semibold text-gray-700">
                      {scannedBooking.trip?.departureTime 
                        ? new Date(scannedBooking.trip.departureTime).toLocaleString("vi-VN") 
                        : "---"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vị trí ghế đã đặt:</span>
                    <span className="font-bold text-emerald-700 text-sm">{scannedBooking.seats?.join(", ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tổng tiền vé:</span>
                    <span className="font-bold text-red-600 text-sm">
                      {(scannedBooking.totalPrice || 0).toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2.5 border-t mt-2">
                    <span className="text-gray-400 font-medium">Trạng thái đặt vé:</span>
                    <Tag color={
                      scannedBooking.status === "Hoàn thành" ? "blue" : 
                      scannedBooking.status === "Đã xác nhận" ? "green" : 
                      scannedBooking.status === "Đã huỷ" ? "red" : "orange"
                    }>
                      {scannedBooking.status || "Chờ xác nhận"}
                    </Tag>
                  </div>
                </div>
              </Card>

              {/* THÔNG BÁO VÀ NÚT XÁC NHẬN */}
              <div className="space-y-3">
                {scannedBooking.status === "Hoàn thành" && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                    <span>⚠️ Vé này đã được check-in hoàn thành trước đó.</span>
                  </div>
                )}

                {scannedBooking.status === "Đã huỷ" && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                    <span>❌ Vé này đã bị hủy, không hợp lệ!</span>
                  </div>
                )}

                {scannedBooking.status !== "Hoàn thành" && scannedBooking.status !== "Đã huỷ" && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                    <span>✅ Vé hợp lệ cho chuyến xe này. Hãy click "Xác nhận Check-in" để đón khách lên xe.</span>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    size="large"
                    onClick={() => {
                      setScannedBooking(null);
                      if (selectedCameraId) startScanner(selectedCameraId);
                    }}
                    className="rounded-lg font-medium"
                  >
                    Quét Tiếp
                  </Button>
                  
                  {scannedBooking.status !== "Hoàn thành" && scannedBooking.status !== "Đã huỷ" && (
                    <Button
                      type="primary"
                      size="large"
                      loading={isCheckingIn}
                      onClick={handleConfirmCheckin}
                      className="bg-blue-600 hover:bg-blue-700 border-none rounded-lg font-bold"
                    >
                      Xác nhận Check-in
                    </Button>
                  )}

                  <Button
                    size="large"
                    onClick={handleCloseScanner}
                    className="rounded-lg font-medium"
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          )}
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
          {trip && (
            <div className="p-3 bg-slate-50 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
              <div>
                Hành trình: <strong className="text-blue-600 text-sm">{trip.journey?.diemDi} → {trip.journey?.diemDen}</strong>
              </div>
              <div>
                Khởi hành: <strong>{new Date(trip.departureTime).toLocaleString("vi-VN")}</strong>
              </div>
              <div>
                Xe & Biển số: <strong>{trip.bus?.name} ({trip.bus?.licensePlates})</strong>
              </div>
            </div>
          )}

          <Table
            columns={[
              {
                title: "Hành khách",
                render: (_: any, record: BookingType) => (
                  <div>
                    <div className="font-semibold text-gray-800">{record.user?.username || "Hành khách NETBUS"}</div>
                    <div className="text-xs text-gray-400">{record.user?.email || "Chưa cập nhật"}</div>
                  </div>
                ),
              },
              {
                title: "Số điện thoại",
                render: (_: any, record: BookingType) => (
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
                  if (status === "Hoàn thành") color = "blue";
                  else if (status === "Đã xác nhận") color = "green";
                  else if (status === "Đã huỷ") color = "red";
                  return <Tag color={color}>{status}</Tag>;
                },
              },
              {
                title: "Hành động",
                key: "action",
                render: (_: any, record: BookingType) => {
                  if (record.status === "Hoàn thành") {
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
                      onClick={() => handleDirectCheckin(record._id, record.user?.username || "Khách hàng")}
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
    </div>
  );
}

export default TripListPage;