const userController = {};
const Q = require('q');
const UserMaster = require("../models/UserMaster");
const config = require('../config/common.config');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')('sk_test_51Gf0TaDf4p1HjB0rVdcdf2elyG63YZzbKxLQzRCNEdTSVUiK6NMzjOVo9DmPAgfeHwIt8l8wglRuEq01GV62UKxn00hXPkEwl6');
const sendMail = require("../utils/sendMail");
const { contactUsMail, registerMail, forgotPasswordMail } = require("../utils/ContentProvider");
const AppleUserMaster = require('../models/AppleUserMaster');
const OTPMaster = require('../models/OTPMaster');
const fs = require('fs');
const publicPath = basedir + "/public/";

/** APIs */

userController.payViaStripe = async function (card_number, expmonth, expyear, card_cvv, amount, desc = 'Gawal Booking') {
    try {
        const token = await stripe.tokens.create({
            card: {
                number: card_number,
                exp_month: expmonth,
                exp_year: expyear,
                cvc: card_cvv,
            },
        });

        const charge = await stripe.charges.create({
            amount: amount * 100,
            currency: 'usd',
            source: token.id,
            description: desc,
        });

        return charge;

    } catch (err) {
        return err;
    }
}

userController.refreshToken = async function (req) {
    const deferred = Q.defer();
    const { user_id } = req.body;
    try {
        let checkUser = await userController.getUserDetail(user_id);
        if (checkUser == null) {
            deferred.reject("invalid_user_id");
        }

        let token = jwt.sign({ userId: user_id }, config.jwt.secret, { expiresIn: config.jwt.token_expiry });
        deferred.resolve({ token: token });
    } catch (errorCode) {
        console.error("userController.refreshToken - ", errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

userController.getUserDetail = async (user_id) => {
    let checkUser = await UserMaster.findOne({ _id: user_id, deleted_at: null }).exec();
    return checkUser;
}


userController.signUp = async (req) => {
    const deferred = Q.defer();
    const { email, pass, name, device_type, device_token, is_fb, fb_id, is_google, google_id, is_apple, apple_id } = req.body;
    try {
        let checkUser = await UserMaster.findOne({ email, deleted_at: null }).exec();
        if (checkUser != null && checkUser.is_fb == 1) {
            deferred.reject("is_fb_user");
        }
        else if (checkUser != null && checkUser.is_google == 1) {
            deferred.reject("is_google_user");
        }
        else if (checkUser != null && checkUser.is_apple == 1) {
            deferred.reject("is_apple_user");
        }
        else if (checkUser != null) {
            deferred.reject("already_register");
        }
        else {
            let profile = req.file ? (req.file.filename ?? '') : '';
            let user = new UserMaster();
            user.email = email;
            user.password = pass;
            user.is_confirm = "1";
            user.name = name;
            user.profile = profile;
            user.token = "";
            user.is_fb = is_fb;
            user.fb_id = fb_id;
            user.is_google = is_google;
            user.google_id = google_id;
            user.is_apple = is_apple;
            user.apple_id = apple_id;
            user.device_type = device_type;
            user.device_token = device_token;
            user.save(async function (error, document) {
                if (error) {
                    let errorKeys = Object.keys(error.errors);

                    errorKeys.forEach(key => {
                        console.log(error.errors[key].properties.message);
                        deferred.reject(error.errors[key].properties.message);
                    });
                }
                if (document) {
                    let link = "";
                    let mailContent = await registerMail(name, link);
                    sendMail(email, "Confirmation Email", mailContent);
                    deferred.resolve(document);
                }

            });
        }


    } catch (errorCode) {
        console.error("userController.signUp - ", errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

userController.isRegister = async (req) => {
    const deferred = Q.defer();
    const { device_token, device_type, email, name, is_social_type, is_google, google_id, is_fb, fb_id, is_apple, apple_id } = req.body;
    try {

        if (is_fb == 0 && is_apple == 0 && is_google == 0 && email == "") {
            let resObj = new Object();
            resObj.message = "social_validation";
            resObj.code = 0;
            resObj.result = false;
            deferred.reject(resObj);
        }
        let user_detail;
        if (email && email != '') {
            user_detail = await UserMaster.findOne({ email: email, deleted_at: null }).exec();
        }
        else {
            user_detail = await UserMaster.findOne({ deleted_at: null, $or: [{ fb_id: fb_id, apple_id: apple_id, google_id: google_id }] }).exec();
        }

        if (user_detail && user_detail.is_confirm == 0) {
            let resObj = new Object();
            resObj.message = "confirmation_email";
            resObj.code = 2;
            resObj.result = false;
            deferred.reject(resObj);
        }
        else if (user_detail && user_detail.is_fb == 0 && user_detail.is_apple == 0 && user_detail.is_google == 0) {
            let resObj = new Object();
            resObj.message = user_detail.email + '' + config.messages["is_normal_user"];
            resObj.code = 4;
            resObj.result = false;
            deferred.reject(resObj);
        }
        else if (user_detail && user_detail[is_social_type] == 0 && user_detail.is_fb == 1) {

            let resObj = new Object();
            resObj.message = user_detail.email + '' + config.messages["is_fb_user"];
            resObj.code = 4;
            resObj.result = false;
            deferred.reject(resObj);
        }
        else if (user_detail && user_detail[is_social_type] == 0 && user_detail.is_google == 1) {
            let resObj = new Object();
            resObj.message = user_detail.email + '' + config.messages["is_google_user"];
            resObj.code = 4;
            resObj.result = false;
            deferred.reject(resObj);
        }
        else if (user_detail && user_detail[is_social_type] == 0 && user_detail.is_apple == 1) {
            let resObj = new Object();
            resObj.message = user_detail.email + '' + config.messages["is_apple_user"];
            resObj.code = 4;
            resObj.result = false;
            deferred.reject(resObj);
        }
        else if (user_detail && (user_detail.is_apple == is_apple || user_detail.is_google == is_google || user_detail.is_fb == is_fb)) {
            await UserMaster.findByIdAndUpdate({ _id: user_detail._id }, { device_token: device_token, device_type: device_type });
            let token = jwt.sign({ userId: user_detail._id }, config.jwt.secret, { expiresIn: config.jwt.token_expiry });
            user_detail.token = token;
            let resObj = new Object();
            resObj.data = user_detail;
            resObj.message = "login_success";
            resObj.code = 1;
            resObj.result = true;
            deferred.resolve(resObj);
        }
        else {
            if (is_apple == 1) {
                let appleData = await AppleUserMaster.findOne({ apple_id });
                // console.log('appleData', appleData);
                if (appleData == null) {
                    let newAppleUser = new AppleUserMaster();
                    newAppleUser.apple_id = apple_id;
                    newAppleUser.name = name;
                    newAppleUser.email = email;

                    newAppleUser.save(function (error, document) {
                        if (error) {
                            let errorKeys = Object.keys(error.errors);

                            errorKeys.forEach(key => {
                                deferred.reject(error.errors[key].properties.message);
                            });
                        }
                        if (document) {
                            let resObj = new Object();
                            resObj.data = appleData;
                            resObj.message = "not_registered_user";
                            resObj.code = 3;
                            resObj.result = false;
                            deferred.resolve(resObj); // 3
                        }
                    });
                }
                else {
                    let resObj = new Object();
                    resObj.message = "not_registered_user";
                    resObj.data = appleData;
                    resObj.code = 3;
                    resObj.result = false;
                    deferred.resolve(resObj); // 3    
                }

            }
            else {
                deferred.reject("not_registered_user");
            }
        }

    } catch (errorCode) {
        console.error("userController.isRegister- ", errorCode);
        deferred.reject(errorCode);
    }

    return deferred.promise;
}

userController.login = async (req) => {
    const deferred = Q.defer();
    const { email, pass, device_token = "", device_type = "" } = req.body;
    try {
        let userResponseObj = await UserMaster.findOne({ email: email, deleted_at: null });

        if (userResponseObj) {
            if (userResponseObj.password == pass) {
                await UserMaster.findByIdAndUpdate({ _id: userResponseObj._id }, { device_token: device_token, device_type: device_type });
                let token = jwt.sign({ userId: userResponseObj._id }, config.jwt.secret, { expiresIn: config.jwt.token_expiry });
                userResponseObj.token = token;
                userResponseObj.device_token = device_token;
                userResponseObj.device_type = device_type;
                deferred.resolve(userResponseObj);
            }
            else {
                deferred.reject("incorrect_password");
            }

        }
        else {
            deferred.reject("incorrect_email");
        }


    } catch (errorCode) {
        console.error("userController.login- ", errorCode);
        deferred.reject(errorCode);
    }

    return deferred.promise;
}

userController.updateProfile = async function (req) {
    const deferred = Q.defer();
    const { user_id } = req.body;
    try {
        let profile = req.file ? (req.file.filename ?? '') : '';
        req.body.profile = profile;
        if (profile == '') {
            delete req.body.profile;
        }
        else {
            let oldPath = publicPath + "profile/" + req.user.profile;
            fs.unlink(oldPath, (err) => {
                if (err) {
                    console.error(err);
                }
                // console.log('file removed');
            })
        }

        let userResponseObj = await UserMaster.findOneAndUpdate({ _id: user_id }, req.body, { new: true });
        if (userResponseObj) {
            deferred.resolve(userResponseObj);
        }
        else {
            deferred.reject("invalid_user_id");
        }

    } catch (errorCode) {
        console.error("userController.updateProfile - ", errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

userController.changePassword = async function (req) {
    const deferred = Q.defer();
    const { user_id, old_password, new_password } = req.body;
    try {
        let getUser = await userController.getUserDetail(user_id);

        if (getUser != null) {
            if (getUser.password != old_password) {
                deferred.reject("check_old_password");
            }
            else if (getUser.password == new_password) {
                deferred.reject("check_password");
            }
            let userResponseObj = await UserMaster.findByIdAndUpdate({ _id: user_id }, { password: new_password }, { new: true });
            deferred.resolve(userResponseObj);

        }
        else {
            deferred.reject("invalid_user_id");
        }


    } catch (errorCode) {
        console.error("userController.changePassword - ", errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

userController.forgotPassword = async function (req) {
    const deferred = Q.defer();
    const { email } = req.body;
    try {

        let otpCode = makeid(4);
        let newOtp = OTPMaster();
        newOtp.otp_code = otpCode;
        newOtp.expireAt = new Date();
        newOtp.save();
        let userResponseObj = await UserMaster.findOneAndUpdate(email, { ucode: otpCode }, { new: true });
        if (userResponseObj) {
            let mailContent = await forgotPasswordMail(userResponseObj.name, otpCode);
            sendMail(email, "Forgot Password Mail", mailContent);
            deferred.resolve();
        }
        else {
            deferred.reject("incorrect_email");
        }

    } catch (errorCode) {
        console.error("userController.forgotPassword - ", errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

userController.verifyOTP = async function (req) {
    const deferred = Q.defer();
    const { otp } = req.body;
    try {
        let checkOTP = OTPMaster.findOne({ otp_code: otp }).exec();
        if (checkOTP != null) {
            OTPMaster.deleteOne({ "_id": checkOTP._id }).exec();
            deferred.resolve();
        }
        else {
            deferred.reject("invalid_otp");
        }

    } catch (errorCode) {
        console.error("userController.verifyOTP - ", errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

userController.updatePassword = async function (req) {
    const deferred = Q.defer();
    const { user_id, new_password } = req.body;
    try {
        let getUser = await userController.getUserDetail(user_id);

        if (getUser != null) {
            let userResponseObj = await UserMaster.findByIdAndUpdate({ _id: user_id }, { password: new_password }, { new: true });
            deferred.resolve(userResponseObj);
        }
        else {
            deferred.reject("invalid_user_id");
        }

    } catch (errorCode) {
        console.error("userController.updatePassword - ", errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

userController.resendConfirm = async function (req) {
    const deferred = Q.defer();
    const { email } = req.body;
    try {
        let userResponseObj = await UserMaster.findOne({ email: email, deleted_at: null });
        if (userResponseObj == null) {
            deferred.reject("incorrect_emails");
        }
        if (userResponseObj.is_confirm == 1) {
            deferred.reject("email_confirmed");
        }
        let link = "";
        let mailContent = await registerMail(userResponseObj.name, link);
        sendMail(email, "Confirmation signUp " + APP_NAME, mailContent);
        deferred.resolve();

    } catch (errorCode) {
        console.error("userController.resendConfirm - ", errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

userController.logOut = async function (req) {
    let deferred = Q.defer();
    const { user_id } = req.body;
    try {
        let userResponseObj = await UserMaster.findByIdAndUpdate({ _id: user_id }, { device_token: "", device_type: "" });
        if (userResponseObj) {
            deferred.resolve();
        }
        else {
            deferred.reject("invalid_user_id");
        }

    } catch (errorCode) {
        console.error("userController.Logout - ", errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

userController.deleteAccount = async function (req) {
    const deferred = Q.defer();
    const { user_id } = req.body;
    try {
        let userResponseObj = await UserMaster.findByIdAndUpdate({ _id: user_id }, { deleted_at: new Date() });
        if (userResponseObj) {
            deferred.resolve();
        }
        else {
            deferred.reject("invalid_user_id");
        }

    } catch (errorCode) {
        console.error("userController.deleteAccount - ", errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

userController.contactUs = async function (req) {
    const deferred = Q.defer();
    const { email, name, subject, message } = req.body;
    try {

        let clientEmail = process.env.CLIENT_EMAIL || "mayur.kmphasis@gmail.com";
        let mailContent = await contactUsMail(name, email, subject, message);
        sendMail(clientEmail, "Contact Us email from " + APP_NAME, mailContent);
        deferred.resolve();

    } catch (errorCode) {
        console.error("userController.contactUs - ", errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

function makeid(length) {
    let result = '';
    let characters = '0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

module.exports = userController;