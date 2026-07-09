import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  ClearOutlined
} from "@ant-design/icons";
import { ClientLayout } from "./layout";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

interface Journey {
  diemDi: string;
  diemDen: string;
  thoiGianDiChuyen: string;
  price: number;
}

interface Bus {
  name: string;
  type: string; // Sleeper, Seater, Limousine
}

interface Seat {
  status: string;
}

interface TripData {
  _id: string;
  journey: Journey;
  bus: Bus;
  departureTime: string;
  status: string;
  seats: Seat[];
}

export default function SearchResults(): React.ReactElement {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL search params
  const paramDiemDi = searchParams.get("diemDi") || undefined;
  const paramDiemDen = searchParams.get("diemDen") || undefined;
  const paramNgayDi = searchParams.get("ngayDi") || null;

  // Search input state (Header form)
  const [diemDi, setDiemDi] = useState<string | undefined>(paramDiemDi);
  const [diemDen, setDiemDen] = useState<string | undefined>(paramDiemDen);
  const [ngayDi, setNgayDi] = useState<dayjs.Dayjs | null>(
    paramNgayDi ? dayjs(paramNgayDi, "YYYY-MM-DD") : null
  );

  // Active filters applied based on query parameters
  const [appliedSearch, setAppliedSearch] = useState<{
    diemDi?: string;
    diemDen?: string;
    ngayDi: string | null;
  }>({
    diemDi: paramDiemDi,
    diemDen: paramDiemDen,
    ngayDi: paramNgayDi,
  });

  // Sync state when URL search parameters change
  useEffect(() => {
    const qDiemDi = searchParams.get("diemDi") || undefined;
    const qDiemDen = searchParams.get("diemDen") || undefined;
    const qNgayDi = searchParams.get("ngayDi") || null;

    setDiemDi(qDiemDi);
    setDiemDen(qDiemDen);
    setNgayDi(qNgayDi ? dayjs(qNgayDi, "YYYY-MM-DD") : null);
    setAppliedSearch({
      diemDi: qDiemDi,
      diemDen: qDiemDen,
      ngayDi: qNgayDi,
    });
  }, [searchParams]);

  // Sidebar filters (applied reactively)
  const [selectedBusTypes, setSelectedBusTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1500000]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("time_asc");

  const fetchTrips = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get<{ data?: TripData[] } & TripData[]>("http://localhost:3000/api/trip");
      if (response.data && "data" in response.data && Array.isArray(response.data.data)) {
        setTrips(response.data.data);
      } else if (Array.isArray(response.data)) {
        setTrips(response.data as unknown as TripData[]);
      }
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

  const formatTime = (dateString: string): string => {
    if (!dateString) return "--:--";
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const getAvailableSeatsCount = (seatsArray: Seat[]): number => {
    if (!seatsArray) return 0;
    return seatsArray.filter(seat => seat.status === "AVAILABLE").length;
  };

  // Accurate arrival time calculation helper
  const calculateArrivalTime = (departureTimeStr: string, durationStr: string): string => {
    if (!departureTimeStr) return "--:--";
    const depDate = new Date(departureTimeStr);
    if (isNaN(depDate.getTime())) return "--:--";
    
    let durationHours = 0;
    if (durationStr) {
      const matchHours = durationStr.match(/(\d+(?:\.\d+)?)\s*(?:giờ|h|hour|hours)/i);
      const matchMinutes = durationStr.match(/(\d+)\s*(?:phút|m|minute|minutes)/i);
      if (matchHours) {
        durationHours += parseFloat(matchHours[1]);
      }
      if (matchMinutes) {
        durationHours += parseInt(matchMinutes[1], 10) / 60;
      }
      if (!matchHours && !matchMinutes) {
        const num = parseFloat(durationStr);
        if (!isNaN(num)) {
          if (num > 24) {
            durationHours = num / 60; // assume minutes
          } else {
            durationHours = num; // assume hours
          }
        }
      }
    }
    if (durationHours === 0) durationHours = 5; // Default fallback to 5 hours

    const arrDate = new Date(depDate.getTime() + durationHours * 60 * 60 * 1000);
    return arrDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  // Dynamic values extracted from database trip objects
  const departures = Array.from(new Set(trips.map(t => t.journey?.diemDi).filter(Boolean)));
  const destinations = Array.from(new Set(trips.map(t => t.journey?.diemDen).filter(Boolean)));

  const handleSearch = () => {
    const newParams = new URLSearchParams();
    if (diemDi) newParams.set("diemDi", diemDi);
    if (diemDen) newParams.set("diemDen", diemDen);
    if (ngayDi) newParams.set("ngayDi", ngayDi.format("YYYY-MM-DD"));
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setDiemDi(undefined);
    setDiemDen(undefined);
    setNgayDi(null);
    setSearchParams(new URLSearchParams());
    setSelectedBusTypes([]);
    setPriceRange([0, 1500000]);
    setSelectedTimeSlots([]);
    setSortBy("time_asc");
  };

  // Filtered trips
  const filteredTrips = trips.filter((trip) => {
    // 1. Departure point
    if (appliedSearch.diemDi && trip.journey?.diemDi !== appliedSearch.diemDi) {
      return false;
    }
    // 2. Destination point
    if (appliedSearch.diemDen && trip.journey?.diemDen !== appliedSearch.diemDen) {
      return false;
    }
    // 3. Departure Date
    if (appliedSearch.ngayDi) {
      const tripDateStr = trip.departureTime ? trip.departureTime.split("T")[0] : "";
      if (tripDateStr !== appliedSearch.ngayDi) {
        return false;
      }
    }
    // 4. Bus type filter
    if (selectedBusTypes.length > 0 && (!trip.bus?.type || !selectedBusTypes.includes(trip.bus.type))) {
      return false;
    }
    // 5. Price range filter
    const price = trip.journey?.price || 0;
    if (price < priceRange[0] || price > priceRange[1]) {
      return false;
    }
    // 6. Time of day filter
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

  // Sorted trips
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    if (sortBy === "price_asc") {
      return (a.journey?.price || 0) - (b.journey?.price || 0);
    }
    if (sortBy === "price_desc") {
      return (b.journey?.price || 0) - (a.journey?.price || 0);
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
        {/* Banner area */}
        <div
          style={{
            height: 320,
            background:
              "linear-gradient(rgba(22, 110, 0, 0.45), rgba(22, 110, 0, 0.45)), url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200') center/cover",
            display: "flex",
            alignItems: "center",
            padding: "0 80px",
            color: "#fff",
          }}
        >
          <div>
            <Title style={{ color: "#fff", marginBottom: 12, fontSize: 38, fontWeight: 800 }}>
              Kết Quả Tìm Kiếm <span style={{ color: "#93fb75" }}>Chuyến Đi</span>
            </Title>
            <Text style={{ color: "#f1f5f9", fontSize: 16, maxWidth: 600, display: "block" }}>
              Tìm kiếm và đặt vé xe nhanh chóng. Bộ lọc nâng cao giúp bạn tìm thấy lộ trình tối ưu nhất.
            </Text>
          </div>
        </div>

        {/* Search header container */}
        <div
          style={{
            maxWidth: 1200,
            margin: "-50px auto 40px",
            padding: "0 20px",
          }}
        >
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
                  suffixIcon={<EnvironmentOutlined style={{ color: "#166e00" }} />}
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
                  suffixIcon={<EnvironmentOutlined style={{ color: "#166e00" }} />}
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
                  style={{ height: 40, borderRadius: 8, fontWeight: 600, background: "#166e00" }}
                >
                  Tìm kiếm
                </Button>
              </Col>
            </Row>
          </Card>
        </div>

        {/* Main section: Sidebar + Listings */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <Row gutter={[24, 24]}>
            {/* Sidebar container */}
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
                      style={{ color: "#e11d48", padding: 0 }}
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
                {/* Sort Option section */}
                <div>
                  <Title level={5} style={{ margin: "0 0 10px 0", fontSize: 14, color: "#334155" }}>Sắp xếp theo</Title>
                  <Radio.Group 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Radio value="time_asc">Giờ đi sớm nhất</Radio>
                      <Radio value="time_desc">Giờ đi muộn nhất</Radio>
                      <Radio value="price_asc">Giá vé tăng dần</Radio>
                      <Radio value="price_desc">Giá vé giảm dần</Radio>
                    </Space>
                  </Radio.Group>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                {/* Departure hour slots */}
                <div>
                  <Title level={5} style={{ margin: "0 0 10px 0", fontSize: 14, color: "#334155" }}><ClockCircleOutlined /> Giờ đi (Khởi hành)</Title>
                  <Checkbox.Group 
                    value={selectedTimeSlots} 
                    onChange={(checked) => setSelectedTimeSlots(checked as string[])}
                    style={{ width: "100%" }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Checkbox value="early_morning">Sáng sớm (00:00 - 06:00)</Checkbox>
                      <Checkbox value="morning">Buổi sáng (06:00 - 12:00)</Checkbox>
                      <Checkbox value="afternoon">Buổi chiều (12:00 - 18:00)</Checkbox>
                      <Checkbox value="evening">Buổi tối (18:00 - 24:00)</Checkbox>
                    </Space>
                  </Checkbox.Group>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                {/* Bus categories */}
                <div>
                  <Title level={5} style={{ margin: "0 0 10px 0", fontSize: 14, color: "#334155" }}><CarOutlined /> Loại xe</Title>
                  <Checkbox.Group 
                    value={selectedBusTypes} 
                    onChange={(checked) => setSelectedBusTypes(checked as string[])}
                    style={{ width: "100%" }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Checkbox value="Sleeper">Giường nằm</Checkbox>
                      <Checkbox value="Seater">Ghế ngồi</Checkbox>
                      <Checkbox value="Limousine">Limousine VIP</Checkbox>
                    </Space>
                  </Checkbox.Group>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                {/* Ticket Price Slider */}
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
                    tooltip={{ formatter: (val) => `${val?.toLocaleString("vi-VN")}đ` }}
                  />
                </div>
              </Card>
            </Col>

            {/* Results Listings container */}
            <Col xs={24} md={16} lg={18}>
              <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text strong style={{ color: "#475569" }}>
                  Tìm thấy <span style={{ color: "#166e00", fontSize: 16 }}>{sortedTrips.length}</span> chuyến đi
                </Text>
                
                {/* Applied badge tags */}
                <Space size="small" wrap>
                  {appliedSearch.diemDi && <Tag color="success">Đi từ: {appliedSearch.diemDi}</Tag>}
                  {appliedSearch.diemDen && <Tag color="success">Đến: {appliedSearch.diemDen}</Tag>}
                  {appliedSearch.ngayDi && <Tag color="processing">Ngày: {dayjs(appliedSearch.ngayDi).format("DD/MM/YYYY")}</Tag>}
                </Space>
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
                    <Button type="primary" onClick={handleClearFilters} style={{ background: "#166e00", borderRadius: 6 }}>
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
                      <Row align="middle" justify="space-between" gutter={[16, 16]}>
                        {/* Time Slots Mapping */}
                        <Col xs={24} sm={10} md={9} lg={8}>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div>
                              <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>
                                {formatTime(item.departureTime)}
                              </div>
                              <Text strong style={{ color: "#64748b", fontSize: 13, display: "block" }}>
                                {item.journey?.diemDi || "Hà Nội"}
                              </Text>
                            </div>
                            
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 60 }}>
                              <Text type="secondary" style={{ fontSize: 11, marginBottom: 2 }}>
                                {item.journey?.thoiGianDiChuyen || "5 giờ"}
                              </Text>
                              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                <div style={{ height: 2, background: "#cbd5e1", flex: 1 }}></div>
                                <ArrowRightOutlined style={{ color: "#94a3b8", fontSize: 12, margin: "0 4px" }} />
                                <div style={{ height: 2, background: "#cbd5e1", flex: 1 }}></div>
                              </div>
                            </div>

                            <div>
                              <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>
                                {calculateArrivalTime(item.departureTime, item.journey?.thoiGianDiChuyen)}
                              </div>
                              <Text strong style={{ color: "#64748b", fontSize: 13, display: "block" }}>
                                {item.journey?.diemDen || "Phú Thọ"}
                              </Text>
                            </div>
                          </div>
                        </Col>

                        {/* Bus description labels */}
                        <Col xs={12} sm={6} md={5} style={{ textAlign: "center" }}>
                          <Text strong style={{ fontSize: 15, display: "block", marginBottom: 6, color: "#334155" }}>
                            {item.bus?.name || "GoPro Bus"}
                          </Text>
                          <Tag 
                            color={item.bus?.type === "Sleeper" ? "blue" : item.bus?.type === "Limousine" ? "gold" : "purple"} 
                            style={{ borderRadius: 6, padding: "2px 8px", border: "none", fontWeight: 500 }}
                          >
                            {item.bus?.type === "Sleeper" ? "Giường nằm" : item.bus?.type === "Limousine" ? "Limousine VIP" : "Ghế ngồi"}
                          </Tag>
                        </Col>

                        {/* Price & remaining ticket spaces */}
                        <Col xs={12} sm={4} md={5} style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 20, color: "#e11d48", fontWeight: 700, lineHeight: 1.2 }}>
                            {item.journey?.price ? `${item.journey.price.toLocaleString("vi-VN")}đ` : "0đ"}
                          </div>
                          <Text type="secondary" style={{ fontSize: 13, display: "block", marginTop: 4 }}>
                            {getAvailableSeatsCount(item.seats)} chỗ trống
                          </Text>
                        </Col>

                        {/* Booking redirects */}
                        <Col xs={24} sm={4} md={5} lg={4}>
                          <Button 
                            type="primary" 
                            size="large" 
                            block
                            className="bg-emerald-700 hover:bg-emerald-800 transition-colors border-none"
                            style={{ borderRadius: 8, fontWeight: 600, height: 44, background: "#166e00" }}
                            onClick={() => navigate(`/khachhang/booking/${item._id}`)}
                          >
                            Đặt vé
                          </Button>
                        </Col>
                      </Row>
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