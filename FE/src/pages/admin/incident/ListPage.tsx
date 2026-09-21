import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Card,
  Divider,
  Typography,
  message,
  Select,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Badge,
  Tooltip,
  Image,
} from "antd";
import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  DeleteOutlined,
  SearchOutlined,
  CarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface IncidentType {
  _id: string;
  trip?: {
    _id: string;
    journey?: {
      diemDi: string;
      diemDen: string;
      startPoint?: string;
      endPoint?: string;
    };
    bus?: {
      name: string;
      licensePlates: string;
    };
    departureTime: string;
    status?: string;
  };
  staff?: {
    _id: string;
    ten?: string;
    sdt?: string;
  };
  driverName: string;
  issueType: string;
  severity: string;
  note: string;
  images?: string[];
  tripInfo?: {
    route: string;
    busName: string;
    licensePlates: string;
    departureTime: string;
  };
  status: string;
  adminResponse?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function IncidentListPage() {
  const [incidents, setIncidents] = useState<IncidentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("All");

  // Modal xử lý sự cố
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentType | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/api/incident");
      if (res.data && res.data.success) {
        setIncidents(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Lỗi lấy danh sách sự cố:", err);
      message.error("Không thể tải danh sách báo cáo sự cố!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Thống kê nhanh
  const totalIncidents = incidents.length;
  const pendingCount = incidents.filter(
    (i) => i.status === "Chờ xử lý" || !i.status
  ).length;
  const processingCount = incidents.filter(
    (i) => i.status === "Đang xử lý"
  ).length;
  const resolvedCount = incidents.filter(
    (i) => i.status === "Đã giải quyết"
  ).length;

  // Lọc dữ liệu
  const filteredIncidents = incidents.filter((item) => {
    // Lọc theo trạng thái
    if (selectedStatus !== "All" && item.status !== selectedStatus) {
      return false;
    }
    // Lọc theo mức độ
    if (selectedSeverity !== "All" && item.severity !== selectedSeverity) {
      return false;
    }
    // Tìm kiếm text
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      const driver = (item.driverName || "").toLowerCase();
      const note = (item.note || "").toLowerCase();
      const issueType = (item.issueType || "").toLowerCase();
      const route = (item.tripInfo?.route || "").toLowerCase();
      const plates = (
        item.tripInfo?.licensePlates ||
        item.trip?.bus?.licensePlates ||
        ""
      ).toLowerCase();
      const tripId = (item.trip?._id || "").toLowerCase();

      return (
        driver.includes(query) ||
        note.includes(query) ||
        issueType.includes(query) ||
        route.includes(query) ||
        plates.includes(query) ||
        tripId.includes(query)
      );
    }
    return true;
  });

  const handleOpenProcessModal = (record: IncidentType) => {
    setSelectedIncident(record);
    form.setFieldsValue({
      status: record.status || "Chờ xử lý",
      adminResponse: record.adminResponse || "",
    });
    setIsProcessModalOpen(true);
  };

  const handleProcessSubmit = async (values: any) => {
    if (!selectedIncident) return;
    setSubmitting(true);
    try {
      const res = await axios.put(
        `http://localhost:3000/api/incident/${selectedIncident._id}/status`,
        {
          status: values.status,
          adminResponse: values.adminResponse?.trim() || "",
        }
      );

      if (res.data && res.data.success) {
        message.success(
          res.data.message || "Cập nhật trạng thái sự cố thành công!"
        );
        setIsProcessModalOpen(false);
        setSelectedIncident(null);
        fetchIncidents();
        window.dispatchEvent(new Event("incident_updated"));
      }
    } catch (err: any) {
      console.error("Lỗi cập nhật sự cố:", err);
      message.error(
        err.response?.data?.message || "Cập nhật thất bại, vui lòng thử lại!"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIncident = async (id: string) => {
    try {
      const res = await axios.delete(
        `http://localhost:3000/api/incident/${id}`
      );
      if (res.data && res.data.success) {
        message.success("Đã xóa báo cáo sự cố!");
        fetchIncidents();
        window.dispatchEvent(new Event("incident_updated"));
      }
    } catch (err: any) {
      message.error("Lỗi khi xóa sự cố!");
    }
  };

  // Helper render mức độ nghiêm trọng
  const renderSeverityTag = (severity: string) => {
    let color = "blue";
    let icon = <CheckCircleOutlined />;
    if (severity === "Khẩn cấp") {
      color = "error";
      icon = <AlertOutlined />;
    } else if (severity === "Nghiêm trọng") {
      color = "warning";
      icon = <WarningOutlined />;
    }
    return (
      <Tag color={color} icon={icon} className="font-semibold px-2 py-0.5">
        {severity || "Bình thường"}
      </Tag>
    );
  };

  // Helper render trạng thái
  const renderStatusTag = (status: string) => {
    let color = "default";
    if (status === "Chờ xử lý") color = "volcano";
    else if (status === "Đang xử lý") color = "processing";
    else if (status === "Đã giải quyết") color = "success";

    return (
      <Tag color={color} className="font-medium text-xs">
        {status || "Chờ xử lý"}
      </Tag>
    );
  };

  const columns = [
    {
      title: "Thời gian",
      key: "createdAt",
      width: 130,
      render: (_: any, record: IncidentType) => (
        <div className="text-xs">
          <div className="font-semibold text-gray-800">
            {dayjs(record.createdAt).format("HH:mm")}
          </div>
          <div className="text-gray-500">
            {dayjs(record.createdAt).format("DD/MM/YYYY")}
          </div>
        </div>
      ),
    },
    {
      title: "Chuyến xe & Tuyến đường",
      key: "trip",
      render: (_: any, record: IncidentType) => {
        const route =
          record.tripInfo?.route ||
          (record.trip?.journey
            ? `${record.trip.journey.diemDi || record.trip.journey.startPoint || ""} → ${record.trip.journey.diemDen || record.trip.journey.endPoint || ""}`
            : "Chưa rõ tuyến");

        const departureTime = record.tripInfo?.departureTime || record.trip?.departureTime;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-gray-900 text-sm">
              <EnvironmentOutlined className="text-emerald-600" />
              <span>{route}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-bold">
                #{record.trip?._id?.slice(-6).toUpperCase() || "TRIP"}
              </span>
              {departureTime && (
                <span>
                  Khởi hành: {dayjs(departureTime).format("DD/MM HH:mm")}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Phương tiện",
      key: "bus",
      width: 160,
      render: (_: any, record: IncidentType) => {
        const busName =
          record.tripInfo?.busName || record.trip?.bus?.name || "N/A";
        const licensePlates =
          record.tripInfo?.licensePlates ||
          record.trip?.bus?.licensePlates ||
          "N/A";

        return (
          <div className="text-xs space-y-0.5">
            <div className="font-medium text-gray-800">{busName}</div>
            <Tag color="blue" className="font-mono font-bold">
              {licensePlates}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Tài xế báo cáo",
      key: "driverName",
      width: 150,
      render: (_: any, record: IncidentType) => (
        <div className="flex items-center gap-1.5 text-xs">
          <UserOutlined className="text-gray-400" />
          <div>
            <div className="font-semibold text-gray-800">
              {record.driverName || record.staff?.ten || "Tài xế"}
            </div>
            {record.staff?.sdt && (
              <div className="text-gray-500 font-mono">{record.staff.sdt}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Phân loại & Mức độ",
      key: "classification",
      width: 180,
      render: (_: any, record: IncidentType) => (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-gray-700">
            {record.issueType}
          </div>
          <div>{renderSeverityTag(record.severity)}</div>
        </div>
      ),
    },
    {
      title: "Nội dung sự cố",
      key: "note",
      render: (_: any, record: IncidentType) => (
        <div className="max-w-xs text-xs">
          <Paragraph
            ellipsis={{ rows: 2, expandable: true, symbol: "Xem thêm" }}
            className="text-gray-700 !mb-0"
          >
            {record.note}
          </Paragraph>
          {record.adminResponse && (
            <div className="mt-1.5 bg-emerald-50 text-emerald-800 p-1.5 rounded border border-emerald-200 text-[11px]">
              <span className="font-bold">Admin phản hồi:</span> {record.adminResponse}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 120,
      align: "center" as const,
      render: (_: any, record: IncidentType) => renderStatusTag(record.status),
    },
    {
      title: "Hành động",
      key: "action",
      width: 140,
      align: "center" as const,
      render: (_: any, record: IncidentType) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenProcessModal(record)}
            style={{
              background:
                record.status === "Đã giải quyết" ? "#10b981" : "#2563eb",
              borderColor:
                record.status === "Đã giải quyết" ? "#10b981" : "#2563eb",
            }}
          >
            Xử lý
          </Button>

          <Popconfirm
            title="Xóa báo cáo sự cố này?"
            description="Hành động này không thể hoàn tác."
            onConfirm={() => handleDeleteIncident(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 w-full">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Title level={3} className="!mb-1 flex items-center gap-2">
            <AlertOutlined className="text-red-500" />
            <span>Quản lý Báo cáo Sự cố Chuyến xe</span>
          </Title>
          <Text type="secondary" className="text-sm">
            Tiếp nhận, theo dõi và xử lý kịp thời các sự cố do tài xế báo cáo trong ca chạy
          </Text>
        </div>

        <Button
          icon={<SyncOutlined spin={loading} />}
          onClick={fetchIncidents}
          className="rounded-lg shadow-sm font-medium"
        >
          Làm mới dữ liệu
        </Button>
      </div>

      {/* KPI STATISTICS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-2xl shadow-sm border border-slate-200">
            <Statistic
              title={<span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tổng sự cố tiếp nhận</span>}
              value={totalIncidents}
              prefix={<AlertOutlined className="text-blue-500 mr-1" />}
              valueStyle={{ fontWeight: 800, color: "#1e293b" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-2xl shadow-sm border border-red-100 bg-red-50/30">
            <Statistic
              title={<span className="text-xs text-red-600 font-bold uppercase tracking-wider">Chờ xử lý (Cần ưu tiên)</span>}
              value={pendingCount}
              prefix={<ClockCircleOutlined className="text-red-500 mr-1" />}
              valueStyle={{ fontWeight: 800, color: "#e11d48" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-2xl shadow-sm border border-amber-100 bg-amber-50/30">
            <Statistic
              title={<span className="text-xs text-amber-600 font-bold uppercase tracking-wider">Đang điều phối xử lý</span>}
              value={processingCount}
              prefix={<SyncOutlined spin className="text-amber-500 mr-1" />}
              valueStyle={{ fontWeight: 800, color: "#d97706" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-2xl shadow-sm border border-emerald-100 bg-emerald-50/30">
            <Statistic
              title={<span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Đã giải quyết xong</span>}
              value={resolvedCount}
              prefix={<CheckCircleOutlined className="text-emerald-500 mr-1" />}
              valueStyle={{ fontWeight: 800, color: "#059669" }}
            />
          </Card>
        </Col>
      </Row>

      {/* FILTER & SEARCH */}
      <Card className="rounded-2xl shadow-sm border border-slate-200">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <Input
              placeholder="Tìm kiếm theo tài xế, tuyến đường, biển số xe, nội dung..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="middle"
              className="rounded-lg"
            />
          </Col>

          <Col xs={12} md={7}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium shrink-0">Trạng thái:</span>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: "100%" }}
                size="middle"
                options={[
                  { value: "All", label: "Tất cả trạng thái" },
                  { value: "Chờ xử lý", label: "⏳ Chờ xử lý" },
                  { value: "Đang xử lý", label: "⚙️ Đang xử lý" },
                  { value: "Đã giải quyết", label: "✅ Đã giải quyết" },
                ]}
              />
            </div>
          </Col>

          <Col xs={12} md={7}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium shrink-0">Mức độ:</span>
              <Select
                value={selectedSeverity}
                onChange={setSelectedSeverity}
                style={{ width: "100%" }}
                size="middle"
                options={[
                  { value: "All", label: "Tất cả mức độ" },
                  { value: "Khẩn cấp", label: "🚨 Khẩn cấp" },
                  { value: "Nghiêm trọng", label: "⚠️ Nghiêm trọng" },
                  { value: "Bình thường", label: "ℹ️ Bình thường" },
                ]}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* TABLE */}
      <Card className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredIncidents}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `Tổng cộng ${total} sự cố`,
          }}
          locale={{
            emptyText: (
              <div className="py-12 text-center text-gray-400">
                <AlertOutlined style={{ fontSize: 36, color: "#cbd5e1", marginBottom: 12 }} />
                <p>Không tìm thấy báo cáo sự cố nào.</p>
              </div>
            ),
          }}
        />
      </Card>

      {/* MODAL XỬ LÝ SỰ CỐ */}
      <Modal
        open={isProcessModalOpen}
        title={
          <Space align="center">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertOutlined style={{ fontSize: 18 }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800 m-0">
                Xử lý & Cập nhật Báo cáo Sự cố
              </h3>
              <p className="text-xs text-gray-500 m-0">
                Cập nhật tiến trình giải quyết và phản hồi về cho tài xế
              </p>
            </div>
          </Space>
        }
        onCancel={() => {
          setIsProcessModalOpen(false);
          setSelectedIncident(null);
        }}
        footer={null}
        width={650}
        centered
        destroyOnClose
      >
        {selectedIncident && (
          <div className="space-y-4 py-2">
            {/* THÔNG TIN CHI TIẾT SỰ CỐ */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Mã chuyến xe: </span>
                  <span className="font-bold text-gray-800 font-mono">
                    #{selectedIncident.trip?._id?.slice(-6).toUpperCase() || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Thời gian báo: </span>
                  <span className="font-medium text-gray-800">
                    {dayjs(selectedIncident.createdAt).format("DD/MM/YYYY HH:mm:ss")}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-gray-500">Tuyến đường: </span>
                <span className="font-semibold text-emerald-700">
                  {selectedIncident.tripInfo?.route || "Chưa rõ tuyến"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Xe & Biển số: </span>
                  <span className="font-medium text-gray-800">
                    {selectedIncident.tripInfo?.busName} ({selectedIncident.tripInfo?.licensePlates})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Tài xế: </span>
                  <span className="font-bold text-gray-800">
                    {selectedIncident.driverName}
                  </span>
                </div>
              </div>

              <Divider className="!my-2" />

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-500">Loại sự cố: </span>
                  <span className="font-semibold text-gray-800">
                    {selectedIncident.issueType}
                  </span>
                </div>
                <div>{renderSeverityTag(selectedIncident.severity)}</div>
              </div>

              <div className="pt-1">
                <span className="text-gray-500 block mb-1">Ghi chú của tài xế:</span>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selectedIncident.note}
                </div>
              </div>

              {/* HÌNH ẢNH MINH CHỨNG (NẾU CÓ) */}
              {selectedIncident.images && selectedIncident.images.length > 0 && (
                <div className="pt-2">
                  <span className="text-gray-500 block mb-1 font-semibold">
                    Ảnh minh chứng:
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {selectedIncident.images.map((imgUrl, index) => (
                      <Image
                        key={index}
                        src={imgUrl}
                        width={80}
                        height={80}
                        className="object-cover rounded-lg border border-slate-200"
                        alt="Minh chứng"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* FORM CẬP NHẬT TRẠNG THÁI */}
            <Form form={form} layout="vertical" onFinish={handleProcessSubmit}>
              <Form.Item
                name="status"
                label={<span className="text-xs font-semibold text-gray-700">Trạng thái xử lý sự cố</span>}
                rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
              >
                <Select
                  size="large"
                  options={[
                    {
                      value: "Chờ xử lý",
                      label: (
                        <div className="flex items-center gap-2">
                          <Badge status="error" />
                          <span className="font-medium text-red-600">Chờ xử lý (Chưa tiếp nhận)</span>
                        </div>
                      ),
                    },
                    {
                      value: "Đang xử lý",
                      label: (
                        <div className="flex items-center gap-2">
                          <Badge status="processing" />
                          <span className="font-medium text-amber-600">Đang xử lý (Đang điều phối hỗ trợ)</span>
                        </div>
                      ),
                    },
                    {
                      value: "Đã giải quyết",
                      label: (
                        <div className="flex items-center gap-2">
                          <Badge status="success" />
                          <span className="font-medium text-emerald-600">Đã giải quyết (Hoàn tất xử lý)</span>
                        </div>
                      ),
                    },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="adminResponse"
                label={<span className="text-xs font-semibold text-gray-700">Phản hồi / Phương án xử lý của Admin</span>}
              >
                <TextArea
                  rows={3}
                  placeholder="Nhập ghi chú phản hồi, phương án khắc phục (ví dụ: Đã cử xe thay thế, liên hệ cứu hộ trạm km 45...)"
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <div className="border-t pt-3 flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setIsProcessModalOpen(false);
                    setSelectedIncident(null);
                  }}
                  disabled={submitting}
                >
                  Đóng
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 border-none"
                >
                  Lưu cập nhật
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
