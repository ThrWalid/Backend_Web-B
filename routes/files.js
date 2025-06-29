// routes/files.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const FileMetadata = require('../models/FileMetadata');

// Configuration de multer pour stocker les fichiers dans le dossier /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Dossier de destination pour les fichiers uploadés
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    // Génération d'un nom de fichier unique avec timestamp
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// 1) POST /api/files/upload
//     → Enregistre le fichier sur le disque et crée son document de métadonnées en base
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });

    const { originalname, mimetype, filename, size } = req.file;
    const storagePath = `uploads/${filename}`; // Chemin relatif pour le stockage

    // Création du document de métadonnées dans la base
    const doc = new FileMetadata({
      originalName: originalname,
      storagePath,
      mimeType: mimetype,
      size
    });
    await doc.save();

    return res.status(201).json({
      message: 'Fichier enregistré avec succès',
      file: {
        id: doc._id,
        originalName: doc.originalName,
        storagePath: doc.storagePath,
        mimeType: doc.mimeType,
        size: doc.size,
        uploadDate: doc.uploadDate
      }
    });
  } catch (err) {
    console.error('Erreur POST /upload :', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2) GET /api/files
//     → Retourne la liste de tous les documents de métadonnées triés par date décroissante
router.get('/', async (req, res) => {
  try {
    const files = await FileMetadata.find().sort({ uploadDate: -1 });
    return res.json(files);
  } catch (err) {
    console.error('Erreur GET /api/files :', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3) GET /api/files/download/:id
//     → Télécharge physiquement le fichier correspondant à l’ID donné
router.get('/download/:id', async (req, res) => {
  try {
    const doc = await FileMetadata.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Métadonnées non trouvées' });

    // Construction du chemin absolu vers le fichier sur le disque
    const absolutePath = path.join(__dirname, '..', doc.storagePath);
    return res.download(absolutePath, doc.originalName); // Envoi du fichier au client
  } catch (err) {
    console.error('Erreur GET /download/:id :', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4) GET /api/files/:id
//     → Retourne uniquement les métadonnées du fichier correspondant à l’ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await FileMetadata.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Métadonnées non trouvées' });
    return res.json(doc);
  } catch (err) {
    console.error('Erreur GET /api/files/:id :', err);
    return res.status(500).json({ error: err.message });
  }
});

// 5) DELETE /api/files/:id
//     → Supprime physiquement le fichier sur le disque et son document de métadonnées
router.delete('/:id', async (req, res) => {
  try {
    const doc = await FileMetadata.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Métadonnées non trouvées' });

    const fs = require('fs');
    const absolutePath = path.join(__dirname, '..', doc.storagePath);

    // Suppression du fichier sur le disque si il existe
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);

    // Suppression du document de métadonnées en base
    await FileMetadata.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Fichier et métadonnées supprimés' });
  } catch (err) {
    console.error('Erreur DELETE /api/files/:id :', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router; // Export du routeur pour intégration dans l'application
