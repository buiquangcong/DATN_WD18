import { Button, Form, InputNumber, Select, Card } from "antd";
import { useNavigate } from "react-router-dom";
import { useCRUD } from "../../../hooks/useCRUD";

function FareRuleAddPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // 1. Lấy danh sách tuyến đường
  const { list: journeys } = useCRUD("journey");

  // 2. Lấy danh sách bảng giá vé đã tồn tại trong DB
  const { list: fareRules, Add } = useCRUD("giave");

  // 3. Lắng nghe tuyến đường đang chọn trong Form
  const selectedJourney = Form.useWatch("journey", form);

  // 4. Lấy danh sách capacity ĐÃ ĐƯỢC CÀI GIÁ VÉ theo tuyến đường đang chọn
  const existingCapacities = (fareRules || [])
    .filter((rule: any) => {
      // Xử lý cả trường hợp journey là object (populate) hoặc string (_id)
      const journeyId =
        typeof rule.journey === "object" ? rule.journey?._id : rule.journey;
      return journeyId === selectedJourney;
    })
    .map((rule: any) => rule.capacity);

  // Danh sách các loại sức chứa cố định
  const capacityOptions = [
    { label: "16 chỗ", value: 16 },
    { label: "29 chỗ", value: 29 },
    { label: "34 chỗ", value: 34 },
    { label: "45 chỗ", value: 45 },
    { label: "7 chỗ", value: 7 },
    { label: "8 chỗ", value: 8 },
    { label: "9 chỗ", value: 9 },
  ];

  const onFinish = (values: any) => {
    Add(values);
  };

  const getJourneyStationText = (item: any): string => {
    if (!item) return "";
    const pickup = (item.diemDon || [])
      .map((d: any) => d?.diaDiem || d?.dia_diem)
      .filter(Boolean)
      .join(", ");
    const dropoff = (item.diemTra || [])
      .map((d: any) => d?.diaDiem || d?.dia_diem)
      .filter(Boolean)
      .join(", ");

    if (pickup && dropoff) return `${pickup} → ${dropoff}`;
    if (pickup) return `Đón: ${pickup}`;
    if (dropoff) return `Trả: ${dropoff}`;
    return "";
  };

  return (
    <div className="p-6">
      <Card>
        <h1 className="text-2xl font-semibold mb-6">Thêm giá vé</h1>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* Tuyến đường */}
          <Form.Item
            label="Tuyến đường"
            name="journey"
            rules={[
              {
                required: true,
                message: "Chọn tuyến đường",
              },
            ]}
          >
            <Select
              showSearch
              optionLabelProp="label"
              placeholder="Chọn tuyến"
              filterOption={(input, option) =>
                String(option?.label || "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={() => {
                // Reset lại ô sức chứa khi người dùng đổi tuyến đường khác
                form.setFieldsValue({ capacity: undefined });
              }}
            >
              {journeys?.map((item: any) => {
                const stationText = getJourneyStationText(item);
                return (
                  <Select.Option
                    key={item._id}
                    value={item._id}
                    label={`${item.diemDi} → ${item.diemDen}${stationText ? ` (${stationText})` : ""}`}
                  >
                    <div className="flex items-center gap-2 py-0.5 flex-wrap">
                      <span className="font-medium text-gray-800">
                        {item.diemDi} → {item.diemDen}
                      </span>
                      {stationText && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-normal">
                          ({stationText})
                        </span>
                      )}
                    </div>
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>

          {/* Sức chứa (Disable loại xe đã set giá cho tuyến này) */}
          <Form.Item
            label="Sức chứa"
            name="capacity"
            rules={[
              {
                required: true,
                message: "Chọn sức chứa",
              },
            ]}
          >
            <Select
              placeholder={
                selectedJourney
                  ? "Chọn sức chứa"
                  : "Vui lòng chọn tuyến đường trước"
              }
              disabled={!selectedJourney} // Chưa chọn tuyến thì khóa ô này
            >
              {capacityOptions.map((item) => {
                const isAlreadyConfigured = existingCapacities.includes(
                  item.value
                );
                return (
                  <Select.Option
                    key={item.value}
                    value={item.value}
                    disabled={isAlreadyConfigured} // Vô hiệu hóa nếu đã cài giá
                  >
                    {item.label} {isAlreadyConfigured ? "(Đã có giá vé)" : ""}
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>

          {/* Giá ngày thường */}
          <Form.Item
            label="Giá ngày thường"
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
          <Form.Item label="Giá cuối tuần" name="weekendPrice">
            <InputNumber
              className="w-full"
              min={0}
              placeholder="VD: 180000"
              addonAfter="VNĐ"
            />
          </Form.Item>

          {/* Giá ngày lễ */}
          <Form.Item label="Giá ngày lễ" name="holidayPrice">
            <InputNumber
              className="w-full"
              min={0}
              placeholder="VD: 200000"
              addonAfter="VNĐ"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit">
            Thêm
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default FareRuleAddPage;