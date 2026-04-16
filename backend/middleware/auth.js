const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Express middleware – verifies JWT and optionally checks role.
 * Usage:
 *   authRequired()          → any logged-in user
 *   authRequired("student") → only students
 *   authRequired(["student","recruiter"]) → either role
 */
function authRequired(role) {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;
      if (!token) return res.status(401).json({ message: "Missing token" });
      const decoded = jwt.verify(token, JWT_SECRET);

      if (role) {
        const allowed = Array.isArray(role) ? role : [role];
        if (!allowed.includes(decoded.role)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      req.auth = decoded;
      next();
    } catch (e) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

/* Convenience aliases */
const isAdmin = authRequired("admin");
const isCollegeAdmin = authRequired("collegeAdmin");
const isStudent = authRequired("student");
const isRecruiter = authRequired("recruiter");
const isAnyAuth = authRequired();

module.exports = {
  signToken,
  authRequired,
  isAdmin,
  isCollegeAdmin,
  isStudent,
  isRecruiter,
  isAnyAuth,
};
