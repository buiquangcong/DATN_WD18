import { Button, Form, Input, InputNumber, Select, Space } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useCRUD } from "../../../hooks/useCRUD";

function JourneyAddPage() {
  const { Add } = useCRUD("journey");

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">Thêm Hành Trình Mới</h1>
      <Form layout="vertical" onFinish={(values) => Add(values)}>

        <Form.Item label="Điểm Đi" name="diemDi" rules={[{ required: true, message: "Vui lòng nhập điểm đi" }]}>
          <Input placeholder="VD: Hà Nội" />
        </Form.Item>

        <Form.Item label="Điểm Đến" name="diemDen" rules={[{ required: true, message: "Vui lòng nhập điểm đến" }]}>
          <Input placeholder="VD: Hải Phòng" />
        </Form.Item>

        <Form.Item label="Quãng Đường (km)" name="quangDuong" rules={[{ required: true, message: "Vui lòng nhập quãng đường" }]}>
          <InputNumber className="w-full" min={1} placeholder="VD: 120" />
        </Form.Item>

        <Form.Item label="Thời Gian Di Chuyển" name="thoiGianDiChuyen" rules={[{ required: true, message: "Vui lòng nhập thời gian di chuyển" }]}>
          <Input placeholder="VD: 2 giờ 40 phút" />
        </Form.Item>

        <Form.Item label="Giá Vé" name="price" rules={[{ required: true, message: "Vui lòng nhập giá vé" }]}>
          <InputNumber className="w-full" min={0} placeholder="VD: 100000" />
        </Form.Item>

        {/* Điểm Đón */}
        <div className="mb-4">
          <p className="font-medium mb-2">Điểm Đón</p>
          <Form.List name="diemDon">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} className="flex mb-2" align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, "thoiGian"]}
                      rules={[{ required: true, message: "Nhập giờ" }]}
                    >
                      <Input placeholder="Giờ (VD: 14:00)" style={{ width: 130 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "diaDiem"]}
                      rules={[{ required: true, message: "Nhập địa điểm" }]}
                    >
                      <Input placeholder="Địa điểm đón" style={{ width: 340 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} className="text-red-500" />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                  Thêm điểm đón
                </Button>
              </>
            )}
          </Form.List>
        </div>

        {/* Điểm Trả */}
        <div className="mb-4">
          <p className="font-medium mb-2">Điểm Trả</p>
          <Form.List name="diemTra">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} className="flex mb-2" align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, "thoiGian"]}
                      rules={[{ required: true, message: "Nhập giờ" }]}
                    >
                      <Input placeholder="Giờ (VD: 16:00)" style={{ width: 130 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "diaDiem"]}
                      rules={[{ required: true, message: "Nhập địa điểm" }]}
                    >
                      <Input placeholder="Địa điểm trả" style={{ width: 340 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} className="text-red-500" />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                  Thêm điểm trả
                </Button>
              </>
            )}
          </Form.List>
        </div>

        <Form.Item label="Trạng Thái" name="trangThai" initialValue={true} rules={[{ required: true }]}>
          <Select
            options={[
              { value: true, label: "Hoạt động" },
              { value: false, label: "Dừng hoạt động" },
            ]}
          />
        </Form.Item>

        <Button type="primary" htmlType="submit">Thêm Hành Trình</Button>
      </Form>
    </div>
  );
}

export default JourneyAddPage;