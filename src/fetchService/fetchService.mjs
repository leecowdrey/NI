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
import dns from "dns";
import cron from "node-cron";
import { MAX, v4 as uuidv4 } from "uuid";
import { Console } from "node:console";
import dayjs from "dayjs";
import os from "os";
import path from "path";
import fs from "fs";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { glob } from "glob";
import { URL } from "node:url";

//import { oracledb } from "oracledb";
//import mysql from "mysql2/promise";

const allPrintableRegEx = /[ -~]/gi;
const secretScope = "fetch";

var DEBUG = false;
var ENDPOINT_READY = false;
var ENDPOINT = null;

//const output = fs.createWriteStream('./stdout.log');
//const errorOutput = fs.createWriteStream('./stderr.log');
var LOGGER = new Console({
  stdout: process.stdout,
  stderr: process.stderr,
  colorMode: false,
});

var tlsSslVerification = false;
var dateBoundaryTimer = null;
var dateBoundaryIntervalMs = 3600000;
var endpointTimer = null;
var dnsSdTimer = null;
var endpointRetryMs = null;
var endpointKeepaliveMs = null;
var endPointUrlPrefix = null;
var endPointUrlVersion = null;
var appName = null;
var appVersion = null;
var appBuild = null;
var cveScan = null;
var cveDirectory = null;
var fxRateUpdate = null;
var queueDrainTimer = null;
var queueDrainIntervalMs = 30000;
var endpointTimer = null;
var jobs = null;
var jobsCronIds = [];

function noop() {}

function toBoolean(s) {
  return String(s).toLowerCase() === "true";
}

function toInteger(s) {
  if (Number.isNaN(Number.parseInt(s, 10))) {
    return 0;
  }
  return parseInt(s, 10);
}

function minDecimal(s, p) {
  let r = "-" + "9".repeat(s) + "." + "9".repeat(p);
  if (Number.isNaN(Number.parseFloat(r))) {
    return Number(0);
  }
  return Number(parseFloat(r).toFixed(p));
}
function maxDecimal(s, p) {
  let r = "9".repeat(s) + "." + "9".repeat(p);
  if (Number.isNaN(Number.parseFloat(r))) {
    return Number(0);
  }
  return Number(parseFloat(r).toFixed(p));
}

function toDecimal(n, s = OAS.float_scale, p = OAS.float_precision) {
  if (Number.isNaN(Number.parseFloat(n))) {
    return Number(0);
  }
  return Number(parseFloat(n).toFixed(p));
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function chunkArray(arr, size) {
  let res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, size + i));
  }
  return res;
}

function jsonDeepMerge(obj1, obj2) {
  for (let key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (obj2[key] instanceof Object && obj1[key] instanceof Object) {
        obj1[key] = jsonDeepMerge(obj1[key], obj2[key]);
      } else {
        obj1[key] = obj2[key];
      }
    }
  }
  return obj1;
}

function jsonSortByMultiKeys(arr, keys) {
  if (Array.isArray(arr)) {
    return arr.sort((x, y) => {
      for (let key of keys) {
        if (x[key] < y[key]) return -1;
        if (x[key] > y[key]) return 1;
      }
      return 0;
    });
  } else {
    return arr;
  }
}

