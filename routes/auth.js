const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const Student = require("../Models/Student");
const Teacher = require("../Models/Teacher");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env");
}

const validRoles = ["admin", "enseignant", "etudiant"];

//////////////////////
// 🔐 LOGIN
//////////////////////
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // ✅ Validation basique
  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email incorrect" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//////////////////////
// ✅ REGISTER
//////////////////////
router.post("/register", async (req, res) => {
  const {
    username,
    email,
    password,
    role, // 'etudiant' ou 'enseignant'
    filiere,
    annee,
    specialite,
    grade,
    dateNaissance,
  } = req.body;

  if (!["etudiant", "enseignant"].includes(role)) {
    return res.status(400).json({ message: "Rôle invalide" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();

    if (role === "etudiant") {
      const student = new Student({
        userId: user._id,
        filiere,
        annee,
        dateNaissance,
      });
      await student.save();
    }

    if (role === "enseignant") {
      const teacher = new Teacher({
        userId: user._id,
        specialite,
        grade,
        dateNaissance,
      });
      await teacher.save();
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "Utilisateur enregistré avec succès",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur register:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
