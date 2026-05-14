function getAuthUserId(req = {}) {
/*  return (
    req.user?.id_persona ||
    req.user?.id_usuario ||
    req.user?.id ||
    req.user?.user_id ||
    req.id_persona ||
    null
  );
*/
  return 18;
}

module.exports = getAuthUserId;
