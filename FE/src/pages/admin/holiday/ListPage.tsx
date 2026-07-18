import {
  Popconfirm,
  Space,
  Table,
  Button,
  Tag,
} from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";

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

  const { list, Delete } = useCRUD("holiday");

  const columns: ColumnsType<HolidayType> = [
    {
      title: "Tên ngày lễ",
      dataIndex: "name",
      render: (text) => <strong>{text}</strong>,
    },

    {
      title: "Ngày",
      render: (_, record) =>
        `${String(record.day).padStart(2, "0")}/${String(
          record.month
        ).padStart(2, "0")}`,
    },

    {
      title: "Mô tả",
      dataIndex: "description",
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
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Quản lý ngày lễ</h1>

        <Button
          type="primary"
          size="large"
          onClick={() => navigate("/admin/holiday/add")}
        >
          Thêm ngày lễ
        </Button>
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={list}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}

export default HolidayListPage;