const mongoose = require('mongoose');

const projectschema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  tag: { type: String, required: true,  },
  filePath: {
    type: String,
    required: true,
  },
  url:{type:String,trim: true},
  likes: {
    type: Number,
    default: 0,
  },
  isGlobal: { type: Boolean, required: true },
  CollegeCode: { type: String, required: true },

});
module.exports = mongoose.model('Project', projectschema);