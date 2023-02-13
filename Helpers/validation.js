const Joi = require('@hapi/joi');

const authorizationSchema =Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(2).required(),
})

module.exports = {
    authorizationSchema
}