const express = require("express");
const router = express.Router();
const multer = require("multer");
const Project = require("../models/ProjectSchema");
const Notification = require("../models/NotificationSchema");
const { authRequired, isStudent, isCollegeAdmin } = require("../middleware/auth");
const { checkPlagiarism } = require("../services/plagiarismCheck");

/* ---- File upload config ---- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/* ---- Upload project ---- */
router.post("/upload", isStudent, upload.single("file"), async (req, res) => {
  try {
    const { name, description, tag, tags, url, githubLink, teamMembers } = req.body;
    const collegeCode = req.auth.collegeCode;
    const email = req.auth.email;

    // Build tags array from both legacy "tag" and new "tags" field
    let tagsArr = [];
    if (tags) {
      tagsArr = typeof tags === "string" ? tags.split(",").map((t) => t.trim()).filter(Boolean) : tags;
    } else if (tag) {
      tagsArr = tag.split(",").map((t) => t.trim()).filter(Boolean);
    }

    const project = new Project({
      filePath: req.file ? req.file.path : "",
      name,
      description,
      tag: tagsArr.join(", "),
      tags: tagsArr,
      url,
      githubLink: githubLink || "",
      isGlobal: false,
      CollegeCode: collegeCode,
      createdByEmail: email,
      teamMembers: teamMembers ? (typeof teamMembers === "string" ? teamMembers.split(",").map((t) => t.trim()) : teamMembers) : [],
      status: "Pending",
    });

    // Plagiarism check on description + name
    const plagResult = await checkPlagiarism(`${name} ${description}`);
    project.plagiarismScore = plagResult.similarityScore;
    if (plagResult.flagged) {
      project.status = "Flagged";
    }

    await project.save();

    const statusMsg = plagResult.flagged
      ? `File uploaded. ⚠️ Plagiarism flagged (${plagResult.similarityScore}% similarity). Awaiting admin review.`
      : "File uploaded successfully";

    res.status(201).json({ message: statusMsg, plagiarism: plagResult, projectId: project._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---- List projects (with filters) ---- */
router.get("/", async (req, res) => {
  try {
    const { q, tag, collegeCode, isGlobal, status, email } = req.query;
    const filter = {};
    if (typeof tag === "string" && tag.trim()) {
      filter.$or = [{ tag: tag.trim() }, { tags: tag.trim() }];
    }
    if (typeof collegeCode === "string" && collegeCode.trim()) filter.CollegeCode = collegeCode.trim();
    if (typeof isGlobal === "string" && isGlobal.trim() !== "") filter.isGlobal = isGlobal === "true";
    if (typeof status === "string" && status.trim()) filter.status = status.trim();
    if (typeof email === "string" && email.trim()) filter.createdByEmail = email.trim();

    let query = Project.find(filter);
    if (typeof q === "string" && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query = query.find({
        $or: [{ name: rx }, { description: rx }, { tag: rx }, { tags: rx }, { CollegeCode: rx }],
      });
    }
    const projects = await query.sort({ _id: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Global projects (public) ---- */
router.get("/global", async (req, res) => {
  try {
    const { q, tag, collegeCode } = req.query;
    const limitRaw = req.query.limit;
    const limit =
      typeof limitRaw === "string" && limitRaw.trim() !== ""
        ? Math.max(1, Math.min(50, parseInt(limitRaw, 10)))
        : null;

    const filter = { isGlobal: true };
    if (typeof tag === "string" && tag.trim()) {
      filter.$or = [{ tag: tag.trim() }, { tags: tag.trim() }];
    }
    if (typeof collegeCode === "string" && collegeCode.trim()) filter.CollegeCode = collegeCode.trim();

    let query = Project.find(filter);
    if (typeof q === "string" && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query = query.find({
        $or: [{ name: rx }, { description: rx }, { tag: rx }, { tags: rx }, { CollegeCode: rx }],
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

/* ---- Project details ---- */
router.get("/id/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Like / upvote ---- */
router.post("/:id/like", isStudent, async (req, res) => {
  try {
    const email = req.auth.email;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.likedBy?.includes(email)) return res.status(409).json({ message: "Already upvoted" });

    project.likedBy.push(email);
    project.likes = (project.likes || 0) + 1;
    const updated = await project.save();
    res.json({ success: true, likes: updated.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Comments ---- */
router.get("/:id/comments", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).select("comments");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project.comments || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/comments", isStudent, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "message is required" });
    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { email: req.auth.email, message } } },
      { new: true }
    ).select("comments");
    if (!updated) return res.status(404).json({ message: "Project not found" });
    res.status(201).json(updated.comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Approve project to Global ---- */
router.patch("/:id/approve", isCollegeAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.CollegeCode !== req.auth.collegeCode) {
      return res.status(403).json({ message: "Not allowed for this college" });
    }
    project.isGlobal = true;
    project.status = "Approved";
    await project.save();

    // Notify creator
    await Notification.create({
      userId: project.createdByEmail,
      type: "project_approved",
      message: `Your project "${project.name}" has been approved to the Global section!`,
      link: `/projects/${project._id}`,
    });

    res.json({ success: true, message: "Approved to global", project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Update project status (college admin – for flagged projects) ---- */
router.patch("/:id/status", isCollegeAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Approved", "Flagged"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.CollegeCode !== req.auth.collegeCode) {
      return res.status(403).json({ message: "Not allowed for this college" });
    }
    project.status = status;
    if (status === "Approved") project.isGlobal = true;
    await project.save();
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Projects by college code ---- */
router.get("/college/:collegeCode", async (req, res) => {
  try {
    const projects = await Project.find({ CollegeCode: req.params.collegeCode }).sort({ _id: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
