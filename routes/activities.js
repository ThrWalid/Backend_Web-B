const express = require('express');
const router = express.Router();
const ActivityLog = require('../Models/ActivityLog');

// POST /activitylogs
// Crée un nouvel enregistrement d'activité à partir du corps de la requête
router.post('/', async (req, res) => {
  try {
    const log = new ActivityLog(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /activitylogs
// Récupère tous les logs d'activité, en populant la référence userId
router.get('/', async (req, res) => {
  try {
    const logs = await ActivityLog.find().populate('userId');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
