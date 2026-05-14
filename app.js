const express = require("express");
const pinoHttp = require("pino-http");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const logger = require("./logs/logger");
const actionLogMiddleware = require("./middlewares/actionLog.middleware");

const app = express();

app.disable("x-powered-by");

// PINO ======================================================================
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers["x-request-id"] || Date.now().toString(),
  })
);

// HELMET ====================================================================
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// COMPRESSION ================================================================
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }

      return compression.filter(req, res);
    },
  })
);

// CORS ======================================================================
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origen no permitido por CORS."));
    },
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    methods: ["POST", "GET", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// RATE LIMITER ===============================================================
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: (req) => req.path.startsWith("/api/auth"),
    message: {
      success: false,
      message: "Too many requests, please try again later.",
    },
  })
);

// COOKIES ===================================================================
app.use(cookieParser());

// BODY PARSERS ===============================================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// HEALTH CHECK ===============================================================
app.get("/health", (_req, res) => {
  return res.status(200).json({
    ok: true,
    message: "Servidor funcionando correctamente",
  });
});

// REQUEST HIT LOG ============================================================
app.use((req, _res, next) => {
  req.log.info(
    {
      method: req.method,
      url: req.originalUrl,
    },
    "REQUEST HIT"
  );

  return next();
});

// ACTION LOG AUDIT ===========================================================
app.use(actionLogMiddleware);

app.set("trust proxy", true);

// MODULE ROUTERS =============================================================
const modules = require("./src/modules");

for (const module of modules){
  const {router, moduleName, isPublic} = module;
  const route = `/api/${moduleName}`;
  
  app.use(route, router);
}

// 404 ========================================================================
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Ruta no encontrada.",
  });
});

// GLOBAL ERROR HANDLER =======================================================
app.use((error, req, res, _next) => {
  req.log?.error(
    {
      event: "express_global_error",
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    },
    "Error global de Express"
  );

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : "Error interno del servidor.",
  });
});

module.exports = app;
