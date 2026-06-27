/* eslint-disable no-console */
const { loadProjectEnv, getOfficialUserFromEnv, runCleanOfficialUserData } = require('./official-user-utils');

async function main() {
  loadProjectEnv();
  const officialUser = getOfficialUserFromEnv();
  const result = await runCleanOfficialUserData();

  console.log('Limpieza de usuario oficial ejecutada correctamente. Registros detectados:', result.cleaned);
  console.log('Alcance: ids TEST_USER_CLEAN_ID_FROM-TEST_USER_CLEAN_ID_TO, email/usuario oficial configurado por entorno.');
  console.log('Usuario base de referencia:', `${officialUser.email} / ${officialUser.username}`);
}

main().catch((error) => {
  console.error('No se pudo ejecutar la limpieza de usuario oficial.');
  console.error(error.message || error);
  process.exitCode = 1;
});
