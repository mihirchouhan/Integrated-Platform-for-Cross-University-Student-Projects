const mongoose = require('mongoose');
require('dotenv').config();

const mongoUrl = process.env.MONGODB_URI;
console.log('Testing connection...');

mongoose.connect(mongoUrl)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Connection failed:', error);
    process.exit(1);
  });
