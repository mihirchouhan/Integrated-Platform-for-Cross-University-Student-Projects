const express = require("express");
const router = express.Router();
const Marketplace = require("../models/MarketplaceSchema");
const Project = require("../models/ProjectSchema");
const Notification = require("../models/NotificationSchema");
const { isStudent, isRecruiter, authRequired } = require("../middleware/auth");

/* ---- List a project on marketplace ---- */
router.post("/list", isStudent, async (req, res) => {
  try {
    const { projectId, price, licenseType } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.createdByEmail !== req.auth.email) {
      return res.status(403).json({ message: "Only the project creator can list on marketplace" });
    }

    const existing = await Marketplace.findOne({ projectId, status: "listed" });
    if (existing) return res.status(409).json({ message: "Already listed" });

    const Student = require("../models/StudentSchema");
    const student = await Student.findOne({ email: req.auth.email });

    const listing = new Marketplace({
      projectId,
      sellerId: student._id,
      price: price || 0,
      licenseType: licenseType || "non-exclusive",
    });
    await listing.save();

    project.isMarketplaceListed = true;
    await project.save();

    res.status(201).json({ success: true, listing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Browse marketplace ---- */
router.get("/", async (req, res) => {
  try {
    const { skills, q } = req.query;
    const filter = { status: "listed" };

    let listings = await Marketplace.find(filter)
      .populate({
        path: "projectId",
        match: { isGlobal: true },
      })
      .sort({ _id: -1 });

    // Filter out where project didn't match populate
    listings = listings.filter((l) => l.projectId != null);

    // Filter by skills
    if (typeof skills === "string" && skills.trim()) {
      const skillsArr = skills.split(",").map((s) => s.trim().toLowerCase());
      listings = listings.filter((l) =>
        l.projectId.tags?.some((t) => skillsArr.includes(t.toLowerCase()))
      );
    }

    // Search
    if (typeof q === "string" && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      listings = listings.filter(
        (l) => rx.test(l.projectId.name) || rx.test(l.projectId.description)
      );
    }

    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Place a bid ---- */
router.post("/:listingId/bid", isRecruiter, async (req, res) => {
  try {
    const { amount, message } = req.body;
    const listing = await Marketplace.findById(req.params.listingId).populate("projectId");
    if (!listing || listing.status !== "listed") {
      return res.status(404).json({ message: "Listing not found or already sold" });
    }

    listing.bids.push({
      recruiterId: req.auth.recruiterId,
      amount: amount || 0,
      message: message || "",
    });
    await listing.save();

    // Notify seller
    await Notification.create({
      userId: listing.projectId.createdByEmail,
      type: "bid_received",
      message: `New bid of $${amount || 0} received for "${listing.projectId.name}"`,
      link: `/marketplace`,
    });

    res.json({ success: true, message: "Bid placed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Mock purchase (Stripe test mode placeholder) ---- */
router.post("/:listingId/buy", isRecruiter, async (req, res) => {
  try {
    const listing = await Marketplace.findById(req.params.listingId).populate("projectId");
    if (!listing || listing.status !== "listed") {
      return res.status(404).json({ message: "Listing not found or already sold" });
    }

    // Mock Stripe checkout
    listing.buyerId = req.auth.recruiterId;
    listing.status = "sold";
    await listing.save();

    await Notification.create({
      userId: listing.projectId.createdByEmail,
      type: "general",
      message: `Your project "${listing.projectId.name}" has been acquired! Congratulations!`,
      link: `/marketplace`,
    });

    res.json({
      success: true,
      message: "Purchase complete (mock checkout). In production, Stripe payment would be processed here.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
