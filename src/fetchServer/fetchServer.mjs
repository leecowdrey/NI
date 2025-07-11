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
import simpleGit from "simple-git";
import { glob } from "glob";
import { URL } from "node:url";

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
var cveRepoCron = null;
var cveDirectory = null;
var cveRepoPullCronTime = null;
var cveListBuild = null;
var cveListBuildCronTime = null;
var fxRateApiKey = null;
var fxRateApiUrl = null;
var fxUpdateCron = null;
var fxRateCronTime = null;
var fxRateUpdate = null;

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
  cveRepoPullCronTime = process.env.FETCHSRV_CVE_PULL_CRONTIME || "00 20 * * *";
  cveListBuildCronTime =
    process.env.FETCHSRV_CVE_BUILD_CRONTIME || "30 20 * * *";
  tlsSslVerification = toBoolean(
    process.env.FETCHSRV_TLS_INSECURE_CONNECTIONS || false
  );
  if (tlsSslVerification) {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
  }
  fxRateUpdate = toBoolean(process.env.FETCHSRV_FX_UPDATE || false);
  if (fxRateUpdate) {
    fxRateCronTime = process.env.FETCHSRV_FX_CRONTIME || "0 9 * * *";
    fxRateApiUrl = process.env.FETCHSRV_FX_URL;
    if (fxRateApiUrl != null) {
      fxRateApiKey = fetchTokenSecret(extractHostFromUrl(fxRateApiUrl)).key;
    }
  }
}

// quit
function quit() {
  LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
    event: "quit",
  });
  if (fxUpdateCron != null) {
    fxUpdateCron.stop();
  }
  if (cveRepoCron != null) {
    cveRepoCron.stop();
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
    } else {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "endpoint", {
        dns: "DNS resolution failed",
        error: e,
      });
      dnsSdTimer = setTimeout(dnsSd, endpointRetryMs);
    }
  }
}

async function fetchTokenSecret(realm) {
  let secret = { identity: null, key: null };
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
          if (data.token?.identity != null) {
            secret.identity = data.token.identity;
          }
          if (data.token?.key != null) {
            secret.key = data.token.key;
          }
        }
      })
      .catch((err) => {
        LOGGER.error(
          dayjs().format(OAS.dayjsFormat),
          "error",
          "fetchTokenSecret",
          {
            scope: secretScope,
            realm: realm,
            error: err,
          }
        );
      });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "fetchTokenSecret",
      state: "failed",
      scope: secretScope,
      realm: realm,
      error: e,
    });
  }
  return secret;
}

