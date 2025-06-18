//=====================================================================
// MarlinDT Network Intelligence (MNI)
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//
import * as OAS from "./oasConstants.mjs";
import "dotenv/config";
//import { Base64 } from "js-base64";
import dns from "dns";
import { MAX, v4 as uuidv4 } from "uuid";
//import cors from "cors";
import express from "express";
import morgan from "morgan";
import favicon from "serve-favicon";
import https from "https";
import path from "path";
import fs from "fs";
import { Console } from "node:console";
import { fileURLToPath } from "url";
import dayjs from "dayjs";

const allPrintableRegEx = /[ -~]/gi;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const clientRetryMs = 5000;
const clientRefreshMs = 60000;
const clientReadinessAttempts = 10;

var dayjsFormat = "YYYYMMDD[T]HHmmss";
var dayjsDatePointFormat = "YYYYMMDD";

global.DEBUG = false;
global.DDI = null;
global.DDC = null;

//const output = fs.createWriteStream('./stdout.log');
//const errorOutput = fs.createWriteStream('./stderr.log');
global.LOGGER = new Console({
  stdout: process.stdout,
  stderr: process.stderr,
  colorMode: false,
});

//
var tickTimer = null;
var tickIntervalMs = null;
var serveName = null;
var serveAddress = null;
var servePort = null;
var serveUrlPrefix = null;
var serveUseDnsSd = null;
var serveHost = null;
var serveDomain = null;
var serveTimeOutRequest = null;
var appName = null;
var appVersion = null;
var appBuild = null;
var sslKey = null;
var sslCert = null;
var configDirectory = null;
var distDirectory = null;
var apiGatewayResolve = null;
var apiGatewayDns = null;
var apiGatewayIp = null;
var dnsResolveIntervalMs = null;

function toBoolean(s) {
  return String(s).toLowerCase() === "true";
}

function toInteger(s) {
  if (Number.isNaN(Number.parseInt(s, 10))) {
    return 0;
  }
  return parseInt(s, 10);
}

