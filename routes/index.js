const express = require('express');
const mainRouter = express.Router();


var users = require("./user.routes");
mainRouter.use('/user', users);

module.exports = function (app) {
    app.use('/api/', mainRouter);
};
