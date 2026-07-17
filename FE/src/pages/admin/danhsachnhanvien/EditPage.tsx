import { Button, Form, Input, InputNumber, Select, Card } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";

function EditPage() {
    const { list, Edit } = useCRUD("staff");
    const [form] = Form.useForm();
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const staff = list?.find((item: any) => item._id === id);
        if (staff) {
            form.setFieldsValue(staff);
        }
    }, [id, list, form]);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Cập Nhật Thông Tin Nhân Viên</h1>
                <p className="text-sm text-gray-500">Chỉnh sửa thông tin chi tiết của nhân sự và lưu thay đổi.</p>
            </div>

            <Card className="shadow-xs border border-gray-100 rounded-xl bg-white p-4">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={(values) => Edit({ id, ...values })}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        <Form.Item
                            label="Họ và tên"
                            name="ten"
                            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                        >
                            <Input placeholder="Nhập đầy đủ họ và tên" size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Năm sinh"
                            name="namSinh"
                            rules={[
                                { required: true, message: "Vui lòng nhập năm sinh" },
                                { type: "string", max: new Date().getFullYear(), message: "phải đầy đủ ngày tháng năm sinh" },
                            ]}
                        >
                            <Input className="w-full" min={1900} max={new Date().getFullYear()} placeholder="Nhập năm sinh" size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Giới tính"
                            name="gioiTinh"
                            rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}
                        >
                            <Select
                                placeholder="Chọn giới tính"
                                size="large"
                                options={[
                                    { value: "Nam", label: "Nam" },
                                    { value: "Nữ", label: "Nữ" },
                                    { value: "Khác", label: "Khác" },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Chức vụ"
                            name="chucVu"
                            rules={[{ required: true, message: "Vui lòng chọn chức vụ" }]}
                        >
                            <Select
                                placeholder="Chọn chức vụ"
                                size="large"
                                options={[
                                    { value: "Staff", label: "Nhân viên" },
                                    { value: "Driver", label: "Tài xế" },
                                    { value: "Admin", label: "Quản trị viên" },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: "Vui lòng nhập email" },
                                { type: "email", message: "Email không hợp lệ" },
                            ]}
                        >
                            <Input placeholder="example@domain.com" size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Số điện thoại"
                            name="sdt"
                            rules={[
                                { required: true, message: "Vui lòng nhập số điện thoại" },
                                { pattern: /^[0-9]{9,11}$/, message: "Số điện thoại phải từ 9 đến 11 số" },
                            ]}
                        >
                            <Input placeholder="Nhập số điện thoại" size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Số CCCD"
                            name="cccd"
                            rules={[
                                { required: true, message: "Vui lòng nhập số CCCD" },
                                { pattern: /^[0-9]{9,12}$/, message: "CCCD phải từ 9 đến 12 số" },
                            ]}
                        >
                            <Input placeholder="Số căn cước công dân" size="large" />
                        </Form.Item>

                        <Form.Item label="Đường dẫn ảnh đại diện (Image URL)" name="image">
                            <Input placeholder="https://example.com/avatar.jpg" size="large" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label="Địa chỉ thường trú"
                        name="diaChi"
                        rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
                    >
                        <Input.TextArea placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" rows={3} />
                    </Form.Item>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button size="large" onClick={() => navigate("/admin/staff/list")}>
                            Hủy
                        </Button>
                        <Button type="primary" htmlType="submit" size="large" className="bg-blue-600 hover:bg-blue-700">
                            Lưu Thay Đổi
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
}

export default EditPage;
