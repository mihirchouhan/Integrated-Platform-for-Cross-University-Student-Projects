const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Recruiter = require("../models/RecruiterSchema");
const Project = require("../models/ProjectSchema");
const Notification = require("../models/NotificationSchema");
const { signToken, isRecruiter } = require("../middleware/auth");

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
    console.log(`[OTP_DEV_MODE] OTP for Recruiter ${email}: ${otp}`);
    return;
  }
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("Email credentials not configured. Set OTP_DEV_MODE=true to log OTP in console.");
  }
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: email,
    subject: "Recruiter Password Reset OTP",
    text: `Your recruiter password reset OTP is: ${otp}`,
  });
}

/* ---- Recruiter Signup ---- */
router.post("/signup", async (req, res) => {
  try {
    const { email, password, companyName, companyUrl, linkedInUrl } = req.body;
    const existing = await Recruiter.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const recruiter = new Recruiter({
      email,
      password: hashed,
      companyName,
      companyUrl,
      linkedInUrl,
    });
    await recruiter.save();
    res.status(201).json({ success: true, message: "Recruiter registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Recruiter Login ---- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, recruiter.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ role: "recruiter", email, recruiterId: recruiter._id });
    res.json({
      success: true,
      token,
      recruiter: {
        email: recruiter.email,
        companyName: recruiter.companyName,
        id: recruiter._id,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Forgot Password ---- */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) return res.status(404).json({ message: "Recruiter not found" });

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

    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) return res.status(404).json({ message: "Recruiter not found" });

    recruiter.password = await bcrypt.hash(newPassword, 10);
    await recruiter.save();
    
    delete otpMap[email];
    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Change Password ---- */
router.post("/change-password", isRecruiter, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const recruiter = await Recruiter.findOne({ email: req.auth.email });
    if (!recruiter) return res.status(404).json({ message: "Recruiter not found" });

    const ok = await bcrypt.compare(oldPassword, recruiter.password);
    if (!ok && recruiter.password !== oldPassword) return res.status(401).json({ message: "Incorrect old password" });

    recruiter.password = await bcrypt.hash(newPassword, 10);
    await recruiter.save();
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Browse verified projects (filter by skills/tags) ---- */
router.get("/talent", async (req, res) => {
  try {
    const { skills, q } = req.query;
    const filter = { isGlobal: true, status: "Approved" };

    if (typeof skills === "string" && skills.trim()) {
      const skillsArr = skills.split(",").map((s) => s.trim());
      filter.tags = { $in: skillsArr };
    }

    let query = Project.find(filter);
    if (typeof q === "string" && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query = query.find({
        $or: [{ name: rx }, { description: rx }, { tags: rx }],
      });
    }

    const projects = await query.sort({ likes: -1, _id: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Request Interview ---- */
router.post("/request-interview/:projectId", isRecruiter, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const recruiter = await Recruiter.findById(req.auth.recruiterId);
    const companyName = recruiter?.companyName || req.auth.email;

    // Notify all team members + creator
    const recipients = [project.createdByEmail, ...project.teamMembers].filter(Boolean);
    const uniqueRecipients = [...new Set(recipients)];

    const notifications = uniqueRecipients.map((userId) => ({
      userId,
      type: "interview_request",
      message: `${companyName} wants to interview you about project "${project.name}"!`,
      link: `/projects/${project._id}`,
    }));

    await Notification.insertMany(notifications);

    // Also send an automated direct message so the student can reply with their resume
    const Message = require("../models/MessageSchema");
    const messages = uniqueRecipients.map((userId) => ({
      from: req.auth.email,
      to: userId,
      message: `Hello! ${companyName} is very impressed by your work on "${project.name}" and would like to invite you for a technical interview. Please reply to this message with a copy of your latest resume and some times you are available to chat this week.`,
    }));
    await Message.insertMany(messages);

    res.json({ success: true, message: `Interview request & automated message sent to ${uniqueRecipients.length} team member(s)` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Recruiter profile ---- */
router.get("/profile", isRecruiter, async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.auth.recruiterId).select("-password");
    if (!recruiter) return res.status(404).json({ message: "Recruiter not found" });
    res.json(recruiter);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
