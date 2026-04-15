const mongoose = require('mongoose');
const mongoUrl =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/collegeLoginSystem";

mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');

  })
  .catch(error => {
    console.error('Error connecting to MongoDB:', error);
  });