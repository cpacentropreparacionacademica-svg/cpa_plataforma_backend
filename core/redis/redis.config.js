const {createClient} = require("redis");

const rootLogger = require("../../logs/logger");
const logger = rootLogger.child({ module: "redis.config" });

const REDIS_ENABLED = process.env.REDIS_ENABLED === "true";
const REDIS_URL = process.env.REDIS_URL;

let redisClient = null;

async function connectRedis() {
  if (!REDIS_ENABLED) {
    logger.warn(
      {
        event: "redis_disabled",
      },
      "Redis está deshabilitado por configuración."
    );

    return null;
  }

  if (!REDIS_URL) {
    logger.warn(
      {
        event: "redis_url_missing",
      },
      "REDIS_URL no está configurado. Redis no se conectará."
    );

    return null;
  }

  if (redisClient?.isOpen) {
    return redisClient;
  }

  redisClient = createClient({
    url: REDIS_URL,
  });

  redisClient.on("error", (error) => {
    logger.error(
      {
        event: "redis_client_error",
        error: {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        },
      },
      "Error en cliente Redis."
    );
  });

  redisClient.on("connect", () => {
    logger.info(
      {
        event: "redis_connecting",
      },
      "Conectando a Redis..."
    );
  });

  redisClient.on("ready", () => {
    logger.info(
      {
        event: "redis_ready",
      },
      "Redis conectado y listo."
    );
  });

  redisClient.on("end", () => {
    logger.warn(
      {
        event: "redis_connection_ended",
      },
      "Conexión Redis finalizada."
    );
  });

  await redisClient.connect();

  return redisClient;
}

function getRedisClient() {
  return redisClient;
}

async function disconnectRedis() {
  if (redisClient?.isOpen) {
    await redisClient.quit();
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  disconnectRedis,
};