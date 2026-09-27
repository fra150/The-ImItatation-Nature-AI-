// src/middleware/rbac.js
//
// Controllo dei ruoli sulle mutazioni. Va SEMPRE eseguito DOPO `auth`
// (legge req.userRole, valorizzato da auth.js dopo la verifica del JWT) — non
// sostituisce l'autenticazione, la completa.
module.exports = function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ message: 'Missing token' });
    }
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ message: `Requires role: ${allowedRoles.join(' or ')}` });
    }
    next();
  };
};
