import {Button,Form,InputNumber,Select,} from "antd";
import { useCRUD} from "../../../hooks/useCRUD";
import {useParams,useNavigate} from "react-router-dom";
import {useEffect} from "react";
function FareRuleEditPage(){
  const { id } = useParams();
  const navigate = useNavigate();
  const {Edit,list} = useCRUD("giave");
  const {list: journeys} = useCRUD("journey");
  const [form] = Form.useForm();
  useEffect(()=>{
    const record = list?.find(
      (item:any)=>item._id === id
    );
    if(record){
      form.setFieldsValue({
        journey: record.journey?._id || record.journey,
        capacity: record.capacity,
        weekdayPrice: record.weekdayPrice,
        weekendPrice: record.weekendPrice,
        holidayPrice: record.holidayPrice
      });
    }
  },[list,id]);
  const onFinish=(values:any)=>{
    Edit({
     _id:id,
      ...values
    });
    navigate("/admin/fare-rule");
  };
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">
        Chỉnh Sửa Giá Vé
      </h1>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="Tuyến Đường"
          name="journey"
          rules={[
            {
              required:true,
              message:"Vui lòng chọn tuyến đường"
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
          label="Sức Chứa"
          name="capacity"
          rules={[
            {
              required:true,
              message:"Nhập sức chứa"
            }
          ]}
        >
          <InputNumber
            className="w-full"
            min={1}
            placeholder="VD: 45"
          />

        </Form.Item>

        <Form.Item
          label="Giá Ngày Thường"
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
          label="Giá Cuối Tuần"
          name="weekendPrice"
        >
          <InputNumber
            className="w-full"
            min={0}
          />
        </Form.Item>

        <Form.Item
          label="Giá Ngày Lễ"
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
          Lưu Thay Đổi
        </Button>
      </Form>
    </div>
  );
}
export default FareRuleEditPage;