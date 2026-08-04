import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Tabs,
  Tag,
  Typography,
  Divider,
  Space,
  Select,
  DatePicker,
  Modal,
  Badge,
  Switch,
  Tooltip,
  Radio,
  Flex,
  QRCode,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  KeyOutlined,
  TrophyOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  QrcodeOutlined,
  PrinterOutlined,
  CalendarOutlined,
  CarOutlined,
  GiftOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import axios from "axios";
import { ClientLayout } from "./layout";
import { _myAccount, _users } from "src/_mock";

const { Title, Text, Paragraph } = Typography;

const VIETNAMESE_BANKS = [
  { value: "VCB", label: "Vietcombank (Ngoại thương)" },
  { value: "TCB", label: "Techcombank (Kỹ thương)" },
  { value: "MB", label: "MBBank (Quân đội)" },
  { value: "BIDV", label: "BIDV (Đầu tư và Phát triển)" },
  { value: "CTG", label: "VietinBank (Công thương)" },
  { value: "ACB", label: "ACB (Á Châu)" },
  { value: "VPB", label: "VPBank (Thịnh Vượng)" },
  { value: "TPB", label: "TPBank (Tiên Phong)" },
  { value: "STB", label: "Sacombank (Sài Gòn Thương Tín)" },
  { value: "VIB", label: "VIB (Quốc tế)" },
  { value: "SHB", label: "SHB (Sài Gòn - Hà Nội)" },
  { value: "HDB", label: "HDBank (Phát triển TP.HCM)" },
  { value: "MSB", label: "MSB (Hàng Hải)" },
  { value: "OCB", label: "OCB (Phương Đông)" }
];

interface BookingRecord {
  id: string;
  ticketCode: string;
  customerName: string;
  busName: string;
  journey: string;
  seats: string[];
  totalPrice: number;
  departureTime: string;
  bookingDate: string;
  status: string;
  tripStatus?: string;
}


