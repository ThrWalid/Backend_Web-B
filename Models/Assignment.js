
const mongoose = require('mongoose');

// Définition du schéma d’un devoir
const assignmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }, // Référence au cours concerné
  title: { type: String, required: true },      // Titre du devoir
  description: String,                          // Description facultative
  dueDate: { type: Date, required: true },      // Date limite de soumission
  maxPoints: { type: Number, required: true, min: 0 }, // Note maximale possible

  // ✅ Champ optionnel pour autoriser une date limite passée
  allowPastDueDate: { type: Boolean, default: false },

  // Tableau de soumissions
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Étudiant ayant soumis
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },    // Référence au fichier envoyé
    submittedAt: { type: Date, default: Date.now },  // Date de soumission
    grade: { type: Number, min: 0 },                 // Note attribuée
    feedback: String,                                // Commentaire du correcteur
    status: { type: String, enum: ['pending', 'graded', 'late'], default: 'pending' } // Statut de la soumission
  }],

  createdAt: { type: Date, default: Date.now } // Date de création du devoir
});

// Index combiné pour faciliter les recherches par cours et date limite
assignmentSchema.index({ courseId: 1, dueDate: 1 });

/**
 * Méthode statique : ajouter une soumission à un devoir
 * Utilisée pour enregistrer une nouvelle soumission d’un étudiant
 */
assignmentSchema.statics.addSubmission = async function(assignmentId, studentId, fileId) {
  const assignment = await this.findById(assignmentId); // Recherche du devoir
  if (!assignment) throw new Error('Assignment not found'); // Erreur si inexistant

  const status = new Date() > assignment.dueDate ? 'late' : 'pending'; // Détection du retard

  // Ajout de la soumission
  assignment.submissions.push({ studentId, fileId, status });
  return await assignment.save(); // Sauvegarde en base
};

/**
 * Méthode statique : corriger une soumission
 * Permet d’attribuer une note, un commentaire et changer le statut
 */
assignmentSchema.statics.gradeSubmission = async function(assignmentId, submissionId, grade, feedback) {
  return this.findOneAndUpdate(
    { _id: assignmentId, 'submissions._id': submissionId }, // Cible la bonne soumission
    {
      $set: {
        'submissions.$.grade': grade,
        'submissions.$.feedback': feedback,
        'submissions.$.status': 'graded' // Passage au statut "corrigé"
      }
    },
    { new: true } // Retourne le document modifié
  );
};

/**
 * Middleware : validation avant sauvegarde
 * Empêche de créer un devoir avec une date limite passée sauf si autorisé
 */
assignmentSchema.pre('save', function(next) {
  if (this.dueDate && this.dueDate < new Date() && !this.allowPastDueDate && this.isNew) {
    throw new Error('Due date cannot be in the past');
  }
  next();
});

/**
 * Méthode statique : mettre à jour le statut des soumissions en retard
 * Passe les soumissions "pending" à "late" si la date limite est dépassée
 */
assignmentSchema.statics.updateLateSubmissions = async function () {
  const now = new Date();
  const assignments = await this.find({ 'dueDate': { $lt: now } });

  for (const assignment of assignments) {
    let modified = false;
    for (const submission of assignment.submissions) {
      if (submission.status === 'pending') {
        submission.status = 'late';
        modified = true;
      }
    }
    if (modified) {
      await assignment.save();
    }
  }
};

/**
 * Méthode statique : statistiques sur les devoirs d’un cours
 * Retourne :
 *  - le nombre total de soumissions
 *  - le nombre de soumissions corrigées
 *  - la moyenne des notes
 */
assignmentSchema.statics.getAssignmentStats = async function(courseId) {
  return this.aggregate([
    { $match: { courseId: mongoose.Types.ObjectId(courseId) } },
    {
      $project: {
        title: 1,
        totalSubmissions: { $size: "$submissions" },
        gradedSubmissions: {
          $size: {
            $filter: {
              input: "$submissions",
              as: "sub",
              cond: { $eq: ["$$sub.status", "graded"] }
            }
          }
        },
        averageGrade: { $avg: "$submissions.grade" }
      }
    }
  ]);
};



// Export du modèle Assignment
module.exports = mongoose.model('Assignment', assignmentSchema);
