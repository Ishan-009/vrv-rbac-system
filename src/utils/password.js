const bcrypt = require('bcryptjs');

class PasswordUtil {
  static async hash(password) {
    return bcrypt.hashSync(password, 10);
  }

  static async verify(password, hash) {
    return bcrypt.compare(password, hash);
  }
}

module.exports = PasswordUtil;
