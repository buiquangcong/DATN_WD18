import {
  Button,
  Form,
  Select,
  DatePicker,
  message,
  Input,
  Checkbox,
  Card,
} from "antd";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type Journey = {
  _id: string;
  diemDi: string;
  diemDen: string;
};

type Bus = {
  _id: string;
  name: string;
  licensePlates: string;
  capacity: number;
};

type Staff = {
  _id: string;
  ten: string;
  chucVu: string;
};

type FareRule = {
  _id: string;
  capacity: number;
  weekdayPrice: number;
  weekendPrice: number;
  holidayPrice: number;

  journey?: {
    _id: string;
    diemDi: string;
    diemDen: string;
  };
};

function TripAddPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [fareRules, setFareRules] = useState<FareRule[]>([]);

  const [selectedFareRule, setSelectedFareRule] =
    useState<FareRule | null>(null);

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
        message.error("Không thể tải dữ liệu");
      }
    };

    fetchData();
  }, []);

  const handleFindFareRule = () => {
    const journeyId =
      form.getFieldValue("journey");

    const busId =
      form.getFieldValue("bus");

    if (!journeyId || !busId) return;

    const bus = buses.find(
      (x) => x._id === busId
    );

    if (!bus) return;

    const rule = fareRules.find(
      (f) =>
        f.journey?._id === journeyId &&
        f.capacity === bus.capacity
    );

    if (rule) {
      setSelectedFareRule(rule);

      form.setFieldValue(
        "fareRule",
        rule._id
      );
    } else {
      setSelectedFareRule(null);

      form.setFieldValue(
        "fareRule",
        undefined
      );

      message.warning(
        "Không tìm thấy bảng giá phù hợp"
      );
    }
  };

  const onFinish = async (values: any) => {
    try {
      const payload = {
        journey: values.journey,
        bus: values.bus,
        staff: values.staff,
        fareRule: values.fareRule,

        departureHour:
          values.departureHour,

        arrivalHour:
          values.arrivalHour,

        weekdays: values.weekdays,

        startDate:
          values.startDate?.format(
            "YYYY-MM-DD"
          ),

        endDate:
          values.endDate?.format(
            "YYYY-MM-DD"
          ),

        status: values.status,
      };

      const res = await axios.post(
        "http://localhost:3000/api/trip/generate",
        payload
      );

      message.success(
        res.data.message
      );

      navigate("/admin/trip/list");
    } catch (error: any) {
      message.error(
        error.response?.data?.message ||
          "Tạo lịch thất bại"
      );
    }
  };

  return (
    <div className="p-6">
      <Card>
        <h1 className="text-2xl font-semibold mb-6">
          Thêm lịch chạy xe
        </h1>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="Tuyến đường"
            name="journey"
            rules={[
              {
                required: true,
                message:
                  "Chọn tuyến đường",
              },
            ]}
          >
            <Select
              placeholder="Chọn tuyến"
              onChange={
                handleFindFareRule
              }
            >
              {journeys.map((item) => (
                <Select.Option
                  key={item._id}
                  value={item._id}
                >
                  {item.diemDi} →{" "}
                  {item.diemDen}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Xe"
            name="bus"
            rules={[
              {
                required: true,
                message: "Chọn xe",
              },
            ]}
          >
            <Select
              placeholder="Chọn xe"
              onChange={
                handleFindFareRule
              }
            >
              {buses.map((item) => (
                <Select.Option
                  key={item._id}
                  value={item._id}
                >
                  {item.name} -{" "}
                  {
                    item.licensePlates
                  }
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Nhân viên phụ trách"
            name="staff"
            rules={[
              {
                required: true,
                message:
                  "Chọn nhân viên",
              },
            ]}
          >
            <Select placeholder="Chọn nhân viên">
              {staffs.map((item) => (
                <Select.Option
                  key={item._id}
                  value={item._id}
                >
                  {item.ten} -{" "}
                  {item.chucVu}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

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
                  ? `${selectedFareRule.weekdayPrice.toLocaleString(
                      "vi-VN"
                    )} đ`
                  : ""
              }
            />
          </Form.Item>

          <Form.Item
            label="Giờ khởi hành"
            name="departureHour"
            rules={[
              {
                required: true,
                message:
                  "Nhập giờ khởi hành",
              },
            ]}
          >
            <Input placeholder="07:00" />
          </Form.Item>

          <Form.Item
            label="Giờ đến"
            name="arrivalHour"
            rules={[
              {
                required: true,
                message:
                  "Nhập giờ đến",
              },
            ]}
          >
            <Input placeholder="11:30" />
          </Form.Item>

          <Form.Item
            label="Các ngày chạy"
            name="weekdays"
            rules={[
              {
                required: true,
                message:
                  "Chọn ít nhất 1 ngày",
              },
            ]}
          >
            <Checkbox.Group
              options={[
                {
                  label: "Thứ 2",
                  value: 1,
                },
                {
                  label: "Thứ 3",
                  value: 2,
                },
                {
                  label: "Thứ 4",
                  value: 3,
                },
                {
                  label: "Thứ 5",
                  value: 4,
                },
                {
                  label: "Thứ 6",
                  value: 5,
                },
                {
                  label: "Thứ 7",
                  value: 6,
                },
                {
                  label: "CN",
                  value: 0,
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Từ ngày"
            name="startDate"
            rules={[
              {
                required: true,
                message:
                  "Chọn ngày bắt đầu",
              },
            ]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            label="Đến ngày"
            name="endDate"
            rules={[
              {
                required: true,
                message:
                  "Chọn ngày kết thúc",
              },
            ]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
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
            Tạo lịch chạy
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default TripAddPage;