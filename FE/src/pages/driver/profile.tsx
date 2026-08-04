import React, { useState, useEffect, useRef } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Typography,
  Tooltip,
  Radio,
  Flex,
  DatePicker,
  Tag,
  Divider,
  Switch,
  Tabs,
  Modal
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CameraOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  KeyOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import axios from "axios";
import { ClientLayout } from "./layout/layout";

const { Title, Text } = Typography;

export default function ProfileDriverPage() {
  const navigate = useNavigate();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const [userData, setUserData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load driver user info from localStorage & API
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    let userObj: any = null;

    if (userStr && userStr !== "undefined") {
      try {
        userObj = JSON.parse(userStr);
      } catch (err) {
        console.error("Lỗi parse thông tin tài khoản:", err);
      }
    }

    const initialUser = {
      _id: userObj?._id || "",
      staffId: userObj?.staffId || "",
      username: userObj?.displayName || userObj?.ten || userObj?.username || "Tài xế NETBUS",
      email: userObj?.email || "taixe@netbus.vn",
      phone: userObj?.sdt || userObj?.phone || "0988 123 456",
      gender: userObj?.gender || (userObj?.gioiTinh === "Nam" ? "nam" : userObj?.gioiTinh === "Nữ" ? "nu" : "khac") || "nam",
      dob: userObj?.dob ? dayjs(userObj.dob) : userObj?.namSinh ? dayjs(userObj.namSinh) : dayjs("1990-01-01"),
      cccd: userObj?.cccd || "038090******",
      address: userObj?.address || userObj?.diaChi || "Hà Nội, Việt Nam",
      avatarUrl: userObj?.avatar || userObj?.image || userObj?.avatarUrl || "",
      role: userObj?.role || "driver",
      chucVu: userObj?.chucVu || "Tài xế NETBUS",
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

    // Fetch detail staff if staffId exists to ensure fresh data
    if (initialUser.staffId) {
      fetch(`http://localhost:3000/api/staff/detail/${initialUser.staffId}`)
        .then((res) => res.json())
        .then((data) => {
          const staffData = data?.data || data;
          if (staffData) {
            const updated = {
              ...initialUser,
              username: staffData.ten || initialUser.username,
              email: staffData.email || initialUser.email,
              phone: staffData.sdt || initialUser.phone,
              cccd: staffData.cccd || initialUser.cccd,
              address: staffData.diaChi || initialUser.address,
              gender: staffData.gioiTinh === "Nam" ? "nam" : staffData.gioiTinh === "Nữ" ? "nu" : "khac",
              dob: staffData.namSinh ? dayjs(staffData.namSinh) : initialUser.dob,
              avatarUrl: staffData.image || initialUser.avatarUrl,
              chucVu: staffData.chucVu || initialUser.chucVu,
            };
            setUserData(updated);
            setAvatarUrl(updated.avatarUrl);
            profileForm.setFieldsValue({
              username: updated.username,
              email: updated.email,
              phone: updated.phone,
              gender: updated.gender,
              dob: updated.dob,
              cccd: updated.cccd,
              address: updated.address,
            });
          }
        })
        .catch(() => {});
    }
  }, [profileForm]);

  // Save profile updates
  const handleSaveProfile = async (values: any) => {
    const formattedDob = values.dob
      ? values.dob.format("YYYY-MM-DD")
      : userData?.dob
      ? dayjs(userData.dob).format("YYYY-MM-DD")
      : "1990-01-01";

    const updatedUser = {
      ...userData,
      ...values,
      dob: formattedDob,
      avatarUrl: avatarUrl,
      avatar: avatarUrl,
      image: avatarUrl,
      displayName: values.username,
      ten: values.username,
    };

    let apiSuccess = true;
    try {
      if (userData?._id) {
        await axios.put(`http://localhost:3000/api/tk/update/${userData._id}`, {
          username: values.username,
          email: values.email,
          avatar: avatarUrl || undefined,
        });
      }

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
          chucVu: "Driver",
        });
      }
    } catch (apiErr: any) {
      console.error("Lỗi cập nhật server:", apiErr);
      toast.error("Không thể kết nối đến server. Thông tin chỉ được lưu tạm tại trình duyệt.");
      apiSuccess = false;
    }

    setUserData(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    setIsEditing(false);
    if (apiSuccess) {
      toast.success("Cập nhật thông tin tài khoản thành công!");
    }

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("user-updated", { detail: updatedUser }));
  };

  // Change password handler - gọi API backend

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

  // Avatar upload handler
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          const maxSize = 200;
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

  const handleUploadAvatar = async (newBase64: string) => {
    setAvatarUrl(newBase64);

    const updatedUser = {
      ...userData,
      avatarUrl: newBase64,
      avatar: newBase64,
      image: newBase64,
      displayName: userData?.username || userData?.displayName,
    };

    try {
      if (userData?._id) {
        await axios.put(`http://localhost:3000/api/tk/update/${userData._id}`, {
          username: userData.username,
          email: userData.email,
          avatar: newBase64,
        });
      }

      if (userData?.staffId) {
        await axios.put(`http://localhost:3000/api/staff/edit/${userData.staffId}`, {
          ten: userData.username,
          namSinh: userData.dob ? dayjs(userData.dob).format("YYYY-MM-DD") : "1990-01-01",
          gioiTinh: userData.gender === "nam" ? "Nam" : userData.gender === "nu" ? "Nữ" : "Khác",
          email: userData.email,
          sdt: userData.phone,
          cccd: userData.cccd,
          image: newBase64,
          diaChi: userData.address,
          chucVu: "Driver",
        });
      }
    } catch (apiErr) {
      console.error("Lỗi đổi avatar:", apiErr);
    }

    setUserData(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    toast.success("Thay đổi ảnh đại diện thành công!");

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("user-updated", { detail: updatedUser }));
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
        e.target.value = "";
      }
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
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity border-4 border-white">
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
                      {userData?.username || "Tài xế NETBUS"}
                    </Title>
                    <Tag color="green" className="font-bold border-none px-3 py-0.5 rounded-full flex items-center gap-1">
                      <SafetyCertificateOutlined /> {userData?.chucVu || "Tài xế NETBUS"}
                    </Tag>
                  </div>
                  <Text type="secondary" className="block text-sm">
                    {userData?.email}
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
                              Địa chỉ
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
              ]}
            />
          </Card>

        </div>
      </div>
    </ClientLayout>
  );
}
