/* eslint-disable no-console */
const { loadProjectEnv, getTestUserFromEnv, runCleanDemoData } = require('./demo-user-utils');

async function main() {
  loadProjectEnv();
  const testUser = getTestUserFromEnv();
  const result = await runCleanDemoData();

  console.log('Limpieza demo ejecutada correctamente. Registros detectados:', result.cleaned);
  console.log('Alcance: ids TEST_USER_CLEAN_ID_FROM-TEST_USER_CLEAN_ID_TO, email/usuario del TEST USER y usuarios DEMO/TEST.');
  console.log('Usuario base de referencia:', `${testUser.email} / ${testUser.username}`);
}

main().catch((error) => {
  console.error('No se pudo ejecutar la limpieza demo.');
  console.error(error.message || error);
  process.exitCode = 1;
});