// error handling
const errorTypes = ["unhandledRejection", "uncaughtException"];
errorTypes.forEach((errType) => {
  if (DEBUG) {
    LOGGER.debug(dayjs().format(OAS.dayjsFormat), "debug", {
      trap: errType,
    });
  }
  process.on(errType, async (e) => {
    try {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
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
const signalTraps = ["SIGTERM", "SIGINT", "SIGQUIT"];
signalTraps.forEach((sigType) => {
  if (DEBUG) {
    LOGGER.debug(dayjs().format(OAS.dayjsFormat), "debug", {
      trap: sigType,
    });
  }
  switch (sigType) {
    case "SIGTERM":
      process.once(sigType, async () => {
        LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
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
        LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
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
        LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
          signal: sigType,
        });
        try {
          quit();
        } finally {
          process.exit(0);
        }
      });
      break;
    default:
      if (DEBUG) {
        LOGGER.debug(
          (dayjs().format(OAS.dayjsFormat), "debug", { signal: sigType })
        );
      }
  }
});

// load env
function loadEnv() {
  DEBUG = toBoolean(process.env.FETCHSRV_DEBUG || false);
  appName = process.env.MNI_NAME || "MNI";
  appVersion = process.env.MNI_VERSION || "0.0.0";
  appBuild = process.env.MNI_BUILD || "00000000.00";
  endpointRetryMs =
    toInteger(process.env.FETCHSRV_ENDPOINT_RETRY_INTERVAL_MS) || 5000;
  endpointKeepaliveMs =
    toInteger(process.env.FETCHSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS) || 60000;
  endPointUrlPrefix = process.env.APISERV_URL_PREFIX || "/mni";
  endPointUrlVersion = process.env.APISERV_URL_VERSION || "/v1";
  cveScan = toBoolean(process.env.FETCHSRV_CVE_SCAN || false);
  cveDirectory =
    path.resolve(process.env.FETCHSRV_CVE_DIRECTORY) ||
    "/usr/local/mni/cvelistV5";
  tlsSslVerification = toBoolean(
    process.env.FETCHSRV_TLS_INSECURE_CONNECTIONS || false
  );
  if (tlsSslVerification) {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
  }
  fxRateUpdate = toBoolean(process.env.FETCHSRV_FX_UPDATE || false);
}

// quit
function quit() {
  LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
    event: "quit",
  });
  if (jobsCronIds.length > 0) {
    for (let j = 0; j < jobsCronIds.length; j++) {
      jobsCronIds[j].stop();
    }
  }
  if (endpointTimer != null) {
    clearTimeout(endpointTimer);
  }
  if (dnsSdTimer != null) {
    clearTimeout(dnsSdTimer);
  }
}

function extractHostFromUrl(url) {
  let host = null;
  if (url.length > 0) {
    try {
      if (URL.canParse(url)) {
        host = new URL(url).hostname;
      } else {
        LOGGER.error(
          dayjs().format(OAS.dayjsFormat),
          "error",
          "extractHostFromUrl",
          {
            url: url,
            error: "not valid",
          }
        );
      }
    } catch (e) {
      LOGGER.error(
        dayjs().format(OAS.dayjsFormat),
        "error",
        "extractHostFromUrl",
        {
          url: url,
          error: e,
        }
      );
    }
  }
  return host;
}

async function dnsSd() {
  // use DNS service discovery to determine endpoint address:port etc
  // TODO: integrate with IAM
  // _https._tcp.gateway.mni.merkator.local,gateway.mni.merkator.local,8443,0,10
  if (endpointTimer != null) {
    clearTimeout(endpointTimer);
  }
  try {
    ENDPOINT = null;
    let dnsPromises = dns.promises;
    let address = null;
    let srvRec = await dnsPromises.resolve(
      "_https._tcp.gateway." +
        (process.env.DNSSERV_HOST || "mni") +
        "." +
        (process.env.DNSSERV_DOMAIN || "merkator.local"),
      "SRV"
    );
    let aRec = await dnsPromises.lookup(srvRec[0].name, { all: true });
    if (srvRec[0].port != null) {
      if (aRec[0].address != null) {
        address = aRec[0].address;
      }
    }
    ENDPOINT =
      "https://" +
      srvRec[0].name +
      ":" +
      srvRec[0].port +
      endPointUrlPrefix +
      endPointUrlVersion;
    dnsSdTimer = setTimeout(dnsSd, endpointKeepaliveMs);
    if (endpointTimer == null) {
      await checkEndpointReadiness();
    }
  } catch (e) {
    ENDPOINT_READY = false;
    ENDPOINT = null;
    if (e.code === "ENOTFOUND") {
      LOGGER.warn(dayjs().format(OAS.dayjsFormat), "warn", "endpoint", {
        dns:
          "DNS resolution failed, retrying in " +
          Number(parseFloat(endpointRetryMs / 100).toFixed(0)) +
          " seconds",
      });
      dnsSdTimer = setTimeout(dnsSd, endpointRetryMs * 10);
    } else if (e.code === "ETIMEOUT") {
      LOGGER.warn(dayjs().format(OAS.dayjsFormat), "warn", "endpoint", {
        dns:
          "DNS resolution timed out, retrying in " +
          Number(parseFloat(endpointRetryMs / 100).toFixed(0)) +
          " seconds",
      });
      dnsSdTimer = setTimeout(dnsSd, endpointRetryMs * 10);
    } else {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "endpoint", {
        dns: "DNS resolution failed",
        error: e,
      });
      dnsSdTimer = setTimeout(dnsSd, endpointRetryMs);
    }
  }
}

