const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true, _id: true }
);

const projectschema = new mongoose.Schema({
  // itemId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   required: true,
  // },
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
  likedBy: { type: [String], default: [] }, // store student emails for now
  isGlobal: { type: Boolean, required: true },
  CollegeCode: { type: String, required: true },
  createdByEmail: { type: String, required: true, trim: true },
  comments: { type: [commentSchema], default: [] },

});
module.exports = mongoose.model('Project', projectschema);