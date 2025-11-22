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
import SegfaultHandler from "segfault-handler";
SegfaultHandler.registerHandler("crash.log");

import * as OAS from "./oasConstants.mjs";
import "dotenv/config";
import dns from "dns";
import nodemailer from "nodemailer";
import cron from "node-cron";
import { MAX, v4 as uuidv4 } from "uuid";
import { Kafka, CompressionTypes, logLevel } from "kafkajs";
import { Console } from "node:console";
import dayjs from "dayjs";
import { URL } from "node:url";

const allPrintableRegEx = /[ -~]/gi;
const secretScope = "alert";

var DEBUG = false;
var ENDPOINT_READY = false;
var ENDPOINT = null;
var kafka = null;
var kafkaProducer = null;
var endpointHost = null;
var endpointDomain = null;

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
var endpointTimer = null;
var dnsSdTimer = null;
var serviceUsername = null;
var serviceKey = null;
var serviceAuthentication = null;
var endpointRetryMs = null;
var endpointKeepaliveMs = null;
var endPointUrlPrefix = null;
var endPointUrlVersion = null;
var appName = null;
var appVersion = null;
var appBuild = null;
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
  DEBUG = toBoolean(process.env.ALERTSRV_DEBUG || false);
  appName = process.env.MNI_NAME || "MNI";
  appVersion = process.env.MNI_VERSION || "0.0.0";
  appBuild = process.env.MNI_BUILD || "00000000.00";
  serviceUsername = process.env.MNI_SERVICE_USERNAME || "internal";
  serviceKey = process.env.MNI_SERVICE_KEY || "internal";
  serviceAuthentication =
    "Basic " +
    Buffer.from(serviceUsername + ":" + serviceKey).toString("base64");
  endpointHost = process.env.DNSSERV_HOST || "mni";
  endpointDomain = process.env.DNSSERV_DOMAIN || "merkator.local";
  endpointRetryMs =
    toInteger(process.env.ALERTSRV_ENDPOINT_RETRY_INTERVAL_MS) || 15000;
  endpointKeepaliveMs =
    toInteger(process.env.ALERTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS) || 60000;
  endPointUrlPrefix = process.env.APISERV_URL_PREFIX || "/mni";
  endPointUrlVersion = process.env.APISERV_URL_VERSION || "/v1";
  tlsSslVerification = toBoolean(
    process.env.ALERTSRV_TLS_INSECURE_CONNECTIONS || false
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
  if (jobsCronIds.length > 0) {
    for (let j = 0; j < jobsCronIds.length; j++) {
      jobsCronIds[j].stop();
    }
  }
  if (kafkaProducer != null) {
    kafkaProducer.disconnect();
  }
  if (queueDrainTimer != null) {
    clearTimeout(queueDrainTimer);
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

async function alertJobs() {
  let secret = null;
  try {
    while (!ENDPOINT_READY) {
      await sleep(endpointRetryMs);
    }
    let url = ENDPOINT + "/alerts";
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
          }
        } else {
          LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "alertJobs", {
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
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "alertJobs", {
          error: err,
        });
      });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertJobs",
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
      let url = ENDPOINT + "/alert/queue";
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
        .then(async (data) => {
          if (data != null) {
            if (data.qId != null) {
              let q = {
                qId: toInteger(data.qId),
                point: data.point,
                type: type,
                alertId: id,
                callbackAlertId: null,
                publishAlertId: null,
                notifyAlertId: null,
                workflowAlertId: null,
              };
              if (data.callback != null) {
                q.callbackAlertId = data.callback;
              }
              if (data.publish != null) {
                q.publishAlertId = data.publish;
              }
              if (data.notify != null) {
                q.notifyAlertId = data.notify;
              }
              if (data.workflow != null) {
                q.workflowAlertId = data.workflow;
              }

              //TODO: the alert workers
              switch (data.type) {
                case "callback":
                  break;
                case "publish":
                  break;
                case "notify":
                  sendMail(q);
                  break;
                case "workflow":
                  break;
              }

              //
              await deleteQueueItem(q.qId);
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
      let url = ENDPOINT + "/alert/queue/" + qId;
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

async function sendMail(q) {
  // get smtp details from API server
  let mailProtocol = "";
  let mailHost = "";
  let mailPort = 465;
  let mailFrom = "";
  let mailTo = ""; // '"Name" <address@example.com>'
  let mailAuthentication = "";
  let mailAuthUser = "";
  let mailAuthPassword = "";
  let mailStartTLS = false;
  let mailEncryption = true;
  let mailSubect = "MNI: alert";
  let mailPlainTextBody = "alert X threshold reached";
  let mailHtmlBody = "<p>alert X <b>threshold reached</b></p>";
  let id = "c154c1b3-c0a6-47c3-856d-fed40e9acf19";

  try {
    await fetch(ENDPOINT + "/admin/email/provider/" + q.id, {
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
          return null;
        }
      })
      .then((data) => {
        if (data != null) {
          mailProtocol = data.send.protocol;
          mailFrom = '"' + data.name + '" <' + data.address + ">";
          mailHost = data.send.host;
          mailPort = toInteger(data.send.port);
          mailAuthentication = data.send.authentication;
          mailAuthUser = data.send.username;
          mailAuthPassword = data.send.password;
          mailStartTLS = toBoolean(data.send.encryption.starttls);
          mailEncryption = toBoolean(data.send.encryption.enabled);
        }
      })
      .catch((err) => {
        throw err;
      });
  } catch (err) {
    throw err;
  }

  if (mailProtocol == "smtp") {
    // Create a transporter object using specified SMTP server
    let transporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: mailEncryption, // true for 465, false for other ports
      auth: { user: mailAuthUser, pass: mailAuthPassword },
    });
    console.debug({
      host: mailHost,
      port: mailPort,
      secure: mailEncryption, // true for 465, false for other ports
      auth: {
        user: mailAuthUser.replace(allPrintableRegEx, "*"),
        pass: mailAuthPassword.replace(allPrintableRegEx, "*"),
      },
    });

    // Configure email options
    let mailOptions = {
      from: mailFrom, // Sender addresses comma separated
      to: mailTo, // Recipient addresses comma separated
      subject: mailSubect, // Subject line
      text: mailPlainTextBody, // Plain text body
      html: mailHtmlBody,
    };
    console.debug(mailOptions);
    // Send email
    try {
      let info = await transporter.sendMail(mailOptions);
      if (DEBUG) {
        LOGGER.debug(dayjs().format(OAS.dayjsFormat), "debug", "sendMail", {
          event: "sent",
          host: mailHost + ":" + mailPort,
          from: mailFrom,
          to: mailTo,
          messageId: info.messageId,
          response: info.response,
        });
      }
    } catch (err) {
      LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "sendMail", {
        host: mailHost + ":" + mailPort,
        from: mailFrom,
        to: mailTo,
        error: err,
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

async function jobAlertTrenchUtil(threshold = 100) {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertTrenchUtil",
      state: "start",
      threshold: threshold,
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertTrenchUtil",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertTrenchUtil",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertDuctUtil(threshold = 100) {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDuctUtil",
      state: "start",
      threshold: threshold,
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDuctUtil",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertDuctUtil",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertCableUtil(threshold = 100) {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertCableUtil",
      state: "start",
      threshold: threshold,
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertCableUtil",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertCableUtil",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertPoleUtil(threshold = 100) {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertPoleUtil",
      state: "start",
      threshold: threshold,
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertPoleUtil",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertPoleUtil",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertRackUtil(threshold = 100) {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertRackUtil",
      state: "start",
      threshold: threshold,
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertRackUtil",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertRackUtil",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertNePortUtil(threshold = 100) {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertNePortUtil",
      state: "start",
      threshold: threshold,
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertNePortUtil",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertNePortUtil",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertTransmissionUtil(threshold = 100) {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertTransmissionUtil",
      state: "start",
      threshold: threshold,
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertTransmissionUtil",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertTransmissionUtil",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertServiceBandwidth(threshold = 100) {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertServiceBandwidth",
      state: "start",
      threshold: threshold,
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertServiceBandwidth",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertServiceBandwidth",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertNeErrorRates(threshold = 100) {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertNeErrorRates",
      state: "start",
      threshold: threshold,
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertNeErrorRates",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertNeErrorRates",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertNeClassifierUtil(threshold = 100) {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertNeClassifierUtil",
      state: "start",
      threshold: threshold,
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertNeClassifierUtil",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertNeClassifierUtil",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertWpEfficiency(threshold = 100) {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertWpEfficiency",
      state: "start",
      threshold: threshold,
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertWpEfficiency",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertWpEfficiency",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertDqGeometryAlignment() {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqGeometryAlignment",
      state: "start",
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqGeometryAlignment",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertDqGeometryAlignment",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertDqMissingConnectedTo() {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqMissingConnectedTo",
      state: "start",
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqMissingConnectedTo",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertDqMissingConnectedTo",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertDqTrench() {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqTrench",
      state: "start",
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqMissingConnectedTo",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertDqMissingConnectedTo",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertDqCable() {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqCable",
      state: "start",
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqCable",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertDqCable",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertDqDuct() {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqDuct",
      state: "start",
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqDuct",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertDqDuct",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertDqPole() {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqPole",
      state: "start",
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqPole",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertDqPole",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertDqNe() {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqNe",
      state: "start",
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqNe",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertDqNe",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertDqService() {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqService",
      state: "start",
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqService",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertDqService",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertDqSite() {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqSite",
      state: "start",
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqSite",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertDqSite",
      state: "failed",
      error: e,
    });
  }
}

async function jobAlertDqOffNetPAF() {
  try {
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqOffNetPAF",
      state: "start",
    });
    // TODO:
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      event: "alertDqOffNetPAF",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", {
      event: "alertDqOffNetPAF",
      state: "failed",
      error: e,
    });
  }
}

/*
  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: [process.env.KAFKA_BROKER],
    logLevel: parseInt(process.env.KAFKA_LOGLEVEL),
    sasl: false,
    ssl: {
      rejectUnauthorized: false,
      ca: [fs.readFileSync(process.env.KAFKA_SSL_CA, "utf-8")],
      key: fs.readFileSync(process.env.KAFKA_SSL_KEY, "utf-8"),
      cert: fs.readFileSync(process.env.KAFKA_SSL_CERT, "utf-8"),
    },
    requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT),
    sessionTimeout: parseInt(process.env.KAFKA_SESSION_TIMEOUT),
    enforceRequestTimeout: parseInt(process.env.KAFKA_ENFORCE_REQUEST_TIMEOUT),
    minBytes: parseInt(process.env.KAFKA_MIN_BYTES),
    maxBytes: parseInt(process.env.KAFKA_MAX_BYTES),
    maxWaitTimeInMs: parseInt(process.env.KAFKA_MAX_WAIT_TIMEOUT),
    retry: {
      initialRetryTime: parseInt(process.env.KAFKA_INITIAL_RETRY_TIME),
      retries: parseInt(process.env.KAFKA_RETRIES),
    },
  });
} else if (toBoolean(process.env.KAFKA_SASL)) {
  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: [process.env.KAFKA_BROKER],
    logLevel: parseInt(process.env.KAFKA_LOGLEVEL),
    ssl: true,
    sasl: {
      mechanism: process.env.KAFKA_SASL_MECHANISM.toLowerCase(), // plain, scram-sha-256 or scram-sha-512
      username: process.env.KAFKA_USERNAME,
      password: KAFKA_DECODED_PASSWORD,
    },
    requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT),
    sessionTimeout: parseInt(process.env.KAFKA_SESSION_TIMEOUT),
    enforceRequestTimeout: parseInt(process.env.KAFKA_ENFORCE_REQUEST_TIMEOUT),
    minBytes: parseInt(process.env.KAFKA_MIN_BYTES),
    maxBytes: parseInt(process.env.KAFKA_MAX_BYTES),
    maxWaitTimeInMs: parseInt(process.env.KAFKA_MAX_WAIT_TIMEOUT),
    retry: {
      initialRetryTime: parseInt(process.env.KAFKA_INITIAL_RETRY_TIME),
      retries: parseInt(process.env.KAFKA_RETRIES),
    },
  });
} else {
  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: [process.env.KAFKA_BROKER],
    logLevel: parseInt(process.env.KAFKA_LOGLEVEL),
    requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT),
    sessionTimeout: parseInt(process.env.KAFKA_SESSION_TIMEOUT),
    enforceRequestTimeout: parseInt(process.env.KAFKA_ENFORCE_REQUEST_TIMEOUT),
    minBytes: parseInt(process.env.KAFKA_MIN_BYTES),
    maxBytes: parseInt(process.env.KAFKA_MAX_BYTES),
    maxWaitTimeInMs: parseInt(process.env.KAFKA_MAX_WAIT_TIMEOUT),
    retry: {
      initialRetryTime: parseInt(process.env.KAFKA_INITIAL_RETRY_TIME),
      retries: parseInt(process.env.KAFKA_RETRIES),
    },
  });
}
  
kafkaProducer = kafka.producer({ retry: X, maxInFlightRequests: Y });

await producer.send({
    topic: <String>,
    messages: <Message[]>,
    acks: <Number>,
    timeout: <Number>,
    compression: <CompressionTypes>,
})

compression: CompressionTypes.GZIP,

await producer.send({
    topic: 'topic-name',
    messages: [
        { key: 'key1', value: 'hello world' },
        { key: 'key2', value: 'hey hey!' }
    ],
})
  */

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

  // get list of alert jobs
  await alertJobs();

  // create cronJobs for all enabled jobs based on protocol
  for (let j = 0; j < jobs.length; j++) {
    let cronMaxRandomDelay = Math.floor(Math.random() * 13 * 1000);
    try {
      if (
        jobs[j].function != null &&
        jobs[j].cronTime != null &&
        toBoolean(jobs[j].enabled) == true
      ) {
        jobsCronIds.push(
          eval(
            "cron.schedule('" +
              jobs[j].cronTime +
              "',() => {" +
              jobs[j].function +
              "},{scheduled: " +
              jobs[j].enabled +
              ",recoverMissedExecutions: true, name: '" +
              jobs[j].description +
              "',noOverlap: true,maxRandomDelay: " +
              cronMaxRandomDelay +
              "});"
          )
        );
        if (DEBUG) {
          LOGGER.debug(dayjs().format(OAS.dayjsFormat), "debug", "cronJobs", {
            id: jobs[j].alertId,
            description: jobs[j].description,
            enabled: jobs[j].enabled,
            time: jobs[j].cronTime,
            function: jobs[j].function,
            delay: cronMaxRandomDelay,
          });
        }
      }
    } catch (err) {
      if (DEBUG) {
        LOGGER.error(dayjs().format(OAS.dayjsFormat), "error", "cronJobs", {
          id: jobs[j].alertId,
          function: jobs[j].cronFunction,
          error: err,
        });
      }
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
