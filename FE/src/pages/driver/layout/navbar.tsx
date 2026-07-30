import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Switch, Button, Avatar, Dropdown, MenuProps } from "antd";
import { BulbOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";

interface NavbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export function Navbar({ isDarkMode, toggleDarkMode }: NavbarProps) {
  const navigate = useNavigate();
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
                  ...staffData,
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/taixe/login";
  };

  const displayName = driverUser?.displayName || driverUser?.ten || driverUser?.username || "Tài xế";

  const items: MenuProps["items"] = [
    {
      key: "profile",
      label: <span>Thông tin tài khoản</span>,
      icon: <UserOutlined />,
      onClick: () => navigate("/taixe/profile"),
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
    { title: "Trang chủ", path: "/taixe" },
    { title: "Danh sách chuyến xe", path: "/taixe/list" },
    { title: "Phản hồi chuyến xe", path: "/taixe/feedback" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 h-20 flex items-center bg-white/75 dark:bg-inverse-surface/75 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
      <div className="flex justify-between items-center px-margin-desktop max-w-container-max mx-auto w-full">

        <NavLink to="/taixe" className="cursor-pointer">
          <img src="/assets/images/logoxoanen.png" alt="NetBus Logo" className="h-12" />
        </NavLink>

        <div className="hidden md:flex gap-8 items-center">
          {menus.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/taixe"}
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
                  src={driverUser?.avatar || driverUser?.image}
                  icon={!driverUser?.avatar && !driverUser?.image ? <UserOutlined /> : undefined}
                  className="bg-primary text-white font-bold"
                >
                  {!driverUser?.avatar && !driverUser?.image && displayName.charAt(0).toUpperCase()}
                </Avatar>

                <span className="font-semibold text-secondary dark:text-secondary-fixed-dim max-w-[120px] truncate">
                  {displayName}
                </span>
              </div>
            </Dropdown>
          ) : (
            <button
              onClick={() => navigate("/taixe/login")}
              className="hidden lg:block font-medium transition-colors duration-300 px-4 py-2 text-secondary dark:text-secondary-fixed-dim hover:text-primary"
            >
              Login
            </button>
          )}

          {/* Nút Book Now */}
          <Button
            type="primary"
            size="large"
            className="font-bold"
          >
            Book Now
          </Button>
        </div>
      </div>
    </nav>
  );
}