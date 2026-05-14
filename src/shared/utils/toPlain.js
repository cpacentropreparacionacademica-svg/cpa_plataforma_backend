function toPlain(user) {
  if (!user) return null;

  if (typeof user.get === "function") {
    return user.get({ plain: true });
  }

  return { ...user };
}

module.exports = toPlain;