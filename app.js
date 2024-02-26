const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

global.basedir = __dirname;
global.APP_NAME = process.env.APPNAME || "Demo";
global.APP_URL = process.env.APPURL || "http://localhost:3013";
var corsOptions = {
    origin: global.APP_URL
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(`${__dirname}/public`));


// simple route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to Demo api." });
});

require('./models/db');
require("./routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

/*  PASSPORT SETUP  */
const session = require('express-session');

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'SECRET'
}));

const passport = require('passport');
const commonConfig = require("./config/common.config");
const stripe = require('stripe')(commonConfig.STRIPE_SECRET_KEY);
var userProfile;

app.use(passport.initialize());
app.use(passport.session());


app.get('/error', (req, res) => res.send("error logging in"));


app.get("/stripe_payment", (req, res) => {
    const { clientSecret } = req.query;
    const html = `<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Woof3 Payment</title>
            <style>
                /* Variables */
                * {
                    box-sizing: border-box;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    font-size: 16px;
                    -webkit-font-smoothing: antialiased;
                    display: flex;
                    justify-content: center;
                    align-content: center;
                    height: 100vh;
                    width: 100vw;
                }

                form {
                    width: 30vw;
                    min-width: 500px;
                    align-self: center;
                    box-shadow: 0px 0px 0px 0.5px rgba(50, 50, 93, 0.1),
                    0px 2px 5px 0px rgba(50, 50, 93, 0.1), 0px 1px 1.5px 0px rgba(0, 0, 0, 0.07);
                    border-radius: 7px;
                    padding: 40px;
                }

                .hidden {
                    display: none;
                }

                #payment-element {
                    margin-bottom: 24px;
                }

                /* Buttons and links */
                button {
                    background: #5469d4;
                    font-family: Arial, sans-serif;
                    color: #ffffff;
                    border-radius: 4px;
                    border: 0;
                    padding: 12px 16px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    display: block;
                    transition: all 0.2s ease;
                    box-shadow: 0px 4px 5.5px 0px rgba(0, 0, 0, 0.07);
                    width: 100%;
                }
                button:hover {
                    filter: contrast(115%);
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: default;
                }

                /* spinner/processing state, errors */
                .spinner,
                .spinner:before,
                .spinner:after {
                    border-radius: 50%;
                }
                .spinner {
                    color: #ffffff;
                    font-size: 22px;
                    text-indent: -99999px;
                    margin: 0px auto;
                    position: relative;
                    width: 20px;
                    height: 20px;
                    box-shadow: inset 0 0 0 2px;
                    -webkit-transform: translateZ(0);
                    -ms-transform: translateZ(0);
                    transform: translateZ(0);
                }
                .spinner:before,
                .spinner:after {
                    position: absolute;
                    content: "";
                }
                .spinner:before {
                    width: 10.4px;
                    height: 20.4px;
                    background: #5469d4;
                    border-radius: 20.4px 0 0 20.4px;
                    top: -0.2px;
                    left: -0.2px;
                    -webkit-transform-origin: 10.4px 10.2px;
                    transform-origin: 10.4px 10.2px;
                    -webkit-animation: loading 2s infinite ease 1.5s;
                    animation: loading 2s infinite ease 1.5s;
                }
                .spinner:after {
                    width: 10.4px;
                    height: 10.2px;
                    background: #5469d4;
                    border-radius: 0 10.2px 10.2px 0;
                    top: -0.1px;
                    left: 10.2px;
                    -webkit-transform-origin: 0px 10.2px;
                    transform-origin: 0px 10.2px;
                    -webkit-animation: loading 2s infinite ease;
                    animation: loading 2s infinite ease;
                }

                @-webkit-keyframes loading {
                    0% {
                        -webkit-transform: rotate(0deg);
                        transform: rotate(0deg);
                    }
                    100% {
                        -webkit-transform: rotate(360deg);
                        transform: rotate(360deg);
                    }
                }
                @keyframes loading {
                    0% {
                        -webkit-transform: rotate(0deg);
                        transform: rotate(0deg);
                    }
                    100% {
                        -webkit-transform: rotate(360deg);
                        transform: rotate(360deg);
                    }
                }

                @media only screen and (max-width: 600px) {
                    form {
                        width: 80vw;
                        min-width: initial;
                    }
                }
                #powered-by-stripe {
                    text-align: center;
                    color: #666;
                }
                #powered-by-stripe> p{
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin:0 auto;
                    font-size: 20px;
                 }
            </style>
            <script src="https://js.stripe.com/v3/"></script>
            </head>
            <body>

           <form id="payment-form" class="dash_div " style="margin:0 auto">
                <center><h1>Woof3 Payment</h1></center>
                <div id="payment-element">
                    <!--Stripe.js injects the Payment Element-->
                </div>
                <button id="submit">
                    <div class="spinner hidden" id="spinner"></div>
                    <span id="button-text">Pay now </span>
                </button>
                <!-- Powered by Stripe badge -->
                <div id="powered-by-stripe">
                    <p>Powered by <img src="public/images/powerbystripe.png" alt="Stripe" width="20%"></p>
                </div>
            </form>

            <script type="text/javascript">
                // This is your test publishable API key.
                const stripe = Stripe("`+ commonConfig.STRIPE_PUBLIC_KEY + `");

                let elements;

                
                    document
                    .querySelector("#payment-form")
                    .addEventListener("submit", handleSubmit);
                

                let emailAddress = null;
                let returnUrl = "`+ global.APP_URL + `/success";
                console.log(returnUrl)
                // Fetches a payment intent and captures the client secret
                initialize('`+ clientSecret + `');
                async function initialize(clientSecret) {
                    elements = stripe.elements({ clientSecret });

                    // const linkAuthenticationElement = elements.create("linkAuthentication");
                    // linkAuthenticationElement.mount("#link-authentication-element");

                    const paymentElementOptions = {
                        layout: "tabs",
                    };

                    const paymentElement = elements.create("payment", paymentElementOptions);
                    paymentElement.mount("#payment-element");
                }

                async function handleSubmit(e) {
                    e.preventDefault();
                    setLoading(true);

                    const { error } = await stripe.confirmPayment({
                        elements,
                        confirmParams: {
                            // Make sure to change this to your payment completion page
                            return_url: returnUrl,
                            receipt_email: emailAddress,
                        },
                    });
                    console.log(error);

                    if (error.type === "card_error" || error.type === "validation_error") {
                        alert(error.message)
                    } else {
                        alert("An unexpected error occurred.")
                    }

                    setLoading(false);
                }

                // Fetches the payment intent status after payment submission
                async function retrievePayIntent() {
                    const clientSecret = new URLSearchParams(window.location.search).get(
                        "payment_intent_client_secret"
                    );

                    if (!clientSecret) {
                        return;
                    }

                    const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
                    return paymentIntent;
                }

                // Show a spinner on payment submission
                function setLoading(isLoading) {
                    if (isLoading) {
                        // Disable the button and show a spinner
                        document.querySelector("#submit").disabled = true;
                        document.querySelector("#spinner").classList.remove("hidden");
                        document.querySelector("#button-text").classList.add("hidden");
                    } else {
                        document.querySelector("#submit").disabled = false;
                        document.querySelector("#spinner").classList.add("hidden");
                        document.querySelector("#button-text").classList.remove("hidden");
                    }
                }

            </script>


            </body>
            </html>

    `;

    res.send(html);
});

