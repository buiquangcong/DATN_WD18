import { Button, Form, Select, DatePicker, message } from "antd";
import { useEffect, useState } from "react";
import { useCRUD } from "../../../hooks/useCRUD";
import axios from "axios";

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

function TripAddPage() {
  const [form] = Form.useForm();

  const { Add } = useCRUD("trip");

  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [j, b, s] = await Promise.all([
          axios.get("http://localhost:3000/api/journey"),
          axios.get("http://localhost:3000/api/bus"),
          axios.get("http://localhost:3000/api/staff"),
        ]);

        setJourneys(j.data);
        setBuses(b.data);
        setStaffs(s.data);
      } catch (error) {
        message.error("Load dữ liệu thất bại");
      }
    };

    fetchData();
  }, []);

  const onFinish = (values: any) => {
    const payload = {
      journey: values.journey,
      bus: values.bus,
      staff: values.staff,
      status: values.status || "sắp chạy",
      departureTime: values.departureTime?.toISOString(),
    };

    Add(payload);

    form.resetFields();
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-6">
        Thêm Chuyến Xe
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

        {/* Xe */}
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

        {/* Nhân viên */}
        <Form.Item
          name="staff"
          label="Nhân viên phụ trách"
          rules={[
            {
              required: true,
              message: "Chọn nhân viên phụ trách",
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

        {/* Thời gian khởi hành */}
        <Form.Item
          name="departureTime"
          label="Thời gian khởi hành"
          rules={[
            {
              required: true,
              message: "Chọn thời gian",
            },
          ]}
        >
          <DatePicker
            showTime
            className="w-full"
            format="YYYY-MM-DD HH:mm"
          />
        </Form.Item>

        {/* Trạng thái */}
        <Form.Item
          name="status"
          label="Trạng thái"
          initialValue="sắp chạy"
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
          Thêm chuyến xe
        </Button>
      </Form>
    </div>
  );
}

export default TripAddPage;