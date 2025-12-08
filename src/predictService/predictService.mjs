//=====================================================================
// Network Insight (NI)
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556 
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
/*
```mermaid
stateDiagram-v2
    [*] --> free
    faulty --> used
    faulty --> free
    free --> used
    free --> reserved
    free --> faulty
    used --> free
    used --> faulty
    reserved --> free
    reserved --> used
```
*/
//
import * as OAS from "./oasConstants.mjs";
import "dotenv/config";
import dns from "dns";
import { MAX, v4 as uuidv4 } from "uuid";
import { Console } from "node:console";
import dayjs from "dayjs";
const allPrintableRegEx = /[ -~]/gi;

var DEBUG = false;
var ENDPOINT_READY = false;
var ENDPOINT = null;
var endpointHost = null;
var endpointDomain = null;
var serviceUsername = null;
var serviceKey = null;
var serviceAuthentication = null;

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

const countOccurrences = (arr, val) =>
  arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
// countOccurrences([1, 1, 2, 1, 2, 3], 1); results 1 appearing 3 times

function findLargestInteger(arr) {
  let largest = null;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] > largest) {
      largest = arr[i];
    }
  }
  return largest;
}

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

function findMode(arr) {
  let frequencyTable = {};
  arr.forEach((elem) => (frequencyTable[elem] = frequencyTable[elem] + 1 || 1));
  let modes = [];
  let maxFrequency = 0;
  for (let key in frequencyTable) {
    if (frequencyTable[key] > maxFrequency) {
      modes = [Number(key)];
      maxFrequency = frequencyTable[key];
    } else if (frequencyTable[key] === maxFrequency) {
      modes.push(Number(key));
    }
  }
  return modes[0];
}

function findSMA(states, interval = states.length) {
  let index = interval - 1;
  let length = states.length + 1;
  let results = [];
  while (index < length) {
    index = index + 1;
    let intervalSlice = states.slice(index - interval, index);
    let sum = intervalSlice.reduce((prev, curr) => prev + curr, 0);
    results.push(sum / interval);
  }
  return results;
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
  DEBUG = toBoolean(process.env.PREDICTSRV_DEBUG || false);
  appName = process.env.NI_NAME || "NI";
  appVersion = process.env.NI_VERSION || "0.0.0";
  appBuild = process.env.NI_BUILD || "00000000.00";
  serviceUsername = process.env.NI_SERVICE_USERNAME || "internal";
  serviceKey = process.env.NI_SERVICE_KEY || "internal";
  serviceAuthentication =
    "Basic " +
    Buffer.from(serviceUsername + ":" + serviceKey).toString("base64");
  endpointHost = process.env.DNSSERV_HOST || "NI";
  endpointDomain = process.env.DNSSERV_DOMAIN || "cowdrey.local";
  endpointRetryMs =
    toInteger(process.env.PREDICTSRV_ENDPOINT_RETRY_INTERVAL_MS) || 15000;
  endpointKeepaliveMs =
    toInteger(process.env.PREDICTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS) || 60000;
  endPointUrlPrefix = process.env.APISERV_URL_PREFIX || "/ni";
  endPointUrlVersion = process.env.APISERV_URL_VERSION || "/v1";
  tlsSslVerification = toBoolean(
    process.env.PREDICTSRV_TLS_INSECURE_CONNECTIONS || false
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
  // _https._tcp.gateway.ni.cowdrey.local,gateway.ni.cowdrey.local,8443,0,10
  if (endpointTimer != null) {
    clearTimeout(endpointTimer);
  }
  try {
    ENDPOINT = null;
    let dnsPromises = dns.promises;
    let address = null;
    let srvRec = await dnsPromises.resolve(
      "_https._tcp.apiserver." + endpointHost + "." + endpointDomain,
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
        Authorization: serviceAuthentication,
      },
      keepalive: true,
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
        LOGGER.error(
          dayjs().format(OAS.dayjsFormat),
          "error",
          "getDateBoundary",
          {
            url: url,
            error: err,
          }
        );
      });
  } catch (err) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "getDateBoundary", {
      error: err,
    });
  }
  dateBoundaryTimer = setTimeout(getDateBoundary, dateBoundaryIntervalMs);
}

async function duplicate(bundle) {
  let status = false;
  try {
    while (!ENDPOINT_READY) {
      await sleep(endpointRetryMs);
    }
    let resource = null;
    // delete all predicted variants of the specified resource
    let url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id + "?predicted";
    status = await fetch(url, {
      method: "DELETE",
      keepalive: true,
      headers: {
        Authorization: serviceAuthentication,
      },
      signal: AbortSignal.timeout(endpointRetryMs),
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
    // get resource
    url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id;
    status = await fetch(url, {
      method: "GET",
      headers: {
        Accept: OAS.mimeJSON,
        Authorization: serviceAuthentication,
      },
      keepalive: true,
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
        if (data != null) {
          resource = data;
        }
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
    // update resource json data
    if (resource != null) {
      // move the predicted point back 1 second from the predicted boundary
      let predictedPoint = dayjs(bundle.point, OAS.dayjsFormat)
        .add(predictedDuration, predictedUnit)
        .subtract(1, "s");
      resource.point = predictedPoint.format(OAS.dayjsFormat);
      resource.source = OAS.sourcePredicted;
      // reset specific attributes on a per resource type basis for the predicted equivalent
      switch (bundle.resource) {
        case "cable":
          break;
        case "duct":
          break;
        case "pole":
          break;
        case "ne":
          // reset ne port error count back to 0
          for (let p = 0; p < resource.ports.length; p++) {
            resource.ports[p].errorCount = 0;
          }
          break;
        case "rack":
          break;
        case "service":
          break;
        case "site":
          break;
        case "trench":
          break;
      }
      // replace (put) resource
      url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id;
      status = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": OAS.mimeJSON,
          Authorization: serviceAuthentication,
        },
        body: JSON.stringify(resource),
        keepalive: true,
        signal: AbortSignal.timeout(endpointRetryMs),
      })
        .then((response) => {
          if (DEBUG) {
            LOGGER.debug(
              dayjs().format(OAS.dayjsFormat),
              "debug",
              "updateResource",
              {
                event: "duplicate",
                resource: bundle.resource,
                qId: bundle.qId,
                id: bundle.id,
                status: response.status,
              }
            );
          }
          if (response.ok) {
            return true;
          } else {
            return false;
          }
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
    } else {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "duplicate", {
        event: "updateResource",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: "empty resource",
      });
      return false;
    }
  } catch (err) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "duplicate", {
      qId: bundle.qId,
      resource: bundle.resource,
      id: bundle.id,
      error: err,
    });
  }
  return status;
}

