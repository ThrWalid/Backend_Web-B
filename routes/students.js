const express = require("express");
const router = express.Router();
const Student = require("../Models/Student");
const User = require("../Models/User");
const bcrypt = require("bcryptjs");
const { verifyToken, verifyRole } = require("../middlewares/middleware");

// ✅ Register student (Admin uniquement)
router.post("/register", verifyToken, verifyRole("admin"), async (req, res) => {
  const { username, email, password, filiere, annee, dateNaissance } = req.body;

  try {
    // ✅ Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user account
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: "etudiant",
    });

    await user.save();

    // ✅ Create student profile avec dateNaissance
    const student = new Student({
      userId: user._id,
      filiere,
      annee,
      dateNaissance, //
    });
    await student.save();

    res.status(201).json({
      message: "Étudiant créé avec succès",
      student,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur création étudiant :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Get all students (Admin uniquement)
router.get("/", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const students = await Student.find().populate("userId", "-password");
    res.json(students);
  } catch (error) {
    console.error("Erreur récupération étudiants :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Update student (Admin uniquement)
router.put("/:id", verifyToken, verifyRole("admin"), async (req, res) => {
  const { filiere, annee, dateNaissance } = req.body;

  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { filiere, annee, dateNaissance },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Étudiant non trouvé" });
    }

    res.json({
      message: "Étudiant mis à jour avec succès",
      student,
    });
  } catch (err) {
    console.error("Erreur update :", err);
    res.status(400).json({ message: "Erreur lors de la mise à jour" });
  }
});

// ✅ Delete student (Admin uniquement)
router.delete("/:id", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: "Étudiant non trouvé" });
    }

    // ✅ Supprimer aussi le user lié
    await User.findByIdAndDelete(student.userId);

    res.json({ message: "Étudiant et utilisateur supprimés avec succès" });
  } catch (err) {
    console.error("Erreur suppression :", err);
    res.status(400).json({ message: "Erreur lors de la suppression" });
  }
});

module.exports = router;
