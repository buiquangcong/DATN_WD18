import {Button,Form,Input,Select,Spin,} from "antd";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCRUD, useDetail } from "../../../hooks/useCRUD";
function UserEditPage() {
    const [form] = Form.useForm();
    const { id } = useParams();
    const { Edit } = useCRUD("tk");
    const { data: user, isLoading } = useDetail("tk",id);
    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                username: user.username,
                email: user.email,
                role: user.role,
            });
        }
    }, [user, form]);
    const onFinish = (values: any) => {
        const data = { _id: id, ...values,};
        if (!values.password) {
            delete data.password;
        }
        Edit(data);
    };
    if (isLoading) {
        return (
            <div className="p-10 flex justify-center">
                <Spin />
            </div>
        );
    }
    return (
        <div className="p-6 max-w-xl">
            <h1 className="text-xl font-bold mb-6">
                Sửa tài khoản
            </h1>
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
                            message: "Nhập tên tài khoản"
                        }
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        {
                            required: true,
                            message: "Nhập email"
                        }
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Vai trò"
                    name="role"
                >
                    <Select
                        options={[
                            {
                                label: "User",
                                value: "user"
                            },

                            {
                                label: "Admin",
                                value: "admin"
                            },
                             {
                                label: "Driver",
                                value: "Driver"
                            },
                            {
                                label: "staff",
                                value: "staff"
                            }

                        ]}

                    />

                </Form.Item>
                <Form.Item
                    label="Mật khẩu mới"
                    name="password"
                >
                    <Input.Password
                        placeholder="Để trống nếu không đổi mật khẩu"
                    />
                </Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                >
                    Cập nhật
                </Button>
            </Form>
        </div>
    );
}
export default UserEditPage;