import {Button,Form,Select,DatePicker,message,Spin,Tag,Divider,Input,} from "antd";
import { useEffect, useState } from "react";
import { useCRUD, useDetail } from "../../../hooks/useCRUD";
import axios from "axios";
import { useParams } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";

type DiemType = {
  _id?: string;
  diaDiem: string;
  offsetMinutes: number;
};

type Journey = {
  _id: string;
  diemDi: string;
  diemDen: string;
  diemDon?: DiemType[];
  diemTra?: DiemType[];
};

type Bus = {
  _id: string;
  name?: string;
  bienSo?: string;
  licensePlates?: string;
  capacity: number;
};

type Driver = {
  _id: string;
  ten: string;
};

type FareRule = {
  _id: string;
  weekdayPrice: number;
  weekendPrice: number;
  holidayPrice: number;
  capacity: number;

  journey?: {
    _id: string;
    diemDi: string;
    diemDen: string;
  };
};

function TripEditPage() {
  const [form] = Form.useForm();
  const { id } = useParams();

  const { Edit } = useCRUD("trip");
  const { data: trip, isLoading } = useDetail("trip", id);

  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [fareRules, setFareRules] = useState<FareRule[]>([]);

  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [selectedFareRule, setSelectedFareRule] = useState<FareRule | null>(null);
  const [departureTime, setDepartureTime] = useState<Dayjs | null>(null);
  const [arrivalTime, setArrivalTime] = useState<Dayjs | null>(null);

  const [availableBuses, setAvailableBuses] = useState<Bus[]>([]);
  const [loadingBuses, setLoadingBuses] = useState(false);

  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [j, f] = await Promise.all([
          axios.get("http://localhost:3000/api/journey"),
          axios.get("http://localhost:3000/api/giave"),
        ]);

        setJourneys(j.data);
        setFareRules(f.data);
      } catch {
        message.error("Load dữ liệu thất bại");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!trip) return;

    form.setFieldsValue({
      journey: trip.journey?._id,
      bus: trip.bus?._id,
      staff: trip.staff?._id,
      fareRule: trip.fareRule?._id,
      status: trip.status,

      departureTime: trip.departureTime
        ? dayjs(trip.departureTime)
        : undefined,

      arrivalTime: trip.arrivalTime
        ? dayjs(trip.arrivalTime)
        : undefined,
    });

    if (trip.departureTime) setDepartureTime(dayjs(trip.departureTime));
    if (trip.arrivalTime) setArrivalTime(dayjs(trip.arrivalTime));

    // Hiển thị tạm giá vé hiện tại của chuyến khi mới mở trang, sẽ được tính
    // lại chính xác ngay khi availableBuses/fareRules load xong (useEffect bên dưới)
    if (trip.fareRule) {
      setSelectedFareRule(trip.fareRule);
    }
  }, [trip, form]);

  // Khi đã load xong danh sách journeys và biết trip.journey, đồng bộ selectedJourney
  useEffect(() => {
    if (!trip?.journey?._id || journeys.length === 0) return;
    const journey = journeys.find((j) => j._id === trip.journey._id) || null;
    setSelectedJourney(journey);
  }, [trip, journeys]);

  // Khi đã đủ giờ khởi hành + giờ đến + tuyến đường, gọi API lấy xe đang rảnh
  // (loại trừ chính chuyến đang sửa, vì nó đang "bận" với chính chuyến này)
  useEffect(() => {
    if (!departureTime || !arrivalTime || !id || !selectedJourney) {
      setAvailableBuses([]);
      return;
    }

    const fetchAvailableBuses = async () => {
      setLoadingBuses(true);

      try {
        const dateStr = departureTime.format("YYYY-MM-DD");
        const weekday = departureTime.day(); // 0-6, khớp với getDay() bên BE

        const res = await axios.get(
          "http://localhost:3000/api/trip/available-buses",
          {
            params: {
              weekdays: String(weekday),
              startDate: dateStr,
              endDate: dateStr,
              departureHour: departureTime.format("HH:mm"),
              arrivalHour: arrivalTime.format("HH:mm"),
              journey: selectedJourney._id,
              excludeTripId: id,
            },
          }
        );

        // Chỉ giữ lại các xe có cùng số chỗ (capacity) với xe ban đầu của chuyến -
        // tránh đổi sang loại xe khác số chỗ làm lệch sơ đồ ghế đã bán cho khách
        const originalCapacity = trip?.bus?.capacity;

        const filteredBuses = originalCapacity
          ? res.data.filter((b: Bus) => b.capacity === originalCapacity)
          : res.data;

        setAvailableBuses(filteredBuses);

        // Nếu xe đang chọn (trip.bus) không còn nằm trong danh sách rảnh,
        // thêm tạm vào đầu danh sách để không mất lựa chọn hiện tại khi mở trang Edit
        const currentBusId = trip?.bus?._id;
        if (
          currentBusId &&
          !filteredBuses.some((b: Bus) => b._id === currentBusId) &&
          trip?.bus
        ) {
          setAvailableBuses((prev) => [trip.bus, ...prev]);
        }
      } catch {
        message.error("Không thể kiểm tra xe rảnh");
        setAvailableBuses([]);
      } finally {
        setLoadingBuses(false);
      }
    };

    fetchAvailableBuses();
  }, [departureTime, arrivalTime, id, trip, selectedJourney]);

  // Tự soát lại bảng giá ngay khi danh sách xe rảnh vừa load xong (kể cả khi
  // người dùng chưa đổi gì) - để phát hiện và tự sửa trường hợp dữ liệu cũ của
  // chuyến đã bị lưu sai (VD bảng giá xe 16 chỗ nhưng xe thực tế là 34 chỗ)
  useEffect(() => {
    const currentBusId = form.getFieldValue("bus");
    if (!currentBusId || availableBuses.length === 0 || !selectedJourney) return;

    handleFindFareRule(currentBusId);
  }, [availableBuses, selectedJourney, fareRules]);

  // Khi đã đủ giờ khởi hành + giờ đến + tuyến đường, gọi API lấy tài xế đang rảnh
  // (loại trừ chính chuyến đang sửa, vì nó đang "bận" với chính chuyến này)
  useEffect(() => {
    if (!departureTime || !arrivalTime || !id || !selectedJourney) {
      setAvailableDrivers([]);
      return;
    }

    const fetchAvailableDrivers = async () => {
      setLoadingDrivers(true);

      try {
        const dateStr = departureTime.format("YYYY-MM-DD");
        const weekday = departureTime.day(); // 0-6, khớp với getDay() bên BE

        const res = await axios.get(
          "http://localhost:3000/api/trip/available-drivers",
          {
            params: {
              weekdays: String(weekday),
              startDate: dateStr,
              endDate: dateStr,
              departureHour: departureTime.format("HH:mm"),
              arrivalHour: arrivalTime.format("HH:mm"),
              journey: selectedJourney._id,
              excludeTripId: id,
            },
          }
        );

        setAvailableDrivers(res.data);

        // Nếu tài xế đang chọn (trip.staff) không còn nằm trong danh sách rảnh,
        // thêm tạm vào đầu danh sách để không mất lựa chọn hiện tại khi mở trang Edit
        const currentStaffId = trip?.staff?._id;
        if (
          currentStaffId &&
          !res.data.some((d: Driver) => d._id === currentStaffId) &&
          trip?.staff
        ) {
          setAvailableDrivers((prev) => [trip.staff, ...prev]);
        }
      } catch {
        message.error("Không thể kiểm tra tài xế rảnh");
        setAvailableDrivers([]);
      } finally {
        setLoadingDrivers(false);
      }
    };

    fetchAvailableDrivers();
  }, [departureTime, arrivalTime, id, trip, selectedJourney]);

  // Tự động tìm đúng bảng giá khớp cả Tuyến đường lẫn số chỗ (capacity) của xe
  // đang chọn - không cho người dùng tự chọn tay để tránh chọn nhầm bảng giá
  // của xe khác (VD xe 34 chỗ nhưng lại áp giá của xe 16 chỗ)
  const handleFindFareRule = (busId: string) => {
    const bus = availableBuses.find((x) => x._id === busId);

    if (!bus || !selectedJourney) return;

    const rule = fareRules.find(
      (f) =>
        f.journey?._id === selectedJourney._id &&
        f.capacity === bus.capacity
    );

    if (rule) {
      setSelectedFareRule(rule);
      form.setFieldValue("fareRule", rule._id);
    } else {
      setSelectedFareRule(null);
      form.setFieldValue("fareRule", undefined);
      message.warning("Không tìm thấy bảng giá phù hợp với xe này");
    }
  };

  const handleJourneyChange = (journeyId: string) => {
    const journey = journeys.find((j) => j._id === journeyId) || null;
    setSelectedJourney(journey);

    // Đổi tuyến thì bảng giá cũ chắc chắn không còn khớp - reset lại và
    // tính lại theo xe đang chọn (nếu có)
    const currentBusId = form.getFieldValue("bus");
    if (currentBusId) {
      handleFindFareRule(currentBusId);
    }
  };

  const disabledPastDate = (current: any) => {
    return current && current < dayjs().startOf("day");
  };

  const onFinish = (values: any) => {
    if (!selectedFareRule) {
      message.error("Chưa xác định được bảng giá phù hợp cho xe này");
      return;
    }

    Edit({
      _id: id,
      journey: values.journey,
      bus: values.bus,
      staff: values.staff,
      fareRule: values.fareRule,
      status: values.status,

      departureTime:
        values.departureTime?.toDate().toISOString(),

      arrivalTime:
        values.arrivalTime?.toDate().toISOString(),
    });
  };

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center">
        <Spin />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-6">
        Sửa chuyến xe
      </h1>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
                {/* Tuyến đường */}
        <Form.Item
          name="journey"
          label="Tuyến đường"
          rules={[{ required: true, message: "Chọn tuyến đường" }]}
        >
          <Select onChange={handleJourneyChange}>
            {journeys.map((j) => (
              <Select.Option key={j._id} value={j._id}>
                {j.diemDi} → {j.diemDen}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Khởi hành */}
        <Form.Item
          name="departureTime"
          label="Thời gian khởi hành"
          rules={[
            {
              required: true,
              message: "Chọn thời gian khởi hành",
            },
          ]}
        >
          <DatePicker
            showTime
            className="w-full"
            format="YYYY-MM-DD HH:mm"
            disabledDate={disabledPastDate}
            onChange={(value) => setDepartureTime(value)}
          />
        </Form.Item>

        {/* Đến */}
        <Form.Item
          name="arrivalTime"
          label="Thời gian đến"
          dependencies={["departureTime"]}
          rules={[
            {
              required: true,
              message: "Chọn thời gian đến",
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const departure =
                  getFieldValue("departureTime");

                if (!departure || !value) {
                  return Promise.resolve();
                }

                if (value.isAfter(departure)) {
                  return Promise.resolve();
                }

                return Promise.reject(
                  new Error(
                    "Thời gian đến phải sau thời gian khởi hành"
                  )
                );
              },
            }),
          ]}
        >
          <DatePicker
            showTime
            className="w-full"
            format="YYYY-MM-DD HH:mm"
            disabledDate={(current) => {
              const departure =
                form.getFieldValue("departureTime");

              if (!departure) {
                return (
                  current &&
                  current < dayjs().startOf("day")
                );
              }

              return (
                current &&
                current < departure.startOf("day")
              );
            }}
            onChange={(value) => setArrivalTime(value)}
          />
        </Form.Item>

        {/* Preview giờ đón/trả thực tế */}
        {selectedJourney && departureTime && arrivalTime && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-medium mb-2">Giờ đón/trả dự kiến</p>

            {selectedJourney.diemDon && selectedJourney.diemDon.length > 0 && (
              <>
                <p className="text-sm text-gray-500 mb-1">Điểm đón</p>
                <div className="space-y-1 mb-3">
                  {selectedJourney.diemDon.map((diem, idx) => (
                    <div key={diem._id || idx} className="flex items-center gap-3">
                      <Tag color="blue">
                        {departureTime
                          .add(diem.offsetMinutes, "minute")
                          .format("DD/MM/YYYY HH:mm")}
                      </Tag>
                      <span className="text-gray-700">{diem.diaDiem}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedJourney.diemTra && selectedJourney.diemTra.length > 0 && (
              <>
                <Divider className="my-2" />
                <p className="text-sm text-gray-500 mb-1">Điểm trả</p>
                <div className="space-y-1">
                  {selectedJourney.diemTra.map((diem, idx) => (
                    <div key={diem._id || idx} className="flex items-center gap-3">
                      <Tag color="orange">
                        {arrivalTime
                          .subtract(diem.offsetMinutes, "minute")
                          .format("DD/MM/YYYY HH:mm")}
                      </Tag>
                      <span className="text-gray-700">{diem.diaDiem}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Xe: chỉ hiện khi đã đủ giờ khởi hành/đến/tuyến, chỉ liệt kê xe đang rảnh */}
        <Form.Item
          name="bus"
          label="Xe"
          rules={[{ required: true, message: "Chọn xe" }]}
          extra={
            !departureTime || !arrivalTime || !selectedJourney
              ? "Chọn tuyến đường và thời gian khởi hành/đến để xem xe đang rảnh"
              : trip?.bus?.capacity
              ? `Chỉ hiện xe cùng ${trip.bus.capacity} chỗ với xe ban đầu, để không làm lệch sơ đồ ghế đã bán`
              : undefined
          }
        >
          {loadingBuses ? (
            <div className="flex items-center gap-2">
              <Spin size="small" />
              <span className="text-gray-500 text-sm">Đang kiểm tra xe rảnh...</span>
            </div>
          ) : (
            <Select
              placeholder="Chọn xe đang rảnh"
              disabled={availableBuses.length === 0}
              notFoundContent="Không có xe nào rảnh vào khung giờ này"
              onChange={handleFindFareRule}
            >
              {availableBuses.map((b) => (
                <Select.Option key={b._id} value={b._id}>
                  {b.name || b.bienSo || "Xe"}
                  {b.licensePlates ? ` - ${b.licensePlates}` : ""}
                  {` (${b.capacity} chỗ)`}
                </Select.Option>
              ))}
            </Select>
          )}
        </Form.Item>

        {/* Bảng giá: tự động xác định theo Tuyến đường + số chỗ của xe, không cho chọn tay */}
        <Form.Item
          name="fareRule"
          hidden
        >
          <Input />
        </Form.Item>

        <Form.Item label="Giá vé áp dụng">
          <Input
            disabled
            value={
              selectedFareRule
                ? `${selectedFareRule.weekdayPrice.toLocaleString("vi-VN")} đ`
                : "Chưa xác định - chọn xe để tự động tính"
            }
          />
        </Form.Item>

        {/* Tài xế: chỉ hiện khi đã đủ giờ khởi hành/đến/tuyến, chỉ liệt kê tài xế đang rảnh */}
        <Form.Item
          name="staff"
          label="Tài xế"
          rules={[{ required: true, message: "Chọn tài xế" }]}
          extra={
            !departureTime || !arrivalTime || !selectedJourney
              ? "Chọn tuyến đường và thời gian khởi hành/đến để xem tài xế đang rảnh"
              : undefined
          }
        >
          {loadingDrivers ? (
            <div className="flex items-center gap-2">
              <Spin size="small" />
              <span className="text-gray-500 text-sm">Đang kiểm tra tài xế rảnh...</span>
            </div>
          ) : (
            <Select
              placeholder="Chọn tài xế đang rảnh"
              disabled={availableDrivers.length === 0}
              notFoundContent="Không có tài xế nào rảnh vào khung giờ này"
            >
              {availableDrivers.map((d) => (
                <Select.Option key={d._id} value={d._id}>
                  {d.ten}
                </Select.Option>
              ))}
            </Select>
          )}
        </Form.Item>

        {/* Trạng thái */}
        <Form.Item
          name="status"
          label="Trạng thái"
        >
          <Select
            options={[
              {
                value: "sắp chạy",
                label: "Sắp chạy",
              },
              {
                value: "đang chạy",
                label: "Đang chạy",
              },
              {
                value: "hoàn thành",
                label: "Hoàn thành",
              },
              {
                value: "huỷ",
                label: "Huỷ",
              },
            ]}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
        >
          Cập nhật chuyến xe
        </Button>
      </Form>
    </div>
  );
}

export default TripEditPage;