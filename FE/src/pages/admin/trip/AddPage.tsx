import { Button, Form, Select, DatePicker, message } from "antd";
import { useEffect, useState } from "react";
import { useCRUD } from "../../../hooks/useCRUD";
import axios from "axios";
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

function TripAddPage() {
  const [form] = Form.useForm();

  const { Add } = useCRUD("trip");

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

  // submit
  const onFinish = (values: any) => {
    const payload = {
      journey: values.journey,
      bus: values.bus,
      status: values.status || "sắp chạy",
      departureTime: values.departureTime
        ? values.departureTime.toISOString()
        : null,
    };

    Add(payload);
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Thêm Chuyến Xe</h1>

      <Form form={form} layout="vertical" onFinish={onFinish}>

        {/* JOURNEY */}
        <Form.Item
          name="journey"
          label="Tuyến đường"
          rules={[{ required: true, message: "Chọn tuyến đường" }]}
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
          rules={[{ required: true, message: "Chọn xe" }]}
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
          rules={[{ required: true, message: "Chọn thời gian" }]}
        >
          <DatePicker showTime className="w-full" format="YYYY-MM-DD HH:mm" />
        </Form.Item>

        {/* STATUS */}
        <Form.Item name="status" initialValue="sắp chạy">
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
          Thêm chuyến xe
        </Button>
      </Form>
    </div>
  );
}

export default TripAddPage;