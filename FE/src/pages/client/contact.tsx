import React, { useState } from "react";
import { Typography, Row, Col, Card, Input, Button, Space, Form, Select,} from "antd";
import { EnvironmentOutlined, PhoneOutlined, SearchOutlined, MailOutlined, } from "@ant-design/icons";
import { ClientLayout } from "./layout";


const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const offices = [
  {
    city: "Hà Nội",
    name: "Bến xe Giáp Bát",
    phone: "0984.38.76.76",
    address: "Quận Hoàng Mai, Hà Nội",
    map: "https://maps.app.goo.gl/cK3Wd38z6o6uJ11M7",
  },
  {
    city: "Hà Nội",
    name: "Văn phòng Mỹ Đình",
    phone: "0984.38.76.76",
    address: "172 Trần Bình, Phường Cầu Giấy, TP Hà Nội",
    map: "https://maps.app.goo.gl/rt2Mauu9GcBZmgyE8",
  },
  {
    city: "Hà Nội",
    name: "Bến xe Gia Lâm",
    phone: "096.343.1133",
    address: "Quận Long Biên, Hà Nội",
    map: "https://maps.app.goo.gl/c5vV8t8J7GvJ11M7",
  },
];

export default function Contact() {
  const [search, setSearch] = useState("");

  const filtered = offices.filter((o) =>
    `${o.name} ${o.city} ${o.address}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <ClientLayout>
    <div style={{ padding: 24 }}>

      <div
        style={{
          background: "#1677ff",
          color: "#fff",
          padding: 40,
          borderRadius: 12,
          marginBottom: 32,
        }}
      >
        <Title level={2} style={{ color: "#fff" }}>
          Hệ thống văn phòng toàn cầu của chúng tôi
        </Title>
        <Paragraph style={{ color: "#fff", maxWidth: 600 }}>
          Tìm một trung tâm NETBUS gần bạn. Từ hỗ trợ bán vé đến logistics hàng hóa,
          mạng lưới rộng khắp của chúng tôi đảm bảo bạn sẽ không bao giờ ở xa dịch vụ của chúng tôi.
        </Paragraph>

        <Input
          size="large"
          placeholder="Tìm kiếm theo thành phố, tỉnh hoặc tên văn phòng..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 500 }}
        />
      </div>


      <Title level={3} style={{ marginBottom: 24 }}>
        Địa điểm các chi nhánh
      </Title>

      <Row gutter={[24, 24]}>
        {filtered.map((office, index) => (
          <Col xs={24} md={12} lg={8} key={index}>
            <Card hoverable style={{ height: "100%" }}>
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Space align="center">
                  <EnvironmentOutlined style={{ color: "#1677ff", fontSize: 20 }} />
                  <Title level={4} style={{ margin: 0 }}>
                    {office.name}
                  </Title>
                </Space>

                <Space align="start">
                  <PhoneOutlined style={{ color: "#1677ff", marginTop: 4 }} />
                  <Text>{office.phone}</Text>
                </Space>

                <Space align="start">
                  <EnvironmentOutlined style={{ color: "#1677ff", marginTop: 4 }} />
                  <Text>{office.address}</Text>
                </Space>

                <Button type="primary" block href={office.map} target="_blank">
                  Xem trên bản đồ
                </Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
    </ClientLayout>
  );
}