function toDecimal(s, p = OAS.float_precision) {
  if (Number.isNaN(Number.parseFloat(s))) {
    return Number(0);
  }
  return Number(parseFloat(s).toFixed(p));
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function flatten(lists) {
  return lists.reduce((a, b) => a.concat(b), []);
}

function getDirectories(srcPath) {
  return fs
    .readdirSync(srcPath)
    .map((file) => path.join(srcPath, file))
    .filter((path) => fs.statSync(path).isDirectory());
}

function getDirectoriesRecursive(srcPath) {
  return [
    srcPath,
    ...flatten(getDirectories(srcPath).map(getDirectoriesRecursive)),
  ];
}

// repeative DNS resolve for API Gateway service discovery
async function apiGatewayDnsSD() {
  try {
    let dnsPromises = dns.promises;
    let srvRec = await dnsPromises.resolve(
      "_https._tcp.gateway." + serveHost + "." + serveDomain,
      "SRV"
    );
    let urlPrefix = process.env.APISERV_URL_PREFIX || "/mni";
    let urlVerison = process.env.APISERV_URL_VERSION || "/v1";
    let aRec = await dnsPromises.lookup(srvRec[0].name, { all: true });
    if (srvRec[0].port != null) {
      if (aRec[0].address != null) {
        apiGatewayDns =
          "https://" +
          srvRec[0].name +
          ":" +
          toInteger(srvRec[0].port) +
          urlPrefix +
          urlVerison;
        apiGatewayIp =
          "https://" +
          aRec[0].address +
          ":" +
          toInteger(srvRec[0].port) +
          urlPrefix +
          urlVerison;
      }
    }
  } catch (e) {
    if (DEBUG) {
      LOGGER.debug(dayjs().format(dayjsFormat), "debug", {
        dns: e,
      });
    }
  }
  apiGatewayResolve = setTimeout(apiGatewayDnsSD, dnsResolveIntervalMs);
}

// stdout alive indicator
function tick() {
  //if (DEBUG) {
  //  process.stdout.write(".");
  //}
  tickTimer = setTimeout(tick, tickIntervalMs);
}

// load env
function loadEnv() {
  DEBUG = toBoolean(process.env.UISERV_DEBUG || false);
  dayjsFormat = process.env.UISERV_TIMESTAMP_FORMAT || "YYYYMMDD[T]HHmmssZ";
  appName = process.env.MNI_NAME || "MNI";
  appVersion = process.env.MNI_VERSION || "0.0.0";
  appBuild = process.env.MNI_BUILD || "00000000.00";
  tickIntervalMs = toInteger(process.env.UISERV_TICK_INTERVAL_MS) || 60000;
  serveHost = process.env.DNSSERV_HOST || "mni";
  serveDomain = process.env.DNSSERV_DOMAIN || "merkator.local";
  //serveAddress and servePort can be overridden through DNS SD
  serveUseDnsSd = toBoolean(process.env.UISERV_USE_DNS_SD || false);
  serveAddress = process.env.UISERV_ADDRESS || "127.0.0.1";
  servePort = toInteger(process.env.UISERV_PORT) || 443;
  serveUrlPrefix = process.env.UISERV_URL_PREFIX || "/mni";
  serveTimeOutRequest = toInteger(process.env.UISERV_TIMEOUT_REQUEST) || 120000;
  dnsResolveIntervalMs = toInteger(process.env.UISERV_DNS_RESOLVE) || 300000;
  sslKey = process.env.UISERV_SSL_KEY || "apiServer.key";
  sslCert = process.env.UISERV_SSL_CERT || "apiServer.crt";
  configDirectory = path.resolve(process.env.CONFIG_DIRECTORY || "/etc/mni");
  distDirectory = path.resolve(
    process.env.UISERV_DIST_DIRECTORY || "/usr/local/mni/apiServer/dist"
  );
}

// quit
function quit() {
  LOGGER.info(dayjs().format(dayjsFormat), "info", {
    event: "quit",
  });
  if (tickTimer != null) {
    clearTimeout(tickTimer);
  }
  if (apiGatewayResolve != null) {
    clearTimeout(apiGatewayResolve);
  }
  if (app != null) {
    app.close();
  }
}

// error handling
const errorTypes = ["unhandledRejection", "uncaughtException"];
errorTypes.forEach((errType) => {
  if (DEBUG) {
    LOGGER.debug(dayjs().format(dayjsFormat), "debug", {
      trap: errType,
    });
  }
  process.on(errType, async (e) => {
    try {
      LOGGER.error(dayjs().format(dayjsFormat), "error", {
        signal: sigType,
        error: e,
      });
      quit();
    } finally {
      process.exit(1);
    }
  });
});

// interrupt handling
const signalTraps = ["SIGTERM", "SIGINT", "SIGQUIT", "SIGHUP"];
signalTraps.forEach((sigType) => {
  if (DEBUG) {
    LOGGER.debug(dayjs().format(dayjsFormat), "debug", {
      trap: sigType,
    });
  }
  switch (sigType) {
    case "SIGTERM":
      process.once(sigType, async () => {
        LOGGER.info(dayjs().format(dayjsFormat), "info", {
          signal: sigType,
        });
        try {
          quit();
        } finally {
          process.exit(1);
        }
      });
      break;
    case "SIGQUIT":
      process.once(sigType, async () => {
        LOGGER.info(dayjs().format(dayjsFormat), "info", {
          signal: sigType,
        });
        try {
          quit();
        } finally {
          process.exit(0);
        }
      });
      break;
    case "SIGINT":
      process.once(sigType, async () => {
        LOGGER.info(dayjs().format(dayjsFormat), "info", {
          signal: sigType,
        });
        try {
          quit();
        } finally {
          process.exit(0);
        }
      });
      break;
    case "SIGHUP":
      process.on(sigType, async () => {
        LOGGER.info(dayjs().format(dayjsFormat), "info", {
          signal: sigType,
        });
        process.stdout.write("!");
        loadEnv();
      });
      break;
    default:
      if (DEBUG) {
        LOGGER.debug(
          (dayjs().format(dayjsFormat), "debug", { signal: sigType })
        );
      }
  }
});

async function dnsSD() {
  try {
    let dnsPromises = dns.promises;
    let srvRec = await dnsPromises.resolve(
      "_https._tcp.apiserver." + serveHost + "." + serveDomain,
      "SRV"
    );
    serveName = srvRec[0].name;
    let aRec = await dnsPromises.lookup(serveName, { all: true });
    if (srvRec[0].port != null) {
      servePort = srvRec[0].port;
      if (aRec[0].address != null) {
        serveAddress = aRec[0].address;
      }
    }
  } catch (e) {
    if (DEBUG) {
      LOGGER.debug(dayjs().format(dayjsFormat), "debug", {
        dns: e,
      });
    }
  }
}

//
var run = async () => {
  // load env
  loadEnv();

  // use DNS service discovery to determine own listening address:port
  // these values will override local .env
  if (serveUseDnsSd) {
    dnsSD();
  }

  // start the DNS resolver for API Gateway service discovery
  await apiGatewayDnsSD();
  apiGatewayResolve = setTimeout(apiGatewayDnsSD, dnsResolveIntervalMs);

  // banner
  process.stdout.write(String.fromCharCode.apply(null, OAS.bannerGraffti));

  LOGGER.info(dayjs().format(dayjsFormat), "info", {
    event: "starting",
    mni: {
      name: appName,
      version: appVersion,
      build: appBuild,
    },
    endpoint: {
      useDnsSD: serveUseDnsSd,
      host: serveHost,
      domain: serveDomain,
      fqdn: serveHost + "." + serveDomain,
      name: serveName,
      address: serveAddress,
      port: servePort,
      urlPrefix: serveUrlPrefix,
    },
    environment: {
      timestamp: dayjsFormat,
      tickInterval: tickIntervalMs,
      distDirectory: distDirectory,
      configDirectory: configDirectory,
    },
    apiGateway: {
      dns: apiGatewayDns,
      ip: apiGatewayIp,
    },
    ssl: {
      key: sslKey,
      cert: sslCert,
    },
    timeouts: {
      request: serveTimeOutRequest,
    },
  });

  // setup Express middleware

  // request bodies
  app.use(
    express.json({
      limit: "1Mb",
      type: OAS.mimeJSON,
    })
  );

  // cosmetic and middleware tweaks
  //app.set("title", appName);
  app.disable("x-powered-by");
  app.disable("case sensitive routing");
  // via KrakenD header x-forwarded-for has actual client IP
  app.enable("trust proxy"); // to get get real client IP when behind API gateway

  // morgan logging for expressjs
  const morganFormat = (tokens, req, res) =>
    dayjs(tokens.date(req, res, "iso")).format(dayjsFormat) +
    " info { " +
    "remote: '" +
    tokens["remote-addr"](req) +
    "', " +
    "method: '" +
    tokens.method(req, res) +
    "', " +
    "path: '" +
    //    tokens.url(req, res).replace(serveUrlPrefix, "") +
    tokens.url(req, res) +
    "', " +
    "response: { " +
    "status: " +
    tokens.status(req, res) +
    ", " +
    "contentLength: " +
    tokens.res(req, res, "content-length") +
    ", " +
    "timeMs: " +
    tokens["response-time"](req, res) +
    " } }";
  app.use(morgan(morganFormat, { stream: process.stdout }));

  // CORS
  //app.use(cors());

  // favicons
  app.use(favicon(path.join(__dirname, "favicon.ico")));

  app.set("views", distDirectory);
  app.set("view engine", "ejs");

  // request timeout handler
  app.use((req, res, next) => {
    res.setTimeout(serveTimeOutRequest, () => {
      LOGGER.warn(dayjs().format(dayjsFormat), "warn", {
        event: "request timed out (408)",
        remote: req.ip,
        url: req.originalUrl,
      });
      res
        .contentType("application/json")
        .status(408)
        .json({ errors: "time out", url: req.originalUrl });
    });
    next();
  });

  // request bad request handler
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      LOGGER.error(dayjs().format(dayjsFormat), "error", {
        event: "bad request (400)",
        remote: req.ip,
        url: req.originalUrl,
      });
      return res.status(err.status).send(err.message); // Bad request
    }
    next();
  });

  // redirects
  app.get("/", (req, res) => {
    res.redirect(serveUrlPrefix);
  });

  // static file handlers
  app.use(serveUrlPrefix, express.static(distDirectory));
  if (DEBUG) {
    LOGGER.debug(dayjs().format(dayjsFormat), "debug", "dynamicPaths", {
      urlPath: serveUrlPrefix,
      osPath: distDirectory,
    });
  }
  // dynamically expose all dist sub-directories
  let subDirs = getDirectoriesRecursive(distDirectory);
  for (let idx in subDirs) {
    if (subDirs[idx] !== distDirectory) {
      let subPath =
        serveUrlPrefix +
        "/" +
        subDirs[idx].replace(distDirectory + path.sep, "");
      if (DEBUG) {
        LOGGER.debug(dayjs().format(dayjsFormat), "debug", "dynamicPaths", {
          urlPath:
            serveUrlPrefix +
            "/" +
            subDirs[idx].replace(distDirectory + path.sep, ""),
          osPath: subDirs[idx],
        });
      }
      app.use(subPath, express.static(subDirs[idx]));
    }
  }

  app.get(serveUrlPrefix, function (req, res, next) {
    let payload = {
      rootUrl: serveUrlPrefix,
    };
    res.render("index", { payload: payload });
  });
  // dynamic page with injected payload to include API Gateway service discovery
  app.post(serveUrlPrefix, function (req, res, next) {
    let payload = {
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
      rootUrl: serveUrlPrefix,
    };
    res.render("readiness", { payload: payload });
  });

  app.get(serveUrlPrefix + "/metadata", function (req, res, next) {
    let resJson = {
      shortName: "MNI",
      icon: "/favicon.ico",
      notificatonIcon: "/favicon.ico",
      name: appName,
      version: appVersion,
      build: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
      retryMs: clientRetryMs,
      refreshMs: clientRefreshMs,
      readinessAttempts: clientReadinessAttempts,
    };
    res.contentType(OAS.mimeJSON).status(200).json(resJson);
  });

  app.get(serveUrlPrefix + "/dashboard", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("dashboard", { payload: payload });
  });

  app.get(serveUrlPrefix + "/cable/:cableId", function (req, res, next) {
    let point = null;
    if (req.query?.point != null) {
      point = req.query.point;
    }
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
      cableId: cableId,
      point: point,
    };
    res.render("cable", { payload: payload });
  });

  app.get(serveUrlPrefix + "/cable", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("cable", { payload: payload });
  });

  app.get(serveUrlPrefix + "/duct/:ductId", function (req, res, next) {
    let point = null;
    if (req.query?.point != null) {
      point = req.query.point;
    }
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
      ductId: ductId,
      point: point,
    };
    res.render("duct", { payload: payload });
  });

  app.get(serveUrlPrefix + "/duct", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("duct", { payload: payload });
  });

  app.get(serveUrlPrefix + "/pole/:poleId", function (req, res, next) {
    let point = null;
    if (req.query?.point != null) {
      point = req.query.point;
    }
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
      poleId: poleId,
      point: point,
    };
    res.render("pole", { payload: payload });
  });

  app.get(serveUrlPrefix + "/pole", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("pole", { payload: payload });
  });

  app.get(serveUrlPrefix + "/ne/:neId", function (req, res, next) {
    let point = null;
    if (req.query?.point != null) {
      point = req.query.point;
    }
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
      neId: req.params.neId,
      point: point,
    };
    res.render("ne", { payload: payload });
  });

  app.get(serveUrlPrefix + "/ne", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("ne", { payload: payload });
  });

  app.get(serveUrlPrefix + "/rack/:rackId", function (req, res, next) {
    let point = null;
    if (req.query?.point != null) {
      point = req.query.point;
    }

    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
      rackId: rackId,
      point: point,
    };
    res.render("rack", { payload: payload });
  });

  app.get(serveUrlPrefix + "/rack", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("rack", { payload: payload });
  });

  app.get(serveUrlPrefix + "/site/:siteId", function (req, res, next) {
    let point = null;
    if (req.query?.point != null) {
      point = req.query.point;
    }

    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
      siteId: siteId,
      point: point,
    };
    res.render("site", { payload: payload });
  });

  app.get(serveUrlPrefix + "/site", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("site", { payload: payload });
  });

  app.get(serveUrlPrefix + "/service/:serviceId", function (req, res, next) {
    let point = null;
    if (req.query?.point != null) {
      point = req.query.point;
    }

    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
      serviceId: serviceId,
      point: point,
    };
    res.render("service", { payload: payload });
  });

  app.get(serveUrlPrefix + "/service", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("service", { payload: payload });
  });

  app.get(serveUrlPrefix + "/trench/:trenchId", function (req, res, next) {
    let point = null;
    if (req.query?.point != null) {
      point = req.query.point;
    }

    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
      trenchId: trenchId,
      point: point,
    };
    res.render("trench", { payload: payload });
  });

  app.get(serveUrlPrefix + "/trench", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("trench", { payload: payload });
  });

  app.get(
    serveUrlPrefix + "/trenchLifetime/:trenchId",
    function (req, res, next) {
      let point = null;
      if (req.query?.point != null) {
        point = req.query.point;
      }

      let payload = {
        appName: appName,
        appVersion: appVersion,
        appBuild: appBuild,
        rootUrl: serveUrlPrefix,
        gatewayUrl: apiGatewayDns,
        gatewayUrlIp: apiGatewayIp,
        gatewayUrlDns: apiGatewayDns,
        trenchId: trenchId,
        point: point,
      };
      res.render("trenchLifetime", { payload: payload });
    }
  );

  app.get(serveUrlPrefix + "/trenchLifetime", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("trenchLifetime", { payload: payload });
  });

  app.get(serveUrlPrefix + "/email", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("email", { payload: payload });
  });

  app.get(serveUrlPrefix + "/map", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("map", { payload: payload });
  });

  app.get(serveUrlPrefix + "/kafka", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("kafka", { payload: payload });
  });

  app.get(serveUrlPrefix + "/workflow", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("workflow", { payload: payload });
  });

  app.get(serveUrlPrefix + "/alert", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("alert", { payload: payload });
  });

  app.get(serveUrlPrefix + "/workalert", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("workalert", { payload: payload });
  });

  app.get(serveUrlPrefix + "/callbackalert", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("callbackalert", { payload: payload });
  });

  app.get(serveUrlPrefix + "/publishalert", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("publishalert", { payload: payload });
  });

  app.get(serveUrlPrefix + "/notifyalert", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("notifyalert", { payload: payload });
  });

  app.get(serveUrlPrefix + "/setting", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("setting", { payload: payload });
  });

  app.get(serveUrlPrefix + "/help", function (req, res, next) {
    let payload = {
      appName: appName,
      appVersion: appVersion,
      appBuild: appBuild,
      rootUrl: serveUrlPrefix,
      gatewayUrl: apiGatewayDns,
      gatewayUrlIp: apiGatewayIp,
      gatewayUrlDns: apiGatewayDns,
    };
    res.render("help", { payload: payload });
  });

  // Express 404 handling ¯\_(ツ)_/¯
  app.use((req, res, next) => {
    res.status(404).sendFile(path.join(distDirectory, "404.html"));
  });

  // Standup and process requests
  if (
    !fs.existsSync(path.join(configDirectory, sslKey)) ||
    !fs.existsSync(path.join(configDirectory, sslCert))
  ) {
    LOGGER.error(dayjs().format(dayjsFormat), "error", "SSL files missing", {
      key: path.join(configDirectory, sslKey),
      cert: path.join(configDirectory, sslCert),
    });
    try {
      quit();
    } finally {
      process.exit(1);
    }
  }
  const server = https.createServer(
    {
      key: fs.readFileSync(path.join(configDirectory, sslKey), "utf-8"),
      cert: fs.readFileSync(path.join(configDirectory, sslCert), "utf-8"),
    },
    app
  );

  // http - app.listen(servePort, serveAddress, function (error) {
  server.listen(servePort, serveAddress, function (error) {
    if (error) throw error;
  });

  // stdout ticker to indicate alive
  tickTimer = setTimeout(tick, tickIntervalMs);

  // sleep
  while (true) {
    await sleep(1000);
  }
};

// main
run().catch((e) => LOGGER.error(e));
