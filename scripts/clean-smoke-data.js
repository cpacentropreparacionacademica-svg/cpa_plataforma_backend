/* eslint-disable no-console */
/**
 * Barre los residuos que dejaron corridas anteriores de los smokes.
 *
 * Hasta ahora `smoke.full` limpiaba sus personas pero no la infraestructura ni
 * los asientos contables que creaba, así que cada corrida sumaba una sucursal,
 * un edificio, un aula y una transacción nuevos —el código lleva sufijo
 * `Date.now()`, de modo que nunca colisionaban y se acumulaban—. La suite ya
 * quedó corregida; este script existe para el arrastre que quedó en la base.
 *
 * Uso:
 *   node scripts/clean-smoke-data.js            # solo cuenta, no borra
 *   node scripts/clean-smoke-data.js --apply    # borra de verdad
 *
 * Sin `--apply` no ejecuta ningún DELETE: informa cuánto encontraría, para poder
 * revisar el alcance antes de tocar la base.
 *
 * Cada consulta filtra por un marcador que solo produce el smoke ('SMOKE FULL',
 * 'SMOKE_FULL', 'SMOKE IMPORT %', códigos 'SMOKE-FULL-*', urls
 * 'https://smoke.cpa/%'). Nunca por rango de ids ni por fecha, para que no pueda
 * alcanzar datos reales.
 */
const { createSecurePgClient } = require('./seed-security');
const { loadProjectEnv } = require('./official-user-utils');

const PERSONAS_SMOKE = `SELECT id_persona FROM persona.persona WHERE nombres = 'SMOKE FULL'`;
const TUTORES_SMOKE = `
  SELECT t.id_tutor
    FROM persona.persona_tutor t
    JOIN persona.persona p ON p.id_persona = t.id_persona
   WHERE p.nombres = 'SMOKE FULL'`;
const VENTAS_SMOKE = `
  SELECT DISTINCT id_transaccion
    FROM contabilidad.venta_clase_registro
   WHERE situacion_base = 'SMOKE_FULL'
      OR estudiante_texto LIKE 'SMOKE FULL%'
      OR tutor_texto LIKE 'SMOKE FULL%'`;

/**
 * Orden hijo → padre. Invertirlo hace que la FK aborte el borrado y los datos
 * se queden donde estaban.
 */
const STEPS = [
  {
    label: 'contabilidad.transaccion_movimiento_cuenta',
    where: `id_transaccion IN (${VENTAS_SMOKE})`,
  },
  {
    label: 'contabilidad.transaccion_detalle_venta',
    where: `id_transaccion IN (${VENTAS_SMOKE})`,
  },
  {
    label: 'contabilidad.venta_clase_registro',
    where: `situacion_base = 'SMOKE_FULL' OR estudiante_texto LIKE 'SMOKE FULL%' OR tutor_texto LIKE 'SMOKE FULL%'`,
  },
  {
    label: 'contabilidad.transaccion',
    // Se resuelve antes de borrar venta_clase_registro; ver runStep.
    where: null,
    dependsOnTransacciones: true,
  },
  {
    label: 'contabilidad.cuenta_asignacion',
    where: `id_persona_estudiante IN (${PERSONAS_SMOKE}) OR id_persona_tutor IN (${TUTORES_SMOKE})`,
  },
  // Todo lo que referencia a persona_tutor/persona_estudiante y bloquearía su
  // borrado. `clase_por_hora` fue la que abortó el primer intento de limpieza.
  // `clase_curso.id_tutor` no está aquí a propósito: su FK es ON DELETE SET
  // NULL, así que no bloquea y no hay por qué borrar la clase.
  {
    label: 'contabilidad.pago_tutor_detalle',
    where: `id_pago_tutor IN (SELECT id_pago_tutor FROM contabilidad.pago_tutor WHERE id_tutor IN (${TUTORES_SMOKE}))`,
  },
  { label: 'contabilidad.pago_tutor', where: `id_tutor IN (${TUTORES_SMOKE})` },
  {
    label: 'servicios_educativos.clase_por_hora',
    where: `id_estudiante IN (${PERSONAS_SMOKE}) OR id_tutor IN (${TUTORES_SMOKE})`,
  },
  { label: 'servicios_educativos.asistencia_clase_curso', where: `id_estudiante IN (${PERSONAS_SMOKE})` },
  { label: 'persona.estudiante_padre', where: `id_estudiante IN (${PERSONAS_SMOKE})` },
  { label: 'persona.persona_tutor', where: `id_persona IN (${PERSONAS_SMOKE})` },
  { label: 'persona.persona_estudiante', where: `id_persona IN (${PERSONAS_SMOKE})` },
  { label: 'persona.persona', where: `nombres = 'SMOKE FULL'` },
  { label: 'infraestructura.espacio', where: `nombre = 'Aula Smoke Full'` },
  { label: 'infraestructura.edificio', where: `codigo LIKE 'SMOKE-FULL-EDI-%'` },
  { label: 'infraestructura.sucursal', where: `codigo LIKE 'SMOKE-FULL-SUC-%'` },
  { label: 'persona.unidad_educativa', where: `nombre LIKE 'SMOKE IMPORT %'` },
  {
    label: 'contabilidad.archivo_transaccion',
    where: `id_archivo IN (SELECT id_archivo FROM contabilidad.archivo WHERE url_archivo LIKE 'https://smoke.cpa/%')`,
  },
  { label: 'contabilidad.archivo', where: `url_archivo LIKE 'https://smoke.cpa/%'` },
];

async function main() {
  loadProjectEnv();
  const apply = process.argv.includes('--apply');
  const client = createSecurePgClient('cpa-clean-smoke');
  await client.connect();

  console.log(`Base: ${process.env.PGHOST}/${process.env.PGDATABASE}`);
  console.log(apply ? 'Modo: BORRADO REAL (--apply)' : 'Modo: solo conteo. Agrega --apply para borrar.');
  console.log('');

  // La transacción contable deja de ser localizable en cuanto se borra el
  // registro de venta-clase que la referencia: sus ids se anotan antes.
  const transacciones = (await client.query(VENTAS_SMOKE)).rows
    .map((row) => row.id_transaccion)
    .filter((id) => id !== null);

  let total = 0;

  try {
    if (apply) await client.query('BEGIN');

    for (const step of STEPS) {
      const where = step.dependsOnTransacciones
        ? transacciones.length && `id_transaccion = ANY($1)`
        : step.where;
      if (!where) {
        console.log('   0  ' + step.label);
        continue;
      }
      const params = step.dependsOnTransacciones ? [transacciones] : [];

      const affected = apply
        ? (await client.query(`DELETE FROM ${step.label} WHERE ${where}`, params)).rowCount
        : (await client.query(`SELECT COUNT(*)::int AS total FROM ${step.label} WHERE ${where}`, params)).rows[0].total;

      total += affected;
      console.log(String(affected).padStart(4) + '  ' + step.label);
    }

    if (apply) await client.query('COMMIT');
  } catch (error) {
    if (apply) await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }

  console.log('');
  console.log(apply ? `Filas borradas: ${total}` : `Filas que se borrarian: ${total}`);
  if (!apply && total > 0) console.log('Vuelve a ejecutarlo con --apply para borrarlas.');
}

main().catch((error) => {
  console.error('No se pudo limpiar los datos de smoke.');
  console.error(error.message || error);
  process.exitCode = 1;
});
