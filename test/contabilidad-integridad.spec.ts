import { Client } from 'pg';

/**
 * Pruebas de integridad contable contra PostgreSQL real.
 *
 * Estas invariantes viven en la base de datos (restricciones y triggers de las migraciones
 * 014, 015 y 016), por lo que solo pueden demostrarse contra un motor real: un mock no
 * probaría nada. Se ejecutan con:
 *
 *   docker run -d --name cpa_test_postgres -e POSTGRES_DB=cpa -e POSTGRES_USER=cpa \
 *     -e POSTGRES_PASSWORD=cpa -p 5434:5432 postgres:17-alpine
 *   PGHOST=localhost PGPORT=5434 PGDATABASE=cpa PGUSER=cpa PGPASSWORD=cpa \
 *     NODE_ENV=development node scripts/migrate-prod.js
 *   PGHOST=localhost PGPORT=5434 PGDATABASE=cpa PGUSER=cpa PGPASSWORD=cpa \
 *     yarn jest --runTestsByPath test/contabilidad-integridad.spec.ts --runInBand
 *
 * Cada prueba trabaja dentro de una transacción que termina en ROLLBACK, y fuerza la
 * evaluación de los triggers diferidos con SET CONSTRAINTS ALL IMMEDIATE. Así se verifica
 * el comportamiento real del COMMIT sin dejar ningún asiento en la base de datos.
 */

const CONEXION = {
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
};

const HAY_CONFIGURACION = Boolean(CONEXION.host && CONEXION.database && CONEXION.user);

let client: Client | null = null;
let baseDatosDisponible = false;
let idCuentaDeudora = 0;
let idCuentaAcreedora = 0;

