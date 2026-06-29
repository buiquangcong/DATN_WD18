import {
  Button,
  Form,
  Select,
  Input,
  Card,
} from "antd";
import { useState } from "react";
import { useCRUD } from "../../../hooks/useCRUD";

function BookingAddPage() {
  const [form] = Form.useForm();

  const { list: users } = useCRUD("tk");
  const { list: trips } = useCRUD("trip");
  const { Add } = useCRUD("booking");

  const [price, setPrice] = useState(0);
  const [total, setTotal] = useState(0);
  const [staffName, setStaffName] =
    useState("");

  const changeTrip = (id: string) => {
  const trip = trips.find(
    (x: any) => x._id === id
  );

  if (!trip) return;

  const departureDate = new Date(
    trip.departureTime
  );

  const day = departureDate.getDay();

  let ticketPrice =
    trip.fareRule?.weekdayPrice || 0;

  // Thứ 7 hoặc Chủ nhật
  if (day === 0 || day === 6) {
    ticketPrice =
      trip.fareRule?.weekendPrice ||
      ticketPrice;
  }

  setPrice(ticketPrice);

  setStaffName(
    trip.staff?.ten || ""
  );

  const currentSeats =
    form.getFieldValue("seats");

  if (currentSeats) {
    const seatArr = currentSeats
      .split(",")
      .filter((x: string) => x.trim());

    setTotal(
      seatArr.length * ticketPrice
    );
  }
};

  const changeSeat = (e: any) => {
    const seats = e.target.value
      .split(",")
      .filter((x: string) => x.trim());

    setTotal(
      seats.length * price
    );
  };

  const onFinish = (values: any) => {
    Add({
      user: values.user,
      trip: values.trip,
      seats: values.seats
        .split(",")
        .map((x: string) => x.trim()),
      totalPrice: total,
      status: "Chờ xác nhận",
    });
  };

  return (
    <div className="p-6">
      <Card title="Thêm đơn đặt vé">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="Khách hàng"
            name="user"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng chọn khách hàng",
              },
            ]}
          >
            <Select placeholder="Chọn khách hàng">
              {users.map((u: any) => (
                <Select.Option
                  key={u._id}
                  value={u._id}
                >
                  {u.username}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Chuyến xe"
            name="trip"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng chọn chuyến xe",
              },
            ]}
          >
            <Select
              placeholder="Chọn chuyến xe"
              onChange={changeTrip}
            >
              {trips.map((t: any) => (
                <Select.Option
                  key={t._id}
                  value={t._id}
                >
                  {t.journey?.diemDi}
                  {" → "}
                  {t.journey?.diemDen}
                  {" | "}
                  {t.fareRule?.weekdayPrice?.toLocaleString(
                    "vi-VN"
                  )}
                  đ
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="staff"
            hidden
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Nhân viên phụ trách"
          >
            <Input
              value={staffName}
              disabled
            />
          </Form.Item>

          <Form.Item
            label="Ghế"
            name="seats"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng nhập ghế",
              },
            ]}
          >
            <Input
              placeholder="VD: A1,A2"
              onChange={changeSeat}
            />
          </Form.Item>

          <Form.Item label="Đơn giá">
            <Input
              value={price.toLocaleString(
                "vi-VN"
              )}
              disabled
            />
          </Form.Item>

          <Form.Item label="Tổng tiền">
            <Input
              value={total.toLocaleString(
                "vi-VN"
              )}
              disabled
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
          >
            Đặt vé
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default BookingAddPage;