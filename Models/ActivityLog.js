// Importation de Mongoose pour définir le schéma de données
const mongoose = require('mongoose');

// Définition du schéma pour les journaux d'activité des utilisateurs
const activityLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true // Référence obligatoire vers un utilisateur
  },
  action: { 
    type: String, 
    required: true, 
    enum: ['login', 'logout', 'course_view', 'assignment_submit', 'forum_post'] // Actions possibles
  },
  timestamp: { 
    type: Date, 
    default: Date.now // Date par défaut = date de l'action
  },
  metadata: {
    ipAddress: String,          // Adresse IP de l'utilisateur
    userAgent: String,          // Informations sur le navigateur / client
    deviceType: String,         // Type d'appareil détecté : mobile, desktop...
    location: {
      country: String,          // Pays détecté
      city: String,             // Ville détectée
      coordinates: {
        lat: Number,            // Latitude
        lng: Number             // Longitude
      }
    },
    resourceId: mongoose.Schema.Types.ObjectId, // Référence vers une ressource (ex : devoir, cours...)
    resourceType: String,       // Type de ressource associée (ex : Assignment, Course)
    additionalData: mongoose.Schema.Types.Mixed // Données complémentaires, flexibles (format libre)
  }
});

// Index pour optimiser les recherches par utilisateur et date
activityLogSchema.index({ userId: 1, timestamp: -1 });

// Index pour rechercher par ressource (utile pour statistiques par cours ou devoir)
activityLogSchema.index({ 'metadata.resourceId': 1, 'metadata.resourceType': 1 });

// Méthode statique pour enregistrer une activité avec des métadonnées structurées
activityLogSchema.statics.logActivity = async function(userId, action, metadata = {}) {
  const log = new this({
    userId,
    action,
    metadata: {
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      deviceType: this.detectDeviceType(metadata.userAgent), // Appel à la fonction de détection
      resourceId: metadata.resourceId,
      resourceType: metadata.resourceType,
      additionalData: metadata.additionalData
    }
  });
  
  return await log.save(); // Enregistrement du journal d’activité
};

// Méthode utilitaire pour détecter le type d'appareil selon le userAgent
activityLogSchema.statics.detectDeviceType = function(userAgent) {
  if (!userAgent) return 'unknown'; // Valeur par défaut
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  if (/windows|linux|mac/i.test(userAgent)) return 'desktop';
  return 'other';
};

// Hook (pré-enregistrement) pour éviter que les métadonnées soient trop volumineuses
activityLogSchema.pre('save', function(next) {
  if (this.metadata && JSON.stringify(this.metadata).length > 5000) {
    this.metadata = { 
      warning: 'Metadata truncated', // Avertissement : métadonnées tronquées
      originalSize: JSON.stringify(this.metadata).length // Taille originale
    };
  }
  next(); // Poursuite de l’enregistrement
});

// Export du modèle Mongoose
module.exports = mongoose.model('ActivityLog', activityLogSchema);
