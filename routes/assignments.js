const express = require('express');
const router = express.Router();
const Assignment = require('../Models/Assignment');

// Route pour créer un nouveau devoir
router.post('/', async (req, res) => {
  try {
    const assignment = new Assignment(req.body);
    await assignment.save(); //  Cela déclenche le hook `.post('save')` du modèle
    res.status(201).json(assignment); // Répond avec le devoir créé
  } catch (error) {
    res.status(400).json({ error: error.message }); // En cas d'erreur, renvoie un message d'erreur
  }
});

// Route pour récupérer tous les devoirs
router.get('/', async (req, res) => {
  const assignments = await Assignment.find(); // Recherche tous les devoirs en base
  res.json(assignments); // Renvoie la liste des devoirs au client
});

// Route pour modifier un devoir existant (ex: corriger un devoir)
router.patch('/:id', async (req, res) => {
  // Met à jour le devoir par son ID avec les données reçues dans le corps de la requête
  const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated); // Renvoie le devoir mis à jour
});

module.exports = router; // Exporte le routeur pour l'utiliser dans app.js
