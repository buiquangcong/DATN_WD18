import React, { useState } from "react";
import { Row, Col, Card, Form, Input, Button, Typography } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const { Title, Text, Link } = Typography;

export default function RegisterClientPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [countdown, setCountdown] = useState(0);

  // ==========================================
  // 1. MUTATION: XỬ LÝ GỬI MÃ OTP VỀ EMAIL
  // ==========================================
  const { mutate: sendOtpMutate, isPending: isSendingOtp } = useMutation({
    mutationFn: async (email: string) => {
      // SỬA ĐỔI: Bóc tách lấy thẳng .data trả về từ Backend
      const response = await axios.post("http://localhost:3000/api/mail/send-otp", { email });
      return response.data;
    },
    onSuccess: (data: any) => {
      // SỬA ĐỔI: Hiển thị message động trả về từ Backend (VD: "Mã OTP đã được gửi thành công...")
      toast.success(data?.message || "Mã OTP đã được gửi vào Email của bạn!");
      
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    onError: (error: any) => {
      // SỬA ĐỔI: Lấy chính xác dòng lỗi "Email không tồn tại" hoặc lỗi DB từ Backend thay vì thông báo cứng
      const errMsg = error.response?.data?.message || "Không thể gửi OTP!";
      toast.error(errMsg);
    },
  });

  // Hàm kích hoạt khi bấm nút "Gửi mã"
  const handleGetOtp = async () => {
    try {
      const emailValue = await form.validateFields(["email"]);
      sendOtpMutate(emailValue.email);
    } catch (err) {
      toast.error("Vui lòng nhập đúng định dạng Email trước khi lấy mã!");
    }
  };

  // ==========================================
  // 2. MUTATION: XỬ LÝ ĐĂNG KÝ TÀI KHOẢN CHÍNH THỨC
  // ==========================================
  const { mutate: registerMutate, isPending: isRegistering } = useMutation({
    mutationFn: async (values: any) => {
      // SỬA ĐỔI: Bóc tách lấy thẳng .data
      const response = await axios.post("http://localhost:3000/api/auth/signup", values);
      return response.data;
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || "Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
      navigate("/login");
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || "Đăng ký thất bại!";
      toast.error(errMsg);
    },
  });

  const onFinish = (values: any) => {
    registerMutate(values);
  };

  return (
    <div className="min-h-[calc(100vh-160px)]">
      <Row className="min-h-[calc(100vh-160px)]">
        {/* LEFT IMAGE */}
        <Col xs={0} md={12} className="relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
            alt="NETBUS"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-green-900/40" />
          <div className="absolute bottom-16 left-16 text-white max-w-lg">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-600 mb-6">
              Hành trình xanh, tương lai bền vững
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-4">
              Kiến tạo
              <br />
              tài khoản mới.
            </h1>
            <p className="text-lg text-white/90">
              Gia nhập mạng lưới vận tải thông minh Bee Green. Trải nghiệm dịch vụ đặt vé xe an toàn, nhanh chóng và bảo mật cao.
            </p>
          </div>
        </Col>

        {/* RIGHT FORM */}
        <Col xs={24} md={12} className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <Title level={2} className="!mb-2">
              Đăng ký tài khoản
            </Title>
            <Text type="secondary">
              Tạo tài khoản để trải nghiệm dịch vụ của Bee Green
            </Text>

            <Card bordered={false} className="mt-6 shadow-sm">
              <Form form={form} layout="vertical" onFinish={onFinish}>
                
                {/* TRƯỜNG HỌ VÀ TÊN */}
                <Form.Item
                  label="Họ và tên"
                  name="username"
                  rules={[{ required: true, message: "Vui lòng nhập họ và tên của bạn" }]}
                >
                  <Input size="large" prefix={<UserOutlined />} placeholder="VD: Bùi Quang Công" />
                </Form.Item>

                {/* TRƯỜNG EMAIL + NÚT GỬI OTP */}
                <Form.Item label="Địa chỉ Email" required className="!mb-0">
                  <Row gutter={[8, 8]}>
                    <Col span={16}>
                      <Form.Item
                        name="email"
                        rules={[
                          { required: true, message: "Vui lòng nhập Email" },
                          { type: "email", message: "Email không đúng định dạng" },
                        ]}
                      >
                        <Input size="large" prefix={<MailOutlined />} placeholder="example@gmail.com" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Button
                        size="large"
                        block
                        onClick={handleGetOtp}
                        loading={isSendingOtp}
                        disabled={countdown > 0}
                      >
                        {countdown > 0 ? `${countdown}s` : "Gửi mã"}
                      </Button>
                    </Col>
                  </Row>
                </Form.Item>

                {/* TRƯỜNG NHẬP MÃ OTP KHÁCH NHẬN ĐƯỢC */}
                <Form.Item
                  label="Mã xác thực OTP"
                  name="otpInput"
                  rules={[
                    { required: true, message: "Vui lòng nhập mã OTP gồm 6 số" },
                    { len: 6, message: "Mã OTP phải chứa chính xác 6 ký tự số" }
                  ]}
                >
                  <Input size="large" prefix={<CheckCircleOutlined />} placeholder="Nhập mã 6 số từ Email" maxLength={6} />
                </Form.Item>

                {/* TRƯỜNG MẬT KHẨU */}
                <Form.Item
                  label="Mật khẩu"
                  name="password"
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu" },
                    { min: 6, message: "Mật khẩu phải tối thiểu 6 ký tự" }
                  ]}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined />}
                    placeholder="Tối thiểu 6 ký tự"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                {/* NÚT HOÀN TẤT ĐĂNG KÝ */}
                <Button
                  htmlType="submit"
                  type="primary"
                  size="large"
                  block
                  className="mt-2"
                  loading={isRegistering}
                  icon={<ArrowRightOutlined />}
                >
                  Đăng ký ngay
                </Button>

                <div className="text-center mt-4">
                  <Text type="secondary">Bạn đã có tài khoản? </Text>
                  <Link onClick={() => navigate("/login")}>Đăng nhập ngay</Link>
                </div>
              </Form>
            </Card>

            {/* SUPPORT BOX */}
            <Card className="mt-4 bg-green-50 border-green-200">
              <div className="flex gap-3">
                <div className="text-green-700 text-xl">🎧</div>
                <div>
                  <div className="font-semibold text-green-900">CẦN HỖ TRỢ KỸ THUẬT?</div>
                  <div className="text-gray-600 mt-1">
                    Liên hệ tổng đài hỗ trợ <strong>1900 8888</strong> để được trợ giúp kích hoạt tài khoản.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}