import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Tag,
  Input,
  Select,
  Card,
  Modal,
  Form,
  Space,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useCRUD } from "../../../hooks/useCRUD";
import { NORTHERN_PROVINCES } from "../../../constants/provinces";
import type { ColumnsType } from "antd/es/table";

interface StationType {
  _id: string;
  tinh: string;
  tenBenXe: string;
  diaChi?: string;
  trangThai: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function StationListPage() {
  const { list = [], Add, Edit, Delete, isLoading } = useCRUD("station");

  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<StationType | null>(null);

  // Bộ lọc
  const [searchText, setSearchText] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Mở modal thêm mới
  const handleOpenAddModal = () => {
    setEditingStation(null);
    form.resetFields();
    form.setFieldsValue({
      trangThai: true,
      tinh: selectedProvince !== "All" ? selectedProvince : undefined,
    });
    setModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (record: StationType) => {
    setEditingStation(record);
    form.setFieldsValue({
      tinh: record.tinh,
      tenBenXe: record.tenBenXe,
      diaChi: record.diaChi || "",
      trangThai: record.trangThai,
    });
    setModalOpen(true);
  };

  // Đóng modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingStation(null);
    form.resetFields();
  };

  // Lưu form (thêm mới hoặc cập nhật)
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingStation) {
        Edit({
          _id: editingStation._id,
          ...values,
        });
      } else {
        Add(values);
      }
      handleCloseModal();
    } catch (err) {
      // Validate failed
    }
  };

  // Lọc danh sách bến xe
  const filteredList = useMemo(() => {
    if (!Array.isArray(list)) return [];
    return list.filter((item: StationType) => {
      const searchLower = searchText.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        item.tenBenXe?.toLowerCase().includes(searchLower) ||
        item.tinh?.toLowerCase().includes(searchLower) ||
        item.diaChi?.toLowerCase().includes(searchLower);

      const matchesProvince =
        selectedProvince === "All" || item.tinh === selectedProvince;

      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "active" ? item.trangThai === true : item.trangThai === false);

      return matchesSearch && matchesProvince && matchesStatus;
    });
  }, [list, searchText, selectedProvince, selectedStatus]);

  const columns: ColumnsType<StationType> = [
    {
      title: "Tỉnh / Thành Phố",
      dataIndex: "tinh",
      key: "tinh",
      render: (tinh: string) => (
        <Tag color="blue" className="text-sm font-medium py-1 px-2.5">
          <EnvironmentOutlined className="mr-1" />
          {tinh}
        </Tag>
      ),
      sorter: (a, b) => a.tinh.localeCompare(b.tinh),
    },
    {
      title: "Tên Bến Xe",
      dataIndex: "tenBenXe",
      key: "tenBenXe",
      render: (text: string) => (
        <span className="font-semibold text-gray-800 text-sm">{text}</span>
      ),
      sorter: (a, b) => a.tenBenXe.localeCompare(b.tenBenXe),
    },
    {
      title: "Địa Chỉ Chi Tiết",
      dataIndex: "diaChi",
      key: "diaChi",
      render: (diaChi: string) => (
        <span className="text-gray-600 text-sm">{diaChi || "---"}</span>
      ),
    },
    {
      title: "Trạng Thái",
      dataIndex: "trangThai",
      key: "trangThai",
      render: (trangThai: boolean) => (
        <Tag color={trangThai ? "green" : "red"}>
          {trangThai ? "Hoạt động" : "Dừng hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Ngày Tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "---",
    },
    {
      title: "Hành Động",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="middle"
            onClick={() => handleOpenEditModal(record)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa bến xe?"
            description={`Bạn có chắc chắn muốn xóa "${record.tenBenXe}"?`}
            onConfirm={() => Delete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="middle">
              Xóa
            </Button>
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
          <h1 className="text-2xl font-bold text-gray-800">Cấu Hình Bến Xe</h1>
          <p className="text-sm text-gray-500">
            Quản lý danh sách các bến xe theo từng tỉnh/thành phố để sử dụng làm điểm đón/trả cho các tuyến đường.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          className="bg-green-600 hover:bg-green-700 transition-colors shadow-sm font-semibold rounded-lg"
          onClick={handleOpenAddModal}
        >
          Thêm Bến Xe Mới
        </Button>
      </div>

      {/* FILTER CARD */}
      <Card className="shadow-xs border border-gray-100 rounded-xl bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <Input
              placeholder="Tìm kiếm bến xe, địa chỉ..."
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Select
              placeholder="Lọc theo Tỉnh/Thành phố"
              size="large"
              className="w-full"
              value={selectedProvince}
              onChange={(val) => setSelectedProvince(val)}
              showSearch
              options={[
                { value: "All", label: "Tất cả các tỉnh / thành phố" },
                ...NORTHERN_PROVINCES.map((p) => ({ value: p, label: p })),
              ]}
            />
          </div>

          <div>
            <Select
              placeholder="Lọc theo trạng thái"
              size="large"
              className="w-full"
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
              options={[
                { value: "All", label: "Tất cả trạng thái" },
                { value: "active", label: "Hoạt động" },
                { value: "inactive", label: "Dừng hoạt động" },
              ]}
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={filteredList}
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng số ${total} bến xe`,
            }}
          />
        </div>
      </Card>

      {/* MODAL THÊM / SỬA BẾN XE */}
      <Modal
        title={
          <span className="text-lg font-bold">
            {editingStation ? "Chỉnh Sửa Bến Xe" : "Thêm Bến Xe Mới"}
          </span>
        }
        open={modalOpen}
        onOk={handleFormSubmit}
        onCancel={handleCloseModal}
        okText={editingStation ? "Cập Nhật" : "Thêm Mới"}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="Tỉnh / Thành Phố"
            name="tinh"
            rules={[{ required: true, message: "Vui lòng chọn tỉnh/thành phố" }]}
          >
            <Select
              showSearch
              placeholder="Chọn tỉnh thành phố"
              options={NORTHERN_PROVINCES.map((p) => ({ label: p, value: p }))}
            />
          </Form.Item>

          <Form.Item
            label="Tên Bến Xe"
            name="tenBenXe"
            rules={[
              { required: true, message: "Vui lòng nhập tên bến xe" },
              { min: 3, message: "Tên bến xe phải có ít nhất 3 ký tự" },
            ]}
          >
            <Input placeholder="VD: Bến xe Mỹ Đình, Bến xe Nước Ngầm..." />
          </Form.Item>

          <Form.Item label="Địa Chỉ Chi Tiết (Tùy chọn)" name="diaChi">
            <Input placeholder="VD: Số 20 Phạm Hùng, Mỹ Đình, Nam Từ Liêm, Hà Nội" />
          </Form.Item>

          <Form.Item
            label="Trạng Thái"
            name="trangThai"
            initialValue={true}
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select
              options={[
                { value: true, label: "Hoạt động" },
                { value: false, label: "Dừng hoạt động" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default StationListPage;
