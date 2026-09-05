import { Table, Button, Space, Tag, Popconfirm, Input, Select, Card, Avatar } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";

interface UserType {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  role: "admin" | "user" | "driver" | "staff" | "assistant_driver";
  status?: boolean;
  createdAt: string;
}

function UserListPage() {
  const navigate = useNavigate();
  const { list, Delete, isLoading } = useCRUD("tk");

  const [searchText, setSearchText] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Logic lọc dữ liệu danh sách tài khoản
  const filteredList = list?.filter((item: UserType) => {
    const searchLower = searchText.toLowerCase().trim();

    const matchesSearch =
      !searchLower ||
      item.username?.toLowerCase().includes(searchLower) ||
      item.email?.toLowerCase().includes(searchLower);

    const matchesRole = selectedRole === "All" || item.role === selectedRole;

    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "active" ? item.status !== false : item.status === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const columns: ColumnsType<UserType> = [
    {
      title: "Tên tài khoản",
      dataIndex: "username",
      render: (username: string) => <strong className="text-gray-800">{username || "---"}</strong>,
    },
    {
      title: "Email",
      dataIndex: "email",
      render: (email: string) => <span className="text-gray-600">{email}</span>,
    },
    {
      title: "Ảnh đại diện",
      dataIndex: "avatar",
      render: (avatar: string, record: UserType) =>
        avatar ? (
          <Avatar src={avatar} size={44} onError={() => true} />
        ) : (
          <Avatar style={{ backgroundColor: "#1890ff" }} size={44}>
            {record.username ? record.username.charAt(0).toUpperCase() : "U"}
          </Avatar>
        ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      render: (role: string) => {
        let color = "blue";
        let label = role;

        switch (role) {
          case "admin":
            color = "red";
            label = "Quản trị viên";
            break;
          case "driver":
            color = "orange";
            label = "Tài xế";
            break;
          case "assistant_driver":
            color = "cyan";
            label = "Phụ xe";
            break;
          case "staff":
            color = "green";
            label = "Nhân viên";
            break;
          case "user":
            color = "blue";
            label = "Khách hàng";
            break;
        }

        return (
          <Tag color={color} className="font-semibold uppercase tracking-wider text-xs px-2.5 py-0.5 rounded-md">
            {label}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: boolean | undefined) => {
        const isActive = status !== false;
        return (
          <Tag color={isActive ? "green" : "red"}>
            {isActive ? "Hoạt động" : "Không hoạt động"}
          </Tag>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (date: string) => (date ? new Date(date).toLocaleString("vi-VN") : "---"),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-lg font-medium shadow-xs"
            onClick={() => navigate(`/admin/tk/edit/${record._id}`)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa tài khoản?"
            description="Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?"
            okText="Có"
            cancelText="Không"
            onConfirm={() => Delete(record._id)}
            okButtonProps={{ danger: true }}
          >
            <Button danger className="rounded-lg shadow-xs">
              Xoá
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
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Tài Khoản</h1>
          <p className="text-sm text-gray-500">
            Quản lý danh sách tài khoản người dùng, phân quyền truy cập và trạng thái hoạt động.
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          className="bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm font-semibold rounded-lg"
          onClick={() => navigate("/admin/tk/add")}
        >
          Thêm Tài Khoản
        </Button>
      </div>

      {/* Card Bộ Lọc & Bảng dữ liệu */}
      <Card className="shadow-xs border border-gray-100 rounded-xl bg-white">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input.Search
              placeholder="Tìm kiếm theo tên tài khoản hoặc email..."
              allowClear
              size="large"
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
              className="w-full"
            />
          </div>

          <div className="w-full md:w-56">
            <Select
              placeholder="Lọc theo vai trò"
              size="large"
              className="w-full"
              defaultValue="All"
              onChange={(value) => setSelectedRole(value)}
              options={[
                { value: "All", label: "Tất cả vai trò" },
                { value: "admin", label: "Quản trị viên (Admin)" },
                { value: "staff", label: "Nhân viên (Staff)" },
                { value: "driver", label: "Tài xế (Driver)" },
                { value: "assistant_driver", label: "Phụ xe (Assistant Driver)" },
                { value: "user", label: "Khách hàng (User)" },
              ]}
            />
          </div>

          <div className="w-full md:w-48">
            <Select
              placeholder="Lọc theo trạng thái"
              size="large"
              className="w-full"
              defaultValue="All"
              onChange={(value) => setSelectedStatus(value)}
              options={[
                { value: "All", label: "Tất cả trạng thái" },
                { value: "active", label: "Hoạt động" },
                { value: "inactive", label: "Không hoạt động" },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table
            rowKey="_id"
            dataSource={filteredList}
            columns={columns}
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng số ${total} tài khoản`,
            }}
          />
        </div>
      </Card>
    </div>
  );
}

export default UserListPage;