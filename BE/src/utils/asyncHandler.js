const asyncHandler = (fn) => {
    return async (req, res, next) => {
        try {
            const result = await fn(req, res, next);
            if (result !== undefined && !res.headersSent) {
                return res.json(result)
            }
        } catch (error) {
            return res.status(400).json({
                message: error.message
            })
        }
    }
}

export default asyncHandler