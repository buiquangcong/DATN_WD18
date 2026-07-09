import { Button, Form, Input, InputNumber, Select } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";

function AddPage() {
  const { list, Add } = useCRUD("bus");
  // Sử dụng hook form của Ant Design để có thể can thiệp thay đổi giá trị input
  const [form] = Form.useForm();

  // Hàm xử lý khi các trường trong form thay đổi giá trị
  const handleValuesChange = (changedValues: any) => {
    // Nếu trường thay đổi là "type"
    if (changedValues.type) {
      if (changedValues.type === "Sleeper") {
        form.setFieldsValue({ capacity: 38 });
      } else if (changedValues.type === "Seater") {
        form.setFieldsValue({ capacity: 45 });
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Thêm mới</h1>
      <Form
        form={form} // Gán instance form vào đây
        layout="vertical"
        onFinish={(values) => Add(values)}
        onValuesChange={handleValuesChange} // Lắng nghe sự kiện thay đổi
        className="space-y-6"
      >
        <Form.Item
          label="Tên xe / Nhà xe"
          name="name"
          rules={[
            { required: true, message: 'Vui lòng nhập tên xe' },
            { whitespace: true, message: 'Tên xe không được chỉ chứa khoảng trắng' },
            { min: 6, message: 'Tên xe phải có ít nhất 6 ký tự' }
          ]}
        >
          <Input placeholder="Nhập tên xe hoặc nhà xe" />
        </Form.Item>

        <Form.Item
          label="Biển số xe"
          name="licensePlates"
          rules={[
            { required: true, message: 'Vui lòng nhập biển số xe' },
            { whitespace: true, message: 'Biển số xe không được chỉ chứa khoảng trắng' },
            {
              pattern: /^[0-9]{2}[A-Z]{1,2}-[0-9]{3,5}(\.[0-9]{2})?$/i,
              message: 'Biển số xe không hợp lệ (Ví dụ: 29B-123.45 hoặc 29B-1234)'
            },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const cleanValue = value.trim().toUpperCase();
                const isDuplicate = list?.some((bus: any) => bus.licensePlates?.trim().toUpperCase() === cleanValue);
                if (isDuplicate) {
                  return Promise.reject(new Error('Biển số xe này đã tồn tại trong hệ thống!'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Input placeholder="Nhập biển số xe" />
        </Form.Item>

        <Form.Item label="Loại xe" name="type" rules={[{ required: true, message: 'Vui lòng chọn loại xe' }]}>
          <Select placeholder="Chọn loại xe" options={['Sleeper', 'Seater'].map((value) => ({ value, label: value }))} />
        </Form.Item>

        <Form.Item
          label="Sức chứa"
          name="capacity"
          rules={[
            { required: true, message: 'Vui lòng nhập sức chứa' },
            { type: 'number', min: 1, max: 45, message: 'Sức chứa phải từ 1 đến 45 chỗ' }
          ]}
        >
          <InputNumber className="w-full" min={1} max={45} placeholder="Nhập sức chứa" />
        </Form.Item>

        <Form.Item label="Trạng thái" name="status" rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}>
          <Select placeholder="Chọn trạng thái" options={['Active', 'Maintenance', 'Inactive'].map((value) => ({ value, label: value }))} />
        </Form.Item>

        <Button type="primary" htmlType="submit">Thêm xe</Button>
      </Form>
    </div>
  );
}

export default AddPage;