async function fetchJobs() {
  let secret = null;
  try {
    while (!ENDPOINT_READY) {
      await sleep(endpointRetryMs);
    }
    let url = ENDPOINT + "/fetch/jobs";
    await fetch(url, {
      method: "GET",
      headers: {
        Accept: OAS.mimeJSON,
      },
      keepalive: true,
      signal: AbortSignal.timeout(endpointRetryMs),
    })
      .then((response) => {
        if (response.ok) {
          if (
            response.status == 200 &&
            toInteger(response.headers.get("Content-Length")) > 0
          ) {
            return response.json();
          }
        } else {
          LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "fetchJobs", {
            scope: secretScope,
            realm: realm,
            status: response.status,
            error: response.statusText,
          });
        }
      })
      .then(async (data) => {
        if (data != null) {
          jobs = [];
          for (let j = 0; j < data.length; j++) {
            jobs.push(data[j]);
          }
        }
      })
      .catch((err) => {
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "fetchJobs", {
          error: err,
        });
      });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "fetchJobs",
      state: "failed",
      error: e,
    });
  }
  return secret;
}

async function fetchTokenSecretKey(realm) {
  let secret = null;
  try {
    while (!ENDPOINT_READY) {
      await sleep(endpointRetryMs);
    }
    let url =
      ENDPOINT +
      "/secret/" +
      secretScope +
      "/" +
      realm +
      "/" +
      OAS.secretTypeToken;
    await fetch(url, {
      method: "GET",
      headers: {
        Accept: OAS.mimeJSON,
      },
      keepalive: true,
      signal: AbortSignal.timeout(endpointRetryMs),
    })
      .then((response) => {
        if (response.ok) {
          if (
            response.status == 200 &&
            toInteger(response.headers.get("Content-Length")) > 0
          ) {
            return response.json();
          }
        } else {
          LOGGER.error(
            dayjs().format(OAS.dayjsFormat),
            "error",
            "fetchTokenSecretKey",
            {
              scope: secretScope,
              realm: realm,
              status: response.status,
              error: response.statusText,
            }
          );
        }
      })
      .then(async (data) => {
        if (data != null) {
          /*
          if (data.token?.identity != null) {
            secret.identity = data.token.identity;
          }
            */
          if (data.token?.key != null) {
            secret = data.token.key;
          }
        }
      })
      .catch((err) => {
        LOGGER.error(
          dayjs().format(OAS.dayjsFormat),
          "error",
          "fetchTokenSecretKey",
          {
            scope: secretScope,
            realm: realm,
            error: err,
          }
        );
      });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "fetchTokenSecretKey",
      state: "failed",
      scope: secretScope,
      realm: realm,
      error: e,
    });
  }
  return secret;
}

