const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const College = require("../models/CollegeSchema");
const { signToken, isCollegeAdmin } = require("../middleware/auth");

/* ---- Email / OTP setup ---- */
const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || "gmail",
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

const otpMap = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(email, otp) {
  if (process.env.OTP_DEV_MODE === "true") {
    console.log(`[OTP_DEV_MODE] OTP for College Admin ${email}: ${otp}`);
    return;
  }
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("Email credentials not configured. Set OTP_DEV_MODE=true to log OTP in console.");
  }
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: email,
    subject: "Admin Password Reset OTP",
    text: `Your college admin password reset OTP is: ${otp}`,
  });
}

/* ---- College Registration ---- */
router.post("/register", async (req, res) => {
  try {
    const { code, Cname, CollegeAdmin, CollegeAdminPassword } = req.body;
    const hashed = await bcrypt.hash(CollegeAdminPassword, 10);
    const college = new College({
      code,
      Cname,
      CollegeAdmin,
      CollegeAdminPassword: hashed,
    });
    await college.save();

    // Update runtime map
    const app = req.app;
    if (app.locals.collegeCodeMap) {
      app.locals.collegeCodeMap.set(college.code, college.Cname);
    }

    res.json(college);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- College Admin Login ---- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const college = await College.findOne({ CollegeAdmin: email });
    if (!college) return res.status(401).json({ message: "Invalid credentials" });

    const stored = college.CollegeAdminPassword;
    const ok =
      stored?.startsWith("$2") ? await bcrypt.compare(password, stored) : stored === password;
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // Migrate plaintext → hash if needed
    if (stored && !stored.startsWith("$2")) {
      college.CollegeAdminPassword = await bcrypt.hash(password, 10);
      await college.save();
    }

    const token = signToken({ role: "collegeAdmin", collegeCode: college.code, email });
    res.json({
      success: true,
      token,
      college: { code: college.code, Cname: college.Cname, CollegeAdmin: college.CollegeAdmin },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Forgot Password ---- */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const college = await College.findOne({ CollegeAdmin: email });
    if (!college) return res.status(404).json({ message: "College Admin not found" });

    const otp = generateOTP();
    otpMap[email] = otp;
    await sendOTP(email, otp);

    res.json({ success: true, message: "OTP sent to registered email" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Reset Password ---- */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const storedOtp = otpMap[email];
    if (!storedOtp) return res.status(400).json({ message: "OTP expired or not found" });
    if (otp !== storedOtp) return res.status(401).json({ message: "Invalid OTP" });

    const college = await College.findOne({ CollegeAdmin: email });
    if (!college) return res.status(404).json({ message: "College Admin not found" });

    college.CollegeAdminPassword = await bcrypt.hash(newPassword, 10);
    await college.save();
    
    delete otpMap[email];
    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Change Password ---- */
router.post("/change-password", isCollegeAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const college = await College.findOne({ CollegeAdmin: req.auth.email });
    if (!college) return res.status(404).json({ message: "College Admin not found" });

    const ok = await bcrypt.compare(oldPassword, college.CollegeAdminPassword);
    if (!ok && college.CollegeAdminPassword !== oldPassword) return res.status(401).json({ message: "Incorrect old password" });

    college.CollegeAdminPassword = await bcrypt.hash(newPassword, 10);
    await college.save();
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Projects by college ---- */
router.get("/projects/:collegeCode", async (req, res) => {
  try {
    const Project = require("../models/ProjectSchema");
    const projects = await Project.find({ CollegeCode: req.params.collegeCode }).sort({ _id: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Students by college ---- */
router.get("/students/:collegeCode", async (req, res) => {
  try {
    const college = await College.findOne({ code: req.params.collegeCode }).populate("students");
    if (!college) return res.status(404).json({ message: "College not found" });
    res.json(college.students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
