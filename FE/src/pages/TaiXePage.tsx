import { useState } from "react";
import { Iconify } from "src/components/iconify";

export default function TaiXePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [activeRequest, setActiveRequest] = useState<any>({
    id: 101,
    customerName: "Nguyễn Văn Hùng",
    pickup: "Số 12 Tràng Thi, Hoàn Kiếm",
    destination: "Đại học Quốc Gia Hà Nội, Cầu Giấy",
    distance: "8.5 km",
    price: "115,000đ",
    rating: "4.9"
  });

  const stats = [
    { title: "Thu nhập hôm nay", value: "320,000đ", icon: "solar:database-bold-duotone", color: "text-amber-400" },
    { title: "Số chuyến đi", value: "8 chuyến", icon: "solar:routing-bold-duotone", color: "text-blue-400" },
    { title: "Đánh giá sao", value: "4.95", icon: "solar:star-bold-duotone", color: "text-yellow-400" },
    { title: "Tỷ lệ nhận chuyến", value: "98%", icon: "solar:check-circle-bold-duotone", color: "text-emerald-400" }
  ];

  const recentTrips = [
    { id: 1, to: "Bến xe Mỹ Đình", price: "52,000đ", status: "Hoàn thành", time: "15:40" },
    { id: 2, to: "Vincom Royal City", price: "88,000đ", status: "Hoàn thành", time: "14:10" },
    { id: 3, to: "Hồ Tây", price: "120,000đ", status: "Hoàn thành", time: "11:25" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-10">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              Go
            </div>
            <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">
              GOPRO TÀI XẾ
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* Online/Offline Toggle */}
            <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-full border border-slate-800">
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}></span>
              <span className="text-xs font-semibold text-slate-300 mr-2">{isOnline ? "Đang trực tuyến" : "Ngoại tuyến"}</span>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`w-10 h-5 rounded-full p-0.5 transition-all focus:outline-none cursor-pointer ${
                  isOnline ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-slate-950 transition-all ${isOnline ? "translate-x-5" : ""}`}></div>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-xs text-slate-400 font-medium">Bác tài,</p>
                <p className="text-sm font-semibold text-slate-200">Nguyễn Văn Tài</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 ring-2 ring-amber-400/20">
                TX
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        
        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, idx) => (
            <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-center text-2xl ${s.color}`}>
                <Iconify icon={s.icon} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{s.title}</p>
                <p className="text-lg font-bold text-slate-100 mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left + Center: Active Requests & Map */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Active Request Card */}
            {isOnline && activeRequest ? (
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 bg-amber-400/10 text-amber-300 text-[10px] font-bold px-3 py-1 rounded-bl-2xl uppercase tracking-wider">
                  Chuyến đi mới gần bạn
                </div>
                
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
                  <Iconify icon="solar:bell-ring-bold-duotone" className="text-amber-400 text-2xl" />
                  Nhận yêu cầu đón khách
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    {/* Customer */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-sm">
                        NH
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Khách hàng</p>
                        <p className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                          {activeRequest.customerName}
                          <span className="text-xs text-yellow-400 font-bold flex items-center gap-0.5">
                            ★ {activeRequest.rating}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Routing Details */}
                    <div className="space-y-3 pl-2 relative border-l border-dashed border-slate-700 ml-4 py-1">
                      <div className="flex items-start gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0"></div>
                        <p className="text-slate-400"><span className="text-[10px] text-slate-500 font-medium uppercase">Đón:</span> {activeRequest.pickup}</p>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0"></div>
                        <p className="text-slate-400"><span className="text-[10px] text-slate-500 font-medium uppercase">Đến:</span> {activeRequest.destination}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Distance Summary */}
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-850 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Cự ly ước tính</p>
                      <p className="text-lg font-bold text-slate-200 mt-0.5">{activeRequest.distance}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Thu nhập ròng</p>
                      <p className="text-2xl font-extrabold text-amber-400 mt-0.5">{activeRequest.price}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setActiveRequest(null)}
                    className="flex-1 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                  <button
                    onClick={() => {
                      alert("Đã chấp nhận chuyến đi! Đang điều hướng...");
                      setActiveRequest(null);
                    }}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/10 cursor-pointer text-xs"
                  >
                    Chấp nhận chuyến đi
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-850 border-dashed rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
                <Iconify icon={isOnline ? "solar:mailbox-empty-bold-duotone" : "solar:plug-bold-duotone"} className="text-5xl text-slate-600 mb-4" />
                <p className="text-sm font-bold text-slate-400">
                  {isOnline ? "Đang dò quét các yêu cầu chuyến đi gần bạn..." : "Hãy trực tuyến để bắt đầu đón khách!"}
                </p>
                {isOnline && <p className="text-xs text-slate-600 mt-1">Hệ thống tự động phát tiếng chuông khi có chuyến mới.</p>}
              </div>
            )}

            {/* Mock Navigation Map */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur shadow-2xl relative overflow-hidden">
              <h2 className="text-md font-bold text-slate-100 flex items-center gap-2 mb-4">
                <Iconify icon="solar:map-bold-duotone" className="text-blue-400 text-xl" />
                Bản đồ nhiệt khu vực hoạt động
              </h2>
              <div className="h-64 rounded-2xl bg-slate-950 border border-slate-850 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 opacity-40"></div>
                {/* Mock Roads */}
                <div className="absolute w-[2px] h-full bg-slate-850/60 left-1/3"></div>
                <div className="absolute w-[2px] h-full bg-slate-850/60 left-2/3"></div>
                <div className="absolute h-[2px] w-full bg-slate-850/60 top-1/2"></div>
                
                {/* Mock Heat Spots */}
                <div className="absolute w-24 h-24 bg-amber-500/20 rounded-full blur-2xl top-1/4 left-1/4"></div>
                <div className="absolute w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl top-1/3 left-1/2"></div>
                
                {/* Driver pin */}
                <div className="relative z-10 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-100 shadow-lg shadow-blue-500/50 animate-bounce"></div>
                
                <span className="absolute bottom-4 left-4 bg-slate-900/80 px-3 py-1 rounded-full text-[10px] text-slate-400 border border-slate-800 font-semibold">
                  Tải xế đang ở: Ba Đình, Hà Nội
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Earnings breakdown & history */}
          <div className="space-y-6">
            
            {/* Wallet Quick Actions */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur shadow-2xl">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Ví đối tác tài xế</p>
              <div className="flex justify-between items-end mt-2">
                <p className="text-2xl font-extrabold text-slate-100">842,000đ</p>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">Khả dụng</span>
              </div>

              <div className="mt-6 space-y-3">
                <button className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                  <Iconify icon="solar:cash-out-bold" className="text-base" /> Rút tiền về ngân hàng
                </button>
                <button className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                  <Iconify icon="solar:card-send-bold" className="text-base" /> Nạp tiền ký quỹ
                </button>
              </div>
            </div>

            {/* Recent Completed Trips */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur shadow-2xl">
              <h2 className="text-md font-bold text-slate-100 flex items-center gap-2 mb-4">
                <Iconify icon="solar:checklist-bold-duotone" className="text-emerald-400 text-xl" />
                Lịch sử hôm nay
              </h2>
              
              <div className="space-y-4">
                {recentTrips.map((trip) => (
                  <div key={trip.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-300 font-semibold truncate max-w-[140px]">{trip.to}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{trip.time} · {trip.status}</p>
                    </div>
                    <p className="text-xs font-bold text-emerald-400">+{trip.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
