const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

// ✅ Vérifier le token (authentification)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Accès refusé. Pas de token." });
  }

  // ✅ Supporte le format "Bearer token"
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide" });
  }
};

// ✅ Vérifier le rôle (admin, enseignant, étudiant...)
const verifyRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res
        .status(403)
        .json({ message: "Accès refusé. Rôle non autorisé." });
    }
    next();
  };
};

module.exports = { verifyToken, verifyRole };
