import { Popconfirm, Space, Table, Button, Tag, Modal, Divider, Input, Select, Card } from "antd";
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
  quangDuong: string | number;
  thoiGianDiChuyen: string;
  price: number;
  diemDon: DiemType[];
  diemTra: DiemType[];
  trangThai: boolean;
}

function JourneyListPage() {
  const navigate = useNavigate();
  const { list, Delete, isLoading } = useCRUD("journey");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  
  // State quản lý tìm kiếm và bộ lọc trạng thái
  const [searchText, setSearchText] = useState("");
  const [selectedTrangThai, setSelectedTrangThai] = useState<string>("All");

  const { data: journey } = useDetail("journey", selectedId);

  const handleView = (id: string) => {
    setSelectedId(id);
    setOpen(true);
  };

  // Logic lọc danh sách hành trình
  const filteredList = list?.filter((item: JourneyType) => {
    const searchLower = searchText.toLowerCase().trim();

    const matchesSearch =
      !searchLower ||
      String(item.diemDi || "").toLowerCase().includes(searchLower) ||
      String(item.diemDen || "").toLowerCase().includes(searchLower) ||
      String(item.quangDuong ?? "").toLowerCase().includes(searchLower);

    const matchesTrangThai =
      selectedTrangThai === "All" ||
      (selectedTrangThai === "active" ? item.trangThai === true : item.trangThai === false);

    return matchesSearch && matchesTrangThai;
  });

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
      render: (quangDuong: string | number) => <span className="text-gray-600">{quangDuong}</span>,
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
    <div className="p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Danh Sách Tuyến Đường</h1>
          <p className="text-sm text-gray-500">Quản lý các tuyến đường, điểm đón trả và lịch trình di chuyển.</p>
        </div>
        <Button 
          type="primary" 
          size="large" 
          className="bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm font-semibold rounded-lg"
          onClick={() => navigate("/admin/journey/add")}
        >
          Thêm Hành Trình Mới
        </Button>
      </div>

      {/* Card chứa Thanh tìm kiếm, Bộ lọc và Bảng dữ liệu */}
      <Card className="shadow-xs border border-gray-100 rounded-xl bg-white">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input.Search
              placeholder="Tìm kiếm theo điểm đi, điểm đến hoặc quãng đường..."
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
              onChange={(value) => setSelectedTrangThai(value)}
              options={[
                { value: "All", label: "Tất cả trạng thái" },
                { value: "active", label: "Hoạt động" },
                { value: "inactive", label: "Dừng hoạt động" },
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
              showTotal: (total) => `Tổng số ${total} tuyến đường`,
            }}
          />
        </div>
      </Card>

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