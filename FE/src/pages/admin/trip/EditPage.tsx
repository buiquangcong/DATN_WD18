import { Button, Form, Select, DatePicker, message, Spin } from "antd";
import { useEffect, useState } from "react";
import { useCRUD, useDetail } from "../../../hooks/useCRUD";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
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

function TripEditPage() {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();

  const { Edit } = useCRUD("trip");
  const { data: trip, isLoading } = useDetail("trip", id);

  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);

  // load select data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [j, b] = await Promise.all([
          axios.get("http://localhost:3000/api/journey"),
          axios.get("http://localhost:3000/api/bus"),
        ]);

        setJourneys(j.data);
        setBuses(b.data);
      } catch (err) {
        message.error("Load dữ liệu thất bại");
      }
    };

    fetchData();
  }, []);

  // set data vào form khi có trip
  useEffect(() => {
    if (trip) {
      form.setFieldsValue({
        journey: trip.journey?._id,
        bus: trip.bus?._id,
        status: trip.status,
        departureTime: trip.departureTime
          ? dayjs(trip.departureTime)
          : null,
      });
    }
  }, [trip]);

  // submit
  const onFinish = (values: any) => {
    const payload = {
      _id: id,
      journey: values.journey,
      bus: values.bus,
      status: values.status,
      departureTime: values.departureTime
        ? values.departureTime.toISOString()
        : null,
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
      <h1 className="text-xl font-bold mb-6">Sửa Chuyến Xe</h1>

      <Form form={form} layout="vertical" onFinish={onFinish}>

        {/* JOURNEY */}
        <Form.Item
          name="journey"
          label="Tuyến đường"
          rules={[{ required: true }]}
        >
          <Select placeholder="Chọn tuyến">
            {journeys.map((j) => (
              <Select.Option key={j._id} value={j._id}>
                {j.diemDi} → {j.diemDen}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* BUS */}
        <Form.Item
          name="bus"
          label="Xe"
          rules={[{ required: true }]}
        >
          <Select placeholder="Chọn xe">
            {buses.map((b) => (
              <Select.Option key={b._id} value={b._id}>
                {b.name || b.bienSo || "Xe"}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* TIME */}
        <Form.Item
          name="departureTime"
          label="Thời gian khởi hành"
          rules={[{ required: true }]}
        >
          <DatePicker showTime className="w-full" />
        </Form.Item>

        {/* STATUS */}
        <Form.Item name="status" label="Trạng thái">
          <Select
            options={[
              { value: "sắp chạy", label: "Sắp chạy" },
              { value: "đang chạy", label: "Đang chạy" },
              { value: "hoàn thành", label: "Hoàn thành" },
              { value: "huỷ", label: "Huỷ" },
            ]}
          />
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Cập nhật
        </Button>
      </Form>
    </div>
  );
}

export default TripEditPage;