async function predictCable(bundle) {
  let resource = null;
  let status = false;
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  // delete all predicted variants of the specified resource
  let url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id + "?predicted";
  status = await fetch(url, {
    method: "DELETE",
    keepalive: true,
    headers: {
      Authorization: serviceAuthentication,
    },
    signal: AbortSignal.timeout(endpointRetryMs),
  })
    .then((response) => {
      if (!response.ok) {
        return false;
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictCable", {
        event: "deletePredicted",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  // get resource
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id;
  status = await fetch(url, {
    method: "GET",
    headers: {
      Accept: OAS.mimeJSON,
      Authorization: serviceAuthentication,
    },
    keepalive: true,
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
      if (data != null) {
        resource = data;
      }
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
  // get historical timeline points
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  let points = [];
  url = ENDPOINT + "/" + bundle.resource + "/timeline/" + bundle.id;
  status = await fetch(url, {
    method: "GET",
    headers: {
      Accept: OAS.mimeJSON,
      Authorization: serviceAuthentication,
    },
    keepalive: true,
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
      if (data != null) {
        for (let p = 0; p < data.length; p++) {
          if (data[p].source == OAS.sourceHistorical) {
            points.push(data[p].point);
          }
        }
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictCable", {
        event: "updateResource",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  // get usage over all gathered timeline, need at least two points
  let timeline = [];
  for (let p = 0; p < points.length; p++) {
    while (!ENDPOINT_READY) {
      await sleep(endpointRetryMs);
    }
    let url =
      ENDPOINT +
      "/" +
      bundle.resource +
      "/" +
      bundle.id +
      "?point=" +
      points[p];
    status = await fetch(url, {
      method: "GET",
      headers: {
        Accept: OAS.mimeJSON,
        Authorization: serviceAuthentication,
      },
      keepalive: true,
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
        if (data != null) {
          switch (data.technology) {
            case "coax":
              timeline.push(OAS.cableState.indexOf(data.configuration.state));
              break;
            case "copper":
              timeline.push(OAS.cableState.indexOf(data.configuration.state));
              break;
            case "ethernet":
              timeline.push(OAS.cableState.indexOf(data.configuration.state));
              break;
            case "singleFiber":
              for (let s = 0; s < data.configuration.states.length; s++) {
                timeline.push({
                  strand: data.configuration.states[s].strand,
                  state: OAS.cableState.indexOf(
                    data.configuration.states[s].state
                  ),
                });
              }
              break;
            case "multiFiber":
              for (let s = 0; s < data.configuration.states.length; s++) {
                timeline.push({
                  ribbon: data.configuration.states[s].ribbon,
                  strand: data.configuration.states[s].strand,
                  state: OAS.cableState.indexOf(
                    data.configuration.states[s].state
                  ),
                });
              }
              break;
          }
        }
      })
      .catch((err) => {
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictCable", {
          event: "updateResource",
          qId: bundle.qId,
          resource: bundle.resource,
          id: bundle.id,
          error: err,
        });
        return false;
      });
  }
  // move the predicted point back 1 second from the predicted boundary
  let predictedPoint = dayjs(bundle.point, OAS.dayjsFormat)
    .add(predictedDuration, predictedUnit)
    .subtract(1, "s");
  resource.point = predictedPoint.format(OAS.dayjsFormat);
  resource.source = OAS.sourcePredicted;
  switch (resource.technology) {
    case "coax":
      let coaxLast = (timeline[timeline.length - 1] ||= OAS.cableState.indexOf(
        OAS.cableStateFree
      ));
      let coaxMostFrequent = findMode(timeline);
      let coaxNext = coaxLast;
      let coaxOccFree = toDecimal(
        countOccurrences(timeline, OAS.cableState.indexOf(OAS.cableStateFree))
      );
      let coaxOccFaulty = toDecimal(
        countOccurrences(timeline, OAS.cableState.indexOf(OAS.cableStateFaulty))
      );
      let coaxOccReserved = toDecimal(
        countOccurrences(
          timeline,
          OAS.cableState.indexOf(OAS.cableStateReserved)
        )
      );
      let coaxOccUsed = toDecimal(
        countOccurrences(timeline, OAS.cableState.indexOf(OAS.cableStateUsed))
      );
      switch (coaxLast) {
        case OAS.cableState.indexOf(OAS.cableStateFree):
          if (
            coaxOccUsed > coaxOccReserved &&
            coaxOccUsed > coaxOccFaulty &&
            coaxOccUsed > coaxOccFree
          ) {
            coaxNext = OAS.cableState.indexOf(OAS.cableStateUsed);
          } else if (
            coaxOccReserved > coaxOccUsed &&
            coaxOccReserved > coaxOccFaulty &&
            coaxOccReserved > coaxOccFree
          ) {
            coaxNext = OAS.cableState.indexOf(OAS.cableStateReserved);
          } else if (
            coaxOccUsed > coaxOccReserved &&
            coaxOccUsed > coaxOccFaulty &&
            coaxOccUsed > coaxOccFree
          ) {
            coaxNext = OAS.cableState.indexOf(OAS.cableStateUsed);
          } else {
            coaxNext = coaxMostFrequent;
          }
          break;
        case OAS.cableState.indexOf(OAS.cableStateFaulty):
          if (coaxOccUsed > coaxOccFree && coaxOccUsed > coaxOccFaulty) {
            coaxNext = OAS.cableState.indexOf(OAS.cableStateUsed);
          } else if (coaxOccFree > coaxOccUsed && coaxOccFree > coaxOccFaulty) {
            coaxNext = OAS.cableState.indexOf(OAS.cableStateFree);
          } else {
            coaxNext = coaxMostFrequent;
          }
          break;
        case OAS.cableState.indexOf(OAS.cableStateReserved):
          if (coaxOccUsed > coaxOccFree && coaxOccUsed > coaxOccReserved) {
            coaxNext = OAS.cableState.indexOf(OAS.cableStateUsed);
          } else if (
            coaxOccFree > coaxOccUsed &&
            coaxOccFree > coaxOccReserved
          ) {
            coaxNext = OAS.cableState.indexOf(OAS.cableStateFree);
          } else {
            coaxNext = coaxMostFrequent;
          }
          break;
        case OAS.cableState.indexOf(OAS.cableStateUsed):
          if (coaxOccFree > coaxOccFaulty && coaxOccFree > coaxOccUsed) {
            coaxNext = OAS.cableState.indexOf(OAS.cableStateFree);
          } else if (
            coaxOccFaulty > coaxOccFree &&
            coaxOccFaulty > coaxOccUsed
          ) {
            coaxNext = OAS.cableState.indexOf(OAS.cableStateFaulty);
          } else {
            coaxNext = coaxMostFrequent;
          }
          break;
      }
      if (DEBUG) {
        LOGGER.debug(
          dayjs().format(OAS.dayjsFormat),
          "debug",
          "updateResource",
          {
            event: "predictCable",
            resource: bundle.resource,
            id: bundle.id,
            pattern: timeline.toString(),
            last: OAS.cableState[coaxLast],
            next: OAS.cableState[coaxNext],
          }
        );
      }
      resource.configuration.state = OAS.cableState[coaxNext] ||=
        OAS.cableStateFree;
      /*
      let coaxSma = findSMA(timeline);
      let coaxPred = Math.trunc(coaxSma[coaxSma.length - 1]);
      if (coaxPred != null) {
        resource.configuration.state = OAS.cableState[coaxPred] ||=
          OAS.cableStateFree;
      }
          */
      break;
    case "copper":
      let copperLast = (timeline[timeline.length - 1] ||=
        OAS.cableState.indexOf(OAS.cableStateFree));
      let copperMostFrequent = findMode(timeline);
      let copperNext = copperLast;
      let copperOccFree = toDecimal(
        countOccurrences(timeline, OAS.cableState.indexOf(OAS.cableStateFree))
      );
      let copperOccFaulty = toDecimal(
        countOccurrences(timeline, OAS.cableState.indexOf(OAS.cableStateFaulty))
      );
      let copperOccReserved = toDecimal(
        countOccurrences(
          timeline,
          OAS.cableState.indexOf(OAS.cableStateReserved)
        )
      );
      let copperOccUsed = toDecimal(
        countOccurrences(timeline, OAS.cableState.indexOf(OAS.cableStateUsed))
      );
      switch (copperLast) {
        case OAS.cableState.indexOf(OAS.cableStateFree):
          if (
            copperOccUsed > copperOccReserved &&
            copperOccUsed > copperOccFaulty &&
            copperOccUsed > copperOccFree
          ) {
            copperNext = OAS.cableState.indexOf(OAS.cableStateUsed);
          } else if (
            copperOccReserved > copperOccUsed &&
            copperOccReserved > copperOccFaulty &&
            copperOccReserved > copperOccFree
          ) {
            copperNext = OAS.cableState.indexOf(OAS.cableStateReserved);
          } else if (
            copperOccUsed > copperOccReserved &&
            copperOccUsed > copperOccFaulty &&
            copperOccUsed > copperOccFree
          ) {
            copperNext = OAS.cableState.indexOf(OAS.cableStateUsed);
          } else {
            copperNext = copperMostFrequent;
          }
          break;
        case OAS.cableState.indexOf(OAS.cableStateFaulty):
          if (
            copperOccUsed > copperOccFree &&
            copperOccUsed > copperOccFaulty
          ) {
            copperNext = OAS.cableState.indexOf(OAS.cableStateUsed);
          } else if (
            copperOccFree > copperOccUsed &&
            copperOccFree > copperOccFaulty
          ) {
            copperNext = OAS.cableState.indexOf(OAS.cableStateFree);
          } else {
            copperNext = copperMostFrequent;
          }
          break;
        case OAS.cableState.indexOf(OAS.cableStateReserved):
          if (
            copperOccUsed > copperOccFree &&
            copperOccUsed > copperOccReserved
          ) {
            copperNext = OAS.cableState.indexOf(OAS.cableStateUsed);
          } else if (
            copperOccFree > copperOccUsed &&
            copperOccFree > copperOccReserved
          ) {
            copperNext = OAS.cableState.indexOf(OAS.cableStateFree);
          } else {
            copperNext = copperMostFrequent;
          }
          break;
        case OAS.cableState.indexOf(OAS.cableStateUsed):
          if (
            copperOccFree > copperOccFaulty &&
            copperOccFree > copperOccUsed
          ) {
            copperNext = OAS.cableState.indexOf(OAS.cableStateFree);
          } else if (
            copperOccFaulty > copperOccFree &&
            copperOccFaulty > copperOccUsed
          ) {
            copperNext = OAS.cableState.indexOf(OAS.cableStateFaulty);
          } else {
            copperNext = copperMostFrequent;
          }
          break;
      }
      if (DEBUG) {
        LOGGER.debug(
          dayjs().format(OAS.dayjsFormat),
          "debug",
          "updateResource",
          {
            event: "predictCable",
            resource: bundle.resource,
            id: bundle.id,
            pattern: timeline.toString(),
            last: OAS.cableState[copperLast],
            next: OAS.cableState[copperNext],
          }
        );
      }
      resource.configuration.state = OAS.cableState[copperNext] ||=
        OAS.cableStateFree;
      /*
      let copperSma = findSMA(timeline);
      let copperPred = Math.trunc(copperSma[copperSma.length - 1]);
      if (copperPred != null) {
        resource.configuration.state = OAS.cableState[copperPred] ||=
          OAS.cableStateFree;
      }
          */
      break;
    case "ethernet":
      let ethernetLast = (timeline[timeline.length - 1] ||=
        OAS.cableState.indexOf(OAS.cableStateFree));
      let ethernetMostFrequent = findMode(timeline);
      let ethernetNext = ethernetLast;
      let ethernetOccFree = toDecimal(
        countOccurrences(timeline, OAS.cableState.indexOf(OAS.cableStateFree))
      );
      let ethernetOccFaulty = toDecimal(
        countOccurrences(timeline, OAS.cableState.indexOf(OAS.cableStateFaulty))
      );
      let ethernetOccReserved = toDecimal(
        countOccurrences(
          timeline,
          OAS.cableState.indexOf(OAS.cableStateReserved)
        )
      );
      let ethernetOccUsed = toDecimal(
        countOccurrences(timeline, OAS.cableState.indexOf(OAS.cableStateUsed))
      );
      switch (ethernetLast) {
        case OAS.cableState.indexOf(OAS.cableStateFree):
          if (
            ethernetOccUsed > ethernetOccReserved &&
            ethernetOccUsed > ethernetOccFaulty &&
            ethernetOccUsed > ethernetOccFree
          ) {
            ethernetNext = OAS.cableState.indexOf(OAS.cableStateUsed);
          } else if (
            ethernetOccReserved > ethernetOccUsed &&
            ethernetOccReserved > ethernetOccFaulty &&
            ethernetOccReserved > ethernetOccFree
          ) {
            ethernetNext = OAS.cableState.indexOf(OAS.cableStateReserved);
          } else if (
            ethernetOccUsed > ethernetOccReserved &&
            ethernetOccUsed > ethernetOccFaulty &&
            ethernetOccUsed > ethernetOccFree
          ) {
            ethernetNext = OAS.cableState.indexOf(OAS.cableStateUsed);
          } else {
            ethernetNext = ethernetMostFrequent;
          }
          break;
        case OAS.cableState.indexOf(OAS.cableStateFaulty):
          if (
            ethernetOccUsed > ethernetOccFree &&
            ethernetOccUsed > ethernetOccFaulty
          ) {
            ethernetNext = OAS.cableState.indexOf(OAS.cableStateUsed);
          } else if (
            ethernetOccFree > ethernetOccUsed &&
            ethernetOccFree > ethernetOccFaulty
          ) {
            ethernetNext = OAS.cableState.indexOf(OAS.cableStateFree);
          } else {
            ethernetNext = ethernetMostFrequent;
          }
          break;
        case OAS.cableState.indexOf(OAS.cableStateReserved):
          if (
            ethernetOccUsed > ethernetOccFree &&
            ethernetOccUsed > ethernetOccReserved
          ) {
            ethernetNext = OAS.cableState.indexOf(OAS.cableStateUsed);
          } else if (
            ethernetOccFree > ethernetOccUsed &&
            ethernetOccFree > ethernetOccReserved
          ) {
            ethernetNext = OAS.cableState.indexOf(OAS.cableStateFree);
          } else {
            ethernetNext = ethernetMostFrequent;
          }
          break;
        case OAS.cableState.indexOf(OAS.cableStateUsed):
          if (
            ethernetOccFree > ethernetOccFaulty &&
            ethernetOccFree > ethernetOccUsed
          ) {
            ethernetNext = OAS.cableState.indexOf(OAS.cableStateFree);
          } else if (
            ethernetOccFaulty > ethernetOccFree &&
            ethernetOccFaulty > ethernetOccUsed
          ) {
            ethernetNext = OAS.cableState.indexOf(OAS.cableStateFaulty);
          } else {
            ethernetNext = ethernetMostFrequent;
          }
          break;
      }
      if (DEBUG) {
        LOGGER.debug(
          dayjs().format(OAS.dayjsFormat),
          "debug",
          "updateResource",
          {
            event: "predictCable",
            resource: bundle.resource,
            id: bundle.id,
            pattern: timeline.toString(),
            last: OAS.cableState[ethernetLast],
            next: OAS.cableState[ethernetNext],
          }
        );
      }
      resource.configuration.state = OAS.cableState[ethernetNext] ||=
        OAS.cableStateFree;
      /*
      let ethernetSma = findSMA(timeline);
      let ethernetPred = Math.trunc(ethernetSma[ethernetSma.length - 1]);
      if (ethernetPred != null) {
        resource.configuration.state = OAS.cableState[ethernetPred] ||=
          OAS.cableStateFree;
      }
          */
      break;
    case "singleFiber":
      for (let s = 1; s <= resource.configuration.strands; s++) {
        let strandSpecific = [];
        for (let u = 0; u < timeline.length; u++) {
          if (timeline[u].strand == s) {
            strandSpecific.push(timeline[u].state);
          }
        }
        if (strandSpecific.length > 0) {
          let singleFiberLast = (strandSpecific[strandSpecific.length - 1] ||=
            OAS.cableState.indexOf(OAS.cableStateFree));
          let singleFiberMostFrequent = findMode(strandSpecific);
          let singleFiberNext = singleFiberLast;
          let singleFiberOccFree = toDecimal(
            countOccurrences(
              strandSpecific,
              OAS.cableState.indexOf(OAS.cableStateFree)
            )
          );
          let singleFiberOccFaulty = toDecimal(
            countOccurrences(
              strandSpecific,
              OAS.cableState.indexOf(OAS.cableStateFaulty)
            )
          );
          let singleFiberOccReserved = toDecimal(
            countOccurrences(
              strandSpecific,
              OAS.cableState.indexOf(OAS.cableStateReserved)
            )
          );
          let singleFiberOccUsed = toDecimal(
            countOccurrences(
              strandSpecific,
              OAS.cableState.indexOf(OAS.cableStateUsed)
            )
          );
          switch (singleFiberLast) {
            case OAS.cableState.indexOf(OAS.cableStateFree):
              if (
                singleFiberOccUsed > singleFiberOccReserved &&
                singleFiberOccUsed > singleFiberOccFaulty &&
                singleFiberOccUsed > singleFiberOccFree
              ) {
                singleFiberNext = OAS.cableState.indexOf(OAS.cableStateUsed);
              } else if (
                singleFiberOccReserved > singleFiberOccUsed &&
                singleFiberOccReserved > singleFiberOccFaulty &&
                singleFiberOccReserved > singleFiberOccFree
              ) {
                singleFiberNext = OAS.cableState.indexOf(
                  OAS.cableStateReserved
                );
              } else if (
                singleFiberOccUsed > singleFiberOccReserved &&
                singleFiberOccUsed > singleFiberOccFaulty &&
                singleFiberOccUsed > singleFiberOccFree
              ) {
                singleFiberNext = OAS.cableState.indexOf(OAS.cableStateUsed);
              } else {
                singleFiberNext = singleFiberMostFrequent;
              }
              break;
            case OAS.cableState.indexOf(OAS.cableStateFaulty):
              if (
                singleFiberOccUsed > singleFiberOccFree &&
                singleFiberOccUsed > singleFiberOccFaulty
              ) {
                singleFiberNext = OAS.cableState.indexOf(OAS.cableStateUsed);
              } else if (
                singleFiberOccFree > singleFiberOccUsed &&
                singleFiberOccFree > singleFiberOccFaulty
              ) {
                singleFiberNext = OAS.cableState.indexOf(OAS.cableStateFree);
              } else {
                singleFiberNext = singleFiberMostFrequent;
              }
              break;
            case OAS.cableState.indexOf(OAS.cableStateReserved):
              if (
                singleFiberOccUsed > singleFiberOccFree &&
                singleFiberOccUsed > singleFiberOccReserved
              ) {
                singleFiberNext = OAS.cableState.indexOf(OAS.cableStateUsed);
              } else if (
                singleFiberOccFree > singleFiberOccUsed &&
                singleFiberOccFree > singleFiberOccReserved
              ) {
                singleFiberNext = OAS.cableState.indexOf(OAS.cableStateFree);
              } else {
                singleFiberNext = singleFiberMostFrequent;
              }
              break;
            case OAS.cableState.indexOf(OAS.cableStateUsed):
              if (
                singleFiberOccFree > singleFiberOccFaulty &&
                singleFiberOccFree > singleFiberOccUsed
              ) {
                singleFiberNext = OAS.cableState.indexOf(OAS.cableStateFree);
              } else if (
                singleFiberOccFaulty > singleFiberOccFree &&
                singleFiberOccFaulty > singleFiberOccUsed
              ) {
                singleFiberNext = OAS.cableState.indexOf(OAS.cableStateFaulty);
              } else {
                singleFiberNext = singleFiberMostFrequent;
              }
              break;
          }
          if (DEBUG) {
            LOGGER.debug(
              dayjs().format(OAS.dayjsFormat),
              "debug",
              "updateResource",
              {
                event: "predictCable",
                resource: bundle.resource,
                id: bundle.id,
                strand: s,
                pattern: strandSpecific.toString(),
                last: OAS.cableState[singleFiberLast],
                next: OAS.cableState[singleFiberNext],
              }
            );
          }
          for (let r = 0; r < resource.configuration.states.length; r++) {
            if (resource.configuration.states[r].strand == s) {
              resource.configuration.states[r].state = OAS.cableState[
                singleFiberNext
              ] ||= OAS.cableStateFree;
              break;
            }
          }
        }
      }
      break;
    case "multiFiber":
      for (let r = 1; r <= resource.configuration.ribbons; r++) {
        for (let s = 1; s <= resource.configuration.strands; s++) {
          let strandSpecific = [];
          for (let u = 0; u < timeline.length; u++) {
            if (timeline[u].ribbon == r && timeline[u].strand == s) {
              strandSpecific.push(timeline[u].state);
            }
          }
          if (strandSpecific.length > 0) {
            let multiFiberLast = (strandSpecific[strandSpecific.length - 1] ||=
              OAS.cableState.indexOf(OAS.cableStateFree));
            let multiFiberMostFrequent = findMode(strandSpecific);
            let multiFiberNext = multiFiberLast;
            let multiFiberOccFree = toDecimal(
              countOccurrences(
                strandSpecific,
                OAS.cableState.indexOf(OAS.cableStateFree)
              )
            );
            let multiFiberOccFaulty = toDecimal(
              countOccurrences(
                strandSpecific,
                OAS.cableState.indexOf(OAS.cableStateFaulty)
              )
            );
            let multiFiberOccReserved = toDecimal(
              countOccurrences(
                strandSpecific,
                OAS.cableState.indexOf(OAS.cableStateReserved)
              )
            );
            let multiFiberOccUsed = toDecimal(
              countOccurrences(
                strandSpecific,
                OAS.cableState.indexOf(OAS.cableStateUsed)
              )
            );
            switch (multiFiberLast) {
              case OAS.cableState.indexOf(OAS.cableStateFree):
                if (
                  multiFiberOccUsed > multiFiberOccReserved &&
                  multiFiberOccUsed > multiFiberOccFaulty &&
                  multiFiberOccUsed > multiFiberOccFree
                ) {
                  multiFiberNext = OAS.cableState.indexOf(OAS.cableStateUsed);
                } else if (
                  multiFiberOccReserved > multiFiberOccUsed &&
                  multiFiberOccReserved > multiFiberOccFaulty &&
                  multiFiberOccReserved > multiFiberOccFree
                ) {
                  multiFiberNext = OAS.cableState.indexOf(
                    OAS.cableStateReserved
                  );
                } else if (
                  multiFiberOccUsed > multiFiberOccReserved &&
                  multiFiberOccUsed > multiFiberOccFaulty &&
                  multiFiberOccUsed > multiFiberOccFree
                ) {
                  multiFiberNext = OAS.cableState.indexOf(OAS.cableStateUsed);
                } else {
                  multiFiberNext = multiFiberMostFrequent;
                }
                break;
              case OAS.cableState.indexOf(OAS.cableStateFaulty):
                if (
                  multiFiberOccUsed > multiFiberOccFree &&
                  multiFiberOccUsed > multiFiberOccFaulty
                ) {
                  multiFiberNext = OAS.cableState.indexOf(OAS.cableStateUsed);
                } else if (
                  multiFiberOccFree > multiFiberOccUsed &&
                  multiFiberOccFree > multiFiberOccFaulty
                ) {
                  multiFiberNext = OAS.cableState.indexOf(OAS.cableStateFree);
                } else {
                  multiFiberNext = multiFiberMostFrequent;
                }
                break;
              case OAS.cableState.indexOf(OAS.cableStateReserved):
                if (
                  multiFiberOccUsed > multiFiberOccFree &&
                  multiFiberOccUsed > multiFiberOccReserved
                ) {
                  multiFiberNext = OAS.cableState.indexOf(OAS.cableStateUsed);
                } else if (
                  multiFiberOccFree > multiFiberOccUsed &&
                  multiFiberOccFree > multiFiberOccReserved
                ) {
                  multiFiberNext = OAS.cableState.indexOf(OAS.cableStateFree);
                } else {
                  multiFiberNext = multiFiberMostFrequent;
                }
                break;
              case OAS.cableState.indexOf(OAS.cableStateUsed):
                if (
                  multiFiberOccFree > multiFiberOccFaulty &&
                  multiFiberOccFree > multiFiberOccUsed
                ) {
                  multiFiberNext = OAS.cableState.indexOf(OAS.cableStateFree);
                } else if (
                  multiFiberOccFaulty > multiFiberOccFree &&
                  multiFiberOccFaulty > multiFiberOccUsed
                ) {
                  multiFiberNext = OAS.cableState.indexOf(OAS.cableStateFaulty);
                } else {
                  multiFiberNext = multiFiberMostFrequent;
                }
                break;
            }
            if (DEBUG) {
              LOGGER.debug(
                dayjs().format(OAS.dayjsFormat),
                "debug",
                "updateResource",
                {
                  event: "predictCable",
                  resource: bundle.resource,
                  id: bundle.id,
                  ribbon: r,
                  strand: s,
                  pattern: strandSpecific.toString(),
                  last: OAS.cableState[multiFiberLast],
                  next: OAS.cableState[multiFiberNext],
                }
              );
            }
            for (let u = 0; u < resource.configuration.states.length; u++) {
              if (
                resource.configuration.states[u].ribbon == r &&
                resource.configuration.states[u].strand == s
              ) {
                resource.configuration.states[u].state = OAS.cableState[
                  multiFiberNext
                ] ||= OAS.cableStateFree;
                break;
              }
            }
          }
        }
      }
      break;
  }
  // replace (PUT) it back to keep a predicted variant
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id;
  status = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": OAS.mimeJSON,
      Authorization: serviceAuthentication,
    },
    body: JSON.stringify(resource),
    keepalive: true,
    signal: AbortSignal.timeout(endpointRetryMs),
  })
    .then((response) => {
      if (DEBUG) {
        LOGGER.debug(
          dayjs().format(OAS.dayjsFormat),
          "debug",
          "updateResource",
          {
            event: "predictCable",
            resource: bundle.resource,
            qId: bundle.qId,
            id: bundle.id,
            status: response.status,
          }
        );
      }
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictCable", {
        event: "updateResource",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  return status;
}

async function predictDuct(bundle) {
  let resource = null;
  let status = false;
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  // delete all predicted variants of the specified resource
  let url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id + "?predicted";
  status = await fetch(url, {
    method: "DELETE",
    keepalive: true,
    headers: {
      Authorization: serviceAuthentication,
    },
    signal: AbortSignal.timeout(endpointRetryMs),
  })
    .then((response) => {
      if (!response.ok) {
        return false;
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictDuct", {
        event: "deletePredicted",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  // get resource
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id;
  status = await fetch(url, {
    method: "GET",
    headers: {
      Accept: OAS.mimeJSON,
      Authorization: serviceAuthentication,
    },
    keepalive: true,
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
      if (data != null) {
        resource = data;
      }
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
  // get historical timeline points
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  let points = [];
  url = ENDPOINT + "/" + bundle.resource + "/timeline/" + bundle.id;
  status = await fetch(url, {
    method: "GET",
    headers: {
      Accept: OAS.mimeJSON,
      Authorization: serviceAuthentication,
    },
    keepalive: true,
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
      if (data != null) {
        for (let p = 0; p < data.length; p++) {
          if (data[p].source == OAS.sourceHistorical) {
            points.push(data[p].point);
          }
        }
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictDuct", {
        event: "updateResource",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  // get usage over all gathered timeline, need at least two points
  let timeline = [];
  for (let p = 0; p < points.length; p++) {
    while (!ENDPOINT_READY) {
      await sleep(endpointRetryMs);
    }
    let url =
      ENDPOINT +
      "/" +
      bundle.resource +
      "/" +
      bundle.id +
      "?point=" +
      points[p];
    status = await fetch(url, {
      method: "GET",
      headers: {
        Accept: OAS.mimeJSON,
        Authorization: serviceAuthentication,
      },
      keepalive: true,
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
        if (data != null) {
          timeline.push(OAS.ductState.indexOf(data.configuration.state));
        }
      })
      .catch((err) => {
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictDuct", {
          event: "updateResource",
          qId: bundle.qId,
          resource: bundle.resource,
          id: bundle.id,
          error: err,
        });
        return false;
      });
  }
  // move the predicted point back 1 second from the predicted boundary
  let predictedPoint = dayjs(bundle.point, OAS.dayjsFormat)
    .add(predictedDuration, predictedUnit)
    .subtract(1, "s");
  resource.point = predictedPoint.format(OAS.dayjsFormat);
  resource.source = OAS.sourcePredicted;
  let ductLast = (timeline[timeline.length - 1] ||= OAS.ductState.indexOf(
    OAS.ductStateFree
  ));
  let ductMostFrequent = findMode(timeline);
  let ductNext = ductLast;
  let ductOccFree = toDecimal(
    countOccurrences(timeline, OAS.ductState.indexOf(OAS.ductStateFree))
  );
  let ductOccFaulty = toDecimal(
    countOccurrences(timeline, OAS.ductState.indexOf(OAS.ductStateFaulty))
  );
  let ductOccReserved = toDecimal(
    countOccurrences(timeline, OAS.ductState.indexOf(OAS.ductStateReserved))
  );
  let ductOccUsed = toDecimal(
    countOccurrences(timeline, OAS.ductState.indexOf(OAS.ductStateUsed))
  );
  switch (ductLast) {
    case OAS.ductState.indexOf(OAS.ductStateFree):
      if (
        ductOccUsed > ductOccReserved &&
        ductOccUsed > ductOccFaulty &&
        ductOccUsed > ductOccFree
      ) {
        ductNext = OAS.ductState.indexOf(OAS.ductStateUsed);
      } else if (
        ductOccReserved > ductOccUsed &&
        ductOccReserved > ductOccFaulty &&
        ductOccReserved > ductOccFree
      ) {
        ductNext = OAS.ductState.indexOf(OAS.ductStateReserved);
      } else if (
        ductOccUsed > ductOccReserved &&
        ductOccUsed > ductOccFaulty &&
        ductOccUsed > ductOccFree
      ) {
        ductNext = OAS.ductState.indexOf(OAS.ductStateUsed);
      } else {
        ductNext = ductMostFrequent;
      }
      break;
    case OAS.ductState.indexOf(OAS.ductStateFaulty):
      if (ductOccUsed > ductOccFree && ductOccUsed > ductOccFaulty) {
        ductNext = OAS.ductState.indexOf(OAS.ductStateUsed);
      } else if (ductOccFree > ductOccUsed && ductOccFree > ductOccFaulty) {
        ductNext = OAS.ductState.indexOf(OAS.ductStateFree);
      } else {
        ductNext = ductMostFrequent;
      }
      break;
    case OAS.ductState.indexOf(OAS.ductStateReserved):
      if (ductOccUsed > ductOccFree && ductOccUsed > ductOccReserved) {
        ductNext = OAS.ductState.indexOf(OAS.ductStateUsed);
      } else if (ductOccFree > ductOccUsed && ductOccFree > ductOccReserved) {
        ductNext = OAS.ductState.indexOf(OAS.ductStateFree);
      } else {
        ductNext = ductMostFrequent;
      }
      break;
    case OAS.ductState.indexOf(OAS.ductStateUsed):
      if (ductOccFree > ductOccFaulty && ductOccFree > ductOccUsed) {
        ductNext = OAS.ductState.indexOf(OAS.ductStateFree);
      } else if (ductOccFaulty > ductOccFree && ductOccFaulty > ductOccUsed) {
        ductNext = OAS.ductState.indexOf(OAS.ductStateFaulty);
      } else {
        ductNext = ductMostFrequent;
      }
      break;
  }
  if (DEBUG) {
    LOGGER.debug(dayjs().format(OAS.dayjsFormat), "debug", "updateResource", {
      event: "predictDuct",
      resource: bundle.resource,
      id: bundle.id,
      pattern: timeline.toString(),
      last: OAS.ductState[ductLast],
      next: OAS.ductState[ductNext],
    });
  }
  resource.configuration.state = OAS.ductState[ductNext] ||= OAS.ductStateFree;
  // replace (PUT) it back to keep a predicted variant
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id;
  status = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": OAS.mimeJSON,
      Authorization: serviceAuthentication,
    },
    body: JSON.stringify(resource),
    keepalive: true,
    signal: AbortSignal.timeout(endpointRetryMs),
  })
    .then((response) => {
      if (DEBUG) {
        LOGGER.debug(
          dayjs().format(OAS.dayjsFormat),
          "debug",
          "updateResource",
          {
            event: "predictDuct",
            resource: bundle.resource,
            qId: bundle.qId,
            id: bundle.id,
            status: response.status,
          }
        );
      }
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictDuct", {
        event: "updateResource",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  return status;
}

async function predictPole(bundle) {
  let status = false;
  let resource = null;
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  // delete all predicted variants of the specified resource
  let url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id + "?predicted";
  status = await fetch(url, {
    method: "DELETE",
    keepalive: true,
    headers: {
      Authorization: serviceAuthentication,
    },
    signal: AbortSignal.timeout(endpointRetryMs),
  })
    .then((response) => {
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictPole", {
        event: "deletePredicted",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  return status;
}

async function predictNe(bundle) {
  let status = false;
  let resource = null;
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  // delete all predicted variants of the specified resource
  let url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id + "?predicted";
  status = await fetch(url, {
    method: "DELETE",
    keepalive: true,
    headers: {
      Authorization: serviceAuthentication,
    },
    signal: AbortSignal.timeout(endpointRetryMs),
  })
    .then((response) => {
      if (!response.ok) {
        return false;
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictNe", {
        event: "deletePredicted",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  // get resource
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id;
  status = await fetch(url, {
    method: "GET",
    headers: {
      Accept: OAS.mimeJSON,
      Authorization: serviceAuthentication,
    },
    keepalive: true,
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
      if (data != null) {
        resource = data;
      }
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
  // get historical timeline points
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  let points = [];
  url = ENDPOINT + "/" + bundle.resource + "/timeline/" + bundle.id;
  status = await fetch(url, {
    method: "GET",
    headers: {
      Accept: OAS.mimeJSON,
      Authorization: serviceAuthentication,
    },
    keepalive: true,
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
      if (data != null) {
        for (let p = 0; p < data.length; p++) {
          if (data[p].source == OAS.sourceHistorical) {
            points.push(data[p].point);
          }
        }
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictNe", {
        event: "updateResource",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  // get port state over all gathered timeline, need at least two points
  let timeline = [];
  for (let p = 0; p < points.length; p++) {
    while (!ENDPOINT_READY) {
      await sleep(endpointRetryMs);
    }
    let url = ENDPOINT + "/ne/" + bundle.id + "?point=" + points[p];
    status = await fetch(url, {
      method: "GET",
      headers: {
        Accept: OAS.mimeJSON,
        Authorization: serviceAuthentication,
      },
      keepalive: true,
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
        if (data != null) {
          for (let p = 0; p < data.ports.length; p++) {
            timeline.push({
              port: data.ports[p].name,
              state: OAS.portState.indexOf(data.ports[p].state),
            });
          }
        }
      })
      .catch((err) => {
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictNe", {
          event: "updateResource",
          qId: bundle.qId,
          resource: bundle.resource,
          id: bundle.id,
          error: err,
        });
        return false;
      });
  }
  // move the predicted point back 1 second from the predicted boundary
  let predictedPoint = dayjs(bundle.point, OAS.dayjsFormat)
    .add(predictedDuration, predictedUnit)
    .subtract(1, "s");
  resource.point = predictedPoint.format(OAS.dayjsFormat);
  resource.source = OAS.sourcePredicted;
  // should have [{port: "at-0/0/0", state: "free"},{port: "at-0/0/0", state: "used"},{port: "at-0/0/1", state:"free"},{port: "at-0/0/1", state:"free"}] etc.
  if (resource.ports > 0) {
    for (let s = 1; s <= resource.ports; s++) {
      // reset port error count
      resource.ports[s].errorCount = 0;
      //
      let portSpecific = [];
      for (let u = 0; u < timeline.length; u++) {
        if (timeline[u].port == s) {
          portSpecific.push(timeline[u].state);
        }
      }
      if (portSpecific.length > 0) {
        // TODO: perhaps use a Recurrent Neural Network (RNN) here??
        //let mode = findMode(portSpecific);
        let sma = findSMA(portSpecific);
        let mode = Math.trunc(sma[sma.length - 1]);
        if (mode != null) {
          let newState = (OAS.portState[mode] ||= OAS.portStateFree);
          // update resource ports
          for (let r = 0; r < resource.ports.length; r++) {
            if (resource.ports[r].name == resource.ports[s].name) {
              // if used then leave it as was
              //if (resource.ports[r].state != OAS.portStateUsed) {
              resource.ports[r].state = newState; // OAS.sourcePredicted ??
              //}
              break;
            }
          }
        }
      }
    }
  }
  // replace (PUT) it back to keep a predicted variant
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id;
  status = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": OAS.mimeJSON,
      Authorization: serviceAuthentication,
    },
    body: JSON.stringify(resource),
    keepalive: true,
    signal: AbortSignal.timeout(endpointRetryMs),
  })
    .then((response) => {
      if (DEBUG) {
        LOGGER.debug(
          dayjs().format(OAS.dayjsFormat),
          "debug",
          "updateResource",
          {
            event: "predictNe",
            resource: bundle.resource,
            qId: bundle.qId,
            id: bundle.id,
            status: response.status,
          }
        );
      }
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictNe", {
        event: "updateResource",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  return status;
}

async function predictRack(bundle) {
  let status = false;
  let resource = null;
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  // delete all predicted variants of the specified resource
  let url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id + "?predicted";
  status = await fetch(url, {
    method: "DELETE",
    keepalive: true,
    headers: {
      Authorization: serviceAuthentication,
    },
    signal: AbortSignal.timeout(endpointRetryMs),
  })
    .then((response) => {
      if (!response.ok) {
        return false;
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictRack", {
        event: "deletePredicted",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  // get resource
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id;
  status = await fetch(url, {
    method: "GET",
    headers: {
      Accept: OAS.mimeJSON,
      Authorization: serviceAuthentication,
    },
    keepalive: true,
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
      if (data != null) {
        resource = data;
      }
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
  // get historical timeline points
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  let points = [];
  url = ENDPOINT + "/" + bundle.resource + "/timeline/" + bundle.id;
  status = await fetch(url, {
    method: "GET",
    headers: {
      Accept: OAS.mimeJSON,
      Authorization: serviceAuthentication,
    },
    keepalive: true,
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
      if (data != null) {
        for (let p = 0; p < data.length; p++) {
          if (data[p].source == OAS.sourceHistorical) {
            points.push(data[p].point);
          }
        }
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictRack", {
        event: "updateResource",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  // get slot usage over all gathered timeline, need at least two points
  let timeline = [];
  for (let p = 0; p < points.length; p++) {
    while (!ENDPOINT_READY) {
      await sleep(endpointRetryMs);
    }
    let url = ENDPOINT + "/rack/slots/" + bundle.id + "?point=" + points[p];
    status = await fetch(url, {
      method: "GET",
      headers: {
        Accept: OAS.mimeJSON,
        Authorization: serviceAuthentication,
      },
      keepalive: true,
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
        if (data != null) {
          for (let s = 0; s < data.length; s++) {
            timeline.push({
              slot: data[s].slot,
              usage: OAS.rackSlotUsage.indexOf(data[s].usage),
            });
          }
        }
      })
      .catch((err) => {
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictRack", {
          event: "updateResource",
          qId: bundle.qId,
          resource: bundle.resource,
          id: bundle.id,
          error: err,
        });
        return false;
      });
  }
  // move the predicted point back 1 second from the predicted boundary
  if (bundle.point === null || bundle.point === "undefined") {
    bundle.point = dayjs().format(OAS.dayjsFormat);
  }
  let predictedPoint = dayjs(bundle.point, OAS.dayjsFormat)
    .add(predictedDuration, predictedUnit)
    .subtract(1, "s");
  resource.point = predictedPoint.format(OAS.dayjsFormat);
  resource.source = OAS.sourcePredicted;
  // should have [{slot: 1, usage: free},{slot: 1, usage: used},{slot: 2, usage:free},{slot: 2, usage:free}] etc.
  if (resource.slots > 0) {
    for (let s = 1; s <= resource.slots; s++) {
      let slotSpecific = [];
      for (let u = 0; u < timeline.length; u++) {
        if (timeline[u].slot == s) {
          slotSpecific.push(timeline[u].usage);
        }
      }
      if (slotSpecific.length > 0) {
        // TODO: perhaps use a Recurrent Neural Network (RNN) here??
        let sma = findSMA(slotSpecific);
        let mode = Math.trunc(sma[sma.length - 1]);
        if (mode != null) {
          let newUsage = (OAS.rackSlotUsage[mode] ||= OAS.rackSlotUsageFree);
          // update resource slots
          for (let r = 0; r < resource.slotUsage.length; r++) {
            if (resource.slotUsage[r].slot == s) {
              // if used was in use then leave it as in use
              // NOTE: clear the neId and host attributes if changing from used
              //if (resource.slotUsage[r].usage != OAS.rackSlotUsageUsed) {
              resource.slotUsage[r].usage = newUsage;
              //}
              break;
            }
          }
        }
      }
    }
  }
  // replace (PUT) it back to keep a predicted variant
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id;
  status = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": OAS.mimeJSON,
      Authorization: serviceAuthentication,
    },
    body: JSON.stringify(resource),
    keepalive: true,
    signal: AbortSignal.timeout(endpointRetryMs),
  })
    .then((response) => {
      if (DEBUG) {
        LOGGER.debug(
          dayjs().format(OAS.dayjsFormat),
          "debug",
          "updateResource",
          {
            event: "predictRack",
            resource: bundle.resource,
            qId: bundle.qId,
            id: bundle.id,
            status: response.status,
          }
        );
      }
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictRack", {
        event: "updateResource",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  return status;
}

async function predictService(bundle) {
  let status = false;
  let resource = null;
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  // delete all predicted variants of the specified resource
  let url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id + "?predicted";
  status = await fetch(url, {
    method: "DELETE",
    keepalive: true,
    headers: {
      Authorization: serviceAuthentication,
    },
    signal: AbortSignal.timeout(endpointRetryMs),
  })
    .then((response) => {
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictService", {
        event: "deletePredicted",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  return status;
}

async function predictSite(bundle) {
  let status = false;
  let resource = null;
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  // delete all predicted variants of the specified resource
  let url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id + "?predicted";
  status = await fetch(url, {
    method: "DELETE",
    keepalive: true,
    headers: {
      Authorization: serviceAuthentication,
    },
    signal: AbortSignal.timeout(endpointRetryMs),
  })
    .then((response) => {
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictSite", {
        event: "deletePredicted",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  return status;
}

async function predictTrench(bundle) {
  let status = false;
  let resource = null;
  while (!ENDPOINT_READY) {
    await sleep(endpointRetryMs);
  }
  // delete all predicted variants of the specified resource
  let url = ENDPOINT + "/" + bundle.resource + "/" + bundle.id + "?predicted";
  status = await fetch(url, {
    method: "DELETE",
    keepalive: true,
    headers: {
      Authorization: serviceAuthentication,
    },
    signal: AbortSignal.timeout(endpointRetryMs),
  })
    .then((response) => {
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    })
    .catch((err) => {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "predictTrench", {
        event: "deletePredicted",
        qId: bundle.qId,
        resource: bundle.resource,
        id: bundle.id,
        error: err,
      });
      return false;
    });
  return status;
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
          Authorization: serviceAuthentication,
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
                    Authorization: serviceAuthentication,
                  },
                  keepalive: true,
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
                  .then(async (timelineData) => {
                    if (timelineData != null) {
                      if (Array.isArray(timelineData)) {
                        if (timelineData.length > 0) {
                          let historicalTimeline = [];
                          let predictedTimeline = [];
                          let plannedTimeline = [];
                          for (let p = 0; p < timelineData.length; p++) {
                            if (
                              timelineData[p].source == OAS.sourceHistorical
                            ) {
                              historicalTimeline.push(timelineData[p].point);
                            } else if (
                              timelineData[p].source == OAS.sourcePredicted
                            ) {
                              predictedTimeline.push(timelineData[p].point);
                            } else if (
                              timelineData[p].source == OAS.sourcePlanned
                            ) {
                              plannedTimeline.push(timelineData[p].point);
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
                          if (plannedTimeline.length > 0) {
                            plannedTimeline = Array.from(
                              new Set(plannedTimeline.map(JSON.stringify))
                            )
                              .map(JSON.parse)
                              .sort();
                          }
                          if (historicalTimeline.length == 1) {
                            // if only single incarnation of resource exists then simply duplicate
                            // as can not predict anything
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
                            let duplicateOk = await duplicate({
                              qId: q.qId,
                              resource: q.resource,
                              id: q.id,
                              point:
                                historicalTimeline[
                                  historicalTimeline.length - 1
                                ],
                            });
                            if (duplicateOk) await deleteQueueItem(q.qId);
                          } else if (historicalTimeline.length > 1) {
                            // multiple incarnations of historical resource exists though need at least two points in the timeline
                            // for analysis and predictions - predictX functions will request timeline points again where necessary
                            if (DEBUG) {
                              LOGGER.debug(
                                dayjs().format(OAS.dayjsFormat),
                                "debug",
                                "queueDrain",
                                {
                                  resource: q.resource,
                                  id: q.id,
                                  state: q.state,
                                  method: "predict",
                                }
                              );
                              let predictOk = false;
                              switch (q.resource) {
                                case "cable":
                                  predictOk = await predictCable({
                                    qId: q.qId,
                                    resource: q.resource,
                                    id: q.id,
                                  });
                                  if (predictOk) await deleteQueueItem(q.qId);
                                  break;
                                case "duct":
                                  predictOk = await predictDuct({
                                    qId: q.qId,
                                    resource: q.resource,
                                    id: q.id,
                                  });
                                  if (predictOk) await deleteQueueItem(q.qId);
                                  break;
                                case "pole":
                                  predictOk = await predictPole({
                                    qId: q.qId,
                                    resource: q.resource,
                                    id: q.id,
                                  });
                                  if (predictOk) await deleteQueueItem(q.qId);
                                  break;
                                case "ne":
                                  predictOk = await predictNe({
                                    qId: q.qId,
                                    resource: q.resource,
                                    id: q.id,
                                  });
                                  if (predictOk) await deleteQueueItem(q.qId);
                                  break;
                                case "rack":
                                  predictOk = await predictRack({
                                    qId: q.qId,
                                    resource: q.resource,
                                    id: q.id,
                                  });
                                  if (predictOk) await deleteQueueItem(q.qId);
                                  break;
                                case "service":
                                  predictOk = await predictService({
                                    qId: q.qId,
                                    resource: q.resource,
                                    id: q.id,
                                  });
                                  if (predictOk) await deleteQueueItem(q.qId);
                                  break;
                                case "site":
                                  predictOk = await predictSite({
                                    qId: q.qId,
                                    resource: q.resource,
                                    id: q.id,
                                  });
                                  if (predictOk) await deleteQueueItem(q.qId);
                                  break;
                                case "trench":
                                  predictOk = await predictTrench({
                                    qId: q.qId,
                                    resource: q.resource,
                                    id: q.id,
                                  });
                                  if (predictOk) await deleteQueueItem(q.qId);
                                  break;
                                default:
                                  // unsupported resource, so just remove queue entry
                                  await deleteQueueItem(q.qId);
                              }
                            }
                          } else if (plannedTimeline.length > 0) {
                            if (DEBUG) {
                              LOGGER.debug(
                                dayjs().format(OAS.dayjsFormat),
                                "debug",
                                "queueDrain",
                                {
                                  resource: q.resource,
                                  id: q.id,
                                  state: q.state,
                                  method: OAS.sourcePlanned,
                                }
                              );
                            }
                            let plannedOk = true;
                            if (plannedOk) await deleteQueueItem(q.qId);
                          } else {
                            // TODO: unsupported combination so just remove queue entry for now
                            await deleteQueueItem(q.qId);
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
    if (qId != null) {
      while (!ENDPOINT_READY) {
        await sleep(endpointRetryMs);
      }
      let url = ENDPOINT + "/predict/queue/" + qId;
      await fetch(url, {
        method: "DELETE",
        keepalive: true,
        headers: {
          Authorization: serviceAuthentication,
        },
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
    }
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
          Authorization: serviceAuthentication,
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
    NI: {
      name: appName,
      version: appVersion,
      build: appBuild,
    },
    endpoint: {
      fqdn: ENDPOINT,
      ready: ENDPOINT_READY,
      retryInterval: endpointRetryMs,
      keepaliveInterval: endpointKeepaliveMs,
      credentials: {
        username: serviceUsername.replace(allPrintableRegEx, "*"),
        key: serviceKey.replace(allPrintableRegEx, "*"),
      },
    },
    environment: {
      timestamp: OAS.dayjsFormat,
      ignoreTlsSsl: tlsSslVerification,
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
