const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filiere: { type: String, required: true }, // Classe
  annee: { type: String, required: true }, // Niveau d’étude
  dateNaissance: { type: Date, required: false }, 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Student", studentSchema);
