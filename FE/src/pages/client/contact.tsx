import React, { useState } from "react";
import { Typography, Row, Col, Card, Input, Button, Space, Form, Select,} from "antd";
import { EnvironmentOutlined, PhoneOutlined, SearchOutlined, MailOutlined, } from "@ant-design/icons";
import { ClientLayout } from "./layout";


const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const offices = [
  {
    city: "Hà Tĩnh",
    name: "Bến xe Hà Tĩnh",
    phone: "02393.76.76.76",
    address: "Thôn Bắc Thượng, P. Hà Huy Tập, Hà Tĩnh",
    map: "https://maps.app.goo.gl/XhpmymVaGWbp4eJ16",
  },
  {
    city: "Hà Nội",
    name: "Văn phòng Mỹ Đình",
    phone: "0984.38.76.76",
    address: "172 Trần Bình, Phường Cầu Giấy, TP Hà Nội",
    map: "https://maps.app.goo.gl/rt2Mauu9GcBZmgyE8",
  },
  {
    city: "Nghệ An",
    name: "Bến xe Phía Đông",
    phone: "02383.579.579",
    address: "QL46, Khối 3, Phường Vinh Phú, Tỉnh Nghệ An",
    map: "https://maps.app.goo.gl/Ky6RgwC9DYuNerRM7",
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
          Our Global Office Network
        </Title>
        <Paragraph style={{ color: "#fff", maxWidth: 600 }}>
          Find a NETBUS hub near you. From ticketing support to cargo logistics,
          our widespread network ensures you're never far from our service.
        </Paragraph>

        <Input
          size="large"
          placeholder="Search by city, province, or office name..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 500 }}
        />
      </div>


      <Title level={3} style={{ marginBottom: 24 }}>
        Branch Locations
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
                  View on Map
                </Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>


      <div style={{ marginTop: 64 }}>
        <Row gutter={[32, 32]} align="top">
          <Col xs={24} lg={12}>
            <Title level={3}>Get in Touch</Title>
            <Paragraph>
              Have questions about our routes, corporate services, or sustainability initiatives?
            </Paragraph>

            <Space direction="vertical" size="large">
              <Space align="start">
                <PhoneOutlined style={{ color: "#1677ff", fontSize: 22, marginTop: 4 }} />
                <div>
                  <Text strong>Customer Hotline</Text>
                  <Title level={4} style={{ margin: 0 }}>1900 6467</Title>
                </div>
              </Space>

              <Space align="start">
                <MailOutlined style={{ color: "#1677ff", fontSize: 22, marginTop: 4 }} />
                <div>
                  <Text strong>Email Address</Text>
                  <Paragraph style={{ margin: 0 }}>support@netbus.com.vn</Paragraph>
                </div>
              </Space>
            </Space>
          </Col>

          <Col xs={24} lg={12}>
            <Card>
              <Form layout="vertical">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Full Name">
                      <Input placeholder="John Doe" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Phone Number">
                      <Input placeholder="+84 ..." />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Subject">
                  <Select
                    options={[
                      { value: "route", label: "Route Inquiry" },
                      { value: "ticket", label: "Ticket Support" },
                      { value: "partner", label: "Corporate Partnership" },
                      { value: "feedback", label: "Feedback & Suggestions" },
                    ]}
                  />
                </Form.Item>

                <Form.Item label="Message">
                  <TextArea rows={4} placeholder="How can we help you today?" />
                </Form.Item>

                <Button type="primary" size="large" block>
                  Send Message
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
    </ClientLayout>
  );
}