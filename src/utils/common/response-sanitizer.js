class ResponseSanitizer {
  static sanitizeUser(data) {
    // Handle both array and single object cases
    if (Array.isArray(data)) {
      return data.map((user) => this.sanitizeSingleUser(user));
    }
    return this.sanitizeSingleUser(data);
  }

  static sanitizeSingleUser(user) {
    // Add null check to prevent errors
    if (!user) return null;

    return {
      id: user.id, // Consider keeping id for reference
      username: user.username,
      email: user.email,
      role: user.role
        ? {
            name: user.role.name,
            permissions: user.role.permissions,
          }
        : null,
    };
  }
}

module.exports = ResponseSanitizer;
