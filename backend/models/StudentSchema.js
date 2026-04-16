const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, trim: true },
    password: { type: String, required: true },
    collegeCode: { type: String, required: true },
    name: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    skills: { type: [String], default: [] },
    portfolio: { type: String, trim: true, default: "" },
    avatarUrl: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);