async function jobFxRateUpdate(fxRateApiUrl) {
  if (fxRateUpdate) {
    try {
      LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
        event: "fxRateUpdate",
        state: "start",
      });
      let base = "EUR";
      let currency = [];
      let rates = {};
      // get installed base currency
      // /currency/default
      while (!ENDPOINT_READY) {
        await sleep(endpointRetryMs);
      }
      let url = ENDPOINT + "/currency/default";
      await fetch(url, {
        method: "GET",
        headers: {
          Accept: OAS.mimeJSON,
        },
        keepalive: true,
        signal: AbortSignal.timeout(endpointRetryMs),
      })
        .then((response) => {
          if (response.ok) {
            if (
              response.status == 200 &&
              toInteger(response.headers.get("Content-Length")) > 0
            ) {
              return response.json();
            }
          }
        })
        .then(async (data) => {
          if (data != null) {
            if (data.isoCode != null) {
              if (DEBUG) {
                LOGGER.debug(
                  dayjs().format(OAS.dayjsFormat),
                  "debug",
                  "fxRateUpdate",
                  {
                    base: data.isoCode,
                  }
                );
              }
              base = data.isoCode;
            }
          }
        })
        .catch((err) => {
          LOGGER.error(
            dayjs().format(OAS.dayjsFormat),
            "error",
            "fxRateUpdate",
            {
              error: err,
            }
          );
        });

      // get installed currencies
      url = ENDPOINT + "/currency";
      await fetch(url, {
        method: "GET",
        headers: {
          Accept: OAS.mimeJSON,
        },
        keepalive: true,
        signal: AbortSignal.timeout(endpointRetryMs),
      })
        .then((response) => {
          if (response.ok) {
            if (
              response.status == 200 &&
              toInteger(response.headers.get("Content-Length")) > 0
            ) {
              return response.json();
            }
          }
        })
        .then(async (data) => {
          if (data != null) {
            if (DEBUG) {
              LOGGER.debug(
                dayjs().format(OAS.dayjsFormat),
                "debug",
                "fxRateUpdate",
                {
                  currencies: data.length,
                }
              );
            }
            if (data != null) {
              if (data.length > 0) {
                currency = data;
              }
            }
          }
        })
        .catch((err) => {
          LOGGER.error(
            dayjs().format(OAS.dayjsFormat),
            "error",
            "fxRateUpdate",
            {
              error: err,
            }
          );
        });

      // get rate updates
      let fxRateApiKey = await fetchTokenSecretKey(
        extractHostFromUrl(fxRateApiUrl)
      );
      url =
        fxRateApiUrl +
        "?access_key=" +
        fxRateApiKey +
        "&base=" +
        base +
        "&format=1";
      await fetch(url, {
        method: "GET",
        headers: {
          Accept: OAS.mimeJSON,
        },
        signal: AbortSignal.timeout(endpointRetryMs),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
        })
        .then(async (data) => {
          if (data != null) {
            if (data.success == true) {
              if (data.base.toLowerCase() == base.toLowerCase()) {
                if (data.rates != null) {
                  rates = data.rates;
                }
              }
            }
          }
        })
        .catch((err) => {
          LOGGER.error(
            dayjs().format(OAS.dayjsFormat),
            "error",
            "fxRateUpdate",
            {
              error: err,
            }
          );
        });

      // scan the retrieved rates for currency and update if found
      if (currency.length > 0) {
        for (let c = 0; c < currency.length; c++) {
          currency[c].changed = false;
          if (currency[c].isoCode.toLowerCase() != base.toLowerCase()) {
            let newRate = rates[currency[c].isoCode];
            if (newRate != null) {
              if (
                newRate >= OAS.currency_rate.min &&
                newRate <= OAS.currency_rate.max
              ) {
                if (DEBUG) {
                  LOGGER.debug(
                    dayjs().format(OAS.dayjsFormat),
                    "debug",
                    "fxRateUpdate",
                    {
                      isoCode: currency[c].isoCode,
                      old: currency[c].rate,
                      new: toDecimal(
                        newRate,
                        OAS.currency_scale,
                        OAS.currency_precision
                      ),
                    }
                  );
                }
                currency[c].changed = true;
                currency[c].rate = toDecimal(
                  newRate,
                  OAS.currency_scale,
                  OAS.currency_precision
                );
              }
            }
          }
        }
      }

      // patch the updated currencies
      if (currency.length > 0) {
        for (let c = 0; c < currency.length; c++) {
          if (currency[c].changed == true) {
            await fetch(ENDPOINT + "/currency/" + currency[c].currencyId, {
              method: "PATCH",
              headers: {
                "Content-Type": OAS.mimeJSON,
              },
              keepalive: true,
              body: JSON.stringify({ rate: currency[c].rate }),
            })
              .then((response) => {
                if (response.ok) {
                  noop();
                } else {
                  LOGGER.error(
                    dayjs().format(OAS.dayjsFormat),
                    "error",
                    "fxRateUpdate",
                    {
                      currencyId: currency[c].currencyId,
                      isoCode: currency[c].isoCode,
                      rate: currency[c].rate,
                      status: response.status,
                      statusText: response.statusText,
                    }
                  );
                }
              })
              .catch((err) => {
                LOGGER.error(
                  dayjs().format(OAS.dayjsFormat),
                  "error",
                  "fxRateUpdate",
                  {
                    currencyId: currency[c].currencyId,
                    isoCode: currency[c].isoCode,
                    rate: currency[c].rate,
                    error: err,
                  }
                );
              });
          }
        }
      }

      LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
        event: "fxRateUpdate",
        state: "stop",
      });
    } catch (e) {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
        event: "fxRateUpdate",
        state: "failed",
        error: e,
      });
    }
  }
}

