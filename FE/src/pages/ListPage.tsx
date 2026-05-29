import { Popconfirm, Space, Table, Button } from "antd";
import { useCRUD } from "../hooks/useCRUD";
import { useNavigate } from "react-router-dom";

function ListPage() {
  const navigate = useNavigate()
  const {list, Delete } = useCRUD()

  const columns = [
    {
      title: "ho va ten",
      dataIndex: "fullName"
    },
    {
      title: "tuoi",
      dataIndex: "age"
    },
    {
      title: "dia chi",
      dataIndex: "address"
    },
    {
      title: "email",
      dataIndex: "email"
    },
    {
      title: "trang thai",
      dataIndex: "active"
    },
    {
      title: "hanh dong",
      render:(record: any) => (
        <Space>
        <Popconfirm 
        title="xoa"
        description="ban co chac chan muon xoa"
        onConfirm={() => Delete(record.id)}
        okText="co"
        cancelText="khong"
        >
          <Button type="primary" danger>xoa</Button>
        </Popconfirm>
        <Button type="primary" onClick={() => navigate(`/edit/${record.id}`)} >sua</Button>
        </Space>
      )
    },
  ]
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Danh sách</h1>

      <div className="overflow-x-auto">
        <Table columns={columns} dataSource={list} />
      </div>
    </div>
  );
}

export default ListPage;
