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
import nodemailer from "nodemailer";
import { MAX, v4 as uuidv4 } from "uuid";
import { Kafka, CompressionTypes, logLevel } from "kafkajs";
import { Console } from "node:console";
import dayjs from "dayjs";
import os from "os";

const allPrintableRegEx = /[ -~]/gi;

var dayjsFormat = "YYYYMMDD[T]HHmmss";
var dayjsDateFormat = "YYYYMMDD";

var DEBUG = false;
var ENDPOINT_READY = false;
var ENDPOINT = null;
var kafka = null;
var kafkaProducer = null;

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
  DEBUG = toBoolean(process.env.ALERTSRV_DEBUG || false);
  dayjsFormat = process.env.ALERTSRV_TIMESTAMP_FORMAT || "YYYYMMDD[T]HHmmssZ";
  appName = process.env.MNI_NAME || "MNI";
  appVersion = process.env.MNI_VERSION || "0.0.0";
  appBuild = process.env.MNI_BUILD || "00000000.00";
  endpointRetryMs =
    toInteger(process.env.ALERTSRV_ENDPOINT_RETRY_INTERVAL_MS) || 5000;
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
  LOGGER.info(dayjs().format(dayjsFormat), "info", {
    event: "quit",
  });
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

async function queueDrain() {
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
                type: type,
                alertId: id,
                callbackAlertId: null,
                publishAlertId: null,
                notifyAlertId: null,
                workflowAlertId: null
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
              deleteQueueItem(q.qId);
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
    let url = ENDPOINT + "/alert/queue/" + qId;
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
      },
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
      auth: { user: mailAuthUser.replace(allPrintableRegEx, "*"), pass: mailAuthPassword.replace(allPrintableRegEx, "*") },
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
        LOGGER.debug(dayjs().format(dayjsFormat), "debug", "sendMail", {
          event: "sent",
          host: mailHost + ":" + mailPort,
          from: mailFrom,
          to: mailTo,
          messageId: info.messageId,
          response: info.response,
        });
      }
    } catch (err) {
      LOGGER.error(dayjs().format(dayjsFormat), "error", "sendMail", {
        host: mailHost + ":" + mailPort,
        from: mailFrom,
        to: mailTo,
        error: err,
      });
    }
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
  });

  // process a queue item
  await queueDrain();

  await sendMail();

  // sleep
  while (true) {
    await sleep(1000);
  }
};

// main
run().catch((e) => LOGGER.error(e));