async function jobAlertNeCveScan(threshold = 100) {
  if (cveScan) {
    try {
      LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
        event: "alertNeCveScan",
        state: "start",
        threshold: threshold,
      });
      // TODO:
      LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
        event: "alertNeCveScan",
        state: "stop",
      });
    } catch (e) {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
        event: "alertNeCveScan",
        state: "failed",
        error: e,
      });
    }
  }
}

async function jobCveRepoPull(target = cveDirectory) {
  if (cveScan) {
    try {
      LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
        event: "cveRepoPull",
        state: "start",
        target: target,
      });
      if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
          try {
            const exec = promisify(execCb);
            const { error, stdout, stderr } = await exec(
              "git pull --rebase origin main && git sparse-checkout reapply",
              { cwd: target }
            );
            if (DEBUG) {
              LOGGER.debug(
                dayjs().format(OAS.dayjsFormat),
                "debug",
                "cveRepoPull",
                {
                  stdout: stdout,
                  stderr: stderr,
                }
              );
            }
          } catch (e) {
            LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
              event: "cveRepoPull",
              state: "failed",
              error: e,
            });
          }
          LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
            event: "cveRepoPull",
            state: "stop",
          });
        } else {
          LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
            event: "cveRepoPull",
            state: "failed",
            target: target,
            error: "is not a directory",
          });
        }
      } else {
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
          event: "cveRepoPull",
          state: "failed",
          target: target,
          error: "does not exist",
        });
      }
    } catch (e) {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
        event: "cveRepoPull",
        state: "failed",
        error: e,
      });
    }
  }
}

