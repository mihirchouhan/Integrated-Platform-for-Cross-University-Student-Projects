const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "Recruiter", required: true },
    amount: { type: Number, required: true },
    message: { type: String, trim: true },
  },
  { timestamps: true }
);

const marketplaceSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    price: { type: Number, default: 0 },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "Recruiter" },
    licenseType: {
      type: String,
      enum: ["open", "exclusive", "non-exclusive"],
      default: "non-exclusive",
    },
    isHiringOpen: { type: Boolean, default: true },
    bids: { type: [bidSchema], default: [] },
    status: {
      type: String,
      enum: ["listed", "sold", "delisted"],
      default: "listed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Marketplace", marketplaceSchema);
