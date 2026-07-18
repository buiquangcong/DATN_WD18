import { Button, Form, Select, DatePicker, message, Input, Checkbox, Card, Tag, Divider } from "antd";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

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

// Cộng/trừ số phút vào 1 chuỗi giờ "HH:mm", trả về "HH:mm" (có thể tràn qua ngày khác)
const addMinutesToTime = (time: string, minutesToAdd: number) => {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";

  const total = h * 60 + m + minutesToAdd;
  const normalized = ((total % 1440) + 1440) % 1440;

  const hh = String(Math.floor(normalized / 60)).padStart(2, "0");
  const mm = String(normalized % 60).padStart(2, "0");

  const dayOffset = Math.floor(total / 1440);

  return dayOffset !== 0 ? `${hh}:${mm} (${dayOffset > 0 ? "+1 ngày" : "-1 ngày"})` : `${hh}:${mm}`;
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

  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [departureHour, setDepartureHour] = useState("");
  const [arrivalHour, setArrivalHour] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [j, b, s, f] = await Promise.all([
          axios.get("http://localhost:3000/api/journey"),
          axios.get("http://localhost:3000/api/bus"),
          axios.get("http://localhost:3000/api/trip/drivers"),
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

  const handleJourneyChange = (journeyId: string) => {
    const journey = journeys.find((j) => j._id === journeyId) || null;
    setSelectedJourney(journey);
    handleFindFareRule();
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
  const disabledPastDate = (current: any) => {
    return current && current < new Date().setHours(0, 0, 0, 0);
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
              onChange={handleJourneyChange}
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
  label="Tài xế"
  name="staff"
  rules={[
    {
      required: true,
      message: "Chọn tài xế",
    },
  ]}
>
  <Select placeholder="Chọn tài xế">
    {staffs.map((item) => (
      <Select.Option
        key={item._id}
        value={item._id}
      >
        {item.ten}
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
              {
                pattern: /^([01]\d|2[0-3]):([0-5]\d)$/,
                message: "Định dạng HH:mm",
              },
            ]}
          >
            <Input
              placeholder="07:00"
              onChange={(e) => setDepartureHour(e.target.value)}
            />
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
              {
                pattern: /^([01]\d|2[0-3]):([0-5]\d)$/,
                message: "Định dạng HH:mm",
              },
            ]}
          >
            <Input
              placeholder="11:30"
              onChange={(e) => setArrivalHour(e.target.value)}
            />
          </Form.Item>

          {/* Preview giờ đón/trả thực tế */}
          {selectedJourney && departureHour && arrivalHour && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-medium mb-2">Giờ đón/trả dự kiến theo lịch này</p>

              {selectedJourney.diemDon && selectedJourney.diemDon.length > 0 && (
                <>
                  <p className="text-sm text-gray-500 mb-1">Điểm đón</p>
                  <div className="space-y-1 mb-3">
                    {selectedJourney.diemDon.map((diem, idx) => (
                      <div key={diem._id || idx} className="flex items-center gap-3">
                        <Tag color="blue">
                          {addMinutesToTime(departureHour, diem.offsetMinutes)}
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
                          {addMinutesToTime(arrivalHour, -diem.offsetMinutes)}
                        </Tag>
                        <span className="text-gray-700">{diem.diaDiem}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

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
                message: "Chọn ngày bắt đầu",
              },
            ]}
          >
            <DatePicker
              className="w-full"
              disabledDate={disabledPastDate}
            />
          </Form.Item>

          <Form.Item
            label="Đến ngày"
            name="endDate"
            rules={[
              {
                required: true,
                message: "Chọn ngày kết thúc",
              },
            ]}
          >
            <DatePicker
              className="w-full"
              disabledDate={(current) => {
                const startDate =
                  form.getFieldValue("startDate");

                if (!startDate) {
                  return (
                    current &&
                    current < dayjs().startOf("day")
                  );
                }

                return (
                  current &&
                  current < startDate.startOf("day")
                );
              }}
            />
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