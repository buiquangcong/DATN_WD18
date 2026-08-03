import React, { useState, useEffect, useRef } from "react";
import { Form, DatePicker, Select, Button, Tag, Card, Statistic, Row, Col, message } from "antd";
import {
 EnvironmentOutlined,
 SearchOutlined,
 ArrowRightOutlined,
 TrophyOutlined,
 TeamOutlined,
 CarOutlined,
 CompassOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { ClientLayout } from "./layout";
import { useNavigate } from "react-router-dom";
import axios from "axios";


interface BookingFormValues {
 origin: string;
 destination: string;
 departureDate?: dayjs.Dayjs;
 returnDate?: dayjs.Dayjs;
}


interface PopularRoute {
 diemDi: string;
 diemDen: string;
 thoiGianDiChuyen: string;
 price: number;
 busType: string;
 count: number;
}


export default function ClientDashboard() {
 const [tripType, setTripType] = useState<"one-way" | "round-trip">("one-way");
 const [selectedFleetTag, setSelectedFleetTag] = useState("VIP 21 Cabin");
 const navigate = useNavigate();


 const [departures, setDepartures] = useState<string[]>([]);
 const [destinations, setDestinations] = useState<string[]>([]);
 const [popularRoutes, setPopularRoutes] = useState<PopularRoute[]>([]);


 // Refs for Scroll Reveal animation
 const sectionsRef = useRef<HTMLElement[]>([]);


 useEffect(() => {
   const fetchUniqueRoutes = async () => {
     try {
       const response = await axios.get("http://localhost:3000/api/trip");
       let data: any[] = [];
       if (response.data && "data" in response.data && Array.isArray(response.data.data)) {
         data = response.data.data;
       } else if (Array.isArray(response.data)) {
         data = response.data;
       }

       data = data.filter((t: any) => t.status === "sắp chạy");


       const uniqueDepartures = Array.from(new Set(data.map((t: any) => t.journey?.diemDi).filter(Boolean))) as string[];
       const uniqueDestinations = Array.from(new Set(data.map((t: any) => t.journey?.diemDen).filter(Boolean))) as string[];


       if (uniqueDepartures.length > 0) setDepartures(uniqueDepartures);
       if (uniqueDestinations.length > 0) setDestinations(uniqueDestinations);


       const getTicketPrice = (item: any):  number => {
         if (!item.departureTime) return item.journey?.price || item.price || 0;
         const departureDate = new Date(item.departureTime);
         if (item.fareRule) {
           if (departureDate.getDay() === 0 || departureDate.getDay() === 6) {
             return item.fareRule.weekendPrice;
           } else {
             return item.fareRule.weekdayPrice;
           }
         }
         return item.journey?.price || item.price || 0;
       };


       const routeMap = new Map<string, PopularRoute>();
       data.forEach((t: any) => {
         if (!t.journey?.diemDi || !t.journey?.diemDen) return;
         const key = `${t.journey.diemDi} - ${t.journey.diemDen}`;
         if (routeMap.has(key)) {
           routeMap.get(key)!.count += 1;
         } else {
           routeMap.set(key, {
             diemDi: t.journey.diemDi,
             diemDen: t.journey.diemDen,
             thoiGianDiChuyen: t.journey.thoiGianDiChuyen || "Không rõ",
             price: getTicketPrice(t),
             busType: t.bus?.type || "Ghế ngồi",
             count: 1
           });
         }
       });
       const sortedRoutes = Array.from(routeMap.values())
         .sort((a, b) => b.count - a.count)
         .slice(0, 3);
       setPopularRoutes(sortedRoutes);
     } catch (err) {
       console.error("Lỗi lấy thông tin tuyến đường cho trang chủ:", err);
     }
   };
   fetchUniqueRoutes();
 }, []);


 useEffect(() => {
   const observerOptions = {
     threshold: 0.1,
   };


   const observer = new IntersectionObserver((entries) => {
     entries.forEach((entry) => {
       if (entry.isIntersecting) {
         entry.target.classList.add("opacity-100", "translate-y-0");
         entry.target.classList.remove("opacity-0", "translate-y-10");
       }
     });
   }, observerOptions);


   sectionsRef.current.forEach((el) => {
     if (el) {
       el.classList.add("transition-all", "duration-700", "opacity-0", "translate-y-10");
       observer.observe(el);
     }
   });


   return () => {
     observer.disconnect();
   };
 }, []);


 const handleSearch = (values: BookingFormValues) => {
   const params = new URLSearchParams();
   if (values.origin) params.append("diemDi", values.origin);
   if (values.destination) params.append("diemDen", values.destination);
   if (values.departureDate) params.append("ngayDi", values.departureDate.format("YYYY-MM-DD"));
   navigate(`/khachhang/trip?${params.toString()}`);
 };


 const handleBookNow = (route: string) => {
   message.success(`Đang mở cổng đặt vé trực tuyến cho tuyến: ${route}`);
 };


 const fleetTags = ["Dòng xe 16 chỗ", "Dòng xe 29 chỗ","Dòng xe 38 chỗ", "Dòng xe 45 chỗ"];


 const getFleetImageUrl = (tag: string): string => {
   switch (tag) {
     case "Dòng xe 45 chỗ":
       return "/xe.png";
     case "Dòng xe 38 chỗ":
      return "/netbus_student_promo.png"
     case "Dòng xe 16 chỗ":
      return "/netbus_student_promo.png"
     case "Dòng xe 29 chỗ":
      return "/netbus_student_promo.png"
     default:
       return "/netbus_student_promo.png";
   }
 };

 return (
   <ClientLayout>
     {/* Hero Section */}
     <section className="relative min-h-[85vh] flex items-center overflow-hidden">
       <div className="absolute inset-0 z-0">
         <div className="absolute inset-0 bg-black/30 z-10"></div>
         <div
           className="w-full h-full bg-cover bg-center"
           style={{
             backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDogLyFACTjy4GlXNhWooGrkixNYdFH0XQ_SFHXPCzWlydy7tTet3TAdUNJI4ulf4TYHI7hMrn09ofvV2Z1PzSKb7ju4sAUDUqPoCMTs7Q5ZZEe19mAacDs3j3SsZfPb3dX2tzRm8OzyXR3MEk0mIdrB7Z_QlbkIMCB9WX9-80s0n7z_cg1sJIsOZxGDiD6vMD1h-jn0hbawBA2YvhdjWiDvu9bQh5L0zalJF7GC0pKDKHd7G38380Aae60vD8spHuJYfTTLGspMPVZ')`,
           }}
         ></div>
       </div>
       <div className="relative z-20 max-w-container-max mx-auto px-margin-desktop w-full grid grid-cols-1 lg:grid-cols-2 gap-gutter items-center py-12">
         <div className="text-white space-y-6">
           <h1 className="text-display-lg font-display-lg leading-tight">
             Du lịch đáng tin cậy,<br />
             <span className="text-primary-fixed">Tương lai xanh.</span>
           </h1>
           <p className="text-body-lg max-w-lg opacity-90">
             Trải nghiệm thế hệ tiếp theo của du lịch bằng xe khách. Sự thoải mái, đúng giờ và bền vững được tích hợp vào mỗi hành trình
             trên khắp Việt Nam.
           </p>
         </div>


         {/* Booking Form (antd) */}
         <div className="bg-white p-8 rounded-xl shadow-2xl space-y-6 glass-effect">
           <div className="flex gap-4 border-b border-outline-variant/30 pb-4">
             <button
               type="button"
               onClick={() => setTripType("one-way")}
               className={`font-bold pb-2 transition-all cursor-pointer ${tripType === "one-way" ? "text-primary border-b-2 border-primary" : "text-secondary hover:text-primary"
                 }`}
             >
               Một chiều
             </button>
             {/* <button
               type="button"
               onClick={() => setTripType("round-trip")}
               className={`font-bold pb-2 transition-all cursor-pointer ${tripType === "round-trip" ? "text-primary border-b-2 border-primary" : "text-secondary hover:text-primary"
                 }`}
             >
               Khứ hồi
             </button> */}
           </div>


           <Form
             layout="vertical"
             onFinish={handleSearch}
             initialValues={{
               origin: undefined,
               destination: undefined,
               departureDate: dayjs(),
             }}
             className="space-y-4"
           >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Form.Item
                 name="origin"
                 label={<span className="text-label-sm uppercase tracking-wider text-secondary">Điểm đi</span>}
                 rules={[{ required: true, message: "Vui lòng nhập điểm đi!" }]}
               >
                 <Select
                   size="large"
                   showSearch
                   placeholder="Chọn điểm đi"
                   filterOption={(input, option) =>
                     (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                   }
                   suffixIcon={<EnvironmentOutlined className="text-outline" />}
                   className="w-full h-12"
                   options={departures.map(d => ({ value: d, label: d }))}
                 />
               </Form.Item>


               <Form.Item
                 name="destination"
                 label={<span className="text-label-sm uppercase tracking-wider text-secondary">Điểm đến</span>}
                 rules={[{ required: true, message: "Vui lòng chọn điểm đến!" }]}
               >
                 <Select
                   size="large"
                   showSearch
                   placeholder="Chọn điểm đến"
                   filterOption={(input, option) =>
                     (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                   }
                   suffixIcon={<CompassOutlined className="text-outline" />}
                   className="w-full h-12"
                   options={destinations.map(d => ({ value: d, label: d }))}
                 />
               </Form.Item>
             </div>


             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Form.Item
                 name="departureDate"
                 label={<span className="text-label-sm uppercase tracking-wider text-secondary">Ngày đi</span>}
                 rules={[{ required: true, message: "Vui lòng chọn ngày đi!" }]}
               >
                 <DatePicker
                   size="large"
                   className="w-full h-12 bg-[#F8FFF8] border-outline-variant"
                   format="DD/MM/YYYY"
                   disabledDate={(current) => current && current < dayjs().startOf("day")}
                 />
               </Form.Item>


               {/* {tripType === "round-trip" ? (
                 <Form.Item
                   name="returnDate"
                   label={<span className="text-label-sm uppercase tracking-wider text-secondary">Ngày về</span>}
                   rules={[{ required: true, message: "Vui lòng chọn ngày về!" }]}
                 >
                   <DatePicker
                     size="large"
                     className="w-full h-12 bg-[#F8FFF8] border-outline-variant"
                     format="DD/MM/YYYY"
                     disabledDate={(current) => current && current < dayjs().startOf("day")}
                   />
                 </Form.Item>
               ) : (
                 <div className="hidden md:block"></div>
               )} */}
             </div>


             <Form.Item className="mb-0">
               <Button
                 type="primary"
                 htmlType="submit"
                 size="large"
                 className="w-full h-14 font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                 icon={<SearchOutlined />}
               >
                 TÌM VÉ XE
               </Button>
             </Form.Item>
           </Form>
         </div>
       </div>
     </section>


     {/* Featured Routes Section */}
     <section
       ref={(el) => {
         if (el) sectionsRef.current[0] = el;
       }}
       className="py-24 bg-surface dark:bg-inverse-surface/10 px-margin-desktop"
     >
       <div className="max-w-container-max mx-auto">
         <div className="flex justify-between items-end mb-12">
           <div>
             <span className="text-primary font-bold tracking-widest uppercase text-label-sm">Chuyến đi phổ biến</span>
             <h2 className="text-headline-lg font-headline-lg mt-2 dark:text-black">Tuyến phổ biến</h2>
           </div>
           <a className="text-primary font-bold flex items-center gap-2 hover:underline" href="/khachhang/trip">
             Xem tất cả lịch trình
             <ArrowRightOutlined />
           </a>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
           {popularRoutes.length > 0 ? (
             popularRoutes.map((route, index) => {
               const getTagColor = (type: string) => {
                 if (type.toLowerCase().includes("limousine")) return "cyan";
                 if (type.toLowerCase().includes("vip")) return "green";
                 if (type.toLowerCase().includes("sleeper")) return "orange";
                 return "blue";
               };
               return (
                 <Card
                   key={index}
                   className="tonal-card bg-white dark:bg-slate-900 border border-[#E0E4E0] dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-lg transition-all h-full flex flex-col"
                   styles={{ body: { padding: 24, flex: 1, display: 'flex', flexDirection: 'column' } }}
                 >
                   <div className="space-y-4 flex flex-col h-full">
                     <div className="flex justify-between items-start">
                       <div className="space-y-1">
                         <h3 className="text-headline-md font-headline-md text-slate-900 dark:text-black">
                           {route.diemDi} <span className="text-primary mx-2">→</span> {route.diemDen}
                         </h3>
                         <p className="text-label-sm text-secondary dark:text-secondary-fixed-dim font-label-sm">
                           {route.thoiGianDiChuyen}
                         </p>
                       </div>
                       <Tag color={getTagColor(route.busType)} className="font-bold">
                         {route.busType}
                       </Tag>
                     </div>
                     <div className="flex items-center gap-2 py-2">
                       <span className="text-primary text-headline-md font-bold">
                         {route.price.toLocaleString("vi-VN")}đ
                       </span>
                     </div>
                     <div className="mt-auto pt-2">
                       <Button
                         type="primary"
                         ghost
                         size="large"
                         block
                         onClick={() => navigate(`/khachhang/trip?diemDi=${route.diemDi}&diemDen=${route.diemDen}`)}
                         className="font-bold border-2"
                       >
                         Đặt vé ngay
                       </Button>
                     </div>
                   </div>
                 </Card>
               );
             })
           ) : (
             <div className="col-span-1 md:col-span-3 text-center py-8 text-secondary">
               Không có tuyến xe phổ biến nào lúc này.
             </div>
           )}
         </div>
       </div>
     </section>


     {/* Services & Promotions Section */}
     <section
       ref={(el) => {
         if (el) sectionsRef.current[1] = el;
       }}
       className="py-24 bg-surface-container-lowest dark:bg-inverse-surface/5 px-margin-desktop overflow-hidden"
     >
       <div className="max-w-container-max mx-auto">
         <div className="text-center mb-16 space-y-4">
           <h2 className="text-headline-lg font-headline-lg dark:text-black">Dịch vụ &amp; Ưu đãi</h2>
           <p className="text-on-surface-variant dark:text-secondary-fixed-dim max-w-2xl mx-auto">
             Chúng tôi không chỉ cung cấp chuyến đi, mà còn là những trải nghiệm tiện nghi và tiết kiệm nhất cho hành khách.
           </p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
           {/* Featured Promo */}
           <div className="md:col-span-8 group relative rounded-2xl overflow-hidden h-[450px]">
             <img
               className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
               alt="Trung chuyển miễn phí tận nhà tại Hà Nội"
               src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYD-RGIYrFcxy2vqsBC2AylZyPoGVcStUrFnxHa7luse0nRHcA1NCBvzVAKSPFrX7LuUX-tIbUHVxz7niFbnLorGloj_AuYS4Ubv1-iQSkOTJqeUNiMrKlbVexll7897Ae0qDmp9Tjr5fW59m7Re0lM3tO3uiIV2_NFJ6rh6qyRkb4Y9S9HQDwra7W3p43ROK7EGT9fzmL0yi545pWSV6pS0WoMs0j2c5Y2M1-Ad9WrDLepGJkWSWPNu2khLiuQTW4NJmKLwEJSiwx"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-10">
               <Tag color="green" className="w-fit mb-4 font-bold uppercase text-xs px-3 py-1">
                 Mới nhất
               </Tag>
               <h3 className="text-white text-headline-lg font-headline-lg mb-4">
                 Trung chuyển miễn phí tận nhà tại Hà Nội
               </h3>
               <a className="text-white font-bold flex items-center gap-2 hover:translate-x-2 transition-transform" href="#">
                 Khám phá ngay
                 <ArrowRightOutlined />
               </a>
             </div>
           </div>
           {/* Side Promo Grid */}
           <div className="md:col-span-4 flex flex-col gap-gutter">
             <div className="group relative rounded-2xl overflow-hidden h-[450px]">
             <img 
             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
             alt="Hành trình xanh cùng NetBus"
             src="/netbus_exterior.png" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
               <div>
                   <TrophyOutlined />
               </div>
               <a className="text-white font-bold flex items-center gap-2 hover:translate-x-2 transition-transform" href="#">
                 Xem chi tiết <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
               </a>
               </div>
             </div>
           </div>
           </div>
         </div>
     </section>


     {/* Fleet Gallery */}
     <section
       ref={(el) => {
         if (el) sectionsRef.current[2] = el;
       }}
       className="py-24 bg-surface dark:bg-inverse-surface/10 px-margin-desktop"
     >
       <div className="max-w-container-max mx-auto text-center">
         <div className="mb-16">
           <h2 className="text-headline-lg font-headline-lg dark:text-black">Tiện ích xe &amp; Đội xe</h2>
           <div className="flex flex-wrap justify-center gap-3 mt-8">
             {fleetTags.map((tag) => (
               <button
                 key={tag}
                 onClick={() => setSelectedFleetTag(tag)}
                 className={`px-4 py-2 rounded-full text-label-sm font-bold border transition-colors cursor-pointer ${selectedFleetTag === tag
                   ? "bg-primary text-white border-primary"
                   : "bg-white dark:bg-slate-900 border-outline-variant text-secondary dark:text-secondary-fixed-dim hover:border-primary"
                   }`}
               >
                 {tag}
               </button>
             ))}
           </div>
         </div>
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <div className="aspect-square rounded-xl overflow-hidden group">
             <img
               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
               alt="Fleet interior"
               src={getFleetImageUrl(selectedFleetTag)}
             />
           </div>
           <div className="aspect-square rounded-xl overflow-hidden group">
             <img
               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
               alt="Fleet aerodynamic body"
               src="/netbus_exterior.png"
             />
           </div>
           <div className="aspect-square rounded-xl overflow-hidden group col-span-2 lg:col-span-1">
             <div className="w-full h-full bg-primary flex flex-col items-center justify-center text-white p-6 text-center">
               <CompassOutlined className="text-4xl mb-4" />
               <p className="font-headline-md text-headline-md">100% Electric Fleet</p>
               <p className="text-sm opacity-80 mt-2">Zero emissions, maximum comfort.</p>
             </div>
           </div>
           <div className="aspect-square rounded-xl overflow-hidden group">
             <img
               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
               alt="Fleet dashboard cockpit"
               src="https://lh3.googleusercontent.com/aida/AP1WRLsgSpTPnW9D96Y6AZiht-SdwBwdkrB4EBPDppNZ63mZzD3lRMnh9zMx-B8rxI2fODSJmyfVzvFK7jCFkG4O2Oy97tyinERr9grT3UGN6U2NSzJ_YgKx1lYkz0NgVGBj3VJrXv3FlLvgK0iQJb_2Dg956WeQRWSVR7qwHRspaOJ5s84hpB5l0CQCl-axMsG9vLqrqvBBhOE3KZunWR2Cx8qD9bCHQbHc9XfrlFuNvWW64pI_uLy9NoCbyIgk"
             />
           </div>
         </div>
       </div>
     </section>


     {/* Stats Section with Ant Design Statistics */}
     <section className="py-20 bg-primary text-on-primary">
       <div className="max-w-container-max mx-auto px-margin-desktop">
         <Row gutter={[24, 24]} justify="center" align="middle" className="text-center">
           <Col xs={24} md={8}>
             <div className="space-y-2 text-white">
               <Statistic
                 value={12}
                 suffix="+"
                 valueStyle={{ color: "white", fontSize: 48, fontWeight: 800, fontFamily: "Manrope" }}
                 prefix={<TrophyOutlined className="mr-2" />}
               />
               <p className="text-body-lg font-medium opacity-90 uppercase tracking-widest text-emerald-100">
                 Giải thưởng vô lăng vàng
               </p>
             </div>
           </Col>
           <Col xs={24} md={8}>
             <div className="space-y-2 text-white">
               <Statistic
                 value={500}
                 suffix="k+"
                 valueStyle={{ color: "white", fontSize: 48, fontWeight: 800, fontFamily: "Manrope" }}
                 prefix={<TeamOutlined className="mr-2" />}
               />
               <p className="text-body-lg font-medium opacity-90 uppercase tracking-widest text-emerald-100">
                 Khách hàng tin tưởng
               </p>
             </div>
           </Col>
           <Col xs={24} md={8}>
             <div className="space-y-2 text-white">
               <Statistic
                 value={100}
                 suffix="+"
                 valueStyle={{ color: "white", fontSize: 48, fontWeight: 800, fontFamily: "Manrope" }}
                 prefix={<CarOutlined className="mr-2" />}
               />
               <p className="text-body-lg font-medium opacity-90 uppercase tracking-widest text-emerald-100">
                 Chuyến xe hàng ngày
               </p>
             </div>
           </Col>
         </Row>
       </div>
     </section>
   </ClientLayout>
 );
}
