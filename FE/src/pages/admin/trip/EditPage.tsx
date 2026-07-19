import {
  Button,
  Form,
  Select,
  DatePicker,
  message,
  Spin,
  Tag,
  Divider,
} from "antd";
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
};

function TripEditPage() {
  const [form] = Form.useForm();
  const { id } = useParams();

  const { Edit } = useCRUD("trip");
  const { data: trip, isLoading } = useDetail("trip", id);

  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fareRules, setFareRules] = useState<FareRule[]>([]);

  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [departureTime, setDepartureTime] = useState<Dayjs | null>(null);
  const [arrivalTime, setArrivalTime] = useState<Dayjs | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [j, b, d, f] = await Promise.all([
          axios.get("http://localhost:3000/api/journey"),
          axios.get("http://localhost:3000/api/bus"),
          axios.get("http://localhost:3000/api/trip/drivers"),
          axios.get("http://localhost:3000/api/giave"),
        ]);

        setJourneys(j.data);
        setBuses(b.data);
        setDrivers(d.data);
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
  }, [trip, form]);

  // Khi đã load xong danh sách journeys và biết trip.journey, đồng bộ selectedJourney
  useEffect(() => {
    if (!trip?.journey?._id || journeys.length === 0) return;
    const journey = journeys.find((j) => j._id === trip.journey._id) || null;
    setSelectedJourney(journey);
  }, [trip, journeys]);

  const handleJourneyChange = (journeyId: string) => {
    const journey = journeys.find((j) => j._id === journeyId) || null;
    setSelectedJourney(journey);
  };

  const disabledPastDate = (current: any) => {
    return current && current < dayjs().startOf("day");
  };

  const onFinish = (values: any) => {
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

        {/* Xe */}
        <Form.Item
          name="bus"
          label="Xe"
          rules={[{ required: true, message: "Chọn xe" }]}
        >
          <Select>
            {buses.map((b) => (
              <Select.Option key={b._id} value={b._id}>
                {b.name || b.bienSo || "Xe"}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Tài xế */}
        <Form.Item
          name="staff"
          label="Tài xế"
          rules={[{ required: true, message: "Chọn tài xế" }]}
        >
          <Select placeholder="Chọn tài xế">
            {drivers.map((d) => (
              <Select.Option key={d._id} value={d._id}>
                {d.ten}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Bảng giá */}
        <Form.Item
          name="fareRule"
          label="Bảng giá"
          rules={[{ required: true, message: "Chọn bảng giá" }]}
        >
          <Select>
            {fareRules.map((f) => (
              <Select.Option key={f._id} value={f._id}>
                {f.weekdayPrice.toLocaleString("vi-VN")} đ
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