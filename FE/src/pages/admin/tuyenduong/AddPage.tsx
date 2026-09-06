import React, { useEffect, useState, useMemo } from "react";
import { Button, Form, Input, InputNumber, Select, Space, message, Spin } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useCRUD } from "../../../hooks/useCRUD";
import { NORTHERN_PROVINCES, NORTHERN_PROVINCES_COORDS } from "../../../constants/provinces";

function JourneyAddPage() {
  const [form] = Form.useForm();

  const { list: journeys, Add } = useCRUD("journey");
  const { list: stations = [] } = useCRUD("station");
  const [loadingRoute, setLoadingRoute] = useState(false);

  const diemDi = Form.useWatch("diemDi", form);
  const diemDen = Form.useWatch("diemDen", form);

  // Danh sách bến xe thuộc Điểm Đi dùng cho Điểm Đón
  const pickupStationOptions = useMemo(() => {
    if (!diemDi || !Array.isArray(stations)) return [];
    return stations
      .filter((s: any) => s.tinh === diemDi && s.trangThai !== false)
      .map((s: any) => ({
        label: s.diaChi ? `${s.tenBenXe} - ${s.diaChi}` : s.tenBenXe,
        value: s.tenBenXe,
      }));
  }, [stations, diemDi]);

  // Danh sách bến xe thuộc Điểm Đến dùng cho Điểm Trả
  const dropoffStationOptions = useMemo(() => {
    if (!diemDen || !Array.isArray(stations)) return [];
    return stations
      .filter((s: any) => s.tinh === diemDen && s.trangThai !== false)
      .map((s: any) => ({
        label: s.diaChi ? `${s.tenBenXe} - ${s.diaChi}` : s.tenBenXe,
        value: s.tenBenXe,
      }));
  }, [stations, diemDen]);

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
              label="Quãng Đường (dự kiến) (km)"
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
              label="Thời Gian Di Chuyển (dự kiến)"
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
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">Điểm Đón</p>
              <Link
                to="/admin/station/list"
                target="_blank"
                className="text-xs text-blue-600 hover:underline"
              >
                + Quản lý bến xe
              </Link>
            </div>
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
                        rules={[{ required: true, message: "Vui lòng chọn bến xe đón" }]}
                      >
                        <Select
                          showSearch
                          placeholder={
                            diemDi
                              ? `Chọn bến xe đón (${diemDi})`
                              : "Vui lòng chọn Điểm Đi trước"
                          }
                          disabled={!diemDi}
                          options={pickupStationOptions}
                          notFoundContent={
                            <div className="p-2 text-center text-gray-500 text-xs">
                              {diemDi ? (
                                <>
                                  Chưa có bến xe nào tại {diemDi}.{" "}
                                  <Link
                                    to="/admin/station/list"
                                    target="_blank"
                                    className="text-blue-600 underline font-medium"
                                  >
                                    Cấu hình ngay
                                  </Link>
                                </>
                              ) : (
                                "Vui lòng chọn Điểm Đi trước"
                              )}
                            </div>
                          }
                          style={{ width: 340 }}
                        />
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
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">Điểm Trả</p>
              <Link
                to="/admin/station/list"
                target="_blank"
                className="text-xs text-blue-600 hover:underline"
              >
                + Quản lý bến xe
              </Link>
            </div>
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
                        rules={[{ required: true, message: "Vui lòng chọn bến xe trả" }]}
                      >
                        <Select
                          showSearch
                          placeholder={
                            diemDen
                              ? `Chọn bến xe trả (${diemDen})`
                              : "Vui lòng chọn Điểm Đến trước"
                          }
                          disabled={!diemDen}
                          options={dropoffStationOptions}
                          notFoundContent={
                            <div className="p-2 text-center text-gray-500 text-xs">
                              {diemDen ? (
                                <>
                                  Chưa có bến xe nào tại {diemDen}.{" "}
                                  <Link
                                    to="/admin/station/list"
                                    target="_blank"
                                    className="text-blue-600 underline font-medium"
                                  >
                                    Cấu hình ngay
                                  </Link>
                                </>
                              ) : (
                                "Vui lòng chọn Điểm Đến trước"
                              )}
                            </div>
                          }
                          style={{ width: 340 }}
                        />
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