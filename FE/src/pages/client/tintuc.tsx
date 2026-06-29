import { Spin, Pagination } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "./layout";

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

const PAGE_SIZE = 9;

function TinTucPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/news")
      .then((res) => setNews(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <ClientLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Spin size="large" />
        </div>
      </ClientLayout>
    );

  if (news.length === 0)
    return (
      <ClientLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-xl text-gray-400">Chưa có bài viết nào</p>
        </div>
      </ClientLayout>
    );

  const paginated = news.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <ClientLayout>
      <div className="max-w-7xl mx-auto px-5 py-10">

        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 bg-yellow-400 rounded-full" />
          <h1 className="text-2xl font-extrabold text-gray-900 uppercase tracking-wide">
            Tin tức
          </h1>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginated.map((item) => (
            <div
              key={item._id}
              className="group flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/khachhang/tintuc/${item._id}`)}
            >
              {/* Thumbnail */}
              <div className="overflow-hidden relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-yellow-400 text-gray-900 text-[10px] font-bold uppercase px-2 py-1 rounded">
                  {item.category}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-4">
                <p className="text-xs text-gray-400 mb-2">
                  {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                </p>
                <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 leading-snug group-hover:text-yellow-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-xs line-clamp-3 flex-1">
                  {item.shortDescription}
                </p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  <span>👁 {item.views} lượt xem</span>
                  <span className="text-yellow-500 font-semibold group-hover:underline">
                    Xem thêm →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {news.length > PAGE_SIZE && (
          <div className="flex justify-center mt-10">
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={news.length}
              onChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              showSizeChanger={false}
            />
          </div>
        )}

      </div>
    </ClientLayout>
  );
}

export default TinTucPage;
