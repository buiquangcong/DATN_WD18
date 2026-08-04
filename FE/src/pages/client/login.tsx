import React, { useState } from "react";
import { Row, Col, Card, Form, Input, Button, Checkbox, Typography, Modal } from "antd";
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const { Title, Text, Link, Paragraph } = Typography;

export default function LoginClientPage() {
  const navigate = useNavigate();
  
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotForm] = Form.useForm();
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  const handleForgotSubmit = async (values: any) => {
    setIsSendingForgot(true);
    try {
      const response = await axios.post("http://localhost:3000/api/auth/forgot-password", {
        email: values.forgotEmail,
      });
      if (response.data?.success) {
        toast.success("Đã gửi link khôi phục mật khẩu! Vui lòng kiểm tra email.");
        setIsForgotModalOpen(false);
        forgotForm.resetFields();
      } else {
        toast.error(response.data?.message || "Có lỗi xảy ra!");
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Gửi email khôi phục thất bại!";
      toast.error(errMsg);
    } finally {
      setIsSendingForgot(false);
    }
  };

  // Cấu hình React Query Mutation xử lý gọi API login thực tế
  const { mutate, isPending } = useMutation({
    mutationFn: async (value: any) => {
      // Đổi payload nếu API backend yêu cầu "email" thay vì "staffId"
      // Ví dụ: return await axios.post("http://localhost:3000/api/auth/signin", { email: value.staffId, password: value.password });
      return await axios.post("http://localhost:3000/api/auth/signin", value);
    },
    onSuccess: (res) => {
      const user = res.data.user;
      const staff = res.data.staff;
      const token = res.data.token;

      const userData = {
        ...user,
        displayName: staff?.ten || user?.username || "Người dùng",
        staffId: staff?._id
      };

      // Lưu trữ thông tin định danh vào localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token);
      
      toast.success("Đăng nhập thành công!");

      // Tự động phân luồng chuyển hướng dựa trên quyền hạn trả về
      if (userData?.role === "admin") {
        navigate("/admin");
      } else if (userData?.role === "driver") {
        navigate("/taixe");
      } else {
        navigate("/khachhang/trip"); // Đưa client về đúng luồng tuyến đường
      }
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || "Đăng nhập thất bại!";
      toast.error(errMsg);
    }
  });

  const onFinish = (values: any) => {
    // Kích hoạt gửi dữ liệu lên server backend
    mutate(values);
  };

  return (
    <div className="min-h-[calc(100vh-160px)]">
      <Row className="min-h-[calc(100vh-160px)]">
        {/* LEFT IMAGE */}
        <Col
          xs={0}
          md={12}
          className="relative overflow-hidden"
        >
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
              Kết nối mọi
              <br />
              hành trình.
            </h1>

            <p className="text-lg text-white/90">
              Chào mừng đội ngũ nhân viên và tài xế NETBUS.
              Cùng nhau kiến tạo mạng lưới vận tải thông minh
              và thân thiện với môi trường.
            </p>
          </div>
        </Col>

        {/* RIGHT FORM */}
        <Col
          xs={24}
          md={12}
          className="flex items-center justify-center px-6 py-12"
        >
          <div className="w-full max-w-md">
            <Title level={2} className="!mb-2">
              Đăng nhập
            </Title>

            <Text type="secondary">
              Truy cập vào cổng thông tin nội bộ NETBUS
            </Text>

            <Card
              bordered={false}
              className="mt-8 shadow-sm"
            >
              <Form
                layout="vertical"
                onFinish={onFinish}
              >
                {/* Đổi name="staffId" thành name="email" nếu schema database của bạn dùng Email để đăng nhập */}
                <Form.Item
                  label="Mã nhân viên"
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập mã nhân viên",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    prefix={<UserOutlined />}
                    placeholder="VD: NB-12345"
                  />
                </Form.Item>

                <Form.Item
                  label="Mật khẩu"
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập mật khẩu",
                    },
                  ]}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined />}
                    placeholder="••••••••"
                    iconRender={(visible) =>
                      visible ? (
                        <EyeTwoTone />
                      ) : (
                        <EyeInvisibleOutlined />
                      )
                    }
                  />
                </Form.Item>

                <div className="flex justify-between items-center mb-6">
                  {/* Quản lý lưu trạng thái checkbox nếu cần gửi lên backend */}
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                  </Form.Item>

                  <Link onClick={() => setIsForgotModalOpen(true)} className="cursor-pointer text-emerald-600 hover:text-emerald-500 font-medium">
                    Quên mật khẩu?
                  </Link>
                </div>

                <Button
                  htmlType="submit"
                  type="primary"
                  size="large"
                  block
                  loading={isPending} // Thay thế loading state thủ công bằng trạng thái của React Query
                  icon={<ArrowRightOutlined />}
                >
                  Đăng nhập
                </Button>
              </Form>
            </Card>

            {/* SUPPORT BOX */}
            <Card
              className="mt-6 bg-green-50 border-green-200"
            >
              <div className="flex gap-3">
                <div className="text-green-700 text-xl">
                  🎧
                </div>

                <div>
                  <div className="font-semibold text-green-900">
                    CẦN HỖ TRỢ KỸ THUẬT?
                  </div>

                  <div className="text-gray-600 mt-1">
                    Liên hệ bộ phận IT qua số{" "}
                    <strong>1900 8888</strong>
                    <br />
                    helpdesk@netbus.com
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      <Modal
        title="Quên mật khẩu"
        open={isForgotModalOpen}
        onCancel={() => {
          if (!isSendingForgot) {
            setIsForgotModalOpen(false);
            forgotForm.resetFields();
          }
        }}
        footer={null}
        destroyOnClose
        centered
      >
        <Form
          form={forgotForm}
          layout="vertical"
          onFinish={handleForgotSubmit}
          className="mt-4"
        >
          <Paragraph className="text-gray-600 mb-4">
            Nhập email tài khoản của bạn để nhận liên kết đặt lại mật khẩu mới qua Nodemailer:
          </Paragraph>
          <Form.Item
            name="forgotEmail"
            label="Địa chỉ Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không đúng định dạng" },
            ]}
          >
            <Input size="large" placeholder="example@gmail.com" />
          </Form.Item>
          <div className="flex justify-end gap-3 mt-6">
            <Button disabled={isSendingForgot} onClick={() => setIsForgotModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSendingForgot}
              className="bg-emerald-600 border-none hover:bg-emerald-500 font-bold"
            >
              Gửi yêu cầu
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}