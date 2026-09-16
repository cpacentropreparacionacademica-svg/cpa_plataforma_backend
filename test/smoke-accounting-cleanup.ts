import { DataSource } from 'typeorm';

/**
 * Borra los asientos que generó el smoke.
 *
 * Desde la migración 014 un asiento no se borra: se corrige con un reverso, y
 * dos triggers lo imponen. Esa regla es la correcta para contabilidad real,
 * pero deja a esta suite sin forma de limpiar lo que crea, y cada corrida
 * rompía la siguiente (la limpieza de entrada fallaba por la FK de
 * `transaccion` hacia la clase). Revertir tampoco sirve: el reverso es otro
 * asiento que queda en la base.
 *
 * Por eso los triggers se desactivan sólo dentro de esta transacción. `ALTER
 * TABLE` es transaccional en PostgreSQL: si algo falla, el ROLLBACK los deja
 * activos. Y la suite ya se niega a correr contra una base que no sea local
 * (`assertSmokeTargetIsLocal`), así que esto nunca toca un libro real.
 */
const ACCOUNTING_GUARD_TRIGGERS = [
  ['contabilidad.transaccion_movimiento_cuenta', 'trg_proteger_movimiento_contable'],
  ['contabilidad.transaccion', 'trg_proteger_cabecera_asiento'],
  // Al quitar los movimientos, el asiento queda momentáneamente sin ellos y el
  // balanceo lo rechaza antes de que se borre la cabecera.
  ['contabilidad.transaccion_movimiento_cuenta', 'trg_validar_asiento_balanceado'],
] as const;

export async function deleteSmokeAsientos(dataSource: DataSource, transaccionIds: number[]): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    for (const [table, trigger] of ACCOUNTING_GUARD_TRIGGERS) {
      await queryRunner.query(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    }
    for (const table of [
      'contabilidad.transaccion_movimiento_cuenta',
      'contabilidad.transaccion_detalle_venta',
      'contabilidad.transaccion',
    ]) {
      await queryRunner.query(`DELETE FROM ${table} WHERE id_transaccion = ANY($1)`, [transaccionIds]);
    }
    // El trigger de balanceo es DEFERRABLE INITIALLY DEFERRED: con sus eventos
    // aún pendientes, PostgreSQL rechaza el ALTER TABLE que reactiva la
    // protección («has pending trigger events»). Se evalúan aquí.
    await queryRunner.query('SET CONSTRAINTS ALL IMMEDIATE');
    for (const [table, trigger] of ACCOUNTING_GUARD_TRIGGERS) {
      await queryRunner.query(`ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`);
    }
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
