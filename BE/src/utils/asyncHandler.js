const asyncHandler = (fn) => {
    return async (req, res, next) => {
        try {
            const result = await fn(req, res, next);
            if (result !== undefined && !res.headersSent) {
                return res.json(result)
            }
        } catch (error) {
            let message = error.message;
            if (error.code === 11000) {
                if (message.includes("licensePlates")) {
                    message = "Biển số xe đã tồn tại!";
                } else if (message.includes("email")) {
                    message = "Email đã tồn tại!";
                } else {
                    message = "Dữ liệu bị trùng lặp đã tồn tại!";
                }
            }
            return res.status(400).json({
                message
            })
        }
    }
}

export default asyncHandler;