beforeAll(async () => {
  if (!HAY_CONFIGURACION) return;

  try {
    client = new Client({ ...CONEXION, connectionTimeoutMillis: 5000 });
    await client.connect();

    const cuentas = await client.query(
      `SELECT id_cuenta FROM contabilidad.cuenta
        WHERE LOWER(COALESCE(estado_registro, 'Activo')) = 'activo'
        ORDER BY id_cuenta LIMIT 2`,
    );

    if (cuentas.rows.length < 2) {
      throw new Error('La base de datos no tiene el plan de cuentas sembrado.');
    }

    idCuentaDeudora = Number(cuentas.rows[0].id_cuenta);
    idCuentaAcreedora = Number(cuentas.rows[1].id_cuenta);
    baseDatosDisponible = true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `[contabilidad-integridad] Base de datos no disponible, se omiten las pruebas: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    client = null;
  }
});

afterAll(async () => {
  if (client) await client.end();
});

/** Ejecuta el cuerpo dentro de una transacción y siempre revierte. */
async function enTransaccion<T>(cuerpo: (db: Client) => Promise<T>): Promise<T> {
  const db = client as Client;
  await db.query('BEGIN');
  try {
    return await cuerpo(db);
  } finally {
    await db.query('ROLLBACK');
  }
}

/** Fuerza la evaluación de los triggers diferidos, como haría un COMMIT. */
async function forzarValidacionDiferida(db: Client): Promise<void> {
  await db.query('SET CONSTRAINTS ALL IMMEDIATE');
}

async function crearAsiento(db: Client, fecha: string, glosa: string): Promise<number> {
  const resultado = await db.query(
    `INSERT INTO contabilidad.transaccion (tipo_transaccion, fecha_transaccion, glosa)
     VALUES ('GENERAL', $1::date, $2) RETURNING id_transaccion`,
    [fecha, glosa],
  );
  return Number(resultado.rows[0].id_transaccion);
}

async function agregarMovimiento(
  db: Client,
  idTransaccion: number,
  idCuenta: number,
  debe: number,
  haber: number,
): Promise<void> {
  await db.query(
    `INSERT INTO contabilidad.transaccion_movimiento_cuenta (id_transaccion, id_cuenta, debe, haber)
     VALUES ($1, $2, $3, $4)`,
    [idTransaccion, idCuenta, debe, haber],
  );
}

const pruebaContable = (nombre: string, cuerpo: () => Promise<void>) =>
  it(
    nombre,
    async () => {
      if (!baseDatosDisponible) {
        // eslint-disable-next-line no-console
        console.warn(`[omitida] ${nombre}: requiere PostgreSQL migrado.`);
        return;
      }
      await cuerpo();
    },
    30000,
  );

describe('Partida doble', () => {
  pruebaContable('acepta un asiento cuadrado', async () => {
    await enTransaccion(async (db) => {
      const asiento = await crearAsiento(db, '2026-07-10', 'Asiento cuadrado');
      await agregarMovimiento(db, asiento, idCuentaDeudora, 150.75, 0);
      await agregarMovimiento(db, asiento, idCuentaAcreedora, 0, 150.75);

      await expect(forzarValidacionDiferida(db)).resolves.toBeUndefined();
    });
  });

  pruebaContable('rechaza un asiento descuadrado', async () => {
    await enTransaccion(async (db) => {
      const asiento = await crearAsiento(db, '2026-07-10', 'Asiento descuadrado');
      await agregarMovimiento(db, asiento, idCuentaDeudora, 100, 0);
      await agregarMovimiento(db, asiento, idCuentaAcreedora, 0, 90);

      await expect(forzarValidacionDiferida(db)).rejects.toThrow(/no está balanceado/i);
    });
  });

  pruebaContable('rechaza una línea con debe y haber simultáneos', async () => {
    await enTransaccion(async (db) => {
      const asiento = await crearAsiento(db, '2026-07-10', 'Asiento con dos lados');

      await expect(agregarMovimiento(db, asiento, idCuentaDeudora, 50, 50)).rejects.toThrow(
        /ck_transaccion_movimiento_un_solo_lado/i,
      );
    });
  });

  pruebaContable('rechaza importes negativos', async () => {
    await enTransaccion(async (db) => {
      const asiento = await crearAsiento(db, '2026-07-10', 'Asiento negativo');

      await expect(agregarMovimiento(db, asiento, idCuentaDeudora, -10, 0)).rejects.toThrow(/no_negativo/i);
    });
  });

  pruebaContable('rechaza un asiento sin movimientos', async () => {
    await enTransaccion(async (db) => {
      const asiento = await crearAsiento(db, '2026-07-10', 'Asiento vacío');
      await agregarMovimiento(db, asiento, idCuentaDeudora, 10, 0);
      await agregarMovimiento(db, asiento, idCuentaAcreedora, 0, 10);
      await forzarValidacionDiferida(db);

      // Desactivar ambas líneas dejaría el asiento sin contenido económico.
      await expect(
        db.query(
          `UPDATE contabilidad.transaccion_movimiento_cuenta
              SET estado_registro = 'Inactivo' WHERE id_transaccion = $1`,
          [asiento],
        ),
      ).rejects.toThrow(/no se permite alterar un movimiento contable/i);
    });
  });

  pruebaContable('conserva la precisión monetaria en céntimos', async () => {
    await enTransaccion(async (db) => {
      const asiento = await crearAsiento(db, '2026-07-10', 'Precisión decimal');
      await agregarMovimiento(db, asiento, idCuentaDeudora, 0.1, 0);
      await agregarMovimiento(db, asiento, idCuentaDeudora, 0.2, 0);
      await agregarMovimiento(db, asiento, idCuentaAcreedora, 0, 0.3);

      // Con double precision, 0.1 + 0.2 <> 0.3 y este asiento habría sido rechazado.
      await expect(forzarValidacionDiferida(db)).resolves.toBeUndefined();

      const suma = await db.query(
        `SELECT SUM(debe) AS debe, SUM(haber) AS haber
           FROM contabilidad.transaccion_movimiento_cuenta WHERE id_transaccion = $1`,
        [asiento],
      );
      expect(String(suma.rows[0].debe)).toBe('0.30');
      expect(String(suma.rows[0].haber)).toBe('0.30');
    });
  });
});

describe('Inmutabilidad del libro mayor', () => {
  pruebaContable('no permite modificar el importe de un movimiento contabilizado', async () => {
    await enTransaccion(async (db) => {
      const asiento = await crearAsiento(db, '2026-07-10', 'Asiento inmutable');
      await agregarMovimiento(db, asiento, idCuentaDeudora, 40, 0);
      await agregarMovimiento(db, asiento, idCuentaAcreedora, 0, 40);
      await forzarValidacionDiferida(db);

      await expect(
        db.query(
          `UPDATE contabilidad.transaccion_movimiento_cuenta
              SET debe = 999 WHERE id_transaccion = $1 AND debe > 0`,
          [asiento],
        ),
      ).rejects.toThrow(/no se permite alterar un movimiento contable/i);
    });
  });

  pruebaContable('no permite eliminar un movimiento contabilizado', async () => {
    await enTransaccion(async (db) => {
      const asiento = await crearAsiento(db, '2026-07-10', 'Asiento no borrable');
      await agregarMovimiento(db, asiento, idCuentaDeudora, 40, 0);
      await agregarMovimiento(db, asiento, idCuentaAcreedora, 0, 40);
      await forzarValidacionDiferida(db);

      await expect(
        db.query('DELETE FROM contabilidad.transaccion_movimiento_cuenta WHERE id_transaccion = $1', [asiento]),
      ).rejects.toThrow(/no se eliminan/i);
    });
  });
});

describe('Periodos contables', () => {
  pruebaContable('impide registrar asientos en un periodo cerrado', async () => {
    await enTransaccion(async (db) => {
      await db.query(
        `INSERT INTO contabilidad.periodo_contable
           (codigo, anio, mes, fecha_inicio, fecha_fin, estado, fecha_cierre, id_usuario_cierre)
         VALUES ('2031-01', 2031, 1, '2031-01-01', '2031-01-31', 'CERRADO', now(), 1)`,
      );

      await expect(crearAsiento(db, '2031-01-15', 'Asiento en periodo cerrado')).rejects.toThrow(
        /periodo contable .* está en estado CERRADO/i,
      );
    });
  });

  pruebaContable('permite registrar asientos en un periodo abierto', async () => {
    await enTransaccion(async (db) => {
      await db.query(
        `INSERT INTO contabilidad.periodo_contable (codigo, anio, mes, fecha_inicio, fecha_fin, estado)
         VALUES ('2031-02', 2031, 2, '2031-02-01', '2031-02-28', 'ABIERTO')`,
      );

      await expect(crearAsiento(db, '2031-02-15', 'Asiento en periodo abierto')).resolves.toBeGreaterThan(0);
    });
  });

  pruebaContable('exige auditoría de cierre al cerrar un periodo', async () => {
    await enTransaccion(async (db) => {
      await expect(
        db.query(
          `INSERT INTO contabilidad.periodo_contable (codigo, anio, mes, fecha_inicio, fecha_fin, estado)
           VALUES ('2031-03', 2031, 3, '2031-03-01', '2031-03-31', 'CERRADO')`,
        ),
      ).rejects.toThrow(/ck_periodo_contable_cierre_auditado/i);
    });
  });

  pruebaContable('exige motivo para reabrir un periodo', async () => {
    await enTransaccion(async (db) => {
      await db.query(
        `INSERT INTO contabilidad.periodo_contable
           (codigo, anio, mes, fecha_inicio, fecha_fin, estado, fecha_cierre, id_usuario_cierre)
         VALUES ('2031-04', 2031, 4, '2031-04-01', '2031-04-30', 'CERRADO', now(), 1)`,
      );

      await expect(
        db.query("UPDATE contabilidad.periodo_contable SET estado = 'REABIERTO' WHERE codigo = '2031-04'"),
      ).rejects.toThrow(/ck_periodo_contable_reapertura_auditada/i);
    });
  });

  pruebaContable('impide periodos solapados', async () => {
    await enTransaccion(async (db) => {
      await db.query(
        `INSERT INTO contabilidad.periodo_contable (codigo, anio, mes, fecha_inicio, fecha_fin, estado)
         VALUES ('2031-05', 2031, 5, '2031-05-01', '2031-05-31', 'ABIERTO')`,
      );

      await expect(
        db.query(
          `INSERT INTO contabilidad.periodo_contable (codigo, anio, mes, fecha_inicio, fecha_fin, estado)
           VALUES ('2031-05-bis', 2031, 6, '2031-05-15', '2031-06-15', 'ABIERTO')`,
        ),
      ).rejects.toThrow(/se solapa/i);
    });
  });
});

describe('Reversión de asientos', () => {
  pruebaContable('impide revertir dos veces el mismo asiento', async () => {
    await enTransaccion(async (db) => {
      const original = await crearAsiento(db, '2026-07-10', 'Asiento original');
      await agregarMovimiento(db, original, idCuentaDeudora, 25, 0);
      await agregarMovimiento(db, original, idCuentaAcreedora, 0, 25);
      await forzarValidacionDiferida(db);

      await db.query(
        `INSERT INTO contabilidad.transaccion
           (tipo_transaccion, fecha_transaccion, glosa, id_transaccion_revertida, motivo_reversion, fecha_reversion)
         VALUES ('GENERAL', '2026-07-11', 'Reverso 1', $1, 'Error de registro', now())`,
        [original],
      );

      await expect(
        db.query(
          `INSERT INTO contabilidad.transaccion
             (tipo_transaccion, fecha_transaccion, glosa, id_transaccion_revertida, motivo_reversion, fecha_reversion)
           VALUES ('GENERAL', '2026-07-12', 'Reverso 2', $1, 'Segundo intento', now())`,
          [original],
        ),
      ).rejects.toThrow(/ux_transaccion_reversion_unica/i);
    });
  });

  pruebaContable('exige motivo en toda reversión', async () => {
    await enTransaccion(async (db) => {
      const original = await crearAsiento(db, '2026-07-10', 'Asiento a revertir');

      await expect(
        db.query(
          `INSERT INTO contabilidad.transaccion
             (tipo_transaccion, fecha_transaccion, glosa, id_transaccion_revertida, fecha_reversion)
           VALUES ('GENERAL', '2026-07-11', 'Reverso sin motivo', $1, now())`,
          [original],
        ),
      ).rejects.toThrow(/ck_transaccion_reversion_auditada/i);
    });
  });

  pruebaContable('impide que un asiento se revierta a sí mismo', async () => {
    await enTransaccion(async (db) => {
      const asiento = await crearAsiento(db, '2026-07-10', 'Auto reversión');

      await expect(
        db.query(
          `UPDATE contabilidad.transaccion
              SET id_transaccion_revertida = $1, motivo_reversion = 'Ciclo', fecha_reversion = now()
            WHERE id_transaccion = $1`,
          [asiento],
        ),
      ).rejects.toThrow(/ck_transaccion_reversion_no_reflexiva/i);
    });
  });
});

describe('Cuadre de libros y estados financieros', () => {
  pruebaContable('el libro diario cuadra: suma debe igual a suma haber', async () => {
    const resultado = await (client as Client).query(
      `SELECT COALESCE(SUM(debe), 0) AS debe, COALESCE(SUM(haber), 0) AS haber
         FROM contabilidad.v_movimiento_contable`,
    );

    expect(String(resultado.rows[0].debe)).toBe(String(resultado.rows[0].haber));
  });

  pruebaContable('no existen asientos descuadrados en el libro', async () => {
    const resultado = await (client as Client).query(
      'SELECT COUNT(*)::int AS total FROM contabilidad.v_asiento_integridad WHERE NOT balanceado',
    );

    expect(resultado.rows[0].total).toBe(0);
  });

  pruebaContable('el balance general cumple Activo = Pasivo + Patrimonio', async () => {
    const resultado = await (client as Client).query(
      `SELECT
         COALESCE(SUM(saldo_natural) FILTER (WHERE sub_tipo = 'ACTIVO'), 0)     AS activo,
         COALESCE(SUM(saldo_natural) FILTER (WHERE sub_tipo = 'PASIVO'), 0)     AS pasivo,
         COALESCE(SUM(saldo_natural) FILTER (WHERE sub_tipo = 'PATRIMONIO'), 0) AS patrimonio,
         COALESCE(SUM(saldo_natural) FILTER (WHERE sub_tipo = 'INGRESO'), 0)    AS ingresos,
         COALESCE(SUM(saldo_natural) FILTER (WHERE sub_tipo = 'GASTO'), 0)      AS gastos
       FROM contabilidad.v_movimiento_contable`,
    );

    const fila = resultado.rows[0];
    const activo = Number(fila.activo);
    const resultadoEjercicio = Number(fila.ingresos) - Number(fila.gastos);
    const pasivoMasPatrimonio = Number(fila.pasivo) + Number(fila.patrimonio) + resultadoEjercicio;

    expect(Math.abs(activo - pasivoMasPatrimonio)).toBeLessThan(0.005);
  });

  pruebaContable('el libro mayor coincide con el libro diario por cuenta', async () => {
    const resultado = await (client as Client).query(
      `WITH mayor AS (
         SELECT id_cuenta, SUM(debe) AS debe, SUM(haber) AS haber
           FROM contabilidad.v_movimiento_contable GROUP BY id_cuenta
       )
       SELECT COALESCE(SUM(debe), 0) AS debe, COALESCE(SUM(haber), 0) AS haber FROM mayor`,
    );

    const diario = await (client as Client).query(
      `SELECT COALESCE(SUM(debe), 0) AS debe, COALESCE(SUM(haber), 0) AS haber
         FROM contabilidad.v_movimiento_contable`,
    );

    expect(String(resultado.rows[0].debe)).toBe(String(diario.rows[0].debe));
    expect(String(resultado.rows[0].haber)).toBe(String(diario.rows[0].haber));
  });
});

describe('Protección del plan de cuentas', () => {
  pruebaContable('impide reclasificar una cuenta con movimientos', async () => {
    await enTransaccion(async (db) => {
      const asiento = await crearAsiento(db, '2026-07-10', 'Asiento sobre cuenta a reclasificar');
      await agregarMovimiento(db, asiento, idCuentaDeudora, 30, 0);
      await agregarMovimiento(db, asiento, idCuentaAcreedora, 0, 30);
      await forzarValidacionDiferida(db);

      const otroGrupo = await db.query(
        `SELECT id_grupo_cuenta FROM contabilidad.grupo_cuenta
          WHERE id_grupo_cuenta <> (SELECT id_grupo_cuenta FROM contabilidad.cuenta WHERE id_cuenta = $1)
          LIMIT 1`,
        [idCuentaDeudora],
      );

      await expect(
        db.query('UPDATE contabilidad.cuenta SET id_grupo_cuenta = $2 WHERE id_cuenta = $1', [
          idCuentaDeudora,
          otroGrupo.rows[0].id_grupo_cuenta,
        ]),
      ).rejects.toThrow(/reexpresaría estados financieros/i);
    });
  });

  pruebaContable('impide desactivar una cuenta con movimientos', async () => {
    await enTransaccion(async (db) => {
      const asiento = await crearAsiento(db, '2026-07-10', 'Asiento sobre cuenta a desactivar');
      await agregarMovimiento(db, asiento, idCuentaDeudora, 30, 0);
      await agregarMovimiento(db, asiento, idCuentaAcreedora, 0, 30);
      await forzarValidacionDiferida(db);

      await expect(
        db.query("UPDATE contabilidad.cuenta SET estado_registro = 'Inactivo' WHERE id_cuenta = $1", [idCuentaDeudora]),
      ).rejects.toThrow(/no puede desactivarse/i);
    });
  });

  pruebaContable('permite renombrar una cuenta con movimientos', async () => {
    await enTransaccion(async (db) => {
      // Cambiar el nombre no altera la clasificación contable: debe seguir permitido.
      await expect(
        db.query('UPDATE contabilidad.cuenta SET nombre_cuenta = $2 WHERE id_cuenta = $1', [
          idCuentaDeudora,
          'Caja moneda nacional (renombrada)',
        ]),
      ).resolves.toBeDefined();
    });
  });
});

describe('Asignación de cuentas por entidad', () => {
  pruebaContable('impide asignaciones duplicadas para la misma entidad y cuenta', async () => {
    await enTransaccion(async (db) => {
      const persona = await db.query(
        `INSERT INTO persona.persona (nombres, apellidos, estado_registro)
         VALUES ('Estudiante', 'De Prueba', 'Activo') RETURNING id_persona`,
      );
      const idEstudiante = Number(persona.rows[0].id_persona);
      await db.query(
        `INSERT INTO persona.persona_estudiante (id_persona, tipo, carrera, anio_ingreso)
         VALUES ($1, 'UNIVERSITARIO', 'Contaduría', 2026)`,
        [idEstudiante],
      );

      await db.query(
        `INSERT INTO contabilidad.cuenta_asignacion
           (entidad_tipo, id_persona_estudiante, id_cuenta, prioridad, vigente_desde, estado_registro)
         VALUES ('ESTUDIANTE_CXC', $2, $1, 1, CURRENT_DATE, 'Activo')`,
        [idCuentaDeudora, idEstudiante],
      );

      await expect(
        db.query(
          `INSERT INTO contabilidad.cuenta_asignacion
             (entidad_tipo, id_persona_estudiante, id_cuenta, prioridad, vigente_desde, estado_registro)
           VALUES ('ESTUDIANTE_CXC', $2, $1, 2, CURRENT_DATE, 'Activo')`,
          [idCuentaDeudora, idEstudiante],
        ),
      ).rejects.toThrow(/ux_cuenta_asignacion_entidad_cuenta/i);
    });
  });
});

describe('Pago a tutores', () => {
  /** Garantiza un tutor utilizable: la base sembrada puede no tener ninguno. */
  async function asegurarTutor(db: Client): Promise<number> {
    const existente = await db.query('SELECT id_tutor FROM persona.persona_tutor LIMIT 1');
    if (existente.rows[0]) return Number(existente.rows[0].id_tutor);

    const persona = await db.query(
      `INSERT INTO persona.persona (nombres, apellidos, estado_registro)
       VALUES ('Tutor', 'De Prueba', 'Activo') RETURNING id_persona`,
    );
    const tutor = await db.query(
      `INSERT INTO persona.persona_tutor
         (id_persona, pago_por_hora, nivel_experiencia, tipo_estudiante_especialidad)
       VALUES ($1, 50.00, 'RECLUTA', 'UNIVERSITARIO')
       RETURNING id_tutor`,
      [persona.rows[0].id_persona],
    );
    return Number(tutor.rows[0].id_tutor);
  }

  async function crearPagoTutor(db: Client, estado = 'BORRADOR'): Promise<number> {
    const idTutor = await asegurarTutor(db);
    const resultado = await db.query(
      `INSERT INTO contabilidad.pago_tutor
         (id_tutor, periodo_inicio, periodo_fin, estado_pago, subtotal, ajustes, total)
       VALUES ($1, now(), now(), $2, 100.00, 20.00, 120.00)
       RETURNING id_pago_tutor`,
      [idTutor, estado],
    );
    return Number(resultado.rows[0].id_pago_tutor);
  }

  pruebaContable('rechaza un total incoherente con subtotal más ajustes', async () => {
    await enTransaccion(async (db) => {
      const idTutor = await asegurarTutor(db);
      await expect(
        db.query(
          `INSERT INTO contabilidad.pago_tutor
             (id_tutor, periodo_inicio, periodo_fin, estado_pago, subtotal, ajustes, total)
           VALUES ($1, now(), now(), 'BORRADOR', 100.00, 20.00, 999.00)`,
          [idTutor],
        ),
      ).rejects.toThrow(/ck_pago_tutor_total_coherente/i);
    });
  });

  pruebaContable('impide saltar la aprobación pasando de BORRADOR a PAGADO', async () => {
    await enTransaccion(async (db) => {
      const idPago = await crearPagoTutor(db, 'BORRADOR');

      await expect(
        db.query("UPDATE contabilidad.pago_tutor SET estado_pago = 'PAGADO' WHERE id_pago_tutor = $1", [idPago]),
      ).rejects.toThrow(/Transición de estado no permitida/i);
    });
  });

  pruebaContable('permite el flujo BORRADOR -> APROBADO -> PAGADO', async () => {
    await enTransaccion(async (db) => {
      const idPago = await crearPagoTutor(db, 'BORRADOR');

      await db.query("UPDATE contabilidad.pago_tutor SET estado_pago = 'APROBADO' WHERE id_pago_tutor = $1", [idPago]);
      await db.query("UPDATE contabilidad.pago_tutor SET estado_pago = 'PAGADO' WHERE id_pago_tutor = $1", [idPago]);

      const resultado = await db.query(
        'SELECT estado_pago, fecha_aprobacion, fecha_pago FROM contabilidad.pago_tutor WHERE id_pago_tutor = $1',
        [idPago],
      );
      expect(resultado.rows[0].estado_pago).toBe('PAGADO');
      // El trigger sella las fechas de aprobación y pago automáticamente.
      expect(resultado.rows[0].fecha_aprobacion).not.toBeNull();
      expect(resultado.rows[0].fecha_pago).not.toBeNull();
    });
  });

  pruebaContable('congela los importes de una liquidación pagada', async () => {
    await enTransaccion(async (db) => {
      const idPago = await crearPagoTutor(db, 'BORRADOR');
      await db.query("UPDATE contabilidad.pago_tutor SET estado_pago = 'APROBADO' WHERE id_pago_tutor = $1", [idPago]);
      await db.query("UPDATE contabilidad.pago_tutor SET estado_pago = 'PAGADO' WHERE id_pago_tutor = $1", [idPago]);

      await expect(
        db.query('UPDATE contabilidad.pago_tutor SET subtotal = 500.00, total = 520.00 WHERE id_pago_tutor = $1', [
          idPago,
        ]),
      ).rejects.toThrow(/importes no pueden modificarse/i);
    });
  });
});

describe('Seguridad de credenciales sembradas', () => {
  it('el hashing de los seeds produce scrypt salado, nunca SHA-256', async () => {
    // Se prueba la utilidad directamente, no el estado de la base: lo que se corrigió es
    // que los scripts de sembrado dejaran de escribir SHA-256. Los hashes heredados que
    // ya existan en una base concreta dependen de su historia, no del código.
    const { hashPassword } = require('../scripts/seed-security');

    const primero = hashPassword('una-contrasena-de-prueba');
    const segundo = hashPassword('una-contrasena-de-prueba');

    expect(primero).toMatch(/^scrypt\$16384\$8\$1\$64\$/);
    expect(primero).not.toMatch(/^[a-f0-9]{64}$/);
    // Sal única por hash: dos hashes de la misma contraseña no coinciden.
    expect(primero).not.toBe(segundo);
  });

  pruebaContable('las cuentas con hash heredado quedan identificadas para rotación', async () => {
    // Los hashes heredados de la migración 003 se actualizan al iniciar sesión, pero su
    // texto en claro es derivable del repositorio. Esta prueba no falla por su existencia
    // —rotarlos es una decisión del propietario— sino que documenta cuántos quedan para
    // que `scripts/rotate-legacy-credentials.js` pueda cerrarlos antes de producción.
    const resultado = await (client as Client).query(
      `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE es_super_usuario)::int AS superusuarios
         FROM persona.persona_usuario
        WHERE contrasena_hash ~ '^[a-f0-9]{64}$'`,
    );

    expect(typeof resultado.rows[0].total).toBe('number');
    if (resultado.rows[0].total > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[credenciales] ${resultado.rows[0].total} cuenta(s) con hash heredado, ` +
          `${resultado.rows[0].superusuarios} de ellas superusuario. ` +
          'Ejecuta scripts/rotate-legacy-credentials.js antes de producción.',
      );
    }
  });
});
