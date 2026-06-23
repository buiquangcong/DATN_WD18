import {
  Button,
  Form,
  InputNumber,
  Select,
  Card
} from "antd";

import {
  useNavigate
} from "react-router-dom";

import {
  useCRUD
} from "../../../hooks/useCRUD";


function FareRuleAddPage(){


  const navigate = useNavigate();



  // lấy danh sách tuyến
  const {
    list: journeys
  } = useCRUD("journey");



  // thêm giá vé
  const {
    Add
  } = useCRUD("giave");



  const [form] = Form.useForm();




  const onFinish = (values:any)=>{


    Add(values);


  };



  return (

    <div className="p-6">


      <Card>

        <h1 className="text-2xl font-semibold mb-6">
          Thêm giá vé
        </h1>



        <Form

          form={form}

          layout="vertical"

          onFinish={onFinish}

        >



          <Form.Item

            label="Tuyến đường"

            name="journey"

            rules={[
              {
                required:true,
                message:"Chọn tuyến đường"
              }
            ]}

          >


            <Select

              placeholder="Chọn tuyến"

            >


              {
                journeys?.map((item:any)=>(

                  <Select.Option

                    key={item._id}

                    value={item._id}

                  >

                    {item.diemDi} → {item.diemDen}

                  </Select.Option>

                ))
              }


            </Select>


          </Form.Item>





          <Form.Item

            label="Sức chứa"

            name="capacity"

            rules={[
              {
                required:true
              }
            ]}

          >

            <InputNumber

              className="w-full"

              min={1}

            />


          </Form.Item>





          <Form.Item

            label="Giá ngày thường"

            name="weekdayPrice"

            rules={[
              {
                required:true
              }
            ]}

          >

            <InputNumber

              className="w-full"

              min={0}

            />


          </Form.Item>





          <Form.Item

            label="Giá cuối tuần"

            name="weekendPrice"

          >

            <InputNumber

              className="w-full"

              min={0}

            />


          </Form.Item>





          <Form.Item

            label="Giá ngày lễ"

            name="holidayPrice"

          >

            <InputNumber

              className="w-full"

              min={0}

            />


          </Form.Item>




          <Button

            type="primary"

            htmlType="submit"

          >

            Thêm

          </Button>



        </Form>


      </Card>


    </div>

  );

}


export default FareRuleAddPage;