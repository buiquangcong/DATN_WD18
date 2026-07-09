import {Table,Button, Space, Tag, Popconfirm,Image,} from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";

interface NewsType {
    _id: string;
    title: string;
    image: string;
    shortDescription: string;
    content: string;
    author: string;
    category: string;
    views: number;
    status: string;
    createdAt: string;
}

function NewsListPage() {
    const { list, Delete, isLoading } = useCRUD("news");
    const navigate = useNavigate();

    const columns: ColumnsType<NewsType> = [
        {
            title: "Ảnh",
            dataIndex: "image",
            key: "image",
            width: 120,
            render: (image: string) => (
                <Image
                    src={image}
                    width={90}
                    height={60}
                    style={{
                        objectFit: "cover",
                        borderRadius: 6,
                    }}
                />
            ),
        },

        {
            title: "Tiêu đề",
            dataIndex: "title",
            key: "title",
            width: 250,
        },

        {
            title: "Mô tả ngắn",
            dataIndex: "shortDescription",
            key: "shortDescription",
            ellipsis: true,
            render: (text: string) =>
                text.length > 80
                    ? text.substring(0, 80) + "..."
                    : text,
        },

        {
            title: "Tác giả",
            dataIndex: "author",
            key: "author",
            width: 120,
        },

        {
            title: "Danh mục",
            dataIndex: "category",
            key: "category",
            width: 120,
        },

        {
            title: "Lượt xem",
            dataIndex: "views",
            key: "views",
            width: 100,
            align: "center",
        },

        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status: string) => (
                <Tag color={status === "Hiển thị" ? "green" : "red"}>
                    {status}
                </Tag>
            ),
        },

        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 120,
            render: (date: string) =>
                new Date(date).toLocaleDateString("vi-VN"),
        },

        {
            title: "Thao tác",
            key: "action",
            width: 180,
            render: (_, record) => (
                <Space>
                    <Button
                        onClick={() =>
                            navigate(`/admin/news/detail/${record._id}`)
                        }
                    >
                        Chi tiết
                    </Button>
                    <Button
                        type="primary"
                        onClick={() =>
                            navigate(`/admin/news/edit/${record._id}`)
                        }
                    >
                        Sửa
                    </Button>

                    <Popconfirm
                        title="Bạn có chắc muốn xóa bài viết?"
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => Delete(record._id)}
                    >
                        <Button danger>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    Quản lý Tin tức
                </h1>

                <Button
                    type="primary"
                    onClick={() =>
                        navigate("/admin/news/add")
                    }
                >
                    Thêm bài viết
                </Button>
            </div>

            <Table
                rowKey="_id"
                loading={isLoading}
                columns={columns}
                dataSource={list}
                bordered
                pagination={{
                    pageSize: 10,
                    showSizeChanger: false,
                }}
            />
        </div>
    );
}

export default NewsListPage;