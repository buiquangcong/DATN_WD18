import React from "react";
import { Switch, Button } from "antd";
import { BulbOutlined } from "@ant-design/icons";

interface NavbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export function Navbar({ isDarkMode, toggleDarkMode }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full z-50 h-20 flex items-center bg-white/75 dark:bg-inverse-surface/75 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
      <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto w-full">
        <div className="text-headline-lg font-headline-lg font-extrabold tracking-tight cursor-pointer text-primary dark:text-inverse-primary">
          NETBUS
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <a
            className="pb-1 font-body-md text-primary dark:text-inverse-primary border-b-[3px] border-primary dark:border-inverse-primary"
            href="/"
          >
            Trang Chủ
          </a>
          <a
            className="transition-colors duration-300 font-body-md text-secondary dark:text-secondary-fixed-dim hover:text-primary"
            href="/khachhang/trip"
          >
            Chuyến đi
          </a>
          <a
            className="transition-colors duration-300 font-body-md text-secondary dark:text-secondary-fixed-dim hover:text-primary"
            href="/khachhang/searchresults"
          >
            Kết quả tìm kiếm
          </a>
          <a
            className="transition-colors duration-300 font-body-md text-secondary dark:text-secondary-fixed-dim hover:text-primary"
            href="/contact"
          >
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
          <button className="hidden lg:block font-medium transition-colors duration-300 px-4 py-2 text-secondary dark:text-secondary-fixed-dim hover:text-primary">
            Login
          </button>
          <Button type="primary" size="large" className="font-bold">
            Book Now
          </Button>
        </div>
      </div>
    </nav>
  );
}
