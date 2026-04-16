const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true, _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    /* Legacy single tag kept for backward compat; new code uses tags[] */
    tag: { type: String, default: "" },
    tags: { type: [String], default: [] },

    filePath: { type: String, required: true },
    url: { type: String, trim: true },
    githubLink: { type: String, trim: true, default: "" },

    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },

    isGlobal: { type: Boolean, default: false },
    CollegeCode: { type: String, required: true },
    createdByEmail: { type: String, required: true, trim: true },
    teamMembers: { type: [String], default: [] },

    comments: { type: [commentSchema], default: [] },

    /* Plagiarism & lifecycle */
    status: {
      type: String,
      enum: ["Pending", "Approved", "Flagged"],
      default: "Pending",
    },
    plagiarismScore: { type: Number, default: 0 },

    /* Marketplace */
    isMarketplaceListed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);