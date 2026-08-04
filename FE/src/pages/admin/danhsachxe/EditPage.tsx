import { Button, Form, Input, Select } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useParams } from "react-router-dom";
import { useEffect } from "react";

// Khai báo tập trung danh sách số chỗ theo loại xe (Cấu hình cũ)
const CAPACITY_OPTIONS_MAP: Record<string, number[]> = {
    Sleeper: [34],
    Seater: [16, 29, 45],
};

function EditPage() {
    const { list, Edit } = useCRUD("bus");
    const [form] = Form.useForm();
    const { id } = useParams();

    // Lắng nghe trực tiếp giá trị của 'type' từ Form
    const selectedType = Form.useWatch("type", form);

    useEffect(() => {
        const bus = list?.find((item: any) => item._id === id);
        if (bus) {
            // Chuẩn hóa dữ liệu status cũ (nếu DB còn lưu dạng tiếng Anh hoặc viết thường)
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

    // Tự động gán lại sức chứa khi người dùng thay đổi Loại xe
    const handleValuesChange = (changedValues: any) => {
        if (changedValues.type) {
            if (changedValues.type === "Sleeper") {
                form.setFieldsValue({ capacity: 34 });
            } else if (changedValues.type === "Seater") {
                // Nếu chuyển sang Seater mà sức chứa hiện tại không thuộc [16, 29, 45], đặt mặc định là 16
                const currentCap = form.getFieldValue("capacity");
                if (![16, 29, 45].includes(currentCap)) {
                    form.setFieldsValue({ capacity: 16 });
                }
            }
        }
    };

    // Lấy các options sức chứa tương ứng với Loại xe đang được chọn
    const capacityOptions = selectedType
        ? CAPACITY_OPTIONS_MAP[selectedType] || []
        : [16, 29, 34, 45]; // Mặc định hiển thị tất cả nếu chưa chọn type

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Chỉnh sửa thông tin xe</h1>
            <Form
                layout="vertical"
                onFinish={(values) => Edit({ id, ...values })}
                form={form}
                onValuesChange={handleValuesChange}
                className="space-y-6"
            >
                {/* Tên xe / Nhà xe */}
                <Form.Item
                    label="Tên xe / Nhà xe"
                    name="name"
                    rules={[
                        { required: true, message: "Vui lòng nhập tên xe" },
                        { whitespace: true, message: "Tên xe không được chỉ chứa khoảng trắng" },
                        { min: 6, message: "Tên xe phải có ít nhất 6 ký tự" },
                    ]}
                >
                    <Input placeholder="Nhập tên xe hoặc nhà xe" />
                </Form.Item>

                {/* THÊM MỚI: Hãng xe */}
                <Form.Item label="Hãng xe" name="hangxe">
                    <Input placeholder="Nhập hãng sản xuất (VD: Thaco, Hyundai, Samco, Ford...)" />
                </Form.Item>

                {/* Biển số xe */}
                <Form.Item
                    label="Biển số xe"
                    name="licensePlates"
                    rules={[
                        { required: true, message: "Vui lòng nhập biển số xe" },
                        { whitespace: true, message: "Biển số xe không được chỉ chứa khoảng trắng" },
                        {
                            pattern: /^[0-9]{2}[A-Z]{1,2}-[0-9]{3,5}(\.[0-9]{2})?$/i,
                            message: "Biển số xe không hợp lệ (Ví dụ: 29B-123.45 hoặc 29B-1234)",
                        },
                        {
                            validator: (_, value) => {
                                if (!value) return Promise.resolve();
                                const cleanValue = value.trim().toUpperCase();
                                const isDuplicate = list?.some(
                                    (bus: any) =>
                                        bus.licensePlates?.trim().toUpperCase() === cleanValue &&
                                        bus._id !== id
                                );
                                if (isDuplicate) {
                                    return Promise.reject(
                                        new Error("Biển số xe này đã tồn tại trong hệ thống!")
                                    );
                                }
                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    <Input placeholder="Nhập biển số xe" />
                </Form.Item>

                {/* Loại xe */}
                <Form.Item
                    label="Loại xe"
                    name="type"
                    rules={[{ required: true, message: "Vui lòng chọn loại xe" }]}
                >
                    <Select
                        placeholder="Chọn loại xe"
                        options={[
                            { value: "Sleeper", label: "Xe giường nằm (Sleeper)" },
                            { value: "Seater", label: "Xe ghế ngồi (Seater)" },
                        ]}
                    />
                </Form.Item>

                {/* Sức chứa */}
                <Form.Item
                    label="Sức chứa"
                    name="capacity"
                    rules={[{ required: true, message: "Vui lòng chọn sức chứa" }]}
                >
                    <Select
                        placeholder="Chọn sức chứa"
                        disabled={selectedType === "Sleeper"}
                        options={capacityOptions.map((cap) => ({
                            value: cap,
                            label: `${cap} chỗ`,
                        }))}
                    />
                </Form.Item>

                {/* ĐÃ SỬA: Trạng thái Tiếng Việt (Khớp Enum Schema) */}
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