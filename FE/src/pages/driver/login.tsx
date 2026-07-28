import React from "react";
import { Row, Col, Card, Form, Input, Button, Checkbox, Typography, } from "antd";
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, ArrowRightOutlined, } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const { Title, Text, Link } = Typography;

export default function Login() {
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: async (value: any) => {
      return await axios.post("http://localhost:3000/api/auth/signin", value);
    },
    onSuccess: (res) => {
      const user = res.data.user;
      const staff = res.data.staff;
      const token = res.data.token;

      if (user?.role !== "driver") {
        toast.error("Tài khoản không có quyền truy cập trang tài xế!");
        return;
      }

      const userData = { ...user, displayName: staff?.ten || user?.username || "Tài xế", staffId: staff?._id, avatar: staff?.image || user?.avatar || "" };
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", token);
      toast.success("Đăng nhập thành công!");
      navigate("/taixe");
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || "Đăng nhập thất bại!";
      toast.error(errMsg);
    }
  });

  const onFinish = (values: any) => {
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
                <Form.Item
                  label="Email/Tên đăng nhập"
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập email/tên đăng nhập",
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
                  <Checkbox>Ghi nhớ đăng nhập</Checkbox>

                  <Link href="#">
                    Quên mật khẩu?
                  </Link>
                </div>

                <Button
                  htmlType="submit"
                  type="primary"
                  size="large"
                  block
                  loading={isPending}
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
    </div>
  );
}