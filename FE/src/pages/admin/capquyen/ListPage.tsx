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
  createdAt: string;
}

function UserListPage() {
  const navigate = useNavigate();
  const { list, Delete, isLoading } = useCRUD("tk");

  // State quản lý tìm kiếm và bộ lọc vai trò
  const [searchText, setSearchText] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("All");

  // Logic lọc danh sách tài khoản
  const filteredList = list?.filter((item: UserType) => {
    const searchLower = searchText.toLowerCase().trim();

    const matchesSearch =
      !searchLower ||
      item.username?.toLowerCase().includes(searchLower) ||
      item.email?.toLowerCase().includes(searchLower);

    const matchesRole = selectedRole === "All" || item.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const columns: ColumnsType<UserType> = [
    {
      title: "Tên tài khoản",
      dataIndex: "username",
      render: (username: string) => <strong className="text-gray-800">{username}</strong>,
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
          <Avatar
            src={avatar}
            size={44}
            onError={() => true}
          />
        ) : (
          <Avatar
            style={{ backgroundColor: "#1890ff" }}
            size={44}
          >
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
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (date: string) => (date ? new Date(date).toLocaleString("vi-VN") : "---"),
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => navigate(`/admin/tk/edit/${record._id}`)}
          >
            Sửa
          </Button>

          {/* <Popconfirm
            title="Xóa tài khoản?"
            description="Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?"
            okText="Có"
            cancelText="Không"
            onConfirm={() => Delete(record._id)}
            okButtonProps={{ danger: true }}
          >
            <Button danger>Xóa</Button>
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
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Tài Khoản</h1>
          <p className="text-sm text-gray-500">
            Quản lý danh sách tài khoản người dùng, phân quyền truy cập hệ thống.
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

      {/* CARD BỘ LỌC VÀ BẢNG DỮ LIỆU */}
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
          <div className="w-full md:w-64">
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