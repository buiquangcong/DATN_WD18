import React, { useState, useEffect } from "react";
import { Table, Button, Space, Tag, Modal, Popconfirm, Input, Select, Card } from "antd";
import { useCRUD, useDetail } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";

interface TripType {
  _id: string;

  journey?: {
    id: string;
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

  trip?: TripType;

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

  const { list, Delete, isLoading } = useCRUD("booking");

  const [selectedId, setSelectedId] = useState<string>();
  const [open, setOpen] = useState(false);

  // State quản lý tìm kiếm và bộ lọc
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const { data: booking } = useDetail("booking", selectedId);

  useEffect(() => {
    if (booking) {
      setOpen(true);
    }
  }, [booking]);

  // Logic lọc danh sách đặt vé
  const filteredList = list?.filter((item: BookingType) => {
    const searchLower = searchText.toLowerCase().trim();

    const matchesSearch =
      !searchLower ||
      item.user?.username?.toLowerCase().includes(searchLower) ||
      item.user?.email?.toLowerCase().includes(searchLower) ||
      item.trip?.journey?.diemDi?.toLowerCase().includes(searchLower) ||
      item.trip?.journey?.diemDen?.toLowerCase().includes(searchLower) ||
      item.seats?.some((seat) => seat.toLowerCase().includes(searchLower));

    const matchesStatus =
      selectedStatus === "All" || item.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const columns: ColumnsType<BookingType> = [
    {
      title: "Khách hàng",
      render: (_, record) => record.user?.username || "Hành khách NETBUS",
    },
    {
      title: "Tuyến đường",
      render: (_, record) => {
        if (!record.trip)
          return <span style={{ color: "#ff4d4f" }}>Chuyến xe không tồn tại</span>;
        return (
          <>
            {record.trip.journey?.diemDi || "Chưa rõ"}
            {" → "}
            {record.trip.journey?.diemDen || "Chưa rõ"}
          </>
        );
      },
    },
    {
      title: "Ghế",
      render: (_, record) => (
        <Tag color="blue">{record.seats?.length || 0} vé</Tag>
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
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            className="rounded-lg shadow-xs"
            onClick={() => setSelectedId(record._id)}
          >
            Xem
          </Button>

          <Button
            type="primary"
            className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-lg font-medium shadow-xs"
            onClick={() => navigate(`/admin/booking/edit/${record._id}`)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa bản ghi này?"
            description="Bạn có chắc chắn muốn xóa không?"
            okText="Có"
            cancelText="Không"
            onConfirm={() => Delete(record._id)}
            okButtonProps={{ danger: true }}
          >
            <Button danger className="rounded-lg shadow-xs">
              Xoá
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Đặt Vé</h1>
          <p className="text-sm text-gray-500">
            Quản lý thông tin đặt vé, trạng thái thanh toán và lịch trình vé khách.
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          className="bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm font-semibold rounded-lg"
          onClick={() => navigate("/admin/booking/add")}
        >
          Thêm Đơn Đặt Vé
        </Button>
      </div>

      {/* Card chứa Bộ lọc và Bảng dữ liệu */}
      <Card className="shadow-xs border border-gray-100 rounded-xl bg-white">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input.Search
              placeholder="Tìm theo tên khách, email, tuyến đường..."
              allowClear
              size="large"
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
              className="w-full"
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              placeholder="Lọc theo trạng thái"
              size="large"
              className="w-full"
              defaultValue="All"
              onChange={(value) => setSelectedStatus(value)}
              options={[
                { value: "All", label: "Tất cả trạng thái" },
                { value: "Chờ xác nhận", label: "Chờ xác nhận" },
                { value: "Đã xác nhận", label: "Đã xác nhận" },
                { value: "Hoàn thành", label: "Hoàn thành" },
                { value: "Đã huỷ", label: "Đã huỷ" },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table
            rowKey="_id"
            dataSource={filteredList}
            columns={columns}
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng số ${total} đơn đặt vé`,
            }}
          />
        </div>
      </Card>

      {/* Modal Chi Tiết */}
      <Modal
        open={open}
        footer={
          <Button
            onClick={() => {
              setOpen(false);
              setSelectedId(undefined);
            }}
          >
            Đóng
          </Button>
        }
        width={600}
        title="Chi tiết đơn đặt vé"
        onCancel={() => {
          setOpen(false);
          setSelectedId(undefined);
        }}
      >
        {booking ? (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Khách hàng</p>
                <p className="font-semibold">{booking.user?.username || "Hành khách NETBUS"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p>{booking.user?.email || "Chưa cập nhật"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Tuyến đường</p>
                <p className="font-semibold text-blue-600">
                  {booking.trip?.journey?.diemDi || "Chưa rõ"} → {booking.trip?.journey?.diemDen || "Chưa rõ"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Thời gian khởi hành</p>
                <p>{booking.trip?.departureTime ? new Date(booking.trip.departureTime).toLocaleString("vi-VN") : "---"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Xe & Biển số</p>
                <p>{booking.trip?.bus?.name || "Chưa rõ"} ({booking.trip?.bus?.licensePlates || "Chưa rõ"})</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Nhân viên phụ trách</p>
                <p>{booking.trip?.staff?.ten || "Chưa phân công"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Số lượng ghế / Mã ghế</p>
                <p className="font-semibold text-emerald-600">
                  {booking.seats?.length || 0} vé ({booking.seats?.join(", ") || "Chưa rõ"})
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Tổng tiền thanh toán</p>
                <p className="font-bold text-red-600 text-lg">
                  {(booking.totalPrice || 0).toLocaleString("vi-VN")} đ
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Trạng thái đơn hàng</p>
                <Tag color={bookingStatusColorMap[booking.status] || "orange"}>
                  {booking.status || "Chờ xác nhận"}
                </Tag>
              </div>
              <div>
                <p className="text-xs text-gray-400">Ngày đặt vé</p>
                <p>{booking.createdAt ? new Date(booking.createdAt).toLocaleString("vi-VN") : "---"}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center py-4">Đang tải chi tiết đơn hàng...</p>
        )}
      </Modal>
    </div>
  );
}

export default BookingListPage;