import Joi from "joi";


const schema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().required(),
    author: Joi.string().required(),
    createdAt: Joi.date()
})