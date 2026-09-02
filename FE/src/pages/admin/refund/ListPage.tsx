import React, { useState } from "react";
import { Table, Button, Space, Tag, Modal, Form, Input, Card, Upload, Divider, Typography, message } from "antd";
import { UploadOutlined, QrcodeOutlined, EyeOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useCRUD } from "../../../hooks/useCRUD";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;

interface RefundType {
  _id: string;
  booking?: {
    _id: string;
    orderCode: number;
    seats: string[];
    totalPrice: number;
    status: string;
    trip?: {
      _id: string;
      journey?: {
        diemDi: string;
        diemDen: string;
      };
      departureTime: string;
    };
  };
  user?: {
    _id: string;
    username: string;
    email: string;
  };
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  reason: string;
  status: string;
  proofImage?: string;
  requestedAt?: string;
  processedAt?: string;
}

const VIETNAMESE_BANKS: Record<string, string> = {
  VCB: "Vietcombank",
  TCB: "Techcombank",
  MB: "MBBank",
  BIDV: "BIDV",
  CTG: "VietinBank",
  ACB: "ACB",
  VPB: "VPBank",
  TPB: "TPBank",
  STB: "Sacombank",
  VIB: "VIB",
  SHB: "SHB",
  HDB: "HDBank",
  MSB: "MSB",
  OCB: "OCB"
};

