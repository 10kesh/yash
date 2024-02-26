const nodemailer = require('nodemailer');

var transport = nodemailer.createTransport({
    service: 'mail.hexanetwork.in',
    port: 25,
    secure: false,
    auth: {
        user: 'admin@hexanetwork.in',
        pass: 'Kmphasis@12345'
    },
    tls: {
        rejectUnauthorized: false
    }
});
const sendMail = function (to, subject, body) {
    message = {
        from: "admin@hexanetwork.in",
        to: to,
        subject: subject,
        html: body,
    }
    transport.sendMail(message, function (err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log(info);
        }
    })
};
module.exports = sendMail;
