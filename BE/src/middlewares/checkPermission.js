import jwt from "jsonwebtoken";
import User from "../models/user.model";

export const checkPermission = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                message: "Bạn chưa đăng nhập",
            });
        }

        const decoded = jwt.verify(token, "123456");
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "Người dùng không tồn tại",
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Bạn không có quyền thực hiện hành động này",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Token không hợp lệ hoặc đã hết hạn",
        });
    }
};
