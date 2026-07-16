import {
  Button,
  Form,
  Select,
  DatePicker,
  message,
  Spin,
} from "antd";
import { useEffect, useState } from "react";
import { useCRUD, useDetail } from "../../../hooks/useCRUD";
import axios from "axios";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";

type Journey = {
  _id: string;
  diemDi: string;
  diemDen: string;
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
  }, [trip, form]);

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
          <Select>
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
          />
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