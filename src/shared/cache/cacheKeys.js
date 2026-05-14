function normalizeQuery(query = {}) {
  return Object.keys(query)
    .sort()
    .map((key) => `${key}=${query[key]}`)
    .join(":");
}

function buildCacheKey(entity, action, identifier = "default") {
  return `cpa:${entity}:${action}:${identifier}`;
}

function buildListCacheKey(entity, query = {}) {
  const normalizedQuery = normalizeQuery(query);

  return buildCacheKey(entity, "list", normalizedQuery || "default");
}

function buildGetCacheKey(entity, id) {
  return buildCacheKey(entity, "get", id);
}

function buildEntityPattern(entity) {
  return `cpa:${entity}:*`;
}

module.exports = {
  buildCacheKey,
  buildListCacheKey,
  buildGetCacheKey,
  buildEntityPattern,
};