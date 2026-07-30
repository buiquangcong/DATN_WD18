import React, { useState, useEffect } from "react";
import { ConfigProvider, theme } from "antd";
import { PhoneOutlined } from "@ant-design/icons";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

interface ClientLayoutProps {
  children?: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Ensure dark class is synced on mount
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

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
          borderRadius: 12,
        },
        algorithm: isDarkMode
          ? theme.darkAlgorithm
          : theme.defaultAlgorithm,
      }}
    >
      <div className="min-h-screen flex flex-col bg-[#f9f9fc] text-on-background font-body-md">
        {/* Navbar */}
        <Navbar
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />

        {/* Main Content */}
        <main className="flex-1 pt-24">
          {children}
        </main>

        {/* Footer */}
        <Footer />

        {/* Mobile Call Button */}
        <a
          href="tel:19006467"
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all md:hidden z-50 text-xl"
        >
          <PhoneOutlined />
        </a>
      </div>
    </ConfigProvider>
  );
}