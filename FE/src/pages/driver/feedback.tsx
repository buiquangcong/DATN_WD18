import React, { useState } from "react";
import { Row, Col, Card, Typography, Form, Input, Button, Rate, Tag, message, } from "antd";
import { CarOutlined, StarOutlined, EnvironmentOutlined, FileTextOutlined, SendOutlined, } from "@ant-design/icons";
import { ClientLayout } from "./layout";


const { Title, Text } = Typography;
const { TextArea } = Input;

export default function Feedback() {
  const [loading, setLoading] = useState(false);

  const onFinish = (values: any) => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      console.log(values);
      message.success("Phản hồi đã được gửi thành công!");
    }, 1500);
  };

  return (
    <ClientLayout>
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <div className="mb-8">
        <Button type="link">
          ← Quay lại Dashboard
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {/* LEFT */}
        <Col xs={24} lg={8}>
          <Card className="shadow-sm rounded-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CarOutlined
                  style={{
                    fontSize: 24,
                    color: "#166e00",
                  }}
                />
              </div>

              <div>
                <Title level={4} className="!mb-0">
                  Trip Feedback
                </Title>
                <Text type="secondary">
                  Driver Portal v4.2
                </Text>
              </div>
            </div>

            <div className="border-t pt-5 space-y-4">
              <div>
                <Text type="secondary">
                  TRIP ID
                </Text>

                <p className="font-semibold">
                  NB-4092-TX
                </p>
              </div>

              <div>
                <Text type="secondary">
                  ROUTE
                </Text>

                <p className="font-semibold">
                  Austin Central → Houston
                  Intermodal
                </p>
              </div>

              <div>
                <Text type="secondary">
                  DATE & TIME
                </Text>

                <p>
                  Oct 24, 2024 • 08:30 AM -
                  11:45 AM
                </p>
              </div>

              <Tag color="green">
                Electric Fleet (Bus #E-102)
              </Tag>
            </div>
          </Card>

          <Card
            className="mt-6 overflow-hidden"
            bodyStyle={{ padding: 0 }}
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdElIPFTRQViv9rqV9h87X0o3Mia_BGSUeu8e8b5uzHR6cYOyX9gTU2dZyJJx-k_IRySpOXz0ZcUOZCW0o4E7Ov-Mg9fmx3SpT1BhTgMnTQ4ak5sL_1HfqO1u9_9Nzv7xHjTu0qWz2oXccufyaLHf2K3daJBI1ofnX0seGUyS0xAwqRmhWPQKaP7ZaSGaBltUI4HK9pZ47H5zRQ8GCdu9TplT5L85tpu8TZvu3fDt-Hyq5z-B2K39RL4I2nzPponD_mOjfD65KSr4"
              alt=""
              className="w-full h-[220px] object-cover"
            />
          </Card>
        </Col>

        {/* RIGHT */}
        <Col xs={24} lg={16}>
          <Card className="shadow-sm rounded-xl">
            <Form
              layout="vertical"
              onFinish={onFinish}
            >
              <div className="mb-8">
                <Title
                  level={4}
                  className="!mb-2"
                >
                  <StarOutlined /> Đánh giá
                  chuyến đi
                </Title>

                <Text type="secondary">
                  Đánh giá tổng thể về trải
                  nghiệm chuyến đi.
                </Text>

                <div className="mt-4">
                  <Form.Item
                    name="rating"
                    rules={[
                      {
                        required: true,
                        message:
                          "Vui lòng đánh giá",
                      },
                    ]}
                  >
                    <Rate />
                  </Form.Item>
                </div>
              </div>

              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <>
                        <CarOutlined /> Tình
                        trạng xe
                      </>
                    }
                    name="vehicleCondition"
                  >
                    <TextArea
                      rows={5}
                      placeholder="Báo cáo tình trạng xe..."
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <>
                        <EnvironmentOutlined />{" "}
                        Vấn đề tuyến đường
                      </>
                    }
                    name="routeIssue"
                  >
                    <TextArea
                      rows={5}
                      placeholder="Kẹt xe, công trình..."
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={
                  <>
                    <FileTextOutlined /> Ghi
                    chú chung
                  </>
                }
                name="note"
              >
                <TextArea
                  rows={6}
                  placeholder="Ý kiến, phản hồi của hành khách..."
                />
              </Form.Item>

              <div className="border-t pt-6 flex justify-end">
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={loading}
                  icon={<SendOutlined />}
                  className="!rounded-full !px-10"
                >
                  Gửi phản hồi
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
    </ClientLayout>
  );
}