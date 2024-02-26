const messages = require('./messages');

module.exports = {
    jwt: {
        secret: "WG00SXN1UUAXF6Nu5ujIDp7pOr752wAgj9cOOqsG4xAnni+TG6rLU0eP/wjwGU6YYW0=",
        token_expiry: 60 * 60 * 12
    },
    errorCodes: {
        SUCCESS_CODE: "1",
        ERROR_CODE: "0",
        REQUEST_VALIDATION_FAILURE: "0",
        UNKNOWN_ERROR: "0"
    },
    messages,
    // KMphasisinfotech account key
    STRIPE_PUBLIC_KEY: "pk_test_51Gf0TaDf4p1HjB0rEnM73kI1epATBfQOkxMRyQoBt9IyVJRMMWD36vsRhy1CLWjtLeDjRX2LmtgrWcx6TVqQAcmx00aaoQZkAk",
    STRIPE_SECRET_KEY: "sk_test_51Gf0TaDf4p1HjB0rVdcdf2elyG63YZzbKxLQzRCNEdTSVUiK6NMzjOVo9DmPAgfeHwIt8l8wglRuEq01GV62UKxn00hXPkEwl6"
};