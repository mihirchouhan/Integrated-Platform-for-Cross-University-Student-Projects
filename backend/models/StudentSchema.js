const mongoose = require("mongoose")

const studentSchema = new mongoose.Schema({
    email: { type: String, required: true ,match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, },
    collegeCode: { type: String, required: true },
    otp:{type:"Number", required:true}
    
  });

  module.exports = mongoose.model('Student', studentSchema);