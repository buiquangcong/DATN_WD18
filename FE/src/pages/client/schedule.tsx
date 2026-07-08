import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Space,
  Typography,
  message,
  Empty,
  Divider,
  Badge
} from "antd";
import {
  EnvironmentOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  SyncOutlined
} from "@ant-design/icons";
import { ClientLayout } from "./layout";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface FareRule {
  weekdayPrice: number;
  weekendPrice: number;
}

interface Journey {
  _id: string;
  diemDi: string;
  diemDen: string;
  quangDuong: number;
  thoiGianDiChuyen: string;
}

interface Bus {
  name: string;
  type: string; // Giường nằm (Sleeper), Ghế ngồi (Seater), Limousine
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

interface RouteGroup {
  id: string;
  diemDi: string;
  diemDen: string;
  quangDuong: number;
  thoiGianDiChuyen: string;
  trips: TripData[];
  busTypes: string[];
  departureHours: string[];
  minPrice: number;
}

export default function Schedule(): React.ReactElement {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [routeGroups, setRouteGroups] = useState<RouteGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchTrips = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get<{ data?: TripData[] } & TripData[]>("http://localhost:3000/api/trip");
      let dataList: TripData[] = [];
      if (response.data && "data" in response.data && Array.isArray(response.data.data)) {
        dataList = response.data.data;
      } else if (Array.isArray(response.data)) {
        dataList = response.data as unknown as TripData[];
      }

      // Lọc bỏ các chuyến đi không có lộ trình (journey) hợp lệ
      const validTrips = dataList.filter(t => t.journey && t.journey.diemDi && t.journey.diemDen);
      setTrips(validTrips);
      processRouteGroups(validTrips);
    } catch (error) {
      console.error("Lỗi lấy danh sách lịch trình chuyến:", error);
      message.error("Không thể kết nối đến máy chủ để tải lịch trình!");
    } finally {
      setLoading(false);
    }
  };

  const getTicketPrice = (item: TripData): number => {
    if (!item.departureTime) return 0;
    const departureDate = new Date(item.departureTime);
    if (item.fareRule) {
      if (departureDate.getDay() === 0 || departureDate.getDay() === 6) {
        return item.fareRule.weekendPrice;
      } else {
        return item.fareRule.weekdayPrice;
      }
    }
    return 0;
  };

  const formatHour = (dateString: string): string => {
    if (!dateString) return "--:--";
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    return dayjs(dateString).format("DD/MM/YYYY");
  };

  const getAvailableSeatsCount = (seatsArray: Seat[]): number => {
    if (!seatsArray) return 0;
    return seatsArray.filter(seat => seat.status === "AVAILABLE").length;
  };

  const processRouteGroups = (allTrips: TripData[]): void => {
    const groups: { [key: string]: RouteGroup } = {};

    allTrips.forEach((trip) => {
      const journey = trip.journey;
      const key = `${journey.diemDi}-${journey.diemDen}`;

      if (!groups[key]) {
        groups[key] = {
          id: journey._id || key,
          diemDi: journey.diemDi,
          diemDen: journey.diemDen,
          quangDuong: journey.quangDuong || 0,
          thoiGianDiChuyen: journey.thoiGianDiChuyen || "Đang cập nhật",
          trips: [],
          busTypes: [],
          departureHours: [],
          minPrice: Infinity,
        };
      }

      groups[key].trips.push(trip);

      // Thêm loại xe nếu chưa tồn tại trong nhóm tuyến đường
      if (trip.bus?.type && !groups[key].busTypes.includes(trip.bus.type)) {
        groups[key].busTypes.push(trip.bus.type);
      }

      // Thêm khung giờ khởi hành
      const hour = formatHour(trip.departureTime);
      if (!groups[key].departureHours.includes(hour)) {
        groups[key].departureHours.push(hour);
      }

      // Tính toán giá vé thấp nhất
      const price = getTicketPrice(trip);
      if (price > 0 && price < groups[key].minPrice) {
        groups[key].minPrice = price;
      }
    });

    // Chuyển đổi đối tượng thành mảng và hoàn thiện dữ liệu
    const finalGroups = Object.values(groups).map((group) => {
      // Sắp xếp các khung giờ khởi hành theo thứ tự thời gian tăng dần
      group.departureHours.sort((a, b) => a.localeCompare(b));

      group.trips.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());

      if (group.minPrice === Infinity) {
        group.minPrice = 0;
      }

      return group;
    });

    setRouteGroups(finalGroups);
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleQuickBook = (tripId: string) => {
    navigate(`/khachhang/booking/${tripId}`);
  };

  return (
    <ClientLayout>
      <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: 80 }}>
        {/* Khu vực Banner với giao diện hiện đại */}
        <div
          style={{
            height: 280,
            background: "linear-gradient(rgba(10, 40, 15, 0.7), rgba(15, 23, 42, 0.8)), url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200') center/cover",
            display: "flex",
            alignItems: "center",
            padding: "0 5%",
            color: "#fff",
            marginBottom: 40
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
            <Title style={{ color: "#fff", marginBottom: 12, fontSize: 36, fontWeight: 800, letterSpacing: "-0.5px" }}>
              Lịch Trình <span className="text-emerald-400">NetBus</span> Xe Chạy
            </Title>
            <Text style={{ color: "#cbd5e1", fontSize: 16, maxWidth: 650, display: "block", lineHeight: "1.6" }}>
              Tra cứu thông tin lịch trình, các tuyến xe chạy chất lượng cao từ Bắc vào Nam. Các chuyến đi luôn được cập nhật liên tục hàng giờ.
            </Text>
          </div>
        </div>

        {/* Khu vực nội dung chính */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text strong style={{ color: "#475569" }}>
              Tổng cộng có <span style={{ color: "#166e00", fontSize: 16 }}>{routeGroups.length}</span> tuyến đang hoạt động
            </Text>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
              <Button type="text" loading size="large">Đang kết xuất sơ đồ lịch trình xe chạy...</Button>
            </div>
          ) : routeGroups.length === 0 ? (
            <Card style={{ borderRadius: 16, border: "1px solid rgba(226, 232, 240, 0.8)", padding: "40px 0" }}>
              <Empty
                description={
                  <Space direction="vertical" size="small">
                    <Text strong style={{ fontSize: 16, color: "#64748b" }}>Hiện tại không có tuyến đường nào hoạt động</Text>
                    <Text type="secondary">Vui lòng quay lại sau hoặc liên hệ tổng đài để biết thêm chi tiết.</Text>
                  </Space>
                }
              />
            </Card>
          ) : (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {routeGroups.map((group) => {
                const isExpanded = expandedRouteId === group.id;
                return (
                  <div
                    key={group.id}
                    className="transition-all duration-300 bg-white border border-slate-100 hover:border-emerald-500/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md"
                    style={{ padding: 24 }}
                  >
                    <Row gutter={[16, 16]} align="middle" justify="space-between">
                      {/* Tên lộ trình (Điểm đi -> Điểm đến) & Chi tiết quãng đường/thời gian */}
                      <Col xs={24} sm={12} md={12}>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                            {group.diemDi} <ArrowRightOutlined style={{ color: "#166e00", fontSize: 14, margin: "0 6px" }} /> {group.diemDen}
                          </Title>
                        </div>

                        <Space size="large" className="text-slate-500 text-xs">
                          <span>
                            <EnvironmentOutlined style={{ marginRight: 4 }} />
                            Khoảng cách: <strong>{group.quangDuong} km</strong>
                          </span>
                          <span>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            Thời gian: <strong>{group.thoiGianDiChuyen}</strong>
                          </span>
                        </Space>
                      </Col>

                      {/* Dòng xe phục vụ */}
                      <Col xs={12} sm={6} md={6}>
                        <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                          Phương tiện phục vụ
                        </div>
                        <Space size={4} wrap>
                          {group.busTypes.map((type) => (
                            <Tag
                              key={type}
                              color={type === "Sleeper" ? "blue" : type === "Limousine" ? "gold" : "purple"}
                              style={{ borderRadius: 4, fontWeight: 500, border: "none", fontSize: 11 }}
                            >
                              {type === "Sleeper" ? "Giường nằm" : type === "Limousine" ? "Limousine VIP" : "Ghế ngồi"}
                            </Tag>
                          ))}
                        </Space>
                      </Col>

                      {/* Giá vé xuất phát & Nút thao tác */}
                      <Col xs={12} sm={6} md={6} style={{ textAlign: "right" }}>
                        <div style={{ marginBottom: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>Giá vé xuất phát</Text>
                          <div style={{ fontSize: 20, color: "#ef4444", fontWeight: 700, lineHeight: 1.2 }}>
                            {group.minPrice > 0 ? `Từ ${group.minPrice.toLocaleString("vi-VN")}đ` : "Liên hệ"}
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-3">
                          <Button
                            type="primary"
                            style={{ background: "#166e00", borderColor: "#166e00", borderRadius: 8, fontWeight: 600 }}
                            onClick={() => navigate(`/khachhang/trip`)}
                          >
                            Đặt Vé
                          </Button>
                          <Button
                            type="default"
                            style={{ borderRadius: 8 }}
                            onClick={() => setExpandedRouteId(isExpanded ? null : group.id)}
                          >
                            {isExpanded ? "Thu gọn" : "Xem giờ"}
                          </Button>
                        </div>
                      </Col>
                    </Row>

                    {/* Khu lưới hiển thị khung giờ chạy của tuyến đường */}
                    <div style={{ marginTop: 16 }} className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl">
                      <Row align="middle" gutter={[8, 8]}>
                        <Col xs={24} sm={4}>
                          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} /> Khung giờ:
                          </Text>
                        </Col>
                        <Col xs={24} sm={20}>
                          <Space size={6} wrap>
                            {group.departureHours.map((hour) => (
                              <Tag
                                key={hour}
                                style={{
                                  backgroundColor: "#fff",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 6,
                                  padding: "2px 8px",
                                  fontWeight: 600,
                                  color: "#1e293b",
                                }}
                              >
                                {hour}
                              </Tag>
                            ))}
                          </Space>
                        </Col>
                      </Row>
                    </div>

                    {/* Danh sách mở rộng hiển thị chi tiết các chuyến sắp chạy cụ thể */}
                    {isExpanded && (
                      <div style={{ marginTop: 24 }}>
                        <Divider style={{ margin: "12px 0" }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Danh sách các chuyến xe sắp chạy của tuyến đường này
                          </Text>
                        </Divider>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                          {group.trips.map((trip) => {
                            const availableSeats = getAvailableSeatsCount(trip.seats);
                            const price = getTicketPrice(trip);
                            return (
                              <div
                                key={trip._id}
                                style={{
                                  padding: "16px",
                                  backgroundColor: "#fff",
                                  border: "1px solid #f1f5f9",
                                  borderRadius: 12,
                                }}
                                className="hover:border-emerald-500/10 transition-all shadow-2xs"
                              >
                                <Row align="middle" justify="space-between" gutter={[12, 12]}>
                                  <Col xs={24} sm={6}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <CalendarOutlined style={{ color: "#166e00" }} />
                                      <Text strong style={{ fontSize: 13 }}>
                                        {formatDate(trip.departureTime)}
                                      </Text>
                                    </div>
                                    <div style={{ fontSize: 11, color: "#64748b", marginLeft: 20 }}>
                                      Khởi hành hôm/ngày đó
                                    </div>
                                  </Col>

                                  <Col xs={12} sm={6}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                                      {formatHour(trip.departureTime)} <ArrowRightOutlined style={{ fontSize: 11, color: "#94a3b8" }} /> {formatHour(trip.arrivalTime)}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      {trip.bus?.name || "Xe NETBUS VIP"} ({trip.bus?.type === "Sleeper" ? "Giường nằm" : trip.bus?.type === "Limousine" ? "Limousine" : "Ghế ngồi"})
                                    </Text>
                                  </Col>

                                  <Col xs={12} sm={4}>
                                    <div style={{ fontWeight: 600, color: "#ef4444" }}>
                                      {price > 0 ? `${price.toLocaleString("vi-VN")}đ` : "Liên hệ"}
                                    </div>
                                    <Badge
                                      status={availableSeats > 5 ? "success" : availableSeats > 0 ? "warning" : "error"}
                                      text={
                                        <span style={{ fontSize: 12, color: "#64748b" }}>
                                          {availableSeats > 0 ? `${availableSeats} chỗ trống` : "Hết vé"}
                                        </span>
                                      }
                                    />
                                  </Col>

                                  <Col xs={24} sm={4} style={{ textAlign: "right" }}>
                                    <Button
                                      type="primary"
                                      size="small"
                                      disabled={availableSeats === 0}
                                      style={{
                                        borderRadius: 6,
                                        background: availableSeats > 0 ? "#166e00" : "#cbd5e1",
                                        borderColor: availableSeats > 0 ? "#166e00" : "#cbd5e1",
                                        fontSize: 12,
                                        fontWeight: 600,
                                      }}
                                      onClick={() => handleQuickBook(trip._id)}
                                    >
                                      Đặt Ngay
                                    </Button>
                                  </Col>
                                </Row>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </Space>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}