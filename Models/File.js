// Models/File.js
const mongoose = require('mongoose');

// Définition du schéma d’un fichier
const fileSchema = new mongoose.Schema({
  filename: String,           // Nom du fichier
  mimetype: String,           // Type MIME du fichier (ex: "application/pdf")
  size: Number,               // Taille du fichier en octets
  uploadDate: {               // Date d’upload du fichier
    type: Date,
    default: Date.now         // Valeur par défaut : date courante
  },
  course: String,             // Cours associé au fichier (nom ou identifiant)
  uploadedBy: String          // Utilisateur ayant uploadé le fichier
});

// Export du modèle File
module.exports = mongoose.model('File', fileSchema);
