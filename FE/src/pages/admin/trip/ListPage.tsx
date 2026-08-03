import { Popconfirm, Space, Table, Button, Tag, Modal, Divider, Input, Select, Card } from "antd";
import { useCRUD, useDetail } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { useState, useEffect } from "react";
import dayjs from "dayjs";

interface DiemType {
  _id?: string;
  diaDiem: string;
  offsetMinutes: number;
}

interface JourneyType {
  _id: string;
  diemDi: string;
  diemDen: string;
  quangDuong?: number;
  thoiGianDiChuyen?: string;
  diemDon?: DiemType[];
  diemTra?: DiemType[];
}

interface BusType {
  _id: string;
  name: string;
  licensePlates: string;
  capacity: number;
  type?: string;
  status?: string;
}

interface FareRuleType {
  _id: string;
  weekdayPrice: number;
  weekendPrice: number;
  holidayPrice: number;
  capacity: number;
}

interface staffType {
  _id: string;
  ten: string;
  email: string;
  sdt: string;
  cccd: string;
  chucVu: string;
}

interface TripType {
  _id: string;
  journey: JourneyType;
  bus: BusType;
  staff: staffType;
  fareRule: FareRuleType;
  departureTime: string;
  ticketPrice: number;
  arrivalTime: string;
  status: "sắp chạy" | "đang chạy" | "hoàn thành" | "huỷ";

  seats: {
    seatCode: string;
    status: "AVAILABLE" | "HOLDING" | "BOOKED";
  }[];
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

function TripListPage() {
  const navigate = useNavigate();
  const { list, Delete } = useCRUD("trip");
  const { list: bookings } = useCRUD("booking");

  const [selectedId, setSelectedId] = useState<string>();
  const [open, setOpen] = useState(false);

  // State cho modal danh sách khách đặt vé (bấm vào ô Số ghế)
  const [selectedBookingTripId, setSelectedBookingTripId] = useState<string>();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // State quản lý tìm kiếm và bộ lọc trạng thái
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const { data: trip, isLoading } = useDetail("trip", selectedId);

  useEffect(() => {
    if (trip) setOpen(true);
  }, [trip]);

  const handleView = (id: string) => {
    setSelectedId(id);
  };

  const handleViewBookings = (tripId: string) => {
    setSelectedBookingTripId(tripId);
    setBookingModalOpen(true);
  };

  const statusColorMap: Record<string, string> = {
    "sắp chạy": "blue",
    "đang chạy": "green",
    "hoàn thành": "gray",
    "huỷ": "red",
  };

  // Logic lọc dữ liệu
  const filteredList = list?.filter((item: TripType) => {
    const searchLower = searchText.toLowerCase().trim();

    const matchesSearch =
      !searchLower ||
      item.journey?.diemDi?.toLowerCase().includes(searchLower) ||
      item.journey?.diemDen?.toLowerCase().includes(searchLower) ||
      item.bus?.name?.toLowerCase().includes(searchLower) ||
      item.bus?.licensePlates?.toLowerCase().includes(searchLower) ||
      item.staff?.ten?.toLowerCase().includes(searchLower);

    const matchesStatus =
      selectedStatus === "All" || item.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const selectedBookingTrip = (list || []).find(
    (t: TripType) => t._id === selectedBookingTripId
  );

  const tripBookings = (bookings || []).filter(
    (b: BookingType) => b.trip?._id === selectedBookingTripId
  );

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
  ];

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
        <span>{time ? new Date(time).toLocaleString("vi-VN") : "---"}</span>
      ),
    },
    {
      title: "Thời gian đến",
      render: (_, record) =>
        record.arrivalTime
          ? new Date(record.arrivalTime).toLocaleString("vi-VN")
          : "---",
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
      title: "Số ghế",
      render: (_, record) => {
        const booked =
          record.seats?.filter((seat) => seat.status === "BOOKED").length || 0;
        const total = record.bus?.capacity || 0;

        return (
          <Tag
            color="blue"
            className="cursor-pointer hover:opacity-75"
            onClick={() => handleViewBookings(record._id)}
          >
            {booked}/{total}
          </Tag>
        );
      },
    },
    {
      title: "Nhân viên",
      render: (_, record) => (
        <span>{record.staff?.ten || "Chưa phân công"}</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: string) => (
        <Tag color={statusColorMap[status] || "default"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleView(record._id)}>Xem</Button>

          <Button
            type="primary"
            onClick={() => navigate(`/admin/trip/edit/${record._id}`)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xoá chuyến xe"
            onConfirm={() => Delete(record._id)}
            okText="Có"
            cancelText="Không"
            okButtonProps={{ danger: true }}
          >
            <Button danger>Xoá</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Chuyến Đi</h1>
          <p className="text-sm text-gray-500">
            Quản lý thông tin lịch trình, xe, tài xế và giá vé cho từng chuyến.
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          className="bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm font-semibold rounded-lg"
          onClick={() => navigate("/admin/trip/add")}
        >
          Thêm Chuyến Mới
        </Button>
      </div>

      {/* CARD BỘ LỌC VÀ BẢNG */}
      <Card className="shadow-xs border border-gray-100 rounded-xl bg-white">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input.Search
              placeholder="Tìm theo tuyến đường, tên xe, biển số hoặc nhân viên..."
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
                { value: "sắp chạy", label: "Sắp chạy" },
                { value: "đang chạy", label: "Đang chạy" },
                { value: "hoàn thành", label: "Hoàn thành" },
                { value: "huỷ", label: "Huỷ" },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredList}
            rowKey="_id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng số ${total} chuyến đi`,
            }}
          />
        </div>
      </Card>

