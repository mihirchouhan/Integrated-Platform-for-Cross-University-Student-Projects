const mongoose = require('mongoose');
const mongoUrl = "mongodb://localhost:27017/collegeLoginSystem";

mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');

  })
  .catch(error => {
    console.error('Error connecting to MongoDB:', error);
  });

