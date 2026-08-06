import { Button, Form, InputNumber, Select, Card } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useParams } from "react-router-dom";
import { useEffect } from "react";

function FareRuleEditPage() {
  const { id } = useParams();
  const [form] = Form.useForm();

  // 1. Lấy danh sách bảng giá vé và danh sách tuyến đường
  const { Edit, list: fareRules } = useCRUD("giave");
  const { list: journeys } = useCRUD("journey");

  // 2. Tìm bản ghi hiện tại đang chỉnh sửa
  const currentRecord = fareRules?.find((item: any) => item._id === id);

  // 3. Fill dữ liệu ban đầu vào Form khi tải trang
  useEffect(() => {
    if (currentRecord) {
      form.setFieldsValue({
        journey: currentRecord.journey?._id || currentRecord.journey,
        capacity: currentRecord.capacity,
        weekdayPrice: currentRecord.weekdayPrice,
        weekendPrice: currentRecord.weekendPrice,
        holidayPrice: currentRecord.holidayPrice,
      });
    }
  }, [currentRecord, form]);

  // Danh sách các loại sức chứa cố định (chỉ dùng để hiển thị đúng label,
  // vì ô này giờ đã khóa không cho sửa)
  const capacityOptions = [
    { label: "16 chỗ", value: 16 },
    { label: "29 chỗ", value: 29 },
    { label: "38 chỗ", value: 38 },
    { label: "45 chỗ", value: 45 },
  ];

  const onFinish = (values: any) => {
    Edit({
      _id: id,
      ...values,
    });
  };

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <h1 className="text-2xl font-semibold mb-6">Chỉnh Sửa Giá Vé</h1>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* Tuyến đường - khóa không cho sửa, vì đây là 1 phần khóa định danh
              bảng giá (journey + capacity), sửa sẽ làm sai lệch các chuyến cũ
              đang tham chiếu đúng combo này */}
          <Form.Item
            label="Tuyến Đường"
            name="journey"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn tuyến đường",
              },
            ]}
              // extra="Không thể đổi tuyến đường của bảng giá đã tồn tại. Nếu cần áp dụng cho tuyến khác, hãy tạo bảng giá mới."
          >
            <Select disabled placeholder="Chọn tuyến">
              {journeys?.map((item: any) => (
                <Select.Option key={item._id} value={item._id}>
                  {item.diemDi} → {item.diemDen}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Sức chứa - khóa không cho sửa, cùng lý do như trên */}
          <Form.Item
            label="Sức Chứa"
            name="capacity"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn sức chứa",
              },
            ]}
            // extra="Không thể đổi sức chứa của bảng giá đã tồn tại. Nếu cần áp dụng cho loại xe khác, hãy tạo bảng giá mới."
          >
            <Select disabled placeholder="Chọn sức chứa">
              {capacityOptions.map((item) => (
                <Select.Option key={item.value} value={item.value}>
                  {item.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Giá ngày thường */}
          <Form.Item
            label="Giá Ngày Thường"
            name="weekdayPrice"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập giá ngày thường",
              },
            ]}
          >
            <InputNumber
              className="w-full"
              min={0}
              placeholder="VD: 150000"
              addonAfter="VNĐ"
            />
          </Form.Item>

          {/* Giá cuối tuần */}
          <Form.Item label="Giá Cuối Tuần" name="weekendPrice">
            <InputNumber
              className="w-full"
              min={0}
              placeholder="VD: 180000"
              addonAfter="VNĐ"
            />
          </Form.Item>

          {/* Giá ngày lễ */}
          <Form.Item label="Giá Ngày Lễ" name="holidayPrice">
            <InputNumber
              className="w-full"
              min={0}
              placeholder="VD: 200000"
              addonAfter="VNĐ"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit">
            Lưu Thay Đổi
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default FareRuleEditPage;