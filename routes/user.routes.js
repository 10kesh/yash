const userCtrl = require('../controllers/user.controller');
const config = require('../config/common.config');
const express = require('express');
const ResponseFormatter = require('../utils/response-formatter');
const userValidation = require('../validations/userValidations');
const routeMiddlewares = require('../routes/routeMiddlewares');
const multer = require('multer');
const fs = require('fs');
const publicPath = basedir + "/public/";

//Configuration for Multer
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname == 'document') {
      if (!fs.existsSync('public/document')) {
        fs.mkdirSync('public/document');
      }

      cb(null, "public/document");
    }
    else {
      if (!fs.existsSync('public/profile')) {
        fs.mkdirSync('public/profile');
      }
      cb(null, "public/profile");
    }

  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `img_${Date.now()}.${ext}`);
  },
});

const upload = multer({ storage: multerStorage });


const formatter = new ResponseFormatter();
const router = express.Router();

router.post('/refreshToken',
  upload.none(),
  routeMiddlewares.validateRequest(userValidation.userIdSchema),
  function (req, res, next) {
    userCtrl.refreshToken(req)
      .then(function (resultObj) {
        var finalRes = formatter.formatResponse(resultObj, 1, config.messages['token_updated_success'], true);
        res.send(finalRes);
      }, function (errorCode) {
        var finalRes = formatter.formatResponse({}, 0, errorCode, false);
        res.send(finalRes);
      });
  });

router.post('/signUp',
  upload.single('profile'),
  routeMiddlewares.validateRequest(userValidation.signupSchema),
  function (req, res, next) {
    userCtrl.signUp(req)
      .then(function (resultObj) {
        var finalRes = formatter.formatResponse(resultObj, 1, config.messages['register_complete'], true);
        res.send(finalRes);
      }, function (errorCode) {

        // remove file if error
        if (req.file && req.file.profile) {
          fs.unlink(publicPath + 'profile/' + req.file.profile.filename, (err) => {
            if (err) {
              console.error(err);
            }
            console.log('file removed');
          })
        }
        // remove file over

        var finalRes = formatter.formatResponse({}, 0, errorCode, false);
        res.send(finalRes);
      });
  });

router.post('/isRegister',
  upload.none(),
  routeMiddlewares.validateRequest(userValidation.isRegisterSchema),
  function (req, res, next) {
    userCtrl.isRegister(req)
      .then(function (resultObj) {
        var finalRes = formatter.formatResponse(resultObj.data, resultObj.code, config.messages[resultObj.message], resultObj.result);
        res.send(finalRes);
      }, function (errorCode) {
        var finalRes = formatter.formatResponse(errorCode.data, errorCode.code, errorCode.message, errorCode.result);
        res.send(finalRes);
      });
  });

router.post('/login',
  upload.none(),
  routeMiddlewares.validateRequest(userValidation.loginUserSchema),
  function (req, res, next) {
    userCtrl.login(req)
      .then(function (resultObj) {
        var finalRes = formatter.formatResponse(resultObj, 1, config.messages['login_success'], true);
        res.send(finalRes);
      }, function (errorCode) {
        var finalRes = formatter.formatResponse({}, 0, errorCode, false);
        res.send(finalRes);
      });
  });

router.post('/forgotPassword',
  upload.none(),
  routeMiddlewares.validateRequest(userValidation.forgotPassSchema),
  function (req, res, next) {
    userCtrl.forgotPassword(req)
      .then(function (resultObj) {
        var finalRes = formatter.formatResponse(resultObj, 1, config.messages['reset_password_success'], true);

        res.send(finalRes);
      }, function (errorCode) {
        var finalRes = formatter.formatResponse({}, 0, errorCode, false);
        res.send(finalRes);
      });
  });

router.post('/verifyOTP',
  upload.none(),
  routeMiddlewares.validateRequest(userValidation.OTPSchema),
  function (req, res, next) {
    userCtrl.verifyOTP(req)
      .then(function (resultObj) {
        var finalRes = formatter.formatResponse(resultObj, 1, config.messages['otp_verified'], true);

        res.send(finalRes);
      }, function (errorCode) {
        var finalRes = formatter.formatResponse({}, 0, errorCode, false);
        res.send(finalRes);
      });
  });

