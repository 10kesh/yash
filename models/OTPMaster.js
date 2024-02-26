const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OTPMaster = new Schema({
  user_id: { type: String, default: "" },
  otp_code: { type: Number, required: [true, "Please enter OTP"] },
  phone: { type: String },
  ccode: { type: String },
  created_at: { type: Date, default: Date.now },
  expireAt: { type: Date, default: Date.now, index: { expires: 0 } },
}, { collection: 'otp_master' });


module.exports = mongoose.model('otp_master', OTPMaster);