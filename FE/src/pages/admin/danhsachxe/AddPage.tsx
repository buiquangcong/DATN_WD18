import { Button, Form, Input, Select, message } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";

// Khai báo tập trung danh sách số chỗ tương ứng với từng loại xe
const CAPACITY_OPTIONS_MAP: Record<string, number[]> = {
  Sleeper: [34],
  Seater: [7, 8, 9, 16, 29, 45],
  Limousine: [7, 8, 9, 11, 19],
};

function AddPage() {
  const { list, Add } = useCRUD("bus");
  const [form] = Form.useForm();

  // Lắng nghe giá trị 'type' từ Form
  const selectedType = Form.useWatch("type", form);

  // Xử lý tự động gán/reset giá trị sức chứa khi loại xe thay đổi
  const handleValuesChange = (changedValues: any) => {
    if (changedValues.type) {
      if (changedValues.type === "Sleeper") {
        form.setFieldsValue({ capacity: 34 });
      } else if (changedValues.type === "Seater") {
        form.setFieldsValue({ capacity: 16 });
      } else if (changedValues.type === "Limousine") {
        form.setFieldsValue({ capacity: 9 });
      }
    }
  };

  // Lấy danh sách tùy chọn chỗ ngồi dựa theo loại xe được chọn
  const capacityOptions = selectedType
    ? CAPACITY_OPTIONS_MAP[selectedType] || []
    : [16, 29, 34, 45];

  // Xử lý submit đảm bảo dữ liệu sạch trước khi gửi API
  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        name: values.name?.trim(),
        licensePlates: values.licensePlates?.trim().toUpperCase(),
        hangxe: values.hangxe?.trim() || "",
        capacity: Number(values.capacity),
      };

      await Add(payload);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Thêm xe thất bại, vui lòng kiểm tra lại!"
      );
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Thêm mới xe</h1>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
        className="space-y-6"
      >
        {/* Tên xe / Nhà xe */}
        <Form.Item
          label="Tên xe / Nhà xe"
          name="name"
          rules={[
            { required: true, message: "Vui lòng nhập tên xe" },
            { whitespace: true, message: "Tên xe không được chỉ chứa khoảng trắng" },
            { min: 6, message: "Tên xe phải có ít nhất 6 ký tự" },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();

                const cleanValue = value.trim().toLowerCase();

                // Kiểm tra trùng tên trong danh sách xe hiện có
                const isDuplicate = list?.some(
                  (bus: any) => bus.name?.trim().toLowerCase() === cleanValue
                );

                if (isDuplicate) {
                  return Promise.reject(
                    new Error("Tên xe này đã tồn tại trong hệ thống!")
                  );
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder="Nhập tên xe hoặc nhà xe" />
        </Form.Item>

        {/* Hãng xe */}
        <Form.Item label="Hãng xe" name="hangxe">
          <Input placeholder="Nhập hãng sản xuất (VD: Thaco, Hyundai, Samco, Ford...)" />
        </Form.Item>

        {/* Biển số xe dịch vụ */}
        <Form.Item
          label="Biển số xe dịch vụ (Nền vàng)"
          name="licensePlates"
          rules={[
            { required: true, message: "Vui lòng nhập biển số xe" },
            { whitespace: true, message: "Biển số xe không được chỉ chứa khoảng trắng" },
            {
              // Định dạng chuẩn: Mã tỉnh (2 số) + Chữ cái seri + Dãy số (VD: 29B-123.45 hoặc 51E-12345)
              pattern: /^[0-9]{2}[A-Z]{1,2}-[0-9]{3,5}(\.[0-9]{2})?$/i,
              message: "Định dạng không hợp lệ! Ví dụ đúng: 29B-123.45 hoặc 51E-12345",
            },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const cleanValue = value.trim().toUpperCase();

                // 1. Chặn toàn bộ biển số mã 80 (Cơ quan Trung ương / Bộ Công an)
                if (cleanValue.startsWith("80")) {
                  return Promise.reject(
                    new Error("Không được nhập biển số mã 80 (Cơ quan Trung ương / Bộ Công an)!")
                  );
                }

                // 2. Chặn các mã tỉnh không tồn tại tại Việt Nam
                const invalidProvinces = ["00", "10", "13", "42", "44", "45", "46", "87", "96"];
                const provinceCode = cleanValue.substring(0, 2);
                if (invalidProvinces.includes(provinceCode)) {
                  return Promise.reject(
                    new Error(`Mã tỉnh/thành phố (${provinceCode}) không tồn tại tại Việt Nam!`)
                  );
                }

                // 3. Chặn các ký hiệu xe Ngoại giao, Quốc tế, Công an chuyên dùng
                const forbiddenCodes = ["NG", "QT", "CV", "NN", "CD"];
                const hasForbiddenCode = forbiddenCodes.some((code) => cleanValue.includes(code));
                if (hasForbiddenCode) {
                  return Promise.reject(
                    new Error("Không được nhập biển Ngoại giao (NG), Quốc tế (QT), Công vụ (CV, NN) hoặc Công an chuyên dùng (CD)!")
                  );
                }

                // 4. Chặn seri 'A' (Cấp cho xe con cá nhân / Cơ quan nhà nước)
                const privateOrGovPattern = /^[0-9]{2}[A]{1}-[0-9]{3,5}(\.[0-9]{2})?$/;
                if (privateOrGovPattern.test(cleanValue)) {
                  return Promise.reject(
                    new Error("Seri 'A' dành cho xe con cá nhân / cơ quan nhà nước, không phải xe dịch vụ!")
                  );
                }

                // 5. Chặn biển Quân đội (Viết tắt 2 chữ cái đầu như TM-1234, QP-5678, TH-1234...)
                const militaryPattern = /^[A-Z]{2}-[0-9]{3,5}$/;
                if (militaryPattern.test(cleanValue)) {
                  return Promise.reject(
                    new Error("Không được nhập biển số thuộc lực lượng Quân đội!")
                  );
                }

                // 6. Kiểm tra trùng lặp trong hệ thống
                const isDuplicate = list?.some(
                  (bus: any) => bus.licensePlates?.trim().toUpperCase() === cleanValue
                );
                if (isDuplicate) {
                  return Promise.reject(
                    new Error("Biển số xe này đã tồn tại trong hệ thống!")
                  );
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            placeholder="Nhập biển số xe (VD: 29B-123.45)"
            onChange={(e) => {
              // Tự động chuyển toàn bộ ký tự sang HOA khi gõ
              const upperValue = e.target.value.toUpperCase();
              form.setFieldsValue({ licensePlates: upperValue });
            }}
          />
        </Form.Item>

        {/* Loại xe */}
        <Form.Item
          label="Loại xe"
          name="type"
          rules={[{ required: true, message: "Vui lòng chọn loại xe" }]}
        >
          <Select
            placeholder="Chọn loại xe"
            options={[
              { value: "Sleeper", label: "Xe giường nằm (Sleeper)" },
              { value: "Seater", label: "Xe ghế ngồi (Seater)" },
              { value: "Limousine", label: "Xe Limousine VIP (7 - 9 chỗ)" },
            ]}
          />
        </Form.Item>

        {/* Sức chứa */}
        <Form.Item
          label="Sức chứa"
          name="capacity"
          rules={[{ required: true, message: "Vui lòng chọn sức chứa" }]}
        >
          <Select
            placeholder="Chọn sức chứa"
            disabled={selectedType === "Sleeper"}
            options={capacityOptions.map((cap) => ({
              value: cap,
              label:
                cap === 7
                  ? "7 chỗ (VIP Limousine)"
                  : cap === 8
                  ? "8 chỗ (VIP Limousine)"
                  : cap === 9
                  ? "9 chỗ (VIP DCar)"
                  : `${cap} chỗ`,
            }))}
          />
        </Form.Item>

        {/* Trạng thái */}
        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
        >
          <Select
            placeholder="Chọn trạng thái"
            options={[
              { value: "hoạt động", label: "Hoạt động" },
              { value: "bảo trì", label: "Bảo trì" },
              { value: "ngừng hoạt động", label: "Ngừng hoạt động" },
            ]}
          />
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Thêm xe
        </Button>
      </Form>
    </div>
  );
}

export default AddPage;