const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRY } = require('../config/server-config');

class JWTUtil {
  static async generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  }

  static async verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }
}

module.exports = JWTUtil;
