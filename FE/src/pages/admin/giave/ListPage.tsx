import { Popconfirm, Space, Table, Button, Tag, Input, Select, Card, message } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";

interface JourneyType {
  _id: string;
  diemDi: string;
  diemDen: string;
}

interface FareRuleType {
  _id: string;
  journey: JourneyType;
  capacity: number;
  weekdayPrice: number;
  weekendPrice: number;
  holidayPrice: number;
  createdAt: string;
}

function FareRuleListPage() {
  const navigate = useNavigate();
  const { list, Delete, isLoading } = useCRUD("giave");

  // State quản lý từ khóa tìm kiếm và bộ lọc sức chứa
  const [searchText, setSearchText] = useState("");
  const [selectedCapacity, setSelectedCapacity] = useState<string>("All");

  // Hàm xử lý xóa có bắt lỗi từ Backend trả về
  const handleDelete = async (id: string) => {
    try {
      await Delete(id);
    } catch (error: any) {
      // Đọc chính xác câu message trả về từ Backend API (res.status(400))
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Xóa giá vé thất bại!";
      message.error(errorMsg);
    }
  };

  // Danh sách các tùy chọn sức chứa động từ dữ liệu thực tế
  const capacityOptions = Array.from(
    new Set(list?.map((item: FareRuleType) => item.capacity).filter(Boolean))
  ).sort((a: any, b: any) => a - b);

  // Logic lọc dữ liệu quy tắc giá
  const filteredList = list?.filter((item: FareRuleType) => {
    const searchLower = searchText.toLowerCase().trim();

    const matchesSearch =
      !searchLower ||
      item.journey?.diemDi?.toLowerCase().includes(searchLower) ||
      item.journey?.diemDen?.toLowerCase().includes(searchLower) ||
      String(item.capacity).includes(searchLower);

    const matchesCapacity =
      selectedCapacity === "All" ||
      String(item.capacity) === selectedCapacity;

    return matchesSearch && matchesCapacity;
  });

  const columns: ColumnsType<FareRuleType> = [
    {
      title: "Tuyến đường",
      dataIndex: "journey",
      key: "journey",
      render: (journey: JourneyType) => (
        <strong className="text-gray-800">
          {journey?.diemDi} → {journey?.diemDen}
        </strong>
      ),
    },
    {
      title: "Sức chứa",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity: number) => (
        <Tag color="blue" className="font-medium">
          {capacity} chỗ
        </Tag>
      ),
    },
    {
      title: "Giá ngày thường",
      dataIndex: "weekdayPrice",
      key: "weekdayPrice",
      render: (price: number) => (
        <span className="text-gray-600 font-medium">
          {Number(price).toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      title: "Giá cuối tuần",
      dataIndex: "weekendPrice",
      key: "weekendPrice",
      render: (price: number) => (
        <span className="text-gray-600 font-medium">
          {Number(price).toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      title: "Giá ngày lễ",
      dataIndex: "holidayPrice",
      key: "holidayPrice",
      render: (price: number) => (
        <span className="text-red-500 font-medium">
          {Number(price).toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <span className="text-gray-500">
          {date ? new Date(date).toLocaleDateString("vi-VN") : "---"}
        </span>
      ),
    },
    {
      title: "Hành Động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => navigate(`/admin/giave/edit/${record._id}`)}
          >
            Sửa
          </Button>
          {/* <Popconfirm
            title="Xóa giá vé này?"
            description="Bạn có chắc muốn xóa quy tắc giá này không?"
            onConfirm={() => handleDelete(record._id)} // Gọi hàm handleDelete đã bọc try...catch
            okText="Có"
            cancelText="Không"
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" danger>
              Xóa
            </Button>
          </Popconfirm> */}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Giá Vé</h1>
          <p className="text-sm text-gray-500">
            Thiết lập bảng giá vé theo tuyến đường, sức chứa xe và theo từng mốc thời gian.
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          className="bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm font-semibold rounded-lg"
          onClick={() => navigate("/admin/giave/add")}
        >
          Thêm Quy Tắc Giá
        </Button>
      </div>

      {/* CARD BỘ LỌC VÀ BẢNG DỮ LIỆU */}
      <Card className="shadow-xs border border-gray-100 rounded-xl bg-white">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input.Search
              placeholder="Tìm kiếm theo điểm đi, điểm đến hoặc sức chứa xe..."
              allowClear
              size="large"
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
              className="w-full"
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              placeholder="Lọc theo sức chứa"
              size="large"
              className="w-full"
              defaultValue="All"
              onChange={(value) => setSelectedCapacity(value)}
              options={[
                { value: "All", label: "Tất cả sức chứa" },
                ...capacityOptions.map((cap) => ({
                  value: String(cap),
                  label: `${cap} chỗ`,
                })),
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
              showTotal: (total) => `Tổng số ${total} quy tắc giá`,
            }}
          />
        </div>
      </Card>
    </div>
  );
}

export default FareRuleListPage;