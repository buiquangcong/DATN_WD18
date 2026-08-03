import React from "react";
import {
  GlobalOutlined,
  WechatOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons";

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest dark:bg-inverse-surface border-t border-outline-variant/20">
      <div className="max-w-container-max mx-auto px-margin-desktop py-16 grid grid-cols-1 md:grid-cols-4 gap-gutter">
        <div className="col-span-1 md:col-span-1 space-y-6">
          <div className="text-headline-md font-headline-md font-bold text-primary dark:text-inverse-primary">
            NETBUS
          </div>
          <p className="text-body-md text-on-surface-variant dark:text-secondary-fixed-dim">
            Vận tải hành khách NetBus chuyên tuyến Miền Bắc . Vì một tương lai xanh.
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
                Điều khoản NetBus
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
              <span>123 Trịnh Văn Bô Nam Từ Liêm Hà Nội</span>
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
        <p>© 2026 NETBUS. Bảo lưu mọi quyền. Hướng tới một tương lai xanh hơn.</p>
        <div className="flex gap-6">
          {/* <span>Trực tuyến: 25</span>
          <span>Tổng truy cập: 101,088</span> */}
        </div>
      </div>
    </footer>
  );
}
