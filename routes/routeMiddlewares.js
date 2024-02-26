const config = require('../config/common.config');
const ResponseFormatter = require('../utils/response-formatter');
const formatter = new ResponseFormatter();
const jwt = require('jsonwebtoken');
const userController = require('../controllers/user.controller');


var routeMiddlewares = {
    validateRequest: function (requestSchema) {
        return (req, res, next) => {
            req.user_Ip = req.socket.remoteAddress;
            const validations = ['headers', 'params', 'query', 'body']
                .map(key => {
                    const schema = requestSchema[key];
                    const value = req[key];
                    if (schema) {
                        const { error } = schema.validate(value);
                        if (error) {
                            const { details } = error;
                            const message = details.map(i => i.message).join(',')

                            var finalRes = formatter.formatResponse({}, 0, message, false);
                            return res.status(422).send(finalRes);
                        }
                        else {
                            next();
                        }
                    }
                });

        };
    },
    authorize: async function (req, res, next) {
        // TODO: check id user is active
        try {
            req.user_Ip = req.socket.remoteAddress;
            let token;
            let errorCode = "unknown_error";
            if (req.headers.authorization) {
                if (typeof req.headers.authorization !== 'string' || req.headers.authorization.indexOf('Bearer ') === -1) {
                    errorCode = "incorrect_token";
                } else {
                    token = req.headers.authorization.split(' ')[1];
                }
            } else if (req.headers && req.headers.token) {
                token = req.headers.token;
            } else {
                errorCode = "incorrect_token";
            }
            console.log('token', token);

            if (!token && errorCode) {

                var finalRes = formatter.formatResponse({}, 0, config.messages[errorCode], false);
                return res.send(finalRes);
            }


            jwt.verify(token, config.jwt.secret, async (err, decoded) => {
                if (err || !decoded || !decoded.userId) {
                    errorCode = "incorrect_token";
                    var finalRes = formatter.formatResponse({}, 0, config.messages[errorCode], false);
                    return res.status(401).send(finalRes);
                }
                console.log('decoded', decoded);
                // TODO : enable this code if user context is required in auth protected APIs
                const user = await userController.getUserDetail(decoded.userId);
                if (user == null) {
                    console.error("authorize failure - ");
                    var finalRes = formatter.formatResponse({}, 0, config.messages["incorrect_token"], false);
                    return res.send(finalRes);
                }
                // eslint-disable-next-line no-param-reassign
                req.user = user;
                return next();
            });
        } catch (errorCode) {
            console.error("authorize failure - ", errorCode);
            var finalRes = formatter.formatResponse({}, 0, config.messages[errorCode], false);
            return res.send(finalRes);
        }
    },
};

module.exports = routeMiddlewares;