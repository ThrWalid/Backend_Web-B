//  Import des dépendances
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const cors = require("cors"); // ✅ إضافة CORS
const File = require("../Models/File");

// Charger les variables d'environnement (.env)
dotenv.config();

//  Initialiser Express
const app = express();

// ✅ ✅ Middleware CORS (مهم جداً)
app.use(
  cors({
    origin: "http://localhost:4200", // ✅ frontend ديالك Angular
    credentials: true, // إذا بغيت تبعث cookies أو headers خاصة
  })
);

// ✅ Middleware pour parser les requêtes JSON et URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => console.error("❌ MongoDB erreur :", err));

// ✅ Importer les routes
const authRoutes = require("../routes/auth");
const userRoutes = require("../routes/users");

// ✅ Définir les routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// ✅ Configuration de Multer (Upload de fichiers)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ✅ Endpoint pour uploader un fichier
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { course, uploadedBy } = req.body;
    const { filename, mimetype, size } = req.file;

    const newFile = new File({
      filename,
      mimetype,
      size,
      course,
      uploadedBy,
    });

    await newFile.save();

    res.status(201).json({
      message: "✅ Fichier enregistré avec succès",
      file: newFile,
    });
  } catch (err) {
    console.error("❌ Erreur upload :", err);
    res.status(500).json({ error: "Erreur lors de l'upload" });
  }
});

// ✅ Démarrer le serveur sur le port défini
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
