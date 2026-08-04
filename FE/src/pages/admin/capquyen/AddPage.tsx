import { Button, Form, Input, Select, } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
function UserAddPage() {
  const [form] = Form.useForm();
  const { Add } = useCRUD("tk");
  const onFinish = (values: any) => { Add(values); };
  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold mb-6">
        Thêm tài khoản
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
            },
            {
              type: "email",
              message: "Email không đúng định dạng"
            }

          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Ảnh đại diện"
          name="avatar"
          rules={[
            {
              type: "url",
              message: "Vui lòng nhập đúng link ảnh",
            },
          ]}
        >
          <Input placeholder="https://example.com/avatar.jpg" />
        </Form.Item>
        <Form.Item
          label="Mật khẩu"
          name="password"

          rules={[
            {
              required: true,
              message: "Nhập mật khẩu"
            }
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="Vai trò"
          name="role"
          initialValue="user"
        >
          <Select
            options={[
              {
                label: "User",
                value: "user"
              },
              {
                label: "driver",
                value: "driver"
              },
              {
                label: "staff",
                value: "staff"
              },
              {
                label: "Admin",
                value: "admin"
              }
            ]}
          />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
        >
          Thêm tài khoản
        </Button>
      </Form>
    </div>
  );
}
export default UserAddPage;