import { Button, Form, Input, InputNumber, Select, Card, Space } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";

function AddPage() {
    const { Add, list } = useCRUD("staff");
    const navigate = useNavigate();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Thêm Mới Nhân Viên</h1>
                <p className="text-sm text-gray-500">Nhập đầy đủ thông tin nhân sự để lưu vào cơ sở dữ liệu.</p>
            </div>

            <Card className="shadow-xs border border-gray-100 rounded-xl bg-white p-4">
                <Form
                    layout="vertical"
                    onFinish={(values) => Add(values)}
                    className="space-y-4"
                    initialValues={{
                        gioiTinh: "Nam",
                        chucVu: "Staff",
                    }}
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
                            <InputNumber className="w-full" min={1900} max={new Date().getFullYear()} placeholder="Nhập năm sinh" size="large" />
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
                                {
                                    validator: (_, value) => {
                                        if (value && list?.some((item: any) => item.email === value)) {
                                            return Promise.reject(new Error("Email đã tồn tại!"));
                                        }
                                        return Promise.resolve();
                                    },
                                },
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
                                {
                                    validator: (_, value) => {
                                        if (value && list?.some((item: any) => item.sdt === value)) {
                                            return Promise.reject(new Error("Số điện thoại đã tồn tại!"));
                                        }
                                        return Promise.resolve();
                                    },
                                },
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
                                {
                                    validator: (_, value) => {
                                        if (value && list?.some((item: any) => item.cccd === value)) {
                                            return Promise.reject(new Error("Số CCCD đã tồn tại!"));
                                        }
                                        return Promise.resolve();
                                    },
                                },
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
                            Thêm Nhân Viên
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
}

export default AddPage;
