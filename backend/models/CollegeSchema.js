const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  Cname: { type: String, required: true },
  CollegeAdmin: { type: String, required: true, unique: true },
  CollegeAdminPassword: { type: String, required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
});
module.exports = mongoose.model('College', collegeSchema);
