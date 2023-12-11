const mongoose = require("mongoose")

const studentSchema = new mongoose.Schema({
  email: { type: String,  unique:true },
  password: { type: String, required: true },
  collegeCode: { type: String, required: true },

    
  });

  module.exports = mongoose.model('Student', studentSchema);