const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Schéma utilisateur
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "enseignant", "etudiant"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

/////////////////////////////////////////
// Middleware ➝ Avant sauvegarde
/////////////////////////////////////////

userSchema.pre("save", async function (next) {
  try {
    // ➕ Vérification unicité username et email
    const existingUser = await this.constructor.findOne({
      $or: [{ username: this.username }, { email: this.email }],
      _id: { $ne: this._id }, // Exclure soi-même lors d'une update
    });

    if (existingUser) {
      if (existingUser.username === this.username) {
        throw new Error("Nom d’utilisateur déjà utilisé");
      }
      if (existingUser.email === this.email) {
        throw new Error("Email déjà utilisé");
      }
    }

    //  Hash du mot de passe si modifié
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    next();
  } catch (error) {
    next(error);
  }
});

/////////////////////////////////////////
// Méthodes personnalisées
/////////////////////////////////////////

// Comparer le mot de passe avec le hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Mettre à jour la date de dernière connexion
userSchema.statics.updateLastLogin = async function (userId) {
  return this.findByIdAndUpdate(
    userId,
    { lastLogin: new Date() },
    { new: true }
  );
};

// Vérifier l'activité récente d'un utilisateur
userSchema.statics.checkUserActivity = async function (userId) {
  const user = await this.findById(userId).populate("coursesEnrolled");
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const activityCount = await mongoose.model("ActivityLog").countDocuments({
    userId,
    timestamp: { $gte: lastWeek },
  });

  return {
    userId: user._id,
    username: user.username,
    lastLogin: user.lastLogin,
    enrolledCourses: user.coursesEnrolled.length,
    recentActivity: activityCount,
    isActive: activityCount > 3,
  };
};

// Export du modèle
module.exports = mongoose.model("User", userSchema);