async function jobCveListBuild(target = cveDirectory) {
  if (cveScan) {
    try {
      while (!ENDPOINT_READY) {
        await sleep(endpointRetryMs);
      }
      let cveFiles = await glob(target + path.sep + "**/CVE-*.json");
      let url = ENDPOINT + "/nes/vendors";
      await fetch(url, {
        method: "GET",
        headers: {
          Accept: OAS.mimeJSON,
        },
        keepalive: true,
        signal: AbortSignal.timeout(endpointRetryMs),
      })
        .then((response) => {
          if (response.ok) {
            if (
              response.status == 200 &&
              toInteger(response.headers.get("Content-Length")) > 0
            ) {
              return response.json();
            } else if (response.status == 204) {
              noop();
            } else {
              LOGGER.error(
                dayjs().format(OAS.dayjsFormat),
                "error",
                "jobCveListBuild",
                {
                  state: "unknown",
                  status: response.status,
                  statusText: response.statusText,
                }
              );
            }
          }
        })
        .then(async (data) => {
          if (data != null) {
            for (let n = 0; n < data.length; n++) {
              cveFiles.forEach((cveFile) => {
                let cveId = null;
                let cvePublished = null;
                let cveUpdated = null;
                let cvePlatforms = [];
                let cveVersions = [];
                try {
                  fs.readFile(cveFile, "utf-8", function (err, cve) {
                    if (err) throw err;
                    if (cve.includes(data[n].vendor)) {
                      if (cve.includes(data[n].model)) {
                        try {
                          let cveObj = JSON.parse(cve);
                          cveId = cveObj.cveMetadata.cveId;
                          cvePublished = dayjs(
                            cveObj.cveMetadata.datePublished
                          ).format(OAS.dayjsFormat);
                          if (cveObj.cveMetadata?.dateUpdated != null) {
                            cveUpdated = dayjs(
                              cveObj.cveMetadata.dateUpdated
                            ).format(OAS.dayjsFormat);
                          }
                          if (
                            cveObj.containers?.cna?.affected[0]?.platforms
                              .length > 0
                          ) {
                            for (
                              let p = 0;
                              p <
                              cveObj.containers.cna.affected[0].platforms
                                .length;
                              p++
                            ) {
                              cvePlatforms.push(
                                cveObj.containers.cna.affected[0].platforms[p]
                              );
                            }
                          }
                          if (
                            cveObj.containers?.cna?.affected[0]?.versions
                              .length > 0
                          ) {
                            for (
                              let v = 0;
                              v <
                              cveObj.containers.cna.affected[0].versions.length;
                              v++
                            ) {
                              cveVersions.push(
                                cveObj.containers.cna.affected[0].versions[v]
                              );
                            }
                          }
                          let cveJson = {
                            cveId: cveId,
                            published: cvePublished,
                            vendor: data[n].vendor,
                            uri: cveFile.replace(target + path.sep, ""),
                            platforms: cvePlatforms,
                            versions: cveVersions,
                          };
                          if (cveUpdated != null) {
                            cveJson.updated = cveUpdated;
                          }
                          if (DEBUG) {
                            LOGGER.debug(
                              dayjs().format(OAS.dayjsFormat),
                              "debug",
                              "jobCveListBuild",
                              {
                                file: cveFile,
                                cveId: cveId,
                                published: cvePublished,
                                vendor: data[n].vendor,
                                model: data[n].model,
                              }
                            );
                          }
                          try {
                            fetch(ENDPOINT + "/cve", {
                              method: "POST",
                              headers: {
                                "Content-Type": OAS.mimeJSON,
                                Accept: OAS.mimeJSON,
                              },
                              keepalive: true,
                              body: JSON.stringify(cveJson),
                            })
                              .then((response) => {
                                if (response.ok || response.status == 409) {
                                  noop();
                                } else {
                                  LOGGER.error(
                                    dayjs().format(OAS.dayjsFormat),
                                    "error",
                                    "jobCveListBuild",
                                    {
                                      file: cveFile,
                                      cveId: cveId,
                                      published: cvePublished,
                                      vendor: data[n].vendor,
                                      model: data[n].model,
                                      status: response.status,
                                      statusText: response.statusText,
                                    }
                                  );
                                }
                              })
                              .catch((err) => {
                                LOGGER.error(
                                  dayjs().format(OAS.dayjsFormat),
                                  "error",
                                  "jobCveListBuild",
                                  {
                                    file: cveFile,
                                    cveId: cveId,
                                    published: cvePublished,
                                    vendor: data[n].vendor,
                                    model: data[n].model,
                                    error: err,
                                  }
                                );
                              });
                          } catch (err) {
                            LOGGER.error(
                              dayjs().format(OAS.dayjsFormat),
                              "error",
                              "jobCveListBuild",
                              {
                                error: err,
                              }
                            );
                          }
                        } catch (err) {
                          // bad JSON
                          LOGGER.debug(
                            "cveFile=" + cveFile,
                            "vendor=" + data[n].vendor,
                            "model=" + data[n].model,
                            "bad JSON=" + err
                          );
                        }
                      }
                    }
                  });
                } catch (err) {
                  LOGGER.error(
                    dayjs().format(OAS.dayjsFormat),
                    "error",
                    "jobCveListBuild",
                    {
                      file: cveFile,
                      vendor: data[n].vendor,
                      model: data[n].model,
                      error: err,
                    }
                  );
                }
              });
            }
          }
        });
    } catch (err) {
      LOGGER.error(
        dayjs().format(OAS.dayjsFormat),
        "error",
        "jobCveListBuild",
        {
          error: err,
        }
      );
    }
  }
}

async function checkEndpointReadiness() {
  if (ENDPOINT != null) {
    try {
      await fetch(ENDPOINT + "/api/readiness", {
        method: "GET",
        headers: {
          Accept: OAS.mimeJSON,
        },
        keepalive: true,
        signal: AbortSignal.timeout(endpointRetryMs),
      })
        .then((response) => {
          if (response.ok) {
            if (toInteger(response.headers.get("Content-Length")) > 0) {
              return response.json();
            }
          } else {
            ENDPOINT_READY = false;
            LOGGER.error(
              dayjs().format(OAS.dayjsFormat),
              "error",
              "endpoint bad response status",
              {
                fqdn: ENDPOINT + "/api/readiness",
                status: response.status,
              }
            );
          }
        })
        .then((data) => {
          if (data?.point != null) {
            let datePoint = new RegExp("^[0-9]{8}T[0-9]{6}$");
            if (datePoint.test(data.point)) {
              ENDPOINT_READY = true;
            } else {
              ENDPOINT_READY = false;
              LOGGER.error(
                dayjs().format(OAS.dayjsFormat),
                "error",
                "endpoint response invalid date point",
                {
                  fqdn: ENDPOINT + "/api/readiness",
                  point: data.point,
                }
              );
            }
          } else {
            ENDPOINT_READY = false;
            LOGGER.error(
              dayjs().format(OAS.dayjsFormat),
              "error",
              "endpoint response null date point",
              {
                fqdn: ENDPOINT + "/api/readiness",
              }
            );
          }
        })
        .catch((e) => {
          ENDPOINT_READY = false;
          LOGGER.error(
            dayjs().format(OAS.dayjsFormat),
            "error",
            "endpoint no response",
            {
              fqdn: ENDPOINT + "/api/readiness",
              error: e,
            }
          );
        });
    } catch (e) {
      ENDPOINT_READY = false;
      LOGGER.error(
        dayjs().format(OAS.dayjsFormat),
        "error",
        "endpoint not reachable",
        {
          fqdn: ENDPOINT + "/api/readiness",
          error: e,
        }
      );
    }
  } else {
    ENDPOINT_READY = false;
    LOGGER.error(
      dayjs().format(OAS.dayjsFormat),
      "error",
      "endpoint not resolved"
    );
  }
  if (ENDPOINT_READY) {
    endpointTimer = setTimeout(checkEndpointReadiness, endpointKeepaliveMs);
  } else {
    endpointTimer = setTimeout(checkEndpointReadiness, endpointRetryMs);
  }
}

