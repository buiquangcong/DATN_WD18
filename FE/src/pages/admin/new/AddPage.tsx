import {Button,Form,Input,Select,Card,} from "antd";
import { useCRUD } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";

const { TextArea } = Input;

function NewsAddPage() {
  const { Add } = useCRUD("news");
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Thêm bài viết
        </h1>

        <p className="text-gray-500">
          Nhập đầy đủ thông tin bài viết
        </p>
      </div>

      <Card className="shadow-sm">
        <Form
          layout="vertical"
          onFinish={(values) => Add(values)}
          initialValues={{
            status: "Hiển thị",
            category: "Tin tức",
            author: "NetBus",
          }}
        >
          <Form.Item
            label="Tiêu đề"
            name="title"
            rules={[
              {
                required: true,
                message: "Nhập tiêu đề",
              },
            ]}
          >
            <Input
              size="large"
              placeholder="Nhập tiêu đề bài viết"
            />
          </Form.Item>

          <Form.Item
            label="Ảnh"
            name="image"
            rules={[
              {
                required: true,
                message: "Nhập link ảnh",
              },
            ]}
          >
            <Input
              size="large"
              placeholder="https://..."
            />
          </Form.Item>

          <Form.Item
            label="Mô tả ngắn"
            name="shortDescription"
            rules={[
              {
                required: true,
                message: "Nhập mô tả",
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập mô tả ngắn"
            />
          </Form.Item>

          <Form.Item
            label="Nội dung"
            name="content"
            rules={[
              {
                required: true,
                message: "Nhập nội dung",
              },
            ]}
          >
            <TextArea
              rows={12}
              placeholder="Nhập toàn bộ nội dung bài viết..."
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-5">
            <Form.Item
              label="Danh mục"
              name="category"
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Tác giả"
              name="author"
            >
              <Input />
            </Form.Item>
          </div>

          <Form.Item
            label="Trạng thái"
            name="status"
          >
            <Select
              options={[
                {
                  value: "Hiển thị",
                  label: "Hiển thị",
                },
                {
                  value: "Ẩn",
                  label: "Ẩn",
                },
              ]}
            />
          </Form.Item>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() =>
                navigate("/admin/tintuc/list")
              }
            >
              Hủy
            </Button>

            <Button
              type="primary"
              htmlType="submit"
            >
              Thêm bài viết
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default NewsAddPage;