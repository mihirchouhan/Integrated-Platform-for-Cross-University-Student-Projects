const mongoose = require("mongoose")

const studentSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    collegeCode: { type: String, required: true },
    
  });

  module.exports = mongoose.model('Student', studentSchema);