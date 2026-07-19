import React, { useState } from "react";
import { Switch, Button, ConfigProvider, theme } from "antd";
import { useNavigate } from "react-router-dom";
import {
  BulbOutlined,
  PhoneOutlined,
  GlobalOutlined,
  WechatOutlined,
  EnvironmentOutlined,
  MailOutlined,
} from "@ant-design/icons";

interface ClientLayoutProps {
  children?: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const handleLoginClick = () => {
    if (isLoggedIn) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/khachhang/login");
    } else {
      navigate("/khachhang/login");
    }
  };

  const handleBookNowClick = () => {
    if (isLoggedIn) {
      navigate("/khachhang/trip");
    } else {
      navigate("/khachhang/login");
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#166e00",
          borderRadius: 8,
        },
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div className="bg-background text-on-background font-body-md min-h-screen">
        {/* TopNavBar */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-inverse-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm h-20">
          <div className="flex justify-between items-center h-full px-margin-desktop max-w-container-max mx-auto w-full">
            <div className="text-headline-lg font-headline-lg font-extrabold tracking-tight text-primary dark:text-inverse-primary cursor-pointer">
              NETBUS
            </div>
            <div className="hidden md:flex gap-8 items-center">
              <a
                className="text-primary dark:text-inverse-primary border-b-[3px] border-primary dark:border-inverse-primary pb-1 font-body-md"
                href="#"
              >
                Routes
              </a>
              <a className="text-secondary dark:text-secondary-fixed-dim hover:text-primary transition-colors font-body-md" href="#">
                Schedules
              </a>
              <a className="text-secondary dark:text-secondary-fixed-dim hover:text-primary transition-colors font-body-md" href="#">
                Sustainability
              </a>
              <a className="text-secondary dark:text-secondary-fixed-dim hover:text-primary transition-colors font-body-md" href="#">
                Help
              </a>
            </div>
            <div className="flex items-center gap-4">
              {/* Dark Mode Switch */}
              <Switch
                checked={isDarkMode}
                onChange={toggleDarkMode}
                checkedChildren={<BulbOutlined />}
                unCheckedChildren={<BulbOutlined />}
              />
              <button
                onClick={handleLoginClick}
                className="hidden lg:block text-secondary dark:text-secondary-fixed-dim font-medium hover:text-primary transition-colors px-4 py-2"
              >
                {isLoggedIn ? "Logout" : "Login"}
              </button>
              <Button
                type="primary"
                size="large"
                className="font-bold"
                onClick={handleBookNowClick}
              >
                Book Now
              </Button>
            </div>
          </div>
        </nav>

        {/* Main content wrapper */}
        <div className="pt-20">
          {children}
        </div>

        {/* Footer */}
        <footer className="bg-surface-container-lowest dark:bg-inverse-surface border-t border-outline-variant/20">
          <div className="max-w-container-max mx-auto px-margin-desktop py-16 grid grid-cols-1 md:grid-cols-4 gap-gutter">
            <div className="col-span-1 md:col-span-1 space-y-6">
              <div className="text-headline-md font-headline-md font-bold text-primary dark:text-inverse-primary">
                NETBUS
              </div>
              <p className="text-body-md text-on-surface-variant dark:text-secondary-fixed-dim">
                Vận tải hành khách Văn Minh chuyên tuyến Hà Nội - Nghệ An - Hà Tĩnh - Quảng Trị - Đà Nẵng. Vì một tương lai xanh.
              </p>
              <div className="flex gap-4">
                <a
                  className="w-10 h-10 rounded-full border border-outline flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                  href="#"
                >
                  <GlobalOutlined />
                </a>
                <a
                  className="w-10 h-10 rounded-full border border-outline flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                  href="#"
                >
                  <WechatOutlined />
                </a>
              </div>
            </div>
            <div>
              <h5 className="text-primary font-bold mb-6">NETBUS Group</h5>
              <ul className="space-y-4">
                <li>
                  <a
                    className="text-on-surface-variant dark:text-secondary-fixed-dim hover:text-primary transition-all font-body-md underline-offset-4"
                    href="#"
                  >
                    Về chúng tôi
                  </a>
                </li>
                <li>
                  <a
                    className="text-on-surface-variant dark:text-secondary-fixed-dim hover:text-primary transition-all font-body-md underline-offset-4"
                    href="#"
                  >
                    Lịch trình
                  </a>
                </li>
                <li>
                  <a
                    className="text-on-surface-variant dark:text-secondary-fixed-dim hover:text-primary transition-all font-body-md underline-offset-4"
                    href="#"
                  >
                    Tuyển dụng
                  </a>
                </li>
                <li>
                  <a
                    className="text-on-surface-variant dark:text-secondary-fixed-dim hover:text-primary transition-all font-body-md underline-offset-4"
                    href="#"
                  >
                    Hệ thống văn phòng
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-primary font-bold mb-6">Hỗ trợ khách hàng</h5>
              <ul className="space-y-4">
                <li>
                  <a
                    className="text-on-surface-variant dark:text-secondary-fixed-dim hover:text-primary transition-all font-body-md underline-offset-4"
                    href="#"
                  >
                    Câu hỏi thường gặp
                  </a>
                </li>
                <li>
                  <a
                    className="text-on-surface-variant dark:text-secondary-fixed-dim hover:text-primary transition-all font-body-md underline-offset-4"
                    href="#"
                  >
                    Chính sách bảo mật
                  </a>
                </li>
                <li>
                  <a
                    className="text-on-surface-variant dark:text-secondary-fixed-dim hover:text-primary transition-all font-body-md underline-offset-4"
                    href="#"
                  >
                    Điều khoản Văn Minh
                  </a>
                </li>
                <li>
                  <a
                    className="text-on-surface-variant dark:text-secondary-fixed-dim hover:text-primary transition-all font-body-md underline-offset-4"
                    href="#"
                  >
                    Hướng dẫn đặt vé
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-primary font-bold mb-6">Liên hệ</h5>
              <ul className="space-y-4">
                <li className="flex gap-3 text-on-surface-variant dark:text-secondary-fixed-dim items-center">
                  <EnvironmentOutlined className="text-primary" />
                  <span>Đường Mai Thúc Loan, Phường Cửa Lò, Tỉnh Nghệ An</span>
                </li>
                <li className="flex gap-3 text-on-surface-variant dark:text-secondary-fixed-dim items-center">
                  <PhoneOutlined className="text-primary" />
                  <span className="font-bold text-headline-md text-emerald-700 dark:text-emerald-400">1900 6467</span>
                </li>
                <li className="flex gap-3 text-on-surface-variant dark:text-secondary-fixed-dim items-center">
                  <MailOutlined className="text-primary" />
                  <span>netbus.vn@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-outline-variant/20 py-8 px-margin-desktop max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center text-label-sm text-secondary gap-4">
            <p>© 2024 NETBUS Infrastructure. All rights reserved. Driving a greener future.</p>
            <div className="flex gap-6">
              <span>Trực tuyến: 25</span>
              <span>Tổng truy cập: 101,088</span>
            </div>
          </div>
        </footer>

        {/* FAB for mobile Quick Call */}
        <a
          href="tel:19006467"
          className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all md:hidden z-50 cursor-pointer text-2xl"
        >
          <PhoneOutlined />
        </a>
      </div>
    </ConfigProvider>
  );
}
