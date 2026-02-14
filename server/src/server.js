const express = require('express');
const { createServer } = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('../load-env.js');

// Import MVC components
const setupRoutes = require('./routes');
const database = require('./config/database');

const app = express();
const log = console.log;

// CORS configuration
function setupCors() {
  app.use((req, res, next) => {
    const origins = new Set();

    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }

    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }

    const origin = req.header("origin");

    // Allow localhost origins for Expo web development (any port)
    const isLocalhost =
      origin?.startsWith("http://localhost:") ||
      origin?.startsWith("http://127.0.0.1:");

    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

// Body parsing middleware
function setupBodyParsing() {
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
}

// Request logging
function setupRequestLogging() {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!path.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

// Static file serving for Expo
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "Stream Curator";
  } catch {
    return "Stream Curator";
  }
}

function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json",
  );

  if (!fs.existsSync(manifestPath)) {
    return res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
  }

  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}

function serveLandingPage({ req, res, landingPageTemplate, appName }) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

function configureExpoAndLanding() {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );
  
  let landingPageTemplate;
  try {
    landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  } catch (error) {
    log("Warning: Landing page template not found, using simple fallback");
    landingPageTemplate = `
      <!DOCTYPE html>
      <html>
      <head><title>{{APP_NAME_PLACEHOLDER}}</title></head>
      <body><h1>{{APP_NAME_PLACEHOLDER}}</h1><p>Stream Curator Academic Platform</p></body>
      </html>
    `;
  }
  
  const appName = getAppName();

  log("Serving static Expo files with dynamic manifest routing");

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }

    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }

    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName,
      });
    }

    next();
  });

  app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app.use(express.static(path.resolve(process.cwd(), "static-build")));

  log("Expo routing: Checking expo-platform header on / and /manifest");
}

// Error handling
function setupErrorHandler() {
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });
}

// Main server setup
async function startServer() {
  setupCors();
  setupBodyParsing();
  setupRequestLogging();
  configureExpoAndLanding();

  // Setup MVC routes
  setupRoutes(app);

  setupErrorHandler();

  // Initialize database
  await database.initializeDefaultData();

  const port = parseInt(process.env.PORT || "5000", 10);
  const server = createServer(app);

  server.listen(
    port,
    "127.0.0.1",
    () => {
      log(`🚀 Stream Curator Academic Platform server serving on port ${port}`);
      log(`📚 MVC Architecture loaded`);
      log(`☁️  S3 Integration ready`);
      log(`🎓 Academic features enabled`);
    },
  );

  return server;
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
