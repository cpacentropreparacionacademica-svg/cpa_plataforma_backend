require("dotenv").config();

const app = require("./app");
const logger = require("./logs/logger");
const { connectDatabase, closeDatabase } = require("./core/db/db.config");
const { connectRedis, disconnectRedis } = require("./core/redis/redis.config");

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  try {
    await connectDatabase();
    await connectRedis();

    const server = app.listen(PORT, () => {
      logger.info(
        {
          event: "server_started",
          port: PORT,
          env: process.env.NODE_ENV || "development",
        },
        `Servidor iniciado en puerto ${PORT}`
      );
    });

    async function shutdown(signal) {
      logger.info({ event: "server_shutdown_signal", signal }, "Cerrando servidor");

      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    }

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.fatal(
      {
        event: "server_bootstrap_error",
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      "No se pudo iniciar el servidor"
    );

    process.exit(1);
  }
}

bootstrap();
