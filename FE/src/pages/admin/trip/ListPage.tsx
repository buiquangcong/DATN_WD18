import {Popconfirm,Space,Table,Button,Tag,Modal,Divider,} from "antd";
import { useCRUD, useDetail } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { useState, useEffect } from "react";

interface JourneyType {
  _id: string;
  diemDi: string;
  diemDen: string;
  price: number;
}

interface BusType {
  _id: string;
  name: string;
  licensePlates: string; 
  capacity: number;      
}

interface TripType {
  _id: string;
  journey: JourneyType;
  bus: BusType;
  departureTime: string;
  status: "sắp chạy" | "đang chạy" | "hoàn thành" | "huỷ";
}

function TripListPage() {
  const navigate = useNavigate();
  const { list, Delete } = useCRUD("trip");

  const [selectedId, setSelectedId] = useState<string>();
  const [open, setOpen] = useState(false);

  const { data: trip, isLoading } = useDetail("trip", selectedId);

  useEffect(() => {
    if (trip) setOpen(true);
  }, [trip]);

  const handleView = (id: string) => {
    setSelectedId(id);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedId(undefined);
  };

  const statusColorMap: Record<string, string> = {
    "sắp chạy": "blue",
    "đang chạy": "green",
    "hoàn thành": "gray",
    "huỷ": "red",
  };

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
          {record.journey?.price?.toLocaleString("vi-VN")} đ
        </span>
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
          <Button onClick={() => handleView(record._id)}>
            Xem
          </Button>

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
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          Quản Lý Chuyến đi
        </h1>

        <Button
          type="primary"
          onClick={() => navigate("/admin/trip/add")}
        >
          Thêm Chuyến Mới
        </Button>
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
        dataSource={list}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
      />

      {/* MODAL */}
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
          <p className="text-xs text-gray-400">Giá vé</p>
          <p className="text-green-600 font-semibold">
            {trip.journey?.price?.toLocaleString("vi-VN")} đ
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400">Thời gian khởi hành</p>
          <p>
            {new Date(trip.departureTime).toLocaleString("vi-VN")}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400">Trạng thái chuyến</p>
          <Tag color={statusColorMap[trip.status]}>
            {trip.status}
          </Tag>
        </div>
      </div>

      <Divider />

      {/* ===== BUS INFO ===== */}
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

      {/* ===== PICKUP POINTS ===== */}
      <div>
        <h3 className="font-semibold mb-2">Điểm đón</h3>
        <div className="space-y-1">
          {trip.journey?.diemDon?.map((item: any) => (
            <p key={item._id}>
              🕒 {item.thoiGian} - 📍 {item.diaDiem}
            </p>
          ))}
        </div>
      </div>

      <Divider />

      <div>
        <h3 className="font-semibold mb-2">Điểm trả</h3>
        <div className="space-y-1">
          {trip.journey?.diemTra?.map((item: any) => (
            <p key={item._id}>
              🕒 {item.thoiGian} - 📍 {item.diaDiem}
            </p>
          ))}
        </div>
      </div>

      <Divider />

      

    </div>
  )}
</Modal>
    </div>
  );
}

export default TripListPage;