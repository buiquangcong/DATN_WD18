import { Toaster } from "react-hot-toast";
import { ConfigProvider } from "antd";
import { Navigate, Route, Routes, Outlet, Link } from "react-router-dom";
import { lazy, Suspense } from "react";
import { varAlpha } from "minimal-shared/utils";
import Box from "@mui/material/Box";
import LinearProgress, { linearProgressClasses } from "@mui/material/LinearProgress";

import { ThemeProvider } from "./theme/theme-provider";
import { DashboardLayout } from "./layouts/dashboard";
import { Iconify } from "./components/iconify";

import ListPage from "./pages/admin/danhsachxe/ListPage";
import AddPage from "./pages/admin/danhsachxe/AddPage";
import EditPage from "./pages/admin/danhsachxe/EditPage";
// Tuyến đường
import JourneyListPage from "./pages/admin/tuyenduong/ListPage"
import JourneyAddPage from "./pages/admin/tuyenduong/AddPage"
import JourneyEditPage from "./pages/admin/tuyenduong/EditPage"
// import JourneyDetailPage from "./pages/admin/tuyenduong/DetailPage";

import StaffListPage from "./pages/admin/danhsachnhanvien/ListPage";
import StaffAddPage from "./pages/admin/danhsachnhanvien/AddPage";
import StaffEditPage from "./pages/admin/danhsachnhanvien/EditPage";

// Trip pages
import TripListPage from "./pages/admin/trip/ListPage";

// Lazy load template pages
import KhachHangPage from "./pages/client/dashboard";
import Trip from "./pages/client/trip";
import SearchResults from "./pages/client/searchresults";
import Contact from "./pages/client/contact";
import TaiXePage from "./pages/driver/dashboard";
// import ListTaixePage from "./pages/driver/listtaixe";
import Login from "./pages/driver/login";

import DashboardPage from "./pages/admin/dashboard";
import TripAddPage from "./pages/admin/trip/AddPage";
import TripEditPage from "./pages/admin/trip/EditPage";
import BookingSeats from "./pages/client/Booking";
const BlogPage = lazy(() => import("./pages/admin/blog"));
const ProductsPage = lazy(() => import("./pages/admin/products"));
const Page404 = lazy(() => import("./pages/page-not-found"));
const LoginPage = lazy(() => import("./pages/admin/auth/Login"));

// Lazy load customer and driver pages
const ClientDashboard = lazy(() => import("./pages/client/dashboard"));
const DriverDashboard = lazy(() => import("./pages/driver/dashboard"));

const renderFallback = () => (
  <Box
    sx={{
      display: "flex",
      flex: "1 1 auto",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: "text.primary" },
      }}
    />
  </Box>
);

function PortalPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-600/10 rounded-full blur-3xl"></div>

      <div className="z-10 max-w-4xl w-full text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-linear-to-r from-emerald-400 via-green-300 to-emerald-500 bg-clip-text text-transparent">
          GOPRO TRANSPORT
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
          Chào mừng đến với hệ thống quản lý và vận hành GoPro. Hãy chọn vai trò của bạn để truy cập hệ thống.
        </p>
      </div>

      <div className="z-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        {/* Customer Card */}
        <div className="bg-slate-900/40 border border-slate-800 hover:border-emerald-500/30 rounded-3xl p-6 transition-all hover:scale-[1.02] flex flex-col justify-between h-96 group shadow-xl">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300">
              <Iconify icon="solar:user-bold-duotone" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Cổng Khách hàng</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Đặt xe máy, ô tô, giao nhận hàng hóa nhanh chóng. Quản lý ví cá nhân, xem lịch sử đặt xe và áp dụng các chương trình khuyến mãi độc quyền.
            </p>
          </div>
          <Link
            to="/khachhang"
            className="mt-6 w-full py-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-500 text-xs font-bold text-emerald-400 text-center transition-all cursor-pointer block"
          >
            Đăng nhập Khách hàng
          </Link>
        </div>

        {/* Driver Card */}
        <div className="bg-slate-900/40 border border-slate-800 hover:border-amber-500/30 rounded-3xl p-6 transition-all hover:scale-[1.02] flex flex-col justify-between h-96 group shadow-xl">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300">
              <Iconify icon="solar:routing-bold-duotone" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Cổng Tài xế</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quản lý ca làm việc, nhận yêu cầu đón khách trực tuyến, xem bản đồ nhiệt để tối ưu hóa quãng đường và theo dõi chi tiết số dư thu nhập ròng hàng ngày.
            </p>
          </div>
          <Link
            to="/taixe"
            className="mt-6 w-full py-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 text-xs font-bold text-amber-400 text-center transition-all cursor-pointer block"
          >
            Đăng nhập Tài xế
          </Link>
        </div>

        {/* Admin Card */}
        <div className="bg-slate-900/40 border border-slate-800 hover:border-emerald-500/30 rounded-3xl p-6 transition-all hover:scale-[1.02] flex flex-col justify-between h-96 group shadow-xl">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300">
              <Iconify icon="solar:settings-bold-duotone" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Cổng Quản trị (Admin)</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Truy cập bảng điều khiển hệ thống. Xem báo cáo doanh thu chi tiết, quản lý danh sách xe, cấu hình danh mục sản phẩm và blog.
            </p>
          </div>
          <Link
            to="/admin"
            className="mt-6 w-full py-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-500 text-xs font-bold text-emerald-400 text-center transition-all cursor-pointer block"
          >
            Đăng nhập Admin
          </Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#00AB55",
          },
        }}
      >
        <Suspense fallback={renderFallback()}>
          <Routes>
            {/* Redirect root to Customer page */}
            <Route path="/" element={<Navigate to="/khachhang" replace />} />

            {/* Portal Page to select roles */}
            <Route path="/portal" element={<PortalPage />} />

            {/* Customer Route */}
            <Route path="/khachhang" element={<KhachHangPage />} />
            <Route path="/khachhang/trip" element={<Trip />} />
            <Route path="/khachhang/searchresults" element={<SearchResults />} />
            <Route path="/khachhang/booking/:tripId" element={<BookingSeats />} />
            <Route path="/khachhang/login" element={<LoginPage />} />
            
            <Route path="/contact" element={<Contact />} />

            {/* Driver Route */}
            <Route path="/taixe" element={<TaiXePage />} />
            {/* <Route path="/taixe/listtaixe" element={<ListTaixePage />} /> */}
            <Route path="/taixe/login" element={<Login />} />

            {/* Admin Routes with Dashboard Layout */}
            <Route
              path="/admin"
              element={
                <DashboardLayout>
                  <Outlet />
                </DashboardLayout>
              }
            >
              {/* When path is /admin, show DashboardPage */}
              <Route index element={<DashboardPage />} />

              {/* Nested CRUD pages and template pages under /admin/ */}
              <Route path="bus/list" element={<ListPage />} />
              <Route path="bus/add" element={<AddPage />} />
              <Route path="bus/edit/:id" element={<EditPage />} />
              {/* Nhân viên */}
              <Route path="staff/list" element={<StaffListPage />} />
              <Route path="staff/add" element={<StaffAddPage />} />
              <Route path="staff/edit/:id" element={<StaffEditPage />} />
              {/* Tuyến đường */}
              <Route path="journey/list" element={<JourneyListPage />} />
              <Route path="journey/add" element={<JourneyAddPage />} />
              <Route path="journey/edit/:id" element={<JourneyEditPage />} />
              {/* <Route path="journey/detail/:id" element={<JourneyDetailPage />} /> */}

              <Route path="trip/list" element={<TripListPage />} />
              <Route path="trip/add" element={<TripAddPage />} />
              <Route path="trip/edit/:id" element={<TripEditPage />} />

              <Route path="products" element={<ProductsPage />} />
              <Route path="blog" element={<BlogPage />} />
            </Route>

            {/* Standalone pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/404" element={<Page404 />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
        <Toaster />
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;
