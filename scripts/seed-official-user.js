/* eslint-disable no-console */
const { loadProjectEnv, getOfficialUserFromEnv, seedOfficialUser } = require('./official-user-utils');

async function main() {
  loadProjectEnv();
  const officialUser = getOfficialUserFromEnv();
  const result = await seedOfficialUser();

  console.log('Limpieza previa de usuario oficial ejecutada. Registros detectados:', result.cleaned);
  console.log('Usuario oficial creado/actualizado correctamente.');
  console.log('Email:', officialUser.email);
  console.log('Usuario:', officialUser.username);
  console.log('Password:', officialUser.password);
}

main().catch((error) => {
  console.error('No se pudo ejecutar el seed de usuario oficial.');
  console.error(error.message || error);
  process.exitCode = 1;
});