// Define a route for the success page
app.get('/success', (req, res) => {
    res.sendFile(__dirname + '/public/success.html');
});

app.post('/webhook_stripe', async (req, res) => {

    let event = req.body;
    console.log('stripe webhook event', event.type);
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object; // Contains a Stripe PaymentIntent
            console.log("Success-meta->>", paymentIntent.metadata);

            const { user_id, plan_id, quantity } = paymentIntent.metadata;

            const plan = await MarketSpaceMaster.findById(plan_id);
            if (!plan) {
                console.log('plan not found:', plan_id);
                break;
            }
            // make payment
            const bonus = await BonusMaster.findOne({ reward_id: plan.reward_id });

            let userBonus = await UserBonusMaster.findOne({ user_id, reward_id: plan.reward_id, bonus_type: bonus.bonus_type });
            if (userBonus) {
                await UserBonusMaster.findByIdAndUpdate(userBonus._id, { received: userBonus.received + Number(quantity) });
            } else {
                await UserBonusMaster.create({
                    user_id, reward_id: plan.reward_id, bonus_type: bonus.bonus_type, received: Number(quantity)
                });
            }

            // manage bonus history
            await BonusHistoryMaster.create({
                user_id,
                bonus: Number(quantity),
                bonus_type: bonus.bonus_type,
                reward_id: plan.reward_id,
                bonus_on: 'purchase_plan',
                date: moment().format('YYYY-MM-DD'),
                credit: true
            });
            res.send("payment success!");
            break;
        case 'payment_intent.payment_failed':
            const paymentFailedIntent = event.data.object; // Contains a Stripe PaymentIntent
            console.log("Failed-->>", paymentFailedIntent);
            res.send("payment failed!");
            break;
        // Add more event types as needed
        default:
            res.send("payment default!");
            console.log(`Unhandled event type: ${event.type}`);
    }
    res.send({});


});

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});
// over passport

/*  Google AUTH  */

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GOOGLE_CLIENT_ID = '349632168246-3a28vjg6iseii7ir9ojtlhvg6ivg2e8m.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3030/auth/google/callback"
},
    function (accessToken, refreshToken, profile, done) {
        console.log('accessToken-->>', accessToken);
        userProfile = profile;
        return done(null, userProfile);
    }
));

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/error' }),
    function (req, res) {
        // Successful authentication, redirect success.
        res.redirect('/success');
    });