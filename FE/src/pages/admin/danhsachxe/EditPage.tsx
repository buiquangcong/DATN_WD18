import { Button, Form, Input, Select } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useParams } from "react-router-dom";
import { useEffect } from "react";

function EditPage() {
    const { list, Edit } = useCRUD("bus");
    const [form] = Form.useForm();
    const { id } = useParams();

    useEffect(() => {
        const bus = list?.find((item: any) => item._id === id);
        if (bus) {
            // Chuẩn hóa dữ liệu status
            let normalizedStatus = bus.status;
            const statusLower = bus.status?.toLowerCase();

            if (statusLower === "active" || statusLower === "hoạt động") {
                normalizedStatus = "Hoạt động";
            } else if (statusLower === "maintenance" || statusLower === "bảo trì") {
                normalizedStatus = "Bảo trì";
            } else if (statusLower === "inactive" || statusLower === "ngừng hoạt động") {
                normalizedStatus = "Ngừng hoạt động";
            }

            form.setFieldsValue({
                ...bus,
                status: normalizedStatus,
            });
        }
    }, [id, list, form]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Chỉnh sửa thông tin xe</h1>
            <Form
                layout="vertical"
                onFinish={(values) => Edit({ id, ...values })}
                form={form}
                className="space-y-6"
            >
                {/* 1. ĐƯỢC CHỈNH SỬA: Tên xe / Nhà xe */}
                <Form.Item
                    label="Tên xe / Nhà xe"
                    name="name"
                    rules={[
                        { required: true, message: "Vui lòng nhập tên xe" },
                        { whitespace: true, message: "Tên xe không được chỉ chứa khoảng trắng" },
                        { min: 6, message: "Tên xe phải có ít nhất 6 ký tự" },
                        {
                            validator: (_, value) => {
                                if (!value) return Promise.resolve();

                                // Tìm xem có xe nào khác (khác _id hiện tại) trùng tên hay không
                                const isDuplicate = list?.some(
                                    (item: any) =>
                                        item._id !== id &&
                                        item.name?.trim().toLowerCase() === value.trim().toLowerCase()
                                );

                                if (isDuplicate) {
                                    return Promise.reject(new Error("Tên xe đã tồn tại trong hệ thống"));
                                }

                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    <Input placeholder="Nhập tên xe hoặc nhà xe" />
                </Form.Item>

                {/* 2. CHỈ XEM: Hãng xe */}
                <Form.Item label="Hãng xe" name="hangxe">
                    <Input disabled placeholder="Chưa có thông tin hãng xe" />
                </Form.Item>

                {/* 3. CHỈ XEM: Biển số xe */}
                <Form.Item label="Biển số xe" name="licensePlates">
                    <Input disabled />
                </Form.Item>

                {/* 4. CHỈ XEM: Loại xe */}
                <Form.Item label="Loại xe" name="type">
                    <Select
                        disabled
                        options={[
                            { value: "Sleeper", label: "Xe giường nằm (Sleeper)" },
                            { value: "Seater", label: "Xe ghế ngồi (Seater)" },
                            { value: "Limousine", label: "Xe Limousine VIP" },
                        ]}
                    />
                </Form.Item>

                {/* 5. CHỈ XEM: Sức chứa */}
                <Form.Item label="Sức chứa" name="capacity">
                    <Select disabled placeholder="Sức chứa" />
                </Form.Item>

                {/* 6. ĐƯỢC CHỈNH SỬA: Trạng thái */}
                <Form.Item
                    label="Trạng thái"
                    name="status"
                    rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                >
                    <Select
                        placeholder="Chọn trạng thái"
                        options={[
                            { value: "Hoạt động", label: "Hoạt động" },
                            { value: "Bảo trì", label: "Bảo trì" },
                            { value: "Ngừng hoạt động", label: "Ngừng hoạt động" },
                        ]}
                    />
                </Form.Item>

                <Button type="primary" htmlType="submit">
                    Cập nhật
                </Button>
            </Form>
        </div>
    );
}

export default EditPage;