const mongoose = require("mongoose");

const recruiterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    companyName: { type: String, required: true, trim: true },
    companyUrl: { type: String, trim: true },
    linkedInUrl: { type: String, trim: true },
    role: { type: String, default: "recruiter" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recruiter", recruiterSchema);
