import { Popconfirm, Space, Table, Button, Tag, Input, Select, Card } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";

interface HolidayType {
  _id: string;
  name: string;
  day: number;
  month: number;
  description: string;
  status: boolean;
  createdAt: string;
}

function HolidayListPage() {
  const navigate = useNavigate();

  const { list, Delete, isLoading } = useCRUD("holiday");

  // State quản lý tìm kiếm và bộ lọc trạng thái
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Logic lọc dữ liệu ngày lễ
  const filteredList = list?.filter((item: HolidayType) => {
    const searchLower = searchText.toLowerCase().trim();
    const dateStr = `${String(item.day).padStart(2, "0")}/${String(item.month).padStart(2, "0")}`;

    const matchesSearch =
      !searchLower ||
      item.name?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      dateStr.includes(searchLower);

    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "active" ? item.status === true : item.status === false);

    return matchesSearch && matchesStatus;
  });

  const columns: ColumnsType<HolidayType> = [
    {
      title: "Tên ngày lễ",
      dataIndex: "name",
      render: (text) => <strong className="text-gray-800">{text}</strong>,
    },

    {
      title: "Ngày",
      render: (_, record) =>
        `${String(record.day).padStart(2, "0")}/${String(record.month).padStart(2, "0")}`,
    },

    {
      title: "Mô tả",
      dataIndex: "description",
      render: (desc) => <span className="text-gray-600">{desc || "---"}</span>,
    },

    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Hoạt động" : "Ẩn"}
        </Tag>
      ),
    },

    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (date) => (date ? new Date(date).toLocaleDateString("vi-VN") : "---"),
    },

    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => navigate(`/admin/holiday/edit/${record._id}`)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa ngày lễ?"
            description="Bạn có chắc chắn muốn xóa ngày lễ này không?"
            onConfirm={() => Delete(record._id)}
            okText="Có"
            cancelText="Không"
            okButtonProps={{ danger: true }}
          >
            <Button danger>Xóa</Button>
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
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Ngày Lễ</h1>
          <p className="text-sm text-gray-500">
            Quản lý danh sách các ngày lễ để áp dụng phụ thu/quy tắc giá vé thích hợp.
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          className="bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm font-semibold rounded-lg"
          onClick={() => navigate("/admin/holiday/add")}
        >
          Thêm Ngày Lễ
        </Button>
      </div>

      {/* CARD BỘ LỌC VÀ BẢNG DỮ LIỆU */}
      <Card className="shadow-xs border border-gray-100 rounded-xl bg-white">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input.Search
              placeholder="Tìm kiếm theo tên ngày lễ, mô tả hoặc ngày/tháng (VD: 30/04)..."
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
                { value: "active", label: "Hoạt động" },
                { value: "inactive", label: "Ẩn" },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={filteredList}
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng số ${total} ngày lễ`,
            }}
          />
        </div>
      </Card>
    </div>
  );
}

export default HolidayListPage;