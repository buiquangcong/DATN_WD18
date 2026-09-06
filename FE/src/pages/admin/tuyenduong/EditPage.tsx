import React, { useEffect, useState, useMemo } from "react";
import { Button, Form, Input, InputNumber, Select, Space, message, Spin, Card } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useCRUD } from "../../../hooks/useCRUD";
import { useParams, Link } from "react-router-dom";
import { NORTHERN_PROVINCES, NORTHERN_PROVINCES_COORDS } from "../../../constants/provinces";

function JourneyEditPage() {
  const { id } = useParams();
  const [form] = Form.useForm();

  // 1. Lấy hàm Edit và danh sách journeys từ custom hook
  const { Edit, list: journeysList } = useCRUD("journey");
  const { list: stations = [] } = useCRUD("station");
  const [loadingRoute, setLoadingRoute] = useState(false);

  // 2. Lắng nghe điểm đi và điểm đến từ Form
  const diemDi = Form.useWatch("diemDi", form);
  const diemDen = Form.useWatch("diemDen", form);

  // 3. Tìm bản ghi hành trình hiện tại đang chỉnh sửa
  const currentRecord = (journeysList || []).find((item: any) => (item._id || item.id) === id);

  // Danh sách bến xe thuộc Điểm Đi dùng cho Điểm Đón (kèm điểm đón hiện tại nếu có)
  const pickupStationOptions = useMemo(() => {
    if (!diemDi || !Array.isArray(stations)) return [];
    const options = stations
      .filter((s: any) => s.tinh === diemDi && s.trangThai !== false)
      .map((s: any) => ({
        label: s.diaChi ? `${s.tenBenXe} - ${s.diaChi}` : s.tenBenXe,
        value: s.tenBenXe,
      }));

    // Đảm bảo các điểm đón cũ đã lưu trong bản ghi vẫn hiển thị được nếu chưa có trong options
    const currentDiemDon = currentRecord?.diemDon || currentRecord?.diem_don || [];
    currentDiemDon.forEach((item: any) => {
      const name = item?.diaDiem || item?.dia_diem;
      if (name && !options.some((opt) => opt.value === name)) {
        options.unshift({
          label: `${name} (Hiện tại)`,
          value: name,
        });
      }
    });

    return options;
  }, [stations, diemDi, currentRecord]);

  // Danh sách bến xe thuộc Điểm Đến dùng cho Điểm Trả (kèm điểm trả hiện tại nếu có)
  // Tập hợp các bến xe trả đã có chuyến đi từ điểm đi hiện tại đến từng điểm đến ở các bản ghi khác
  const getUsedDropoffStations = (startPoint?: string, endPoint?: string) => {
    if (!startPoint || !endPoint || !Array.isArray(journeysList)) return new Set<string>();
    const otherJourneys = journeysList.filter((j: any) => {
      const isNotCurrent = (j._id || j.id) !== id;
      const jDi = j.diemDi || j.diem_di;
      const jDen = j.diemDen || j.diem_den;
      return isNotCurrent && jDi === startPoint && jDen === endPoint;
    });
    const set = new Set<string>();
    otherJourneys.forEach((j: any) => {
      (j.diemTra || j.diem_tra || []).forEach((dt: any) => {
        const name = (dt.diaDiem || dt.dia_diem || "").trim().toLowerCase();
        if (name) set.add(name);
      });
    });
    return set;
  };

  // Kiểm tra trạng thái của Điểm Đến: Chỉ khóa khi đã có chuyến và chọn hết toàn bộ bến xe của tỉnh đó
  const getDestinationStatus = (destProvince: string) => {
    if (!diemDi) {
      return { isFullyBooked: false, label: destProvince, disabled: false };
    }

    if (destProvince === diemDi) {
      return { isFullyBooked: false, label: destProvince, disabled: true };
    }

    const stationsInDest = (stations || []).filter(
      (s: any) => s.tinh === destProvince && s.trangThai !== false
    );

    const otherJourneys = (journeysList || []).filter((j: any) => {
      const isNotCurrent = (j._id || j.id) !== id;
      const jDi = j.diemDi || j.diem_di;
      const jDen = j.diemDen || j.diem_den;
      return isNotCurrent && jDi === diemDi && jDen === destProvince;
    });

    if (otherJourneys.length === 0) {
      return { isFullyBooked: false, label: destProvince, disabled: false };
    }

    if (stationsInDest.length === 0) {
      return {
        isFullyBooked: true,
        label: `${destProvince} (Đã có chuyến)`,
        disabled: true,
      };
    }

    const usedDropoffs = getUsedDropoffStations(diemDi, destProvince);

    const allStationsUsed = stationsInDest.every((s: any) =>
      usedDropoffs.has((s.tenBenXe || "").trim().toLowerCase())
    );

    if (allStationsUsed) {
      return {
        isFullyBooked: true,
        label: `${destProvince} (Đã chọn hết bến xe)`,
        disabled: true,
      };
    }

    const remainingCount = stationsInDest.filter(
      (s: any) => !usedDropoffs.has((s.tenBenXe || "").trim().toLowerCase())
    ).length;

    return {
      isFullyBooked: false,
      label: `${destProvince} (Còn ${remainingCount} bến xe)`,
      disabled: false,
    };
  };

  // Danh sách bến xe thuộc Điểm Đến dùng cho Điểm Trả
  const dropoffStationOptions = useMemo(() => {
    if (!diemDen || !Array.isArray(stations)) return [];
    const usedDropoffs = getUsedDropoffStations(diemDi, diemDen);

    const options = stations
      .filter((s: any) => s.tinh === diemDen && s.trangThai !== false)
      .map((s: any) => {
        const isUsed = usedDropoffs.has((s.tenBenXe || "").trim().toLowerCase());
        return {
          label: isUsed
            ? `${s.tenBenXe} (Đã có tuyến từ ${diemDi})`
            : s.diaChi
            ? `${s.tenBenXe} - ${s.diaChi}`
            : s.tenBenXe,
          value: s.tenBenXe,
          disabled: isUsed,
        };
      });

    // Đảm bảo các điểm trả cũ đã lưu trong bản ghi vẫn hiển thị được
    const currentDiemTra = currentRecord?.diemTra || currentRecord?.diem_tra || [];
    currentDiemTra.forEach((item: any) => {
      const name = item?.diaDiem || item?.dia_diem;
      if (name && !options.some((opt) => opt.value === name)) {
        options.unshift({
          label: `${name} (Hiện tại)`,
          value: name,
          disabled: false,
        });
      }
    });

    return options;
  }, [stations, diemDen, diemDi, journeysList, currentRecord]);

  // 4. Fill dữ liệu cũ vào Form khi vừa tải trang
  useEffect(() => {
    if (currentRecord) {
      form.setFieldsValue({
        diemDi: currentRecord.diemDi || currentRecord.diem_di,
        diemDen: currentRecord.diemDen || currentRecord.diem_den,
        quangDuong: currentRecord.quangDuong || currentRecord.quang_duong,
        thoiGianDiChuyen: currentRecord.thoiGianDiChuyen || currentRecord.thoi_gian_di_chuyen,
        diemDon: currentRecord.diemDon || currentRecord.diem_don || [],
        diemTra: currentRecord.diemTra || currentRecord.diem_tra || [],
        trangThai: currentRecord.trangThai ?? currentRecord.trang_thai ?? true,
      });
    }
  }, [currentRecord, form]);

  // Danh sách options cho Điểm Đến
  const destinationOptions = NORTHERN_PROVINCES.map((p) => {
    const status = getDestinationStatus(p);
    return {
      label: status.label,
      value: p,
      disabled: status.disabled,
    };
  });

  // 6. Tự động tính toán lại Quãng Đường & Thời Gian khi đổi Điểm Đi / Điểm Đến
  useEffect(() => {
    if (!diemDi || !diemDen) return;

    // Nếu người dùng không sửa đổi điểm đi và điểm đến cũ thì không gọi lại API
    const initialStart = currentRecord?.diemDi || currentRecord?.diem_di;
    const initialEnd = currentRecord?.diemDen || currentRecord?.diem_den;
    if (diemDi === initialStart && diemDen === initialEnd && form.getFieldValue("quangDuong")) {
      return;
    }

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

          message.success("Đã cập nhật lại quãng đường & thời gian!");
        } else {
          message.error("Không thể lấy lộ trình tuyến đường.");
        }
      })
      .catch((err) => {
        setLoadingRoute(false);
        console.error("Lỗi khi kết nối OSRM API:", err);
        message.error("Lỗi khi tính toán lộ trình đường đi.");
      });
  }, [diemDi, diemDen, form, currentRecord]);

  const onFinish = (values: any) => {
    if (values.diemDi.trim().toLowerCase() === values.diemDen.trim().toLowerCase()) {
      message.error("Điểm đi và điểm đến không được trùng nhau");
      return;
    }

    const destStatus = getDestinationStatus(values.diemDen);
    // Nếu điểm đến khác với điểm đến ban đầu và đã chọn hết bến xe
    const initialEnd = currentRecord?.diemDen || currentRecord?.diem_den;
    if (values.diemDen !== initialEnd && destStatus.isFullyBooked) {
      message.error(`Hành trình ${values.diemDi} - ${values.diemDen} đã có chuyến và chọn hết toàn bộ bến xe!`);
      return;
    }

    const usedDropoffs = getUsedDropoffStations(values.diemDi, values.diemDen);
    const duplicateStation = (values.diemTra || []).find((d: any) =>
      usedDropoffs.has((d.diaDiem || "").trim().toLowerCase())
    );

    if (duplicateStation) {
      message.error(`Bến xe trả "${duplicateStation.diaDiem}" đã có tuyến từ ${values.diemDi}! Vui lòng chọn bến xe khác.`);
      return;
    }

    Edit({
      _id: id,
      ...values,
    });
  };

  return (
    <div className="p-6 max-w-3xl">
      <Card>
        <h1 className="text-2xl font-semibold mb-6">Chỉnh Sửa Hành Trình</h1>

        <Spin spinning={loadingRoute} tip="Đang tính toán tuyến đường...">
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <div className="grid grid-cols-2 gap-4">
              {/* Điểm Đi */}
              <Form.Item 
                label="Điểm Đi"
                name="diemDi"
                rules={[{ required: true, message: "Vui lòng chọn điểm đi" }]}
              >
                <Select disabled
                  showSearch
                  placeholder="Chọn tỉnh đi"
                  options={NORTHERN_PROVINCES.map((p) => ({ label: p, value: p }))}
                />
              </Form.Item>

              {/* Điểm Đến (Đã lọc chặn trùng chuyến) */}
              <Form.Item
                label="Điểm Đến"
                name="diemDen"
                rules={[{ required: true, message: "Vui lòng chọn điểm đến" }]}
              >
                <Select disabled
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
                <InputNumber disabled
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
                <Input disabled placeholder="Tự động tính toán (VD: 2 giờ 40 phút)" />
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
              Lưu Thay Đổi
            </Button>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}

export default JourneyEditPage;