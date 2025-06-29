const express = require('express');
const router = express.Router();
const File = require('../Models/File');
const ActivityLog = require('../Models/ActivityLog');

// Met à jour les métadonnées d'un fichier identifié par son ID
router.patch('/files/:id', async (req, res) => {
  try {
    // Appelle la méthode statique addMetadata du modèle File
    const updatedFile = await File.addMetadata(req.params.id, req.body);

    // Si aucun fichier trouvé avec cet ID, retourne une erreur 404
    if (!updatedFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Renvoie le fichier mis à jour
    res.json(updatedFile);
  } catch (error) {
    // En cas d'erreur, retourne un statut 400 avec le message d'erreur
    res.status(400).json({ error: error.message });
  }
});

// Recherche des fichiers selon les métadonnées passées en query string
router.get('/files/search', async (req, res) => {
  try {
    // Appelle la méthode statique searchByMetadata du modèle File
    const files = await File.searchByMetadata(req.query);

    // Renvoie la liste des fichiers trouvés
    res.json(files);
  } catch (error) {
    // En cas d'erreur, retourne un statut 400 avec le message d'erreur
    res.status(400).json({ error: error.message });
  }
});

// Récupère les logs d'activité en filtrant par utilisateur, action, type de ressource, et période
router.get('/activities', async (req, res) => {
  try {
    // Extraction des paramètres de filtrage dans la query string
    const { userId, action, resourceType, startDate, endDate } = req.query;

    // Construction de l'objet de requête selon les filtres fournis
    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resourceType) query['metadata.resourceType'] = resourceType;

    // Filtrage par plage de dates sur le champ timestamp
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Recherche dans la collection ActivityLog avec tri décroissant par date et limite à 100 résultats
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      // Remplissage des infos utilisateur (username, email, role) dans les logs
      .populate('userId', 'username email role');

    // Renvoie la liste des logs
    res.json(logs);
  } catch (error) {
    // En cas d'erreur, retourne un statut 500 avec le message d'erreur
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
