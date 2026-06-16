import React from "react";
import { NavLink } from "react-router-dom";
import { Switch, Button } from "antd";
import { BulbOutlined } from "@ant-design/icons";

interface NavbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export function Navbar({
  isDarkMode,
  toggleDarkMode,
}: NavbarProps) {
  const menus = [
    {
      title: "Trang Chủ",
      path: "/",
    },
    {
      title: "Chuyến đi",
      path: "/khachhang/trip",
    },
    {
      title: "Kết quả tìm kiếm",
      path: "/khachhang/searchresults",
    },
    {
      title: "Trợ giúp",
      path: "/khachhang/contact",
    },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 h-20 flex items-center bg-white/75 dark:bg-inverse-surface/75 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
      <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto w-full">
        {/* Logo */}
        <NavLink
          to="/"
          className="text-headline-lg font-headline-lg font-extrabold tracking-tight cursor-pointer text-primary dark:text-inverse-primary"
        >
          <img src="/assets/images/logoxoanen.png" alt="NetBus Logo" className="h-12" />
        </NavLink>

        {/* Menu */}
        <div className="hidden md:flex gap-8 items-center">
          {menus.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `
                pb-1
                font-body-md
                transition-all
                duration-300
                border-b-[3px]
                ${
                  isActive
                    ? "text-primary dark:text-inverse-primary border-primary dark:border-inverse-primary"
                    : "text-secondary dark:text-secondary-fixed-dim border-transparent hover:text-primary"
                }
              `
              }
            >
              {item.title}
            </NavLink>
          ))}
        </div>


        <div className="flex items-center gap-4">
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