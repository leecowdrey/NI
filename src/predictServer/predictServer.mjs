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
import { MAX, v4 as uuidv4 } from "uuid";
import { Console } from "node:console";
import dayjs from "dayjs";
import os from "os";
import workerpool from "workerpool";

const allPrintableRegEx = /[ -~]/gi;
const maxParallelism = os.availableParallelism() - 4; // 4 is default nodejs thread pool size
const threadsDuplicate = 1;
const threadsPredictMethodOne = 2;

var dayjsFormat = "YYYYMMDD[T]HHmmss";
var dayjsDateFormat = "YYYYMMDD";

var DEBUG = false;
var ENDPOINT_READY = false;
var ENDPOINT = null;
var predictDuplicate = null;
var predictMethodOne = null;

//const output = fs.createWriteStream('./stdout.log');
//const errorOutput = fs.createWriteStream('./stderr.log');
var LOGGER = new Console({
  stdout: process.stdout,
  stderr: process.stderr,
  colorMode: false,
});

var tlsSslVerification = false;
var queueDrainTimer = null;
var queueDrainIntervalMs = 30000;
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
var historicalDuration = 1;
var historicalUnit = "year";
var predictedDuration = 6;
var predictedUnit = "month";

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
const signalTraps = ["SIGTERM", "SIGINT", "SIGQUIT"];
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
    default:
      if (DEBUG) {
        LOGGER.debug(
          (dayjs().format(dayjsFormat), "debug", { signal: sigType })
        );
      }
  }
});

// load env
function loadEnv() {
  DEBUG = toBoolean(process.env.PREDICTSERV_DEBUG || false);
  dayjsFormat =
    process.env.PREDICTSERV_TIMESTAMP_FORMAT || "YYYYMMDD[T]HHmmssZ";
  appName = process.env.MNI_NAME || "MNI";
  appVersion = process.env.MNI_VERSION || "0.0.0";
  appBuild = process.env.MNI_BUILD || "00000000.00";
  endpointRetryMs =
    toInteger(process.env.PREDICTSERV_ENDPOINT_RETRY_INTERVAL_MS) || 5000;
  endpointKeepaliveMs =
    toInteger(process.env.PREDICTSERV_ENDPOINT_KEEPALIVE_INTERVAL_MS) || 60000;
  endPointUrlPrefix = process.env.APISERV_URL_PREFIX || "/mni";
  endPointUrlVersion = process.env.APISERV_URL_VERSION || "/v1";
  tlsSslVerification = toBoolean(
    process.env.PREDICTSERV_TLS_INSECURE_CONNECTIONS || false
  );
  if (tlsSslVerification) {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
  }
}

// quit
function quit() {
  LOGGER.info(dayjs().format(dayjsFormat), "info", {
    event: "quit",
  });
  if (predictDuplicate != null) {
    predictDuplicate.terminate({ force: true, timeout: endpointRetryMs });
  }
  if (predictMethodOne != null) {
    predictMethodOne.terminate({ force: true, timeout: endpointRetryMs });
  }
  if (queueDrainTimer != null) {
    clearTimeout(queueDrainTimer);
  }
  if (dateBoundaryTimer != null) {
    clearTimeout(dateBoundaryTimer);
  }
  if (endpointTimer != null) {
    clearTimeout(endpointTimer);
  }
  if (dnsSdTimer != null) {
    clearTimeout(dnsSdTimer);
  }
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
      LOGGER.warn(dayjs().format(dayjsFormat), "warn", "endpoint", {
        dns:
          "DNS resolution failed, retrying in " +
          Number(parseFloat(endpointRetryMs / 100).toFixed(0)) +
          " seconds",
      });
      dnsSdTimer = setTimeout(dnsSd, endpointRetryMs * 10);
    } else {
      LOGGER.error(dayjs().format(dayjsFormat), "error", "endpoint", {
        dns: "DNS resolution failed",
        error: e,
      });
      dnsSdTimer = setTimeout(dnsSd, endpointRetryMs);
    }
  }
}

