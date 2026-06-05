import express from "express";
import router from "./routers";
import mongoose from "mongoose";


const app = express();

app.use(express.json());

mongoose.connect(
  'mongodb+srv://hungtran:admin1@datn-wd18.9bxbump.mongodb.net/DATN_WD18?retryWrites=true&w=majority',
   {
    dbName: 'DATN-WD18'
  }
)
    .then(() => console.log('Kết nối CSDL thành công'))
    .catch(() => console.log('Kết nối CSDL thất bại'));


app.use("/api", router);
// Port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});