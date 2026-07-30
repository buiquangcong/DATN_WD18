import React, { useState } from "react";
import { Row, Col, Card, Form, Input, Button, Typography, Result } from "antd";
import {
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CheckCircleOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const { Title, Text, Paragraph } = Typography;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onFinish = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (!token) {
      toast.error("Mã khôi phục không hợp lệ hoặc đã hết hạn!");
      return;
    }

    setIsPending(true);
    try {
      const response = await axios.post("http://localhost:3000/api/auth/reset-password", {
        token,
        newPassword: values.newPassword,
      });

      if (response.data?.success) {
        toast.success("Đặt lại mật khẩu thành công!");
        setIsSuccess(true);
        // Clear token from localStorage user session if they were logged in with old password
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("storage"));
      } else {
        toast.error(response.data?.message || "Có lỗi xảy ra!");
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Đặt lại mật khẩu thất bại!";
      toast.error(errMsg);
    } finally {
      setIsPending(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <Card className="max-w-md w-full shadow-lg rounded-3xl p-6 text-center border border-slate-200">
          <Result
            status="error"
            title="Đường dẫn không hợp lệ"
            subTitle="Liên kết khôi phục mật khẩu không chính xác hoặc đã hết hạn. Vui lòng quay lại trang cá nhân để gửi lại yêu cầu."
            extra={[
              <Button
                type="primary"
                key="home"
                icon={<HomeOutlined />}
                onClick={() => navigate("/khachhang")}
                className="bg-emerald-600 border-none hover:bg-emerald-500 font-bold rounded-xl"
              >
                Về trang chủ
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <Card className="max-w-md w-full shadow-lg rounded-3xl p-6 text-center border border-slate-200">
          <Result
            status="success"
            title="Đặt lại mật khẩu thành công"
            subTitle="Mật khẩu của bạn đã được cập nhật thành công trên toàn bộ hệ thống NetBus. Hãy đăng nhập lại bằng mật khẩu mới."
            extra={[
              <Button
                type="primary"
                key="login"
                icon={<CheckCircleOutlined />}
                onClick={() => navigate("/khachhang/login")}
                className="bg-emerald-600 border-none hover:bg-emerald-500 font-bold rounded-xl"
              >
                Đăng nhập ngay
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-160px)]">
      <Row className="min-h-[calc(100vh-160px)]">
        {/* LEFT COLUMN: BRAND IMAGE & MOTIVATION */}
        <Col xs={0} md={12} className="relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
            alt="NETBUS RESET PASSWORD"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-green-900/40" />
          <div className="absolute bottom-16 left-16 text-white max-w-lg">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-600 mb-6 font-semibold">
              Bảo mật tài khoản của bạn
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-4">
              Đặt lại
              <br />
              mật khẩu mới.
            </h1>
            <Paragraph className="text-lg text-white/95">
              NetBus hỗ trợ khôi phục mật khẩu thông qua email nhanh chóng. Hãy cập nhật mật khẩu mới có độ bảo mật cao để bảo vệ thông tin cá nhân và vé xe của bạn.
            </Paragraph>
          </div>
        </Col>

        {/* RIGHT COLUMN: RESET FORM */}
        <Col xs={24} md={12} className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <Title level={2} className="!mb-2">
              Khôi phục mật khẩu
            </Title>
            <Text type="secondary" className="block mb-6">
              Vui lòng thiết lập mật khẩu mới có tối thiểu 6 ký tự
            </Text>

            <Card bordered={false} className="shadow-md rounded-2xl border border-slate-100">
              <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
                <Form.Item
                  label="Mật khẩu mới"
                  name="newPassword"
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu mới" },
                    { min: 6, message: "Mật khẩu phải chứa ít nhất 6 ký tự" },
                  ]}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined className="text-slate-400" />}
                    placeholder="Nhập mật khẩu mới"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Form.Item
                  label="Xác nhận mật khẩu mới"
                  name="confirmPassword"
                  dependencies={["newPassword"]}
                  rules={[
                    { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("newPassword") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined className="text-slate-400" />}
                    placeholder="Nhập lại mật khẩu mới"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Button
                  htmlType="submit"
                  type="primary"
                  size="large"
                  block
                  loading={isPending}
                  icon={<CheckCircleOutlined />}
                  className="bg-emerald-600 border-none hover:bg-emerald-500 font-bold rounded-xl mt-4"
                >
                  Xác nhận đặt lại mật khẩu
                </Button>
              </Form>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}
