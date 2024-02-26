const Joi = require('joi');
const emailSchema = Joi.string();
const stringSchema = Joi.string();

Joi.objectId = require('joi-objectid')(Joi)

module.exports = {
    signupSchema: {
        body: Joi.object().keys({
            name: stringSchema.required(),
            email: emailSchema.required(),
            pass: stringSchema.required(),
            profile: Joi.any(),
            device_type: stringSchema,
            device_token: stringSchema,
            is_google: stringSchema.default(0),
            google_id: stringSchema.default("").allow(""),
            is_fb: stringSchema.default(0),
            fb_id: stringSchema.default("").allow(""),
            is_apple: stringSchema.default(0),
            apple_id: stringSchema.default("").allow(""),
        })
    },
    isRegisterSchema: {
        body: Joi.object().keys({
            device_token: stringSchema.allow(""),
            device_type: stringSchema.allow(""),
            email: stringSchema.allow(""),
            name: stringSchema.allow(""),
            is_social_type: stringSchema.required(),
            is_google: stringSchema.default(0),
            google_id: Joi.alternatives().conditional('is_google', { is: 1, then: stringSchema.required(), otherwise: stringSchema.default("").allow("") }),
            is_fb: stringSchema.default(0),
            fb_id: Joi.alternatives().conditional('is_fb', { is: 1, then: stringSchema.required(), otherwise: stringSchema.default("").allow("") }),
            is_apple: stringSchema.default(0),
            apple_id: Joi.alternatives().conditional('is_apple', { is: 1, then: stringSchema.required(), otherwise: stringSchema.default("").allow("") }),
        })
    },
    loginUserSchema: {
        body: Joi.object().keys({
            email: emailSchema.required(),
            pass: stringSchema.required(),
            device_type: stringSchema,
            device_token: stringSchema,
        })
    },
    updateProfileSchema: {
        body: Joi.object().keys({
            user_id: Joi.objectId().required(),
            name: stringSchema.required(),
            email: emailSchema.required(),
            profile: Joi.any()
        })
    },
    forgotPassSchema: {
        body: Joi.object().keys({
            email: emailSchema.required()
        })
    },
    logoutSchema: {
        body: Joi.object().keys({
            user_id: Joi.objectId().required()
        })
    },
    userIdSchema: {
        body: Joi.object().keys({
            user_id: Joi.objectId().required()
        })
    },
    changePassSchema: {
        body: Joi.object().keys({
            user_id: Joi.objectId().required(),
            old_password: stringSchema.required(),
            new_password: stringSchema.required(),
        })
    },
    OTPSchema: {
        body: Joi.object().keys({
            otp: stringSchema.required(),
        })
    },
    updatePassSchema: {
        body: Joi.object().keys({
            new_password: stringSchema.required(),
            user_id: Joi.objectId().required(),
        })
    },
    contactUsSchema: {
        body: Joi.object().keys({
            name: stringSchema.required(),
            email: emailSchema.required(),
            subject: stringSchema.required(),
            message: stringSchema.required(),
        })
    }
};