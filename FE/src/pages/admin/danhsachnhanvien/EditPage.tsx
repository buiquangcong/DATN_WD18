import { Button, Form, Input, Select, Card } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";

function EditPage() {
    const { list, Edit, isLoading } = useCRUD("staff");
    const [form] = Form.useForm();
    const { id } = useParams();
    const navigate = useNavigate();

    const getGoogleDriveDirectLink = (url: string): string => {
        if (!url) return "";
        const driveRegex = /(?:\/d\/|id=)([\w-]+)/;
        const match = url.match(driveRegex);
        if (match && match[1]) {
            const fileId = match[1];
            return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
        return url;
    };

    useEffect(() => {
        const staff = list?.find((item: any) => item._id === id);
        if (staff) {
            form.setFieldsValue({
                ...staff,
                trangThai: staff.trangThai || "Hoạt động",
            });
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
                    onFinish={(values) => {
                        const payload = { ...values };
                        if (payload.chucVu !== "Driver") {
                            payload.bangLai = "";
                            payload.anhBangLai = "";
                        } else if (payload.anhBangLai) {
                            payload.anhBangLai = getGoogleDriveDirectLink(payload.anhBangLai);
                        }
                        Edit({ _id: id, id, ...payload });
                    }}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        <Form.Item
                            label="Họ và tên"
                            name="ten"
                            rules={[
                                { required: true, message: "Vui lòng nhập họ tên" },
                                { whitespace: true, message: "Họ tên không được để trống" },
                            ]}
                        >
                            <Input placeholder="Nhập đầy đủ họ và tên" size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Ngày tháng năm sinh"
                            name="namSinh"
                            rules={[
                                { required: true, message: "Vui lòng nhập ngày tháng năm sinh" },
                                { whitespace: true, message: "Không được để trống ngày tháng năm sinh" },
                            ]}
                        >
                            <Input placeholder="VD: 15/08/1992 hoặc 1992" size="large" />
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
                                    { value: "Assistant_Driver", label: "Phụ xe" },
                                    { value: "Driver", label: "Tài xế" },
                                    { value: "Admin", label: "Quản trị viên" },
                                ]}
                            />
                        </Form.Item>

                        {/* TRẠNG THÁI: Hoạt động & Không hoạt động */}
                        <Form.Item
                            label="Trạng thái"
                            name="trangThai"
                            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                        >
                            <Select
                                placeholder="Chọn trạng thái"
                                size="large"
                                options={[
                                    { value: "Hoạt động", label: "Hoạt động" },
                                    { value: "Không hoạt động", label: "Không hoạt động" },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: "Vui lòng nhập email" },
                                { type: "email", message: "Email không đúng định dạng" },
                            ]}
                        >
                            <Input placeholder="example@domain.com" size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Số điện thoại"
                            name="sdt"
                            rules={[
                                { required: true, message: "Vui lòng nhập số điện thoại" },
                                { pattern: /(84|0[3|5|7|8|9])+([0-9]{8})\b/, message: "Số điện thoại không đúng định dạng" },
                            ]}
                        >
                            <Input placeholder="Nhập số điện thoại (10 chữ số)" size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Số CCCD"
                            name="cccd"
                            rules={[
                                { required: true, message: "Vui lòng nhập số CCCD" },
                                { pattern: /^[0-9]{12}$/, message: "CCCD phải đúng 12 chữ số" },
                            ]}
                        >
                            <Input placeholder="Nhập 12 số CCCD" size="large" />
                        </Form.Item>

                        <Form.Item label="Đường dẫn ảnh đại diện (Image URL)" name="image">
                            <Input placeholder="https://example.com/avatar.jpg" size="large" />
                        </Form.Item>

                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => prevValues.chucVu !== currentValues.chucVu}
                        >
                            {({ getFieldValue }) => {
                                const isDriver = getFieldValue("chucVu") === "Driver";
                                return (
                                    <>
                                        <Form.Item
                                            label="Bằng lái xe"
                                            name="bangLai"
                                            rules={[
                                                {
                                                    required: isDriver,
                                                    message: "Tài xế bắt buộc phải nhập hạng bằng lái xe",
                                                },
                                                {
                                                    validator: (_, value) => {
                                                        if (isDriver && value) {
                                                            const allowed = ["D", "E", "F", "FB2", "FC", "FD", "FE"];
                                                            if (!allowed.includes(value.trim().toUpperCase())) {
                                                                return Promise.reject(
                                                                    new Error("Bằng lái xe của tài xế phải từ hạng D trở lên (D, E, F, FC, FD, FE)")
                                                                );
                                                            }
                                                        }
                                                        return Promise.resolve();
                                                    },
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={isDriver ? "VD: D, E, FC..." : "Chỉ áp dụng cho Tài xế"}
                                                size="large"
                                                disabled={!isDriver}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Ảnh chụp minh chứng bằng lái (URL / Google Drive Link)"
                                            name="anhBangLai"
                                            rules={[
                                                {
                                                    required: isDriver,
                                                    message: "Tài xế bắt buộc phải có ảnh chụp bằng lái xe",
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={isDriver ? "Link ảnh hoặc link Google Drive..." : "Chỉ áp dụng cho Tài xế"}
                                                size="large"
                                                disabled={!isDriver}
                                            />
                                        </Form.Item>
                                    </>
                                );
                            }}
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
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={isLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Lưu Thay Đổi
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
}

export default EditPage;