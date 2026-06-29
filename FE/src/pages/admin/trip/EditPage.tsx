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

type Staff = {
  _id: string;
  ten: string;
  email: string;
  sdt: string;
  cccd: string;
  chucVu: string;
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
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [fareRules, setFareRules] = useState<FareRule[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [j, b, s, f] = await Promise.all([
          axios.get("http://localhost:3000/api/journey"),
          axios.get("http://localhost:3000/api/bus"),
          axios.get("http://localhost:3000/api/staff"),
          axios.get("http://localhost:3000/api/giave"),
        ]);

        setJourneys(j.data);
        setBuses(b.data);
        setStaffs(s.data);
        setFareRules(f.data);
      } catch (error) {
        message.error("Load dữ liệu thất bại");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (trip) {
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
    }
  }, [trip, form]);

  const onFinish = (values: any) => {
    const payload = {
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
    };

    Edit(payload);
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
        Sửa Chuyến Xe
      </h1>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="journey"
          label="Tuyến đường"
          rules={[
            {
              required: true,
              message: "Chọn tuyến đường",
            },
          ]}
        >
          <Select placeholder="Chọn tuyến đường">
            {journeys.map((j) => (
              <Select.Option
                key={j._id}
                value={j._id}
              >
                {j.diemDi} → {j.diemDen}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="bus"
          label="Xe"
          rules={[
            {
              required: true,
              message: "Chọn xe",
            },
          ]}
        >
          <Select placeholder="Chọn xe">
            {buses.map((b) => (
              <Select.Option
                key={b._id}
                value={b._id}
              >
                {b.name || b.bienSo || "Xe"}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="staff"
          label="Nhân viên phụ trách"
          rules={[
            {
              required: true,
              message: "Chọn nhân viên",
            },
          ]}
        >
          <Select placeholder="Chọn nhân viên">
            {staffs.map((s) => (
              <Select.Option
                key={s._id}
                value={s._id}
              >
                {s.ten} - {s.chucVu}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="fareRule"
          label="Bảng giá"
          rules={[
            {
              required: true,
              message: "Chọn bảng giá",
            },
          ]}
        >
          <Select placeholder="Chọn bảng giá">
            {fareRules.map((f) => (
              <Select.Option
                key={f._id}
                value={f._id}
              >
                {f.weekdayPrice?.toLocaleString("vi-VN")} đ
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

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
          />
        </Form.Item>

        <Form.Item
          name="arrivalTime"
          label="Thời gian đến"
          rules={[
            {
              required: true,
              message: "Chọn thời gian đến",
            },
          ]}
        >
          <DatePicker
            showTime
            className="w-full"
            format="YYYY-MM-DD HH:mm"
          />
        </Form.Item>

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
