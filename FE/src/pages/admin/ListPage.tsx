import { Popconfirm, Space, Table, Button, Tag } from "antd";
import { useCRUD } from "../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";

// 1. Định nghĩa chuẩn Interface theo các trường dữ liệu thật của bạn
interface BusType {
  _id: string;            // Khóa chính từ MongoDB
  name: string;           // Tên xe (Ví dụ: "Xe giường nằm VIP-2 Express")
  licensePlates: string;  // Biển số xe (Ví dụ: "29A-888.88")
  capacity: number;       // Sức chứa (Ví dụ: 40)
  type: string;           // Loại xe (Ví dụ: "Sleeper")
  status: string;         // Trạng thái (Ví dụ: "Active")
}

function ListPage() {
  const navigate = useNavigate();
  const { list, Delete } = useCRUD();

  // 2. Cấu hình các cột hiển thị chuẩn xác theo các trường dữ liệu trên
  const columns: ColumnsType<BusType> = [
    {
      title: "Tên Xe / Nhà Xe",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <strong className="text-gray-800">{text}</strong>,
    },
    {
      title: "Biển Số Xe",
      dataIndex: "licensePlates",
      key: "licensePlates",
      render: (plates: string) => (
        <Tag color="blue" className="font-semibold text-sm px-2 py-0.5">
          {plates}
        </Tag>
      ),
    },
    {
      title: "Loại Xe",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        // Viết hoa hoặc dịch sang tiếng Việt cho trực quan
        return type === "Sleeper" ? "Xe giường nằm" : type;
      },
    },
    {
      title: "Sức Chứa",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity: number) => `${capacity} chỗ`,
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        // Kiểm tra trạng thái Active/Inactive để hiển thị màu sắc tương ứng
        const isActive = status?.toLowerCase() === "active";
        return (
          <Tag color={isActive ? "green" : "red"}>
            {isActive ? "Hoạt động" : "Bảo trì / Dừng"}
          </Tag>
        );
      },
    },
    {
      title: "Hành Động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            onClick={() => navigate(`/edit/${record._id}`)} // Sửa thành _id
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa xe này"
            description="Bạn có chắc chắn muốn xóa thông tin xe này?"
            onConfirm={() => Delete(record._id)} // Sửa thành _id
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
        <h1 className="text-2xl font-semibold text-gray-800">Quản Lý Danh Sách Xe Bus / Khách</h1>
        <Button type="primary" size="large" onClick={() => navigate("/create")}>
          Thêm Xe Mới
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-100">
        <Table
          columns={columns}
          dataSource={list}
          rowKey="_id" // Thay id thành _id để fix triệt để lỗi "unique key warning"
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </div>
    </div>
  );
}

export default ListPage;