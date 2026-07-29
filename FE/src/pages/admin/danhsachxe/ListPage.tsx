import { useState } from "react";
import { Popconfirm, Space, Table, Button, Tag, Input, Card } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";

interface BusType {
  _id: string;
  name: string;
  licensePlates: string;
  capacity: number;
  type: string;
  status: string;
}

function ListPage() {
  const navigate = useNavigate();
  const { list, Delete, isLoading } = useCRUD("bus");

  // State quản lý từ khóa tìm kiếm
  const [searchText, setSearchText] = useState<string>("");

  // Lọc dữ liệu dựa trên từ khóa (Tên xe hoặc Biển số)
  const filteredList = list?.filter((item: BusType) => {
    if (!searchText.trim()) return true;
    const searchLower = searchText.toLowerCase().trim();

    return (
      item.name?.toLowerCase().includes(searchLower) ||
      item.licensePlates?.toLowerCase().includes(searchLower)
    );
  });

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
            onClick={() => navigate(`/admin/bus/edit/${record._id}`)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa xe này"
            description="Bạn có chắc chắn muốn xóa thông tin xe này?"
            onConfirm={() => Delete(record._id)}
            okText="Có"
            cancelText="Không"
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" danger>
              Xóa
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
          <h1 className="text-2xl font-bold text-gray-800">
            Quản Lý Danh Sách Xe Bus / Khách
          </h1>
          <p className="text-sm text-gray-500">
            Quản lý thông tin phương tiện, sức chứa và trạng thái hoạt động.
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          className="bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm font-semibold rounded-lg"
          onClick={() => navigate("/admin/bus/add")}
        >
          Thêm Xe Mới
        </Button>
      </div>

      {/* Thẻ Card bao bọc Thanh tìm kiếm và Bảng dữ liệu */}
      <Card className="shadow-xs border border-gray-100 rounded-xl bg-white">
        {/* Ô tìm kiếm kéo dài giống hệt trang Nhân Viên */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input.Search
              placeholder="Tìm kiếm theo tên xe hoặc biển số xe..."
              allowClear
              size="large"
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
              className="w-full"
            />
          </div>
        </div>

        {/* Bảng danh sách */}
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredList}
            rowKey="_id"
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng số ${total} xe`,
            }}
          />
        </div>
      </Card>
    </div>
  );
}

export default ListPage;