async function queueDrain() {
  if (queueDrainTimer != null) {
    clearTimeout(queueDrainTimer);
  }
  let queueEmpty = false;
  do {
    try {
      while (!ENDPOINT_READY) {
        await sleep(endpointRetryMs);
      }
      let url = ENDPOINT + "/fetch/queue";
      await fetch(url, {
        method: "GET",
        headers: {
          Accept: OAS.mimeJSON,
        },
        keepalive: true,
        signal: AbortSignal.timeout(endpointRetryMs),
      })
        .then((response) => {
          if (response.ok) {
            if (
              response.status == 200 &&
              toInteger(response.headers.get("Content-Length")) > 0
            ) {
              return response.json();
            } else if (response.status == 204) {
              queueDrainTimer = setTimeout(queueDrain, queueDrainIntervalMs);
              queueEmpty = true;
            } else {
              LOGGER.error(
                dayjs().format(OAS.dayjsFormat),
                "error",
                "queueDrain",
                {
                  state: "unknown",
                  status: response.status,
                  statusText: response.statusText,
                }
              );
              queueDrainTimer = setTimeout(queueDrain, queueDrainIntervalMs);
            }
          }
        })
        .then((data) => {
          if (data != null) {
            if (data.qId != null) {
              let q = {
                qId: toInteger(data.qId),
                point: data.point,
                id: data.fetchJobId,
              };

              // do something

              //
              deleteQueueItem(q.qId);
            }
          }
        })
        .catch((err) => {
          LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "queueDrain", {
            url: url,
            error: err,
          });
        });
    } catch (err) {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "queueDrain", {
        error: err,
      });
    }
    await sleep(1000); // 1 second delay between processing queue entries
  } while (!queueEmpty);
}

async function deleteQueueItem(qId) {
  try {
    while (!ENDPOINT_READY) {
      await sleep(endpointRetryMs);
    }
    let url = ENDPOINT + "/fetch/queue/" + qId;
    await fetch(url, {
      method: "DELETE",
      keepalive: true,
      signal: AbortSignal.timeout(endpointRetryMs),
    })
      .then((response) => {
        if (!response.ok) {
          LOGGER.error(
            dayjs().format(OAS.dayjsFormat),
            "error",
            "deleteQueueItem",
            {
              url: url,
              status: response.status,
              response: response.statusText,
            }
          );
        }
      })
      .catch((err) => {
        LOGGER.error(
          dayjs().format(OAS.dayjsFormat),
          "error",
          "deleteQueueItem",
          {
            url: url,
            error: err,
          }
        );
      });
  } catch (err) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "deleteQueueItem", {
      error: err,
    });
  }
}

