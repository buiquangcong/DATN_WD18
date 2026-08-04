import React, { useState, useEffect } from "react";
import { Table, Button, Space, Tag, Input, Select, Card, Row, Col, Typography } from "antd";
import { PrinterOutlined, ArrowLeftOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title } = Typography;

interface BookingType {
  _id: string;
  orderCode: number;
  user?: {
    username: string;
    email: string;
    phone?: string;
    sdt?: string;
  };
  trip?: {
    _id: string;
    departureTime: string;
    bus?: {
      name: string;
      licensePlates: string;
    };
    journey?: {
      diemDi: string;
      diemDen: string;
    };
  };
  seats: string[];
  totalPrice: number;
  status: string;
}

export default function OfflineBookingHistoryPage() {
  const navigate = useNavigate();
  const [bookingHistory, setBookingHistory] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("All"); // All, cash, payos

  // Lấy các phương thức thanh toán đã đặt trong phiên làm việc
  const [sessionPaymentMethods, setSessionPaymentMethods] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Đọc session cache nếu có
    try {
      const cached = localStorage.getItem("counter_session_payment_methods");
      if (cached) {
        setSessionPaymentMethods(JSON.parse(cached));
      }
    } catch (e) {
      console.error(e);
    }
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/api/booking");
      // Sắp xếp các đơn mới nhất lên đầu
      const sorted = (res.data || []).sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setBookingHistory(sorted);
    } catch (err) {
      console.error("Lỗi tải lịch sử đặt vé:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRecordPaymentMethod = (record: BookingType) => {
    const sessionMethod = sessionPaymentMethods[record._id];
    if (sessionMethod) return sessionMethod;

    if (record.status === "Đã checkin" || record.user?.email?.endsWith("@netbus.vn")) {
      return "cash";
    }
    return "payos";
  };

  const filteredHistory = bookingHistory.filter((record) => {
    const searchLower = searchText.toLowerCase().trim();

    const customerName = record.user?.username || "Khách vãng lai";
    const customerEmail = record.user?.email || "";
    const customerPhone = record.user?.phone || record.user?.sdt || (record.user?.email?.endsWith("@netbus.vn") ? record.user.email.split("@")[0] : "");
    const orderCodeStr = String(record.orderCode || "");
    const routeName = record.trip?.journey ? `${record.trip.journey.diemDi} ${record.trip.journey.diemDen}` : "";

    const matchesSearch =
      !searchLower ||
      customerName.toLowerCase().includes(searchLower) ||
      customerEmail.toLowerCase().includes(searchLower) ||
      customerPhone.toLowerCase().includes(searchLower) ||
      orderCodeStr.toLowerCase().includes(searchLower) ||
      routeName.toLowerCase().includes(searchLower);

    const method = getRecordPaymentMethod(record);
    const matchesPayment = paymentFilter === "All" || method === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  return (
    <div style={{ padding: "24px" }}>
      <Card className="shadow-xs rounded-xl">
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Space size="middle">
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate("/admin/offline-booking")}
                className="flex items-center"
              >
                Quay lại đặt vé
              </Button>
              <Title level={3} style={{ margin: 0 }}>Lịch sử đặt vé tại quầy & hệ thống</Title>
            </Space>
          </Col>
        </Row>

        {/* Thanh tìm kiếm và bộ lọc */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={24} md={12} lg={16}>
            <Input
              placeholder="Tìm kiếm theo Tên, Email, Sđt khách hàng, Tuyến đường hoặc Mã đơn..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
              className="rounded-lg"
            />
          </Col>
          <Col span={24} md={12} lg={8}>
            <Select
              value={paymentFilter}
              onChange={(val) => setPaymentFilter(val)}
              size="large"
              style={{ width: "100%" }}
              className="rounded-lg"
              options={[
                { label: "Tất cả phương thức", value: "All" },
                { label: "Tiền mặt", value: "cash" },
                { label: "Chuyển khoản (PayOS)", value: "payos" },
              ]}
              suffixIcon={<FilterOutlined />}
            />
          </Col>
        </Row>

        {/* Bảng lịch sử đặt vé */}
        <Table
          dataSource={filteredHistory}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          columns={[
            {
              title: "Mã đơn",
              dataIndex: "orderCode",
              key: "orderCode",
              render: (val, record) => <span className="font-bold text-slate-700">#{val || record._id.slice(-6).toUpperCase()}</span>,
            },
            {
              title: "Khách hàng",
              key: "customer",
              render: (_, record) => {
                const phone = record.user?.phone || record.user?.sdt || (record.user?.email?.endsWith("@netbus.vn") ? record.user.email.split("@")[0] : "");
                return (
                  <div>
                    <div className="font-bold text-slate-800 uppercase">{record.user?.username || "Khách vãng lai"}</div>
                    <div className="text-xs text-gray-500">{record.user?.email}</div>
                    {phone && <div className="text-xs text-emerald-700 font-semibold">{phone}</div>}
                  </div>
                );
              },
            },
            {
              title: "Chuyến xe & Ghế",
              key: "trip",
              render: (_, record) => {
                const trip = record.trip;
                const route = trip?.journey ? `${trip.journey.diemDi} - ${trip.journey.diemDen}` : "---";
                const departure = trip?.departureTime
                  ? new Date(trip.departureTime).toLocaleString("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short"
                    })
                  : "---";
                return (
                  <div>
                    <div className="font-semibold text-slate-700">{route}</div>
                    <div className="text-xs text-gray-500">Khởi hành: {departure}</div>
                    <div className="mt-1">
                      {(record.seats || []).map((s: string) => (
                        <Tag color="blue" key={s} className="font-bold text-xs">{s}</Tag>
                      ))}
                    </div>
                  </div>
                );
              },
            },
            {
              title: "Hình thức thanh toán",
              key: "paymentMethod",
              render: (_, record) => {
                const method = getRecordPaymentMethod(record);
                return method === "cash" ? (
                  <Tag color="green" className="font-semibold px-2 py-0.5">Tiền mặt</Tag>
                ) : (
                  <Tag color="blue" className="font-semibold px-2 py-0.5">Chuyển khoản (PayOS)</Tag>
                );
              },
            },
            {
              title: "Tổng tiền",
              dataIndex: "totalPrice",
              key: "totalPrice",
              render: (val) => <span className="font-bold text-red-500">{(val || 0).toLocaleString("vi-VN")} đ</span>,
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              key: "status",
              render: (status) => {
                let color = "orange";
                if (status === "Đã xác nhận") color = "emerald";
                if (status === "Đã checkin") color = "cyan";
                if (status === "Đã huỷ") color = "red";
                return <Tag color={color} className="font-semibold">{status}</Tag>;
              },
            },
            {
              title: "Hành động",
              key: "action",
              render: (_, record) => {
                const trip = record.trip;
                const route = trip?.journey ? `${trip.journey.diemDi} → ${trip.journey.diemDen}` : "---";
                const departure = trip?.departureTime
                  ? new Date(trip.departureTime).toLocaleString("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short"
                    })
                  : "---";

                const handlePrint = () => {
                  const ticketStorageData = {
                    id: record._id,
                    ticketCode: `NB-${record.orderCode || record._id.slice(-6).toUpperCase()}`,
                    customerName: record.user?.username || "Khách vãng lai",
                    busName: trip?.bus?.name || "Xe NETBUS Luxury",
                    licensePlate: trip?.bus?.licensePlates || "29B-123.45",
                    journey: route,
                    seats: record.seats || [],
                    totalPrice: record.totalPrice || 0,
                    departureTime: departure
                  };
                  localStorage.setItem("latest_ticket_success", JSON.stringify(ticketStorageData));
                  navigate("/khachhang/booking/success");
                };
                return (
                  <Button type="primary" size="small" icon={<PrinterOutlined />} onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
                    In vé
                  </Button>
                );
              },
            },
          ]}
        />
      </Card>
    </div>
  );
}
