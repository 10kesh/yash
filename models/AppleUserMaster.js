const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AppleUserMaster = new Schema({
  name: { type: String, required: [true, "Please enter Name"] },
  apple_id: { type: String, required: [true, "Please enter Apple id"] },
  email: { type: String },
  created_at: { type: Date, default: Date.now },
}, { collection: 'apple_user_master' });


AppleUserMaster.methods.toJSON = function () {
  var obj = this.toObject();
  let objKeys = Object.keys(obj);
  objKeys.forEach(function (key) {
    if (obj[key] == null) {
      obj[key] = "";
    }
  });

  delete obj.created_at;
  return obj;
}

module.exports = mongoose.model('apple_user_master', AppleUserMaster);