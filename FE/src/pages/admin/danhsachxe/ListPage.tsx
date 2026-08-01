import { useState } from "react";
import { Popconfirm, Space, Table, Button, Tag, Input, Card, Select } from "antd";
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

// Cấu hình số chỗ ngồi tương ứng với từng loại xe
const CAPACITY_OPTIONS_MAP: Record<string, number[]> = {
  Sleeper: [34],
  Seater: [16, 29, 45],
};

function ListPage() {
  const navigate = useNavigate();
  const { list, Delete, isLoading } = useCRUD("bus");

  // State quản lý bộ lọc
  const [searchText, setSearchText] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedCapacity, setSelectedCapacity] = useState<number | undefined>(undefined);

  // Xử lý khi thay đổi Loại xe
  const handleTypeChange = (type?: string) => {
    setSelectedType(type);
    setSelectedCapacity(undefined); // Reset lại sức chứa khi đổi loại xe
  };

  // Lấy danh sách số chỗ dựa theo loại xe đã chọn
  const getCapacityOptions = () => {
    if (selectedType && CAPACITY_OPTIONS_MAP[selectedType]) {
      return CAPACITY_OPTIONS_MAP[selectedType];
    }
    // Nếu chưa chọn loại xe, hiển thị tất cả các số chỗ
    return [16, 29, 34, 45];
  };

  // Lọc dữ liệu tổng hợp
  const filteredList = list?.filter((item: BusType) => {
    // 1. Lọc theo từ khóa (Tên hoặc Biển số)
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      const matchName = item.name?.toLowerCase().includes(searchLower);
      const matchPlate = item.licensePlates?.toLowerCase().includes(searchLower);
      if (!matchName && !matchPlate) return false;
    }

    // 2. Lọc theo Loại xe
    // if (selectedType && item.type !== selectedType) {
    //   return false;
    // }

    // 3. Lọc theo Sức chứa
    if (selectedCapacity && item.capacity !== selectedCapacity) {
      return false;
    }

    return true;
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
        if (type === "Sleeper") return "Xe giường nằm";
        if (type === "Seater") return "Xe ghế ngồi";
        return type;
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

      {/* Thẻ Card bao bọc Thanh tìm kiếm, Bộ lọc và Bảng dữ liệu */}
      <Card className="shadow-xs border border-gray-100 rounded-xl bg-white">
        {/* Thanh tìm kiếm + Bộ lọc Loại xe & Sức chứa */}
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

          {/* Filter Chọn Loại Xe */}
          {/* <Select
            placeholder="Loại xe"
            size="large"
            allowClear
            className="w-full md:w-48"
            onChange={handleTypeChange}
            value={selectedType}
            options={[
              { label: "Xe giường nằm (Sleeper)", value: "Sleeper" },
              { label: "Xe ghế ngồi (Seater)", value: "Seater" },
            ]}
          /> */}

          {/* Filter Chọn Sức Chứa (Tự động cập nhật theo Loại Xe) */}
          <Select
            placeholder="Sức chứa"
            size="large"
            allowClear
            className="w-full md:w-40"
            onChange={(val) => setSelectedCapacity(val)}
            value={selectedCapacity}
            options={getCapacityOptions().map((cap) => ({
              label: `${cap} chỗ`,
              value: cap,
            }))}
          />
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