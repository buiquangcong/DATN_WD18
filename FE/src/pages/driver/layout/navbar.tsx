import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Button, Avatar } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";

interface NavbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export function Navbar({
  isDarkMode,
  toggleDarkMode,
}: NavbarProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [driverUser, setDriverUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") {
      try {
        const userObj = JSON.parse(userStr);
        setIsLoggedIn(true);
        setDriverUser(userObj);

        if (userObj?.staffId) {
          fetch(`http://localhost:3000/api/staff/detail/${userObj.staffId}`)
            .then((res) => res.json())
            .then((data) => {
              const staffData = data?.data || data;
              if (staffData) {
                setDriverUser((prev: any) => ({
                  ...prev,
                  displayName: staffData.ten || prev?.displayName || prev?.username || "Tài xế",
                  avatar: staffData.image || prev?.avatar || prev?.image || "",
                }));
              }
            })
            .catch(() => {});
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

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
    }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-white border-b border-outline-variant/20 shadow-xs">
      <div className="w-full h-full px-8 md:px-16 flex items-center justify-between">
        
        <NavLink
          to="/taixe"
          className="text-[28px] font-extrabold tracking-tight text-primary leading-none"
        >
          NETBUS
        </NavLink>

        {/* Menu */}
        <div className="hidden md:flex items-center gap-10 lg:gap-14 ml-10">
          {menus.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/taixe"}
              className={({ isActive }) =>
                `
                h-20
                flex
                items-center
                border-b-[3px]
                text-[17px]
                font-medium
                transition-all
                ${
                  isActive
                    ? "border-primary text-primary font-semibold"
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
        <div className="flex items-center gap-4">
          <Button
            type="primary"
            className="
              !h-8
              !px-5
              !rounded-full
              !font-bold
              !text-base
              shadow-sm
            "
          >
            Book Now
          </Button>

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              {/* Driver Profile (Avatar + Name) next to Book Now */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-green-50/80 border border-green-200/80 shadow-xs">
                <Avatar
                  src={driverUser?.avatar || driverUser?.image}
                  icon={<UserOutlined />}
                  className="bg-green-700 text-white font-bold flex-shrink-0 border border-green-600"
                  size={34}
                />
                <span className="font-semibold text-gray-800 text-base max-w-[160px] truncate">
                  {driverUser?.displayName || driverUser?.ten || driverUser?.username || "Tài xế"}
                </span>
              </div>

              {/* Logout button */}
              <div
                className="hidden lg:flex items-center gap-1.5 text-red-500 hover:text-red-600 font-semibold text-base transition cursor-pointer"
                onClick={() => {
                  localStorage.removeItem("user");
                  localStorage.removeItem("token");
                  window.location.href = "/taixe/login";
                }}
                title="Đăng xuất"
              >
                <LogoutOutlined className="text-lg" />
                <span>Đăng xuất</span>
              </div>
            </div>
          ) : (
            <NavLink
              to="/taixe/login"
              className="hidden lg:flex items-center gap-2 text-primary font-semibold text-lg hover:text-blue-600 transition"
            >
              <UserOutlined />
              <span>Driver Portal</span>
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}