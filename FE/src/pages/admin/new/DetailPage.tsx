import {
  Card,
  Image,
  Tag,
  Button,
  Space,
  Divider,
  Typography,
  Descriptions,
} from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useDetail } from "../../../hooks/useCRUD";

const { Title, Paragraph } = Typography;

function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useDetail("news", id);

  if (isLoading) {
    return (
      <div className="p-6">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">

      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/admin/news/list")}
        className="mb-5"
      >
        Quay lại
      </Button>

      <Card
        className="shadow-lg rounded-xl"
        bordered={false}
      >
        <Image
          src={data.image}
          width="100%"
          style={{
            borderRadius: 12,
            maxHeight: 450,
            objectFit: "cover",
          }}
        />

        <div className="mt-6">

          <Space className="mb-4">
            <Tag color="blue">
              {data.category}
            </Tag>

            <Tag
              color={
                data.status === "Hiển thị"
                  ? "green"
                  : "red"
              }
            >
              {data.status}
            </Tag>
          </Space>

          <Title level={2}>
            {data.title}
          </Title>

          <Descriptions
            bordered
            column={3}
            className="mt-5"
          >
            <Descriptions.Item
              label={
                <>
                  <UserOutlined /> Tác giả
                </>
              }
            >
              {data.author}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <>
                  <EyeOutlined /> Lượt xem
                </>
              }
            >
              {data.views}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <>
                  <CalendarOutlined /> Ngày tạo
                </>
              }
            >
              {new Date(
                data.createdAt
              ).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Card
            title="Mô tả ngắn"
            className="mb-5"
          >
            <Paragraph
              style={{
                fontSize: 16,
                lineHeight: 1.8,
              }}
            >
              {data.shortDescription}
            </Paragraph>
          </Card>

          <Card title="Nội dung">
            <Paragraph
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 16,
                lineHeight: 2,
              }}
            >
              {data.content}
            </Paragraph>
          </Card>
        </div>
      </Card>
    </div>
  );
}

export default DetailPage;