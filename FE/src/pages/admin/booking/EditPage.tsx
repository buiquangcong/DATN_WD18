import {Button,Form,Input,Select,InputNumber,Card}from "antd";
import {useNavigate,useParams}from "react-router-dom";
import {useCRUD,useDetail}from "../../../hooks/useCRUD";
import {useEffect}from "react";
function BookingEditPage(){
 const navigate = useNavigate();
 const {id}=useParams();
 const {Edit}=useCRUD("booking");
 const { data:booking}=useDetail("booking",id);
 const [form]=Form.useForm();
 useEffect(()=>{
   if(booking){
    form.setFieldsValue({
      user:
      booking.user?._id,
      trip:
      booking.trip?._id,
      seats:
      booking.seats?.join(","),
      totalPrice:
      booking.totalPrice,
      status:
      booking.status
    })
   }
 },[booking]);
 const onFinish=async(values:any)=>{

  if(!id){
    return;
  }
  await Edit({
    id:id,
    ...values,
    seats:
    values.seats
    .split(",")
    .map((x:string)=>x.trim())

  });
  navigate("/admin/booking/list");
}
 return (
<div className="p-6">
<Card title="Sửa đơn đặt vé">
<Form
form={form}
layout="vertical"
onFinish={onFinish}
>
<Form.Item
label="ID khách hàng"
name="user"
>
<Input/>
</Form.Item>
<Form.Item
label="ID chuyến xe"
name="trip"
>
<Input/>
</Form.Item>
<Form.Item
label="Ghế"
name="seats"
>
<Input/>
</Form.Item>
<Form.Item
label="Tổng tiền"
name="totalPrice"
>
<InputNumber
className="w-full"
/>
</Form.Item>
<Form.Item
label="Trạng thái"
name="status"
>
<Select>
<Select.Option value="Chờ xác nhận">
Chờ xác nhận
</Select.Option>
<Select.Option value="Đã xác nhận">
Đã xác nhận
</Select.Option>
<Select.Option value="Đã huỷ">
Đã huỷ
</Select.Option>
<Select.Option value="Hoàn thành">
Hoàn thành
</Select.Option>
</Select>
</Form.Item>
<Button
type="primary"
htmlType="submit"
>
Lưu
</Button>
<Button
className="ml-3"
onClick={()=>navigate(-1)}
>
Huỷ
</Button>
</Form>
</Card>
</div>
 )
}
export default BookingEditPage;