async function getDateBoundary() {
  try {
    while (!ENDPOINT_READY) {
      await sleep(endpointRetryMs);
    }
    let url = ENDPOINT + "/admin/data";
    await fetch(url, {
      method: "GET",
      headers: {
        Accept: OAS.mimeJSON,
      },
      signal: AbortSignal.timeout(endpointRetryMs),
    })
      .then((response) => {
        if (response.ok) {
          if (toInteger(response.headers.get("Content-Length")) > 0) {
            return response.json();
          }
        }
      })
      .then((data) => {
        historicalDuration = toInteger(data.historical.duration);
        predictedDuration = toInteger(data.predicted.duration);
        // adjust units - ('second','minute','hour','day','week','month','quarter','year');
        switch (data.historical.unit) {
          case "second":
            historicalUnit = "s";
            break;
          case "minute":
            historicalUnit = "m";
            break;
          case "hour":
            historicalUnit = "h";
            break;
          case "day":
            historicalUnit = "d";
            break;
          case "week":
            historicalUnit = "w";
            break;
          case "month":
            historicalUnit = "M";
            break;
          case "quarter":
            historicalUnit = "M";
            historicalDuration = historicalDuration * 3;
            break;
          case "year":
            historicalUnit = "y";
            break;
        }
        switch (data.predicted.unit) {
          case "second":
            predictedUnit = "s";
            break;
          case "minute":
            predictedUnit = "m";
            break;
          case "hour":
            predictedUnit = "h";
            break;
          case "day":
            predictedUnit = "d";
            break;
          case "week":
            predictedUnit = "w";
            break;
          case "month":
            predictedUnit = "M";
            break;
          case "quarter":
            predictedUnit = "M";
            predictedDuration = predictedDuration * 3;
            break;
          case "year":
            predictedUnit = "y";
            break;
        }
        if (DEBUG) {
          LOGGER.debug(
            dayjs().format(dayjsFormat),
            "debug",
            "getDateBoundary",
            {
              historicalDuration: historicalDuration,
              historicalUnit: historicalUnit,
              predictedDuration: predictedDuration,
              predictedUnit: predictedUnit,
            }
          );
        }
      })
      .catch((err) => {
        LOGGER.error(dayjs().format(dayjsFormat), "error", "getDateBoundary", {
          url: url,
          error: err,
        });
      });
  } catch (err) {
    LOGGER.error(dayjs().format(dayjsFormat), "error", "getDateBoundary", {
      error: err,
    });
  }
  dateBoundaryTimer = setTimeout(getDateBoundary, dateBoundaryIntervalMs);
}

