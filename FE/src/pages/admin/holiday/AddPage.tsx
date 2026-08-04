import {Button,Card,Form,Input,Select,message,} from "antd";
import { useMemo, useState } from "react";
import { useCRUD } from "../../../hooks/useCRUD";

const months = Array.from({ length: 12 }, (_, i) => ({
  label: `Tháng ${i + 1}`,
  value: i + 1,
}));

const getDaysInMonth = (month: number | null) => {
  if (!month) return 31;
  return new Date(2025, month, 0).getDate();
};

function HolidayAddPage() {
  const { Add } = useCRUD("holiday");
  const [form] = Form.useForm();

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const days = useMemo(() => {
    const maxDay = getDaysInMonth(selectedMonth);

    return Array.from({ length: maxDay }, (_, i) => ({
      label: `Ngày ${i + 1}`,
      value: i + 1,
    }));
  }, [selectedMonth]);

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);

    // Nếu ngày đang chọn không còn hợp lệ với tháng mới (VD đang chọn 30,
    // đổi sang Tháng 2 chỉ có 29 ngày) thì reset lại để tránh gửi dữ liệu sai
    const currentDay = form.getFieldValue("day");
    const maxDay = getDaysInMonth(month);

    if (currentDay && currentDay > maxDay) {
      form.setFieldValue("day", undefined);
      message.warning(
        `Tháng ${month} chỉ có ${maxDay} ngày, vui lòng chọn lại Ngày`
      );
    }
  };

  const onFinish = (values: any) => {
    Add(values);
  };

  return (
    <div className="p-6">
      <Card>
        <h1 className="text-2xl font-semibold mb-6">Thêm ngày lễ</h1>

        <Form form={form} layout="vertical" onFinish={onFinish}>
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
              <Select
                options={months}
                placeholder="Chọn tháng"
                onChange={handleMonthChange}
              />
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