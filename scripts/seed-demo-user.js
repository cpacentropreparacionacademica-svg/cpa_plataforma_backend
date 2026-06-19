/* eslint-disable no-console */
const { loadProjectEnv, getTestUserFromEnv, seedDemoUser } = require('./demo-user-utils');

async function main() {
  loadProjectEnv();
  const testUser = getTestUserFromEnv();
  const result = await seedDemoUser();

  console.log('Limpieza demo previa ejecutada. Registros detectados:', result.cleaned);
  console.log('Usuario demo creado/actualizado correctamente.');
  console.log('Email:', testUser.email);
  console.log('Usuario:', testUser.username);
  console.log('Password:', testUser.password);
}

main().catch((error) => {
  console.error('No se pudo ejecutar el seed demo.');
  console.error(error.message || error);
  process.exitCode = 1;
});
