import {Button,Form,Select,Input,Card,InputNumber} from "antd";
import {useState} from "react";
import {useCRUD} from "../../../hooks/useCRUD";
function BookingAddPage(){
 const [form]=Form.useForm();
 const {list:users} = useCRUD("tk");
 const {list:trips} = useCRUD("trip");
 const {Add} = useCRUD("booking");
 const [price,setPrice] = useState(0);
 const [total,setTotal] = useState(0);
 const changeTrip=(id:string)=>{
   const trip = trips.find(
    (x:any)=>x._id===id
   );
   if(trip){
    setPrice(
      trip.journey?.price || 0
    );
   }
 }
 const changeSeat=(e:any)=>{
   const seats =
   e.target.value
   .split(",")
   .filter((x:string)=>x.trim());
   setTotal(
    seats.length * price
   );
 }
 const onFinish=(values:any)=>{
  Add({
    user:values.user,
    trip:values.trip,
    seats:
    values.seats
    .split(",")
    .map((x:string)=>x.trim()),
    totalPrice:total,
    status:"Chờ xác nhận"
  });
 }
return (
<div className="p-6">
<Card title="Thêm đơn đặt vé">
<Form
form={form}
layout="vertical"
onFinish={onFinish}
>
<Form.Item
label="Khách hàng"
name="user"
>
<Select
placeholder="Chọn khách hàng"
>
{
users.map((u:any)=>(
<Select.Option
key={u._id}
value={u._id}
>
{u.username}
</Select.Option>
))
}
</Select>
</Form.Item>
<Form.Item
label="Chuyến xe"
name="trip"
>
<Select
onChange={changeTrip}
placeholder="Chọn chuyến"
>
{
trips.map((t:any)=>(
<Select.Option
key={t._id}
value={t._id}
>
{t.journey?.diemDi}
 →
{t.journey?.diemDen}
(
{t.journey?.price?.toLocaleString("vi-VN")}đ
)
</Select.Option>
))
}
</Select>
</Form.Item>
<Form.Item
label="Ghế"
name="seats"
>
<Input
placeholder="VD: A1,A2"
onChange={changeSeat}
/>
</Form.Item>
<Form.Item
label="Tổng tiền"
>
<InputNumber
value={total}
disabled
className="w-full"
/>
</Form.Item>
<Button
type="primary"
htmlType="submit"
>
Đặt vé
</Button>
</Form>
</Card>
</div>
)
}
export default BookingAddPage;