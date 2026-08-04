import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Button,
  Typography,
  message,
  Select,
  Table,
} from "antd";
import {
  EnvironmentOutlined,
  SearchOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { ClientLayout } from "./layout";

const { Title, Text } = Typography;
const { Option } = Select;

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

interface FlattenedRoute {
  key: string;
  diemDi: string;
  diemDen: string;
  loaiXe: string;
  quangDuong: string;
  thoiGian: string;
  gia: string;
  tripId: string;
}

export default function Schedule(): React.ReactElement {
  const [flattenedRoutes, setFlattenedRoutes] = useState<FlattenedRoute[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const [diemDi, setDiemDi] = useState<string | undefined>(undefined);
  const [diemDen, setDiemDen] = useState<string | undefined>(undefined);
  const [allData, setAllData] = useState<FlattenedRoute[]>([]);

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

      const validTrips = dataList.filter(t => t.journey && t.journey.diemDi && t.journey.diemDen && t.status === "sắp chạy");

      const flatList: FlattenedRoute[] = validTrips.map((trip) => {
        let price = 0;
        if (trip.fareRule) {
          const departureDate = trip.departureTime ? new Date(trip.departureTime) : new Date();
          price = (departureDate.getDay() === 0 || departureDate.getDay() === 6)
            ? trip.fareRule.weekendPrice
            : trip.fareRule.weekdayPrice;
        }

        let txtLoaiXe = trip.bus?.name || "VIP 21 cabin";
        if (trip.bus?.type) {
          if (trip.bus.type === "Sleeper") txtLoaiXe = "38 giường";
          else if (trip.bus.type === "Limousine") txtLoaiXe = "VIP 21 cabin";
        }

        return {
          key: trip._id,
          diemDi: trip.journey.diemDi,
          diemDen: trip.journey.diemDen,
          loaiXe: txtLoaiXe,
          quangDuong: trip.journey.quangDuong ? `${trip.journey.quangDuong}km` : "---",
          thoiGian: trip.journey.thoiGianDiChuyen || "---",
          gia: price > 0 ? `${price.toLocaleString("vi-VN")} đ` : "Liên hệ",
          tripId: trip._id
        };
      });

      setAllData(flatList);
      setFlattenedRoutes(flatList);
    } catch (error) {
      console.error("Lỗi lấy danh sách lịch trình chuyến:", error);
      message.error("Không thể kết nối đến máy chủ để tải lịch trình!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleSearch = () => {
    let filtered = [...allData];
    if (diemDi) {
      filtered = filtered.filter(item => item.diemDi.toLowerCase().includes(diemDi.toLowerCase()));
    }
    if (diemDen) {
      filtered = filtered.filter(item => item.diemDen.toLowerCase().includes(diemDen.toLowerCase()));
    }
    setFlattenedRoutes(filtered);
  };

  const departuresList = Array.from(new Set(allData.map(g => g.diemDi).filter(Boolean)));
  const destinationsList = Array.from(new Set(allData.map(g => g.diemDen).filter(Boolean)));

  const columns = [
    {
      title: "Điểm đi",
      dataIndex: "diemDi",
      key: "diemDi",
      className: "font-semibold text-slate-700",
    },
    {
      title: "Điểm đến",
      dataIndex: "diemDen",
      key: "diemDen",
      className: "font-semibold text-slate-700",
    },
    {
      title: "Loại xe",
      dataIndex: "loaiXe",
      key: "loaiXe",
    },
    {
      title: "Quãng đường",
      dataIndex: "quangDuong",
      key: "quangDuong",
    },
    {
      title: "Thời gian",
      dataIndex: "thoiGian",
      key: "thoiGian",
    },
    {
      title: "Giá",
      dataIndex: "gia",
      key: "gia",
      className: "text-red-500 font-bold",
    },
  ];

  return (
    <ClientLayout>
      <div style={{ backgroundColor: "#ffffff", minHeight: "100vh", paddingBottom: 80 }}>

        {/* KHU VỰC BANNER HÌNH NỀN THEO MẪU ẢNH */}
        <div
          style={{
            height: 320,
            background: "linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.6)), url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1200') center/cover",
            display: "flex",
            alignItems: "center",
            padding: "0 80px",
            color: "#fff",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
            <Title style={{ color: "#fff", marginBottom: 12, fontSize: 32, fontWeight: 800, letterSpacing: "-0.5px" }}>
              Lịch Trình <span style={{ color: "#00ff87" }}>NetBus</span> Xe Chạy
            </Title>
            <Text style={{ color: "#cbd5e1", fontSize: 14, maxWidth: 650, display: "block", lineHeight: "1.6" }}>
              Tra cứu thông tin lịch trình, các tuyến xe chạy chất lượng cao từ Bắc vào Nam. Các chuyến đi luôn được cập nhật liên tục hàng giờ.
            </Text>
          </div>
        </div>

        {/* Thanh tìm kiếm nhanh gióng trên nền Banner */}
        <div style={{ maxWidth: 1200, margin: "-40px auto 30px", padding: "0 20px" }}>
          <div style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 16px -6px rgba(0, 0, 0, 0.05)", border: "1px solid #f0f0f0" }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={10}>
                <Select
                  showSearch
                  placeholder="Nhập điểm đi"
                  size="large"
                  style={{ width: "100%" }}
                  value={diemDi}
                  onChange={setDiemDi}
                  allowClear
                  suffixIcon={<EnvironmentOutlined />}
                >
                  {departuresList.map(d => (
                    <Option key={d} value={d}>{d}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={10}>
                <Select
                  showSearch
                  placeholder="Nhập điểm đến"
                  size="large"
                  style={{ width: "100%" }}
                  value={diemDen}
                  onChange={setDiemDen}
                  allowClear
                  suffixIcon={<EnvironmentOutlined />}
                >
                  {destinationsList.map(d => (
                    <Option key={d} value={d}>{d}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={4}>
                <Button
                  type="primary"
                  icon={loading ? <SyncOutlined spin /> : <SearchOutlined />}
                  size="large"
                  block
                  onClick={handleSearch}
                  style={{ background: "#106e28", borderColor: "#106e28", fontWeight: 600, height: 40 }}
                >
                  Tìm kiếm
                </Button>
              </Col>
            </Row>
          </div>
        </div>

        {/* Khu vực Bảng hiển thị thông tin gióng hàng */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <Table
            dataSource={flattenedRoutes}
            columns={columns}
            loading={loading}
            pagination={{ pageSize: 15, showSizeChanger: false }}
            onRow={(record) => ({
              onClick: () => navigate(`/khachhang/booking/${record.tripId}`),
              style: { cursor: "pointer" }
            })}
            rowClassName={() => "hover:bg-slate-50 transition-colors"}
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              borderRadius: "8px",
              overflow: "hidden"
            }}
            components={{
              header: {
                cell: (props: any) => (
                  <th
                    {...props}
                    style={{
                      ...props.style,
                      backgroundColor: "#106e28",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "15px",
                      borderBottom: "none",
                    }}
                  />
                ),
              },
            }}
          />
        </div>

      </div>
    </ClientLayout>
  );
}