const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

require("./db");

const College = require("./models/CollegeSchema");
const Student = require("./models/StudentSchema");
const Project = require("./models/ProjectSchema");

const app = express();
const PORT = process.env.PORT || 5000;

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

/* ------------------ MIDDLEWARE ------------------ */
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function authRequired(role) {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;
      if (!token) return res.status(401).json({ message: "Missing token" });
      const decoded = jwt.verify(token, JWT_SECRET);
      if (role && decoded.role !== role) {
        return res.status(403).json({ message: "Forbidden" });
      }
      req.auth = decoded;
      next();
    } catch (e) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

/* ------------------ EMAIL CONFIG ------------------ */
const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* ------------------ COLLEGE CODE MAP ------------------ */
const collegeCodeMap = new Map();

(async () => {
  try {
    const colleges = await College.find();
    colleges.forEach(college => {
      collegeCodeMap.set(college.code, college.Cname);
    });
    console.log("College map loaded");
  } catch (err) {
    console.error(err.message);
  }
})();

/* ------------------ OTP STORE ------------------ */
const otpMap = {};

/* ------------------ UTIL FUNCTIONS ------------------ */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(email, otp) {
  // Dev fallback: allow development without email credentials.
  // If OTP_DEV_MODE=true, we will log the OTP to the server console instead of emailing it.
  if (process.env.OTP_DEV_MODE === "true") {
    console.log(`[OTP_DEV_MODE] OTP for ${email}: ${otp}`);
    return;
  }

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error(
      "Email credentials not configured. Set MAIL_USER and MAIL_PASS in backend/.env, or set OTP_DEV_MODE=true to log OTP in console."
    );
  }
  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: email,
    subject: "OTP Verification",
    text: `Your OTP is: ${otp}`,
  };
  await transporter.sendMail(mailOptions);
}

/* ------------------ COLLEGE REGISTRATION ------------------ */
app.post("/registerCollege", async (req, res) => {
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

    collegeCodeMap.set(college.code, college.Cname);
    res.json(college);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ------------------ COLLEGE ADMIN LOGIN ------------------ */
app.post("/college/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const college = await College.findOne({ CollegeAdmin: email });
    if (!college) return res.status(401).json({ message: "Invalid credentials" });

    const stored = college.CollegeAdminPassword;
    const ok =
      stored?.startsWith("$2") ? await bcrypt.compare(password, stored) : stored === password;
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // migrate plaintext -> hash if needed
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

/* ------------------ SEND OTP ------------------ */
app.post("/sendotp", async (req, res) => {
  try {
    const { email, collegeCode } = req.body;

    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const collegeDomain = collegeCodeMap.get(collegeCode);
    if (!collegeDomain) {
      return res.status(404).json({ message: "College not found" });
    }

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

/* ------------------ STUDENT REGISTRATION (OTP VERIFY) ------------------ */
app.post("/registerStudent", async (req, res) => {
  try {
    const { email, password, collegeCode, otp } = req.body;

    const storedOtp = otpMap[email];
    if (!storedOtp) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    if (otp !== storedOtp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const college = await College.findOne({ code: collegeCode });
    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

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

/* ------------------ STUDENT LOGIN ------------------ */
app.post("/Studentlogin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Student.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const stored = user.password;
    const ok =
      stored?.startsWith("$2") ? await bcrypt.compare(password, stored) : stored === password;
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (stored && !stored.startsWith("$2")) {
      user.password = await bcrypt.hash(password, 10);
      await user.save();
    }

    const token = signToken({
      role: "student",
      email: user.email,
      collegeCode: user.collegeCode,
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { email: user.email, collegeCode: user.collegeCode },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ------------------ FILE UPLOAD ------------------ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

app.post("/upload", authRequired("student"), upload.single("file"), async (req, res) => {
  try {
    const { name, description, tag, url } = req.body;
    const collegeCode = req.auth.collegeCode;
    const email = req.auth.email;

    const project = new Project({
      filePath: req.file.path,
      name,
      description,
      tag,
      url,
      isGlobal: false,
      CollegeCode: collegeCode,
      createdByEmail: email,
    });

    await project.save();
    res.status(201).json({ message: "File uploaded successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------ PROJECT FETCH ------------------ */
app.get("/projects", async (req, res) => {
  try {
    const { q, tag, collegeCode, isGlobal } = req.query;
    const filter = {};

    if (typeof tag === "string" && tag.trim()) filter.tag = tag.trim();
    if (typeof collegeCode === "string" && collegeCode.trim())
      filter.CollegeCode = collegeCode.trim();
    if (typeof isGlobal === "string" && isGlobal.trim() !== "")
      filter.isGlobal = isGlobal === "true";

    let query = Project.find(filter);

    if (typeof q === "string" && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query = query.find({
        $or: [{ name: rx }, { description: rx }, { tag: rx }, { CollegeCode: rx }],
      });
    }

    const projects = await query.sort({ _id: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ------------------ GLOBAL PROJECTS (PUBLIC) ------------------ */
app.get("/projects/global", async (req, res) => {
  try {
    const { q, tag, collegeCode } = req.query;
    const limitRaw = req.query.limit;
    const limit =
      typeof limitRaw === "string" && limitRaw.trim() !== ""
        ? Math.max(1, Math.min(50, parseInt(limitRaw, 10)))
        : null;

    const filter = { isGlobal: true };
    if (typeof tag === "string" && tag.trim()) filter.tag = tag.trim();
    if (typeof collegeCode === "string" && collegeCode.trim())
      filter.CollegeCode = collegeCode.trim();

    let query = Project.find(filter);

    if (typeof q === "string" && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query = query.find({
        $or: [{ name: rx }, { description: rx }, { tag: rx }, { CollegeCode: rx }],
      });
    }

    query = query.sort({ likes: -1, _id: -1 });
    if (limit) query = query.limit(limit);
    const projects = await query;
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ------------------ PROJECT DETAILS ------------------ */
app.get("/projects/id/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ------------------ PROJECT LIKE (UPVOTE) ------------------ */
app.post("/projects/:id/like", authRequired("student"), async (req, res) => {
  try {
    const email = req.auth.email;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.likedBy?.includes(email)) {
      return res.status(409).json({ message: "Already upvoted" });
    }
    project.likedBy.push(email);
    project.likes = (project.likes || 0) + 1;
    const updated = await project.save();
    if (!updated) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true, likes: updated.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ------------------ PROJECT COMMENTS (DISCUSS) ------------------ */
app.get("/projects/:id/comments", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).select("comments");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project.comments || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/projects/:id/comments", authRequired("student"), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: "message is required" });
    }
    const authorEmail = req.auth.email;

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { email: authorEmail, message } } },
      { new: true }
    ).select("comments");

    if (!updated) return res.status(404).json({ message: "Project not found" });
    res.status(201).json(updated.comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ------------------ APPROVE PROJECT TO GLOBAL ------------------ */
app.patch("/projects/:id/approve", authRequired("collegeAdmin"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.CollegeCode !== req.auth.collegeCode) {
      return res.status(403).json({ message: "Not allowed for this college" });
    }

    project.isGlobal = true;
    await project.save();
    res.json({ success: true, message: "Approved to global", project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/projects/:collegeCode", async (req, res) => {
  try {
    const projects = await Project.find({
      CollegeCode: req.params.collegeCode,
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ------------------ STUDENTS BY COLLEGE ------------------ */
app.get("/students/:collegeCode", async (req, res) => {
  try {
    const college = await College.findOne({ code: req.params.collegeCode })
      .populate("students");

    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    res.json(college.students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ------------------ SERVER START ------------------ */
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});



