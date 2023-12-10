const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// Create Team
router.post('/', async (req, res) => {
  try {
    const team = new Team(req.body);
    await team.save();
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
