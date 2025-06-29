const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  specialite: { type: String, required: true },
  grade: { type: String, required: true },
  dateNaissance: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Teacher", teacherSchema);
