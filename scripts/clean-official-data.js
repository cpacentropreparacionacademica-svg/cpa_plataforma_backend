/* eslint-disable no-console */
const { loadProjectEnv, getOfficialUserFromEnv, runCleanOfficialUserData } = require('./official-user-utils');

async function main() {
  loadProjectEnv();
  const officialUser = getOfficialUserFromEnv({ requirePassword: false });
  const result = await runCleanOfficialUserData();

  console.log('Limpieza de usuario oficial ejecutada correctamente. Registros detectados:', result.cleaned);
  console.log(
    `Alcance: id_persona ${process.env.TEST_USER_CLEAN_ID_FROM || 900001}-${process.env.TEST_USER_CLEAN_ID_TO || 900099}`
      + ', más el id exacto del usuario oficial. La limpieza se aborta si alcanzara a más de una persona.',
  );
  console.log('Usuario base de referencia:', `${officialUser.email} / ${officialUser.username}`);
}

main().catch((error) => {
  console.error('No se pudo ejecutar la limpieza de usuario oficial.');
  console.error(error.message || error);
  process.exitCode = 1;
});