      {/* MODAL CHI TIẾT */}
      <Modal
        title={
          trip
            ? `${trip.journey?.diemDi ?? ""} → ${trip.journey?.diemDen ?? ""}`
            : "Chi tiết chuyến"
        }
        open={open}
        onCancel={() => {
          setOpen(false);
          setSelectedId(undefined);
        }}
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
        width={900}
      >
        {!trip ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Tuyến đường</p>
                <p className="font-medium">
                  {trip.journey?.diemDi} → {trip.journey?.diemDen}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Quãng đường</p>
                <p>{trip.journey?.quangDuong} km</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Thời gian di chuyển</p>
                <p>{trip.journey?.thoiGianDiChuyen}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Giá ngày thường</p>
                <p className="text-green-600 font-semibold">
                  {trip.ticketPrice?.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Giá cuối tuần</p>
                <p className="text-orange-600 font-semibold">
                  {trip.fareRule?.weekendPrice?.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Giá ngày lễ</p>
                <p className="text-red-600 font-semibold">
                  {trip.fareRule?.holidayPrice?.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Thời gian khởi hành</p>
                <p>{new Date(trip.departureTime).toLocaleString("vi-VN")}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Trạng thái chuyến</p>
                <Tag color={statusColorMap[trip.status]}>
                  {trip.status}
                </Tag>
              </div>
            </div>

            <Divider />

            {/* BUS INFO */}
            <div>
              <h3 className="font-semibold mb-2">Thông tin xe</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Tên xe</p>
                  <p>{trip.bus?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Biển số</p>
                  <p>{trip.bus?.licensePlates}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Số ghế</p>
                  <p>{trip.bus?.capacity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Loại xe</p>
                  <p>{trip.bus?.type || "Không có"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Trạng thái xe</p>
                  <p>{trip.bus?.status}</p>
                </div>
              </div>
            </div>

            <Divider />

            {/* PICKUP POINTS */}
            <div>
              <h3 className="font-semibold mb-2">Điểm đón</h3>
              <div className="space-y-1">
                {trip.journey?.diemDon?.map((item: DiemType, index: number) => (
                  <p key={item._id || index}>
                    🕒{" "}
                    {dayjs(trip.departureTime)
                      .add(item.offsetMinutes, "minute")
                      .format("DD/MM/YYYY HH:mm")}{" "}
                    - 📍 {item.diaDiem}
                  </p>
                ))}
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="font-semibold mb-2">Điểm trả</h3>
              <div className="space-y-1">
                {trip.journey?.diemTra?.map((item: DiemType, index: number) => (
                  <p key={item._id || index}>
                    🕒{" "}
                    {dayjs(trip.arrivalTime)
                      .subtract(item.offsetMinutes, "minute")
                      .format("DD/MM/YYYY HH:mm")}{" "}
                    - 📍 {item.diaDiem}
                  </p>
                ))}
              </div>
            </div>

            <Divider />

            <div>
              <h3 className="font-semibold mb-2">Nhân viên phụ trách</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Họ tên</p>
                  <p>{trip.staff?.ten}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p>{trip.staff?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Số điện thoại</p>
                  <p>{trip.staff?.sdt}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">CCCD</p>
                  <p>{trip.staff?.cccd}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Chức vụ</p>
                  <p>{trip.staff?.chucVu}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL DANH SÁCH KHÁCH ĐẶT VÉ - mở khi bấm vào ô Số ghế */}
      <Modal
        title={
          selectedBookingTrip
            ? `Danh sách khách đặt vé: ${selectedBookingTrip.journey?.diemDi} → ${selectedBookingTrip.journey?.diemDen}`
            : "Danh sách khách đặt vé"
        }
        open={bookingModalOpen}
        onCancel={() => {
          setBookingModalOpen(false);
          setSelectedBookingTripId(undefined);
        }}
        footer={
          <Button
            onClick={() => {
              setBookingModalOpen(false);
              setSelectedBookingTripId(undefined);
            }}
          >
            Đóng
          </Button>
        }
        width={900}
      >
        {selectedBookingTrip && (
          <div className="mb-4 text-sm text-gray-500">
            Khởi hành:{" "}
            {new Date(selectedBookingTrip.departureTime).toLocaleString("vi-VN")}{" "}
            — Xe: {selectedBookingTrip.bus?.name} (
            {selectedBookingTrip.bus?.licensePlates})
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

export default TripListPage;