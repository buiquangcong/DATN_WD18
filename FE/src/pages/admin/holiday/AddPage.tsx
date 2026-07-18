import {
  Button,
  Card,
  Form,
  Input,
  Select,
  message,
} from "antd";
import { useCRUD } from "../../../hooks/useCRUD";

const days = Array.from({ length: 31 }, (_, i) => ({
  label: `Ngày ${i + 1}`,
  value: i + 1,
}));

const months = Array.from({ length: 12 }, (_, i) => ({
  label: `Tháng ${i + 1}`,
  value: i + 1,
}));

function HolidayAddPage() {
  const { Add } = useCRUD("holiday");

  const onFinish = (values: any) => {
    Add(values);
  };

  return (
    <div className="p-6">
      <Card>
        <h1 className="text-2xl font-semibold mb-6">Thêm ngày lễ</h1>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Tên ngày lễ"
            name="name"
            rules={[{ required: true, message: "Nhập tên ngày lễ" }]}
          >
            <Input />
          </Form.Item>

          <div className="flex gap-4">
            <Form.Item
              label="Ngày"
              name="day"
              className="flex-1"
              rules={[{ required: true, message: "Chọn ngày" }]}
            >
              <Select options={days} placeholder="Chọn ngày" />
            </Form.Item>

            <Form.Item
              label="Tháng"
              name="month"
              className="flex-1"
              rules={[{ required: true, message: "Chọn tháng" }]}
            >
              <Select options={months} placeholder="Chọn tháng" />
            </Form.Item>
          </div>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item label="Trạng thái" name="status" initialValue={true}>
            <Select
              options={[
                { label: "Hoạt động", value: true },
                { label: "Ẩn", value: false },
              ]}
            />
          </Form.Item>

          <Button htmlType="submit" type="primary">
            Thêm
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default HolidayAddPage;