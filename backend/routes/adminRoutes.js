const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const College = require("../models/CollegeSchema");
const { signToken } = require("../middleware/auth");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "Admin@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234";

/* ---- Super Admin Login ---- */
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = signToken({ role: "admin", email });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ message: "Invalid admin credentials" });
});

/* ---- List all colleges (for admin dashboard) ---- */
router.get("/colleges", async (_req, res) => {
  try {
    const colleges = await College.find().select("-CollegeAdminPassword").sort({ _id: -1 });
    res.json(colleges);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ---- Verify / reject a college ---- */
router.patch("/colleges/:id/verify", async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.verified !== false },
      { new: true }
    ).select("-CollegeAdminPassword");
    if (!college) return res.status(404).json({ message: "College not found" });
    res.json({ success: true, college });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ---- System stats ---- */
router.get("/stats", async (_req, res) => {
  try {
    const Student = require("../models/StudentSchema");
    const Project = require("../models/ProjectSchema");
    const Recruiter = require("../models/RecruiterSchema");
    const [colleges, students, projects, recruiters] = await Promise.all([
      College.countDocuments(),
      Student.countDocuments(),
      Project.countDocuments(),
      Recruiter.countDocuments(),
    ]);
    res.json({ colleges, students, projects, recruiters });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
