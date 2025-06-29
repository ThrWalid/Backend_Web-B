const mongoose = require('mongoose');

// Schéma pour enregistrer les logs d'activité des utilisateurs
const logSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Référence à l'utilisateur concerné
  action: String,      // Action effectuée (ex : 'login', 'view-course', 'submit-assignment')
  description: String, // Description optionnelle détaillant l'action
  timestamp: { type: Date, default: Date.now } // Date et heure de l'action (défaut : date actuelle)
});

// Index pour optimiser les recherches par utilisateur et ordre chronologique décroissant
logSchema.index({ userId: 1, timestamp: -1 });

// Export du modèle Log
module.exports = mongoose.model('Log', logSchema);
