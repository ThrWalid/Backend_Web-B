const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    filiere: { type: String, required: true },
    annee: { type: String, required: true },
    dateNaissance: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
