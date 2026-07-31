import React, { useEffect, useState } from "react";
import { Button, Form, Input, InputNumber, Select, Space, message, Spin } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useCRUD } from "../../../hooks/useCRUD";


const NORTHERN_PROVINCES_COORDS: Record<string, { lat: number; lng: number }> = {
  "Thành phố Hà Nội": { lat: 21.0285, lng: 105.8542 },
  "Thành phố Hải Phòng": { lat: 20.8651, lng: 106.6838 },
  "Tỉnh Vĩnh Phúc": { lat: 21.3088, lng: 105.6049 },
  "Tỉnh Bắc Ninh": { lat: 21.1860, lng: 106.0763 },
  "Tỉnh Hải Dương": { lat: 20.9364, lng: 106.3164 },
  "Tỉnh Hưng Yên": { lat: 20.6463, lng: 106.0511 },
  "Tỉnh Hà Nam": { lat: 20.5452, lng: 105.9123 },
  "Tỉnh Nam Định": { lat: 20.4388, lng: 106.1782 },
  "Tỉnh Ninh Bình": { lat: 20.2506, lng: 105.9745 },
  "Tỉnh Thái Bình": { lat: 20.4464, lng: 106.3365 },
  "Tỉnh Phú Thọ": { lat: 21.3227, lng: 105.2280 },
  "Tỉnh Thái Nguyên": { lat: 21.5928, lng: 105.8442 },
  "Tỉnh Bắc Giang": { lat: 21.2731, lng: 106.1946 },
  "Tỉnh Quảng Ninh": { lat: 21.0069, lng: 107.2925 },
  "Tỉnh Lạng Sơn": { lat: 21.8537, lng: 106.7610 },
  "Tỉnh Cao Bằng": { lat: 22.6657, lng: 106.2579 },
  "Tỉnh Bắc Kạn": { lat: 22.1472, lng: 105.8348 },
  "Tỉnh Tuyên Quang": { lat: 21.8236, lng: 105.2181 },
  "Tỉnh Hà Giang": { lat: 22.8233, lng: 104.9839 },
  "Tỉnh Hòa Bình": { lat: 20.8153, lng: 105.3382 },
  "Tỉnh Sơn La": { lat: 21.3257, lng: 103.9188 },
  "Tỉnh Điện Biên": { lat: 21.3860, lng: 103.0230 },
  "Tỉnh Lai Châu": { lat: 22.3963, lng: 103.4580 },
  "Tỉnh Lào Cai": { lat: 22.4809, lng: 103.9754 },
  "Tỉnh Yên Bái": { lat: 21.7168, lng: 104.8986 },
};

const NORTHERN_PROVINCES = Object.keys(NORTHERN_PROVINCES_COORDS);

