const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

require("./db");

const College = require("./models/CollegeSchema");
const { initSocket } = require("./socket");

/* ---- Route imports ---- */
const adminRoutes = require("./routes/adminRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const studentRoutes = require("./routes/studentRoutes");
const projectRoutes = require("./routes/projectRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const marketplaceRoutes = require("./routes/marketplaceRoutes");
const messageRoutes = require("./routes/messageRoutes");
const runRoutes = require("./routes/runRoutes");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

/* ---- Middleware ---- */
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

/* ---- College code map (shared via app.locals) ---- */
app.locals.collegeCodeMap = new Map();

(async () => {
  try {
    const colleges = await College.find();
    colleges.forEach((c) => app.locals.collegeCodeMap.set(c.code, c.Cname));
    console.log(`College map loaded (${colleges.length} entries)`);
  } catch (err) {
    console.error("Failed to load college map:", err.message);
  }
})();

/* ---- Socket.io ---- */
const io = initSocket(server);
app.set("io", io);

/* ---- Routes ---- */
app.use("/api/admin", adminRoutes);
app.use("/api/college", collegeRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/run", runRoutes);

/* ---- Legacy routes (backward compat for existing frontend) ---- */
// These map old URLs to new route handlers so nothing breaks during migration
const { authRequired } = require("./middleware/auth");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const { signToken } = require("./middleware/auth");
const Student = require("./models/StudentSchema");
const Project = require("./models/ProjectSchema");
const nodemailer = require("nodemailer");

// Legacy OTP store
const otpMap = {};
function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || "gmail",
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

async function sendOTP(email, otp) {
  if (process.env.OTP_DEV_MODE === "true") { console.log(`[OTP_DEV_MODE] OTP for ${email}: ${otp}`); return; }
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) { throw new Error("Email credentials not configured."); }
  await transporter.sendMail({ from: process.env.MAIL_FROM || process.env.MAIL_USER, to: email, subject: "OTP Verification", text: `Your OTP is: ${otp}` });
}

app.post("/registerCollege", async (req, res) => {
  try {
    const { code, Cname, CollegeAdmin, CollegeAdminPassword } = req.body;
    const hashed = await bcrypt.hash(CollegeAdminPassword, 10);
    const college = new College({ code, Cname, CollegeAdmin, CollegeAdminPassword: hashed });
    await college.save();
    app.locals.collegeCodeMap.set(college.code, college.Cname);
    res.json(college);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post("/college/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const college = await College.findOne({ CollegeAdmin: email });
    if (!college) return res.status(401).json({ message: "Invalid credentials" });
    const stored = college.CollegeAdminPassword;
    const ok = stored?.startsWith("$2") ? await bcrypt.compare(password, stored) : stored === password;
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    if (stored && !stored.startsWith("$2")) { college.CollegeAdminPassword = await bcrypt.hash(password, 10); await college.save(); }
    const token = signToken({ role: "collegeAdmin", collegeCode: college.code, email });
    res.json({ success: true, token, college: { code: college.code, Cname: college.Cname, CollegeAdmin: college.CollegeAdmin } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post("/sendotp", async (req, res) => {
  try {
    const { email, collegeCode } = req.body;
    const existing = await Student.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already exists" });
    const collegeDomain = app.locals.collegeCodeMap.get(collegeCode);
    if (!collegeDomain) return res.status(404).json({ message: "College not found" });
    const emailDomain = email.split("@")[1];
    if (collegeDomain.toLowerCase() !== emailDomain.toLowerCase()) return res.status(401).json({ message: "Invalid college email" });
    const otp = generateOTP(); otpMap[email] = otp;
    // In dev mode, skip email and return OTP in response
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    res.json({ success: true, message: "OTP sent successfully", devOtp: otp });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post("/registerStudent", async (req, res) => {
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
    college.students.push(student._id); await college.save();
    delete otpMap[email];
    res.json({ success: true, message: "Student registered successfully" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post("/Studentlogin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Student.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const stored = user.password;
    const ok = stored?.startsWith("$2") ? await bcrypt.compare(password, stored) : stored === password;
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    if (stored && !stored.startsWith("$2")) { user.password = await bcrypt.hash(password, 10); await user.save(); }
    const token = signToken({ role: "student", email: user.email, collegeCode: user.collegeCode, userId: user._id });
    res.json({ success: true, message: "Login successful", token, user: { email: user.email, collegeCode: user.collegeCode } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

const storage = multer.diskStorage({ destination: (_r, _f, cb) => cb(null, "uploads/"), filename: (_r, file, cb) => cb(null, Date.now() + "-" + file.originalname) });
const upload = multer({ storage });

app.post("/upload", authRequired("student"), upload.single("file"), async (req, res) => {
  try {
    const { name, description, tag, url } = req.body;
    const project = new Project({ filePath: req.file.path, name, description, tag, tags: tag ? tag.split(",").map(t => t.trim()) : [], url, isGlobal: false, CollegeCode: req.auth.collegeCode, createdByEmail: req.auth.email });
    await project.save();
    res.status(201).json({ message: "File uploaded successfully" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/projects", async (req, res) => {
  try {
    const { q, tag, collegeCode, isGlobal } = req.query;
    const filter = {};
    if (typeof tag === "string" && tag.trim()) filter.tag = tag.trim();
    if (typeof collegeCode === "string" && collegeCode.trim()) filter.CollegeCode = collegeCode.trim();
    if (typeof isGlobal === "string" && isGlobal.trim() !== "") filter.isGlobal = isGlobal === "true";
    let query = Project.find(filter);
    if (typeof q === "string" && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query = query.find({ $or: [{ name: rx }, { description: rx }, { tag: rx }, { CollegeCode: rx }] });
    }
    const projects = await query.sort({ _id: -1 }); res.json(projects);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get("/projects/global", async (req, res) => {
  try {
    const { q, tag, collegeCode } = req.query;
    const limitRaw = req.query.limit;
    const limit = typeof limitRaw === "string" && limitRaw.trim() !== "" ? Math.max(1, Math.min(50, parseInt(limitRaw, 10))) : null;
    const filter = { isGlobal: true };
    if (typeof tag === "string" && tag.trim()) filter.tag = tag.trim();
    if (typeof collegeCode === "string" && collegeCode.trim()) filter.CollegeCode = collegeCode.trim();
    let query = Project.find(filter);
    if (typeof q === "string" && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query = query.find({ $or: [{ name: rx }, { description: rx }, { tag: rx }, { CollegeCode: rx }] });
    }
    query = query.sort({ likes: -1, _id: -1 }); if (limit) query = query.limit(limit);
    const projects = await query; res.json(projects);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get("/projects/id/:id", async (req, res) => {
  try { const p = await Project.findById(req.params.id); if (!p) return res.status(404).json({ message: "Project not found" }); res.json(p); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/projects/:id/like", authRequired("student"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id); if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.likedBy?.includes(req.auth.email)) return res.status(409).json({ message: "Already upvoted" });
    project.likedBy.push(req.auth.email); project.likes = (project.likes || 0) + 1;
    const updated = await project.save(); res.json({ success: true, likes: updated.likes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/projects/:id/comments", async (req, res) => {
  try { const p = await Project.findById(req.params.id).select("comments"); if (!p) return res.status(404).json({ message: "Project not found" }); res.json(p.comments || []); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/projects/:id/comments", authRequired("student"), async (req, res) => {
  try {
    const { message } = req.body; if (!message) return res.status(400).json({ message: "message is required" });
    const updated = await Project.findByIdAndUpdate(req.params.id, { $push: { comments: { email: req.auth.email, message } } }, { new: true }).select("comments");
    if (!updated) return res.status(404).json({ message: "Project not found" }); res.status(201).json(updated.comments);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch("/projects/:id/approve", authRequired("collegeAdmin"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id); if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.CollegeCode !== req.auth.collegeCode) return res.status(403).json({ message: "Not allowed for this college" });
    project.isGlobal = true; project.status = "Approved"; await project.save();
    res.json({ success: true, message: "Approved to global", project });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/projects/:collegeCode", async (req, res) => {
  try { const projects = await Project.find({ CollegeCode: req.params.collegeCode }); res.json(projects); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/students/:collegeCode", async (req, res) => {
  try {
    const college = await College.findOne({ code: req.params.collegeCode }).populate("students");
    if (!college) return res.status(404).json({ message: "College not found" });
    res.json(college.students);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ---- Start ---- */
server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Socket.io ready`);
  console.log(` New API routes at /api/*`);
  console.log(` Legacy routes still available for backward compat`);
});
