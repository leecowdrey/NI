//=====================================================================
// MarlinDT Network Intelligence (MNI) - method: one
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
import dayjs from "dayjs";
import workerpool from "workerpool";

var dayjsFormat = "YYYYMMDD[T]HHmmss";
var dayjsDateFormat = "YYYYMMDD";

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

//methodOne(bundle.resource, bundle.id, bundle.point);
//
async function methodOne(bundle) {
  // worker thread main
  if (process.env.PREDICTSERV_TLS_INSECURE_CONNECTIONS || false) {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
  }
  return new Promise(function (resolve, reject) {
    try {
      let url =
        bundle.endpoint +
        "/" +
        bundle.resource +
        "/" +
        bundle.id +
        "?point=" +
        bundle.point;
      fetch(url, {
        method: "GET",
        headers: {
          Accept: OAS.mimeJSON,
        },
        signal: AbortSignal.timeout(bundle.abortMs),
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
            if (bundle.point != null && data.source != null) {
              let predictedPoint = dayjs(bundle.point, dayjsFormat).add(
                bundle.predicted.duration,
                bundle.predicted.unit
              );
              // move the predicted point back 1 second from the predicted boundary
              predictedPoint = predictedPoint.subtract(1, "s");
              // delete all predicted variants of the specified resource
              try {
                url =
                  bundle.endpoint +
                  "/" +
                  bundle.resource +
                  "/" +
                  bundle.id +
                  "?predicted";
                fetch(url, {
                  method: "DELETE",
                })
                  .then((response) => {
                    if (response.ok) {
                      // add predicted variant of the specified resource
                      try {
                        url =
                          bundle.endpoint +
                          "/" +
                          bundle.resource +
                          "/" +
                          bundle.id;
                        fetch(url, {
                          method: "PATCH",
                          headers: {
                            "Content-Type": OAS.mimeJSON,
                          },
                          body: JSON.stringify({
                            source: "predicted",
                            point: predictedPoint.format(dayjsFormat),
                          }),
                        })
                          .then((response) => {
                            if (response.ok) {
                              resolve(bundle.qId);
                            } else {
                              reject(new Error({
                                qId: bundle.qId,
                                status: response.status,
                                statusText: response.statusText,
                              }));
                            }
                          })
                          .catch((err) => {
                            reject( new Error({
                              qId: bundle.qId,
                              status: 500,
                              statusText: err,
                            }));
                          });
                      } catch (err) {
                        reject( new Error({
                          qId: bundle.qId,
                          status: 500,
                          statusText: err,
                        }));
                      }
                    } else {
                      reject( new Error({
                        qId: bundle.qId,
                        status: response.status,
                        statusText: response.statusText,
                      }));
                    }
                  })
                  .catch((err) => {
                   reject( new Error({
                      qId: bundle.qId,
                      status: 500,
                      statusText: err,
                    }));
                  });
              } catch (err) {
                reject( new Error({
                  qId: bundle.qId,
                  status: 500,
                  statusText: err,
                }));
              }
            }
          } else {
            reject( new Error({
              qId: bundle.qId,
              status: 500,
              statusText: "no JSON response",
            }));
          }
        })
        .catch((err) => {
          reject( new Error({
            qId: bundle.qId,
            status: 500,
            statusText: err,
          }));
        });
    } catch (err) {
      reject( new Error({
        qId: bundle.qId,
        status: 500,
        statusText: err,
      }));
    }
  });
}

// create a worker and register public functions
workerpool.worker({
  runMethod: methodOne,
});
