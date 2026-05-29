
export const validateRequest = (schema, target = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[target]);
        if (error) {
            return res.status(400).json(error.details.map(item => item.message));
        }
        next();
    }
}