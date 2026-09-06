import React, { useEffect, useMemo } from "react";
import {
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Card,
  Alert,
  Tag,
  message,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useCRUD, useDetail } from "../../../hooks/useCRUD";

function BookingEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { Edit } = useCRUD("booking");
  const { data: booking, isLoading } = useDetail("booking", id);
  const [form] = Form.useForm();

  // Kiểm tra đơn đặt vé hiện tại đã ở trạng thái Đã check-in hay chưa
  const isCheckedIn = useMemo(() => {
    return (
      booking?.status === "Đã check-in" ||
      booking?.status === "Đã checkin"
    );
  }, [booking?.status]);

  useEffect(() => {
    if (booking) {
      form.setFieldsValue({
        user: typeof booking.user === "object" ? booking.user?._id : booking.user,
        trip: typeof booking.trip === "object" ? booking.trip?._id : booking.trip,
        seats: Array.isArray(booking.seats)
          ? booking.seats.join(", ")
          : booking.seats,
        totalPrice: booking.totalPrice,
        status: booking.status || "Chờ xác nhận",
      });
    }
  }, [booking, form]);

  const onFinish = async (values: any) => {
    if (!id) return;

    // Validate: Nếu đơn đặt vé đã check-in thì không thể thay đổi trạng thái
    if (isCheckedIn && values.status !== booking?.status) {
      message.error(
        "Đơn đặt vé đã ở trạng thái Đã check-in, không thể sửa trạng thái!"
      );
      return;
    }

    const seatsArray =
      typeof values.seats === "string"
        ? values.seats
            .split(",")
            .map((x: string) => x.trim())
            .filter(Boolean)
        : values.seats;

    await Edit({
      id: id,
      ...values,
      status: isCheckedIn ? booking?.status : values.status,
      seats: seatsArray,
    });
    navigate("/admin/booking/list");
  };

  return (
    <div className="p-6 max-w-3xl">
      <Card title="Sửa Đơn Đặt Vé" loading={isLoading}>
        {isCheckedIn && (
          <Alert
            message="Đơn đặt vé đã Check-in"
            description="Vé này đã hoàn tất thủ tục check-in lên xe. Trạng thái đơn đặt vé đã được khóa và không thể chỉnh sửa."
            type="warning"
            showIcon
            className="mb-6"
          />
        )}

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="ID Khách Hàng"
            name="user"
            rules={[{ required: true, message: "Vui lòng nhập ID khách hàng" }]}
          >
            <Input placeholder="Mã ID khách hàng" />
          </Form.Item>

          <Form.Item
            label="ID Chuyến Xe"
            name="trip"
            rules={[{ required: true, message: "Vui lòng nhập ID chuyến xe" }]}
          >
            <Input placeholder="Mã ID chuyến xe" />
          </Form.Item>

          <Form.Item
            label="Danh Sách Ghế (phân tách bởi dấu phẩy)"
            name="seats"
            rules={[{ required: true, message: "Vui lòng nhập mã ghế" }]}
          >
            <Input placeholder="VD: A1, A2" />
          </Form.Item>

          <Form.Item
            label="Tổng Tiền (VNĐ)"
            name="totalPrice"
            rules={[{ required: true, message: "Vui lòng nhập tổng tiền" }]}
          >
            <InputNumber
              className="w-full"
              min={0}
              addonAfter="đ"
            />
          </Form.Item>

          <Form.Item
            label={
              <div className="flex items-center gap-2">
                <span>Trạng Thái</span>
                {isCheckedIn && (
                  <Tag color="blue">Đã check-in (Khóa sửa)</Tag>
                )}
              </div>
            }
            name="status"
            help={
              isCheckedIn ? (
                <span className="text-amber-600 text-xs">
                  * Đơn vé đã ở trạng thái đã check-in, không thể thay đổi trạng thái.
                </span>
              ) : undefined
            }
            rules={[
              {
                validator: async (_, value) => {
                  if (isCheckedIn && value !== booking?.status) {
                    return Promise.reject(
                      new Error(
                        "Không thể thay đổi trạng thái khi vé đã check-in!"
                      )
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Select disabled={isCheckedIn}>
              <Select.Option value="Chờ xác nhận">Chờ xác nhận</Select.Option>
              <Select.Option value="Đã xác nhận">Đã xác nhận</Select.Option>
              <Select.Option value="Đã check-in">Đã check-in</Select.Option>
              <Select.Option value="Đã huỷ">Đã huỷ</Select.Option>
              <Select.Option value="Hoàn thành">Hoàn thành</Select.Option>
              <Select.Option value="Yêu cầu hoàn tiền">
                Yêu cầu hoàn tiền
              </Select.Option>
              <Select.Option value="Đã hoàn tiền">Đã hoàn tiền</Select.Option>
            </Select>
          </Form.Item>

          <div className="flex items-center gap-3 pt-4">
            <Button type="primary" htmlType="submit">
              Lưu Thay Đổi
            </Button>
            <Button onClick={() => navigate(-1)}>Hủy</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default BookingEditPage;