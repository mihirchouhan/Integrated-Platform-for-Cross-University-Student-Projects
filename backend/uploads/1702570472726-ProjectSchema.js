const mongoose = require('mongoose');

const projectschema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  tag: { type: String, required: true,  },
  filePath: {
    type: String,
    required: true,
  }
  // isGlobal: { type: Boolean, required: true },
  // CollegeCode: { type: String, required: true },
});
module.exports = mongoose.model('Project', projectschema);