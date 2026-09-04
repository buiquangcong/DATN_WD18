import { Popconfirm, Space, Table, Button, Tag, Input, Select, Avatar, Card, Modal } from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { ColumnsType } from "antd/es/table";

interface StaffType {
    _id: string;
    ten: string;
    namSinh: string;
    gioiTinh: "Nam" | "Nữ" | "Khác";
    email: string;
    sdt: string;
    diaChi: string;
    image?: string;
    cccd: string;
    chucVu: "Admin" | "Driver" | "Staff" | "Assistant_Driver";
    bangLai?: string;
    anhBangLai?: string;
}

function ListPage() {
    const navigate = useNavigate();
    const { list, Delete, isLoading } = useCRUD("staff");
    const [searchText, setSearchText] = useState("");
    const [selectedChucVu, setSelectedChucVu] = useState<string>("All");
    const [previewImage, setPreviewImage] = useState("");
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const filteredList = (list || []).filter((item: StaffType) => {
        const searchLower = searchText.toLowerCase().trim();
        const matchesSearch =
            !searchLower ||
            item.ten?.toLowerCase().includes(searchLower) ||
            item.email?.toLowerCase().includes(searchLower) ||
            item.sdt?.includes(searchLower) ||
            item.cccd?.includes(searchLower);

        const matchesChucVu = selectedChucVu === "All" || item.chucVu === selectedChucVu;
        return matchesSearch && matchesChucVu;
    });

    const columns: ColumnsType<StaffType> = [
        {
            title: "Nhân viên",
            key: "staffInfo",
            render: (_, record) => {
                const initials = record.ten ? record.ten.trim().split(" ").pop()?.charAt(0).toUpperCase() : "?";
                return (
                    <Space size="middle">
                        {record.image ? (
                            <Avatar src={record.image} size={48} />
                        ) : (
                            <Avatar
                                style={{ backgroundColor: "#1890ff", verticalAlign: "middle" }}
                                size={48}
                            >
                                {initials}
                            </Avatar>
                        )}
                        <div>
                            <div className="font-semibold text-gray-800 text-sm md:text-base">{record.ten}</div>
                            <div className="text-xs text-gray-500">CCCD: {record.cccd}</div>
                        </div>
                    </Space>
                );
            },
        },
        {
            title: "Chức vụ",
            dataIndex: "chucVu",
            key: "chucVu",
            render: (chucVu: string, record: StaffType) => {
                let color = "geekblue";
                let label = "Nhân viên";

                switch (chucVu) {
                    case "Admin":
                        color = "volcano";
                        label = "Quản trị viên";
                        break;
                    case "Driver":
                        color = "green";
                        label = "Tài xế";
                        break;
                    case "Assistant_Driver":
                        color = "cyan";
                        label = "Phụ xe";
                        break;
                    case "Staff":
                    default:
                        color = "geekblue";
                        label = "Nhân viên";
                        break;
                }

                return (
                    <Space direction="vertical" size={4} align="start">
                        <Tag color={color} className="font-semibold uppercase tracking-wider text-xs px-2.5 py-0.5 rounded-md">
                            {label}
                        </Tag>
                        {chucVu === "Driver" && record.bangLai && (
                            <Tag color="cyan" className="text-xs">
                                Bằng: {record.bangLai}
                            </Tag>
                        )}
                        {chucVu === "Driver" && record.anhBangLai && (
                            <Button
                                type="link"
                                size="small"
                                className="p-0 text-xs text-blue-500 hover:text-blue-400 h-auto"
                                onClick={() => {
                                    setPreviewImage(record.anhBangLai || "");
                                    setIsPreviewOpen(true);
                                }}
                            >
                                Xem ảnh bằng lái
                            </Button>
                        )}
                    </Space>
                );
            },
        },
        {
            title: "Giới tính",
            dataIndex: "gioiTinh",
            key: "gioiTinh",
            render: (gioiTinh: string) => {
                let genderColor = "blue";
                if (gioiTinh === "Nữ") genderColor = "pink";
                else if (gioiTinh === "Khác") genderColor = "purple";
                return <Tag color={genderColor}>{gioiTinh}</Tag>;
            },
        },
        {
            title: "Ngày tháng Năm Sinh",
            dataIndex: "namSinh",
            key: "namSinh",
            render: (namSinh: string) => <span className="text-gray-600 text-sm">{namSinh || "---"}</span>,
        },
        {
            title: "Hành Động",
            key: "action",
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        onClick={() => navigate(`/admin/staff/edit/${record._id}`)}
                    >
                        Sửa
                    </Button>

                    {/* <Popconfirm
            title="Xóa nhân viên này"
            description="Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống?"
            onConfirm={() => Delete(record._id)}
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản Lý Danh Sách Nhân Viên</h1>
                    <p className="text-sm text-gray-500">Quản lý thông tin, phân quyền chức vụ của đội ngũ nhân sự.</p>
                </div>
                <Button
                    type="primary"
                    size="large"
                    className="bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm font-semibold rounded-lg"
                    onClick={() => navigate("/admin/staff/add")}
                >
                    Thêm Nhân Viên
                </Button>
            </div>

            <Card className="shadow-xs border border-gray-100 rounded-xl bg-white">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <Input.Search
                            placeholder="Tìm kiếm theo tên, email, số điện thoại hoặc CCCD..."
                            allowClear
                            onChange={(e) => setSearchText(e.target.value)}
                            value={searchText}
                            size="large"
                            className="w-full"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <Select
                            placeholder="Lọc theo chức vụ"
                            size="large"
                            className="w-full"
                            defaultValue="All"
                            onChange={(value) => setSelectedChucVu(value)}
                            options={[
                                { value: "All", label: "Tất cả chức vụ" },
                                { value: "Admin", label: "Quản trị viên" },
                                { value: "Staff", label: "Nhân viên" },
                                { value: "Driver", label: "Tài xế" },
                                { value: "Assistant_Driver", label: "Phụ xe" },
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
                            pageSize: 8,
                            showSizeChanger: true,
                            showTotal: (total) => `Tổng số ${total} nhân viên`,
                        }}
                    />
                </div>
            </Card>

            <Modal
                title="Ảnh chụp bằng lái xe"
                open={isPreviewOpen}
                footer={null}
                onCancel={() => setIsPreviewOpen(false)}
                destroyOnClose
                centered
            >
                <div className="flex justify-center items-center p-2">
                    <img
                        src={previewImage}
                        alt="Ảnh bằng lái xe"
                        className="max-w-full max-h-[70vh] object-contain rounded-lg border shadow-sm"
                    />
                </div>
            </Modal>
        </div>
    );
}

export default ListPage;