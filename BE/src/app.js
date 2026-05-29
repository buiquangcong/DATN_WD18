import express from "express";
import router from "./routers";
import mongoose from "mongoose";


const app = express();

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/NodeJS')
    .then(() => console.log('Kết nối CSDL thành công'))
    .catch(() => console.log('Kết nối CSDL thất bại'));


app.use("/api", router);
// Port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});