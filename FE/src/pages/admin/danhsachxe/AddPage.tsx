import { Button, Form, Input, Select } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";

// Khai báo tập trung danh sách số chỗ tương ứng với từng loại xe
const CAPACITY_OPTIONS_MAP: Record<string, number[]> = {
  Sleeper: [34],
  Seater: [16, 29, 45],
};

function AddPage() {
  const { list, Add } = useCRUD("bus");
  const [form] = Form.useForm();

  // Lắng nghe giá trị 'type' từ Form
  const selectedType = Form.useWatch("type", form);

  // Xử lý tự động gán/reset giá trị sức chứa khi loại xe thay đổi
  const handleValuesChange = (changedValues: any) => {
    if (changedValues.type) {
      if (changedValues.type === "Sleeper") {
        form.setFieldsValue({ capacity: 34 });
      } else if (changedValues.type === "Seater") {
        form.setFieldsValue({ capacity: 16 });
      }
    }
  };

  // Lấy danh sách tùy chọn chỗ ngồi dựa theo loại xe được chọn
  const capacityOptions = selectedType
    ? CAPACITY_OPTIONS_MAP[selectedType] || []
    : [16, 29, 34, 45]; // Mặc định hiển thị tất cả nếu chưa chọn type

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Thêm mới xe</h1>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => Add(values)}
        onValuesChange={handleValuesChange}
        className="space-y-6"
      >
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
                  (bus: any) => bus.licensePlates?.trim().toUpperCase() === cleanValue
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

        {/* Đặt Loại xe lên trước Sức chứa */}
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

        {/* Sức chứa: Chuyển sang Select & disabled khi là Sleeper */}
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

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
        >
          <Select
            placeholder="Chọn trạng thái"
            options={["Active", "Maintenance", "Inactive"].map((value) => ({
              value,
              label: value,
            }))}
          />
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Thêm xe
        </Button>
      </Form>
    </div>
  );
}

export default AddPage;