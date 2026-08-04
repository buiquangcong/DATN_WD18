import { useState, useMemo } from "react";
import { Popconfirm, Space, Table, Button, Tag, Input, Card, Select } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";

interface DriverType {
  _id: string;
  name: string;
  phone?: string;
}

interface BusType {
  _id: string;
  name: string;
  licensePlates: string;
  capacity: number;
  type: "Sleeper" | "Seater" | "Limousine";
  hangxe?: string; // Hãng xe (ví dụ: Hyundai, Thaco, Samco, ...)
  driver?: DriverType | string;
  status: "hoạt động" | "bảo trì" | "ngừng hoạt động";
}

const CAPACITY_OPTIONS_MAP: Record<string, number[]> = {
  Sleeper: [34, 40],
  Seater: [16, 29, 45],
  Limousine: [9, 11, 19],
};

function ListPage() {
  const navigate = useNavigate();
  const { list, Delete, isLoading } = useCRUD("bus");

  const [searchText, setSearchText] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedCapacity, setSelectedCapacity] = useState<number | undefined>(undefined);
  const [selectedHangXe, setSelectedHangXe] = useState<string | undefined>(undefined);

  // Tự động gom danh sách Hãng xe duy nhất từ dữ liệu trả về để làm bộ lọc
  const hangXeOptions = useMemo(() => {
    if (!list) return [];
    const hangXes = list
      .map((item: BusType) => item.hangxe)
      .filter((hang): hang is string => Boolean(hang));
    return Array.from(new Set(hangXes)).map((hang) => ({
      label: hang,
      value: hang,
    }));
  }, [list]);

  const handleTypeChange = (type?: string) => {
    setSelectedType(type);
    setSelectedCapacity(undefined);
  };

  const getCapacityOptions = () => {
    if (selectedType && CAPACITY_OPTIONS_MAP[selectedType]) {
      return CAPACITY_OPTIONS_MAP[selectedType];
    }
    return [16,29, 34, 45];
  };

  const filteredList = list?.filter((item: BusType) => {
    // 1. Tìm theo Tên xe, Biển số hoặc Hãng xe
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      const matchName = item.name?.toLowerCase().includes(searchLower);
      const matchPlate = item.licensePlates?.toLowerCase().includes(searchLower);
      const matchHangXe = item.hangxe?.toLowerCase().includes(searchLower);
      if (!matchName && !matchPlate && !matchHangXe) return false;
    }

    // 2. Lọc theo Hãng xe
    if (selectedHangXe && item.hangxe !== selectedHangXe) {
      return false;
    }

    // 3. Lọc theo Loại xe
    if (selectedType && item.type !== selectedType) {
      return false;
    }

    // 4. Lọc theo Sức chứa
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
      title: "Hãng Xe", // Cột Hãng xe đã được tách riêng
      dataIndex: "hangxe",
      key: "hangxe",
      render: (hangxe?: string) => hangxe || <span className="text-gray-400">Chưa cập nhật</span>,
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
        // Chuyển về chữ thường để so sánh chính xác
        const s = status?.toLowerCase();

        let color = "default";
        let label = status; // Giá trị fallback nếu không khớp

        if (s === "hoạt động" || s === "active") {
          color = "green";
          label = "Hoạt động";
        } else if (s === "bảo trì" || s === "maintenance") {
          color = "orange";
          label = "Bảo trì";
        } else if (s === "ngừng hoạt động" || s === "inactive") {
          color = "red";
          label = "Ngừng hoạt động";
        }

        return <Tag color={color}>{label}</Tag>;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quản Lý Danh Sách Xe Bus / Khách
          </h1>
          <p className="text-sm text-gray-500">
            Quản lý thông tin phương tiện, hãng xe, sức chứa và trạng thái hoạt động.
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

      <Card className="shadow-xs border border-gray-100 rounded-xl bg-white">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input.Search
              placeholder="Tìm kiếm theo tên, biển số, hoặc hãng xe..."
              allowClear
              size="large"
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
              className="w-full"
            />
          </div>

          {/* Filter Chọn Hãng Xe */}
          {/* <Select
            placeholder="Hãng xe"
            size="large"
            allowClear
            className="w-full md:w-40"
            onChange={(val) => setSelectedHangXe(val)}
            value={selectedHangXe}
            options={hangXeOptions}
          /> */}

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
              { label: "Xe Limousine", value: "Limousine" },
            ]}
          /> */}

          {/* Filter Chọn Sức Chứa */}
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