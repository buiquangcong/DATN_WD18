import { useState } from "react";
import { Iconify } from "src/components/iconify";

export default function KhachHangPage() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("car4");

  const tripHistory = [
    { id: 1, from: "Đại học FPT", to: "Hồ Gươm", date: "Hôm nay, 14:30", price: "75,000đ", status: "Hoàn thành", driver: "Nguyễn Văn A" },
    { id: 2, from: "Keangnam Landmark", to: "Cầu Giấy", date: "Hôm qua, 09:15", price: "42,000đ", status: "Hoàn thành", driver: "Trần Thị B" },
    { id: 3, from: "Nội Bài Airport", to: "Tây Hồ", date: "03/06/2026", price: "250,000đ", status: "Đã hủy", driver: "Phạm Văn C" },
  ];

  const vehicles = [
    { id: "bike", name: "Xe máy", price: "12,000đ", icon: "solar:bike-bold-duotone", eta: "2 phút" },
    { id: "car4", name: "Ô tô 4 chỗ", price: "35,000đ", icon: "solar:car-bold-duotone", eta: "5 phút" },
    { id: "car7", name: "Ô tô 7 chỗ", price: "48,000đ", icon: "solar:bus-bold-duotone", eta: "6 phút" },
    { id: "delivery", name: "Giao hàng", price: "18,000đ", icon: "solar:box-bold-duotone", eta: "3 phút" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-10">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              Go
            </div>
            <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              GOPRO KHÁCH HÀNG
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-400 font-medium">Xin chào,</p>
              <p className="text-sm font-semibold text-slate-200">Bùi Quang Công</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 ring-2 ring-emerald-400/20">
              QC
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Booking Panel */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur shadow-2xl">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
              <Iconify icon="solar:map-arrow-square-bold-duotone" className="text-emerald-400 text-2xl" />
              Đặt chuyến đi mới
            </h2>

            {/* Route Inputs */}
            <div className="space-y-4 relative">
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-400 via-slate-600 to-teal-500 hidden md:block"></div>
              
              {/* Pickup */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Iconify icon="solar:point-on-map-bold-duotone" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Điểm đón khách</label>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Nhập địa chỉ đón..."
                    className="w-full bg-transparent border-0 p-0 text-slate-200 placeholder-slate-600 focus:ring-0 text-sm mt-1 focus:outline-none"
                  />
                </div>
              </div>

              {/* Destination */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                  <Iconify icon="solar:pin-list-bold-duotone" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Điểm đến</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Nhập địa chỉ đến..."
                    className="w-full bg-transparent border-0 p-0 text-slate-200 placeholder-slate-600 focus:ring-0 text-sm mt-1 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Selection Grid */}
            <h3 className="text-sm font-semibold text-slate-400 mt-8 mb-4">Chọn loại phương tiện</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicle(v.id)}
                  className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between h-32 hover:scale-[1.02] cursor-pointer ${
                    selectedVehicle === v.id
                      ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
                      : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Iconify
                      icon={v.icon}
                      className={`text-3xl ${selectedVehicle === v.id ? "text-emerald-400" : "text-slate-400"}`}
                    />
                    <span className="text-[10px] bg-slate-800/60 px-2 py-0.5 rounded text-slate-400 font-medium">{v.eta}</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{v.name}</p>
                    <p className="text-sm font-bold text-slate-100 mt-0.5">{v.price}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => alert(`Đặt chuyến từ: ${pickup || "Chưa nhập"} đến: ${destination || "Chưa nhập"}`)}
              className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold transition-all shadow-xl shadow-emerald-500/15 hover:shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer text-base"
            >
              <Iconify icon="solar:routing-bold" className="text-xl" />
              Xác nhận & Đặt xe ngay
            </button>
          </div>

          {/* Special Promos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 group-hover:scale-110 transition-transform">
                <Iconify icon="solar:ticket-sale-bold" className="text-9xl text-emerald-400" />
              </div>
              <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Ưu đãi độc quyền</span>
              <h3 className="text-lg font-bold text-slate-100 mt-3">Giảm 20% Chuyến đầu tiên</h3>
              <p className="text-xs text-slate-400 mt-1">Sử dụng mã GOPRONEW khi đặt chuyến đi đầu tiên.</p>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 group-hover:scale-110 transition-transform">
                <Iconify icon="solar:card-recive-bold" className="text-9xl text-teal-400" />
              </div>
              <span className="bg-teal-400/20 text-teal-300 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Ví GoPro</span>
              <h3 className="text-lg font-bold text-slate-100 mt-3">Liên kết ví, hoàn ngay 5%</h3>
              <p className="text-xs text-slate-400 mt-1">Hoàn tiền tự động cho tất cả các giao dịch thanh toán ví.</p>
            </div>
          </div>
        </section>

        {/* Right Column: Account Balance & History */}
        <section className="space-y-6">
          {/* Card Balance */}
          <div className="bg-gradient-to-tr from-slate-900 via-slate-900 to-slate-800 border border-slate-800 rounded-3xl p-6 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Ví GoPro Pay</p>
                <p className="text-3xl font-extrabold text-slate-100 mt-2">1,250,000 đ</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400">
                <Iconify icon="solar:wallet-money-bold-duotone" className="text-2xl" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-6 border-t border-slate-800/60">
              <button className="flex-1 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <Iconify icon="solar:card-send-bold" className="text-base" /> Nạp tiền
              </button>
              <button className="flex-1 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <Iconify icon="solar:history-bold" className="text-base" /> Lịch sử ví
              </button>
            </div>
          </div>

          {/* Trip History */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-md font-bold text-slate-100 flex items-center gap-2">
                <Iconify icon="solar:history-bold-duotone" className="text-teal-400 text-xl" />
                Lịch sử đặt xe
              </h2>
              <button className="text-xs text-emerald-400 font-bold hover:underline cursor-pointer">Tất cả</button>
            </div>

            <div className="space-y-4">
              {tripHistory.map((trip) => (
                <div key={trip.id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl hover:border-slate-800 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        trip.status === "Hoàn thành" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {trip.status}
                      </span>
                      <p className="text-[10px] text-slate-500 font-semibold">{trip.date}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-100">{trip.price}</p>
                  </div>
                  
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                      <p className="text-slate-400 truncate"><span className="text-[10px] text-slate-600 font-medium">Đón:</span> {trip.from}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                      <p className="text-slate-400 truncate"><span className="text-[10px] text-slate-600 font-medium">Đến:</span> {trip.to}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-850 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                        {trip.driver.charAt(0)}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">{trip.driver}</p>
                    </div>
                    <button className="text-[10px] font-bold text-teal-400 flex items-center gap-1 hover:underline cursor-pointer">
                      <Iconify icon="solar:refresh-bold" /> Đặt lại
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
