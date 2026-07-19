import {Button,Form,Input,InputNumber,Select,Space,message,} from "antd";
import {MinusCircleOutlined,PlusOutlined,} from "@ant-design/icons";
import { useCRUD } from "../../../hooks/useCRUD";

function JourneyAddPage() {
  const { Add } = useCRUD("journey");
  const onFinish = (values: any) => {
    if (
      values.diemDi.trim().toLowerCase() ===
      values.diemDen.trim().toLowerCase()
    ) {
      message.error(
        "Điểm đi và điểm đến không được trùng nhau"
      );
      return;
    }
    Add(values);
  };
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">
        Thêm Hành Trình Mới
      </h1>
      <Form
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="Điểm Đi"
          name="diemDi"
          rules={[
            {
              required: true,
              message:
                "Vui lòng nhập điểm đi",
            },
            {
              min: 2,
              message:
                "Điểm đi tối thiểu 2 ký tự",
            },
            {
              max: 100,
              message:
                "Điểm đi tối đa 100 ký tự",
            },
          ]}
        >
          <Input placeholder="VD: Hà Nội" />
        </Form.Item>

        <Form.Item
          label="Điểm Đến"
          name="diemDen"
          rules={[
            {
              required: true,
              message:
                "Vui lòng nhập điểm đến",
            },
            {
              min: 2,
              message:
                "Điểm đến tối thiểu 2 ký tự",
            },
            {
              max: 100,
              message:
                "Điểm đến tối đa 100 ký tự",
            },
          ]}
        >
          <Input placeholder="VD: Hải Phòng" />
        </Form.Item>

        <Form.Item
          label="Quãng Đường (km)"
          name="quangDuong"
          rules={[
            {
              required: true,
              message:
                "Vui lòng nhập quãng đường",
            },
          ]}
        >
          <InputNumber
            className="w-full"
            min={1}
            max={3000}
            placeholder="VD: 120"
          />
        </Form.Item>

        <Form.Item
          label="Thời Gian Di Chuyển"
          name="thoiGianDiChuyen"
          rules={[
            {
              required: true,
              message:
                "Vui lòng nhập thời gian di chuyển",
            },
            {
              min: 3,
              message:
                "Thời gian di chuyển không hợp lệ",
            },
          ]}
        >
          <Input placeholder="VD: 2 giờ 40 phút" />
        </Form.Item>

        {/* Điểm Đón */}
        <div className="mb-4">
          <p className="font-medium mb-2">
            Điểm Đón
          </p>
          <p className="text-gray-500 text-sm mb-2">
            Số phút tính từ lúc xe khởi hành (VD: 0 = đón ngay tại bến xuất phát, 15 = đón sau 15 phút)
          </p>

          <Form.List name="diemDon">
            {(
              fields,
              { add, remove }
            ) => (
              <>
                {fields.map(
                  ({
                    key,
                    name,
                    ...restField
                  }) => (
                    <Space
                      key={key}
                      className="flex mb-2"
                      align="baseline"
                    >
                      <Form.Item
                        {...restField}
                        name={[
                          name,
                          "offsetMinutes",
                        ]}
                        rules={[
                          {
                            required: true,
                            message:
                              "Nhập số phút",
                          },
                        ]}
                      >
                        <InputNumber
                          placeholder="Số phút"
                          min={0}
                          style={{
                            width: 130,
                          }}
                          addonAfter="phút"
                        />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[
                          name,
                          "diaDiem",
                        ]}
                        rules={[
                          {
                            required: true,
                            message:
                              "Nhập địa điểm đón",
                          },
                          {
                            min: 3,
                            message:
                              "Địa điểm quá ngắn",
                          },
                        ]}
                      >
                        <Input
                          placeholder="Bến xe Mỹ Đình"
                          style={{
                            width: 340,
                          }}
                        />
                      </Form.Item>

                      <MinusCircleOutlined
                        onClick={() =>
                          remove(name)
                        }
                        className="text-red-500"
                      />
                    </Space>
                  )
                )}

                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={
                    <PlusOutlined />
                  }
                >
                  Thêm điểm đón
                </Button>
              </>
            )}
          </Form.List>
        </div>

        {/* Điểm Trả */}
        <div className="mb-4">
          <p className="font-medium mb-2">
            Điểm Trả
          </p>
          <p className="text-gray-500 text-sm mb-2">
            Số phút tính trước khi xe đến bến cuối (VD: 0 = trả ngay tại bến cuối, 20 = trả trước khi đến 20 phút)
          </p>

          <Form.List name="diemTra">
            {(
              fields,
              { add, remove }
            ) => (
              <>
                {fields.map(
                  ({
                    key,
                    name,
                    ...restField
                  }) => (
                    <Space
                      key={key}
                      className="flex mb-2"
                      align="baseline"
                    >
                      <Form.Item
                        {...restField}
                        name={[
                          name,
                          "offsetMinutes",
                        ]}
                        rules={[
                          {
                            required: true,
                            message:
                              "Nhập số phút",
                          },
                        ]}
                      >
                        <InputNumber
                          placeholder="Số phút"
                          min={0}
                          style={{
                            width: 130,
                          }}
                          addonAfter="phút"
                        />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[
                          name,
                          "diaDiem",
                        ]}
                        rules={[
                          {
                            required: true,
                            message:
                              "Nhập địa điểm trả",
                          },
                          {
                            min: 3,
                            message:
                              "Địa điểm quá ngắn",
                          },
                        ]}
                      >
                        <Input
                          placeholder="Bến xe Thượng Lý"
                          style={{
                            width: 340,
                          }}
                        />
                      </Form.Item>

                      <MinusCircleOutlined
                        onClick={() =>
                          remove(name)
                        }
                        className="text-red-500"
                      />
                    </Space>
                  )
                )}

                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={
                    <PlusOutlined />
                  }
                >
                  Thêm điểm trả
                </Button>
              </>
            )}
          </Form.List>
        </div>

        <Form.Item
          label="Trạng Thái"
          name="trangThai"
          initialValue={true}
          rules={[
            {
              required: true,
              message:
                "Vui lòng chọn trạng thái",
            },
          ]}
        >
          <Select
            options={[
              {
                value: true,
                label:
                  "Hoạt động",
              },
              {
                value: false,
                label:
                  "Dừng hoạt động",
              },
            ]}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
        >
          Thêm Hành Trình
        </Button>
      </Form>
    </div>
  );
}

export default JourneyAddPage;