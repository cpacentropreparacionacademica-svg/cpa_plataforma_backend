const { TransaccionMovimientoCuenta } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");
const {
  deleteCacheByPattern,
} = require("../../../shared/cache/redis.helper");
const {
  buildEntityPattern,
} = require("../../../shared/cache/cacheKeys");

const baseRepository = createCrudRepository({
  Model: TransaccionMovimientoCuenta,
  entity: "transaccion_movimiento_cuenta",
  primaryKeys: ["id_movimiento"],
});

function toPlain(value) {
  if (!value) return value;
  if (typeof value.get === "function") return value.get({ plain: true });
  if (typeof value.toJSON === "function") return value.toJSON();
  return value;
}

function hasAttribute(Model, attributeName) {
  return Boolean(Model?.rawAttributes?.[attributeName]);
}

function addAuditCreateFields(Model, data, authUserId) {
  if (authUserId === undefined || authUserId === null) {
    return data;
  }

  if (hasAttribute(Model, "id_usuario_creador") && data.id_usuario_creador === undefined) {
    data.id_usuario_creador = authUserId;
  }

  if (hasAttribute(Model, "user_id_creacion") && data.user_id_creacion === undefined) {
    data.user_id_creacion = authUserId;
  }

  return data;
}

async function createMany(payloads, authUserId) {
  const transaction = await TransaccionMovimientoCuenta.sequelize.transaction();

  try {
    const rowsToCreate = payloads.map((payload) =>
      addAuditCreateFields(TransaccionMovimientoCuenta, { ...payload }, authUserId)
    );

    const createdRows = await TransaccionMovimientoCuenta.bulkCreate(rowsToCreate, {
      transaction,
      returning: true,
    });

    await transaction.commit();

    try {
      await deleteCacheByPattern(buildEntityPattern("transaccion_movimiento_cuenta"));
    } catch {
      // La invalidación de cache no debe romper el batch ya confirmado en BD.
    }

    return createdRows.map((row) => toPlain(row));
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  ...baseRepository,
  createMany,
};
