import { Button, Form, Input, InputNumber, Select } from "antd";
import { useCRUD } from "../../hooks/useCRUD";
import { useParams } from "react-router-dom";
import { useEffect } from "react";

function EditPage() {
  const { list, Edit } = useCRUD()
  const [form] = Form.useForm()
  const { id } = useParams()

  useEffect(() => {
    const bus = list?.find((item: any) => item._id === id)
    if (bus) {
      form.setFieldsValue(bus)
    }
  }, [list, id, form])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Cập nhật</h1>

      <Form layout="vertical" onFinish={(values) => Edit({ id, ...values })} form={form} className="space-y-6">
        <Form.Item label="Tên xe / Nhà xe" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên xe' }]}>
          <Input placeholder="Nhập tên xe hoặc nhà xe" />
        </Form.Item>

        <Form.Item label="Biển số xe" name="licensePlates" rules={[{ required: true, message: 'Vui lòng nhập biển số xe' }]}>
          <Input placeholder="Nhập biển số xe" />
        </Form.Item>

        <Form.Item label="Sức chứa" name="capacity" rules={[{ required: true, type: 'number', min: 4, message: 'Sức chứa phải lớn hơn hoặc bằng 4' }]}>
          <InputNumber className="w-full" min={4} placeholder="Nhập sức chứa" />
        </Form.Item>

        <Form.Item label="Loại xe" name="type" rules={[{ required: true, message: 'Vui lòng chọn loại xe' }]}>
          <Select placeholder="Chọn loại xe" options={['Sleeper', 'Seater', 'Limousine'].map((value) => ({ value, label: value }))} />
        </Form.Item>

        <Form.Item label="Trạng thái" name="status" rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}>
          <Select placeholder="Chọn trạng thái" options={['Active', 'Maintenance', 'Inactive'].map((value) => ({ value, label: value }))} />
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Cập nhật
        </Button>
      </Form>
    </div>
  );
}

export default EditPage;
