import { Button, Form, InputNumber, Select, Card } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";

function FareRuleEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // 1. Lấy danh sách bảng giá vé và danh sách tuyến đường
  const { Edit, list: fareRules } = useCRUD("giave");
  const { list: journeys } = useCRUD("journey");

  // 2. Lắng nghe Tuyến đường đang được chọn trong Form
  const selectedJourney = Form.useWatch("journey", form);

  // 3. Tìm bản ghi hiện tại đang chỉnh sửa
  const currentRecord = fareRules?.find((item: any) => item._id === id);

  // 4. Fill dữ liệu ban đầu vào Form khi tải trang
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

  // 5. Lấy danh sách capacity ĐÃ CÓ GIÁ VÉ ở các bản ghi KHÁC (loại trừ ID hiện tại)
  const existingCapacitiesOfOtherRecords = (fareRules || [])
    .filter((rule: any) => {
      const isNotCurrentRecord = rule._id !== id; // Loại trừ chính bản ghi đang edit
      const journeyId =
        typeof rule.journey === "object" ? rule.journey?._id : rule.journey;
      return isNotCurrentRecord && journeyId === selectedJourney;
    })
    .map((rule: any) => rule.capacity);

  // Danh sách các loại sức chứa cố định
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
    navigate("/admin/fare-rule");
  };

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <h1 className="text-2xl font-semibold mb-6">Chỉnh Sửa Giá Vé</h1>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* Tuyến đường */}
          <Form.Item
            label="Tuyến Đường"
            name="journey"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn tuyến đường",
              },
            ]}
          >
            <Select
              placeholder="Chọn tuyến"
              onChange={() => {
                // Đổi tuyến đường thì reset lựa chọn sức chứa
                form.setFieldsValue({ capacity: undefined });
              }}
            >
              {journeys?.map((item: any) => (
                <Select.Option key={item._id} value={item._id}>
                  {item.diemDi} → {item.diemDen}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Sức chứa (Chuyển sang Select & Disable sức chứa bị trùng từ bản ghi khác) */}
          <Form.Item
            label="Sức Chứa"
            name="capacity"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn sức chứa",
              },
            ]}
          >
            <Select
              placeholder={
                selectedJourney
                  ? "Chọn sức chứa"
                  : "Vui lòng chọn tuyến đường trước"
              }
              disabled={!selectedJourney}
            >
              {capacityOptions.map((item) => {
                const isAlreadySet = existingCapacitiesOfOtherRecords.includes(
                  item.value
                );
                return (
                  <Select.Option
                    key={item.value}
                    value={item.value}
                    disabled={isAlreadySet} // Disable nếu bị trùng với bản ghi khác
                  >
                    {item.label} {isAlreadySet ? "(Đã có giá vé)" : ""}
                  </Select.Option>
                );
              })}
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