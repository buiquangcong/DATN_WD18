import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Spin,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useCRUD, useDetail } from "../../../hooks/useCRUD";

const months = Array.from({ length: 12 }, (_, i) => ({
  label: `Tháng ${i + 1}`,
  value: i + 1,
}));

// Số ngày tối đa của 1 tháng, dùng năm thường (2025, không nhuận) làm mốc
// để Tháng 2 luôn giới hạn 28 ngày, tránh nhầm lẫn với ngày 29/2 hiếm gặp
const getDaysInMonth = (month: number | null) => {
  if (!month) return 31;
  return new Date(2025, month, 0).getDate();
};

function HolidayEditPage() {
  const { id } = useParams();
  const [form] = Form.useForm();

  const { Edit } = useCRUD("holiday");
  const { data, isLoading } = useDetail("holiday", id);

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const days = useMemo(() => {
    const maxDay = getDaysInMonth(selectedMonth);

    return Array.from({ length: maxDay }, (_, i) => ({
      label: `Ngày ${i + 1}`,
      value: i + 1,
    }));
  }, [selectedMonth]);

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        name: data.name,
        description: data.description,
        status: data.status,
        day: data.day,
        month: data.month,
      });

      // Đồng bộ selectedMonth theo dữ liệu đã có, để dropdown Ngày giới hạn
      // đúng ngay từ lúc mở trang, không phải đợi người dùng đổi Tháng
      setSelectedMonth(data.month);
    }
  }, [data, form]);

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);

    // Nếu ngày đang chọn không còn hợp lệ với tháng mới (VD đang chọn 30,
    // đổi sang Tháng 2 chỉ có 28 ngày) thì reset lại để tránh gửi dữ liệu sai
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
    Edit({
      _id: id,
      ...values,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <h1 className="text-2xl font-semibold mb-6">Sửa ngày lễ</h1>

        <Form layout="vertical" form={form} onFinish={onFinish}>
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

          <Form.Item label="Trạng thái" name="status">
            <Select
              options={[
                { label: "Hoạt động", value: true },
                { label: "Ẩn", value: false },
              ]}
            />
          </Form.Item>

          <Button htmlType="submit" type="primary">
            Cập nhật
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default HolidayEditPage;