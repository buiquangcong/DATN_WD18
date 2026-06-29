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
    .then(() => console.log('Kết nối CSDL thành công'))
    .catch(() => console.log('Kết nối CSDL thất bại'));


// Định nghĩa các route API
app.use("/api", router);
// Cấu hình Port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`=== Server is running on port ${port} ===`);
});