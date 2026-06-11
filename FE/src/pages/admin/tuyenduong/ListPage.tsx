import { Popconfirm, Space, Table, Button, Tag } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";

interface DiemType {
  _id: string;
  diaDiem: string;
  thoiGian: string;
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
      title: "Giá Vé",
      dataIndex: "price",
      key: "price",
      render: (price: number) => <span className="text-gray-600">{price}</span>,
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
        <h1 className="text-2xl font-semibold text-gray-800">Quản Lý Danh Sách Hành Trình</h1>
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
    </div>
  );
}

export default JourneyListPage;