import {Button,Form,Input,Select,Card,} from "antd";
import { useEffect } from "react";
import {useNavigate,useParams,} from "react-router-dom";
import {useCRUD,useDetail,} from "../../../hooks/useCRUD";
const { TextArea } = Input;
function NewsEditPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const { Edit } = useCRUD("news");
  const { data, isLoading } = useDetail("news",id);
  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        title: data.title,
        image: data.image,
        shortDescription:
        data.shortDescription,
        content: data.content,
        category: data.category,
        author: data.author,
        status: data.status,
      });
    }
  }, [data, form]);

  const onFinish = (values: any) => {
    Edit({
      ...values,
      _id: id,
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Sửa bài viết
        </h1>

        <p className="text-gray-500">
          Cập nhật thông tin bài viết
        </p>
      </div>

      <Card className="shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
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
              placeholder="Nhập tiêu đề"
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
            <TextArea rows={4} />
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
            <TextArea rows={12} />
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
                navigate(
                  "/admin/tintuc/list"
                )
              }
            >
              Hủy
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
            >
              Cập nhật
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default NewsEditPage;