import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Card, Tag, Button, Spin, Divider } from "antd";
import { ArrowLeftOutlined, EyeOutlined } from "@ant-design/icons";

interface News {
  _id: string;
  title: string;
  image: string;
  shortDescription: string;
  content: string;
  author: string;
  category: string;
  status: string;
  views: number;
  createdAt: string;
}

function ChiTietTinTucPage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [news, setNews] = useState<News | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/news/${id}`)
      .then((res) => {
        setNews(res.data);
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[500px]">
        <Spin size="large" />
      </div>
    );

  if (!news)
    return (
      <div className="text-center py-20">
        Không tìm thấy bài viết
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto py-10 px-5">

      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/khachhang/tintuc")}
        className="mb-6"
      >
        Quay lại
      </Button>

      <Card className="shadow-lg rounded-xl">

        <img
          src={news.image}
          alt={news.title}
          className="w-full h-[500px] object-cover rounded-xl"
        />

        <div className="mt-6">

          <Tag color="blue">{news.category}</Tag>

          <Tag color="green">{news.status}</Tag>

          <h1 className="text-4xl font-bold mt-4">
            {news.title}
          </h1>

          <div className="flex gap-6 text-gray-500 mt-4">

            <span>
              👤 {news.author}
            </span>

            <span>
              📅{" "}
              {new Date(news.createdAt).toLocaleDateString(
                "vi-VN"
              )}
            </span>

            <span>
              <EyeOutlined /> {news.views}
            </span>

          </div>

          <Divider />

          <h2 className="text-xl font-semibold mb-3">
            Mô tả
          </h2>

          <p className="text-gray-700 leading-8">
            {news.shortDescription}
          </p>

          <Divider />

          <h2 className="text-xl font-semibold mb-3">
            Nội dung
          </h2>

          <div
            className="leading-9 text-[17px] text-gray-800"
            style={{
              whiteSpace: "pre-wrap",
            }}
          >
            {news.content}
          </div>

        </div>

      </Card>

    </div>
  );
}

export default ChiTietTinTucPage;