router.post('/updatePassword',
  upload.none(),
  routeMiddlewares.validateRequest(userValidation.updatePassSchema),
  function (req, res, next) {
    userCtrl.updatePassword(req)
      .then(function (resultObj) {
        var finalRes = formatter.formatResponse(resultObj, 1, config.messages['password_change_success'], true);

        res.send(finalRes);
      }, function (errorCode) {
        var finalRes = formatter.formatResponse({}, 0, errorCode, false);
        res.send(finalRes);
      });
  });


router.post('/resendConfirm',
  upload.none(),
  routeMiddlewares.validateRequest(userValidation.forgotPassSchema),
  function (req, res, next) {
    userCtrl.resendConfirm(req)
      .then(function (resultObj) {
        var finalRes = formatter.formatResponse(resultObj, 1, config.messages['confirmation_email'], true);

        res.send(finalRes);
      }, function (errorCode) {
        var finalRes = formatter.formatResponse({}, 0, errorCode, false);
        res.send(finalRes);
      });
  });

router.post('/updateProfile',
  upload.single('profile'),
  routeMiddlewares.validateRequest(userValidation.updateProfileSchema),
  routeMiddlewares.authorize,
  function (req, res, next) {
    userCtrl.updateProfile(req)
      .then(function (resultObj) {
        var finalRes = formatter.formatResponse(resultObj, 1, config.messages['profile_update'], true);
        res.send(finalRes);
      }, function (errorCode) {
        // remove file if error
        if (req.file && req.file.profile) {
          fs.unlink(publicPath + 'profile/' + req.file.profile.filename, (err) => {
            if (err) {
              console.error(err);
            }
            console.log('file removed');
          })
        }
        // remove file over


        var finalRes = formatter.formatResponse({}, 0, errorCode, false);
        res.send(finalRes);
      });
  });

router.post('/changePassword',
  upload.none(),
  routeMiddlewares.validateRequest(userValidation.changePassSchema),
  routeMiddlewares.authorize,
  function (req, res, next) {
    userCtrl.changePassword(req)
      .then(function (resultObj) {
        var finalRes = formatter.formatResponse(resultObj, 1, config.messages['password_change_success'], true);

        res.send(finalRes);
      }, function (errorCode) {
        var finalRes = formatter.formatResponse({}, 0, errorCode, false);
        res.send(finalRes);
      });
  });


router.post('/logOut',
  upload.none(),
  routeMiddlewares.validateRequest(userValidation.logoutSchema),
  routeMiddlewares.authorize,
  function (req, res, next) {
    userCtrl.logOut(req)
      .then(function (resultObj) {
        var finalRes = formatter.formatResponse(resultObj, 1, config.messages['logout_success'], true);

        res.send(finalRes);
      }, function (errorCode) {
        var finalRes = formatter.formatResponse({}, 0, errorCode, false);
        res.send(finalRes);
      });
  });

router.post('/deleteAccount',
  upload.none(),
  routeMiddlewares.validateRequest(userValidation.userIdSchema),
  routeMiddlewares.authorize,
  function (req, res, next) {
    userCtrl.deleteAccount(req)
      .then(function (resultObj) {
        var finalRes = formatter.formatResponse(resultObj, 1, config.messages['delete_success'], true);

        res.send(finalRes);
      }, function (errorCode) {
        var finalRes = formatter.formatResponse({}, 0, errorCode, false);
        res.send(finalRes);
      });
  });

router.post('/contactUs',
  upload.none(),
  routeMiddlewares.validateRequest(userValidation.contactUsSchema),
  routeMiddlewares.authorize,
  function (req, res, next) {
    userCtrl.contactUs(req)
      .then(function (resultObj) {
        var finalRes = formatter.formatResponse(resultObj, 1, config.messages['contact_us_msg'], true);

        res.send(finalRes);
      }, function (errorCode) {
        var finalRes = formatter.formatResponse({}, 0, errorCode, false);
        res.send(finalRes);
      });
  });

module.exports = router;