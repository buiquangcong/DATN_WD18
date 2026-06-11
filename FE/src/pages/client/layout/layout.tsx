import React, { useState } from "react";
import { ConfigProvider, theme } from "antd";
import { PhoneOutlined } from "@ant-design/icons";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

interface ClientLayoutProps {
  children?: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

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
        {/* Navbar */}
        <Navbar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

        {/* Main Content */}
        <div className="pt-20">
          {children}
        </div>

        {/* Footer */}
        <Footer />

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
