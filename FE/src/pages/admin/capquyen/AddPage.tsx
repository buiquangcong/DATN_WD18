import { Button, Form, Input, Select, Card } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";

function UserAddPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { Add, isLoading } = useCRUD("tk");

  const onFinish = async (values: any) => {
    // values trả về: { username, email, avatar, password, role, status }
    await Add(values);
  };

  return (
    <div className="p-6 max-w-2xl">
      <Card className="shadow-xs border border-gray-100 rounded-xl bg-white">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Thêm tài khoản mới</h1>
          <p className="text-sm text-gray-500">
            Tạo tài khoản người dùng, thiết lập trạng thái và phân quyền tương ứng trên hệ thống.
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ role: "user", status: true }}
        >
          <Form.Item
            label="Tên tài khoản"
            name="username"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tên tài khoản",
              },
              {
                whitespace: true,
                message: "Tên tài khoản không được để trống",
              },
            ]}
          >
            <Input placeholder="Ví dụ: nguyenvanan" size="large" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập email",
              },
              {
                type: "email",
                message: "Email không đúng định dạng",
              },
            ]}
          >
            <Input placeholder="user@gmail.com" size="large" />
          </Form.Item>

          <Form.Item
            label="Ảnh đại diện (URL)"
            name="avatar"
            rules={[
              {
                type: "url",
                message: "Vui lòng nhập đúng đường dẫn link ảnh",
              },
            ]}
          >
            <Input placeholder="https://example.com/avatar.jpg" size="large" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập mật khẩu",
              },
              {
                min: 6,
                message: "Mật khẩu phải chứa ít nhất 6 ký tự",
              },
            ]}
          >
            <Input.Password placeholder="Tối thiểu 6 ký tự" size="large" />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="role"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn vai trò",
              },
            ]}
          >
            <Select
              size="large"
              options={[
                {
                  label: "Khách hàng (User)",
                  value: "user",
                },
                {
                  label: "Quản trị viên (Admin)",
                  value: "admin",
                },
                {
                  label: "Nhân viên (Staff)",
                  value: "staff",
                },
                {
                  label: "Tài xế (Driver)",
                  value: "driver",
                },
                {
                  label: "Phụ xe (Assistant Driver)",
                  value: "assistant_driver",
                },
              ]}
            />
          </Form.Item>

          {/* TRƯỜNG CHỌN TRẠNG THÁI TÀI KHOẢN (CHỮ BÌNH THƯỜNG) */}
          <Form.Item
            label="Trạng thái tài khoản"
            name="status"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn trạng thái",
              },
            ]}
          >
            <Select
              size="large"
              options={[
                {
                  value: true,
                  label: "Hoạt động",
                },
                {
                  value: false,
                  label: "Không hoạt động",
                },
              ]}
            />
          </Form.Item>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Thêm tài khoản
            </Button>
            <Button
              size="large"
              onClick={() => navigate("/admin/tk/list")}
            >
              Hủy
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default UserAddPage;