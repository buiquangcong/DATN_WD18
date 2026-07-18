import { Popconfirm, Space, Table, Button, Tag, Modal, Divider } from "antd";
import { useCRUD, useDetail } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";

interface DiemType {
  _id?: string;
  diaDiem: string;
  offsetMinutes: number;
}

interface JourneyType {
  _id: string;
  diemDi: string;
  diemDen: string;
  quangDuong: string;
  thoiGianDiChuyen: string;
  price: number;
  diemDon: DiemType[];
  diemTra: DiemType[];
  trangThai: boolean;
}

function JourneyListPage() {
  const navigate = useNavigate();
  const { list, Delete } = useCRUD("journey");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const { data: journey } = useDetail("journey", selectedId);

  const handleView = (id: string) => {
    setSelectedId(id);
    setOpen(true);
  };

  const columns: ColumnsType<JourneyType> = [
    {
      title: "Điểm Đi",
      dataIndex: "diemDi",
      key: "diemDi",
      render: (text: string) => <strong className="text-gray-800">{text}</strong>,
    },
    {
      title: "Điểm Đến",
      dataIndex: "diemDen",
      key: "diemDen",
      render: (text: string) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "Quãng Đường",
      dataIndex: "quangDuong",
      key: "quangDuong",
      render: (quangDuong: string) => <span className="text-gray-600">{quangDuong}</span>,
    },
    {
      title: "Thời Gian Di Chuyển",
      dataIndex: "thoiGianDiChuyen",
      key: "thoiGianDiChuyen",
      render: (time: string) => <span className="text-gray-600">{time}</span>,
    },
    {
      title: "Điểm Đón",
      dataIndex: "diemDon",
      key: "diemDon",
      render: (diemDon: DiemType[]) => (
        <span className="text-gray-600">{diemDon?.length} điểm đón</span>
      ),
    },
    {
      title: "Điểm Trả",
      dataIndex: "diemTra",
      key: "diemTra",
      render: (diemTra: DiemType[]) => (
        <span className="text-gray-600">{diemTra?.length} điểm trả</span>
      ),
    },
    {
      title: "Trạng Thái",
      dataIndex: "trangThai",
      key: "trangThai",
      render: (trangThai: boolean) => (
        <Tag color={trangThai ? "green" : "red"}>
          {trangThai ? "Hoạt động" : "Dừng hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Hành Động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button onClick={() => handleView(record._id)}>Xem</Button>
          <Button
            type="primary"
            onClick={() => navigate(`/admin/journey/edit/${record._id}`)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa hành trình này"
            description="Bạn có chắc chắn muốn xóa thông tin hành trình này?"
            onConfirm={() => Delete(record._id)}
            okText="Có"
            cancelText="Không"
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Quản Lý Danh Sách tuyến đường</h1>
        <Button type="primary" size="large" onClick={() => navigate("/admin/journey/add")}>
          Thêm Hành Trình Mới
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-100">
        <Table
          columns={columns}
          dataSource={list}
          rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </div>

      {/* Modal chi tiết */}
      <Modal
        title={`Chi tiết: ${journey?.diemDi ?? ""} → ${journey?.diemDen ?? ""}`}
        open={open}
        onCancel={() => setOpen(false)}
        footer={<Button onClick={() => setOpen(false)}>Đóng</Button>}
        width={700}
      >
        {journey && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-gray-400">Quãng Đường</p><p>{journey.quangDuong} km</p></div>
              <div><p className="text-xs text-gray-400">Thời Gian Di Chuyển</p><p>{journey.thoiGianDiChuyen}</p></div>
              
              <div>
                <p className="text-xs text-gray-400">Trạng Thái</p>
                <Tag color={journey.trangThai ? "green" : "red"}>
                  {journey.trangThai ? "Hoạt động" : "Dừng hoạt động"}
                </Tag>
              </div>
            </div>

            <Divider />

            <div>
              <p className="font-medium mb-2">Điểm Đón ({journey.diemDon?.length} điểm)</p>
              <p className="text-xs text-gray-400 mb-2">Tính từ lúc xe khởi hành</p>
              <div className="space-y-1">
                {journey.diemDon?.map((diem: DiemType, index: number) => (
                  <div key={diem._id || index} className="flex items-center gap-3">
                    <Tag color="blue">
                      {diem.offsetMinutes === 0
                        ? "Ngay khi khởi hành"
                        : `+${diem.offsetMinutes} phút`}
                    </Tag>
                    <span className="text-gray-700">{diem.diaDiem}</span>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            <div>
              <p className="font-medium mb-2">Điểm Trả ({journey.diemTra?.length} điểm)</p>
              <p className="text-xs text-gray-400 mb-2">Tính trước khi xe đến bến cuối</p>
              <div className="space-y-1">
                {journey.diemTra?.map((diem: DiemType, index: number) => (
                  <div key={diem._id || index} className="flex items-center gap-3">
                    <Tag color="orange">
                      {diem.offsetMinutes === 0
                        ? "Ngay khi đến bến"
                        : `Trước ${diem.offsetMinutes} phút`}
                    </Tag>
                    <span className="text-gray-700">{diem.diaDiem}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default JourneyListPage;