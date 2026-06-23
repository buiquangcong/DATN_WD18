import {Table,Button,Space,Tag,Modal,Popconfirm,} from "antd";
import { useCRUD, useDetail } from "../../../hooks/useCRUD";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";

interface BookingType {
  _id: string;

  user: {
    _id: string;
    username: string;
    email: string;
  };

  trip: {
    _id: string;
    departureTime: string;

    journey: {
      diemDi: string;
      diemDen: string;
      price: number;
    };
  };

  seats: string[];

  totalPrice: number;

  status:
    | "Chờ xác nhận"
    | "Đã xác nhận"
    | "Đã huỷ"
    | "Hoàn thành";

  createdAt: string;
}

function BookingListPage() {
  const navigate = useNavigate();

  const { list, Delete } = useCRUD("booking");

  const [selectedId, setSelectedId] =
    useState<string>();

  const [open, setOpen] = useState(false);

  const { data: booking } = useDetail(
    "booking",
    selectedId
  );

  useEffect(() => {
    if (booking) {
      setOpen(true);
    }
  }, [booking]);

  const columns: ColumnsType<BookingType> = [
    {
      title: "STT",
      render: (_, __, index) => index + 1,
    },

    {
      title: "Khách hàng",
      render: (_, record) =>
        record.user?.username,
    },

    {
      title: "Tuyến đường",
      render: (_, record) => (
        <>
          {record.trip?.journey?.diemDi}
          {" → "}
          {record.trip?.journey?.diemDen}
        </>
      ),
    },

    {
      title: "Số vé",
      render: (_, record) => (
        <Tag color="blue">
          {record.seats?.length} vé
        </Tag>
      ),
    },

    {
      title: "Tổng tiền",
      render: (_, record) => (
        <span className="text-green-600 font-semibold">
          {record.totalPrice?.toLocaleString(
            "vi-VN"
          )} đ
        </span>
      ),
    },

    {
      title: "Trạng thái",
      render: (_, record) => (
        <Tag
          color={
            record.status === "Đã xác nhận"
              ? "green"
              : record.status === "Đã huỷ"
              ? "red"
              : record.status ===
                "Hoàn thành"
              ? "blue"
              : "orange"
          }
        >
          {record.status}
        </Tag>
      ),
    },

    {
      title: "Ngày đặt",
      render: (_, record) =>
        new Date(
          record.createdAt
        ).toLocaleString("vi-VN"),
    },

    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button
            onClick={() =>
              setSelectedId(record._id)
            }
          >
            Chi tiết
          </Button>

          <Button
            type="primary"
            onClick={() =>
              navigate(`/admin/booking/edit/${record._id}`)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa đơn đặt vé?"
            okText="Có"
            cancelText="Không"
            onConfirm={() =>
              Delete(record._id)
            }
          >
            <Button danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between mb-5">
        <h1 className="text-2xl font-bold">
          Quản lý đặt vé
        </h1>

        <Button
          type="primary"
          onClick={() =>
            navigate("/admin/booking/add")
          }
        >
          Thêm đơn đặt vé
        </Button>
      </div>

      <Table
        rowKey="_id"
        dataSource={list}
        columns={columns}
      />

      <Modal
        open={open}
        footer={null}
        width={700}
        title="Chi tiết đặt vé"
        onCancel={() => {
          setOpen(false);
          setSelectedId(undefined);
        }}
      >
        {booking && (
          <div className="space-y-4">
            <div>
              <b>Khách hàng:</b>{" "}
              {booking.user?.username}
            </div>

            <div>
              <b>Email:</b>{" "}
              {booking.user?.email}
            </div>

            <div>
              <b>Tuyến đường:</b>{" "}
              {booking.trip?.journey?.diemDi}
              {" → "}
              {booking.trip?.journey?.diemDen}
            </div>

            <div>
              <b>Ngày khởi hành:</b>{" "}
              {new Date(
                booking.trip?.departureTime
              ).toLocaleString("vi-VN")}
            </div>

            <div>
              <b>Ghế đã đặt:</b>{" "}
              {booking.seats?.join(", ")}
            </div>

            <div>
              <b>Số lượng vé:</b>{" "}
              {booking.seats?.length}
            </div>

            <div>
              <b>Tổng tiền:</b>{" "}
              {booking.totalPrice?.toLocaleString(
                "vi-VN"
              )} đ
            </div>

            <div>
              <b>Trạng thái:</b>

              <Tag
                className="ml-2"
                color={
                  booking.status ===
                  "Đã xác nhận"
                    ? "green"
                    : booking.status ===
                      "Đã huỷ"
                    ? "red"
                    : booking.status ===
                      "Hoàn thành"
                    ? "blue"
                    : "orange"
                }
              >
                {booking.status}
              </Tag>
            </div>

            <div>
              <b>Ngày đặt:</b>{" "}
              {new Date(
                booking.createdAt
              ).toLocaleString("vi-VN")}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default BookingListPage;