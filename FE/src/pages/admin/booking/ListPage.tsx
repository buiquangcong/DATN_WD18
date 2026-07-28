import { Table, Button, Space, Tag, Modal, Popconfirm } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";

interface TripType {
  _id: string;

  journey?: {
    diemDi: string;
    diemDen: string;
  };

  bus?: {
    name: string;
    licensePlates: string;
    capacity: number;
  };

  staff?: {
    ten: string;
  };

  departureTime: string;
  arrivalTime: string;
  ticketPrice: number;

  status: "sắp chạy" | "đang chạy" | "hoàn thành" | "huỷ";
}

interface BookingType {
  _id: string;

  user?: {
    _id: string;
    username: string;
    email: string;
  };

  trip?: {
    _id: string;
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

const bookingStatusColorMap: Record<string, string> = {
  "Đã xác nhận": "green",
  "Đã huỷ": "red",
  "Hoàn thành": "blue",
  "Chờ xác nhận": "orange",
};

const tripStatusColorMap: Record<string, string> = {
  "sắp chạy": "blue",
  "đang chạy": "green",
  "hoàn thành": "gray",
  "huỷ": "red",
};

function BookingListPage() {
  const navigate = useNavigate();

  const { list: trips } = useCRUD("trip");
  const { list: bookings, Delete } = useCRUD("booking");

  const [selectedTripId, setSelectedTripId] = useState<string | undefined>();
  const [open, setOpen] = useState(false);

  const selectedTrip = (trips || []).find(
    (t: TripType) => t._id === selectedTripId
  );

  const tripBookings = (bookings || []).filter(
    (b: BookingType) => b.trip?._id === selectedTripId
  );

  const handleViewDetail = (tripId: string) => {
    setSelectedTripId(tripId);
    setOpen(true);
  };

  const getBookingCount = (tripId: string) =>
    (bookings || []).filter((b: BookingType) => b.trip?._id === tripId).length;

  const columns: ColumnsType<TripType> = [
    {
      title: "Tuyến đường",
      render: (_, record) => (
        <strong>
          {record.journey?.diemDi} → {record.journey?.diemDen}
        </strong>
      ),
    },
    {
      title: "Xe",
      render: (_, record) => (
        <span>
          {record.bus?.name} ({record.bus?.licensePlates})
        </span>
      ),
    },
    {
      title: "Thời gian khởi hành",
      dataIndex: "departureTime",
      render: (time: string) => (
        <span>{new Date(time).toLocaleString("vi-VN")}</span>
      ),
    },
    {
      title: "Giá vé",
      render: (_, record) => (
        <span className="text-green-600 font-medium">
          {record.ticketPrice?.toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      title: "Nhân viên",
      render: (_, record) => (
        <span>{record.staff?.ten || "Chưa phân công"}</span>
      ),
    },
    {
      title: "Số đơn đặt vé",
      render: (_, record) => (
        <Tag color="blue">{getBookingCount(record._id)} đơn</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: string) => (
        <Tag color={tripStatusColorMap[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Button onClick={() => handleViewDetail(record._id)}>
          Xem chi tiết
        </Button>
      ),
    },
  ];

  const bookingColumns: ColumnsType<BookingType> = [
    {
      title: "Khách hàng",
      render: (_, record) => record.user?.username || "Hành khách NETBUS",
    },
    {
      title: "Email",
      render: (_, record) => record.user?.email || "Chưa cập nhật",
    },
    {
      title: "Ghế",
      render: (_, record) => (
        <Tag color="blue">{record.seats?.join(", ") || "Chưa chọn"}</Tag>
      ),
    },
    {
      title: "Tổng tiền",
      render: (_, record) => (
        <span className="text-green-600 font-semibold">
          {(record.totalPrice || 0).toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      title: "Trạng thái",
      render: (_, record) => (
        <Tag color={bookingStatusColorMap[record.status] || "orange"}>
          {record.status || "Chờ xác nhận"}
        </Tag>
      ),
    },
    {
      title: "Ngày đặt",
      render: (_, record) =>
        record.createdAt
          ? new Date(record.createdAt).toLocaleString("vi-VN")
          : "Đang cập nhật...",
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => navigate(`/admin/booking/edit/${record._id}`)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa đơn đặt vé?"
            okText="Có"
            cancelText="Không"
            onConfirm={() => Delete(record._id)}
          >
            <Button size="small" danger>
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
        <h1 className="text-2xl font-bold">Quản lý đặt vé theo chuyến</h1>

        <Button
          type="primary"
          onClick={() => navigate("/admin/booking/add")}
        >
          Thêm đơn đặt vé
        </Button>
      </div>

      <Table
        rowKey="_id"
        dataSource={trips}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        open={open}
        footer={
          <Button
            onClick={() => {
              setOpen(false);
              setSelectedTripId(undefined);
            }}
          >
            Đóng
          </Button>
        }
        width={900}
        title={
          selectedTrip
            ? `Danh sách khách đặt vé: ${selectedTrip.journey?.diemDi} → ${selectedTrip.journey?.diemDen}`
            : "Danh sách khách đặt vé"
        }
        onCancel={() => {
          setOpen(false);
          setSelectedTripId(undefined);
        }}
      >
        {selectedTrip && (
          <div className="mb-4 text-sm text-gray-500">
            Khởi hành:{" "}
            {new Date(selectedTrip.departureTime).toLocaleString("vi-VN")} —
            Xe: {selectedTrip.bus?.name} ({selectedTrip.bus?.licensePlates})
          </div>
        )}

        <Table
          rowKey="_id"
          dataSource={tripBookings}
          columns={bookingColumns}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: "Chưa có khách nào đặt vé chuyến này" }}
        />
      </Modal>
    </div>
  );
}

export default BookingListPage;