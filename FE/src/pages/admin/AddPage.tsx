import { Button, Form, Input, Select } from "antd";
import { useCRUD } from "../../hooks/useCRUD";

function AddPage() {
  const {Add} = useCRUD()
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Thêm mới</h1>

      <Form layout="vertical" onFinish={Add} className="space-y-6">
        {/* Text input */}
        <Form.Item label="ho va ten" name="fullName" rules={[{required: true, min:5, type: "string"}]}>
          <Input placeholder="input" />
        </Form.Item>
        <Form.Item label="tuoi"  name="age" rules={[{required: true, min:0}]}>
          <Input placeholder="input" />
        </Form.Item>
        <Form.Item label="dia chi" name="address" rules={[{required: true, type: 'string'}]}>
          <Input placeholder="input" />
        </Form.Item>
        <Form.Item label="email" name="email" rules={[{required: true, type: "email"}]}>
          <Input placeholder="input" />
        </Form.Item>
    
        <Form.Item label="Input" name="active">
          <Input placeholder="input" />
        </Form.Item>

        {/* Select */}
        <Form.Item label="Danh mục" name="active">
          <Select placeholder="Chọn danh mục" options={[
            {value: "active"},
            {value:"disable"}
          ]} />
        </Form.Item>

        {/* Submit button */}
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form>
    </div>
  );
}

export default AddPage;
