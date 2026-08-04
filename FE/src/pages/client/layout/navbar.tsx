import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Switch, Button, Avatar, Dropdown, MenuProps } from "antd";
import { BulbOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";

interface NavbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export function Navbar({ isDarkMode, toggleDarkMode }: NavbarProps) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const userString = localStorage.getItem("user");
  let user: any = null;
  try {
    user = userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error("Lỗi parse thông tin user từ localStorage:", error);
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/khachhang/login");
  };

  const handleBookNowClick = () => {
    if (isLoggedIn) {
      navigate("/khachhang/trip");
    } else {
      navigate("/khachhang/login");
    }
  };

  const items: MenuProps["items"] = [
    {
      key: "profile",
      label: <span>Thông tin tài khoản</span>,
      icon: <UserOutlined />,
      onClick: () => navigate("/khachhang/profile"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: <span className="text-red-500">Đăng xuất</span>,
      icon: <LogoutOutlined className="text-red-500" />,
      onClick: handleLogout,
    },
  ];

  const menus = [
    { title: "Trang Chủ", path: "/" },
    { title: "Chuyến đi", path: "/khachhang/trip" },
    { title: "Lịch trình", path: "/khachhang/schedule" },
    { title: "Trợ giúp", path: "/khachhang/contact" },
    { title: "Tin Tức", path: "/khachhang/tintuc" },
  ];

  const displayName = user?.name || user?.fullName || user?.username || "Tài khoản";

  return (
    <nav className="fixed top-0 w-full z-50 h-20 flex items-center bg-white/75 dark:bg-inverse-surface/75 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
      <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto w-full">

        <NavLink to="/" className="cursor-pointer">
          <img src="/assets/images/logoxoanen.png" alt="NetBus Logo" className="h-12" />
        </NavLink>

        <div className="hidden md:flex gap-8 items-center">
          {menus.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `
                pb-1 font-body-md transition-all duration-300 border-b-[3px]
                ${isActive
                  ? "text-primary dark:text-inverse-primary border-primary dark:border-inverse-primary"
                  : "text-secondary dark:text-secondary-fixed-dim border-transparent hover:text-primary"
                }
              `}
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

          {isLoggedIn ? (
            <Dropdown menu={{ items }} placement="bottomRight" arrow>
              <div className="flex items-center gap-2 cursor-pointer p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <Avatar
                  src={user?.avatarUrl || user?.avatar}
                  icon={!user?.avatarUrl && !user?.avatar ? <UserOutlined /> : undefined}
                  className="bg-primary text-white font-bold"
                >
                  {!user?.avatarUrl && !user?.avatar && displayName.charAt(0).toUpperCase()}
                </Avatar>

                <span className="font-semibold text-secondary dark:text-secondary-fixed-dim max-w-[120px] truncate">
                  {displayName}
                </span>
              </div>
            </Dropdown>
          ) : (
            <button
              onClick={() => navigate("/khachhang/login")}
              className="hidden lg:block font-medium transition-colors duration-300 px-4 py-2 text-secondary dark:text-secondary-fixed-dim hover:text-primary"
            >
              Login
            </button>
          )}

          {/* Nút Đặt Vé Ngay */}
          <Button
            type="primary"
            size="large"
            className="font-bold"
            onClick={handleBookNowClick}
          >
            Đặt vé ngay
          </Button>
        </div>
      </div>
    </nav>
  );
}