import {Button,Form,Select,Input,Card,message,} from "antd";
import { useState } from "react";
import { useCRUD } from "../../../hooks/useCRUD";

type SeatType = {
  seatCode: string;
  status: "AVAILABLE" | "HOLDING" | "BOOKED";
};

type TripType = {
  _id: string;
  journey?: { diemDi: string; diemDen: string };
  staff?: { ten: string };
  ticketPrice: number;
  status: "sắp chạy" | "đang chạy" | "hoàn thành" | "huỷ";
  seats: SeatType[];
};

// Các trạng thái chuyến còn cho phép đặt vé
const BOOKABLE_STATUSES = ["sắp chạy", "đang chạy"];

function BookingAddPage() {
  const [form] = Form.useForm();

  const { list: users } = useCRUD("tk");
  const { list: trips } = useCRUD("trip");
  const { Add } = useCRUD("booking");

  const [selectedTrip, setSelectedTrip] = useState<TripType | null>(null);
  const [total, setTotal] = useState(0);

  const bookableTrips = (trips || []).filter((t: TripType) =>
    BOOKABLE_STATUSES.includes(t.status)
  );

  const availableSeats = (selectedTrip?.seats || []).filter(
    (s: SeatType) => s.status === "AVAILABLE"
  );

  const changeTrip = (id: string) => {
    const trip = (trips || []).find((x: TripType) => x._id === id) || null;

    setSelectedTrip(trip);
    setTotal(0);

    // Reset ghế đã chọn trước đó vì đổi sang chuyến khác (sơ đồ ghế khác nhau)
    form.setFieldValue("seats", undefined);

    if (
      trip &&
      trip.seats.filter((s: SeatType) => s.status === "AVAILABLE").length === 0
    ) {
      message.warning("Chuyến xe này đã hết ghế trống");
    }
  };

  const changeSeats = (seats: string[]) => {
    const price = selectedTrip?.ticketPrice || 0;
    setTotal(seats.length * price);
  };

  const onFinish = (values: any) => {
    if (!selectedTrip) {
      message.error("Vui lòng chọn chuyến xe");
      return;
    }

    // Đề phòng trường hợp danh sách ghế đã thay đổi (người khác vừa đặt) trong
    // lúc mình đang điền form - kiểm tra lại lần cuối trước khi gửi lên server
    const stillAvailable = values.seats.every((code: string) =>
      selectedTrip.seats.some(
        (s) => s.seatCode === code && s.status === "AVAILABLE"
      )
    );

    if (!stillAvailable) {
      message.error(
        "Một số ghế bạn chọn vừa có người khác đặt, vui lòng chọn lại"
      );
      return;
    }

    Add({
      user: values.user,
      trip: values.trip,
      seats: values.seats,
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
            <Select
              placeholder="Chọn khách hàng"
              showSearch
              optionFilterProp="children"
            >
              {(users || []).map((u: any) => (
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
              showSearch
              optionFilterProp="children"
              notFoundContent="Không có chuyến nào đang mở bán"
            >
              {bookableTrips.map((t: TripType) => (
                <Select.Option
                  key={t._id}
                  value={t._id}
                >
                  {t.journey?.diemDi}
                  {" → "}
                  {t.journey?.diemDen}
                  {" | "}
                  {t.ticketPrice?.toLocaleString("vi-VN")}
                  đ
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Nhân viên phụ trách">
            <Input value={selectedTrip?.staff?.ten || ""} disabled />
          </Form.Item>

          <Form.Item
            label="Ghế"
            name="seats"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng chọn ít nhất 1 ghế",
              },
            ]}
            extra={
              selectedTrip
                ? `Còn ${availableSeats.length} ghế trống`
                : "Chọn chuyến xe trước để xem sơ đồ ghế"
            }
          >
            <Select
              mode="multiple"
              placeholder="Chọn ghế"
              disabled={!selectedTrip || availableSeats.length === 0}
              onChange={changeSeats}
              notFoundContent="Chuyến này đã hết ghế trống"
            >
              {availableSeats.map((s) => (
                <Select.Option key={s.seatCode} value={s.seatCode}>
                  {s.seatCode}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Đơn giá">
            <Input
              value={(selectedTrip?.ticketPrice || 0).toLocaleString(
                "vi-VN"
              )}
              disabled
            />
          </Form.Item>

          <Form.Item label="Tổng tiền">
            <Input
              value={total.toLocaleString("vi-VN")}
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