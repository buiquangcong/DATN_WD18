import {Table,Button,Space,Tag,Popconfirm} from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";

interface UserType {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  role: "admin" | "user" | "driver" | "staff";
  createdAt: string;
}

function UserListPage() {
  const navigate = useNavigate();
  const { list, Delete } = useCRUD("tk");

  const columns: ColumnsType<UserType> = [
    {
      title: "Tên tài khoản",
      dataIndex: "username",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Ảnh đại diện",
      dataIndex: "avatar",
      render: (avatar: string) =>
        avatar ? (
          <img
            src={avatar}
            alt="avatar"
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              objectFit: "cover",
            }}
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/50x50?text=No+Img";
            }}
          />
        ) : (
          <Tag>Chưa có ảnh</Tag>
        ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      render: (role: string) => (
        <Tag
          color={
            role === "admin"
              ? "red"
              : role === "driver"
              ? "orange"
              : role === "staff"
              ? "green"
              : "blue"
          }
        >
          {role}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (date: string) =>
        new Date(date).toLocaleString("vi-VN"),
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() =>
              navigate(`/admin/tk/edit/${record._id}`)
            }
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa tài khoản?"
            okText="Có"
            cancelText="Không"
            onConfirm={() => Delete(record._id)}
          >
            <Button danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between mb-5">
        <h1 className="text-2xl font-bold">
          Quản lý tài khoản
        </h1>

        <Button
          type="primary"
          onClick={() => navigate("/admin/tk/add")}
        >
          Thêm tài khoản
        </Button>
      </div>

      <Table
        rowKey="_id"
        dataSource={list}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}

export default UserListPage;