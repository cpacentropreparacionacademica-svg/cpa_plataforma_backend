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
  // La contraseña no se imprime: la salida de estos scripts acaba en registros de consola
  // y en los logs de CI. Quien ejecuta el seed ya conoce el valor que proporcionó.
  console.log('Contraseña: la definida en TEST_USER_PASSWORD (no se muestra).');
}

main().catch((error) => {
  console.error('No se pudo ejecutar el seed de usuario oficial.');
  console.error(error.message || error);
  process.exitCode = 1;
});
