const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/server-config');

class JWTUtil {
  static async generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
  }

  static async verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }
}

module.exports = JWTUtil;
