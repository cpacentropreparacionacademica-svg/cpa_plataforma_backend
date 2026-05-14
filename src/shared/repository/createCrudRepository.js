const {
  getCache,
  setCache,
  deleteCacheByPattern,
} = require("../cache/redis.helper");

const {
  buildGetCacheKey,
  buildListCacheKey,
  buildEntityPattern,
} = require("../cache/cacheKeys");

const CONTROL_QUERY_FIELDS = new Set([
  "page",
  "limit",
  "offset",
  "search",
  "orderBy",
  "orderDir",
]);

function toPlain(value) {
  if (!value) {
    return value;
  }

  if (typeof value.toJSON === "function") {
    return value.toJSON();
  }

  return value;
}

function normalizeIdentifier(identifier) {
  if (!identifier || typeof identifier !== "object") {
    return String(identifier);
  }

  return Object.keys(identifier)
    .sort()
    .map((key) => `${key}=${identifier[key]}`)
    .join(":");
}

function getSingleId(idOrParams, primaryKey) {
  if (idOrParams && typeof idOrParams === "object") {
    return idOrParams[primaryKey];
  }

  return idOrParams;
}

function buildWhereFromId(idOrParams, primaryKeys) {
  if (primaryKeys.length === 1) {
    return {
      [primaryKeys[0]]: getSingleId(idOrParams, primaryKeys[0]),
    };
  }

  return primaryKeys.reduce((where, primaryKey) => {
    where[primaryKey] = idOrParams?.[primaryKey];
    return where;
  }, {});
}

function hasMissingPrimaryKey(where) {
  return Object.values(where).some(
    (value) => value === undefined || value === null || value === ""
  );
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
    return data;
  }

  if (hasAttribute(Model, "id_usuario") && data.id_usuario === undefined) {
    data.id_usuario = authUserId;
    return data;
  }

  if (hasAttribute(Model, "user_id_creacion") && data.user_id_creacion === undefined) {
    data.user_id_creacion = authUserId;
  }

  return data;
}

function addAuditUpdateFields(Model, data, authUserId) {
  if (authUserId === undefined || authUserId === null) {
    return data;
  }

  if (
    hasAttribute(Model, "id_usuario_modificacion") &&
    data.id_usuario_modificacion === undefined
  ) {
    data.id_usuario_modificacion = authUserId;
    return data;
  }

  if (
    hasAttribute(Model, "user_id_modificacion") &&
    data.user_id_modificacion === undefined
  ) {
    data.user_id_modificacion = authUserId;
  }

  return data;
}

function normalizeBooleanValue(value) {
  if (value === true || value === false) {
    return value;
  }

  if (value === "true" || value === "1" || value === 1) {
    return true;
  }

  if (value === "false" || value === "0" || value === 0) {
    return false;
  }

  return value;
}

function normalizeWhereValue(attribute, value) {
  if (attribute?.type?.key === "BOOLEAN") {
    return normalizeBooleanValue(value);
  }

  return value;
}

function buildWhereFromQuery(Model, query = {}) {
  return Object.entries(query).reduce((where, [key, value]) => {
    if (CONTROL_QUERY_FIELDS.has(key)) {
      return where;
    }

    if (value === undefined || value === null || value === "") {
      return where;
    }

    if (!hasAttribute(Model, key)) {
      return where;
    }

    where[key] = normalizeWhereValue(Model.rawAttributes[key], value);
    return where;
  }, {});
}

function getOrder(Model, primaryKeys, query = {}) {
  const defaultOrderBy = primaryKeys[0];
  const requestedOrderBy = query.orderBy;
  const orderBy = hasAttribute(Model, requestedOrderBy)
    ? requestedOrderBy
    : defaultOrderBy;

  const requestedOrderDir = String(query.orderDir || "DESC").toUpperCase();
  const orderDir = requestedOrderDir === "ASC" ? "ASC" : "DESC";

  return [[orderBy, orderDir]];
}

function createCrudRepository({ Model, entity, primaryKeys }) {
  if (!Model) {
    throw new Error("createCrudRepository requiere un modelo Sequelize válido.");
  }

  if (!entity) {
    throw new Error("createCrudRepository requiere el nombre de entidad para cache.");
  }

  if (!Array.isArray(primaryKeys) || primaryKeys.length === 0) {
    throw new Error("createCrudRepository requiere al menos una primary key.");
  }

  async function create(payload, authUserId) {
    const createPayload = addAuditCreateFields(Model, { ...payload }, authUserId);

    const result = await Model.create(createPayload);

    await deleteCacheByPattern(buildEntityPattern(entity));

    return toPlain(result);
  }

  async function get(idOrParams) {
    const where = buildWhereFromId(idOrParams, primaryKeys);

    if (hasMissingPrimaryKey(where)) {
      return null;
    }

    const cacheKey = buildGetCacheKey(entity, normalizeIdentifier(where));
    const cached = await getCache(cacheKey);

    if (cached) {
      console.log("[CACHE_HIT]", {
        entity,
        cacheKey,
        cachedCount: cached?.count,
        cachedRows: cached?.rows?.length,
      });

      return cached;
    }

    const result = primaryKeys.length === 1
      ? await Model.findByPk(where[primaryKeys[0]])
      : await Model.findOne({ where });

    if (!result) {
      return null;
    }

    const plainResult = toPlain(result);

    await setCache(cacheKey, plainResult, 60);

    return plainResult;
  }

  async function list(query = {}) {
    const limit = Number(query.limit || 20);
    const offset = Number(query.offset || 0);
    const where = buildWhereFromQuery(Model, query);

    const cacheKey = buildListCacheKey(entity, {
      ...query,
      limit,
      offset,
    });

    const cached = await getCache(cacheKey);

    if (cached) {
      console.log("[CACHE_HIT]", {
        entity,
        cacheKey,
        cachedCount: cached?.count,
        cachedRows: cached?.rows?.length,
      });

      return cached;
    }

    const result = await Model.findAndCountAll({
      where,
      limit,
      offset,
      order: getOrder(Model, primaryKeys, query),
    });

    const data = {
      count: result.count,
      rows: result.rows.map((row) => toPlain(row)),
      limit,
      offset,
    };

    await setCache(cacheKey, data, 60);

    return data;
  }

  async function update(idOrParams, payload, authUserId) {
    const where = buildWhereFromId(idOrParams, primaryKeys);

    if (hasMissingPrimaryKey(where)) {
      return null;
    }

    const updatePayload = addAuditUpdateFields(Model, { ...payload }, authUserId);

    const [affectedRows, rows] = await Model.update(updatePayload, {
      where,
      returning: true,
    });

    if (affectedRows === 0) {
      return null;
    }

    await deleteCacheByPattern(buildEntityPattern(entity));

    const updatedRow = rows?.[0];

    if (updatedRow) {
      return toPlain(updatedRow);
    }

    return get(where);
  }

  return {
    create,
    get,
    list,
    update,
  };
}

module.exports = createCrudRepository;