async function jobFxRateUpdate() {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "fxRateUpdate",
      state: "start",
    });
    let base = "EUR";
    let currency = [];
    let rates = {};
    /*
    let rates = {
      AED: 4.312112,
      AFN: 82.430293
      ALL: 98.241038,
      AMD: 450.676379,
      ANG: 2.101309,
      AOA: 1076.707922,
      ARS: 1395.48114,
      AUD: 1.793766,
      AWG: 2.116429,
      AZN: 1.961917,
      BAM: 1.959552,
      BBD: 2.369808,
      BDT: 143.544857,
      BGN: 1.959925,
      BHD: 0.443028,
      BIF: 3495.797882,
      BMD: 1.174163,
      BND: 1.497612,
      BOB: 8.109597,
      BRL: 6.422435,
      BSD: 1.173682,
      BTC: 1.0996303e-5,
      BTN: 100.363165,
      BWP: 15.691514,
      BYN: 3.840969,
      BYR: 23013.599939,
      BZD: 2.357534,
      CAD: 1.602222,
      CDF: 3378.067874,
      CHF: 0.935798,
      CLF: 0.028498,
      CLP: 1093.522001,
      CNY: 8.416226,
      CNH: 8.418146,
      COP: 4743.47868,
      CRC: 591.9511,
      CUC: 1.174163,
      CUP: 31.115326,
      CVE: 110.478424,
      CZK: 24.742322,
      DJF: 209.001972,
      DKK: 7.46054,
      DOP: 69.825782,
      DZD: 151.924962,
      EGP: 58.555755,
      ERN: 17.612449,
      ETB: 158.551141,
      EUR: 1,
      FJD: 2.628596,
      FKP: 0.853811,
      GBP: 24564.813084,
      GEL: 3.19389,
      GGP: 0.853811,
      GHS: 12.148365,
      GIP: 0.853811,
      GMD: 83.951919,
      GNF: 10168.730676,
      GTQ: 9.026283,
      GYD: 245.442057,
      HKD: 9.217005,
      HNL: 30.667636,
      HRK: 7.534842,
      HTG: 153.869212,
      HUF: 399.08516,
      IDR: 19027.43308,
      ILS: 3.969364,
      IMP: 0.853811,
      INR: 100.403698,
      IQD: 1537.489782,
      IRR: 49461.627256,
      ISK: 141.991338,
      JEP: 0.853811,
      JMD: 188.090151,
      JOD: 0.832545,
      JPY: 169.608472,
      KES: 151.725714,
      KGS: 102.614826,
      KHR: 4705.049197,
      KMF: 493.412737,
      KPW: 1056.771306,
      KRW: 1595.676476,
      KWD: 0.359001,
      KYD: 0.978102,
      KZT: 610.58734,
      LAK: 25309.677975,
      LBP: 105158.550904,
      LKR: 351.976955,
      LRD: 234.736465,
      LSL: 21.017945,
      LTL: 3.466999,
      LVL: 0.710239,
      LYD: 6.356225,
      MAD: 10.597062,
      MDL: 19.876652,
      MGA: 5159.924056,
      MKD: 61.596024,
      MMK: 2464.947165,
      MNT: 4209.430706,
      MOP: 9.490856,
      MRU: 46.806022,
      MUR: 53.025137,
      MVR: 18.087968,
      MWK: 2035.114125,
      MXN: 22.128574,
      MYR: 4.964948,
      MZN: 75.099668,
      NAD: 21.018572,
      NGN: 1812.544516,
      NIO: 43.192704,
      NOK: 11.794124,
      NPR: 160.581264,
      NZD: 1.934329,
      OMR: 0.45149,
      PAB: 1.173657,
      PEN: 4.165777,
      PGK: 4.841353,
      PHP: 66.411211,
      PKR: 332.875017,
      PLN: 4.241329,
      PYG: 9365.933686,
      QAR: 4.278192,
      RON: 5.082899,
      RSD: 117.176775,
      RUB: 92.409401,
      RWF: 1694.795677,
      SAR: 4.403518,
      SBD: 9.801138,
      SCR: 16.568978,
      SDG: 705.050879,
      SEK: 11.114959,
      SGD: 1.496577,
      SHP: 0.922708,
      SLE: 26.420086,
      SLL: 24621.62083,
      SOS: 670.704243,
      SRD: 44.155588,
      STD: 24302.808902,
      SVC: 10.269927,
      SYP: 15266.093297,
      SZL: 21.013863,
      THB: 38.263049,
      TJS: 11.572157,
      TMT: 4.121313,
      TND: 3.43107,
      TOP: 2.750001,
      TRY: 46.829034,
      TTD: 7.966322,
      TWD: 34.140327,
      TZS: 3096.370683,
      UAH: 48.934733,
      UGX: 4219.150604,
      USD: 1.174163,
      UYU: 47.281339,
      UZS: 14772.411704,
      VES: 124.670964,
      VND: 30639.790327,
      VUV: 141.049621,
      WST: 3.224794,
      XAF: 657.22103,
      XAG: 0.032669,
      XAU: 0.00036,
      XCD: 3.173235,
      XDR: 0.819305,
      XOF: 657.246267,
      XPF: 119.331742,
      YER: 284.44112,
      ZAR: 20.889011,
      ZMK: 10568.866704,
      ZMW: 27.786442,
      ZWL: 378.080091,
    };
    */

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
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "fxRateUpdate", {
          error: err,
        });
      });

    // get installed currencies
    url = ENDPOINT + "/currency";
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
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "fxRateUpdate", {
          error: err,
        });
      });

    // get rate updates
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
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "fxRateUpdate", {
          error: err,
        });
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

async function jobAlertNeCveScan(threshold = 100) {
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

async function jobCveRepoPull(target = cveDirectory) {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "cveRepoPull",
      state: "start",
      target: target,
    });
    if (fs.existsSync(target)) {
      if (fs.lstatSync(target).isDirectory()) {
        try {
          let git = simpleGit(target);
          await git.addConfig("safe.directory", target, false, "global");
          await git.clean("xdf");
          //await git.reset("hard");
          await git.pull("origin", "main");
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

async function jobCveListBuild(target = cveDirectory) {
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
                "jobCveListBuild",
                {
                  state: "empty",
                }
              );
            }
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
                            cveObj.containers.cna.affected[0].platforms.length;
                            p++
                          ) {
                            cvePlatforms.push(
                              cveObj.containers.cna.affected[0].platforms[p]
                            );
                          }
                        }
                        if (
                          cveObj.containers?.cna?.affected[0]?.versions.length >
                          0
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
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "jobCveListBuild", {
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
      pull: cveRepoPullCronTime,
      build: cveListBuildCronTime,
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
      update: fxRateCronTime,
      url: fxRateApiUrl,
    },
  });

  // cron jobs - cve repository daily pull, daily list build, FX rate update
  if (fxRateUpdate) {
    fxUpdateCron = cron.schedule(
      fxRateCronTime,
      () => {
        jobFxRateUpdate();
      },
      {
        scheduled: true,
        recoverMissedExecutions: true,
        name: "fxRateUpdate",
      }
    );
  }
  if (cveScan) {
    cveRepoCron = cron.schedule(
      cveRepoPullCronTime,
      () => {
        jobCveRepoPull(cveDirectory);
      },
      {
        scheduled: true,
        recoverMissedExecutions: true,
        name: "cveRepoPull",
      }
    );
    cveListBuild = cron.schedule(
      cveRepoPullCronTime,
      () => {
        jobCveListBuild(cveDirectory);
      },
      {
        scheduled: true,
        recoverMissedExecutions: true,
        name: "cveListBuild",
      }
    );
  }

  // force FX rate update on startup
  await jobFxRateUpdate();

  // sleep
  while (true) {
    await sleep(1000);
  }
};

// main
run().catch((e) => LOGGER.error(e));
