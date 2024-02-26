const paymentController = {};
const Q = require('q');
const config = require('../config/common.config');
const stripe = require('stripe')(config.STRIPE_SECRET_KEY);
const fs = require('fs');
/** APIs */
paymentController.createPayment = async function (req) {
    const deferred = Q.defer();
    const { user_id, amount, plan_id, quantity } = req.body;
    try {
        let intentObject = await paymentController.createPaymentIntent(amount, { user_id, quantity, plan_id });
        // console.log('intentObject=>', intentObject);
        deferred.resolve(intentObject);
    } catch (errorCode) {
        console.error("paymentController.createToken - ", errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

paymentController.createPaymentIntent = async function (amount, metadata, desc = 'Demo Purchase') {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: 'usd',
            metadata: metadata,
            description: desc,
            automatic_payment_methods: { enabled: true }
        });
        let callbackURL = global.APP_URL + "/stripe_payment?clientSecret=" + paymentIntent.client_secret;
        return { clientSecret: paymentIntent.client_secret, callback: callbackURL, publicKey: config.STRIPE_PUBLIC_KEY };

    } catch (err) {
        return err;
    }
}

paymentController.payViaStripe = async function (card_number, expmonth, expyear, card_cvv, amount, desc = 'Demo Purchase') {
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


paymentController.returnPayment = async function (charge_id) {
    try {
        const refund = await stripe.refunds.create({
            charge: charge_id,
        });
        return refund;

    } catch (err) {
        return err;
    }
}

paymentController.uploadFilesStripe = async function (filepath = "") {
    try {
        var fp = fs.readFileSync(filepath);
        var fileObj = await stripe.files.create({
            purpose: 'identity_document',
            file: {
                data: fp,
                name: 'file.jpg',
                type: 'application/octet-stream',
            },
        });
        return fileObj;

    } catch (err) {
        return err;
    }
}

paymentController.createSubAccount = async function (ipAddress, userObj, frontPath, backPath) {
    try {

        let frontImgId = "";
        if (frontPath != "") {
            let frontImgObj = await paymentController.uploadFilesStripe(frontPath);
            frontImgId = frontImgObj.id ?? "";;
        }

        let backImgid = "";
        if (backPath != "") {
            let backImgObj = await paymentController.uploadFilesStripe(backPath);
            backImgid = backImgObj.id ?? "";
        }


        const account = await stripe.accounts.create({
            type: 'custom',
            country: 'US',
            email: userObj.email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: "individual",
            business_profile: {
                mcc: "7299",
                url: "https://adres.com",
            },
            individual: {
                first_name: userObj.fname,
                last_name: userObj.lname,
                email: userObj.email,
                phone: userObj.phone,
                dob: {
                    day: userObj.bdate,
                    month: userObj.bmonth,
                    year: userObj.byear,
                },
                id_number: userObj.identity_number,
                // political_exposure: "none",
                address: {
                    city: userObj.city,
                    country: "US",
                    line1: userObj.address_line1,
                    postal_code: userObj.pincode,
                    state: userObj.state,
                },
                verification: {
                    document: {
                        front: frontImgId,
                        back: backImgid,
                    },
                },
            },
            external_account: {
                object: "bank_account",
                country: "US",
                currency: "USD",
                account_number: userObj.acc_number,
                routing_number: userObj.routing_number,
                iban_number: userObj.iban_number,
                swift_code: userObj.swift_code,
                bank_name: userObj.bank_name,
            },
            tos_acceptance: {
                date: Math.round(Date.now() / 1000),
                ip: ipAddress
            }
        });
        return account;

    } catch (err) {
        return err;
    }
}

paymentController.updateSubAccount = async function (userObj) {
    try {

        const account = await stripe.accounts.update(userObj.account_id, {
            email: userObj.email,
            individual: {
                first_name: userObj.fname,
                last_name: userObj.lname,
                email: userObj.email,
                phone: userObj.phone,
                address: {
                    city: userObj.city,
                    country: "US",
                    line1: userObj.address_line1,
                    postal_code: userObj.pincode,
                    state: userObj.state,
                },
            },
            external_account: {
                object: "bank_account",
                country: "US",
                currency: "USD",
                account_number: userObj.acc_number,
                routing_number: userObj.routing_number,
                iban_number: userObj.iban_number,
                swift_code: userObj.swift_code,
                bank_name: userObj.bank_name,
            }
        });
        return account;

    } catch (err) {
        return err;
    }
}

paymentController.payoutStripe = async function (amount, account_id, description) {
    try {

        const transfer = await stripe.transfers.create({
            amount: amount * 100,
            currency: 'usd',
            destination: account_id,
            description: description,
        });
        return transfer;

    } catch (err) {
        return err;
    }
}

module.exports = paymentController;