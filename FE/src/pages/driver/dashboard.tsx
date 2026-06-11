import React, { useState } from "react";
import { Switch, Card, Tag, Statistic, Button, Row, Col, message, ConfigProvider, theme } from "antd";
import {
  DollarOutlined,
  HistoryOutlined,
  StarOutlined,
  CheckCircleOutlined,
  CarOutlined,
  EnvironmentOutlined,
  CompassOutlined,
  WalletOutlined,
  BellOutlined,
  UserOutlined,
  BankOutlined,
  ArrowRightOutlined,
  BulbOutlined,
} from "@ant-design/icons";

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any>({
    id: 101,
    customerName: "Nguyễn Văn Hùng",
    pickup: "Số 12 Tràng Thi, Hoàn Kiếm",
    destination: "Đại học Quốc Gia Hà Nội, Cầu Giấy",
    distance: "8.5 km",
    price: "115,000đ",
    rating: "4.9",
  });

  const stats = [
    { title: "Thu nhập hôm nay", value: 320000, suffix: "đ", icon: <DollarOutlined className="text-amber-500" /> },
    { title: "Số chuyến đi", value: 8, suffix: "chuyến", icon: <HistoryOutlined className="text-blue-500" /> },
    { title: "Đánh giá sao", value: 4.95, suffix: "", icon: <StarOutlined className="text-yellow-500" /> },
    { title: "Tỷ lệ nhận chuyến", value: 98, suffix: "%", icon: <CheckCircleOutlined className="text-emerald-500" /> },
  ];

  const recentTrips = [
    { id: 1, to: "Bến xe Mỹ Đình", price: "52,000đ", status: "Hoàn thành", time: "15:40" },
    { id: 2, to: "Vincom Royal City", price: "88,000đ", status: "Hoàn thành", time: "14:10" },
    { id: 3, to: "Hồ Tây", price: "120,000đ", status: "Hoàn thành", time: "11:25" },
  ];

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleAccept = () => {
    message.success("Đã chấp nhận chuyến đi! Đang tải bản đồ điều hướng...");
    setActiveRequest(null);
  };

  const handleDecline = () => {
    message.info("Đã từ chối chuyến đi.");
    setActiveRequest(null);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#d97706", // Amber 600 theme color for Driver Portal
          borderRadius: 8,
        },
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div className="min-h-screen bg-background text-on-background font-body-md pb-10">
        {/* Header */}
        <header className="border-b border-outline-variant/30 bg-white/80 dark:bg-inverse-surface/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/20">
                Go
              </div>
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-amber-500 to-orange-400 bg-clip-text text-transparent">
                GOPRO TÀI XẾ
              </span>
            </div>

            <div className="flex items-center gap-6">
              {/* Dark Mode Switch */}
              <Switch
                checked={isDarkMode}
                onChange={toggleDarkMode}
                checkedChildren={<BulbOutlined />}
                unCheckedChildren={<BulbOutlined />}
              />

              {/* Online/Offline Toggle */}
              <div className="flex items-center gap-2 bg-surface-container-low dark:bg-slate-900 px-3 py-1.5 rounded-full border border-outline-variant/30">
                <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-secondary"}`}></span>
                <span className="text-xs font-semibold text-secondary mr-2">{isOnline ? "Trực tuyến" : "Ngoại tuyến"}</span>
                <Switch size="small" checked={isOnline} onChange={setIsOnline} />
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-xs text-secondary font-medium">Bác tài,</p>
                  <p className="text-sm font-semibold text-on-background">Nguyễn Văn Tài</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20">
                  TX
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Container */}
        <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
          {/* Stats Grid using Row/Col */}
          <section>
            <Row gutter={[24, 24]}>
              {stats.map((s, idx) => (
                <Col xs={12} md={6} key={idx}>
                  <Card className="tonal-card bg-white dark:bg-slate-900 border border-outline-variant/20 hover:shadow-md transition-all">
                    <Statistic
                      title={<span className="text-xs text-secondary font-medium">{s.title}</span>}
                      value={s.value}
                      suffix={s.suffix}
                      prefix={s.icon}
                      valueStyle={{ fontSize: 22, fontWeight: 700, fontFamily: "Manrope" }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </section>

          {/* Layout Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left + Center: Active Requests & Map */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Request Card */}
              {isOnline && activeRequest ? (
                <Card
                  className="bg-white dark:bg-slate-900 border-2 border-amber-500/30 rounded-3xl relative overflow-hidden shadow-2xl"
                  title={
                    <div className="flex items-center gap-2 py-1">
                      <BellOutlined className="text-amber-500 text-xl animate-bounce" />
                      <span className="text-base font-bold dark:text-white">Yêu cầu đón khách mới</span>
                    </div>
                  }
                  extra={
                    <Tag color="warning" className="font-bold uppercase tracking-wider text-[10px]">
                      Gần bạn
                    </Tag>
                  }
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="space-y-4">
                      {/* Customer info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-slate-800 flex items-center justify-center font-bold text-amber-600 dark:text-amber-400 text-sm">
                          <UserOutlined />
                        </div>
                        <div>
                          <p className="text-xs text-secondary">Khách hàng</p>
                          <p className="text-sm font-semibold text-on-background flex items-center gap-1.5">
                            {activeRequest.customerName}
                            <span className="text-xs text-yellow-500 font-bold flex items-center gap-0.5">
                              ★ {activeRequest.rating}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Routing Details */}
                      <div className="space-y-3 pl-2 relative border-l border-dashed border-outline-variant ml-4 py-1">
                        <div className="flex items-start gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                          <p className="text-secondary">
                            <span className="text-[10px] text-secondary font-medium uppercase mr-1">Đón:</span>
                            {activeRequest.pickup}
                          </p>
                        </div>
                        <div className="flex items-start gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0"></div>
                          <p className="text-secondary">
                            <span className="text-[10px] text-secondary font-medium uppercase mr-1">Đến:</span>
                            {activeRequest.destination}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-surface-container-low dark:bg-slate-950 p-5 rounded-2xl border border-outline-variant/20 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-secondary">Cự ly ước tính</p>
                        <p className="text-lg font-bold text-on-background mt-0.5">{activeRequest.distance}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-secondary">Thu nhập ròng</p>
                        <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-500 mt-0.5">{activeRequest.price}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 mt-6">
                    <Button size="large" className="flex-1 font-semibold" onClick={handleDecline}>
                      Bỏ qua
                    </Button>
                    <Button type="primary" size="large" className="flex-1 font-bold" onClick={handleAccept}>
                      Chấp nhận chuyến đi
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="bg-white/40 dark:bg-slate-900/40 border border-outline-variant/30 border-dashed rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[260px]">
                  <div className="text-4xl text-secondary mb-4">
                    <CompassOutlined spin={isOnline} />
                  </div>
                  <p className="text-sm font-bold text-secondary">
                    {isOnline ? "Đang quét các chuyến đi gần bạn..." : "Hãy trực tuyến để bắt đầu đón khách!"}
                  </p>
                  {isOnline && (
                    <p className="text-xs text-secondary mt-1">Hệ thống sẽ phát thông báo tự động khi phát hiện chuyến đi mới.</p>
                  )}
                </Card>
              )}

              {/* Mock Navigation Map */}
              <Card
                className="bg-white dark:bg-slate-900 border border-outline-variant/20 rounded-3xl"
                title={
                  <div className="flex items-center gap-2">
                    <CompassOutlined className="text-blue-500 text-lg" />
                    <span className="text-base font-bold dark:text-white">Bản đồ nhiệt khu vực hoạt động</span>
                  </div>
                }
              >
                <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-outline-variant/20 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute w-[2px] h-full bg-outline-variant/40 left-1/3"></div>
                  <div className="absolute w-[2px] h-full bg-outline-variant/40 left-2/3"></div>
                  <div className="absolute h-[2px] w-full bg-outline-variant/40 top-1/2"></div>

                  {/* Mock Heat Spots */}
                  <div className="absolute w-24 h-24 bg-amber-500/20 rounded-full blur-2xl top-1/4 left-1/4"></div>
                  <div className="absolute w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl top-1/3 left-1/2"></div>

                  {/* Driver pin */}
                  <div className="relative z-10 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg shadow-blue-500/50 animate-bounce"></div>

                  <span className="absolute bottom-4 left-4 bg-white/80 dark:bg-slate-900/80 px-3 py-1 rounded-full text-[10px] text-secondary border border-outline-variant/20 font-semibold">
                    Vị trí hiện tại: Ba Đình, Hà Nội
                  </span>
                </div>
              </Card>
            </div>

            {/* Right Column: Wallet & History */}
            <div className="space-y-6">
              {/* Wallet Quick Actions */}
              <Card
                className="bg-white dark:bg-slate-900 border border-outline-variant/20 rounded-3xl"
                title={
                  <div className="flex items-center gap-2">
                    <WalletOutlined className="text-amber-500" />
                    <span className="text-base font-bold dark:text-white">Ví đối tác tài xế</span>
                  </div>
                }
              >
                <div className="flex justify-between items-end">
                  <p className="text-xs text-secondary font-semibold uppercase tracking-wider">Số dư khả dụng</p>
                  <Tag color="success" className="font-bold">
                    Khả dụng
                  </Tag>
                </div>
                <p className="text-3xl font-extrabold text-on-background mt-2">842,000đ</p>

                <div className="mt-6 space-y-3">
                  <Button type="primary" block size="large" className="font-bold" icon={<BankOutlined />}>
                    Rút tiền về ngân hàng
                  </Button>
                  <Button block size="large" icon={<WalletOutlined />}>
                    Nạp tiền ký quỹ
                  </Button>
                </div>
              </Card>

              {/* Recent Completed Trips */}
              <Card
                className="bg-white dark:bg-slate-900 border border-outline-variant/20 rounded-3xl"
                title={
                  <div className="flex items-center gap-2">
                    <HistoryOutlined className="text-emerald-500" />
                    <span className="text-base font-bold dark:text-white">Lịch sử hôm nay</span>
                  </div>
                }
              >
                <div className="space-y-4">
                  {recentTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="p-3 bg-surface-container-low dark:bg-slate-950/60 border border-outline-variant/20 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs text-on-background font-semibold truncate max-w-[140px]">
                          {trip.to}
                        </p>
                        <p className="text-[10px] text-secondary mt-0.5">
                          {trip.time} · {trip.status}
                        </p>
                      </div>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+{trip.price}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ConfigProvider>
  );
}