async function queueDrain() {
  let queueEmpty = false;
  do {
    try {
      while (!ENDPOINT_READY) {
        await sleep(endpointRetryMs);
      }
      let url = ENDPOINT + "/predict/queue";
      await fetch(url, {
        method: "GET",
        headers: {
          Accept: OAS.mimeJSON,
        },
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
              if (DEBUG) {
                LOGGER.debug(
                  dayjs().format(dayjsFormat),
                  "debug",
                  "queueDrain",
                  {
                    state: "empty",
                  }
                );
              }
              queueDrainTimer = setTimeout(queueDrain, queueDrainIntervalMs);
              queueEmpty = true;
            } else {
              LOGGER.error(dayjs().format(dayjsFormat), "error", "queueDrain", {
                state: "unknown",
                status: response.status,
                statusText: response.statusText,
              });
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
                resource: data.resource,
                id: data.id,
                state: data.state,
              };

              try {
                let url = ENDPOINT + "/" + q.resource + "/timeline/" + q.id;
                fetch(url, {
                  method: "GET",
                  headers: {
                    Accept: OAS.mimeJSON,
                  },
                  signal: AbortSignal.timeout(endpointRetryMs),
                })
                  .then((response) => {
                    if (response.ok) {
                      if (
                        toInteger(response.headers.get("Content-Length")) > 0
                      ) {
                        return response.json();
                      }
                    }
                  })
                  .then((data) => {
                    if (data != null) {
                      if (Array.isArray(data)) {
                        if (data.length > 0) {
                          let historicalTimeline = [];
                          let predictedTimeline = [];
                          for (let p = 0; p < data.length; p++) {
                            // only use most recent historical resource incarnation for prediction
                            if (data[p].source === "historical") {
                              historicalTimeline.push(data[p].point);
                            } else if (data[p].source === "predicted") {
                              predictedTimeline.push(data[p].point);
                            }
                          }
                          LOGGER.debug("id:"+q.id,"historicalPoints:"+historicalTimeline.length,"predictedPoints:"+predictedTimeline.length);
                          if (historicalTimeline.length > 0 && predictedTimeline.length == 0) {
                            historicalTimeline = Array.from(
                              new Set(historicalTimeline.map(JSON.stringify))
                            )
                              .map(JSON.parse)
                              .sort();
                            if (historicalTimeline.length == 1) {
                              // if only single incarnation of resource exists then simply duplicate
                              if (DEBUG) {
                                LOGGER.debug(
                                  dayjs().format(dayjsFormat),
                                  "debug",
                                  "queueDrain",
                                  {
                                    resource: q.resource,
                                    id: q.id,
                                    state: q.state,
                                    method: "duplicate",
                                  }
                                );
                              }
                              predictDuplicate
                                .exec("runMethod", [
                                  {
                                    endpoint: ENDPOINT,
                                    abortMs: endpointRetryMs,
                                    predicted: {
                                      duration: predictedDuration,
                                      unit: predictedUnit,
                                    },
                                    historical: {
                                      duration: historicalDuration,
                                      unit: historicalUnit,
                                    },
                                    qId: q.qId,
                                    resource: q.resource,
                                    id: q.id,
                                    point: historicalTimeline[0],
                                  },
                                ])
                                .then((qId) => {
                                  deleteQueueItem(qId);
                                })
                                .catch((err) => {
                                  LOGGER.error(
                                    dayjs().format(dayjsFormat),
                                    "error",
                                    "resourcesDrain",
                                    {
                                      method: "duplicate",
                                      qId: err.qId,
                                      status: err.status,
                                      error: err.statusText,
                                    }
                                  );
                                });
                            } else if (historicalTimeline.length > 1 && predictedTimeline.length == 0) {
                              // multiple incarnations of historical resource exists so use most recent
                              if (DEBUG) {
                                LOGGER.debug(
                                  dayjs().format(dayjsFormat),
                                  "debug",
                                  "queueDrain",
                                  {
                                    resource: q.resource,
                                    id: q.id,
                                    state: q.state,
                                    method: "methodOne",
                                  }
                                );
                              }
                              predictMethodOne
                                .exec("runMethod", [
                                  {
                                    endpoint: ENDPOINT,
                                    abortMs: endpointRetryMs,
                                    predicted: {
                                      duration: predictedDuration,
                                      unit: predictedUnit,
                                    },
                                    historical: {
                                      duration: historicalDuration,
                                      unit: historicalUnit,
                                    },
                                    qId: q.qId,
                                    resource: q.resource,
                                    id: q.id,
                                    point: historicalTimeline[historicalTimeline.length - 1],
                                  },
                                ])
                                .then((qId) => {
                                  deleteQueueItem(qId);
                                })
                                .catch((err) => {
                                  LOGGER.error(
                                    dayjs().format(dayjsFormat),
                                    "error",
                                    "resourcesDrain",
                                    {
                                      method: "methodOne",
                                      qId: err.qId,
                                      status: err.status,
                                      error: err.statusText,
                                    }
                                  );
                                });
                            }
                          } else {
                            deleteQueueItem(q.qId);
                          }
                        }
                      }
                    }
                  })
                  .catch((err) => {
                    LOGGER.error(
                      dayjs().format(dayjsFormat),
                      "error",
                      "resourcesDrain",
                      {
                        url: url,
                        error: err,
                      }
                    );
                  });
              } catch (err) {
                LOGGER.error(
                  dayjs().format(dayjsFormat),
                  "error",
                  "resourcesDrain",
                  {
                    target: resourcesFileTarget,
                    error: err,
                  }
                );
              }
            }
          }
        })
        .catch((err) => {
          LOGGER.error(dayjs().format(dayjsFormat), "error", "queueDrain", {
            url: url,
            error: err,
          });
        });
    } catch (err) {
      LOGGER.error(dayjs().format(dayjsFormat), "error", "queueDrain", {
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
    let url = ENDPOINT + "/predict/queue/" + qId;
    await fetch(url, {
      method: "DELETE",
      signal: AbortSignal.timeout(endpointRetryMs),
    })
      .then((response) => {
        if (!response.ok) {
          LOGGER.error(
            dayjs().format(dayjsFormat),
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
        LOGGER.error(dayjs().format(dayjsFormat), "error", "deleteQueueItem", {
          url: url,
          error: err,
        });
      });
  } catch (err) {
    LOGGER.error(dayjs().format(dayjsFormat), "error", "deleteQueueItem", {
      error: err,
    });
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
              dayjs().format(dayjsFormat),
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
          if (data.point != null) {
            let datePoint = new RegExp("^[0-9]{8}T[0-9]{6}$");
            if (datePoint.test(data.point)) {
              ENDPOINT_READY = true;
            } else {
              ENDPOINT_READY = false;
              LOGGER.error(
                dayjs().format(dayjsFormat),
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
              dayjs().format(dayjsFormat),
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
            dayjs().format(dayjsFormat),
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
        dayjs().format(dayjsFormat),
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
    LOGGER.error(dayjs().format(dayjsFormat), "error", "endpoint not resolved");
  }
  if (ENDPOINT_READY) {
    endpointTimer = setTimeout(checkEndpointReadiness, endpointKeepaliveMs);
  } else {
    endpointTimer = setTimeout(checkEndpointReadiness, endpointRetryMs);
  }
}

//
var run = async () => {
  // load env
  loadEnv();

  // discover endpoint via DNS
  await dnsSd();

  // establish worker pools
  predictDuplicate = workerpool.pool("./predictDuplicate.mjs", {
    minWorkers: 1,
    maxWorkers: threadsDuplicate,
    workerType: "thread",
  });
  predictMethodOne = workerpool.pool("./predictMethodOne.mjs", {
    minWorkers: 1,
    maxWorkers: threadsPredictMethodOne,
    workerType: "thread",
  });

  // banner
  //@formatter:off
  process.stdout.write(
    String.fromCharCode(
      32,
      95,
      95,
      32,
      32,
      95,
      95,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      95,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      95,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      95,
      95,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      32,
      10,
      124,
      32,
      32,
      92,
      47,
      32,
      32,
      124,
      32,
      95,
      95,
      95,
      32,
      95,
      32,
      95,
      95,
      124,
      32,
      124,
      32,
      95,
      95,
      95,
      95,
      32,
      95,
      124,
      32,
      124,
      95,
      32,
      95,
      95,
      95,
      32,
      32,
      95,
      32,
      95,
      95,
      32,
      32,
      32,
      95,
      32,
      95,
      95,
      95,
      95,
      32,
      32,
      32,
      95,
      95,
      47,
      32,
      47,
      95,
      95,
      32,
      32,
      95,
      95,
      32,
      95,
      32,
      10,
      124,
      32,
      124,
      92,
      47,
      124,
      32,
      124,
      47,
      32,
      95,
      32,
      92,
      32,
      39,
      95,
      95,
      124,
      32,
      124,
      47,
      32,
      47,
      32,
      95,
      96,
      32,
      124,
      32,
      95,
      95,
      47,
      32,
      95,
      32,
      92,
      124,
      32,
      39,
      95,
      95,
      124,
      32,
      124,
      32,
      39,
      95,
      32,
      92,
      32,
      92,
      32,
      47,
      32,
      47,
      32,
      47,
      32,
      95,
      95,
      124,
      47,
      32,
      95,
      96,
      32,
      124,
      10,
      124,
      32,
      124,
      32,
      32,
      124,
      32,
      124,
      32,
      32,
      95,
      95,
      47,
      32,
      124,
      32,
      32,
      124,
      32,
      32,
      32,
      60,
      32,
      40,
      95,
      124,
      32,
      124,
      32,
      124,
      124,
      32,
      40,
      95,
      41,
      32,
      124,
      32,
      124,
      32,
      32,
      32,
      32,
      124,
      32,
      124,
      32,
      124,
      32,
      92,
      32,
      86,
      32,
      47,
      32,
      47,
      92,
      95,
      95,
      32,
      92,
      32,
      40,
      95,
      124,
      32,
      124,
      10,
      124,
      95,
      124,
      32,
      32,
      124,
      95,
      124,
      92,
      95,
      95,
      95,
      124,
      95,
      124,
      32,
      32,
      124,
      95,
      124,
      92,
      95,
      92,
      95,
      95,
      44,
      95,
      124,
      92,
      95,
      95,
      92,
      95,
      95,
      95,
      47,
      124,
      95,
      124,
      32,
      32,
      32,
      32,
      124,
      95,
      124,
      32,
      124,
      95,
      124,
      92,
      95,
      47,
      95,
      47,
      32,
      124,
      95,
      95,
      95,
      47,
      92,
      95,
      95,
      44,
      95,
      124,
      10,
      10
    )
  );
  //@formatter:on

  LOGGER.info(dayjs().format(dayjsFormat), "info", {
    event: "starting",
    mni: {
      name: appName,
      version: appVersion,
      build: appBuild,
    },
    endpoint: {
      fqdn: ENDPOINT,
      ready: ENDPOINT_READY,
      retryInterval: endpointRetryMs,
      keepaliveInterval: endpointKeepaliveMs,
    },
    environment: {
      timestamp: dayjsFormat,
      ignoreTlsSsl: tlsSslVerification,
    },
    workerPoolsThreads: {
      max: maxParallelism,
      duplicate: threadsDuplicate,
      methodOne: threadsPredictMethodOne,
    },
  });

  // get administrative data from API server
  await getDateBoundary();

  // process a queue item
  await queueDrain();

  // sleep
  while (true) {
    await sleep(1000);
  }
};

// main
run().catch((e) => LOGGER.error(e));
