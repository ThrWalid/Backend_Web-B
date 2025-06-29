const express = require("express");
const router = express.Router();
const Teacher = require("../Models/Teacher");
const User = require("../Models/User");
const bcrypt = require("bcryptjs");
const { verifyToken, verifyRole } = require("../middlewares/middleware");

//  Register Teacher (admin uniquement)
router.post("/register", verifyToken, verifyRole("admin"), async (req, res) => {
  const { username, email, password, specialite, grade, dateNaissance } =
    req.body;

  try {
    // Vérifie si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crée l'utilisateur
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: "enseignant",
    });
    await user.save();

    // Crée le profil enseignant
    const teacher = new Teacher({
      userId: user._id,
      specialite,
      grade,
      dateNaissance,
    });
    await teacher.save();

    res.status(201).json({
      message: "Enseignant créé avec succès",
      teacher,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur création enseignant :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//  Get All Teachers (admin uniquement)
router.get("/", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const teachers = await Teacher.find().populate("userId", "-password");
    res.json(teachers);
  } catch (error) {
    console.error("Erreur récupération enseignants :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//  Update Teacher (admin uniquement)
router.put("/:id", verifyToken, verifyRole("admin"), async (req, res) => {
  const { specialite, grade, dateNaissance } = req.body;

  try {
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { specialite, grade, dateNaissance },
      { new: true, runValidators: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: "Enseignant non trouvé" });
    }

    res.json({
      message: "Enseignant mis à jour avec succès",
      teacher,
    });
  } catch (err) {
    console.error("Erreur update :", err);
    res.status(400).json({ message: "Erreur lors de la mise à jour" });
  }
});

//  Delete Teacher (admin uniquement)
router.delete("/:id", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: "Enseignant non trouvé" });
    }

    // Supprime aussi le user lié
    await User.findByIdAndDelete(teacher.userId);

    res.json({ message: "Enseignant et utilisateur supprimés avec succès" });
  } catch (err) {
    console.error("Erreur suppression :", err);
    res.status(400).json({ message: "Erreur lors de la suppression" });
  }
});

module.exports = router;
