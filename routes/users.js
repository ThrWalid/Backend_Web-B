const express = require("express");
const router = express.Router();
const { User, ROLES } = require("../Models/User");
const { verifyToken, verifyRole } = require("../middlewares/middleware");

//  Liste des rôles valides
const validRoles = ROLES;

//  Get All Users ➝ uniquement admin
router.get("/", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.json(users);
  } catch (error) {
    console.error("[ ERROR] Get Users:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

//  Get User by ID ➝ uniquement admin
router.get("/:id", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    return res.json(user);
  } catch (error) {
    console.error("[ ERROR] Get User by ID:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

//  Delete User ➝ uniquement admin
router.delete("/:id", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    return res.json({ message: "✅ Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error("[ ERROR] Delete User:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

//  Modifier le rôle d'un utilisateur ➝ uniquement admin
router.patch(
  "/:id/role",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    const { role } = req.body;

    //  Validation du rôle
    if (
      !role ||
      typeof role !== "string" ||
      !validRoles.includes(role.trim().toLowerCase())
    ) {
      return res.status(400).json({
        message:
          " Rôle invalide. Les rôles valides sont : " + validRoles.join(", "),
      });
    }

    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { role: role.trim().toLowerCase() },
        { new: true }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      return res.json({
        message: "Rôle mis à jour avec succès",
        user: updatedUser,
      });
    } catch (error) {
      console.error("[ERROR] Update Role:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

module.exports = router;
