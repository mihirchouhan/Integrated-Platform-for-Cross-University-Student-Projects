const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Student = require("../models/StudentSchema");
const College = require("../models/CollegeSchema");
const { signToken, isStudent } = require("../middleware/auth");

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
    console.log(`[OTP_DEV_MODE] OTP for ${email}: ${otp}`);
    return;
  }
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("Email credentials not configured. Set OTP_DEV_MODE=true to log OTP in console.");
  }
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: email,
    subject: "OTP Verification",
    text: `Your OTP is: ${otp}`,
  });
}

/* ---- Send OTP ---- */
router.post("/sendotp", async (req, res) => {
  try {
    const { email, collegeCode } = req.body;
    const existing = await Student.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already exists" });

    const app = req.app;
    const collegeDomain = app.locals.collegeCodeMap?.get(collegeCode);
    if (!collegeDomain) return res.status(404).json({ message: "College not found" });

    const emailDomain = email.split("@")[1];
    if (collegeDomain.toLowerCase() !== emailDomain.toLowerCase()) {
      return res.status(401).json({ message: "Invalid college email" });
    }

    const otp = generateOTP();
    otpMap[email] = otp;
    await sendOTP(email, otp);

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Register (verify OTP) ---- */
router.post("/register", async (req, res) => {
  try {
    const { email, password, collegeCode, otp } = req.body;
    const storedOtp = otpMap[email];
    if (!storedOtp) return res.status(400).json({ message: "OTP expired or not found" });
    if (otp !== storedOtp) return res.status(401).json({ message: "Invalid OTP" });

    const existing = await Student.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const college = await College.findOne({ code: collegeCode });
    if (!college) return res.status(404).json({ message: "College not found" });

    const hashed = await bcrypt.hash(password, 10);
    const student = new Student({ email, password: hashed, collegeCode });
    await student.save();

    college.students.push(student._id);
    await college.save();

    delete otpMap[email];
    res.json({ success: true, message: "Student registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Student Login ---- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Student.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const stored = user.password;
    const ok = stored?.startsWith("$2") ? await bcrypt.compare(password, stored) : stored === password;
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (stored && !stored.startsWith("$2")) {
      user.password = await bcrypt.hash(password, 10);
      await user.save();
    }

    const token = signToken({ role: "student", email: user.email, collegeCode: user.collegeCode, userId: user._id });
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { email: user.email, collegeCode: user.collegeCode, name: user.name, skills: user.skills },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Forgot Password ---- */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Student.findOne({ email });
    if (!user) return res.status(404).json({ message: "Student not found" });

    const otp = generateOTP();
    otpMap[email] = otp; // Store in local memory cache
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

    const user = await Student.findOne({ email });
    if (!user) return res.status(404).json({ message: "Student not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    delete otpMap[email];
    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Change Password ---- */
router.post("/change-password", isStudent, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await Student.findOne({ email: req.auth.email });
    if (!user) return res.status(404).json({ message: "Student not found" });

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok && user.password !== oldPassword) return res.status(401).json({ message: "Incorrect old password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Get profile ---- */
router.get("/profile", isStudent, async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.auth.email }).select("-password");
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ---- Update profile ---- */
router.put("/profile", isStudent, async (req, res) => {
  try {
    const { name, bio, skills, portfolio, avatarUrl } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (bio !== undefined) update.bio = bio;
    if (skills !== undefined) update.skills = Array.isArray(skills) ? skills : skills.split(",").map((s) => s.trim());
    if (portfolio !== undefined) update.portfolio = portfolio;
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;

    const student = await Student.findOneAndUpdate({ email: req.auth.email }, update, { new: true }).select("-password");
    res.json(student);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ---- Get any student by email (public) ---- */
router.get("/by-email/:email", async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.params.email }).select("-password");
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
