import React from "react";
import { NavLink } from "react-router-dom";
import { Button } from "antd";
import { UserOutlined } from "@ant-design/icons";

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
      title: "Trang chủ",
      path: "/taixe",
    },
    {
      title: "Danh sách chuyến xe",
      path: "/taixe/list",
    },
    {
      title: "Phản hồi chuyến xe",
      path: "/taixe/feedback",
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-white border-b border-outline-variant/20">
      <div className="w-full h-full px-16 flex items-center justify-between">
        
        <NavLink
          to="/taixe"
            className="text-[28px] font-extrabold tracking-tight text-primary leading-none"
        >
          NETBUS
        </NavLink>

        {/* Menu */}
        <div className="hidden md:flex items-center gap-14 ml-20">
          {menus.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/taixe"}
              className={({ isActive }) =>
                `
                h-24
                flex
                items-center
                border-b-[4px]
                text-[18px]
                font-medium
                transition-all
                ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-600 hover:text-primary"
                }
              `
              }
            >
              {item.title}
            </NavLink>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-6">
          <Button
            type="primary"
            className="
              !h-6
              !px-5
              !rounded-full
              !font-bold
              !text-base
              shadow-sm
            "
          >
            Book Now
          </Button>

          <div className="hidden lg:flex items-center gap-2 text-primary font-semibold text-lg">
            <UserOutlined />
            <span>Driver Portal</span>
          </div>
        </div>
      </div>
    </nav>
  );
}