const express = require('express');
const router = express.Router();
const Forum = require('../Models/Forum');

// 1) Créer un nouveau forum
router.post('/', async (req, res) => {
  const forum = new Forum(req.body);
  await forum.save(); // Sauvegarde en base
  res.status(201).json(forum);
});

// 2) Ajouter un message à une discussion existante (forum)
router.post('/:id/messages', async (req, res) => {
  const forum = await Forum.findById(req.params.id);
  forum.messages.push(req.body); // Ajout du message au tableau messages
  await forum.save(); // Mise à jour en base
  res.status(200).json(forum);
});

// 3) Récupérer la liste de tous les forums
router.get('/', async (req, res) => {
  const forums = await Forum.find();
  res.json(forums);
});

module.exports = router;
