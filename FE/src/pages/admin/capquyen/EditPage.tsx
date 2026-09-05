import { Button, Form, Input, Select, Spin, Card } from "antd";
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCRUD, useDetail } from "../../../hooks/useCRUD";

function UserEditPage() {
    const [form] = Form.useForm();
    const { id } = useParams();
    const navigate = useNavigate();
    const { Edit, isLoading: isUpdating } = useCRUD("tk");
    const { data: user, isLoading } = useDetail("tk", id);

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                status: user.status !== false, // Mặc định true nếu chưa có
            });
        }
    }, [user, form]);

    const onFinish = (values: any) => {
        const data: Record<string, any> = { _id: id, ...values };

        // Nếu không nhập mật khẩu mới, xóa trường password khỏi payload
        if (!values.password || values.password.trim() === "") {
            delete data.password;
        }

        Edit(data);
    };

    if (isLoading) {
        return (
            <div className="p-10 flex justify-center items-center min-h-[300px]">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl">
            <Card className="shadow-xs border border-gray-100 rounded-xl bg-white">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-800">Cập nhật tài khoản</h1>
                    <p className="text-sm text-gray-500">
                        Chỉnh sửa thông tin tài khoản, phân quyền và điều chỉnh trạng thái hoạt động.
                    </p>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        label="Tên tài khoản"
                        name="username"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập tên tài khoản",
                            },
                            {
                                whitespace: true,
                                message: "Tên tài khoản không được để trống",
                            },
                        ]}
                    >
                        <Input size="large" placeholder="Ví dụ: nguyenvanan" />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập email",
                            },
                            {
                                type: "email",
                                message: "Email không đúng định dạng",
                            },
                        ]}
                    >
                        <Input size="large" placeholder="user@gmail.com" />
                    </Form.Item>

                    <Form.Item
                        label="Ảnh đại diện (URL)"
                        name="avatar"
                        rules={[
                            {
                                type: "url",
                                message: "Link ảnh không hợp lệ",
                            },
                        ]}
                    >
                        <Input size="large" placeholder="https://example.com/avatar.jpg" />
                    </Form.Item>

                    <Form.Item
                        label="Vai trò"
                        name="role"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn vai trò",
                            },
                        ]}
                    >
                        <Select
                            size="large"
                            options={[
                                {
                                    label: "Khách hàng (User)",
                                    value: "user",
                                },
                                {
                                    label: "Quản trị viên (Admin)",
                                    value: "admin",
                                },
                                {
                                    label: "Nhân viên (Staff)",
                                    value: "staff",
                                },
                                {
                                    label: "Tài xế (Driver)",
                                    value: "driver",
                                },
                                {
                                    label: "Phụ xe (Assistant Driver)",
                                    value: "assistant_driver",
                                },
                            ]}
                        />
                    </Form.Item>

                    {/* TRẠNG THÁI HIỂN THỊ DẠNG CHỮ BÌNH THƯỜNG */}
                    <Form.Item
                        label="Trạng thái tài khoản"
                        name="status"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn trạng thái",
                            },
                        ]}
                    >
                        <Select
                            size="large"
                            options={[
                                {
                                    value: true,
                                    label: "Hoạt động",
                                },
                                {
                                    value: false,
                                    label: "Không hoạt động",
                                },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu mới"
                        name="password"
                        rules={[
                            {
                                min: 6,
                                message: "Mật khẩu mới phải có tối thiểu 6 ký tự",
                            },
                        ]}
                    >
                        <Input.Password
                            size="large"
                            placeholder="Để trống nếu không muốn đổi mật khẩu"
                        />
                    </Form.Item>

                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={isUpdating}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Cập nhật tài khoản
                        </Button>
                        <Button
                            size="large"
                            onClick={() => navigate("/admin/tk/list")}
                        >
                            Hủy
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
}

export default UserEditPage;