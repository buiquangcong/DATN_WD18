import { Button, Form, Input, InputNumber, Select, Space } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useCRUD } from "../../../hooks/useCRUD";
import { useParams } from "react-router-dom";
import { useEffect } from "react";

function JourneyEditPage() {
  const { id } = useParams();
  const { Edit, list } = useCRUD("journey");
  const [form] = Form.useForm();

  useEffect(() => {
    const record = list?.find((item: any) => item._id === id);
    if (record) form.setFieldsValue(record);
  }, [list, id]);
 const onFinish = (values: any) => {
    Edit({
      _id: id,
      ...values,
    });
  };
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">Chỉnh Sửa Hành Trình</h1>
       <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >

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


        {/* Điểm Đón */}
        <div className="mb-4">
          <p className="font-medium mb-2">Điểm Đón</p>
          <p className="text-gray-500 text-sm mb-2">
            Số phút tính từ lúc xe khởi hành (VD: 0 = đón ngay tại bến xuất phát, 15 = đón sau 15 phút)
          </p>
          <Form.List name="diemDon">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} className="flex mb-2" align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, "offsetMinutes"]}
                      rules={[{ required: true, message: "Nhập số phút" }]}
                    >
                      <InputNumber
                        placeholder="Số phút"
                        min={0}
                        style={{ width: 130 }}
                        addonAfter="phút"
                      />
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
          <p className="text-gray-500 text-sm mb-2">
            Số phút tính trước khi xe đến bến cuối (VD: 0 = trả ngay tại bến cuối, 20 = trả trước khi đến 20 phút)
          </p>
          <Form.List name="diemTra">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} className="flex mb-2" align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, "offsetMinutes"]}
                      rules={[{ required: true, message: "Nhập số phút" }]}
                    >
                      <InputNumber
                        placeholder="Số phút"
                        min={0}
                        style={{ width: 130 }}
                        addonAfter="phút"
                      />
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

        <Form.Item label="Trạng Thái" name="trangThai" rules={[{ required: true }]}>
          <Select
            options={[
              { value: true, label: "Hoạt động" },
              { value: false, label: "Dừng hoạt động" },
            ]}
          />
        </Form.Item>

        <Button type="primary" htmlType="submit">Lưu Thay Đổi</Button>
      </Form>
    </div>
  );
}

export default JourneyEditPage;