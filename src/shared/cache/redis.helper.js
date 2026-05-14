// src/shared/cache/redis.helper.js

const { getRedisClient } = require("../../../core/redis/redis.config");
// Ajusta la ruta si tu archivo redis.helper.js está en otra carpeta.

function getClient() {
  const client = getRedisClient();

  if (!client || !client.isOpen) {
    return null;
  }

  return client;
}

function serializeCacheValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || Buffer.isBuffer(value)) {
    return value;
  }

  return JSON.stringify(value);
}

function deserializeCacheValue(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function getCache(key) {
  const client = getClient();

  if (!client || !key) {
    return null;
  }

  const value = await client.get(String(key));

  return deserializeCacheValue(value);
}

async function setCache(key, value, ttlSeconds = 60) {
  const client = getClient();

  if (!client || !key) {
    return null;
  }

  const serializedValue = serializeCacheValue(value);

  if (serializedValue === null) {
    return null;
  }

  if (ttlSeconds) {
    return client.set(String(key), serializedValue, {
      EX: Number(ttlSeconds),
    });
  }

  return client.set(String(key), serializedValue);
}

async function deleteCache(key) {
  const client = getClient();

  if (!client || !key) {
    return 0;
  }

  return client.del(String(key));
}

async function deleteCacheByPattern(pattern) {
  const client = getClient();

  if (!client || !pattern) {
    return 0;
  }

  const safePattern = String(pattern);
  let deletedCount = 0;

  for await (const item of client.scanIterator({
    MATCH: safePattern,
    COUNT: 100,
  })) {
    const keys = Array.isArray(item) ? item : [item];

    if (keys.length > 0) {
      deletedCount += await client.del(keys);
    }
  }

  return deletedCount;
}

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCacheByPattern,
};