import express from "express";
import cors from "cors"; // 1. BẮT BUỘC PHẢI THÊM DÒNG NÀY
import router from "./routers";
import mongoose from "mongoose";

const app = express();

// 2. Cấu hình CORS (Bây giờ sẽ chạy mượt mà vì đã có import)
app.use(cors({
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

mongoose.connect('mongodb+srv://tduc:admin1@datn-wd18.9bxbump.mongodb.net/DATN-WD18?retryWrites=true&w=majority') 
    .then(() => console.log('=== Kết nối CSDL thành công ==='))
    .catch((err) => console.log('=== Kết nối CSDL thất bại ===\nChi tiết lỗi:', err));

// Định nghĩa các route API
app.use("/api", router);

// Cấu hình Port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`=== Server is running on port ${port} ===`);
});