export default function RefundListPage() {
  const { list: refunds } = useCRUD("refund");
  const queryClient = useQueryClient();
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundType | null>(null);
  const [proofImage, setProofImage] = useState<string>("");
  const [form] = Form.useForm();

  const getRefundPolicy = (record: RefundType) => {
    const departureTime = record.booking?.trip?.departureTime;
    const requestedTime = record.requestedAt || (record as any).createdAt;
    
    if (!departureTime || !requestedTime) {
      return {
        percent: 100,
        amount: record.amount,
        hours: null,
        label: "N/A"
      };
    }

    const dep = dayjs(departureTime);
    const req = dayjs(requestedTime);
    const diffHours = dep.diff(req, "hour", true);
    const originalPrice = record.booking?.totalPrice || record.amount;

    if (diffHours >= 6) {
      return {
        percent: 100,
        amount: originalPrice,
        hours: diffHours,
        label: "Ngoài 6 tiếng (Miễn phí hủy - Hoàn 100%)"
      };
    } else if (diffHours >= 2 && diffHours < 6) {
      return {
        percent: 50,
        amount: originalPrice * 0.5,
        hours: diffHours,
        label: "Từ 2 - 5 tiếng (Phí hủy 50% - Hoàn 50%)"
      };
    } else {
      return {
        percent: 0,
        amount: 0,
        hours: diffHours,
        label: "Dưới 2 tiếng (Phí hủy 100% - Không hoàn tiền)"
      };
    }
  };

  const handleOpenProcess = (record: RefundType) => {
    setSelectedRefund(record);
    setProofImage("");
    form.resetFields();
    setIsProcessModalOpen(true);
  };

  const handleOpenProof = (record: RefundType) => {
    setSelectedRefund(record);
    setIsProofModalOpen(true);
  };

  const handleUploadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setProofImage(e.target.result as string);
        form.setFieldsValue({ proofUrl: e.target.result as string });
      }
    };
    reader.readAsDataURL(file);
    return false; // Prevent auto-upload
  };

  const handleSubmitRefund = async (values: any) => {
    if (!selectedRefund) return;
    
    const finalProof = values.proofUrl || proofImage;
    if (!finalProof) {
      message.error("Vui lòng tải lên ảnh minh chứng hoặc nhập đường dẫn ảnh chuyển khoản!");
      return;
    }

    try {
      const policy = getRefundPolicy(selectedRefund);
      await axios.put(`http://localhost:3000/api/refund/update/${selectedRefund._id}`, {
        status: "Đã hoàn tiền",
        amount: policy.amount,
        proofImage: finalProof,
        processedAt: new Date()
      });
      message.success("Xử lý hoàn tiền thành công!");
      setIsProcessModalOpen(false);
      setSelectedRefund(null);
      queryClient.invalidateQueries({ queryKey: ["refund"] });
    } catch (err: any) {
      console.error("Lỗi khi xử lý hoàn tiền:", err);
      message.error("Có lỗi xảy ra khi xử lý hoàn tiền.");
    }
  };

  const columns: ColumnsType<RefundType> = [
    {
      title: "Mã vé",
      render: (_, record) => <strong>NB-{record.booking?.orderCode || "XXXXXX"}</strong>,
    },
    {
      title: "Khách hàng",
      render: (_, record) => (
        <div>
          <div className="font-bold text-slate-800">{record.user?.username || "Ẩn danh"}</div>
          <div className="text-xs text-slate-500">{record.user?.email || ""}</div>
        </div>
      ),
    },
    {
      title: "Tuyến đường",
      render: (_, record) => (
        <span>
          {record.booking?.trip?.journey?.diemDi} → {record.booking?.trip?.journey?.diemDen}
        </span>
      ),
    },
    {
      title: "Số ghế",
      render: (_, record) => <Tag color="blue">{record.booking?.seats?.join(", ") || "Chưa chọn"}</Tag>,
    },
    {
      title: "Số tiền hoàn trả",
      render: (_, record) => {
        const policy = getRefundPolicy(record);
        return (
          <div className="space-y-1">
            <div className="font-bold text-red-500">{policy.amount?.toLocaleString("vi-VN")}đ</div>
            {record.booking?.totalPrice && record.booking.totalPrice !== policy.amount && (
              <div className="text-[10px] text-slate-400 line-through">Gốc: {record.booking.totalPrice?.toLocaleString("vi-VN")}đ</div>
            )}
            <div className="text-[10px] text-slate-500 font-medium">{policy.label}</div>
          </div>
        );
      },
    },
    {
      title: "Ngân hàng thụ hưởng",
      render: (_, record) => {
        const bankName = VIETNAMESE_BANKS[record.bankName] || record.bankName;
        return (
          <div className="text-xs space-y-0.5">
            <div>Ngân hàng: <strong>{bankName}</strong></div>
            <div>STK: <strong>{record.accountNumber}</strong></div>
            <div>Tên: <strong>{record.accountName}</strong></div>
          </div>
        );
      },
    },
    {
      title: "Lý do hủy",
      render: (_, record) => record.reason || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Đã hoàn tiền" ? "green" : "orange"} className="font-bold">
          {status}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          {record.status === "Chờ hoàn tiền" ? (
            <Button
              type="primary"
              size="small"
              className="bg-emerald-600 border-none hover:bg-emerald-500"
              onClick={() => handleOpenProcess(record)}
            >
              Xử lý hoàn tiền
            </Button>
          ) : (
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleOpenProof(record)}
            >
              Minh chứng
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Generate VietQR URL dynamically based on bank code, account number, name, and amount
  const getVietQrUrl = (refund: RefundType) => {
    const bank = refund.bankName;
    const account = refund.accountNumber;
    const name = refund.accountName;
    const policy = getRefundPolicy(refund);
    const amount = policy.amount;
    const addInfo = `Hoan tien don hang NB-${refund.booking?.orderCode || "XXXXXX"}`;

    return `https://img.vietqr.io/image/${bank}-${account}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(name)}`;
  };

  return (
    <Card title={<Title level={3} className="!mb-0">Danh sách hoàn trả & hủy vé</Title>}>
      <Table
        dataSource={refunds}
        columns={columns}
        rowKey="_id"
        bordered
        pagination={{ pageSize: 10 }}
      />

      {/* PROCESS REFUND MODAL */}
      <Modal
        title={<span className="text-emerald-700 font-bold text-lg">Xử lý hoàn tiền vé khách hàng</span>}
        open={isProcessModalOpen}
        onCancel={() => setIsProcessModalOpen(false)}
        footer={null}
        width={750}
        centered
        destroyOnClose
      >
        {selectedRefund && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
            {/* Left: VietQR Code display */}
            <div className="flex flex-col items-center justify-center p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800/40">
              <Text strong className="block mb-2 text-center text-slate-700">MÃ QUÉT CHUYỂN KHOẢN VIETQR</Text>
              <img
                src={getVietQrUrl(selectedRefund)}
                alt="VietQR Code"
                className="max-w-xs w-full shadow-md rounded-2xl border border-slate-200"
                style={{ minHeight: "260px" }}
              />
              <Text type="secondary" className="block text-xs mt-3 text-center">
                * Quét mã này bằng ứng dụng ngân hàng để tự động điền STK, Số tiền và Nội dung chuyển tiền hoàn vé.
              </Text>
            </div>

            {/* Right: Bank details & proof uploading */}
            <div className="space-y-4">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl space-y-1.5 text-xs">
                <div>Khách hàng: <strong>{selectedRefund.user?.username}</strong></div>
                <div>Ngân hàng: <strong>{VIETNAMESE_BANKS[selectedRefund.bankName] || selectedRefund.bankName}</strong></div>
                <div>Số tài khoản: <strong>{selectedRefund.accountNumber}</strong></div>
                <div>Chủ tài khoản: <strong>{selectedRefund.accountName}</strong></div>
                <div>Số tiền vé gốc: <strong>{selectedRefund.booking?.totalPrice?.toLocaleString("vi-VN")}đ</strong></div>
                <div>Khởi hành: <strong>{selectedRefund.booking?.trip?.departureTime ? dayjs(selectedRefund.booking.trip.departureTime).format("HH:mm - DD/MM/YYYY") : "N/A"}</strong></div>
                <div>Thời gian hủy: <strong>{selectedRefund.requestedAt ? dayjs(selectedRefund.requestedAt).format("HH:mm - DD/MM/YYYY") : "N/A"}</strong></div>
                <Divider style={{ margin: "4px 0" }} />
                <div>Chính sách: <span className="text-emerald-700 font-bold">{getRefundPolicy(selectedRefund).label}</span></div>
                <div>Số tiền hoàn trả thực tế: <strong className="text-red-500 text-sm">{getRefundPolicy(selectedRefund).amount?.toLocaleString("vi-VN")}đ</strong></div>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmitRefund}
                className="space-y-4"
              >
                <Form.Item
                  label="Tải lên ảnh chụp minh chứng chuyển tiền"
                  name="proofUpload"
                  valuePropName="fileList"
                  getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                >
                  <Upload
                    beforeUpload={handleUploadFile}
                    maxCount={1}
                    listType="picture"
                    showUploadList={true}
                  >
                    <Button icon={<UploadOutlined />} className="w-full">Chọn ảnh từ thiết bị</Button>
                  </Upload>
                </Form.Item>

                <div className="text-center font-bold text-slate-400 text-xs my-1">— HOẶC NHẬP URL ẢNH —</div>

                <Form.Item
                  name="proofUrl"
                  label="Đường dẫn ảnh minh chứng chuyển khoản (URL)"
                >
                  <Input placeholder="https://example.com/receipt-proof.jpg" size="large" onChange={(e) => setProofImage(e.target.value)} />
                </Form.Item>

                {proofImage && (
                  <div className="border p-2 rounded-xl text-center bg-slate-50">
                    <Text type="secondary" className="text-xs block mb-1">Xem trước ảnh minh chứng:</Text>
                    <img src={proofImage} alt="Receipt preview" className="max-h-36 mx-auto rounded-lg shadow-sm" />
                  </div>
                )}

                <Divider className="my-3" />

                <div className="flex justify-end gap-3 pt-2">
                  <Button onClick={() => setIsProcessModalOpen(false)}>Hủy bỏ</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<CheckCircleOutlined />}
                    className="bg-emerald-600 border-none hover:bg-emerald-500 font-bold"
                  >
                    Xác nhận đã hoàn tiền
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        )}
      </Modal>

      {/* VIEW PROOF MODAL */}
      <Modal
        title={<span className="text-slate-800 font-bold text-lg">Ảnh chụp minh chứng hoàn tiền</span>}
        open={isProofModalOpen}
        onCancel={() => setIsProofModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsProofModalOpen(false)}>
            Đóng
          </Button>
        ]}
        width={500}
        centered
        destroyOnClose
      >
        {selectedRefund && selectedRefund.proofImage ? (
          <div className="p-3 text-center space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border text-xs text-left mb-3">
              <div>Đã xử lý hoàn vé cho: <strong>{selectedRefund.user?.username}</strong></div>
              <div>Số tiền: <strong className="text-red-500 font-bold">{selectedRefund.amount?.toLocaleString("vi-VN")}đ</strong></div>
              <div>Vào lúc: <strong>{selectedRefund.processedAt ? dayjs(selectedRefund.processedAt).format("HH:mm - DD/MM/YYYY") : "Chưa rõ"}</strong></div>
            </div>
            <img
              src={selectedRefund.proofImage}
              alt="Proof of refund"
              className="w-full rounded-2xl shadow-md border"
            />
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400">Không tìm thấy ảnh minh chứng hoàn tiền.</div>
        )}
      </Modal>
    </Card>
  );
}
