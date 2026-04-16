const express = require("express");
const router = express.Router();
const Message = require("../models/MessageSchema");
const Notification = require("../models/NotificationSchema");
const { authRequired } = require("../middleware/auth");

const anyAuth = authRequired();

/* ---- Send a DM ---- */
router.post("/send", anyAuth, async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ message: "to and message are required" });

    const dm = new Message({ from: req.auth.email, to, message });
    await dm.save();

    // Notification
    await Notification.create({
      userId: to,
      type: "dm",
      message: `New message from ${req.auth.email}`,
      link: `/messages`,
    });

    // Emit via Socket.io if available
    const io = req.app.get("io");
    if (io) {
      const room = [req.auth.email, to].sort().join(":");
      io.to(`dm:${room}`).emit("dm:message", dm);
    }

    res.status(201).json(dm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Get conversation with a specific user ---- */
router.get("/conversation/:otherEmail", anyAuth, async (req, res) => {
  try {
    const me = req.auth.email;
    const other = req.params.otherEmail;
    const messages = await Message.find({
      $or: [
        { from: me, to: other },
        { from: other, to: me },
      ],
    }).sort({ createdAt: 1 });

    // Mark unread as read
    await Message.updateMany({ from: other, to: me, read: false }, { read: true });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- List conversations (latest message per peer) ---- */
router.get("/conversations", anyAuth, async (req, res) => {
  try {
    const me = req.auth.email;
    const messages = await Message.find({
      $or: [{ from: me }, { to: me }],
    }).sort({ createdAt: -1 });

    // Group by peer
    const peersMap = new Map();
    for (const m of messages) {
      const peer = m.from === me ? m.to : m.from;
      if (!peersMap.has(peer)) {
        peersMap.set(peer, {
          peer,
          lastMessage: m.message,
          lastAt: m.createdAt,
          unread: 0,
        });
      }
      if (m.to === me && !m.read) {
        const entry = peersMap.get(peer);
        entry.unread++;
      }
    }

    res.json([...peersMap.values()]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---- Notifications ---- */
router.get("/notifications", anyAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.auth.email }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/notifications/:id/read", anyAuth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
