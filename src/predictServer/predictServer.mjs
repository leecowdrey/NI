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

var DEBUG = false;
var ENDPOINT_READY = false;
var ENDPOINT = null;
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
var dateBoundaryIntervalMs = 1800000; // 30 minutes
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
  DEBUG = toBoolean(process.env.PREDICTSERV_DEBUG || false);
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
  LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
    event: "quit",
  });
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
      LOGGER.warn(dayjs().format(OAS.dayjsFormat), "warn", "endpoint", {
        dns:
          "DNS resolution failed, retrying in " +
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

async function getDateBoundary() {
  if (dateBoundaryTimer != null) {
    clearTimeout(dateBoundaryTimer);
  }
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
            dayjs().format(OAS.dayjsFormat),
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
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "getDateBoundary", {
          url: url,
          error: err,
        });
      });
  } catch (err) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "getDateBoundary", {
      error: err,
    });
  }
  dateBoundaryTimer = setTimeout(getDateBoundary, dateBoundaryIntervalMs);
}

async function duplicate(bundle) {
  try {
    // get the resource
    let body = {};
    let url =
      bundle.endpoint +
      "/" +
      bundle.resource +
      "/" +
      bundle.id +
      "?point=" +
      bundle.point;
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
        body = data;
      });

    // delete all predicted variants of the specified resource
    url =
      bundle.endpoint + "/" + bundle.resource + "/" + bundle.id + "?predicted";
    await fetch(url, {
      method: "DELETE",
      signal: AbortSignal.timeout(bundle.abortMs),
    })
      .then((response) => {
        if (!response.ok) {
          return false;
        }
      })
      .catch((err) => {
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "duplicate", {
          event: "deletePredicted",
          qId: bundle.qId,
          resource: bundle.resource,
          id: bundle.id,
          error: err,
        });
        return false;
      });

    let predictedPoint = dayjs(bundle.point, OAS.dayjsFormat).add(
      bundle.predicted.duration,
      bundle.predicted.unit
    );
    // move the predicted point back 1 second from the predicted boundary
    predictedPoint = predictedPoint.subtract(1, "s");

    // update original
    if (body.point != null) {
      body.point = predictedPoint.format(OAS.dayjsFormat);
    }
    if (body.source != null) {
      body.source = "predicted";
    }
    url = bundle.endpoint + "/" + bundle.resource + "/" + bundle.id;
    await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": OAS.mimeJSON,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(bundle.abortMs),
    })
      .then((response) => {
        return response.ok;
      })
      .catch((err) => {
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "duplicate", {
          event: "updateResource",
          qId: bundle.qId,
          resource: bundle.resource,
          id: bundle.id,
          error: err,
        });
        return false;
      });
  } catch (err) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "duplicate", {
      qId: bundle.qId,
      resource: bundle.resource,
      id: bundle.id,
      error: err,
    });
  }
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
                  dayjs().format(OAS.dayjsFormat),
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
              LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "queueDrain", {
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
                  .then((timelineResponse) => {
                    if (timelineResponse.ok) {
                      if (
                        toInteger(
                          timelineResponse.headers.get("Content-Length")
                        ) > 0
                      ) {
                        return timelineResponse.json();
                      }
                    }
                  })
                  .then((timelineData) => {
                    if (timelineData != null) {
                      if (Array.isArray(timelineData)) {
                        if (timelineData.length > 0) {
                          let historicalTimeline = [];
                          let predictedTimeline = [];
                          for (let p = 0; p < timelineData.length; p++) {
                            // only use most recent historical resource incarnation for prediction
                            if (timelineData[p].source == "historical") {
                              historicalTimeline.push(timelineData[p].point);
                            } else if (timelineData[p].source == "predicted") {
                              predictedTimeline.push(timelineData[p].point);
                            }
                          }
                          if (historicalTimeline.length > 0) {
                            historicalTimeline = Array.from(
                              new Set(historicalTimeline.map(JSON.stringify))
                            )
                              .map(JSON.parse)
                              .sort();
                          }
                          if (predictedTimeline.length > 0) {
                            predictedTimeline = Array.from(
                              new Set(predictedTimeline.map(JSON.stringify))
                            )
                              .map(JSON.parse)
                              .sort();
                          }
                          if (
                            historicalTimeline.length > 0 &&
                            predictedTimeline.length == 0
                          ) {
                            // if only single incarnation of resource exists then simply duplicate
                            if (DEBUG) {
                              LOGGER.debug(
                                dayjs().format(OAS.dayjsFormat),
                                "debug",
                                "queueDrain",
                                {
                                  resource: q.resource,
                                  qId: q.qId,
                                  id: q.id,
                                  state: q.state,
                                  method: "duplicate",
                                }
                              );
                            }

                            let duplicateStatus = duplicate({
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
                              point: historicalTimeline[ historicalTimeline.length - 1 ],
                            });
                            //if (duplicateStatus) {
                            deleteQueueItem(q.qId);
                            //}
                            /*
                            } else if (
                              historicalTimeline.length > 1 &&
                              predictedTimeline.length > 0
                            ) {
                              // multiple incarnations of historical resource exists so use most recent
                              if (DEBUG) {
                                LOGGER.debug(
                                  dayjs().format(OAS.dayjsFormat),
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
                              /*
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
                                  },
                                ])
                                .then((qId) => {
                                  deleteQueueItem(qId);
                                })
                                .catch((err) => {
                                  LOGGER.error(
                                    dayjs().format(OAS.dayjsFormat),
                                    "error",
                                    "resourcesDrain",
                                    {
                                      method: "methodOne",
                                      qId: err.qId,
                                    }
                                  );
                                });
                              deleteQueueItem(q.qId);
                            }
                            */
                          } else {
                            deleteQueueItem(q.qId);
                          }
                        }
                      }
                    }
                  })
                  .catch((err) => {
                    LOGGER.error(
                      dayjs().format(OAS.dayjsFormat),
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
                  dayjs().format(OAS.dayjsFormat),
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
    let url = ENDPOINT + "/predict/queue/" + qId;
    await fetch(url, {
      method: "DELETE",
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
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "deleteQueueItem", {
          url: url,
          error: err,
        });
      });
  } catch (err) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "deleteQueueItem", {
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
          if (data.point != null) {
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
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "endpoint not resolved");
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

  // establish worker pools (not for simple duplicate)
  predictMethodOne = workerpool.pool("./predictMethodOne.mjs", {
    minWorkers: 1,
    maxWorkers: threadsPredictMethodOne,
    workerType: "thread",
  });

  // banner
  process.stdout.write(String.fromCharCode.apply(null, OAS.bannerGraffti));

  LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
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
      timestamp: OAS.dayjsFormat,
      ignoreTlsSsl: tlsSslVerification,
    },
    workerPoolsThreads: {
      max: maxParallelism,
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
