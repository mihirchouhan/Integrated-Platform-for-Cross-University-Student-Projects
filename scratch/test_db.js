const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const mongoUrl = process.env.MONGODB_URI;
console.log('Testing connection to:', mongoUrl.replace(/:([^@]+)@/, ':****@'));

mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Connection failed:', error);
    process.exit(1);
  });
