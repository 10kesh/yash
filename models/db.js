const dbConfig = require("../config/db.config.js");

const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

mongoose.connect(dbConfig.DB_URL)
  .then(() => console.log('Mongo Connected!'))
  .catch(error => {
    console.log("error while connecting to mongo database...", error);
  });

