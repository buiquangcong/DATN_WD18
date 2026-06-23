import {
  Popconfirm,
  Space,
  Table,
  Button,
  Tag,
} from "antd";

import { useCRUD } from "../../../hooks/useCRUD";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";


interface JourneyType {
  _id: string;
  diemDi: string;
  diemDen: string;
}


interface FareRuleType {

  _id: string;

  journey: JourneyType;

  capacity: number;

  weekdayPrice: number;

  weekendPrice: number;

  holidayPrice: number;

  createdAt: string;

}



function FareRuleListPage() {


  const navigate = useNavigate();


  const {
    list,
    Delete
  } = useCRUD("giave");



  const columns: ColumnsType<FareRuleType> = [

    {
      title:"Tuyến đường",
      dataIndex:"journey",
      key:"journey",

      render:(journey:JourneyType)=>(

        <strong className="text-gray-800">

          {journey?.diemDi} → {journey?.diemDen}

        </strong>

      )
    },



    {
      title:"Sức chứa",

      dataIndex:"capacity",

      key:"capacity",

      render:(capacity:number)=>(

        <Tag color="blue">

          {capacity} chỗ

        </Tag>

      )

    },



    {
      title:"Giá ngày thường",

      dataIndex:"weekdayPrice",

      key:"weekdayPrice",

      render:(price:number)=>(

        <span className="text-gray-600">

          {Number(price).toLocaleString("vi-VN")} đ

        </span>

      )

    },



    {
      title:"Giá cuối tuần",

      dataIndex:"weekendPrice",

      key:"weekendPrice",

      render:(price:number)=>(

        <span className="text-gray-600">

          {Number(price).toLocaleString("vi-VN")} đ

        </span>

      )

    },



    {
      title:"Giá ngày lễ",

      dataIndex:"holidayPrice",

      key:"holidayPrice",

      render:(price:number)=>(

        <span className="text-red-500 font-medium">

          {Number(price).toLocaleString("vi-VN")} đ

        </span>

      )

    },



    {
      title:"Ngày tạo",

      dataIndex:"createdAt",

      key:"createdAt",

      render:(date:string)=>(

        <span className="text-gray-500">

          {new Date(date).toLocaleDateString("vi-VN")}

        </span>

      )

    },



    {
      title:"Hành Động",

      key:"action",


      render:(_,record)=>(

        <Space>


          <Button

            type="primary"

            onClick={()=>navigate(
              `/admin/giave/edit/${record._id}`
            )}

          >

            Sửa

          </Button>




          <Popconfirm

            title="Xóa giá vé này?"

            description="Bạn có chắc muốn xóa?"

            onConfirm={()=>
              Delete(record._id)
            }

            okText="Có"

            cancelText="Không"

            okButtonProps={{
              danger:true
            }}

          >


            <Button

              type="primary"

              danger

            >

              Xóa

            </Button>


          </Popconfirm>


        </Space>

      )

    }


  ];




  return (


    <div className="p-6">



      <div className="flex justify-between items-center mb-6">


        <h1 className="text-2xl font-semibold text-gray-800">

          Quản Lý Giá Vé

        </h1>



        <Button

          type="primary"

          size="large"

          onClick={()=>
            navigate("/admin/giave/add")
          }

        >

          Thêm Quy Tắc Giá

        </Button>


      </div>





      <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-100">


        <Table


          columns={columns}


          dataSource={list}


          rowKey="_id"


          pagination={{

            pageSize:10,

            showSizeChanger:true

          }}


        />


      </div>



    </div>


  );

}


export default FareRuleListPage;