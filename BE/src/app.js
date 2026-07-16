import express from "express";
import "dotenv/config";
import cors from "cors"; 
import router from "./routers";
import mongoose from "mongoose";

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

mongoose.connect(
    'mongodb+srv://hungtran:admin1@datn-wd18.9bxbump.mongodb.net/DATN_WD18?retryWrites=true&w=majority',
    {
        dbName: 'DATN-WD18'
    }
)
    .then(async () => {
        console.log('Kết nối CSDL thành công');
        try {
            await mongoose.connection.db.collection('staffs').dropIndex('sdt_1');
            console.log('Đã xóa index sdt_1 cũ thành công');
        } catch (err) {}
        try {
            await mongoose.connection.db.collection('staffs').dropIndex('cccd_1');
            console.log('Đã xóa index cccd_1 cũ thành công');
        } catch (err) {}
    })
    .catch(() => console.log('Kết nối CSDL thất bại'));


// Định nghĩa các route API
app.use("/api", router);
// Cấu hình Port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`=== Server is running on port ${port} ===`);
});