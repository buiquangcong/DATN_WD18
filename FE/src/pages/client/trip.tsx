import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  DatePicker,
  Button,
  Tag,
  Space,
  Typography,
  message,
  Select,
  Slider,
  Checkbox,
  Radio,
  Empty,
  Divider
} from "antd";
import {
  EnvironmentOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CarOutlined,
  SortAscendingOutlined,
  ClearOutlined,
  InfoCircleOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import { ClientLayout } from "./layout";
import dayjs from "dayjs";
import "dayjs/locale/vi"; // Import tiếng Việt cho dayjs

dayjs.locale("vi");

const { Title, Text } = Typography;
const { Option } = Select;

interface FareRule {
  weekdayPrice: number;
  weekendPrice: number;
}

interface DiemType {
  _id?: string;
  diaDiem: string;
  offsetMinutes: number;
}

interface Journey {
  diemDi: string;
  diemDen: string;
  thoiGianDiChuyen: string;
  price: number;
  diemDon?: DiemType[];
  diemTra?: DiemType[];
}

interface Bus {
  name: string;
  type: string;
}

interface Seat {
  status: string;
}

interface TripData {
  _id: string;
  journey: Journey;
  fareRule: FareRule;
  bus: Bus;
  departureTime: string;
  arrivalTime: string;
  status: string;
  seats: Seat[];
}

export default function Trip(): React.ReactElement {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPolicy, setShowPolicy] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  const [expandedTrips, setExpandedTrips] = useState<Record<string, boolean>>({});

  const toggleTripExpand = (tripId: string) => {
    setExpandedTrips(prev => ({
      ...prev,
      [tripId]: !prev[tripId]
    }));
  };

  const [diemDi, setDiemDi] = useState<string | undefined>(undefined);
  const [diemDen, setDiemDen] = useState<string | undefined>(undefined);
  const [ngayDi, setNgayDi] = useState<dayjs.Dayjs | null>(null);

  const [appliedSearch, setAppliedSearch] = useState<{
    diemDi?: string;
    diemDen?: string;
    ngayDi: string | null;
  }>({
    diemDi: undefined,
    diemDen: undefined,
    ngayDi: null,
  });

  const [selectedBusTypes, setSelectedBusTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1500000]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("time_asc");

  // 🌟 Đọc URL query parameters từ Dashboard truyền sang
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const paramDiemDi = queryParams.get("diemDi") || undefined;
    const paramDiemDen = queryParams.get("diemDen") || undefined;
    const paramNgayDi = queryParams.get("ngayDi");

    const parsedNgayDi = paramNgayDi ? dayjs(paramNgayDi) : null;

    setDiemDi(paramDiemDi);
    setDiemDen(paramDiemDen);
    setNgayDi(parsedNgayDi && parsedNgayDi.isValid() ? parsedNgayDi : null);

    setAppliedSearch({
      diemDi: paramDiemDi,
      diemDen: paramDiemDen,
      ngayDi: paramNgayDi && parsedNgayDi?.isValid() ? paramNgayDi : null,
    });
  }, [location.search]);

  const fetchTrips = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get<{ data?: TripData[] } & TripData[]>("http://localhost:3000/api/trip");
      let allTrips: TripData[] = [];
      if (response.data && "data" in response.data && Array.isArray(response.data.data)) {
        allTrips = response.data.data;
      } else if (Array.isArray(response.data)) {
        allTrips = response.data as unknown as TripData[];
      }
      const upcomingTrips = allTrips.filter(t => t.status === "sắp chạy");
      setTrips(upcomingTrips);
    } catch (error) {
      console.error("Lỗi lấy danh sách chuyến:", error);
      message.error("Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Format Giờ hiển thị (14:30)
  const formatTime = (dateString: string): string => {
    if (!dateString) return "--:--";
    return dayjs(dateString).format("HH:mm");
  };

  // Format Ngày tháng hiển thị (T5, 06/08/2026)
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    return dayjs(dateString).format("dd, DD/MM/YYYY");
  };

  const getPickupTime = (departureTimeStr: string, offsetMinutes: number): string => {
    if (!departureTimeStr) return "--:--";
    return dayjs(departureTimeStr).add(offsetMinutes, "minute").format("HH:mm - DD/MM");
  };

  const getDropoffTime = (arrivalTimeStr: string, offsetMinutes: number): string => {
    if (!arrivalTimeStr) return "--:--";
    return dayjs(arrivalTimeStr).subtract(offsetMinutes, "minute").format("HH:mm - DD/MM");
  };

  const getAvailableSeatsCount = (seatsArray: Seat[]): number => {
    if (!seatsArray) return 0;
    return seatsArray.filter(seat => seat.status === "AVAILABLE").length;
  };

  const getTicketPrice = (item: TripData): number => {
    if (!item.departureTime) return item.journey?.price || 0;
    const departureDate = new Date(item.departureTime);
    if (item.fareRule) {
      if (departureDate.getDay() === 0 || departureDate.getDay() === 6) {
        return item.fareRule.weekendPrice;
      } else {
        return item.fareRule.weekdayPrice;
      }
    }
    return item.journey?.price || 0;
  };

  const departures = Array.from(new Set(trips.map(t => t.journey?.diemDi).filter(Boolean)));
  const destinations = Array.from(new Set(trips.map(t => t.journey?.diemDen).filter(Boolean)));

  const handleSearch = () => {
    const formattedDate = ngayDi ? ngayDi.format("YYYY-MM-DD") : null;
    setAppliedSearch({
      diemDi,
      diemDen,
      ngayDi: formattedDate,
    });

    const params = new URLSearchParams();
    if (diemDi) params.append("diemDi", diemDi);
    if (diemDen) params.append("diemDen", diemDen);
    if (formattedDate) params.append("ngayDi", formattedDate);
    navigate(`/khachhang/trip?${params.toString()}`, { replace: true });
  };

  const handleClearFilters = () => {
    setDiemDi(undefined);
    setDiemDen(undefined);
    setNgayDi(null);
    setAppliedSearch({
      diemDi: undefined,
      diemDen: undefined,
      ngayDi: null,
    });
    setSelectedBusTypes([]);
    setPriceRange([0, 1500000]);
    setSelectedTimeSlots([]);
    setSortBy("time_asc");
    navigate("/khachhang/trip", { replace: true });
  };

  const filteredTrips = trips.filter((trip) => {
    if (appliedSearch.diemDi && trip.journey?.diemDi !== appliedSearch.diemDi) {
      return false;
    }
    if (appliedSearch.diemDen && trip.journey?.diemDen !== appliedSearch.diemDen) {
      return false;
    }
    if (appliedSearch.ngayDi) {
      const tripDateStr = trip.departureTime ? dayjs(trip.departureTime).format("YYYY-MM-DD") : "";
      if (tripDateStr !== appliedSearch.ngayDi) {
        return false;
      }
    }
    if (selectedBusTypes.length > 0 && (!trip.bus?.type || !selectedBusTypes.includes(trip.bus.type))) {
      return false;
    }

    const actualPrice = getTicketPrice(trip);
    if (actualPrice < priceRange[0] || actualPrice > priceRange[1]) {
      return false;
    }

    if (selectedTimeSlots.length > 0) {
      if (!trip.departureTime) return false;
      const hour = new Date(trip.departureTime).getHours();
      let slot = "";
      if (hour >= 0 && hour < 6) slot = "early_morning";
      else if (hour >= 6 && hour < 12) slot = "morning";
      else if (hour >= 12 && hour < 18) slot = "afternoon";
      else if (hour >= 18 && hour < 24) slot = "evening";

      if (!selectedTimeSlots.includes(slot)) {
        return false;
      }
    }
    return true;
  });

  const sortedTrips = [...filteredTrips].sort((a, b) => {
    const priceA = getTicketPrice(a);
    const priceB = getTicketPrice(b);

    if (sortBy === "price_asc") {
      return priceA - priceB;
    }
    if (sortBy === "price_desc") {
      return priceB - priceA;
    }
    if (sortBy === "time_asc") {
      return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
    }
    if (sortBy === "time_desc") {
      return new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime();
    }
    return 0;
  });

  return (
    <ClientLayout>
      <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: 60 }}>
        {/* Banner Area */}
        <div
          style={{
            height: 320,
            background: "linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.6)), url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1200') center/cover",
            display: "flex",
            alignItems: "center",
            padding: "0 80px",
            color: "#fff",
          }}
        >
          <div>
            <Title style={{ color: "#fff", marginBottom: 12, fontSize: 38, fontWeight: 800 }}>
              Đồng hành cùng <span style={{ color: "#93fb75" }}>NetBus</span>
            </Title>
            <Text style={{ color: "#cbd5e1", fontSize: 16, maxWidth: 600, display: "block" }}>
              Mạng lưới vận tải thông minh, an toàn kết nối các tỉnh thành. Đặt vé dễ dàng — Chạm là đi!
            </Text>
          </div>
        </div>

        {/* Search Header Container */}
        <div style={{ maxWidth: 1200, margin: "-50px auto 40px", padding: "0 20px" }}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 8px 20px -6px rgba(0, 0, 0, 0.05)",
              border: "1px solid rgba(226, 232, 240, 0.8)",
            }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={8} md={7}>
                <div style={{ marginBottom: 6 }}><Text strong style={{ fontSize: 13, color: "#475569" }}>Điểm đi</Text></div>
                <Select
                  showSearch
                  placeholder="Chọn điểm đi"
                  size="large"
                  style={{ width: "100%" }}
                  value={diemDi}
                  onChange={setDiemDi}
                  allowClear
                  suffixIcon={<EnvironmentOutlined style={{ color: "#2e7d32" }} />}
                >
                  {departures.map(d => (
                    <Option key={d} value={d}>{d}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={8} md={7}>
                <div style={{ marginBottom: 6 }}><Text strong style={{ fontSize: 13, color: "#475569" }}>Điểm đến</Text></div>
                <Select
                  showSearch
                  placeholder="Chọn điểm đến"
                  size="large"
                  style={{ width: "100%" }}
                  value={diemDen}
                  onChange={setDiemDen}
                  allowClear
                  suffixIcon={<EnvironmentOutlined style={{ color: "#2e7d32" }} />}
                >
                  {destinations.map(d => (
                    <Option key={d} value={d}>{d}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={8} md={6}>
                <div style={{ marginBottom: 6 }}><Text strong style={{ fontSize: 13, color: "#475569" }}>Ngày đi</Text></div>
                <DatePicker
                  style={{ width: "100%" }}
                  size="large"
                  value={ngayDi}
                  onChange={setNgayDi}
                  format="DD/MM/YYYY"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  placeholder="Chọn ngày đi"
                />
              </Col>

              <Col xs={24} md={4} style={{ marginTop: 22 }}>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  size="large"
                  block
                  loading={loading}
                  onClick={handleSearch}
                  style={{ height: 40, borderRadius: 8, fontWeight: 600, background: "#2e7d32", borderColor: "#2e7d32" }}
                >
                  Tìm kiếm
                </Button>
              </Col>
            </Row>
          </Card>
        </div>

        {/* Main Section: Sidebar + Listings */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <Row gutter={[24, 24]}>
            {/* Sidebar Filter Container */}
            <Col xs={24} md={8} lg={6}>
              <Card
                title={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}><SortAscendingOutlined /> Bộ lọc tìm kiếm</span>
                    <Button
                      type="link"
                      onClick={handleClearFilters}
                      icon={<ClearOutlined />}
                      size="small"
                      style={{ color: "#ef4444", padding: 0 }}
                    >
                      Xóa lọc
                    </Button>
                  </div>
                }
                style={{
                  borderRadius: 16,
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.02)",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                  position: "sticky",
                  top: 96,
                }}
              >
                <div>
                  <Title level={5} style={{ margin: "0 0 10px 0", fontSize: 14, color: "#334155" }}>Sắp xếp theo</Title>
                  <Radio.Group value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: "100%" }}>
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Radio value="time_asc">Giờ đi sớm nhất</Radio>
                      <Radio value="time_desc">Giờ đi muộn nhất</Radio>
                      <Radio value="price_asc">Giá vé tăng dần</Radio>
                      <Radio value="price_desc">Giá vé giảm dần</Radio>
                    </Space>
                  </Radio.Group>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <div>
                  <Title level={5} style={{ margin: "0 0 10px 0", fontSize: 14, color: "#334155" }}><ClockCircleOutlined /> Giờ đi (Khởi hành)</Title>
                  <Checkbox.Group value={selectedTimeSlots} onChange={(checked) => setSelectedTimeSlots(checked as string[])} style={{ width: "100%" }}>
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Checkbox value="early_morning">Sáng sớm (00:00 - 06:00)</Checkbox>
                      <Checkbox value="morning">Buổi sáng (06:00 - 12:00)</Checkbox>
                      <Checkbox value="afternoon">Buổi chiều (12:00 - 18:00)</Checkbox>
                      <Checkbox value="evening">Buổi tối (18:00 - 24:00)</Checkbox>
                    </Space>
                  </Checkbox.Group>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <div>
                  <Title level={5} style={{ margin: "0 0 10px 0", fontSize: 14, color: "#334155" }}><CarOutlined /> Loại xe</Title>
                  <Checkbox.Group value={selectedBusTypes} onChange={(checked) => setSelectedBusTypes(checked as string[])} style={{ width: "100%" }}>
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Checkbox value="Sleeper">Giường nằm</Checkbox>
                      <Checkbox value="Seater">Ghế ngồi</Checkbox>
                      <Checkbox value="Limousine">Limousine VIP</Checkbox>
                    </Space>
                  </Checkbox.Group>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <Title level={5} style={{ margin: 0, fontSize: 14, color: "#334155" }}><DollarOutlined /> Giá vé</Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {priceRange[0].toLocaleString("vi-VN")}đ - {priceRange[1].toLocaleString("vi-VN")}đ
                    </Text>
                  </div>
                  <Slider
                    range
                    min={0}
                    max={1500000}
                    step={50000}
                    value={priceRange}
                    onChange={(val) => setPriceRange(val as [number, number])}
                    trackStyle={[{ backgroundColor: "#2e7d32" }]}
                    handleStyle={[{ borderColor: "#2e7d32" }, { borderColor: "#2e7d32" }]}
                    tooltip={{ formatter: (val) => `${val?.toLocaleString("vi-VN")}đ` }}
                  />
                </div>
              </Card>
            </Col>

            {/* Results Listings Container */}
            <Col xs={24} md={16} lg={18}>
              <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text strong style={{ color: "#475569" }}>
                  Tìm thấy <span style={{ color: "#2e7d32", fontSize: 16 }}>{sortedTrips.length}</span> chuyến đi
                </Text>

                <Space size="small" wrap>
                  {appliedSearch.diemDi && <Tag color="success">Đi từ: {appliedSearch.diemDi}</Tag>}
                  {appliedSearch.diemDen && <Tag color="success">Đến: {appliedSearch.diemDen}</Tag>}
                  {appliedSearch.ngayDi && <Tag color="processing">Ngày: {dayjs(appliedSearch.ngayDi).format("DD/MM/YYYY")}</Tag>}
                </Space>
              </div>

              {/* CHÍNH SÁCH HỦY VÉ */}
              <div style={{ marginBottom: 20 }}>
                <div
                  onClick={() => setShowPolicy(!showPolicy)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    userSelect: "none"
                  }}
                >
                  <InfoCircleOutlined style={{ color: "#a8a29e", fontSize: 16 }} />
                  <span style={{ fontWeight: 600, color: "#1c1917", fontSize: 14 }}>Chính sách hủy vé</span>
                  {showPolicy ? <CaretUpOutlined style={{ fontSize: 12, color: "#1c1917" }} /> : <CaretDownOutlined style={{ fontSize: 12, color: "#1c1917" }} />}
                </div>

                {showPolicy && (
                  <div style={{ paddingLeft: 24, marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div>
                      <span style={{ color: "#44403c" }}>Ngoài 6 tiếng trước giờ xe chạy: </span>
                      <span style={{ color: "#dc2626", fontWeight: 600 }}>Miễn phí hủy vé</span>
                    </div>
                    <div>
                      <span style={{ color: "#44403c" }}>Từ 2 - 5 tiếng trước giờ xe chạy: </span>
                      <span style={{ color: "#dc2626", fontWeight: 600 }}>Phí hủy 50%</span>
                    </div>
                    <div>
                      <span style={{ color: "#44403c" }}>Từ 1 - 3 vé: </span>
                      <span style={{ color: "#dc2626", fontWeight: 600 }}>Hủy trước 2 tiếng</span>
                    </div>
                    <div>
                      <span style={{ color: "#44403c" }}>Từ 4 - 10 vé: </span>
                      <span style={{ color: "#dc2626", fontWeight: 600 }}>Hủy trước 12 tiếng</span>
                    </div>
                    <div>
                      <span style={{ color: "#44403c" }}>Từ 11 - 20 vé: </span>
                      <span style={{ color: "#dc2626", fontWeight: 600 }}>Hủy trước 24 tiếng</span>
                    </div>
                  </div>
                )}
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                  <Button type="text" loading size="large">Đang tải danh sách chuyến đi...</Button>
                </div>
              ) : sortedTrips.length === 0 ? (
                <Card style={{ borderRadius: 16, border: "1px solid rgba(226, 232, 240, 0.8)", padding: "40px 0" }}>
                  <Empty
                    description={
                      <Space direction="vertical" size="small">
                        <Text strong style={{ fontSize: 16, color: "#64748b" }}>Không tìm thấy chuyến xe nào phù hợp</Text>
                        <Text type="secondary">Vui lòng điều chỉnh lại bộ lọc hoặc thông tin tìm kiếm.</Text>
                      </Space>
                    }
                  >
                    <Button type="primary" onClick={handleClearFilters} style={{ background: "#2e7d32", borderColor: "#2e7d32", borderRadius: 6 }}>
                      Xóa tất cả bộ lọc
                    </Button>
                  </Empty>
                </Card>
              ) : (
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  {sortedTrips.map((item: TripData) => (
                    <div
                      key={item._id}
                      className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-md rounded-2xl bg-white border border-slate-100 hover:border-emerald-500/20 overflow-hidden"
                      style={{
                        padding: "24px",
                        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
                      }}
                    >
                      {/* Thẻ hiển thị ngày khởi hành ở đầu chuyến */}
                      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <CalendarOutlined style={{ color: "#2e7d32", fontSize: 14 }} />
                        <Text strong style={{ color: "#1e293b", fontSize: 13 }}>
                          Khởi hành: <span style={{ color: "#2e7d32" }}>{formatDate(item.departureTime)}</span>
                        </Text>
                      </div>

                      <Row align="middle" justify="space-between" gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={10} lg={9}>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            {/* Điểm đi & Thời gian đi */}
                            <div>
                              <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>
                                {formatTime(item.departureTime)}
                              </div>
                              <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                                {formatDate(item.departureTime)}
                              </Text>
                              <Text strong style={{ color: "#475569", fontSize: 13, marginTop: 2, display: "block" }}>
                                {item.journey?.diemDi || "Hà Nội"}
                              </Text>
                            </div>

                            {/* Thời gian di chuyển */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 70 }}>
                              <Text type="secondary" style={{ fontSize: 11, marginBottom: 2 }}>
                                {item.journey?.thoiGianDiChuyen || "5 giờ"}
                              </Text>
                              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                <div style={{ height: 2, background: "#cbd5e1", flex: 1 }}></div>
                                <ArrowRightOutlined style={{ color: "#94a3b8", fontSize: 12, margin: "0 4px" }} />
                                <div style={{ height: 2, background: "#cbd5e1", flex: 1 }}></div>
                              </div>
                            </div>

                            {/* Điểm đến & Thời gian đến */}
                            <div>
                              <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>
                                {formatTime(item.arrivalTime)}
                              </div>
                              <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                                {formatDate(item.arrivalTime)}
                              </Text>
                              <Text strong style={{ color: "#475569", fontSize: 13, marginTop: 2, display: "block" }}>
                                {item.journey?.diemDen || "Phú Thọ"}
                              </Text>
                            </div>
                          </div>

                          <div style={{ marginTop: 12 }}>
                            <Button
                              type="link"
                              size="small"
                              onClick={() => toggleTripExpand(item._id)}
                              style={{
                                color: "#2e7d32",
                                padding: 0,
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 13
                              }}
                            >
                              <EnvironmentOutlined />
                              {expandedTrips[item._id] ? "Ẩn điểm đón/trả" : "Xem điểm đón/trả"}
                              <span style={{ color: "#64748b", fontWeight: 400, fontSize: 12, marginLeft: 2 }}>
                                ({(item.journey?.diemDon?.length || 0) + (item.journey?.diemTra?.length || 0)})
                              </span>
                            </Button>
                          </div>
                        </Col>

                        <Col xs={12} sm={4} md={4} style={{ textAlign: "center" }}>
                          <Text strong style={{ fontSize: 15, display: "block", marginBottom: 6, color: "#334155" }}>
                            {item.bus?.name || "Xe NETBUS Luxury"}
                          </Text>
                          <Tag
                            color={item.bus?.type === "Sleeper" ? "blue" : item.bus?.type === "Limousine" ? "gold" : "purple"}
                            style={{ borderRadius: 6, padding: "2px 8px", border: "none", fontWeight: 500 }}
                          >
                            {item.bus?.type === "Sleeper" ? "Giường nằm" : item.bus?.type === "Limousine" ? "Limousine VIP" : "Ghế ngồi"}
                          </Tag>
                        </Col>

                        <Col xs={12} sm={4} md={5} style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 20, color: "#ef4444", fontWeight: 700, lineHeight: 1.2 }}>
                            {`${getTicketPrice(item).toLocaleString("vi-VN")}đ`}
                          </div>
                          <Text type="secondary" style={{ fontSize: 13, display: "block", marginTop: 4 }}>
                            {getAvailableSeatsCount(item.seats)} chỗ trống
                          </Text>
                        </Col>

                        <Col xs={24} sm={4} md={5} lg={4}>
                          <Button
                            type="primary"
                            size="large"
                            block
                            style={{ borderRadius: 8, fontWeight: 600, height: 44, background: "#2e7d32", borderColor: "#2e7d32" }}
                            onClick={() => navigate(`/khachhang/booking/${item._id}`)}
                          >
                            Đặt vé
                          </Button>
                        </Col>
                      </Row>

                      {/* Expanded Pickup/Dropoff Section */}
                      {expandedTrips[item._id] && (
                        <div
                          style={{
                            marginTop: 16,
                            paddingTop: 16,
                            borderTop: "1px dashed #e2e8f0",
                          }}
                        >
                          <Row gutter={[24, 16]}>
                            {/* Pick-up points */}
                            <Col xs={24} sm={12}>
                              <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#3b82f6" }}></div>
                                <span style={{ fontSize: 13 }}>Điểm đón khách ({item.journey?.diemDon?.length || 0})</span>
                              </div>
                              {item.journey?.diemDon && item.journey.diemDon.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 12, borderLeft: "2px solid #eff6ff" }}>
                                  {item.journey.diemDon.map((diem, idx) => (
                                    <div key={diem._id || idx} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                      <Tag color="blue" style={{ margin: 0, fontWeight: 600, borderRadius: 4, fontSize: 11 }}>
                                        {getPickupTime(item.departureTime, diem.offsetMinutes)}
                                      </Tag>
                                      <Text style={{ color: "#475569", fontSize: 13 }}>{diem.diaDiem}</Text>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <Text type="secondary" style={{ fontStyle: "italic", fontSize: 12, paddingLeft: 12 }}>
                                  Không có thông tin điểm đón
                                </Text>
                              )}
                            </Col>

                            {/* Drop-off points */}
                            <Col xs={24} sm={12}>
                              <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#f97316" }}></div>
                                <span style={{ fontSize: 13 }}>Điểm trả khách ({item.journey?.diemTra?.length || 0})</span>
                              </div>
                              {item.journey?.diemTra && item.journey.diemTra.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 12, borderLeft: "2px solid #fff7ed" }}>
                                  {item.journey.diemTra.map((diem, idx) => (
                                    <div key={diem._id || idx} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                      <Tag color="orange" style={{ margin: 0, fontWeight: 600, borderRadius: 4, fontSize: 11 }}>
                                        {getDropoffTime(item.arrivalTime, diem.offsetMinutes)}
                                      </Tag>
                                      <Text style={{ color: "#475569", fontSize: 13 }}>{diem.diaDiem}</Text>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <Text type="secondary" style={{ fontStyle: "italic", fontSize: 12, paddingLeft: 12 }}>
                                  Không có thông tin điểm trả
                                </Text>
                              )}
                            </Col>
                          </Row>
                        </div>
                      )}
                    </div>
                  ))}
                </Space>
              )}
            </Col>
          </Row>
        </div>
      </div>
    </ClientLayout>
  );
}