export default function ProfileClientPage() {
  const navigate = useNavigate();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const [userData, setUserData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState<any>(null);
  const [cancelForm] = Form.useForm();

  const loadBookings = async (userId: string, usernameFallback: string) => {
    if (!userId) return;
    try {
      const response = await axios.get("http://localhost:3000/api/booking");
      const allBookings = response.data || [];
      const userBookings = allBookings.filter((b: any) => b.user && (b.user._id === userId || b.user === userId));
      
      const mapped: BookingRecord[] = userBookings.map((b: any) => {
        let mappedStatus: any = "pending";
        if (b.status === "Đã huỷ" || b.trip?.status === "huỷ") mappedStatus = "cancelled";
        else if (b.status === "Hoàn thành" || b.status === "Đã checkin" || b.status === "Đã check-in" || b.trip?.status === "hoàn thành") mappedStatus = "completed";
        else if (b.status === "Đã xác nhận" || b.status === "Đã thanh toán") mappedStatus = "confirmed";
        else if (b.status === "Yêu cầu hoàn tiền") mappedStatus = "refund_pending";
        else if (b.status === "Đã hoàn tiền") mappedStatus = "refunded";
        else if (b.status === "Chờ xác nhận") mappedStatus = "pending";

        const busInfo = b.trip?.bus 
          ? `${b.trip.bus.name}${b.trip.bus.licensePlates ? ` (${b.trip.bus.licensePlates})` : ""}`
          : "GoPro VIP";

        return {
          id: b._id,
          ticketCode: b.orderCode ? `NB-${b.orderCode}` : "NB-XXXXXX",
          customerName: b.user?.username || b.user?.ten || usernameFallback,
          busName: busInfo,
          journey: b.trip?.journey ? `${b.trip.journey.diemDi} → ${b.trip.journey.diemDen}` : "Chưa xác định",
          seats: b.seats || [],
          totalPrice: b.totalPrice || 0,
          departureTime: b.trip?.departureTime 
            ? dayjs(b.trip.departureTime).format("HH:mm - DD/MM/YYYY") 
            : "Chưa xác định",
          bookingDate: dayjs(b.createdAt).format("DD/MM/YYYY"),
          status: mappedStatus,
          tripStatus: b.trip?.status || "sắp chạy",
          originalBooking: b
        };
      });

      // Lấy thêm vé vừa đặt thành công từ localStorage nếu có
      const latestSuccess = localStorage.getItem("latest_ticket_success");
      let latestList: BookingRecord[] = [];
      if (latestSuccess) {
        try {
          const parsed = JSON.parse(latestSuccess);
          // Tránh bị trùng lặp nếu đơn hàng đã được đồng bộ lên DB
          const exists = mapped.some((b: any) => b.ticketCode === parsed.ticketCode);
          if (!exists) {
            latestList.push({
              id: "BK-NEW",
              ticketCode: parsed.ticketCode || "NB-998877",
              customerName: parsed.customerName || usernameFallback,
              busName: parsed.busName || "NetBus Express",
              journey: parsed.journey || "Hà Nội → Hà Tĩnh",
              seats: parsed.seats || ["A01"],
              totalPrice: parsed.totalPrice || 250000,
              departureTime: parsed.departureTime || "07:00 - Hôm nay",
              bookingDate: dayjs().format("DD/MM/YYYY"),
              status: "confirmed",
            });
          }
        } catch (e) {}
      }

      // Hợp nhất: Vé từ DB + Vé lưu tạm Local
      const realBookings = [...latestList, ...mapped];
      setBookings(realBookings);
    } catch (err) {
      console.error("Lỗi khi tải lịch sử vé:", err);
      setBookings([]);
    }
  };

  // Load user info and booking history from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    let userObj: any = null;

    if (userStr) {
      try {
        userObj = JSON.parse(userStr);
      } catch (err) {
        console.error("Lỗi parse thông tin tài khoản:", err);
      }
    }

    // Default fallback values if no logged in user data is found
    const initialUser = {
      _id: userObj?._id || "",
      username: userObj?.username || userObj?.displayName || userObj?.name || "Hành Khách NetBus",
      email: userObj?.email || "khachhang@netbus.vn",
      phone: userObj?.phone || userObj?.sdt || "0988 123 456",
      gender: userObj?.gender || (userObj?.gioiTinh === "Nam" ? "nam" : userObj?.gioiTinh === "Nữ" ? "nu" : "khac") || "nam",
      dob: userObj?.dob ? dayjs(userObj.dob) : userObj?.namSinh ? dayjs(userObj.namSinh) : dayjs("1998-05-15"),
      cccd: userObj?.cccd || "038098******",
      address: userObj?.address || userObj?.diaChi || "Hà Nội, Việt Nam",
      avatarUrl: userObj?.avatarUrl || userObj?.avatar || userObj?.image || "",
      memberTier: userObj?.memberTier || "Thành viên Vàng",
      rewardPoints: userObj?.rewardPoints || 1250,
      createdAt: userObj?.createdAt || "15/01/2024",
      staffId: userObj?.staffId || "",
      role: userObj?.role || "user",
    };

    setUserData(initialUser);
    setAvatarUrl(initialUser.avatarUrl);
    profileForm.setFieldsValue({
      username: initialUser.username,
      email: initialUser.email,
      phone: initialUser.phone,
      gender: initialUser.gender,
      dob: initialUser.dob,
      cccd: initialUser.cccd,
      address: initialUser.address,
    });

    if (initialUser._id) {
      loadBookings(initialUser._id, initialUser.username);
    } else {
      setBookings([]);
    }
  }, [profileForm]);

  // Save profile updates & sync with Admin & Backend
  const handleSaveProfile = async (values: any) => {
    const formattedDob = values.dob ? values.dob.format("YYYY-MM-DD") : (userData?.dob ? dayjs(userData.dob).format("YYYY-MM-DD") : "1998-05-15");
    const updatedUser = {
      ...userData,
      ...values,
      originalEmail: userData?.originalEmail || userData?.email || values.email,
      originalUsername: userData?.originalUsername || userData?.username || values.username,
      dob: formattedDob,
      avatarUrl: avatarUrl,
      displayName: values.username,
      name: values.username,
    };

    // Gọi API cập nhật Backend để đồng bộ database thực tế
    let apiSuccess = true;
    try {
      // 1. Cập nhật thông tin tài khoản đăng nhập (tk)
      if (userData?._id) {
        await axios.put(`http://localhost:3000/api/tk/update/${userData._id}`, {
          username: values.username,
          email: values.email,
          avatar: avatarUrl || undefined,
        });
      }

      // 2. Cập nhật thông tin chi tiết nhân viên (staff) nếu có staffId
      if (userData?.staffId) {
        await axios.put(`http://localhost:3000/api/staff/edit/${userData.staffId}`, {
          ten: values.username,
          namSinh: formattedDob,
          gioiTinh: values.gender === "nam" ? "Nam" : values.gender === "nu" ? "Nữ" : "Khác",
          email: values.email,
          sdt: values.phone,
          cccd: values.cccd,
          image: avatarUrl || undefined,
          diaChi: values.address,
          chucVu: userData.role === "admin" ? "Admin" : userData.role === "driver" ? "Driver" : "Staff",
        });
      }
    } catch (apiErr: any) {
      console.error("Lỗi cập nhật server:", apiErr);
      toast.error("Không thể kết nối đến server. Thông tin chỉ được lưu tạm tại trình duyệt.");
      apiSuccess = false;
    }

    // 1. Cập nhật state nội bộ & localStorage user
    setUserData(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    // 2. Cập nhật trực tiếp biến mock dữ liệu Admin trong bộ nhớ để đồng bộ tức thời
    try {
      if (_myAccount) {
        _myAccount.displayName = updatedUser.displayName;
        _myAccount.email = updatedUser.email;
        if (avatarUrl) _myAccount.photoURL = avatarUrl;
      }
      if (_users && _users.length > 0) {
        _users[0].name = updatedUser.displayName;
        _users[0].company = updatedUser.email;
        if (avatarUrl) _users[0].avatarUrl = avatarUrl;
      }
    } catch (e) {
      console.error("Lỗi cập nhật mock data:", e);
    }

    // 3. Cập nhật danh sách tổng Admin (users_list)
    try {
      const usersListStr = localStorage.getItem("users_list");
      let usersList = usersListStr ? JSON.parse(usersListStr) : [];
      const idx = usersList.findIndex(
        (u: any) => u.email === updatedUser.email || u._id === updatedUser._id || u.username === userData?.username
      );
      if (idx !== -1) {
        usersList[idx] = { ...usersList[idx], ...updatedUser };
      } else {
        usersList.push(updatedUser);
      }
      localStorage.setItem("users_list", JSON.stringify(usersList));
    } catch (err) {
      console.error("Lỗi đồng bộ danh sách Admin:", err);
    }

    setIsEditing(false);
    if (apiSuccess) {
      toast.success("Cập nhật thông tin tài khoản thành công!");
    }

    // Trigger storage event & user-updated custom event
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("user-updated", { detail: updatedUser }));
  };

  // Change password handler
  const handleChangePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      toast.error("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    if (!userData?._id) {
      toast.error("Không tìm thấy thông tin tài khoản!");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/api/auth/change-password", {
        userId: userData._id,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (response.data?.success) {
        toast.success("Đổi mật khẩu thành công! Vui lòng bảo mật mật khẩu mới.");
        passwordForm.resetFields();
      } else {
        toast.error(response.data?.message || "Đổi mật khẩu thất bại!");
      }
    } catch (err: any) {
      console.error("Lỗi đổi mật khẩu:", err);
      const errMsg = err.response?.data?.message || "Đổi mật khẩu thất bại! Vui lòng thử lại.";
      toast.error(errMsg);
    }
  };

  const [isSendingMail, setIsSendingMail] = useState(false);

  const handleForgotPassword = () => {
    const email = userData?.email;
    if (!email) {
      toast.error("Không tìm thấy email của tài khoản!");
      return;
    }

    Modal.confirm({
      title: "Xác nhận gửi link khôi phục",
      content: (
        <div>
          <p>Hệ thống sẽ gửi liên kết khôi phục mật khẩu tới email của bạn:</p>
          <p className="font-bold text-emerald-700 text-center text-lg my-3">{email}</p>
          <p className="text-xs text-slate-500">
            * Liên kết sẽ có hiệu lực trong vòng 15 phút. Vui lòng kiểm tra kỹ hộp thư của bạn sau khi gửi (bao gồm cả thư mục Spam).
          </p>
        </div>
      ),
      okText: "Gửi Email",
      cancelText: "Hủy",
      okButtonProps: { className: "bg-emerald-600 border-none hover:bg-emerald-500 font-bold" },
      onOk: async () => {
        setIsSendingMail(true);
        try {
          const res = await axios.post("http://localhost:3000/api/auth/forgot-password", { email });
          if (res.data?.success) {
            toast.success("Đã gửi link khôi phục mật khẩu! Vui lòng kiểm tra hộp thư.");
          } else {
            toast.error(res.data?.message || "Có lỗi xảy ra khi gửi email!");
          }
        } catch (error: any) {
          const errMsg = error.response?.data?.message || "Gửi email khôi phục thất bại!";
          toast.error(errMsg);
        } finally {
          setIsSendingMail(false);
        }
      }
    });
  };

  // Avatar presets option
  // const avatarPresets = [
  //   "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  //   "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  //   "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
  //   "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
  // ];

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadAvatar = async (newBase64: string) => {
    setAvatarUrl(newBase64);

    const updatedUser = {
      ...userData,
      avatarUrl: newBase64,
      avatar: newBase64,
      image: newBase64,
      displayName: userData?.username || userData?.displayName,
      name: userData?.username || userData?.name,
    };

    let apiSuccess = true;
    try {
      // 1. Cập nhật thông tin tài khoản (tk) ở backend
      if (userData?._id) {
        await axios.put(`http://localhost:3000/api/tk/update/${userData._id}`, {
          username: userData.username,
          email: userData.email,
          avatar: newBase64,
        });
      }

      // 2. Cập nhật thông tin chi tiết nhân viên (staff) nếu có staffId
      if (userData?.staffId) {
        await axios.put(`http://localhost:3000/api/staff/edit/${userData.staffId}`, {
          ten: userData.username,
          namSinh: userData.dob ? dayjs(userData.dob).format("YYYY-MM-DD") : "1998-05-15",
          gioiTinh: userData.gender === "nam" ? "Nam" : userData.gender === "nu" ? "Nữ" : "Khác",
          email: userData.email,
          sdt: userData.phone,
          cccd: userData.cccd,
          image: newBase64,
          diaChi: userData.address,
          chucVu: userData.role === "admin" ? "Admin" : userData.role === "driver" ? "Driver" : "Staff",
        });
      }
    } catch (apiErr: any) {
      console.error("Lỗi cập nhật server khi đổi avatar:", apiErr);
      toast.error("Không thể kết nối đến server để lưu ảnh đại diện. Chỉ lưu tạm ở trình duyệt.");
      apiSuccess = false;
    }

    setUserData(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    try {
      if (_myAccount) {
        _myAccount.photoURL = newBase64;
      }
      if (_users && _users.length > 0) {
        _users[0].avatarUrl = newBase64;
      }
    } catch (e) {
      console.error("Lỗi cập nhật mock avatar:", e);
    }

    try {
      const usersListStr = localStorage.getItem("users_list");
      let usersList = usersListStr ? JSON.parse(usersListStr) : [];
      const idx = usersList.findIndex(
        (u: any) => u.email === updatedUser.email || u._id === updatedUser._id || u.username === userData?.username
      );
      if (idx !== -1) {
        usersList[idx] = { ...usersList[idx], avatarUrl: newBase64, avatar: newBase64 };
      }
      localStorage.setItem("users_list", JSON.stringify(usersList));
    } catch (err) {
      console.error("Lỗi đồng bộ users_list:", err);
    }

    if (apiSuccess) {
      toast.success("Thay đổi ảnh đại diện thành công!");
    }

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("user-updated", { detail: updatedUser }));
  };

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          const maxSize = 200; // Resize to max 200px width/height
          let width = image.width;
          let height = image.height;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(image, 0, 0, width, height);
          }
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };
        image.onerror = (err) => reject(err);
        image.src = readerEvent.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await resizeImage(file);
        await handleUploadAvatar(compressedBase64);
      } catch (err) {
        console.error("Lỗi xử lý ảnh:", err);
        toast.error("Không thể xử lý file ảnh này!");
      } finally {
        e.target.value = ""; // Reset to allow re-upload of same file
      }
    }
  };

  const handleCancelBooking = async (values: any) => {
    if (!cancellingBooking) return;
    try {
      await axios.post("http://localhost:3000/api/refund/add", {
        booking: cancellingBooking.id,
        user: userData?._id,
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        accountName: values.accountName,
        amount: cancellingBooking.totalPrice,
        reason: values.reason || ""
      });
      toast.success("Gửi yêu cầu hủy vé và hoàn tiền thành công!");
      setIsCancelModalOpen(false);
      setCancellingBooking(null);
      if (userData?._id) {
        loadBookings(userData._id, userData.username);
      }
    } catch (err: any) {
      console.error("Lỗi khi hủy vé:", err);
      toast.error("Không thể gửi yêu cầu hủy vé!");
    }
  };

  return (
    <ClientLayout>
      <div className="bg-slate-50 dark:bg-slate-955 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* HEADER BANNER CARD */}
          <Card
            bordered={false}
            className="shadow-md rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            styles={{ body: { padding: 0 } }}
          >
            {/* Cover photo background with clean hero image */}
            <div
              className="h-48 bg-cover bg-center relative flex items-end justify-end p-4 rounded-t-3xl overflow-hidden"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDogLyFACTjy4GlXNhWooGrkixNYdFH0XQ_SFHXPCzWlydy7tTet3TAdUNJI4ulf4TYHI7hMrn09ofvV2Z1PzSKb7ju4sAUDUqPoCMTs7Q5ZZEe19mAacDs3j3SsZfPb3dX2tzRm8OzyXR3MEk0mIdrB7Z_QlbkIMCB9WX9-80s0n7z_cg1sJIsOZxGDiD6vMD1h-jn0hbawBA2YvhdjWiDvu9bQh5L0zalJF7GC0pKDKHd7G38380Aae60vD8spHuJYfTTLGspMPVZ')`,
              }}
            >
            </div>

            {/* Profile Bar info */}
            <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end justify-between gap-6 -mt-16">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Avatar
                    size={110}
                    src={avatarUrl || undefined}
                    icon={!avatarUrl ? <UserOutlined /> : undefined}
                    className="border-4 border-white dark:border-slate-900 shadow-lg bg-emerald-600 text-white font-bold text-3xl"
                  >
                    {!avatarUrl && userData?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Tooltip title="Chọn ảnh từ máy tính">
                    <div
                      className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity border-4 border-white"
                    >
                      <CameraOutlined className="text-xl" />
                    </div>
                  </Tooltip>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: "none" }}
                  accept="image/*"
                />

                <div className="space-y-1">
                  <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                    <Title level={3} className="!mb-0 !text-slate-900 dark:!text-white font-extrabold">
                      {userData?.username || "Hành Khách"}
                    </Title>
                    <Tag color="gold" className="font-bold border-none px-3 py-0.5 rounded-full flex items-center gap-1">
                      <TrophyOutlined /> {userData?.memberTier || "Thành viên Vàng"}
                    </Tag>
                  </div>
                  <Text type="secondary" className="block text-sm">
                    {userData?.email} • Tham gia từ {userData?.createdAt}
                  </Text>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-center">
                {!isEditing ? (
                  <Button
                    type="primary"
                    size="large"
                    icon={<UserOutlined />}
                    onClick={() => setIsEditing(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold border-none"
                  >
                    Chỉnh sửa thông tin
                  </Button>
                ) : (
                  <Button
                    icon={<ArrowLeftOutlined />}
                    size="large"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl font-medium"
                  >
                    Hủy chỉnh sửa
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* MAIN TABBED CONTENT SECTION */}
          <Card
            bordered={false}
            className="shadow-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <Tabs
              defaultActiveKey="profile"
              size="large"
              tabBarStyle={{ marginBottom: 24, fontWeight: 600 }}
              items={[
                {
                  key: "profile",
                  label: (
                    <span className="flex items-center gap-2">
                      <UserOutlined /> Thông tin cá nhân
                    </span>
                  ),
                  children: (
                    <div className="py-2">
                      {!isEditing ? (
                        /* READ-ONLY VIEW */
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold block mb-1">
                                Họ và tên
                              </Text>
                              <Flex align="center" gap={10}>
                                <UserOutlined className="text-emerald-600 text-lg" />
                                <Text strong className="text-base text-slate-800 dark:text-slate-100">
                                  {userData?.username}
                                </Text>
                              </Flex>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold block mb-1">
                                Địa chỉ Email
                              </Text>
                              <Flex align="center" gap={10}>
                                <MailOutlined className="text-emerald-600 text-lg" />
                                <Text strong className="text-base text-slate-800 dark:text-slate-100">
                                  {userData?.email}
                                </Text>
                              </Flex>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold block mb-1">
                                Số điện thoại
                              </Text>
                              <Flex align="center" gap={10}>
                                <PhoneOutlined className="text-emerald-600 text-lg" />
                                <Text strong className="text-base text-slate-800 dark:text-slate-100">
                                  {userData?.phone}
                                </Text>
                              </Flex>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold block mb-1">
                                Số CCCD / CMND
                              </Text>
                              <Flex align="center" gap={10}>
                                <IdcardOutlined className="text-emerald-600 text-lg" />
                                <Text strong className="text-base text-slate-800 dark:text-slate-100">
                                  {userData?.cccd}
                                </Text>
                              </Flex>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold block mb-1">
                                Giới tính
                              </Text>
                              <Flex align="center" gap={10}>
                                <UserOutlined className="text-emerald-600 text-lg" />
                                <Text strong className="text-base text-slate-800 dark:text-slate-100 capitalize">
                                  {userData?.gender === "nam" ? "Nam" : userData?.gender === "nu" ? "Nữ" : "Khác"}
                                </Text>
                              </Flex>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold block mb-1">
                                Ngày sinh
                              </Text>
                              <Flex align="center" gap={10}>
                                <CalendarOutlined className="text-emerald-600 text-lg" />
                                <Text strong className="text-base text-slate-800 dark:text-slate-100">
                                  {userData?.dob ? dayjs(userData.dob).format("DD/MM/YYYY") : "Chưa cập nhật"}
                                </Text>
                              </Flex>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <Text type="secondary" className="text-xs uppercase tracking-wider font-semibold block mb-1">
                              Địa chỉ thường trú / Nhận vé
                            </Text>
                            <Flex align="center" gap={10}>
                              <EnvironmentOutlined className="text-emerald-600 text-lg" />
                              <Text strong className="text-base text-slate-800 dark:text-slate-100">
                                {userData?.address}
                              </Text>
                            </Flex>
                          </div>
                        </div>
                      ) : (
                        /* EDIT FORM VIEW */
                        <Form
                          form={profileForm}
                          layout="vertical"
                          onFinish={handleSaveProfile}
                          className="space-y-4"
                        >
                          <Row gutter={16}>
                            <Col xs={24} md={12}>
                              <Form.Item
                                name="username"
                                label="Họ và tên"
                                rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
                              >
                                <Input size="large" prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
                              </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                              <Form.Item
                                name="email"
                                label="Địa chỉ Email"
                                rules={[
                                  { required: true, message: "Vui lòng nhập email" },
                                  { type: "email", message: "Email không đúng định dạng" },
                                ]}
                              >
                                <Input size="large" prefix={<MailOutlined />} placeholder="example@gmail.com" />
                              </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                              <Form.Item
                                name="phone"
                                label="Số điện thoại"
                                rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
                              >
                                <Input size="large" prefix={<PhoneOutlined />} placeholder="VD: 0988 123 456" />
                              </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                              <Form.Item name="cccd" label="Số CCCD / CMND">
                                <Input size="large" prefix={<IdcardOutlined />} placeholder="VD: 03809800xxxx" />
                              </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                              <Form.Item name="gender" label="Giới tính">
                                <Radio.Group size="large" className="w-full">
                                  <Radio.Button value="nam">Nam</Radio.Button>
                                  <Radio.Button value="nu">Nữ</Radio.Button>
                                  <Radio.Button value="khac">Khác</Radio.Button>
                                </Radio.Group>
                              </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                              <Form.Item name="dob" label="Ngày sinh">
                                <DatePicker size="large" format="DD/MM/YYYY" className="w-full" />
                              </Form.Item>
                            </Col>

                            <Col xs={24}>
                              <Form.Item name="address" label="Địa chỉ thường trú">
                                <Input.TextArea rows={2} placeholder="Nhập địa chỉ đầy đủ của bạn..." />
                              </Form.Item>
                            </Col>
                          </Row>

                          <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button size="large" onClick={() => setIsEditing(false)}>
                              Hủy bỏ
                            </Button>
                            <Button
                              type="primary"
                              htmlType="submit"
                              size="large"
                              icon={<SaveOutlined />}
                              className="bg-emerald-600 hover:bg-emerald-500 font-bold border-none"
                            >
                              Lưu thông tin
                            </Button>
                          </div>
                        </Form>
                      )}
                    </div>
                  ),
                },

                {
                  key: "tickets",
                  label: (
                    <span className="flex items-center gap-2">
                      <HistoryOutlined /> Chuyến đi & Vé của tôi
                      <Badge count={bookings.length} offset={[8, -2]} className="bg-emerald-600" />
                    </span>
                  ),
                  children: (
                    <div className="space-y-4 py-2">
                      <div className="flex justify-between items-center mb-2">
                        <Title level={4} className="!mb-0">
                          Lịch sử vé đã đặt
                        </Title>
                        <Text type="secondary" className="text-sm">
                          Tổng cộng: <strong>{bookings.length}</strong> chuyến
                        </Text>
                      </div>

                      {bookings.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                          {bookings.map((item) => (
                            <div
                              key={item.id}
                              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <Tag color="green" className="font-bold text-xs uppercase px-2.5 py-0.5 rounded-full">
                                    {item.ticketCode}
                                  </Tag>
                                  <Text strong className="text-lg text-slate-800 dark:text-slate-100">
                                    {item.journey}
                                  </Text>
                                  {item.status === "confirmed" && (
                                    <Tag color="processing" className="font-semibold">
                                      Sắp đi
                                    </Tag>
                                  )}
                                  {item.status === "pending" && (
                                    <Tag color="warning" className="font-semibold">
                                      Chờ xác nhận
                                    </Tag>
                                  )}
                                  {item.status === "refund_pending" && (
                                    <Tag color="warning" className="font-semibold">
                                      Chờ hoàn tiền
                                    </Tag>
                                  )}
                                  {item.status === "refunded" && (
                                    <Tag color="success" className="font-semibold">
                                      Đã hoàn tiền
                                    </Tag>
                                  )}
                                  {item.status === "cancelled" && (
                                    <Tag color="error" className="font-semibold">
                                      Đã hủy
                                    </Tag>
                                  )}
                                  {item.status === "completed" && (
                                    <Tag color="default" className="font-semibold">
                                      Hoàn thành
                                    </Tag>
                                  )}
                                </div>

                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                  <span>
                                    <CarOutlined className="mr-1 text-emerald-600" /> {item.busName}
                                  </span>
                                  <span>
                                    <CalendarOutlined className="mr-1 text-emerald-600" /> {item.departureTime}
                                  </span>
                                  <span>
                                    Giường: <strong className="text-emerald-700 dark:text-emerald-400">{item.seats.join(", ")}</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200">
                                <div className="text-right">
                                  <Text type="secondary" className="text-xs block">
                                    Tổng tiền
                                  </Text>
                                  <Text strong className="text-lg text-emerald-600 dark:text-emerald-400">
                                    {item.totalPrice.toLocaleString("vi-VN")}đ
                                  </Text>
                                </div>

                                <Button
                                  type="primary"
                                  ghost
                                  icon={<QrcodeOutlined />}
                                  onClick={() => {
                                    setSelectedTicket(item);
                                    setIsTicketModalOpen(true);
                                  }}
                                  className="rounded-xl font-medium border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                                >
                                  Xem vé
                                </Button>

                                {(item.status === "confirmed" || item.status === "pending") && 
                                  item.status !== "completed" && 
                                  item.tripStatus !== "hoàn thành" && 
                                  item.tripStatus !== "đang chạy" && 
                                  item.tripStatus !== "huỷ" && (
                                  <Button
                                    danger
                                    onClick={() => {
                                      setCancellingBooking(item);
                                      setIsCancelModalOpen(true);
                                      cancelForm.resetFields();
                                    }}
                                    className="rounded-xl font-medium"
                                  >
                                    Hủy vé hoàn tiền
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-slate-400">
                          <CarOutlined className="text-5xl mb-3 text-slate-300" />
                          <Paragraph>Bạn chưa có lịch sử đặt vé nào.</Paragraph>
                          <Button type="primary" onClick={() => navigate("/khachhang/trip")}>
                            Đặt vé ngay
                          </Button>
                        </div>
                      )}
                    </div>
                  ),
                },

                {
                  key: "security",
                  label: (
                    <span className="flex items-center gap-2">
                      <KeyOutlined /> Đổi mật khẩu & Bảo mật
                    </span>
                  ),
                  children: (
                    <div className="max-w-xl py-2 space-y-6">
                      <div>
                        <Title level={4} className="!mb-1">
                          Đổi mật khẩu tài khoản
                        </Title>
                        <Text type="secondary" className="text-sm">
                          Nên sử dụng mật khẩu mạnh kết hợp chữ, số và ký tự đặc biệt.
                        </Text>
                      </div>

                      <Form
                        form={passwordForm}
                        layout="vertical"
                        onFinish={handleChangePassword}
                        className="space-y-3"
                      >
                        <Form.Item
                          name="currentPassword"
                          label="Mật khẩu hiện tại"
                          rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại" }]}
                        >
                          <Input.Password size="large" prefix={<LockOutlined />} placeholder="••••••••" />
                        </Form.Item>

                        <Form.Item
                          name="newPassword"
                          label="Mật khẩu mới"
                          rules={[
                            { required: true, message: "Vui lòng nhập mật khẩu mới" },
                            { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                          ]}
                        >
                          <Input.Password size="large" prefix={<LockOutlined />} placeholder="••••••••" />
                        </Form.Item>

                        <Form.Item
                          name="confirmPassword"
                          label="Xác nhận mật khẩu mới"
                          rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu mới" }]}
                        >
                          <Input.Password size="large" prefix={<LockOutlined />} placeholder="••••••••" />
                        </Form.Item>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                          <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            icon={<CheckCircleOutlined />}
                            className="bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl border-none"
                          >
                            Cập nhật mật khẩu
                          </Button>
                          
                          <Button
                            type="link"
                            onClick={handleForgotPassword}
                            loading={isSendingMail}
                            className="text-emerald-600 hover:text-emerald-500 font-semibold p-0 text-left"
                          >
                            Quên mật khẩu?
                          </Button>
                        </div>
                      </Form>

                      <Divider />

                      <div className="space-y-4">
                        <Title level={5} className="!mb-0">
                          Tính năng bảo mật nâng cao
                        </Title>
                        <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border">
                          <div>
                            <Text strong className="block">
                              Xác thực 2 lớp (2FA)
                            </Text>
                            <Text type="secondary" className="text-xs">
                              Gửi mã xác thực về Email mỗi khi đăng nhập trên thiết bị lạ.
                            </Text>
                          </div>
                          <Switch defaultChecked onChange={(checked) => toast.success(checked ? "Đã bật 2FA" : "Đã tắt 2FA")} />
                        </div>
                      </div>
                    </div>
                  ),
                },

                {
                  key: "rewards",
                  label: (
                    <span className="flex items-center gap-2">
                      <TrophyOutlined /> Ví & Thẻ thành viên
                    </span>
                  ),
                  children: (
                    <div className="space-y-6 py-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white rounded-2xl border-none shadow-md">
                          <Text className="text-amber-100 text-xs font-bold uppercase tracking-wider block mb-2">
                            Thẻ thành viên
                          </Text>
                          <Title level={3} className="!text-white !mb-1 font-black">
                            {userData?.memberTier || "Thành viên Vàng"}
                          </Title>
                          <Text className="text-amber-100 text-sm">Hạn dùng: Không giới hạn</Text>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl border-none shadow-md">
                          <Text className="text-emerald-100 text-xs font-bold uppercase tracking-wider block mb-2">
                            Điểm thưởng tích lũy
                          </Text>
                          <Title level={3} className="!text-white !mb-1 font-black flex items-center gap-2">
                            <GiftOutlined /> {userData?.rewardPoints || 1250} điểm
                          </Title>
                          <Text className="text-emerald-100 text-sm">~ 125.000đ ưu đãi vé</Text>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl border-none shadow-md">
                          <Text className="text-blue-100 text-xs font-bold uppercase tracking-wider block mb-2">
                            Voucher khuyến mãi
                          </Text>
                          <Title level={3} className="!text-white !mb-1 font-black">
                            2 Mã giảm giá
                          </Title>
                          <Text className="text-blue-100 text-sm">Giảm tối đa 15%</Text>
                        </Card>
                      </div>

                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border">
                        <Title level={5} className="!mb-3">
                          Đặc quyền hạng thành viên Vàng
                        </Title>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                          <li className="flex items-center gap-2">
                            <CheckCircleOutlined className="text-emerald-600" /> Tích lũy 5% giá trị vé sau mỗi chuyến đi thành công.
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircleOutlined className="text-emerald-600" /> Miễn phí đổi / trả vé trước 12 tiếng departure.
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircleOutlined className="text-emerald-600" /> Ưu tiên giữ vị trí giường đẹp nhất trên xe.
                          </li>
                        </ul>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>

      {/* TICKET DETAIL MODAL */}
      <Modal
        open={isTicketModalOpen}
        onCancel={() => setIsTicketModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsTicketModalOpen(false)}>
            Đóng
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} className="bg-emerald-700">
            In vé điện tử
          </Button>,
        ]}
        width={480}
        centered
        destroyOnClose
      >
        {selectedTicket && (
          <div className="p-2 space-y-4">
            <div className="text-center pb-3 border-b">
              <img src="/assets/images/logoxoanen.png" alt="NetBus" className="h-10 mx-auto mb-2" />
              <Title level={4} className="!mb-0 text-emerald-700">
                VÉ XE ĐIỆN TỬ NETBUS
              </Title>
              <Text type="secondary" className="text-xs">
                Mã vé: <strong className="text-slate-800">{selectedTicket.ticketCode}</strong>
              </Text>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <Text type="secondary">Hành khách:</Text>
                <Text strong>{selectedTicket.customerName}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Tuyến đường:</Text>
                <Text strong>{selectedTicket.journey}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Tên xe:</Text>
                <Text strong>{selectedTicket.busName}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Thời gian đi:</Text>
                <Text strong className="text-emerald-700">{selectedTicket.departureTime}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Vị trí giường/ghế:</Text>
                <Text strong className="text-blue-600">{selectedTicket.seats.join(", ")}</Text>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-base">
                <Text type="secondary">Tổng thanh toán:</Text>
                <Text className="text-red-500">{selectedTicket.totalPrice.toLocaleString("vi-VN")}đ</Text>
              </div>
            </div>

            <div className="text-center pt-3 bg-slate-50 p-4 rounded-xl border flex flex-col items-center justify-center">
              <QRCode value={selectedTicket.id} size={150} bordered={false} className="bg-white p-1 rounded-lg" />
              <Text type="secondary" className="block text-xs mt-2">
                Quét mã QR khi lên xe để làm thủ tục check-in
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* CANCEL & REFUND REQUEST MODAL */}
      <Modal
        title={
          <span className="text-red-600 font-bold text-lg">
            Yêu cầu hủy vé & hoàn tiền
          </span>
        }
        open={isCancelModalOpen}
        onCancel={() => {
          setIsCancelModalOpen(false);
          setCancellingBooking(null);
        }}
        footer={null}
        width={500}
        centered
        destroyOnClose
      >
        {cancellingBooking && (
          <Form
            form={cancelForm}
            layout="vertical"
            onFinish={handleCancelBooking}
            className="space-y-4 pt-3"
          >
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border mb-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div>
                Mã vé: <strong className="text-slate-800 dark:text-slate-100">{cancellingBooking.ticketCode}</strong>
              </div>
              <div>
                Tuyến đường: <strong className="text-slate-800 dark:text-slate-100">{cancellingBooking.journey}</strong>
              </div>
              <div>
                Số tiền hoàn lại: <strong className="text-red-500 text-sm">{cancellingBooking.totalPrice.toLocaleString("vi-VN")}đ</strong>
              </div>
            </div>

            <Form.Item
              name="bankName"
              label="Chọn ngân hàng thụ hưởng"
              rules={[{ required: true, message: "Vui lòng chọn ngân hàng" }]}
            >
              <Select
                placeholder="Chọn ngân hàng"
                size="large"
                options={VIETNAMESE_BANKS}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item
              name="accountNumber"
              label="Số tài khoản ngân hàng"
              rules={[{ required: true, message: "Vui lòng nhập số tài khoản" }]}
            >
              <Input placeholder="Nhập số tài khoản ngân hàng nhận tiền" size="large" />
            </Form.Item>

            <Form.Item
              name="accountName"
              label="Tên chủ tài khoản"
              rules={[{ required: true, message: "Vui lòng nhập tên chủ tài khoản" }]}
            >
              <Input placeholder="VD: NGUYEN VAN A (Chữ hoa không dấu)" size="large" />
            </Form.Item>

            <Form.Item
              name="reason"
              label="Lý do hủy vé (Không bắt buộc)"
            >
              <Input.TextArea placeholder="Nhập lý do hủy vé nếu có..." rows={3} />
            </Form.Item>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button onClick={() => {
                setIsCancelModalOpen(false);
                setCancellingBooking(null);
              }}>
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                className="font-bold border-none"
              >
                Gửi yêu cầu hoàn tiền
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </ClientLayout>
  );
}
