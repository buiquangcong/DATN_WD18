import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { Button, Form, Input, Card, Typography } from "antd";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const LoginPage = () => {
    const navigate = useNavigate();

    const { mutate, isPending } = useMutation({
        mutationFn: async (value: any) => {
            return await axios.post("http://localhost:3000/api/auth/signin", value);
        },
        onSuccess: (res) => {
            const user = res.data.user;
            const staff = res.data.staff;
            const token = res.data.token;

            if (user?.role !== "admin") {
                toast.error("Tài khoản không có quyền truy cập trang quản trị!");
                return;
            }

            const userData = {
                ...user,
                displayName: staff?.ten || user?.username || "Admin",
                staffId: staff?._id
            };

            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("token", token);
            toast.success("Đăng nhập thành công!");
            navigate("/admin/bus/list");
        },
        onError: (error: any) => {
            const errMsg = error.response?.data?.message || "Đăng nhập thất bại!";
            toast.error(errMsg);
        }
    });

    const onFinish = (value: any) => {
        mutate(value);
    };

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            backgroundImage: "url('/assets/images/background-login.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
        }}>
            <Card style={{ width: 400, borderRadius: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                        <img
                            src="/assets/images/Logo.png"
                            alt="Logo"
                            style={{ width: 80, height: 80, objectFit: "contain" }}
                        />
                    </div>
                    <Title level={3} style={{ margin: 0 }}>ĐĂNG NHẬP</Title>
                    <p style={{ color: "#666", marginTop: 4 }}>Chào mừng quay trở lại!</p>
                </div>
                <Form
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: "Nhập email!" },
                            { type: "email", message: "Email không đúng định dạng!" }
                        ]}
                    >
                        <Input placeholder="Email của bạn..." size="large" />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[{ required: true, message: "Nhập mật khẩu!" }]}
                    >
                        <Input.Password placeholder="Mật khẩu..." size="large" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={isPending} block size="large">
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;