//
var run = async () => {
  // load env
  loadEnv();

  // discover endpoint via DNS
  await dnsSd();

  // banner
  process.stdout.write(String.fromCharCode.apply(null, OAS.bannerGraffti));

  LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
    event: "starting",
    mni: {
      name: appName,
      version: appVersion,
      build: appBuild,
    },
    cveScan: {
      enabled: cveScan,
      directory: cveDirectory,
    },
    endpoint: {
      fqdn: ENDPOINT,
      ready: ENDPOINT_READY,
      retryInterval: endpointRetryMs,
      keepaliveInterval: endpointKeepaliveMs,
    },
    environment: {
      timestamp: OAS.dayjsFormat,
      ignoreTlsSsl: tlsSslVerification,
    },
    fx: {
      enabled: fxRateUpdate,
    },
  });

  // get list of fetch jobs
  await fetchJobs();

  // create cronJobs for all enabled jobs based on protocol
  for (let j = 0; j < jobs.length; j++) {
    let fetchId = jobs[j].fetchId;
    let cronProtocol = jobs[j].protocol;
    let cronDescription = jobs[j].description;
    let cronEnabled = toBoolean(jobs[j].enabled);
    let cronTime = jobs[j].cronTime;
    let cronFunction = jobs[j].function;
    let cronRetries = toInteger(jobs[j].retry.retries);
    let cronCurrentRetry = toInteger(jobs[j].retry.currentRetry);
    let cronRetryDelay = toInteger(jobs[j].retry.retryDelay);
    let cronMaxLifeRetries = toInteger(jobs[j].retry.maxLifeRetries);
    let cronCurrentLifeRetries = toInteger(jobs[j].retry.currentLifeRetries);
    let cronMaxRandomDelay = Math.floor(Math.random() * 13 * 1000);
    switch (cronProtocol) {
      case OAS.fetchProtocolEmail:
        break;
      case OAS.fetchProtocolFtp:
        break;
      case OAS.fetchProtocolHttp:
        if (jobs[j].http?.url != null) {
          try {
            cronFunction = cronFunction.replace(
              /{url}/g,
              "'" + jobs[j].http.url + "'"
            );
            jobsCronIds.push(
              eval(
                "cron.schedule('" +
                  cronTime +
                  "',() => {" +
                  cronFunction +
                  "},{scheduled: " +
                  cronEnabled +
                  ",recoverMissedExecutions: true, name: '" +
                  cronDescription +
                  "',noOverlap: true,maxRandomDelay: " +
                  cronMaxRandomDelay +
                  "});"
              )
            );
          } catch (err) {
            if (DEBUG) {
              LOGGER.error(
                dayjs().format(OAS.dayjsFormat),
                "error",
                "cronJobs",
                {
                  id: fetchId,
                  function: cronFunction,
                  error: err,
                }
              );
            }
          }
        }
        break;
      case OAS.fetchProtocolMysql:
        break;
      case OAS.fetchProtocolNetconf:
        break;
      case OAS.fetchProtocolNone:
        try {
          cronFunction = cronFunction.replace(
            /{cveDirectory}/g,
            "'" + cveDirectory + "'"
          );
          jobsCronIds.push(
            eval(
              "cron.schedule('" +
                cronTime +
                "',() => {" +
                cronFunction +
                "},{scheduled: " +
                cronEnabled +
                ",recoverMissedExecutions: true, name: '" +
                cronDescription +
                "',noOverlap: true,maxRandomDelay: " +
                cronMaxRandomDelay +
                "});"
            )
          );
        } catch (err) {
          if (DEBUG) {
            LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "cronJobs", {
              id: fetchId,
              function: cronFunction,
              error: err,
            });
          }
        }
        break;
      case OAS.fetchProtocolOracle:
        break;
      case OAS.fetchProtocolScp:
        break;
      case OAS.fetchProtocolSnmp:
        break;
      case OAS.fetchProtocolSsh:
        break;
      case OAS.fetchProtocolTelnet:
        break;
      case OAS.fetchProtocolWorkflow:
        break;
    }
    if (DEBUG) {
      LOGGER.debug(dayjs().format(OAS.dayjsFormat), "debug", "cronJobs", {
        id: fetchId,
        protocol: cronProtocol,
        description: cronDescription,
        enabled: cronEnabled,
        time: cronTime,
        function: cronFunction,
        delay: cronMaxRandomDelay,
        retry: {
          retries: cronRetries,
          currentRetry: cronCurrentRetry,
          retryDelay: cronRetryDelay,
          life: {
            maxRetries: cronMaxLifeRetries,
            currentRetries: cronCurrentLifeRetries,
          },
        },
      });
    }
  }

  // process a queue item
  await queueDrain();

  // sleep
  while (true) {
    await sleep(1000);
  }
};

// main
run().catch((e) => LOGGER.error(e));