function JourneyAddPage() {
  const [form] = Form.useForm();

  const { list: journeys, Add } = useCRUD("journey");
  const [loadingRoute, setLoadingRoute] = useState(false);


  const diemDi = Form.useWatch("diemDi", form);
  const diemDen = Form.useWatch("diemDen", form);


  const existingDestinations =
    journeys
      ?.filter((j: any) => j.diemDi === diemDi)
      .map((j: any) => j.diemDen) || [];

  // 2. Tạo danh sách Options cho ô Điểm Đến (Tự động disable nếu trùng điểm hoặc đã có chuyến)
  const destinationOptions = NORTHERN_PROVINCES.map((p) => {
    const isSelectedAsStart = p === diemDi;
    const isAlreadyExists = existingDestinations.includes(p);

    return {
      label: isAlreadyExists ? `${p} (Đã có chuyến)` : p,
      value: p,
      disabled: isSelectedAsStart || isAlreadyExists,
    };
  });

  // Tự động xoá điểm đến hiện tại nếu nó vô tình bị trúng vào điểm bị disable
  useEffect(() => {
    if (diemDen && (diemDen === diemDi || existingDestinations.includes(diemDen))) {
      form.setFieldsValue({
        diemDen: undefined,
        quangDuong: undefined,
        thoiGianDiChuyen: "",
      });
    }
  }, [diemDi]);

  // 3. Tự động tính toán khoảng cách & thời gian di chuyển
  useEffect(() => {
    if (!diemDi || !diemDen) return;

    if (diemDi.trim().toLowerCase() === diemDen.trim().toLowerCase()) {
      message.error("Điểm đi và điểm đến không được trùng nhau");
      form.setFieldsValue({ quangDuong: undefined, thoiGianDiChuyen: "" });
      return;
    }

    const startCoords = NORTHERN_PROVINCES_COORDS[diemDi];
    const endCoords = NORTHERN_PROVINCES_COORDS[diemDen];

    if (!startCoords || !endCoords) return;

    setLoadingRoute(true);

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}?overview=false`;

    fetch(osrmUrl)
      .then((res) => res.json())
      .then((data) => {
        setLoadingRoute(false);
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];

          const distanceKm = Math.round(route.distance / 1000);
          const totalMinutes = Math.round(route.duration / 60);
          const hours = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          let durationText = hours > 0 ? `${hours} giờ ${mins} phút` : `${mins} phút`;

          form.setFieldsValue({
            quangDuong: distanceKm,
            thoiGianDiChuyen: durationText,
          });

          message.success("Đã tự động tính toán quãng đường & thời gian!");
        } else {
          message.error("Không thể lấy lộ trình tuyến đường.");
        }
      })
      .catch((err) => {
        setLoadingRoute(false);
        console.error("Lỗi khi kết nối OSRM API:", err);
        message.error("Lỗi khi tính toán lộ trình đường đi.");
      });
  }, [diemDi, diemDen, form]);

  const onFinish = (values: any) => {
    if (values.diemDi.trim().toLowerCase() === values.diemDen.trim().toLowerCase()) {
      message.error("Điểm đi và điểm đến không được trùng nhau");
      return;
    }

    // Kiểm tra chặn lại ở nút submit
    if (existingDestinations.includes(values.diemDen)) {
      message.error(`Hành trình ${values.diemDi} - ${values.diemDen} đã tồn tại!`);
      return;
    }

    Add(values);
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">Thêm Hành Trình Mới</h1>

      <Spin spinning={loadingRoute} tip="Đang tính toán tuyến đường...">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div className="grid grid-cols-2 gap-4">
            {/* Điểm Đi */}
            <Form.Item
              label="Điểm Đi"
              name="diemDi"
              rules={[{ required: true, message: "Vui lòng chọn điểm đi" }]}
            >
              <Select
                showSearch
                placeholder="Chọn tỉnh đi"
                options={NORTHERN_PROVINCES.map((p) => ({ label: p, value: p }))}
              />
            </Form.Item>

            {/* Điểm Đến (Đã được lọc chặn trùng chuyến) */}
            <Form.Item
              label="Điểm Đến"
              name="diemDen"
              rules={[{ required: true, message: "Vui lòng chọn điểm đến" }]}
            >
              <Select
                showSearch
                placeholder="Chọn tỉnh đến"
                options={destinationOptions}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Quãng Đường (km)"
              name="quangDuong"
              rules={[{ required: true, message: "Vui lòng nhập quãng đường" }]}
            >
              <InputNumber
                className="w-full"
                min={1}
                max={3000}
                placeholder="Tự động tính toán"
                addonAfter="km"
              />
            </Form.Item>

            <Form.Item
              label="Thời Gian Di Chuyển"
              name="thoiGianDiChuyen"
              rules={[
                { required: true, message: "Vui lòng nhập thời gian di chuyển" },
                { min: 3, message: "Thời gian di chuyển không hợp lệ" },
              ]}
            >
              <Input placeholder="Tự động tính toán (VD: 2 giờ 40 phút)" />
            </Form.Item>
          </div>

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
                        rules={[
                          { required: true, message: "Nhập địa điểm đón" },
                          { min: 3, message: "Địa điểm quá ngắn" },
                        ]}
                      >
                        <Input placeholder="Bến xe Mỹ Đình" style={{ width: 340 }} />
                      </Form.Item>

                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        className="text-red-500"
                      />
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
                        rules={[
                          { required: true, message: "Nhập địa điểm trả" },
                          { min: 3, message: "Địa điểm quá ngắn" },
                        ]}
                      >
                        <Input placeholder="Bến xe Thượng Lý" style={{ width: 340 }} />
                      </Form.Item>

                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        className="text-red-500"
                      />
                    </Space>
                  ))}

                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                    Thêm điểm trả
                  </Button>
                </>
              )}
            </Form.List>
          </div>

          {/* Trạng Thái */}
          <Form.Item
            label="Trạng Thái"
            name="trangThai"
            initialValue={true}
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select
              options={[
                { value: true, label: "Hoạt động" },
                { value: false, label: "Dừng hoạt động" },
              ]}
            />
          </Form.Item>

          <Button type="primary" htmlType="submit">
            Thêm Hành Trình
          </Button>
        </Form>
      </Spin>
    </div>
  );
}

export default JourneyAddPage;