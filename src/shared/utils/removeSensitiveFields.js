function removeSensitiveFields(user) {
  if (!user) return null;

  const safeUser = { ...user };

  delete safeUser.password;
  delete safeUser.password_hash;
  delete safeUser.passwordHash;
  delete safeUser.contrasena_hash;
  delete safeUser.token_hash;
  delete safeUser.token;
  delete safeUser.token_plain;

  if (safeUser.persona && typeof safeUser.persona === "object") {
    safeUser.persona = { ...safeUser.persona };
    delete safeUser.persona.password;
    delete safeUser.persona.password_hash;
    delete safeUser.persona.passwordHash;
    delete safeUser.persona.contrasena_hash;
  }

  return safeUser;
}

module.exports = removeSensitiveFields;
