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
import duckdb from "@duckdb/node-api";
import { DuckDBInstance } from "@duckdb/node-api";
import { MAX, v4 as uuidv4 } from "uuid";
import express from "express";
import {
  body,
  header,
  query,
  param,
  validationResult,
  oneOf,
} from "express-validator";
import basicAuth from "basic-auth-connect";
import morgan from "morgan";
import https from "https";
//import { WebSocketServer } from "ws";
import path from "path";
import fs from "fs";
import { Console } from "node:console";
import { dirname } from "path";
import { fileURLToPath } from "url";
import dayjs from "dayjs";

const allPrintableRegEx = /[ -~]/gi;
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

var dayjsFormat = "YYYYMMDD[T]HHmmss";
var pointFormat = "%Y%m%dT%H%M%S";
var dayjsDateFormat = "YYYYMMDD";
var dateFormat = "%Y%m%d";

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
var duckDbFile = null;
var duckDbExtensions = ["spatial"];
var duckDbMaxMemory = null;
var duckDbThreads = null;
var duckDbVerison = null;
var jobBackupEnabled = false;
var backupCron = null;
var backupCronTime = null;
var updateGeometryTimer = null;
var updateGeometryIntervalMs = 300000; // 5 minutes
var updatePremisesPassedTimer = null;
var updatePremisesPassedIntervalMs = 300000; // 5 minutes
var pruneTimer = null;
var pruneIntervalMs = 300000; // 5 minutes
var pruneQueuesTimer = null;
var pruneQueuesIntervalMs = 300000; // 5 minutes
var predictQueueTimer = null;
var predictQueueIntervalMs = 86400000; // 24 hours

var backupDirectory = null;
var serveUseDnsSd = null;
var serveName = null;
var serveAddress = null;
var servePort = null;
var serveUrlPrefix = null;
var serveUrlVersion = null;
var serveHost = null;
var serveDomain = null;
var serveTimeOutRequest = null;
var appName = null;
var appVersion = null;
var appBuild = null;
var sslKey = null;
var sslCert = null;
var apiDirectory = null;
var configDirectory = null;
var serviceUsername = null;
var serviceKey = null;
var server = null;
var premisesPassedBoundaryDistance = 10;

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

function getArrayPage(src = [], pageSize, pageNumber) {
  let arr = chunkArray(src, pageSize);
  if (typeof arr[pageNumber] === undefined) {
    return [];
  } else {
    if (arr[pageNumber] != null) {
      return arr[pageNumber];
    } else {
      return [];
    }
  }
}

function pageSizeNumber(pageSize, pageNumber) {
  let pSize = Number.MAX_SAFE_INTEGER;
  let pNumber = 0;
  try {
    if (pageSize != null) {
      pSize = toInteger(pageSize);
    }
  } catch (e) {
    pSize = Number.MAX_SAFE_INTEGER;
  }
  try {
    if (pageNumber != null) {
      pNumber = toInteger(pageNumber) - 1;
    }
    if (pNumber < 0) {
      pNumber = 0;
    }
  } catch (e) {
    pNumber = 0;
  }
  return { pageSize: pSize, pageNumber: pNumber };
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

// stdout alive indicator
function tick() {
  //if (DEBUG) {
  //  process.stdout.write(".");
  //}
  tickTimer = setTimeout(tick, tickIntervalMs);
}

async function jobBackup(target) {
  try {
    LOGGER.info(dayjs().format(dayjsFormat), "info", {
      event: "backup",
      state: "start",
      target: target,
    });
    if (fs.existsSync(target)) {
      if (fs.lstatSync(target).isDirectory()) {
        let result = await DDC.run(
          "EXPORT DATABASE '" + target + "' (OVERWRITE true)"
        );
        LOGGER.info(dayjs().format(dayjsFormat), "info", {
          event: "backup",
          state: "stop",
          result: result,
        });
      } else {
        LOGGER.error(dayjs().format(dayjsFormat), "error", {
          event: "backup",
          state: "failed",
          target: target,
          error: "is not a directory",
        });
      }
    } else {
      LOGGER.error(dayjs().format(dayjsFormat), "error", {
        event: "backup",
        state: "failed",
        target: target,
        error: "does not exist",
      });
    }
  } catch (e) {
    LOGGER.error(dayjs().format(dayjsFormat), "error", {
      event: "backup",
      state: "failed",
      error: e,
    });
  }
}

async function jobUpdateGeometry() {
  if (updateGeometryTimer != null) {
    clearTimeout(updateGeometryTimer);
  }

  // child table (i.e. _pole) holds the spatial points as 3D points
  // parent table (i.e. pole) holds the spatial geometry object see https://duckdb.org/docs/stable/extensions/spatial/overview
  let points = [
    { table: "_pole", dst: "geoPoint", src: "ST_Point3D(X,Y,Z)" },
    { table: "_rack", dst: "geoPoint", src: "ST_Point3D(X,Y,Z)" },
    { table: "_site", dst: "geoPoint", src: "ST_Point3D(X,Y,Z)" },
    { table: "_trenchCoordinate", dst: "geoPoint", src: "ST_Point3D(X,Y,Z)" },
  ];
  try {
    LOGGER.info(dayjs().format(dayjsFormat), "info", {
      event: "updateGeometry",
      state: "start",
    });
    // update spatial points
    for (let i = 0; i < points.length; i++) {
      let ddSql =
        "UPDATE " +
        points[i].table +
        " SET " +
        points[i].dst +
        " = " +
        points[i].src +
        " WHERE " +
        points[i].dst +
        " IS NULL";
      await DDC.run(ddSql);
    }
    //
    LOGGER.info(dayjs().format(dayjsFormat), "info", {
      event: "updateGeometry",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(dayjsFormat), "error", {
      event: "updateGeometry",
      state: "failed",
      error: e,
    });
  }
  updateGeometryTimer = setTimeout(jobUpdateGeometry, updateGeometryIntervalMs);
}

async function jobUpdatePremisesPassed() {
  // checks for premises within 50metres of any a trench
  if (updatePremisesPassedTimer != null) {
    clearTimeout(updatePremisesPassedTimer);
  }

  try {
    LOGGER.info(dayjs().format(dayjsFormat), "info", {
      event: "updatePremisesPassed",
      state: "start",
    });
    // initially get list of historical sites coordinates
    let sitesCoordaintes = [];
    let ddRead = await DDC.runAndReadAll(
      "SELECT x,y FROM _site,site WHERE _site.siteId = site.id AND _site.tsId = site.historicalTsId AND delete = false"
    );
    let ddRows = ddRead.getRows();
    if (ddRows.length > 0) {
      for (let idx in ddRows) {
        sitesCoordaintes.push({
          x: ddRows[idx][0],
          y: ddRows[idx][1],
          used: false,
        });
      }
    }

    // process all (historical and predicted) trench point variants where premised passed is zero
    let trenches = [];
    ddRead = await DDC.runAndReadAll(
      "SELECT _trench.tsId,trench.id,_trench.source,strftime(_trench.point,'" +
        pointFormat +
        "') FROM trench, _trench WHERE _trench.trenchId = trench.id AND _trench.premisesPassed = 0 AND delete = false"
    );
    ddRows = ddRead.getRows();
    if (ddRows.length > 0) {
      for (let idx in ddRows) {
        if (DEBUG) {
          LOGGER.debug(dayjs().format(dayjsFormat), "debug", {
            event: "updatePremisesPassed",
            trench: ddRows[idx][1],
            source: ddRows[idx][2],
            point: ddRows[idx][3],
          });
        }
        let ddTcRead = await DDC.runAndReadAll(
          "SELECT x,y FROM _trenchCoordinate WHERE trenchTsId = " +
            ddRows[idx][0]
        );
        let ddTcRows = ddTcRead.getRows();
        if (ddTcRows.length > 0) {
          let premisesPassed = 0;
          for (let tdx in ddTcRows) {
            for (let s = 0; s < sitesCoordaintes.length; s++) {
              if (sitesCoordaintes[s].used == false) {
                let ddCompare = await DDC.runAndReadAll(
                  "SELECT st_distance_spheroid( st_point(" +
                    ddTcRows[tdx][0] +
                    "," +
                    ddTcRows[tdx][1] +
                    "), st_point(" +
                    sitesCoordaintes[s].x +
                    "," +
                    sitesCoordaintes[s].y +
                    "))"
                );
                let ddCompareRows = ddCompare.getRows();
                if (ddCompareRows.length > 0) {
                  if (
                    toDecimal(ddCompareRows[0][0]) <=
                    toDecimal(premisesPassedBoundaryDistance)
                  ) {
                    sitesCoordaintes[s].used = true;
                    premisesPassed++;
                  }
                }
              }
            }
            for (let s = 0; s < sitesCoordaintes.length; s++) {
              sitesCoordaintes[s].used = false;
            }
            if (premisesPassed > 0) {
              await DDC.run(
                "UPDATE _trench SET premisesPassed = " +
                  toInteger(premisesPassed) +
                  " WHERE tsId = " +
                  ddRows[idx][0]
              );
            }
          }
        }
      }
    }
    //
    LOGGER.info(dayjs().format(dayjsFormat), "info", {
      event: "updatePremisesPassed",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(dayjsFormat), "error", {
      event: "updatePremisesPassed",
      state: "failed",
      error: e,
    });
  }
  updatePremisesPassedTimer = setTimeout(
    jobUpdatePremisesPassed,
    updatePremisesPassedIntervalMs
  );
}

async function jobPredictQueueFill() {
  if (predictQueueTimer != null) {
    clearTimeout(predictQueueTimer);
  }
  await DDC.run("DELETE from predictQueue WHERE delete = true");

  let ddRead = await DDC.runAndReadAll(
    "SELECT id FROM cable,_cable WHERE cable.id = _cable.cableId AND delete = false AND source = 'historical'"
  );
  let ddRows = ddRead.getRows();
  if (ddRows.length > 0) {
    for (let idx in ddRows) {
      await dbAddPredictQueueItem("cable", ddRows[idx][0], "read");
    }
  }
  ddRead = await DDC.runAndReadAll(
    "SELECT id FROM duct,_duct WHERE duct.id = _duct.ductId AND delete = false AND source = 'historical'"
  );
  ddRows = ddRead.getRows();
  if (ddRows.length > 0) {
    for (let idx in ddRows) {
      await dbAddPredictQueueItem("duct", ddRows[idx][0], "read");
    }
  }
  ddRead = await DDC.runAndReadAll(
    "SELECT id FROM ne,_ne WHERE ne.id = _ne.neId AND delete = false AND source = 'historical'"
  );
  ddRows = ddRead.getRows();
  if (ddRows.length > 0) {
    for (let idx in ddRows) {
      await dbAddPredictQueueItem("ne", ddRows[idx][0], "read");
    }
  }
  ddRead = await DDC.runAndReadAll(
    "SELECT id FROM pole,_pole WHERE pole.id = _pole.poleId AND delete = false AND source = 'historical'"
  );
  ddRows = ddRead.getRows();
  if (ddRows.length > 0) {
    for (let idx in ddRows) {
      await dbAddPredictQueueItem("pole", ddRows[idx][0], "read");
    }
  }
  ddRead = await DDC.runAndReadAll(
    "SELECT id FROM rack,_rack WHERE rack.id = _rack.rackId AND delete = false AND source = 'historical'"
  );
  ddRows = ddRead.getRows();
  if (ddRows.length > 0) {
    for (let idx in ddRows) {
      await dbAddPredictQueueItem("rack", ddRows[idx][0], "read");
    }
  }
  ddRead = await DDC.runAndReadAll(
    "SELECT id FROM service,_service WHERE service.id = _service.serviceId AND delete = false AND source = 'historical'"
  );
  ddRows = ddRead.getRows();
  if (ddRows.length > 0) {
    for (let idx in ddRows) {
      await dbAddPredictQueueItem("service", ddRows[idx][0], "read");
    }
  }
  ddRead = await DDC.runAndReadAll(
    "SELECT id FROM site,_site WHERE site.id = _site.siteId AND delete = false AND source = 'historical'"
  );
  ddRows = ddRead.getRows();
  if (ddRows.length > 0) {
    for (let idx in ddRows) {
      await dbAddPredictQueueItem("site", ddRows[idx][0], "read");
    }
  }
  ddRead = await DDC.runAndReadAll(
    "SELECT id FROM trench,_trench WHERE trench.id = _trench.trenchId AND delete = false AND source = 'historical'"
  );
  ddRows = ddRead.getRows();
  if (ddRows.length > 0) {
    for (let idx in ddRows) {
      await dbAddPredictQueueItem("trench", ddRows[idx][0], "read");
    }
  }
  predictQueueTimer = setTimeout(jobPredictQueueFill, predictQueueIntervalMs);
}

async function jobPruneQueues() {
  if (pruneQueuesTimer != null) {
    clearTimeout(pruneQueuesTimer);
  }
  let tables = ["predictQueue", "alertQueue"];
  try {
    LOGGER.info(dayjs().format(dayjsFormat), "info", {
      event: "pruneQueues",
      state: "start",
    });
    // prune queues
    for (let i = 0; i < tables.length; i++) {
      await DDC.run("DELETE FROM " + tables[i] + " WHERE delete = true");
    }
    LOGGER.info(dayjs().format(dayjsFormat), "info", {
      event: "pruneQueues",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(dayjsFormat), "error", {
      event: "pruneQueues",
      state: "failed",
      error: e,
    });
  }
  pruneQueuesTimer = setTimeout(jobPruneQueues, pruneQueuesIntervalMs);
}

async function jobPrune() {
  if (pruneTimer != null) {
    clearTimeout(pruneTimer);
  }
  // TODO: update pruning for _nePort port configuration tables
  // TODO: update pruning for _serviceIngress and _serviceEgress
  let tables = [
    { table: "cable", shadow: "_cableCoax", key: "cableId" },
    { table: "cable", shadow: "_cableCopper", key: "cableId" },
    {
      table: "cable",
      shadow: "_cableEthernet",
      key: "cableId",
    },
    {
      table: "cable",
      shadow: "_cableMultiFiber",
      key: "cableId",
    },
    {
      table: "cable",
      shadow: "_cableSingleFiber",
      key: "cableId",
    },
    { table: "duct", shadow: "_duct", key: "ductId" },
    //{ table: "ne", shadow: "_ne", key: "neId" },
    { table: "pole", shadow: "_pole", key: "poleId" },
    { table: "rack", shadow: "_rack", key: "rackId" },
    //{ table: "service",shadow: "_serviceEgress",key: "serviceId" },
    //{ table: "service", shadow: "_serviceIngress", key: "serviceId" },
    { table: "site", shadow: "_site", key: "siteId" },
    {
      table: "trench",
      ref: "coordinateTsId",
      shadow: "_trenchCoordinate",
      key: "trenchId",
    },
    { table: "trench", shadow: "_trench", key: "trenchId" },
  ];
  // defaults
  let historicalDuration = 1;
  let historicalUnit = "year";
  let predictedDuration = 6;
  let predictedUnit = "month";
  try {
    LOGGER.info(dayjs().format(dayjsFormat), "info", {
      event: "prune",
      state: "start",
    });
    // get delete window duration
    let ddRead = await DDC.runAndReadAll(
      "SELECT historicalDuration, historicalUnit, predictedDuration, predictedUnit " +
        "FROM adminData LIMIT 1"
    );
    let ddRows = ddRead.getRows();
    if (ddRows.length > 0) {
      // should only be one row
      historicalDuration = ddRows[0][0] || 1;
      historicalUnit = ddRows[0][1] || "year";
      predictedDuration = ddRows[0][2] || 6;
      predictedUnit = ddRows[0][3] || "month";
    }
    // adjust units - ('second','minute','hour','day','week','month','quarter','year');
    switch (historicalUnit) {
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
    switch (predictedUnit) {
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
    // prune resource data
    /*
    for (let i = 0; i < tables.length; i++) {
      let DDIdsRead = await DDC.runAndReadAll(
        "SELECT id FROM " + tables[i].table
      );
      let DDIdsRows = DDIdsRead.getRows();
      for (let p = 0; p < DDIdsRows.length; p++) {
        let ddParent = await DDC.runAndReadAll(
          "SELECT strftime(tsPoint, '%Y-%m-%d %H:%M:%S'),historicalTsId,predictedTsId FROM " +
            tables[i].table +
            " WHERE id = '" +
            DDIdsRows[p] +
            "'"
        );
        let ddParentRows = ddParent.getRows();
        if (ddParentRows.length > 0) {
          let point = dayjs(ddParentRows[0][0]);
          let historicalTsid = ddParentRows[0][1];
          let predictedTsId = ddParentRows[0][2];
          if (historicalTsid != null) {
            let historicalTimestamp = point.subtract(
              historicalDuration,
              historicalUnit
            );
            await DDC.run(
              "DELETE FROM " +
                tables[i].shadow +
                " WHERE source = 'historical' AND point < strptime('" +
                historicalTimestamp.format("YYYYMMDD[T]HHmmss") +
                "','%Y%m%dT%H%M%S') AND tsId != " +
                historicalTsid +
                " AND " +
                tables[i].key +
                " = '" +
                DDIdsRows[p] +
                "'"
            );
          }
          if (predictedTsId != null) {
            let predictedTimestamp = point.add(
              predictedDuration,
              predictedUnit
            );
            await DDC.run(
              "DELETE FROM " +
                tables[i].shadow +
                " WHERE source = 'predicted' AND point > strptime('" +
                predictedTimestamp.format("YYYYMMDD[T]HHmmss") +
                "','%Y%m%dT%H%M%S') AND tsId != " +
                predictedTsId +
                " AND " +
                tables[i].key +
                " = '" +
                DDIdsRows[p] +
                "'"
            );
          }
          // remove any predicted which has been surpassed by historical
          if (predictedTsId != null) {
            if (tables[i].shadow == "_ne") {
              let ddRead = await DDC.runAndReadAll(
                "SELECT tsId FROM " +
                  tables[i].shadow +
                  " WHERE source = 'predicted' AND point < (SELECT max(point) FROM " +
                  tables[i].shadow +
                  " " +
                  "WHERE source = 'historical' AND " +
                  tables[i].key +
                  " = '" +
                  DDIdsRows[p] +
                  "') " +
                  "AND tsId != '" +
                  predictedTsId +
                  "' AND " +
                  tables[i].key +
                  " = '" +
                  DDIdsRows[p] +
                  "'"
              );
              let ddRows = ddRead.getRows();
              for (let idx in ddRows) {
                await DDC.run(
                  "DELETE from _nePortCoax WHERE nePortTsId = " + ddRows[idx][0]
                );
                await DDC.run(
                  "DELETE from _nePortEthernet WHERE nePortTsId = " +
                    ddRows[idx][0]
                );
                await DDC.run(
                  "DELETE from _nePortLoopback WHERE nePortTsId = " +
                    ddRows[idx][0]
                );
                await DDC.run(
                  "DELETE from _nePortFiber WHERE nePortTsId = " + ddRows[idx][0]
                );
                await DDC.run(
                  "DELETE from _nePortXdsl WHERE nePortTsId = " + ddRows[idx][0]
                );
                await DDC.run(
                  "DELETE from _nePortVirtual WHERE nePortTsId = " +
                    ddRows[idx][0]
                );
                await DDC.run(
                  "DELETE from _nePort WHERE neTsId = " + ddRows[idx][0]
                );
              }
            }
            await DDC.run(
              "DELETE FROM " +
                tables[i].shadow +
                " " +
                "WHERE source = 'predicted' AND point < (SELECT max(point) FROM " +
                tables[i].shadow +
                " " +
                "WHERE source = 'historical' AND " +
                tables[i].key +
                " = '" +
                DDIdsRows[p] +
                "') " +
                "AND tsId != '" +
                predictedTsId +
                "' AND " +
                tables[i].key +
                " = '" +
                DDIdsRows[p] +
                "'"
            );
          }
        }
      }
    }
    */
    LOGGER.info(dayjs().format(dayjsFormat), "info", {
      event: "prune",
      state: "stop",
    });
  } catch (e) {
    LOGGER.error(dayjs().format(dayjsFormat), "error", {
      event: "prune",
      state: "failed",
      error: e,
    });
  }
  pruneTimer = setTimeout(jobPrune, pruneIntervalMs);
}

async function dbAddPredictQueueItem(resource, id, state) {
  let ddq = await DDC.prepare(
    "SELECT rowid FROM predictQueue WHERE resource = $1 AND id = $2 AND state = $3"
  );
  ddq.bindVarchar(1, resource);
  ddq.bindVarchar(2, id);
  ddq.bindVarchar(3, state);
  let ddRead = await ddq.runAndReadAll();
  let ddRows = ddRead.getRows();
  if (ddRows.length == 0) {
    let ddp = await DDC.prepare(
      "INSERT INTO predictQueue (resource,id,state) VALUES ($1,$2,$3)"
    );
    ddp.bindVarchar(1, resource);
    ddp.bindVarchar(2, id);
    ddp.bindVarchar(3, state);
    await ddp.run();
  }
}

async function dbIdExists(id, table) {
  let exists = false;
  let ddi = await DDC.runAndReadAll(
    "SELECT id FROM " + table + " WHERE id = '" + id + "' LIMIT 1"
  );
  let ddId = ddi.getRows();
  if (ddId.length > 0) {
    exists = true;
  }
  return exists;
}

async function dbNePortNameFromId(neId, portId) {
  let portName = null;
  let ddp = await DDC.runAndReadAll(
    "SELECT name FROM nePort WHERE neId = '" +
      neId +
      "' AND id = '" +
      portId +
      "' LIMIT 1"
  );
  let ddPort = ddp.getRows();
  if (ddPort.length > 0) {
    portName = ddPort[0][0];
  }
  return portName;
}

async function dbNePortIdFromName(neId, portName, source = "historical") {
  let portId = null;
  let ddp = await DDC.runAndReadAll(
    "SELECT id FROM nePort WHERE neId = '" +
      neId +
      "' AND lower(nePort.name) = lower('" +
      portName +
      "') LIMIT 1"
  );
  let ddPort = ddp.getRows();
  if (ddPort.length > 0) {
    portId = ddPort[0][0];
  }
  return portId;
}

async function dbNePortExists(neId, port) {
  let exists = false;
  let ddp = await DDC.runAndReadAll(
    "SELECT id FROM nePort WHERE neId = '" +
      neId +
      "' AND lower(name) = lower('" +
      port +
      "') LIMIT 1"
  );
  let ddRows = ddp.getRows();
  if (ddRows.length > 0) {
    exists = true;
  }
  return exists;
}

async function dbActiveInactiveCounts(table) {
  let ddRead = await DDC.runAndReadAll("SELECT count(*) FROM " + table);
  let ddTotal = ddRead.getRows();
  ddRead = await DDC.runAndReadAll(
    "SELECT count(*) FROM " + table + " WHERE delete = false"
  );
  let ddActive = ddRead.getRows();
  ddRead = await DDC.runAndReadAll(
    "SELECT count(*) FROM " + table + " WHERE delete = true"
  );
  let ddInactive = ddRead.getRows();
  return {
    total: toInteger(ddTotal[0][0]),
    active: toInteger(ddActive[0][0]),
    inactive: toInteger(ddInactive[0][0]),
  };
}

async function dbCounts(table) {
  let ddRead = await DDC.runAndReadAll("SELECT count(*) FROM " + table);
  let ddTotal = ddRead.getRows();
  return toInteger(ddTotal[0][0]);
}

async function dbQueueCounts(table) {
  let ddRead = await DDC.runAndReadAll(
    "SELECT count(*) FROM " + table + " WHERE delete = false"
  );
  let ddPending = ddRead.getRows();
  ddRead = await DDC.runAndReadAll(
    "SELECT count(*) FROM " + table + " WHERE delete = true"
  );
  let ddComplete = ddRead.getRows();
  return {
    pending: toInteger(ddPending[0][0]),
    completed: toInteger(ddComplete[0][0]),
  };
}

async function getSeqCurrentValue(seqName) {
  let dds = await DDC.runAndReadAll("SELECT currval('" + seqName + "')");
  let ddSeq = dds.getRows();
  let val = -1;
  if (ddSeq.length > 0) {
    val = toInteger(ddSeq[0][0]);
  }
  return val;
}

async function getSeqNextValue(seqName) {
  let dds = await DDC.runAndReadAll("SELECT nextval('" + seqName + "')");
  let ddSeq = dds.getRows();
  let val = -1;
  if (ddSeq.length > 0) {
    val = toInteger(ddSeq[0][0]);
  }
  return val;
}

// load env
function loadEnv() {
  DEBUG = toBoolean(process.env.APISERV_DEBUG || false);
  dayjsFormat = process.env.APISERV_TIMESTAMP_FORMAT || "YYYYMMDD[T]HHmmssZ";
  appName = process.env.MNI_NAME || "MNI";
  appVersion = process.env.MNI_VERSION || "0.0.0";
  appBuild = process.env.MNI_BUILD || "00000000.00";
  tickIntervalMs = toInteger(process.env.APISERV_TICK_INTERVAL_MS) || 60000;
  duckDbFile = path.resolve(process.env.APISERV_DUCKDB_FILE || "mni.duckdb");
  duckDbMaxMemory = process.env.APISERV_DUCKDB_MAX_MEMORY || "512MB";
  duckDbThreads = toInteger(process.env.APISERV_DUCKDB_THREADS) || 1;
  jobBackupEnabled = toBoolean(process.env.APISERV_DUCKDB_BACKUP || false);
  backupCronTime = process.env.APISERV_DUCKDB_BACKUP_CRONTIME || "0 2 * * 0";
  backupDirectory = path.resolve(process.env.APISERV_BACKUP_DIRECTORY);
  premisesPassedBoundaryDistance =
    toInteger(process.env.APISERV_PREMISES_PASSED_BOUNDARY_DISTANCE) || 10;
  serveHost = process.env.DNSSERV_HOST || "mni";
  serveDomain = process.env.DNSSERV_DOMAIN || "merkator.local";
  //serveAddress and servePort can be overridden through DNS SD
  serveUseDnsSd = toBoolean(process.env.APISERV_USE_DNS_SD || false);
  serveAddress = process.env.APISERV_ADDRESS || "127.0.0.1";
  servePort = toInteger(process.env.APISERV_PORT) || 443;
  serveUrlPrefix = process.env.APISERV_URL_PREFIX || "/mni";
  serveUrlVersion = process.env.APISERV_URL_VERSION || "/v1";
  serveTimeOutRequest =
    toInteger(process.env.APISERV_TIMEOUT_REQUEST) || 120000;
  sslKey = process.env.APISERV_SSL_KEY || "apiServer.key";
  sslCert = process.env.APISERV_SSL_CERT || "apiServer.crt";
  serviceUsername = process.env.APISERV_SERVICE_USERNAME || "internal";
  serviceKey = process.env.APISERV_SERVICE_KEY || "internal";
  apiDirectory =
    path.resolve(process.env.APISERV_API_DIRECTORY) ||
    path.join(__dirname, "api");
  configDirectory = path.resolve(process.env.CONFIG_DIRECTORY || "/etc/mni");
  if (duckdb != null) {
    duckDbVerison = duckdb.version();
  }
}

// quit
function quit() {
  LOGGER.info(dayjs().format(dayjsFormat), "info", {
    event: "quit",
  });

  if (backupCron != null) {
    backupCron.stop();
  }
  if (updatePremisesPassedTimer != null) {
    clearTimeout(updatePremisesPassedTimer);
  }
  if (updateGeometryTimer != null) {
    clearTimeout(updateGeometryTimer);
  }
  if (predictQueueTimer != null) {
    clearTimeout(predictQueueTimer);
  }
  if (pruneQueuesTimer != null) {
    clearTimeout(pruneQueuesTimer);
  }
  if (pruneTimer != null) {
    clearTimeout(pruneTimer);
  }
  if (tickTimer != null) {
    clearTimeout(tickTimer);
  }
  if (app != null) {
    if (app.close != null) {
      app.close();
    }
  }
  if (server != null) {
    server.close();
  }
  if (DDC != null) {
    DDC.closeSync();
  }
  if (DDI != null) {
    DDI.closeSync();
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

  // database
  if (fs.existsSync(duckDbFile)) {
    try {
      DDI = await DuckDBInstance.create(duckDbFile, {
        max_memory: duckDbMaxMemory,
        threads: duckDbThreads,
      });
      DDC = await DDI.connect();
    } catch (e) {
      LOGGER.error(dayjs().format(dayjsFormat), "error", "database locked", {
        file: duckDbFile,
        error: e,
      });
      try {
        quit();
      } finally {
        process.exit(3);
      }
    }
  } else {
    LOGGER.error(
      dayjs().format(dayjsFormat),
      "error",
      "database file missing",
      {
        file: duckDbFile,
      }
    );
    try {
      quit();
    } finally {
      process.exit(2);
    }
  }

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
  app.set("json spaces", 0); // minify set JSON
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
    tokens.url(req, res).replace(serveUrlPrefix + serveUrlVersion, "") +
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

  // simple service account authentication between API Gateway and API Server
  // OAuth and OpenID Connect will be handled by API Gateway
  // by intent ALL routes are globally covered by basic auth
  app.use(
    basicAuth({
      users: { serviceUsername: serviceKey },
      challenge: true,
      realm: serveDomain,
    })
  );

  // request timeout handler
  app.use((req, res, next) => {
    res.setTimeout(serveTimeOutRequest, () => {
      LOGGER.warn(dayjs().format(dayjsFormat), "warn", {
        event: "request timed out (408)",
        remote: req.ip,
        url: req.originalUrl,
      });
      res
        .contentType(OAS.mimeJSON)
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

  // API handlers
  async function dumpRequest(req, res, next) {
    if (DEBUG) {
      if (req != null) {
        let hasBody = false;
        if (req.body != null) {
          hasBody = true;
        }
        LOGGER.debug(dayjs().format(dayjsFormat), "debug", {
          path: req.path.replace(serveUrlPrefix + serveUrlVersion, ""),
          originalUrl: req.originalUrl,
          method: req.method,
          hasBody: hasBody,
          contentType: req.get("Content-Type"),
          contentLength: req.get("Content-Length"),
          accept: req.get("Accept"),
        });
        if (hasBody) {
          switch (req.get("Content-Type")) {
            case OAS.mimeJSON:
              LOGGER.debug(dayjs().format(dayjsFormat), "debug", {
                body: req.body,
              });
              break;
            default:
              LOGGER.debug(dayjs().format(dayjsFormat), "debug", {
                body: "unsupported Content-Type",
              });
          }
        }
      }
    }
    return next();
  }

  async function getAdminData(req, res, next) {
    try {
      let ddRead = await DDC.runAndReadAll(
        "SELECT historicalDuration, historicalUnit, predictedDuration, predictedUnit FROM adminData LIMIT 1"
      );
      let ddRows = ddRead.getRows();
      if (ddRows.length > 0) {
        let resJson = {
          historical: {
            duration: toInteger(ddRows[0][0]),
            unit: ddRows[0][1],
          },
          predicted: {
            duration: toInteger(ddRows[0][2]),
            unit: ddRows[0][3],
          },
        };
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res.sendStatus(204);
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addAdminData(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddRead = await DDC.runAndReadAll(
          "SELECT id FROM adminData LIMIT 1"
        );
        let ddRows = ddRead.getRows();
        let adminId = null;
        if (ddRows.length > 0) {
          adminId = ddRows[0][0];
          let ddp = await DDC.prepare(
            "UPDATE adminData " +
              "SET historicalDuration = $1, " +
              "historicalUnit = $2, " +
              "predictedDuration = $3, " +
              "predictedUnit = $4 " +
              "WHERE id = $5 "
          );
          ddp.bindInteger(1, req.body.historical.duration);
          ddp.bindVarchar(2, req.body.historical.unit);
          ddp.bindInteger(3, req.body.predicted.duration);
          ddp.bindVarchar(4, req.body.predicted.unit);
          ddp.bindVarchar(5, adminId);
          await ddp.run();
        } else {
          adminId = uuidv4();
          let ddp = await DDC.prepare(
            "INSERT INTO adminData (id,historicalDuration,historicalUnit,predictedDuration,predictedUnit) VALUES ($1,$2,$3,$4,$5)"
          );
          ddp.bindVarchar(1, adminId);
          ddp.bindInteger(2, req.body.historical.duration);
          ddp.bindVarchar(3, req.body.historical.unit);
          ddp.bindInteger(4, req.body.predicted.duration);
          ddp.bindVarchar(5, req.body.predicted.unit);
          await ddp.run();
        }
        res.sendStatus(204);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getMaxRetentionPeriodDuration(req, res, next) {
    try {
      let ddRead = await DDC.runAndReadAll(
        "SELECT historicalDuration,historicalUnit FROM adminData LIMIT 1"
      );
      let ddRows = ddRead.getRows();
      if (ddRows.length > 0) {
        let resJson = { duration: toInteger(ddRows[0][0]), unit: ddRows[0][1] };
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res.sendStatus(204);
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateMaxRetentionPeriodDuration(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddRead = await DDC.runAndReadAll(
          "SELECT id FROM adminData LIMIT 1"
        );
        let ddRows = ddRead.getRows();
        let adminId = null;
        if (ddRows.length > 0) {
          adminId = ddRows[0][0];
          let ddp = await DDC.prepare(
            "UPDATE adminData " +
              "SET historicalDuration = $1, " +
              "historicalUnit = $2 " +
              "WHERE id = $3 "
          );
          ddp.bindInteger(1, toInteger(req.body.duration));
          ddp.bindVarchar(2, req.body.unit);
          ddp.bindVarchar(3, adminId);
          let ddUpdate = await ddp.run();
        }
        res.sendStatus(204);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateMaxPredictedPeriodDuration(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddRead = await DDC.runAndReadAll(
          "SELECT id FROM adminData LIMIT 1"
        );
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let ddp = await DDC.prepare(
            "UPDATE adminData " +
              "SET predictedDuration = $1, " +
              "predictedUnit = $2 " +
              "WHERE id = $3 "
          );
          ddp.bindInteger(1, toInteger(req.body.duration));
          ddp.bindVarchar(2, req.body.unit);
          ddp.bindVarchar(3, ddRows[0][0]);
          await ddp.run();
        }
        res.sendStatus(204);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addMultipleEmail(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        req.body = jsonSortByMultiKeys(req.body, ["vendor", "address"]);
        for (let i = 0; i < req.body.length; i++) {
          let ddd = await DDC.runAndReadAll(
            "SELECT id FROM adminEmail WHERE id = '" +
              req.body[i].emailProviderId +
              "'"
          );
          let dddRows = ddd.getRows();
          if (dddRows.length > 0) {
            await DDC.run(
              "DELETE FROM adminEmailSend WHERE adminEmailId = '" +
                req.body[i].emailProviderId +
                "'"
            );
            await DDC.run(
              "DELETE FROM adminEmailReceive WHERE adminEmailId = '" +
                req.body[i].emailProviderId +
                "'"
            );
            await DDC.run(
              "DELETE FROM adminEmail WHERE id = '" +
                req.body[i].emailProviderId +
                "'"
            );
          }
        }
        let resJson = [];
        for (let i = 0; i < req.body.length; i++) {
          let ddp = await DDC.prepare(
            "INSERT INTO adminEmail (id,vendor,address,name) VALUES ($1,$2,$3,$4)"
          );
          ddp.bindVarchar(1, req.body[i].emailProviderId);
          ddp.bindVarchar(2, req.body[i].vendor);
          ddp.bindVarchar(3, req.body[i].address);
          ddp.bindVarchar(4, req.body[i].name);
          await ddp.run();

          ddp = await DDC.prepare(
            "INSERT INTO adminEmailSend (adminEmailId,username,password,host,port,protocol,authentication,encryptionEnabled,encryptionStartTls) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)"
          );
          ddp.bindVarchar(1, req.body[i].emailProviderId);
          ddp.bindVarchar(2, req.body[i].send.username);
          ddp.bindVarchar(3, req.body[i].send.password);
          ddp.bindVarchar(4, req.body[i].send.host);
          ddp.bindInteger(5, toInteger(req.body[i].send.port));
          ddp.bindVarchar(6, req.body[i].send.protocol);
          ddp.bindVarchar(7, req.body[i].send.authentication);
          ddp.bindBoolean(8, toBoolean(req.body[i].send.encryption.enabled));
          ddp.bindBoolean(9, toBoolean(req.body[i].send.encryption.starttls));
          await ddp.run();

          if (req.body[i].receive != null && req.body[i].receive != {}) {
            let ddp = await DDC.prepare(
              "INSERT INTO adminEmailReceive (adminEmailId,username,password,host,port,protocol,encryptionEnabled,encryptionStartTls,rootFolder,folderSeparator) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)"
            );
            ddp.bindVarchar(1, req.body[i].emailProviderId);
            ddp.bindVarchar(2, req.body[i].receive.username);
            ddp.bindVarchar(3, req.body[i].receive.password);
            ddp.bindVarchar(4, req.body[i].receive.host);
            ddp.bindInteger(5, toInteger(req.body[i].receive.port));
            ddp.bindVarchar(6, req.body[i].receive.protocol);
            ddp.bindBoolean(
              7,
              toBoolean(req.body[i].receive.encryption.enabled)
            );
            ddp.bindBoolean(
              8,
              toBoolean(eq.body[i].receive.encryption.starttls)
            );
            ddp.bindVarchar(9, req.body[i].receive.rootFolder);
            ddp.bindVarchar(10, req.body[i].receive.folderSeparator);
            await ddp.run();
          }
          resJson.push(req.body[i].emailProviderId);
        }
        resJson = Array.from(new Set(resJson.map(JSON.stringify)))
          .map(JSON.parse)
          .sort();
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getMultipleEmail(req, res, next) {
    try {
      let resJson = [];
      let ddEmail = await DDC.runAndReadAll(
        "SELECT id, vendor, address, name FROM adminEmail"
      );
      let ddEmailRows = ddEmail.getRows();
      if (ddEmailRows.length > 0) {
        for (let idx in ddEmailRows) {
          let resObj = {
            emailProviderId: ddEmailRows[idx][0],
            vendor: ddEmailRows[idx][1],
            address: ddEmailRows[idx][2],
            name: ddEmailRows[idx][3],
          };
          let ddReceive = await DDC.runAndReadAll(
            "SELECT username,password,host,port,protocol,encryptionEnabled,encryptionStartTls,rootFolder,folderSeparator " +
              "FROM adminEmailReceive WHERE adminEmailId = '" +
              ddEmailRows[idx][0] +
              "'"
          );
          let ddReceiveRows = ddReceive.getRows();
          if (ddReceiveRows.length > 0) {
            resObj.receive = {
              username: ddReceiveRows[0][0],
              password: ddReceiveRows[0][1],
              host: ddReceiveRows[0][2],
              port: toInteger(ddReceiveRows[0][3]),
              protocol: ddReceiveRows[0][4],
              encryption: {
                enabled: toBoolean(ddReceiveRows[0][5]),
                starttls: toBoolean(ddReceiveRows[0][6]),
              },
              rootFolder: ddReceiveRows[0][7],
              folderSeparator: ddReceiveRows[0][8],
            };
          }
          let ddSend = await DDC.runAndReadAll(
            "SELECT username,password,host,port,protocol,authentication,encryptionEnabled,encryptionStartTls " +
              "FROM adminEmailSend WHERE adminEmailId = '" +
              ddEmailRows[idx][0] +
              "'"
          );
          let ddSendRows = ddSend.getRows();
          if (ddSendRows.length > 0) {
            resObj.send = {
              username: ddSendRows[0][0],
              password: ddSendRows[0][1],
              host: ddSendRows[0][2],
              port: toInteger(ddSendRows[0][3]),
              protocol: ddSendRows[0][4],
              authentication: ddSendRows[0][5],
              encryption: {
                enabled: toBoolean(ddSendRows[0][6]),
                starttls: toBoolean(ddSendRows[0][7]),
              },
            };
          }
          resJson.push(resObj);
        }
        resJson = jsonSortByMultiKeys(resJson, ["vendor", "address"]);
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res.sendStatus(204);
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllEmailProviders(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = [];
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let ddRead = await DDC.runAndReadAll("SELECT id FROM adminEmail");
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            resJson.push(ddRows[idx][0]);
          }
          resJson.sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function registerEmailProvider(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let emailProviderId = uuidv4();
        let ddp = await DDC.prepare(
          "INSERT INTO adminEmail (id,vendor,address,name) VALUES ($1,$2,$3,$4)"
        );
        ddp.bindVarchar(1, emailProviderId);
        ddp.bindVarchar(2, req.body.vendor);
        ddp.bindVarchar(3, req.body.address);
        ddp.bindVarchar(4, req.body.name);
        await ddp.run();

        ddp = await DDC.prepare(
          "INSERT INTO adminEmailSend (adminEmailId,username,password,host,port,protocol,authentication,encryptionEnabled,encryptionStartTls) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)"
        );
        ddp.bindVarchar(1, emailProviderId);
        ddp.bindVarchar(2, req.body.send.username);
        ddp.bindVarchar(3, req.body.send.password);
        ddp.bindVarchar(4, req.body.send.host);
        ddp.bindInteger(5, toInteger(req.body.send.port));
        ddp.bindVarchar(6, req.body.send.protocol);
        ddp.bindVarchar(7, req.body.send.authentication);
        ddp.bindBoolean(8, toBoolean(req.body.send.encryption.enabled));
        ddp.bindBoolean(9, toBoolean(req.body.send.encryption.starttls));
        await ddp.run();

        if (req.body.receive != null && req.body.receive != {}) {
          let ddp = await DDC.prepare(
            "INSERT INTO adminEmailReceive (adminEmailId,username,password,host,port,protocol,encryptionEnabled,encryptionStartTls,rootFolder,folderSeparator) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)"
          );
          ddp.bindVarchar(1, emailProviderId);
          ddp.bindVarchar(2, req.body.receive.username);
          ddp.bindVarchar(3, req.body.receive.password);
          ddp.bindVarchar(4, req.body.receive.host);
          ddp.bindInteger(5, toInteger(req.body.receive.port));
          ddp.bindVarchar(6, req.body.receive.protocol);
          ddp.bindBoolean(7, toBoolean(req.body.receive.encryption.enabled));
          ddp.bindBoolean(8, toBoolean(req.body.receive.encryption.starttls));
          ddp.bindVarchar(9, req.body.receive.rootFolder);
          ddp.bindVarchar(10, req.body.receive.folderSeparator);
          await ddp.run();
        }
        res
          .contentType(OAS.mimeJSON)
          .status(200)
          .json({ emailProviderId: emailProviderId });
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function deleteEmailProvider(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (await dbIdExists(req.params.emailProviderId, "adminEmail")) {
          await DDC.run(
            "DELETE FROM alertNotify WHERE emailProviderId = '" +
              req.params.emailProviderId +
              "'"
          );
          await DDC.run(
            "DELETE FROM adminEmailSend WHERE adminEmailId = '" +
              req.params.emailProviderId +
              "'"
          );
          await DDC.run(
            "DELETE FROM adminEmailReceive WHERE adminEmailId = '" +
              req.params.emailProviderId +
              "'"
          );
          await DDC.run(
            "DELETE FROM adminEmail WHERE id = '" +
              req.params.emailProviderId +
              "'"
          );
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "emailProviderId " +
                req.params.emailProviderId +
                " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSingleEmailProvider(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddEmail = await DDC.runAndReadAll(
          "SELECT vendor, address, name FROM adminEmail WHERE id = '" +
            req.params.emailProviderId +
            "'"
        );
        let ddEmailRows = ddEmail.getRows();
        if (ddEmailRows.length > 0) {
          let resJson = {
            emailProviderId: req.params.emailProviderId,
            vendor: ddEmailRows[0][0],
            address: ddEmailRows[0][1],
            name: ddEmailRows[0][2],
          };
          let ddReceive = await DDC.runAndReadAll(
            "SELECT username,password,host,port,protocol,encryptionEnabled,encryptionStartTls,rootFolder,folderSeparator " +
              "FROM adminEmailReceive WHERE adminEmailId = '" +
              req.params.emailProviderId +
              "'"
          );
          let ddReceiveRows = ddReceive.getRows();
          if (ddReceiveRows.length > 0) {
            resJson.receive = {
              username: ddReceiveRows[0][0],
              password: ddReceiveRows[0][1],
              host: ddReceiveRows[0][2],
              port: toInteger(ddReceiveRows[0][3]),
              protocol: ddReceiveRows[0][4],
              encryption: {
                enabled: toBoolean(ddReceiveRows[0][5]),
                starttls: toBoolean(ddReceiveRows[0][6]),
              },
              rootFolder: ddReceiveRows[0][7],
              folderSeparator: ddReceiveRows[0][8],
            };
          }
          let ddSend = await DDC.runAndReadAll(
            "SELECT username,password,host,port,protocol,authentication,encryptionEnabled,encryptionStartTls " +
              "FROM adminEmailSend WHERE adminEmailId = '" +
              req.params.emailProviderId +
              "'"
          );
          let ddSendRows = ddSend.getRows();
          if (ddSendRows.length > 0) {
            resJson.send = {
              username: ddSendRows[0][0],
              password: ddSendRows[0][1],
              host: ddSendRows[0][2],
              port: toInteger(ddSendRows[0][3]),
              protocol: ddSendRows[0][4],
              authentication: ddSendRows[0][5],
              encryption: {
                enabled: toBoolean(ddSendRows[0][6]),
                starttls: toBoolean(ddSendRows[0][7]),
              },
            };
            res.contentType(OAS.mimeJSON).status(200).json(resJson);
          }
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "emailProviderId " +
                req.params.emailProviderId +
                " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateEmailProvider(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddEmail = await DDC.runAndReadAll(
          "SELECT vendor, address, name FROM adminEmail WHERE id = '" +
            req.params.emailProviderId +
            "'"
        );
        let ddEmailRows = ddEmail.getRows();
        if (ddEmailRows.length > 0) {
          let resJson = {
            vendor: ddEmailRows[0][0],
            address: ddEmailRows[0][1],
            name: ddEmailRows[0][2],
          };
          let ddReceive = await DDC.runAndReadAll(
            "SELECT username,password,host,port,protocol,encryptionEnabled,encryptionStartTls,rootFolder,folderSeparator " +
              "FROM adminEmailReceive WHERE adminEmailId = '" +
              req.params.emailProviderId +
              "'"
          );
          let ddReceiveRows = ddReceive.getRows();
          if (ddReceiveRows.length > 0) {
            resJson.receive = {
              username: ddReceiveRows[0][0],
              password: ddReceiveRows[0][1],
              host: ddReceiveRows[0][2],
              port: ddReceiveRows[0][3],
              protocol: ddReceiveRows[0][4],
              encryption: {
                enabled: ddReceiveRows[0][5],
                starttls: ddReceiveRows[0][6],
              },
              rootFolder: ddReceiveRows[0][7],
              folderSeparator: ddReceiveRows[0][8],
            };
          }
          let ddSend = await DDC.runAndReadAll(
            "SELECT username,password,host,port,protocol,authentication,encryptionEnabled,encryptionStartTls " +
              "FROM adminEmailSend WHERE adminEmailId = '" +
              req.params.emailProviderId +
              "'"
          );
          let ddSendRows = ddSend.getRows();
          if (ddSendRows.length > 0) {
            resJson.send = {
              username: ddSendRows[0][0],
              password: ddSendRows[0][1],
              host: ddSendRows[0][2],
              port: ddSendRows[0][3],
              protocol: ddSendRows[0][4],
              authentication: ddSendRows[0][5],
              encryption: {
                enabled: ddSendRows[0][6],
                starttls: ddSendRows[0][7],
              },
            };
            // pass to replace to regenerate the record
            req.body = jsonDeepMerge(resJson, req.body);
            return next();
          }
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "emailProviderId " +
                req.params.emailProviderId +
                " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function replaceEmailProvider(req, res, next) {
    try {
      let ddEmail = await DDC.runAndReadAll(
        "SELECT id FROM adminEmail WHERE id = '" +
          req.params.emailProviderId +
          "'"
      );
      let ddEmailRows = ddEmail.getRows();
      if (ddEmailRows.length > 0) {
        // remove existing related FK, but keep parent PK
        let ddp = await DDC.prepare(
          "DELETE FROM adminEmailSend WHERE adminEmailId = $1"
        );
        ddp.bindVarchar(1, req.params.emailProviderId);
        await ddp.run();
        ddp = await DDC.prepare(
          "DELETE FROM adminEmailReceive WHERE adminEmailId = $1"
        );

        // replacement, update existing PK and insert the related FK
        ddp = await DDC.prepare(
          "UPDATE adminEmail SET vendor = $1, address = $2, name = $3 WHERE id = $4"
        );
        ddp.bindVarchar(1, req.body.vendor);
        ddp.bindVarchar(2, req.body.address);
        ddp.bindVarchar(3, req.body.name);
        ddp.bindVarchar(4, req.params.emailProviderId);
        await ddp.run();

        ddp = await DDC.prepare(
          "INSERT INTO adminEmailSend (adminEmailId,username,password,host,port,protocol,authentication,encryptionEnabled,encryptionStartTls) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)"
        );
        ddp.bindVarchar(1, req.params.emailProviderId);
        ddp.bindVarchar(2, req.body.send.username);
        ddp.bindVarchar(3, req.body.send.password);
        ddp.bindVarchar(4, req.body.send.host);
        ddp.bindInteger(5, toInteger(req.body.send.port));
        ddp.bindVarchar(6, req.body.send.protocol);
        ddp.bindVarchar(7, req.body.send.authentication);
        ddp.bindBoolean(8, toBoolean(req.body.send.encryption.enabled));
        ddp.bindBoolean(9, toBoolean(req.body.send.encryption.starttls));
        await ddp.run();

        if (req.body.receive != null && req.body.receive != {}) {
          let ddp = await DDC.prepare(
            "INSERT INTO adminEmailReceive (adminEmailId,username,password,host,port,protocol,encryptionEnabled,encryptionStartTls,rootFolder,folderSeparator) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)"
          );
          ddp.bindVarchar(1, req.params.emailProviderId);
          ddp.bindVarchar(2, req.body.receive.username);
          ddp.bindVarchar(3, req.body.receive.password);
          ddp.bindVarchar(4, req.body.receive.host);
          ddp.bindInteger(5, toInteger(req.body.receive.port));
          ddp.bindVarchar(6, req.body.receive.protocol);
          ddp.bindBoolean(7, toBoolean(req.body.receive.encryption.enabled));
          ddp.bindBoolean(8, toBoolean(req.body.receive.encryption.starttls));
          ddp.bindVarchar(9, req.body.receive.rootFolder);
          ddp.bindVarchar(10, req.body.receive.folderSeparator);
          await ddp.run();
        }
        res.sendStatus(204);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(404)
          .json({
            errors:
              "emailProviderId " +
              req.params.emailProviderId +
              " does not exist",
          });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getMultipleKafka(req, res, next) {
    try {
      let resJson = [];
      let ddKafka = await DDC.runAndReadAll(
        "SELECT id,name,clientId,username,password,host,port,retryDelay,retries,acks,linger,batchSize,bufferMemory,maxInFlightRequestsPerConnection,compressionMethod,authentication FROM adminKafka"
      );
      let ddRows = ddKafka.getRows();
      if (ddRows.length > 0) {
        for (let idx in ddRows) {
          let resObj = {
            kafkaProducerId: ddRows[idx][0],
            name: ddRows[idx][1],
            clientId: ddRows[idx][2],
            producer: {
              username: ddRows[idx][3],
              password: ddRows[idx][4],
              host: ddRows[idx][5],
              port: toInteger(ddRows[idx][6]),
              retryDelay: toInteger(ddRows[idx][7]),
              retries: toInteger(ddRows[idx][8]),
              acks: ddRows[idx][9],
              linger: toInteger(ddRows[idx][10]),
              batchSize: toInteger(ddRows[idx][11]),
              bufferMemory: toInteger(ddRows[idx][12]),
              maxInFlightRequestsPerConnection: toInteger(ddRows[idx][13]),
              compressionMethod: ddRows[idx][14],
              authentication: ddRows[idx][15],
            },
          };
          resJson.push(resObj);
        }
        resJson = jsonSortByMultiKeys(resJson, ["name", "clientId"]);
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res.sendStatus(204);
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addMultipleKafka(req, res, next) {
    let resJson = [];
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        req.body = jsonSortByMultiKeys(req.body, ["name", "clientId"]);
        for (let i = 0; i < req.body.length; i++) {
          let ddd = await DDC.runAndReadAll(
            "SELECT id FROM adminKafka WHERE id = '" +
              req.body[i].kafkaProducerId +
              "'"
          );
          let dddRows = ddd.getRows();
          if (dddRows.length > 0) {
            await DDC.run(
              "DELETE FROM adminKafka WHERE id = '" +
                req.body[i].kafkaProducerId +
                "'"
            );
          }
        }
        let resJson = [];
        for (let i = 0; i < req.body.length; i++) {
          let ddp = await DDC.prepare(
            "INSERT INTO adminKafka (id,name,clientId,username,password,host,port,retryDelay,retries,acks,linger,batchSize,bufferMemory,maxInFlightRequestsPerConnection,compressionMethod,authentication) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)"
          );
          ddp.bindVarchar(1, req.body[i].kafkaProducerId);
          ddp.bindVarchar(2, req.body[i].name);
          ddp.bindVarchar(3, req.body[i].clientId);
          ddp.bindVarchar(4, req.body[i].producer.username);
          ddp.bindVarchar(5, req.body[i].producer.password);
          ddp.bindVarchar(6, req.body[i].producer.host);
          ddp.bindInteger(7, req.body[i].producer.port);
          ddp.bindInteger(8, req.body[i].producer.retryDelay);
          ddp.bindInteger(9, req.body[i].producer.retries);
          ddp.bindVarchar(10, req.body[i].producer.acks);
          ddp.bindInteger(11, req.body[i].producer.linger);
          ddp.bindInteger(12, req.body[i].producer.batchSize);
          ddp.bindInteger(13, req.body[i].producer.bufferMemory);
          ddp.bindInteger(
            14,
            req.body[i].producer.maxInFlightRequestsPerConnection
          );
          ddp.bindVarchar(15, req.body[i].producer.compressionMethod);
          ddp.bindVarchar(16, req.body[i].producer.authentication);
          await ddp.run();
          resJson.push(req.body[i].kafkaProducerId);
        }
        resJson = Array.from(new Set(resJson.map(JSON.stringify)))
          .map(JSON.parse)
          .sort();
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllKafkaBrokers(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = [];
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let ddRead = await DDC.runAndReadAll("SELECT id FROM adminKafka");
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            resJson.push(ddRows[idx][0]);
          }
          resJson.sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function registerKafkaBroker(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let kafkaProducerId = uuidv4();
        let ddp = await DDC.prepare(
          "INSERT INTO adminKafka (id,name,clientId,username,password,host,port,retryDelay,retries,acks,linger,batchSize,bufferMemory,maxInFlightRequestsPerConnection,compressionMethod,authentication) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)"
        );
        ddp.bindVarchar(1, kafkaProducerId);
        ddp.bindVarchar(2, req.body.name);
        ddp.bindVarchar(3, req.body.clientId);
        ddp.bindVarchar(4, req.body.producer.username);
        ddp.bindVarchar(5, req.body.producer.password);
        ddp.bindVarchar(6, req.body.producer.host);
        ddp.bindInteger(7, req.body.producer.port);
        ddp.bindInteger(8, req.body.producer.retryDelay);
        ddp.bindInteger(9, req.body.producer.retries);
        ddp.bindVarchar(10, req.body.producer.acks);
        ddp.bindInteger(11, req.body.producer.linger);
        ddp.bindInteger(12, req.body.producer.batchSize);
        ddp.bindInteger(13, req.body.producer.bufferMemory);
        ddp.bindInteger(14, req.body.producer.maxInFlightRequestsPerConnection);
        ddp.bindVarchar(15, req.body.producer.compressionMethod);
        ddp.bindVarchar(16, req.body.producer.authentication);
        await ddp.run();
        res
          .contentType(OAS.mimeJSON)
          .status(200)
          .json({ kafkaProducerId: kafkaProducerId });
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function deleteKafkaBroker(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (await dbIdExists(req.params.kafkaProducerId, "adminKafka")) {
          await DDC.run(
            "DELETE FROM alertPublish WHERE kafkaId = '" +
              req.params.kafkaProducerId +
              "'"
          );
          await DDC.run(
            "DELETE FROM adminKafka WHERE id = '" +
              req.params.kafkaProducerId +
              "'"
          );
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "kafkaProducerId " +
                req.params.kafkaProducerId +
                " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSingleKafkaBroker(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddKafka = await DDC.runAndReadAll(
          "SELECT name,clientId,username,password,host,port,retryDelay,retries,acks,linger,batchSize,bufferMemory,maxInFlightRequestsPerConnection,compressionMethod,authentication FROM adminKafka WHERE id = '" +
            req.params.kafkaProducerId +
            "'"
        );
        let ddKafkaRows = ddKafka.getRows();
        if (ddKafkaRows.length > 0) {
          let resJson = {
            kafkaProducerId: req.params.kafkaProducerId,
            name: ddKafkaRows[0][0],
            clientId: ddKafkaRows[0][1],
            producer: {
              username: ddKafkaRows[0][2],
              password: ddKafkaRows[0][3],
              host: ddKafkaRows[0][4],
              port: toInteger(ddKafkaRows[0][5]),
              retryDelay: toInteger(ddKafkaRows[0][6]),
              retries: toInteger(ddKafkaRows[0][7]),
              acks: ddKafkaRows[0][8],
              linger: toInteger(ddKafkaRows[0][9]),
              batchSize: toInteger(ddKafkaRows[0][10]),
              bufferMemory: toInteger(ddKafkaRows[0][11]),
              maxInFlightRequestsPerConnection: toInteger(ddKafkaRows[0][12]),
              compressionMethod: ddKafkaRows[0][13],
              authentication: ddKafkaRows[0][14],
            },
          };
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "kafkaProducerId " +
                req.params.kafkaProducerId +
                " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateKafkaBroker(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let ddKafka = await DDC.runAndReadAll(
          "SELECT name,clientId,username,password,host,port,retryDelay,retries,acks,linger,batchSize,bufferMemory,maxInFlightRequestsPerConnection,compressionMethod,authentication FROM adminKafka WHERE id = '" +
            req.params.kafkaProducerId +
            "'"
        );
        let ddKafkaRows = ddKafka.getRows();
        if (ddKafkaRows.length > 0) {
          resJson = {
            kafkaProducerId: req.params.kafkaProducerId,
            name: ddKafkaRows[0][0],
            clientId: ddKafkaRows[0][1],
            producer: {
              username: ddKafkaRows[0][2],
              password: ddKafkaRows[0][3],
              host: ddKafkaRows[0][4],
              port: ddKafkaRows[0][5],
              retryDelay: ddKafkaRows[0][6],
              retries: ddKafkaRows[0][7],
              acks: ddKafkaRows[0][8],
              linger: ddKafkaRows[0][9],
              batchSize: ddKafkaRows[0][10],
              bufferMemory: ddKafkaRows[0][11],
              maxInFlightRequestsPerConnection: ddKafkaRows[0][12],
              compressionMethod: ddKafkaRows[0][13],
              authentication: ddKafkaRows[0][14],
            },
          };
          // pass to replace to regenerate the record
          req.body = jsonDeepMerge(resJson, req.body);
          return next();
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "kafkaProducerId " +
                req.params.kafkaProducerId +
                " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function replaceKafkaBroker(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddKafka = await DDC.runAndReadAll(
          "SELECT id FROM adminKafka WHERE id = '" +
            req.params.kafkaProducerId +
            "'"
        );
        let ddKafkaRows = ddKafka.getRows();
        if (ddKafkaRows.length > 0) {
          // replacement, update existing
          let ddp = await DDC.prepare(
            "UPDATE adminKafka SET name = $1, clientId = $2, username = $3, password = $4, host = $5, port = $6, " +
              "retryDelay = $7, retries = $8, acks = $9, linger = $10, batchSize = $11, bufferMemory = $12, " +
              "maxInFlightRequestsPerConnection = $13, compressionMethod = $14, authentication = $15 WHERE id = $16"
          );
          ddp.bindVarchar(1, req.body.name);
          ddp.bindVarchar(2, req.body.clientId);
          ddp.bindVarchar(3, req.body.producer.username);
          ddp.bindVarchar(4, req.body.producer.password);
          ddp.bindVarchar(5, req.body.producer.host);
          ddp.bindInteger(6, req.body.producer.port);
          ddp.bindInteger(7, req.body.producer.retryDelay);
          ddp.bindInteger(8, req.body.producer.retries);
          ddp.bindVarchar(9, req.body.producer.acks);
          ddp.bindInteger(10, req.body.producer.linger);
          ddp.bindInteger(11, req.body.producer.batchSize);
          ddp.bindInteger(12, req.body.producer.bufferMemory);
          ddp.bindInteger(
            13,
            req.body.producer.maxInFlightRequestsPerConnection
          );
          ddp.bindVarchar(14, req.body.producer.compressionMethod);
          ddp.bindVarchar(15, req.body.producer.authentication);
          ddp.bindVarchar(16, req.body.kafkaProducerId);
          await ddp.run();
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "kafkaProducerId " +
                req.params.kafkaProducerId +
                " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getMultipleMap(req, res, next) {
    try {
      let resJson = [];
      let ddMap = await DDC.runAndReadAll(
        "SELECT id, vendor,systemDefault, renderUrl, credentialsIdentity, credentialsKey, identityProviderBase, identityProviderAuthorization, identityProviderToken, identityProviderWellKnown FROM adminMap"
      );
      let ddMapRows = ddMap.getRows();
      if (ddMapRows.length > 0) {
        for (let idx in ddMapRows) {
          let resObj = {
            mapProviderId: ddMapRows[idx][0],
            vendor: ddMapRows[idx][1],
            default: toBoolean(ddMapRows[idx][2]),
            renderUrl: ddMapRows[idx][3],
          };
          if (ddMapRows[idx][5] != null) {
            resObj.credentials = {
              identity: ddMapRows[idx][4],
              key: ddMapRows[idx][5],
            };
          } else if (ddMapRows[idx][7] != null) {
            resObj.identityProvider = {
              base: ddMapRows[idx][6],
              authorization: ddMapRows[idx][7],
              token: ddMapRows[idx][8],
              wellKnown: ddMapRows[idx][9],
            };
          }
          resJson.push(resObj);
        }
        resJson = jsonSortByMultiKeys(resJson, ["vendor"]);
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res.sendStatus(204);
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addMultipleMap(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        req.body = jsonSortByMultiKeys(req.body, ["vendor"]);
        for (let i = 0; i < req.body.length; i++) {
          let ddd = await DDC.runAndReadAll(
            "SELECT id FROM adminMap WHERE id = '" +
              req.body[i].mapProviderId +
              "'"
          );
          let dddRows = ddd.getRows();
          if (dddRows.length > 0) {
            await DDC.run(
              "DELETE FROM adminMap WHERE id = '" +
                req.body[i].mapProviderId +
                "'"
            );
          }
        }
        let resJson = [];
        for (let i = 0; i < req.body.length; i++) {
          if (toBoolean(req.body[i].default)) {
            await DDC.run("UPDATE adminMap SET systemDefault = false");
          }
          if (req.body[i].credentials?.key != null) {
            let ddp = await DDC.prepare(
              "INSERT INTO adminMap (id,vendor,systemDefault,renderUrl,credentialsIdentity,credentialsKey) VALUES ($1,$2,$3,$4,$5,$6)"
            );
            ddp.bindVarchar(1, req.body[i].mapProviderId);
            ddp.bindVarchar(2, req.body[i].vendor);
            ddp.bindBoolean(3, toBoolean(req.body[i].default));
            ddp.bindVarchar(4, req.body[i].renderUrl);
            ddp.bindVarchar(5, req.body[i].credentials.identity);
            ddp.bindVarchar(6, req.body[i].credentials.key);
            await ddp.run();
            resJson.push(req.body[i].mapProviderId);
          } else if (req.body[i].identityProvider?.authorization != null) {
            let ddp = await DDC.prepare(
              "INSERT INTO adminMap (id,vendor,systemDefault,renderUrl,identityProviderBase,identityProviderAuthorization,identityProviderToken,identityProviderWellKnown) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)"
            );
            ddp.bindVarchar(1, req.body[i].mapProviderId);
            ddp.bindVarchar(2, req.body[i].vendor);
            ddp.bindBoolean(3, toBoolean(req.body[i].default));
            ddp.bindVarchar(4, req.body[i].renderUrl);
            ddp.bindVarchar(5, req.body[i].identityProvider.base);
            ddp.bindVarchar(6, req.body[i].identityProvider.authorization);
            ddp.bindVarchar(7, req.body[i].identityProvider.token);
            ddp.bindVarchar(8, req.body[i].identityProvider.wellKnown);
            await ddp.run();
            resJson.push(req.body[i].mapProviderId);
          }
        }
        resJson = Array.from(new Set(resJson.map(JSON.stringify)))
          .map(JSON.parse)
          .sort();
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllMapProviders(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = [];
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let ddRead = await DDC.runAndReadAll("SELECT id FROM adminMap");
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            resJson.push(ddRows[idx][0]);
          }
          resJson.sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getDefaultMapProvider(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddRead = await DDC.runAndReadAll(
          "SELECT id FROM adminMap WHERE systemDefault = true"
        );
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          res
            .contentType(OAS.mimeJSON)
            .status(200)
            .json({ mapProviderId: ddRows[0][0] });
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({ errors: "not found default map provider" });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function registerMapProvider(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let mapProviderId = uuidv4();
        if (req.body.credentials?.key != null) {
          if (toBoolean(req.body.default)) {
            await DDC.run("UPDATE adminMap SET systemDefault = false");
          }
          let ddp = await DDC.prepare(
            "INSERT INTO adminMap (id,vendor,systemDefault,renderUrl,credentialsIdentity,credentialsKey) VALUES ($1,$2,$3,$4,$5,$6)"
          );
          ddp.bindVarchar(1, mapProviderId);
          ddp.bindVarchar(2, req.body.vendor);
          ddp.bindBoolean(3, toBoolean(req.body.default));
          ddp.bindVarchar(4, req.body.renderUrl);
          ddp.bindVarchar(5, req.body.credentials.identity);
          ddp.bindVarchar(6, req.body.credentials.key);
          await ddp.run();
          res
            .contentType(OAS.mimeJSON)
            .status(200)
            .json({ mapProviderId: mapProviderId });
        } else if (req.body.identityProvider?.authorization != null) {
          if (toBoolean(req.body.default)) {
            await DDC.run("UPDATE adminMap SET systemDefault = false");
          }
          let ddp = await DDC.prepare(
            "INSERT INTO adminMap (id,vendor,systemDefault,renderUrl,identityProviderBase,identityProviderAuthorization,identityProviderToken,identityProviderWellKnown) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)"
          );
          ddp.bindVarchar(1, mapProviderId);
          ddp.bindVarchar(2, req.body.vendor);
          ddp.bindBoolean(3, toBoolean(req.body.default));
          ddp.bindVarchar(4, req.body.renderUrl);
          ddp.bindVarchar(5, req.body.identityProvider.base);
          ddp.bindVarchar(6, req.body.identityProvider.authorization);
          ddp.bindVarchar(7, req.body.identityProvider.token);
          ddp.bindVarchar(8, req.body.identityProvider.wellKnown);
          await ddp.run();
          res
            .contentType(OAS.mimeJSON)
            .status(200)
            .json({ mapProviderId: mapProviderId });
        } else {
          res.contentType(OAS.mimeJSON).status(400).json({
            errors:
              "Either credentials identity/key must be suppied or identity Provider base/authorization/token/Well-Known URLs",
          });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function deleteMapProvider(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (await dbIdExists(req.params.mapProviderId, "adminMap")) {
          await DDC.run(
            "DELETE FROM adminMap WHERE id = '" + req.params.mapProviderId + "'"
          );
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "mapProviderId " + req.params.mapProviderId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSingleMapProvider(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = [];
        let ddMap = await DDC.runAndReadAll(
          "SELECT id, vendor, systemDefault, renderUrl, credentialsIdentity, credentialsKey, identityProviderBase, identityProviderAuthorization, identityProviderToken, identityProviderWellKnown FROM adminMap WHERE id = '" +
            req.params.mapProviderId +
            "'"
        );
        let ddRows = ddMap.getRows();
        if (ddRows.length > 0) {
          let resJson = {
            mapProviderId: req.params.mapProviderId,
            vendor: ddRows[0][1],
            default: toBoolean(ddRows[0][2]),
            renderUrl: ddRows[0][3],
          };
          if (ddRows[0][5] != null) {
            resJson.credentials = {
              identity: ddRows[0][4],
              key: ddRows[0][5],
            };
          } else if (ddRows[0][7] != null) {
            resJson.identityProvider = {
              base: ddRows[0][6],
              authorization: ddRows[0][7],
              token: ddRows[0][8],
              wellKnown: ddRows[0][9],
            };
          }
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "mapProviderId " + req.params.mapProviderId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateMapProvider(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let ddMap = await DDC.runAndReadAll(
          "SELECT id, vendor, systemDefault, renderUrl, credentialsIdentity, credentialsKey, identityProviderBase, identityProviderAuthorization, identityProviderToken, identityProviderWellKnown FROM adminMap WHERE id = '" +
            req.params.mapProviderId +
            "'"
        );
        let ddRows = ddMap.getRows();
        if (ddRows.length > 0) {
          resJson = {
            mapProviderId: req.params.mapProviderId,
            vendor: ddRows[0][1],
            default: toBoolean(ddRows[0][2]),
            renderUrl: ddRows[0][3],
          };
          if (ddRows[0][5] != null) {
            resJson.credentials = {
              identity: ddRows[0][4],
              key: ddRows[0][5],
            };
          } else if (ddRows[0][7] != null) {
            resJson.identityProvider = {
              base: ddRows[0][6],
              authorization: ddRows[0][7],
              token: ddRows[0][8],
              wellKnown: ddRows[0][9],
            };
          }
          // pass to replace to regenerate the record
          req.body = jsonDeepMerge(resJson, req.body);
          return next();
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "mapProviderId " + req.params.mapProviderId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function replaceMapProvider(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddMap = await DDC.runAndReadAll(
          "SELECT id FROM adminMap WHERE id = '" +
            req.params.mapProviderId +
            "'"
        );
        let ddRows = ddMap.getRows();
        if (ddRows.length > 0) {
          if (toBoolean(req.body.default)) {
            await DDC.run("UPDATE adminMap SET systemDefault = false");
          }
          // replacement, update existing
          if (req.body.credentials?.key != null) {
            let ddp = await DDC.prepare(
              "UPDATE adminMap SET vendor = $1, systemDefault = $2, renderUrl = $3, credentialsIdentity = $4, credentialsKey = $5 WHERE id = $6"
            );
            ddp.bindVarchar(1, req.body.vendor);
            ddp.bindBoolean(2, toBoolean(req.body.default));
            ddp.bindVarchar(3, req.body.renderUrl);
            ddp.bindVarchar(4, req.body.credentials.identity);
            ddp.bindVarchar(5, req.body.credentials.key);
            ddp.bindVarchar(6, req.body.mapProviderId);
            await ddp.run();
            res.sendStatus(204);
          } else if (req.body.identityProvider?.authorization != null) {
            let ddp = await DDC.prepare(
              "UPDATE adminMap SET vendor = $1, systemDefault = $2, renderUrl = $3, identityProviderBase = $4, identityProviderAuthorization = $5, identityProviderToken = $6,identityProviderWellKnown = $7 WHERE id = $8"
            );
            ddp.bindVarchar(1, req.body.vendor);
            ddp.bindBoolean(2, toBoolean(req.body.default));
            ddp.bindVarchar(3, req.body.renderUrl);
            ddp.bindVarchar(4, req.body.identityProvider.base);
            ddp.bindVarchar(5, req.body.identityProvider.authorization);
            ddp.bindVarchar(6, req.body.identityProvider.token);
            ddp.bindVarchar(7, req.body.identityProvider.wellKnown);
            ddp.bindVarchar(8, req.body.mapProviderId);
            await ddp.run();
            res.sendStatus(204);
          }
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "mapProviderId " + req.params.mapProviderId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getMultipleWorkflow(req, res, next) {
    try {
      let resJson = [];
      let ddWorkflow = await DDC.runAndReadAll(
        "SELECT id, name, engineUrl, engineUsername, enginePassword, engineType FROM adminWorkflow"
      );
      let ddRows = ddWorkflow.getRows();
      if (ddRows.length > 0) {
        for (let idx in ddRows) {
          let resObj = {
            workflowEngineId: ddRows[idx][0],
            name: ddRows[idx][1],
            engine: {
              url: ddRows[idx][2],
              username: ddRows[idx][3],
              password: ddRows[idx][4],
              type: ddRows[idx][5],
            },
          };
          resJson.push(resObj);
        }
        resJson = jsonSortByMultiKeys(resJson, ["name"]);
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res.sendStatus(204);
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addMultipleWorkflow(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        req.body = jsonSortByMultiKeys(req.body, ["name"]);
        for (let i = 0; i < req.body.length; i++) {
          let ddd = await DDC.runAndReadAll(
            "SELECT id FROM adminWorkflow WHERE id = '" +
              req.body[i].workflowEngineId +
              "'"
          );
          let dddRows = ddd.getRows();
          if (dddRows.length > 0) {
            await DDC.run(
              "DELETE FROM adminWorkflow WHERE id = '" +
                req.body[i].workflowEngineId +
                "'"
            );
          }
        }
        let resJson = [];
        for (let i = 0; i < req.body.length; i++) {
          let ddp = await DDC.prepare(
            "INSERT INTO adminWorkflow (id, name, engineUrl, engineUsername, enginePassword, engineType) VALUES ($1,$2,$3,$4,$5,$6)"
          );
          ddp.bindVarchar(1, req.body[i].workflowEngineId);
          ddp.bindVarchar(2, req.body[i].name);
          ddp.bindVarchar(3, req.body[i].engine.url);
          ddp.bindVarchar(4, req.body[i].engine.username);
          ddp.bindVarchar(5, req.body[i].engine.password);
          ddp.bindVarchar(6, req.body[i].engine.type);
          await ddp.run();
          resJson.push(req.body[i].workflowEngineId);
        }
        resJson = Array.from(new Set(resJson.map(JSON.stringify)))
          .map(JSON.parse)
          .sort();
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllWorkflowEngines(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = [];
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let ddRead = await DDC.runAndReadAll("SELECT id FROM adminWorkflow");
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            resJson.push(ddRows[idx][0]);
          }
          resJson.sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function registerWorkflowEngine(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let workflowEngineId = uuidv4();
        let ddp = await DDC.prepare(
          "INSERT INTO adminWorkflow (id, name, engineUrl, engineUsername, enginePassword, engineType) VALUES ($1,$2,$3,$4,$5,$6)"
        );
        ddp.bindVarchar(1, workflowEngineId);
        ddp.bindVarchar(2, req.body.name);
        ddp.bindVarchar(3, req.body.engine.url);
        ddp.bindVarchar(4, req.body.engine.username);
        ddp.bindVarchar(5, req.body.engine.password);
        ddp.bindVarchar(6, req.body.engine.type);
        await ddp.run();
        res
          .contentType(OAS.mimeJSON)
          .status(200)
          .json({ workflowEngineId: workflowEngineId });
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function deleteWorkflowEngine(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (await dbIdExists(req.params.workflowEngineId, "adminWorkflow")) {
          await DDC.run(
            "DELETE FROM alertWorkflow WHERE workflowEngineId = '" +
              req.params.workflowEngineId +
              "'"
          );
          await DDC.run(
            "DELETE FROM adminWorkflow WHERE id = '" +
              req.params.emailProviderId +
              "'"
          );
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "workflowEngineId " +
                req.params.workflowEngineId +
                " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSingleWorkflowEngine(req, res, next) {
    try {
      let result = validationResult(req);
      let resJson = {};
      if (result.isEmpty()) {
        let ddWorkflow = await DDC.runAndReadAll(
          "SELECT name, engineUrl, engineUsername, enginePassword, engineType FROM adminWorkflow WHERE id = '" +
            req.params.workflowEngineId +
            "'"
        );
        let ddRows = ddWorkflow.getRows();
        if (ddRows.length > 0) {
          resJson = {
            workflowEngineId: req.params.workflowEngineId,
            name: ddRows[0][0],
            engine: {
              url: ddRows[0][1],
              username: ddRows[0][2],
              password: ddRows[0][3],
              type: ddRows[0][4],
            },
          };
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "workflowEngineId " +
                req.params.workflowEngineId +
                " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateWorkflowEngine(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let ddWorkflow = await DDC.runAndReadAll(
          "SELECT name, engineUrl, engineUsername, enginePassword, engineType FROM adminWorkflow WHERE id = '" +
            req.params.workflowEngineId +
            "'"
        );
        let ddRows = ddWorkflow.getRows();
        if (ddRows.length > 0) {
          resJson = {
            workflowEngineId: req.params.workflowEngineId,
            name: ddRows[0][0],
            engine: {
              url: ddRows[0][1],
              username: ddRows[0][2],
              password: ddRows[0][3],
              type: ddRows[0][4],
            },
          };
          // pass to replace to regenerate the record
          req.body = jsonDeepMerge(resJson, req.body);
          return next();
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "workflowEngineId " +
                req.params.workflowEngineId +
                " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function replaceWorkflowEngine(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddWorkflow = await DDC.runAndReadAll(
          "SELECT id FROM adminWorkflow WHERE id = '" +
            req.params.workflowEngineId +
            "'"
        );
        let ddRows = ddWorkflow.getRows();
        if (ddRows.length > 0) {
          // replacement, update existing
          let ddp = await DDC.prepare(
            "UPDATE adminWorkflow SET name = $1, engineUrl = $2, engineUsername = $3, enginePassword = $4, engineType = $5 WHERE ID = $6"
          );
          ddp.bindVarchar(1, req.body.name);
          ddp.bindVarchar(2, req.body.engine.url);
          ddp.bindVarchar(3, req.body.engine.username);
          ddp.bindVarchar(4, req.body.engine.password);
          ddp.bindVarchar(5, req.body.engine.type);
          ddp.bindVarchar(6, req.body.workflowEngineId);
          await ddp.run();
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "workflowEngineId " +
                req.params.workflowEngineId +
                " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getMultipleAlerts(req, res, next) {
    try {
      let resJson = [];
      let ddRead = await DDC.runAndReadAll(
        "SELECT id,delete,description FROM alert"
      );
      let ddRows = ddRead.getRows();
      if (ddRows.length > 0) {
        for (let idx in ddRows) {
          let resObj = {
            alertId: ddRows[idx][0],
            description: ddRows[idx][2],
            delete: ddRows[idx][1],
          };
          resJson.push(resObj);
        }
        resJson = jsonSortByMultiKeys(resJson, ["description"]);
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res.sendStatus(204);
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllAlerts(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = [];
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let ddRead = await DDC.runAndReadAll("SELECT id FROM alert");
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        for (let idx in ddRows) {
          resJson.push(ddRows[idx][0]);
        }
        resJson.sort();
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addSingleAlert(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddp = await DDC.prepare(
          "INSERT INTO alert (id, description, delete) VALUES ($1,$2,$3)"
        );
        let alertId = uuidv4();
        ddp.bindVarchar(1, alertId);
        ddp.bindVarchar(2, req.body.description);
        ddp.bindBoolean(3, toBoolean(req.body.delete));
        await ddp.run();
        res.contentType(OAS.mimeJSON).status(200).json({ alertId: alertId });
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function unsubscribeAlert(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let dde = await DDC.prepare(
          "SELECT id FROM alertCallback WHERE requestorId = $1"
        );
        dde.bindVarchar(1, req.query.requestorId);
        let ddAlert = await dde.runAndReadAll();
        let ddRows = ddAlert.getRows();
        if (ddRows.length > 0) {
          let subscriptionIds = req.query.subscriptionId
            .replace("(", "")
            .replace(")", "")
            .split(",");
          for (let idx in subscriptionIds) {
            let ddp = await DDC.prepare(
              "DELETE FROM alertCallback WHERE requestorId = $1 AND subscriptionId = $2"
            );
            ddp.bindVarchar(1, req.query.requestorId);
            ddp.bindVarchar(2, subscriptionIds[idx]);
            await ddp.run();
          }
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "subscriptionId " +
                req.query.subscriptionId +
                " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function subscribeAlert(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = { requestorId: req.body.requestorId };
        for (let i = 0; i < req.body.length; i++) {
          let ddAlert = await DDC.runAndReadAll(
            "SELECT id FROM alert WHERE id = '" + req.body[i].alertId + "'"
          );
          let ddRows = ddAlert.getRows();
          if (ddRows.length > 0) {
            let alertCallbackId = uuidv4();
            let subscriptionId = uuidv4();
            let ddp = await DDC.prepare(
              "INSERT INTO alertCallback (id,alertId,requestorId,subscriptionId,callbackUrl,username,password,authentication,retries,currentRetry,retryDelay,maxLifeRetries,currentLifeRetries) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)"
            );
            ddp.bindVarchar(1, alertCallbackId);
            ddp.bindVarchar(2, req.body[i].alertId);
            ddp.bindVarchar(3, req.body.requestorId);
            ddp.bindVarchar(4, subscriptionId);
            ddp.bindVarchar(5, req.body[i].callbackUrl);
            ddp.bindVarchar(6, req.body[i].username);
            ddp.bindVarchar(7, req.body[i].password);
            ddp.bindVarchar(8, req.body[i].authentication);
            ddp.bindInteger(9, req.body[i].retries);
            ddp.bindInteger(10, 0);
            ddp.bindInteger(11, req.body[i].retryDelay);
            ddp.bindInteger(12, req.body[i].maxLifeRetries);
            ddp.bindInteger(13, 0);
            await ddp.run();
            resJson.alerts.push({
              alertId: req.body.alertId,
              subscriptionId: subscriptionId,
            });
          } else {
            res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "alertId " + req.body.alertId + " does not exist",
              });
          }
        }
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function unNotifyAlert(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let dde = await DDC.prepare(
          "SELECT id FROM alertNotify WHERE requestorId = $1 LIMIT 1"
        );
        dde.bindVarchar(1, req.query.requestorId);
        let ddAlert = await dde.runAndReadAll();
        let ddRows = ddAlert.getRows();
        if (ddRows.length > 0) {
          let notificationIds = req.query.notificationId
            .replace("(", "")
            .replace(")", "")
            .split(",");
          for (let idx in notificationIds) {
            let ddn = await DDC.prepare(
              "SELECT id FROM alertNotify WHERE requestorId = $1 AND notificationId = $2"
            );
            ddn.bindVarchar(1, req.query.requestorId);
            ddn.bindVarchar(2, notificationIds[idx]);
            let ddNotify = await ddn.runAndReadAll();
            let ddNotifyRows = ddNotify.getRows();
            if (ddNotifyRows.length > 0) {
              let ddnr = await DDC.prepare(
                "DELETE FROM alertNotifyRecipient WHERE notificationId = $1"
              );
              ddnr.bindVarchar(1, notificationIds[idx]);
              await ddnr.run();
              let ddp = await DDC.prepare(
                "DELETE FROM alertNotify WHERE requestorId = $1 AND notificationId = $2"
              );
              ddp.bindVarchar(1, req.query.requestorId);
              ddp.bindVarchar(2, notificationIds[idx]);
              await ddp.run();
              res.sendStatus(204);
            } else {
              res.contentType(OAS.mimeJSON).status(404).json({
                errors: "not found",
                requestorId: req.query.requestorId,
                notificationId: notificationIds[idx],
              });
            }
          }
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getNotifyAlert(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let ddRead = await DDC.runAndReadAll(
          "SELECT id,alertId,emailProviderId,subject FROM alertNotify WHERE notificationId = '" +
            req.params.notificationId +
            "'"
        );
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          resJson = {
            alertId: ddRows[0][1],
            emailProviderId: ddRows[0][2],
            subject: ddRows[0][3],
            recipient: [],
          };

          let ddRecRead = await DDC.runAndReadAll(
            "SELECT recipient FROM alertNotifyRecipient WHERE id = '" +
              ddRows[0][0] +
              "' AND notificationId = '" +
              req.params.notificationId +
              "'"
          );
          let ddRecRows = ddRecRead.getRows();
          if (ddRecRows.length > 0) {
            for (let idx in ddRecRows) {
              resJson.recipient.push(ddRecRows[idx][0]);
            }
          }
        }
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function notifyAlert(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = { requestorId: req.body.requestorId };
        let resArr = [];
        for (let i = 0; i < req.body.alerts.length; i++) {
          let ddAlert = await DDC.runAndReadAll(
            "SELECT id FROM alert WHERE id = '" +
              req.body.alerts[i].alertId +
              "'"
          );
          let ddRows = ddAlert.getRows();
          if (ddRows.length > 0) {
            let ddEP = await DDC.runAndReadAll(
              "SELECT id FROM adminEmail WHERE id = '" +
                req.body.alerts[i].emailProviderId +
                "'"
            );
            let ddEPRows = ddEP.getRows();
            if (ddEPRows.length > 0) {
              let alertNotifyId = uuidv4();
              let notificationId = uuidv4();
              let ddp = await DDC.prepare(
                "INSERT INTO alertNotify (id,alertId,requestorId,emailProviderId,subject,notificationId) VALUES ($1,$2,$3,$4,$5,$6)"
              );
              ddp.bindVarchar(1, alertNotifyId);
              ddp.bindVarchar(2, req.body.alerts[i].alertId);
              ddp.bindVarchar(3, req.body.requestorId);
              ddp.bindVarchar(4, req.body.alerts[i].emailProviderId);
              ddp.bindVarchar(5, req.body.alerts[i].subject);
              ddp.bindVarchar(6, notificationId);
              await ddp.run();
              for (let r = 0; r < req.body.alerts[i].recipients.length; r++) {
                let ddp = await DDC.prepare(
                  "INSERT INTO alertNotifyRecipient (alertNotifyId,notificationId,recipient) VALUES ($1,$2,$3)"
                );
                ddp.bindVarchar(1, alertNotifyId);
                ddp.bindVarchar(2, notificationId);
                ddp.bindVarchar(3, req.body.alerts[i].recipients[r]);
                await ddp.run();
              }
              resArr.push({
                alertId: req.body.alerts[i].alertId,
                notificationId: notificationId,
              });
            }
          }
        }
        resJson.alerts = resArr;
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function unpublishAlert(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let dde = await DDC.prepare(
          "SELECT id FROM alertPublish WHERE requestorId = $1"
        );
        dde.bindVarchar(1, req.query.requestorId);
        let ddAlert = await dde.runAndReadAll();
        let ddRows = ddAlert.getRows();
        if (ddRows.length > 0) {
          let publicationIds = req.query.publicationId
            .replace("(", "")
            .replace(")", "")
            .split(",");
          for (let idx in publicationIds) {
            let ddp = await DDC.prepare(
              "DELETE FROM alertPublish WHERE requestorId = $1 AND publicationId = $2"
            );
            ddp.bindVarchar(1, req.query.requestorId);
            ddp.bindVarchar(2, publicationIds[idx]);
            await ddp.run();
          }
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({ errors: "not found", requestorId: req.body.requestorId });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function publishAlert(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = { requestorId: req.body.requestorId };
        let resArr = [];
        for (let i = 0; i < req.body.alerts.length; i++) {
          let ddAlert = await DDC.runAndReadAll(
            "SELECT id FROM alert WHERE id = '" +
              req.body.alerts[i].alertId +
              "'"
          );
          let ddRows = ddAlert.getRows();
          if (ddRows.length > 0) {
            let ddEP = await DDC.runAndReadAll(
              "SELECT id FROM adminKafka WHERE id = '" +
                req.body.alerts[i].kafkaProducerId +
                "'"
            );
            let ddEPRows = ddEP.getRows();
            if (ddEPRows.length > 0) {
              let alertPublishId = uuidv4();
              let publicationId = uuidv4();
              let ddp = await DDC.prepare(
                "INSERT INTO alertPublish (id,alertId,requestorId,publicationId,kafkaId,topic) VALUES ($1,$2,$3,$4,$5,$6)"
              );
              ddp.bindVarchar(1, alertPublishId);
              ddp.bindVarchar(2, req.body.alerts[i].alertId);
              ddp.bindVarchar(3, req.body.requestorId);
              ddp.bindVarchar(4, publicationId);
              ddp.bindVarchar(5, req.body.alerts[i].kafkaProducerId);
              ddp.bindVarchar(6, req.body.alerts[i].topic);
              await ddp.run();
              resArr.push({
                alertId: req.body.alerts[i].alertId,
                publicationId: publicationId,
              });
            }
          }
        }
        resJson.alerts = resArr;
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function workflowAlertUnassign(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let dde = await DDC.prepare(
          "SELECT id FROM alertWorkflow WHERE requestorId = $1"
        );
        dde.bindVarchar(1, req.query.requestorId);
        let ddAlert = await dde.runAndReadAll();
        let ddRows = ddAlert.getRows();
        if (ddRows.length > 0) {
          let workflowRunnerIds = req.query.workflowRunnerId
            .replace("(", "")
            .replace(")", "")
            .split(",");
          for (let idx in workflowRunnerIds) {
            let ddp = await DDC.prepare(
              "DELETE FROM alertWorkflow WHERE requestorId = $1 AND workflowRunnerId = $2"
            );
            ddp.bindVarchar(1, req.query.requestorId);
            ddp.bindVarchar(2, workflowRunnerIds[idx]);
            await ddp.run();
          }
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "requestorId " + req.query.requestorId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function workflowAlertAssign(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = { requestorId: req.body.requestorId };
        let resArr = [];
        for (let i = 0; i < req.body.alerts.length; i++) {
          let ddAlert = await DDC.runAndReadAll(
            "SELECT id FROM alert WHERE id = '" +
              req.body.alerts[i].alertId +
              "'"
          );
          let ddRows = ddAlert.getRows();
          if (ddRows.length > 0) {
            let ddEP = await DDC.runAndReadAll(
              "SELECT id FROM adminWorkflow WHERE id = '" +
                req.body.alerts[i].workflowEngineId +
                "'"
            );
            let ddEPRows = ddEP.getRows();
            if (ddEPRows.length > 0) {
              let alertWorkflowId = uuidv4();
              let workflowRunnerId = uuidv4();
              let ddp = await DDC.prepare(
                "INSERT INTO alertWorkflow (id,alertId,requestorId,workflowEngineId,workflowRunnerId,flowName) VALUES ($1,$2,$3,$4,$5,$6)"
              );
              ddp.bindVarchar(1, alertWorkflowId);
              ddp.bindVarchar(2, req.body.alerts[i].alertId);
              ddp.bindVarchar(3, req.body.requestorId);
              ddp.bindVarchar(4, req.body.alerts[i].workflowEngineId);
              ddp.bindVarchar(5, workflowRunnerId);
              ddp.bindVarchar(6, req.body.alerts[i].flowName);
              await ddp.run();
              resArr.push({
                alertId: req.body.alerts[i].alertId,
                workflowRunnerId: workflowRunnerId,
              });
            }
          }
        }
        resJson.alerts = resArr;
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSingleAlert(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let ddp = await DDC.prepare("SELECT id FROM alert WHERE id = $1");
        ddp.bindVarchar(1, req.params.alertId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let ddSql = "SELECT description,delete FROM alert WHERE id = $1";
          let ddp = await DDC.prepare(ddSql);
          ddp.bindVarchar(1, req.params.alertId);
          let ddRead = await ddp.runAndReadAll();
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            resJson = {
              alertId: req.params.alertId,
              description: ddRows[0][0],
              delete: toBoolean(ddRows[0][1]),
            };
            res.contentType(OAS.mimeJSON).status(200).json(resJson);
          } else {
            res.sendStatus(204);
          }
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "alertId " + req.params.alertId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function deleteSingleAlert(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (await dbIdExists(req.params.alertId, "alert")) {
          await DDC.run(
            "DELETE FROM alert WHERE id = '" + req.params.alertId + "'"
          );
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "alertId " + req.params.alertId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateSingleAlert(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (await dbIdExists(req.params.alertId, "alert")) {
          let ddp = await DDC.prepare(
            "UPDATE alert SET description = $2 WHERE id = $1"
          );
          ddp.bindVarchar(1, req.params.alertId);
          ddp.bindVarchar(2, req.body.description);
          await ddp.run();
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "alertId " + req.params.alertId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllCables(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let resJson = [];
        let ddRead = await DDC.runAndReadAll(
          "SELECT id FROM cable WHERE delete = false"
        );
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            resJson.push(ddRows[idx][0]);
          }
          resJson.sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getCablesSimpleStatistics(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        res
          .contentType(OAS.mimeJSON)
          .status(200)
          .json(await dbActiveInactiveCounts("cable"));
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addSingleCable(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.body?.poleId != null) {
          if (!(await dbIdExists(req.body.poleId, "pole"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "poleId " + req.body.poleId + " does not exist",
              });
          }
        }
        if (req.body?.ductId != null) {
          if (!(await dbIdExists(req.body.ductId, "duct"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "ductId " + req.body.ductId + " does not exist",
              });
          }
        }

        let cableId = uuidv4();
        let tsId = await getSeqNextValue("seq_cable");
        let tsCol = "historicalTsId";
        switch (req.body.source) {
          case "historical":
            tsCol = "historicalTsId";
            break;
          case "predicted":
            tsCol = "predictedTsId";
            break;
          default:
            tsCol = "historicalTsId";
        }

        let ddq = await DDC.runAndReadAll(
          "SELECT id FROM cable WHERE id = '" + cableId + "'"
        );
        let ddqRows = ddq.getRows();
        if (ddqRows.length == 0) {
          let ddp = await DDC.prepare(
            "INSERT INTO cable (id,delete," +
              tsCol +
              ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
          );
          ddp.bindVarchar(1, cableId);
          ddp.bindBoolean(2, toBoolean(req.body.delete));
          ddp.bindInteger(3, tsId);
          ddp.bindVarchar(4, req.body.point);
          ddp.bindVarchar(5, pointFormat);
          await ddp.run();
        } else {
          let ddp = await DDC.prepare(
            "UPDATE cable SET " + tsCol + " = $1 WHERE id = $2"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, cableId);
          await ddp.run();
        }

        let configTsId = -1;
        let configTsCol = "";
        switch (req.body.technology) {
          case "coax":
            configTsId = await getSeqNextValue("seq_cableCoax");
            configTsCol = "coaxTsId";
            break;
          case "copper":
            configTsId = await getSeqNextValue("seq_cableCopper");
            configTsCol = "copperTsId";
            break;
          case "ethernet":
            configTsId = await getSeqNextValue("seq_cableEthernet");
            configTsCol = "ethernetTsId";
            break;
          case "singleFiber":
            configTsId = await getSeqNextValue("seq_cableSingleFiber");
            configTsCol = "singleFiberTsId";
            break;
          case "multiFiber":
            configTsId = await getSeqNextValue("seq_cableMultiFiber");
            configTsCol = "multiFiberTsId";
            break;
        }

        let ddp = await DDC.prepare(
          "INSERT INTO _cable (tsId,point,source,cableId,technology,state," +
            configTsCol +
            ") VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8)"
        );
        ddp.bindInteger(1, tsId);
        ddp.bindVarchar(2, req.body.point);
        ddp.bindVarchar(3, pointFormat);
        ddp.bindVarchar(4, req.body.source);
        ddp.bindVarchar(5, cableId);
        ddp.bindVarchar(6, req.body.technology);
        ddp.bindVarchar(7, req.body.state);
        ddp.bindInteger(8, configTsId);
        await ddp.run();

        if (req.body?.ductId != null) {
          await DDC.run(
            "UPDATE _cable SET ductId = '" +
              req.body.ductId +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body?.poleId != null) {
          await DDC.run(
            "UPDATE _cable SET poleId = '" +
              req.body.poleId +
              "' WHERE tsId = " +
              tsId
          );
        }
        switch (req.body.technology) {
          case "coax":
            let ddCoax = await DDC.prepare(
              "INSERT INTO _cableCoax (tsId,point,source,cableId,frequencyLow,frequencyHigh,channels,width,unit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10)"
            );
            ddCoax.bindInteger(1, configTsId);
            ddCoax.bindVarchar(2, req.body.point);
            ddCoax.bindVarchar(3, pointFormat);
            ddCoax.bindVarchar(4, req.body.source);
            ddCoax.bindVarchar(5, cableId);
            ddCoax.bindFloat(
              6,
              req.body.configuration.frequencyRange.frequencyLow
            );
            ddCoax.bindFloat(
              7,
              req.body.configuration.frequencyRange.frequencyHigh
            );
            ddCoax.bindInteger(8, req.body.configuration.channels);
            ddCoax.bindFloat(9, req.body.configuration.width);
            ddCoax.bindVarchar(10, req.body.configuration.unit);
            await ddCoax.run();
            break;
          case "copper":
            let ddCopper = await DDC.prepare(
              "INSERT INTO _cableCopper (tsId,point,source,cableId,twistedPairs) VALUES ($1,strptime($2,$3),$4,$5,$6)"
            );
            ddCopper.bindInteger(1, configTsId);
            ddCopper.bindVarchar(2, req.body.point);
            ddCopper.bindVarchar(3, pointFormat);
            ddCopper.bindVarchar(4, req.body.source);
            ddCopper.bindVarchar(5, cableId);
            ddCopper.bindInteger(6, req.body.configuration.twistedPairs);
            await ddCopper.run();
            break;
          case "ethernet":
            let ddEthernet = await DDC.prepare(
              "INSERT INTO _cableEthernet (tsId,point,source,cableId,category,rate,unit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8)"
            );
            ddEthernet.bindInteger(1, configTsId);
            ddEthernet.bindVarchar(2, req.body.point);
            ddEthernet.bindVarchar(3, pointFormat);
            ddEthernet.bindVarchar(4, req.body.source);
            ddEthernet.bindVarchar(5, cableId);
            ddEthernet.bindVarchar(6, req.body.configuration.category);
            ddEthernet.bindInteger(7, req.body.configuration.rate);
            ddEthernet.bindVarchar(8, req.body.configuration.unit);
            await ddEthernet.run();
            break;
          case "singleFiber":
            let ddSingleFiber = await DDC.prepare(
              "INSERT INTO _cableSingleFiber (tsId,point,source,cableId,strands,mode,channels,width,unit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9)"
            );
            ddSingleFiber.bindInteger(1, configTsId);
            ddSingleFiber.bindVarchar(2, req.body.point);
            ddSingleFiber.bindVarchar(3, pointFormat);
            ddSingleFiber.bindVarchar(4, req.body.source);
            ddSingleFiber.bindVarchar(5, cableId);
            ddSingleFiber.bindInteger(6, req.body.configuration.strands);
            ddSingleFiber.bindVarchar(7, req.body.configuration.mode);
            ddSingleFiber.bindInteger(8, req.body.configuration.channels);
            ddSingleFiber.bindInteger(9, req.body.configuration.width);
            await ddSingleFiber.run();
            break;
          case "multiFiber":
            let ddMultiFiber = await DDC.prepare(
              "INSERT INTO _cableMultiFiber (tsId,point,source,cableId,ribbons,strands,mode,channels,width,unit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10)"
            );
            ddMultiFiber.bindInteger(1, configTsId);
            ddMultiFiber.bindVarchar(2, req.body.point);
            ddMultiFiber.bindVarchar(3, pointFormat);
            ddMultiFiber.bindVarchar(4, req.body.source);
            ddMultiFiber.bindVarchar(5, cableId);
            ddMultiFiber.bindInteger(6, req.body.configuration.ribbons);
            ddMultiFiber.bindInteger(7, req.body.configuration.strands);
            ddMultiFiber.bindVarchar(8, req.body.configuration.mode);
            ddMultiFiber.bindInteger(9, req.body.configuration.channels);
            ddMultiFiber.bindInteger(10, req.body.configuration.width);
            await ddMultiFiber.run();
            break;
        }
        res.contentType(OAS.mimeJSON).status(200).json({ cableId: cableId });
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getCablesCapacityState(req, res, next) {
    //TODO:
  }

  async function deleteSingleCable(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        // recover (restore) previously deleted if still exists
        if (req.query?.restore != null) {
          let point = dayjs().format(dayjsFormat);
          let ddRead = await DDC.runAndReadAll(
            "SELECT cable.id FROM cable,_cable WHERE cable.id = '" +
              req.params.cableId +
              "' AND _cable.cableId = cable.id AND _cable.source = 'historical' AND cable.delete = true LIMIT 1"
          );
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            await DDC.run(
              "UPDATE cable SET tsPoint = strptime('" +
                point +
                "','" +
                pointFormat +
                "'), delete = false WHERE id = '" +
                req.params.cableId +
                "'"
            );
            await dbAddPredictQueueItem(
              "cable",
              req.params.cableId,
              "undelete"
            );
            res.sendStatus(204);
          } else {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "cableId " + req.params.cableId + " does not exist",
              });
          }
        } else {
          let ddp = await DDC.prepare(
            "SELECT id,technology,coaxTsId,copperTsId,ethernetTsId,singleFiberTsId,multiFiberTsId,historicalTsId,predictedTsId,source,state,ductId,poleId FROM cable,_cable WHERE cable.id = $1 AND _cable.cableId = cable.id AND cable.delete = false"
          );
          ddp.bindVarchar(1, req.params.cableId);
          let ddRead = await ddp.runAndReadAll();
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            let configTsId = -1;
            let configTsCol = "";
            let tsId = await getSeqNextValue("seq_cable");
            let tsCol = "historicalTsId";
            let cableId = ddRows[0][0];
            let technology = ddRows[0][1];
            let coaxTsId = ddRows[0][2];
            let copperTsId = ddRows[0][3];
            let ethernetTsId = ddRows[0][4];
            let singleFiberTsId = ddRows[0][5];
            let multiFiberTsId = ddRows[0][6];
            let historicalTsId = ddRows[0][7];
            let predictedTsId = ddRows[0][8];
            let source = ddRows[0][9];
            let state = ddRows[0][10];
            let ductId = ddRows[0][11];
            let poleId = ddRows[0][12];
            let point = dayjs().format(dayjsFormat);

            if (req.query?.predicted != null) {
              switch (technology) {
                case "coax":
                  await DDC.run(
                    "DELETE FROM _cableCoax WHERE cableId = '" +
                      req.params.cableId +
                      "' and source = 'predicted'"
                  );
                  break;
                case "copper":
                  await DDC.run(
                    "DELETE FROM _cableCopper WHERE cableId = '" +
                      req.params.cableId +
                      "' and source = 'predicted'"
                  );
                  break;
                case "ethernet":
                  await DDC.run(
                    "DELETE FROM _cableEthernet WHERE cableId = '" +
                      req.params.cableId +
                      "' and source = 'predicted'"
                  );
                  break;
                case "singleFiber":
                  await DDC.run(
                    "DELETE FROM _cableSingleFiber WHERE cableId = '" +
                      req.params.cableId +
                      "' and source = 'predicted'"
                  );
                  break;
                case "multiFiber":
                  await DDC.run(
                    "DELETE FROM _cableMultiFiber WHERE cableId = '" +
                      req.params.cableId +
                      "' and source = 'predicted'"
                  );
                  break;
              }
              await DDC.run(
                "DELETE FROM _cable WHERE cableId = '" +
                  req.params.cableId +
                  "' and source = 'predicted'"
              );
              await DDC.run(
                "UPDATE cable SET predictedTsId = NULL WHERE id = '" +
                  req.params.cableId +
                  "'"
              );
              res.sendStatus(204);
            } else {
              switch (technology) {
                case "coax":
                  configTsId = await getSeqNextValue("seq_cableCoax");
                  configTsCol = "coaxTsId";
                  break;
                case "copper":
                  configTsId = await getSeqNextValue("seq_cableCopper");
                  configTsCol = "copperTsId";
                  break;
                case "ethernet":
                  configTsId = await getSeqNextValue("seq_cableEthernet");
                  configTsCol = "ethernetTsId";
                  break;
                case "singleFiber":
                  configTsId = await getSeqNextValue("seq_cableSingleFiber");
                  configTsCol = "singleFiberTsId";
                  break;
                case "multiFiber":
                  configTsId = await getSeqNextValue("seq_cableMultiFiber");
                  configTsCol = "multiFiberTsId";
                  break;
              }
              switch (source) {
                case "historical":
                  tsCol = "historicalTsId";
                  break;
                case "predicted":
                  tsCol = "predictedTsId";
                  break;
              }

              switch (technology) {
                case "coax":
                  ddp = await DDC.prepare(
                    "INSERT INTO _cableCoax (tsId,point,source,cableId,frequencyLow,frequencyHigh,channels,width,unit) SELECT $1,strptime($2,$3),source,cableId,frequencyLow,frequencyHigh,channels,width,unit FROM _cableCoax WHERE tsId = $4"
                  );
                  ddp.bindInteger(1, configTsId);
                  ddp.bindVarchar(2, point);
                  ddp.bindVarchar(3, pointFormat);
                  ddp.bindInteger(4, coaxTsId);
                  await ddp.run();
                  break;
                case "copper":
                  ddp = await DDC.prepare(
                    "INSERT INTO _cableCopper (tsId,point,source,cableId,twistedPairs) SELECT $1,strptime($2,$3),source,cableId,twistedPairs FROM _cableCopper WHERE tsId = $4"
                  );
                  ddp.bindInteger(1, configTsId);
                  ddp.bindVarchar(2, point);
                  ddp.bindVarchar(3, pointFormat);
                  ddp.bindInteger(4, copperTsId);
                  await ddp.run();
                  break;
                case "ethernet":
                  ddp = await DDC.prepare(
                    "INSERT INTO _cableEthernet (tsId,point,source,cableId,category,rate,unit) SELECT $1,strptime($2,$3),source,cableId,category,rate,unit FROM _cableEthernet WHERE tsId = $4"
                  );
                  ddp.bindInteger(1, configTsId);
                  ddp.bindVarchar(2, point);
                  ddp.bindVarchar(3, pointFormat);
                  ddp.bindInteger(4, ethernetTsId);
                  await ddp.run();
                  break;
                case "singleFiber":
                  ddp = await DDC.prepare(
                    "INSERT INTO _cableSingleFiber (tsId,point,source,cableId,strands,mode,channels,width,unit) SELECT $1,strptime($2,$3),source,cableId,strands,mode,channels,width,unit FROM _cableSingleFiber WHERE tsId = $4"
                  );
                  ddp.bindInteger(1, configTsId);
                  ddp.bindVarchar(2, point);
                  ddp.bindVarchar(3, pointFormat);
                  ddp.bindInteger(4, singleFiberTsId);
                  await ddp.run();
                  break;
                case "multiFiber":
                  ddp = await DDC.prepare(
                    "INSERT INTO _cableMultiFiber (tsId,point,source,cableId,ribbons,strands,mode,channels,width,unit) SELECT $1,strptime($2,$3),source,cableId,ribbons,strands,mode,channels,width,unit FROM _cableMultiFiber WHERE tsId = $4"
                  );
                  ddp.bindInteger(1, configTsId);
                  ddp.bindVarchar(2, point);
                  ddp.bindVarchar(3, pointFormat);
                  ddp.bindInteger(4, multiFiberTsId);
                  await ddp.run();
                  break;
              }
              ddp = await DDC.prepare(
                "INSERT INTO _cable (tsId,point,source,cableId,ductId,poleId,technology,state," +
                  configTsCol +
                  ") SELECT $1,strptime($2,$3),source,cableId,ductId,poleId,technology,state,$4 FROM _cable WHERE tsId = $5"
              );
              ddp.bindInteger(1, tsId);
              ddp.bindVarchar(2, point);
              ddp.bindVarchar(3, pointFormat);
              ddp.bindInteger(4, configTsId);
              ddp.bindInteger(5, historicalTsId);
              await ddp.run();

              await DDC.run(
                "UPDATE cable SET " +
                  tsCol +
                  " = " +
                  tsId +
                  ", tsPoint = strptime('" +
                  point +
                  "','" +
                  pointFormat +
                  "'), delete = true WHERE id = '" +
                  cableId +
                  "'"
              );
              await dbAddPredictQueueItem(
                "cable",
                req.params.cableId,
                "delete"
              );
              res.sendStatus(204);
            }
          } else {
            res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "cableId " + req.params.cableId + " does not exist",
              });
          }
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getPredictedTimelineById(table) {
    let resJson = [];
    let ddRead = await DDC.runAndReadAll(
      "SELECT " +
        table +
        ".id FROM " +
        table +
        ", _" +
        table +
        " WHERE _" +
        table +
        "." +
        table +
        "Id = " +
        table +
        ".id AND source = 'predicted' AND " +
        table +
        ".delete = false"
    );
    let ddRows = ddRead.getRows();
    if (ddRows.length > 0) {
      for (let idx in ddRows) {
        let resId = null;
        switch (table) {
          case "cable":
            resId = { cableId: ddRows[idx][0], point: [] };
            break;
          case "duct":
            resId = { ductId: ddRows[idx][0], point: [] };
            break;
          case "ne":
            resId = { neId: ddRows[idx][0], point: [] };
            break;
          case "pole":
            resId = { poleId: ddRows[idx][0], point: [] };
            break;
          case "rack":
            resId = { rackId: ddRows[idx][0], point: [] };
            break;
          case "service":
            resId = { serviceId: ddRows[idx][0], point: [] };
            break;
          case "site":
            resId = { siteId: ddRows[idx][0], point: [] };
            break;
          case "trench":
            resId = { trenchId: ddRows[idx][0], point: [] };
            break;
        }
        let ddPoint = await DDC.runAndReadAll(
          "SELECT strftime(point,'" +
            pointFormat +
            "') FROM " +
            table +
            ", _" +
            table +
            " WHERE " +
            table +
            ".id = '" +
            ddRows[idx][0] +
            "' AND _" +
            table +
            "." +
            table +
            "Id = id AND source = 'predicted' AND delete = false ORDER BY _" +
            table +
            ".point DESC"
        );
        let ddPointRows = ddPoint.getRows();
        if (ddPointRows.length > 0) {
          for (let pdx in ddPointRows) {
            resId.point.push(ddPointRows[pdx][0]);
          }
          resId.point = Array.from(new Set(resId.point.map(JSON.stringify)))
            .map(JSON.parse)
            .sort();
        }
        resJson.push(resId);
      }
    }
    return resJson;
  }

  async function getAllPredictedTimeline(req, res, next) {
    try {
      let resJson = {
        cable: await getPredictedTimelineById("cable"),
        duct: await getPredictedTimelineById("duct"),
        ne: await getPredictedTimelineById("ne"),
        pole: await getPredictedTimelineById("pole"),
        rack: await getPredictedTimelineById("rack"),
        service: await getPredictedTimelineById("service"),
        site: await getPredictedTimelineById("site"),
        trench: await getPredictedTimelineById("trench"),
      };
      res.contentType(OAS.mimeJSON).status(200).json(resJson);
    } catch (e) {
      return next(e);
    }
  }

  async function getHistoricalTimelineById(table) {
    let resJson = [];
    let ddRead = await DDC.runAndReadAll(
      "SELECT " +
        table +
        ".id FROM " +
        table +
        ", _" +
        table +
        " WHERE _" +
        table +
        "." +
        table +
        "Id = " +
        table +
        ".id AND source = 'historical' AND " +
        table +
        ".delete = false"
    );
    let ddRows = ddRead.getRows();
    if (ddRows.length > 0) {
      for (let idx in ddRows) {
        let resId = null;
        switch (table) {
          case "cable":
            resId = { cableId: ddRows[idx][0], point: [] };
            break;
          case "duct":
            resId = { ductId: ddRows[idx][0], point: [] };
            break;
          case "ne":
            resId = { neId: ddRows[idx][0], point: [] };
            break;
          case "pole":
            resId = { poleId: ddRows[idx][0], point: [] };
            break;
          case "rack":
            resId = { rackId: ddRows[idx][0], point: [] };
            break;
          case "service":
            resId = { serviceId: ddRows[idx][0], point: [] };
            break;
          case "site":
            resId = { siteId: ddRows[idx][0], point: [] };
            break;
          case "trench":
            resId = { trenchId: ddRows[idx][0], point: [] };
            break;
        }
        let ddPoint = await DDC.runAndReadAll(
          "SELECT strftime(point,'" +
            pointFormat +
            "') FROM " +
            table +
            ", _" +
            table +
            " WHERE " +
            table +
            ".id = '" +
            ddRows[idx][0] +
            "' AND _" +
            table +
            "." +
            table +
            "Id = id AND source = 'historical' AND delete = false ORDER BY _" +
            table +
            ".point DESC"
        );
        let ddPointRows = ddPoint.getRows();
        if (ddPointRows.length > 0) {
          for (let pdx in ddPointRows) {
            resId.point.push(ddPointRows[pdx][0]);
          }
          resId.point = Array.from(new Set(resId.point.map(JSON.stringify)))
            .map(JSON.parse)
            .sort();
        }
        resJson.push(resId);
      }
    }
    return resJson;
  }

  async function getAllHistoricalTimeline(req, res, next) {
    try {
      let resJson = {
        cable: await getHistoricalTimelineById("cable"),
        duct: await getHistoricalTimelineById("duct"),
        ne: await getHistoricalTimelineById("ne"),
        pole: await getHistoricalTimelineById("pole"),
        rack: await getHistoricalTimelineById("rack"),
        service: await getHistoricalTimelineById("service"),
        site: await getHistoricalTimelineById("site"),
        trench: await getHistoricalTimelineById("trench"),
      };
      res.contentType(OAS.mimeJSON).status(200).json(resJson);
    } catch (e) {
      return next(e);
    }
  }

  async function getNextPredictQueueItem(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let ddRead = await DDC.runAndReadAll(
          "SELECT qId,strftime(point,'" +
            pointFormat +
            "'),resource,id,state FROM predictQueue WHERE delete = false ORDER BY random() LIMIT 1"
        );
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          resJson = {
            qId: toInteger(ddRows[0][0]),
            point: ddRows[0][1],
            resource: ddRows[0][2],
            id: ddRows[0][3],
            state: ddRows[0][4],
          };
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else if (ddRows.length == 0) {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function deletePredictQueueItem(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddRead = await DDC.runAndReadAll(
          "SELECT id FROM predictQueue WHERE qId = " + req.params.qId
        );
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let point = dayjs().format(dayjsFormat);
          await DDC.run(
            "UPDATE predictQueue SET point = strptime('" +
              point +
              "','" +
              pointFormat +
              "'), delete = true WHERE qId = " +
              req.params.qId
          );
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "qId " + req.params.qId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getNextAlertQueueItem(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let ddRead = await DDC.runAndReadAll(
          "SELECT qId,strftime(point,'" +
            pointFormat +
            "'),alertType,alertId,callbackAlertId,publishAlertId,notifyAlertId,workflowAlertId FROM alertQueue WHERE delete = false ORDER BY random() LIMIT 1"
        );
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          resJson = {
            qId: toInteger(ddRows[0][0]),
            point: ddRows[0][1],
            type: ddRows[0][2],
            id: ddRows[0][3],
            callback: ddRows[0][4],
            publish: ddRows[0][5],
            notify: ddRows[0][6],
            workflow: ddRows[0][7],
          };
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else if (ddRows.length == 0) {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function deleteAlertQueueItem(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddRead = await DDC.runAndReadAll(
          "SELECT rowid FROM alertQueue WHERE qId = " + req.params.qId
        );
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let point = dayjs().format(dayjsFormat);
          await DDC.run(
            "UPDATE alertQueue SET point = strptime('" +
              point +
              "','" +
              pointFormat +
              "'), delete = true WHERE qId = " +
              req.params.qId
          );
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "qId " + req.params.qId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getCableTimeline(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddp = await DDC.prepare(
          "SELECT strftime(point,'" +
            pointFormat +
            "'),source FROM cable, _cable WHERE id = $1 AND cableId = id AND delete = false ORDER BY point DESC"
        );
        ddp.bindVarchar(1, req.params.cableId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let resJson = [];
          for (let idx in ddRows) {
            resJson.push({ point: ddRows[idx][0], source: ddRows[idx][1] });
          }
          resJson = Array.from(new Set(resJson.map(JSON.stringify)))
            .map(JSON.parse)
            .sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "cableId " + req.params.cableId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSingleCable(req, res, next) {
    let datePoint = "AND _cable.tsId = cable.historicalTsId";
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.query?.point != null) {
          datePoint =
            "AND strftime(_cable.point,'" +
            pointFormat +
            "') = '" +
            req.query.point +
            "'";
        }
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT cable.id,_cable.technology,_cable.state,cable.delete,_cable.ductId,_cable.poleId,_cable.tsId,_cable.coaxTsId,_cable.copperTsId,_cable.ethernetTsId,_cable.singleFiberTsId,_cable.multiFiberTsId,strftime(_cable.point,'" +
            pointFormat +
            "'),source FROM cable, _cable WHERE cable.id = $1 AND _cable.cableId = cable.id AND cable.delete = false " +
            datePoint +
            " ORDER BY _cable.point DESC LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.cableId);
        let ddCable = await ddp.runAndReadAll();
        let ddCableRows = ddCable.getRows();
        if (ddCableRows.length > 0) {
          resJson = {
            cableId: ddCableRows[0][0],
            point: ddCableRows[0][13],
            technology: ddCableRows[0][1],
            state: ddCableRows[0][2],
            source: ddCableRows[0][14],
            delete: toBoolean(ddCableRows[0][3]),
            configuration: {},
          };
          if (ddCableRows[0][4] != null) {
            resJson.ductId = ddCableRows[0][4];
          } else if (ddCableRows[0][5] != null) {
            resJson.poleId = ddCableRows[0][5];
          }

          switch (ddCableRows[0][1]) {
            case "coax":
              let ddCoax = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,frequencyLow,frequencyHigh,channels,width,unit FROM _cableCoax WHERE tsId = " +
                  ddCableRows[0][7]
              );
              let ddCoaxRows = ddCoax.getRows();
              if (ddCoaxRows.length > 0) {
                resJson.point = ddCoaxRows[0][0];
                resJson.source = ddCoaxRows[0][1];
                resJson.configuration = {
                  frequencyRange: {
                    low: toDecimal(ddCoaxRows[0][2]),
                    high: toDecimal(ddCoaxRows[0][3]),
                  },
                  channels: toInteger(ddCoaxRows[0][4]),
                  width: toDecimal(ddCoaxRows[0][5]),
                  unit: ddCoaxRows[0][6],
                };
              }
              break;
            case "copper":
              let ddCopper = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,twistedPairs FROM _cableCopper WHERE tsId = " +
                  ddCableRows[0][8]
              );
              let ddCopperRows = ddCopper.getRows();
              if (ddCopperRows.length > 0) {
                resJson.point = ddCopperRows[0][0];
                resJson.source = ddCopperRows[0][1];
                resJson.configuration = {
                  twistedPairs: toInteger(ddCopperRows[0][2]),
                };
              }
              break;
            case "ethernet":
              let ddEthernet = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,category,rate,unit FROM _cableEthernet WHERE tsId = " +
                  ddCableRows[0][9]
              );
              let ddEthernetRows = ddEthernet.getRows();
              if (ddEthernetRows.length > 0) {
                resJson.point = ddEthernetRows[0][0];
                resJson.source = ddEthernetRows[0][1];
                resJson.configuration = {
                  category: ddEthernetRows[0][2],
                  rate: toInteger(ddEthernetRows[0][3]),
                  unit: ddEthernetRows[0][4],
                };
              }
              break;
            case "singleFiber":
              let ddSingleFiber = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,strands,mode,channels,width FROM _cableSingleFiber WHERE tsId = " +
                  ddCableRows[0][10]
              );
              let ddSingleFiberRows = ddSingleFiber.getRows();
              if (ddSingleFiberRows.length > 0) {
                resJson.point = ddSingleFiberRows[0][0];
                resJson.source = ddSingleFiberRows[0][1];
                resJson.configuration = {
                  strands: toInteger(ddSingleFiberRows[0][2]),
                  mode: ddSingleFiberRows[0][3],
                  channels: toInteger(ddSingleFiberRows[0][4]),
                  width: toInteger(ddSingleFiberRows[0][5]),
                };
              }
              break;
            case "multiFiber":
              let ddMultiFiber = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,ribbons,strands,mode,channels,width FROM _cableMultiFiber WHERE tsId = " +
                  ddCableRows[0][10]
              );
              let ddMultiFiberRows = ddMultiFiber.getRows();
              if (ddMultiFiberRows.length > 0) {
                resJson.point = ddMultiFiberRows[0][0];
                resJson.source = ddMultiFiberRows[0][1];
                resJson.configuration = {
                  ribbons: toInteger(ddMultiFiberRows[0][2]),
                  strands: toInteger(ddMultiFiberRows[0][3]),
                  mode: ddMultiFiberRows[0][4],
                  channels: toInteger(ddMultiFiberRows[0][5]),
                  width: toInteger(ddMultiFiberRows[0][6]),
                };
              }
              break;
          }
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "cableId " + req.params.cableId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateSingleCable(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT cable.id,_cable.technology,_cable.state,cable.delete,_cable.ductId,_cable.poleId,_cable.tsId,_cable.coaxTsId,_cable.copperTsId,_cable.ethernetTsId,_cable.singleFiberTsId,_cable.multiFiberTsId,strftime(_cable.point,'" +
            pointFormat +
            "'),delete,source FROM cable, _cable WHERE cable.id = $1 AND _cable.cableId = cable.id AND _cable.tsId = cable.historicalTsId LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.cableId);
        let ddCable = await ddp.runAndReadAll();
        let ddCableRows = ddCable.getRows();
        if (ddCableRows.length > 0) {
          if (req.body?.poleId != null) {
            if (!(await dbIdExists(req.body.poleId, "pole"))) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors: "poleId " + req.body.poleId + " does not exist",
                });
            }
          }
          if (req.body?.ductId != null) {
            if (!(await dbIdExists(req.body.ductId, "duct"))) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors: "ductId " + req.body.ductId + " does not exist",
                });
            }
          }
          resJson = {
            cableId: ddCableRows[0][0],
            point: ddCableRows[0][13],
            delete: ddCableRows[0][14],
            source: ddCableRows[0][15],
            technology: ddCableRows[0][1],
            state: ddCableRows[0][2],
            delete: ddCableRows[0][3],
            configuration: {},
          };
          if (ddCableRows[0][4] != null) {
            resJson.ductId = ddCableRows[0][4];
          } else if (ddCableRows[0][5] != null) {
            resJson.poleId = ddCableRows[0][5];
          }
          switch (ddCableRows[0][1]) {
            case "coax":
              let ddCoax = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,frequencyLow,frequencyHigh,channels,width,unit FROM _cableCoax WHERE tsId = " +
                  ddCableRows[0][7]
              );
              let ddCoaxRows = ddCoax.getRows();
              if (ddCoaxRows.length > 0) {
                resJson.point = ddCoaxRows[0][0];
                resJson.source = ddCoaxRows[0][1];
                resJson.configuration = {
                  frequencyRange: {
                    low: ddCoaxRows[0][2],
                    high: ddCoaxRows[0][3],
                  },
                  channels: ddCoaxRows[0][4],
                  width: ddCoaxRows[0][5],
                  unit: ddCoaxRows[0][6],
                };
              }
              break;
            case "copper":
              let ddCopper = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,twistedPairs FROM _cableCopper WHERE tsId = " +
                  ddCableRows[0][8]
              );
              let ddCopperRows = ddCopper.getRows();
              if (ddCopperRows.length > 0) {
                resJson.point = ddCopperRows[0][0];
                resJson.source = ddCopperRows[0][1];
                resJson.configuration = {
                  twistedPairs: ddCopperRows[0][2],
                };
              }
              break;
            case "ethernet":
              let ddEthernet = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,category,rate,unit FROM _cableEthernet WHERE tsId = " +
                  ddCableRows[0][9]
              );
              let ddEthernetRows = ddEthernet.getRows();
              if (ddEthernetRows.length > 0) {
                resJson.point = ddEthernetRows[0][0];
                resJson.source = ddEthernetRows[0][1];
                resJson.configuration = {
                  category: ddEthernetRows[0][2],
                  rate: ddEthernetRows[0][3],
                  unit: ddEthernetRows[0][4],
                };
              }
              break;
            case "singleFiber":
              let ddSingleFiber = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,strands,mode,channels,width FROM _cableSingleFiber WHERE tsId = " +
                  ddCableRows[0][10]
              );
              let ddSingleFiberRows = ddSingleFiber.getRows();
              if (ddSingleFiberRows.length > 0) {
                resJson.point = ddSingleFiberRows[0][0];
                resJson.source = ddSingleFiberRows[0][1];
                resJson.configuration = {
                  strands: ddSingleFiberRows[0][2],
                  mode: ddSingleFiberRows[0][3],
                  channels: ddSingleFiberRows[0][4],
                  width: ddSingleFiberRows[0][5],
                };
              }
              break;
            case "multiFiber":
              let ddMultiFiber = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,ribbons,strands,mode,channels,width FROM _cableMultiFiber WHERE tsId = " +
                  ddCableRows[0][10]
              );
              let ddMultiFiberRows = ddMultiFiber.getRows();
              if (ddMultiFiberRows.length > 0) {
                resJson.point = ddMultiFiberRows[0][0];
                resJson.source = ddMultiFiberRows[0][1];
                resJson.configuration = {
                  ribbons: ddMultiFiberRows[0][2],
                  strands: ddMultiFiberRows[0][3],
                  mode: ddMultiFiberRows[0][4],
                  channels: ddMultiFiberRows[0][5],
                  width: ddMultiFiberRows[0][6],
                };
              }
              break;
          }
          // pass to replace to regenerate the record
          req.body = jsonDeepMerge(resJson, req.body);
          return next();
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "cableId " + req.params.cableId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function replaceSingleCable(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddp = await DDC.prepare(
          "SELECT cable.id,_cable.technology,_cable.state,cable.delete,_cable.ductId,_cable.poleId,_cable.tsId,_cable.coaxTsId,_cable.copperTsId,_cable.ethernetTsId,_cable.singleFiberTsId,_cable.multiFiberTsId FROM cable, _cable WHERE cable.id = $1 AND _cable.cableId = cable.id AND _cable.tsId = cable.historicalTsId LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.cableId);
        let ddCable = await ddp.runAndReadAll();
        let ddCableRows = ddCable.getRows();
        if (ddCableRows.length > 0) {
          if (req.body?.poleId != null) {
            if (!(await dbIdExists(req.body.poleId, "pole"))) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors: "poleId " + req.body.poleId + " does not exist",
                });
            }
          }
          if (req.body?.ductId != null) {
            if (!(await dbIdExists(req.body.ductId, "duct"))) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors: "ductId " + req.body.ductId + " does not exist",
                });
            }
          }
          let point = dayjs().format(dayjsFormat);
          let tsId = await getSeqNextValue("seq_cable");
          let tsCol = "historicalTsId";
          switch (req.body.source) {
            case "historical":
              tsCol = "historicalTsId";
              break;
            case "predicted":
              tsCol = "predictedTsId";
              break;
          }
          let ddp = await DDC.prepare(
            "UPDATE cable SET " +
              tsCol +
              " = $1, tsPoint = strptime($2,$3) WHERE id = $4"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body.point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.params.cableId);
          await ddp.run();
          let configTsId = -1;
          let configTsCol = "";
          switch (req.body.technology) {
            case "coax":
              configTsId = await getSeqNextValue("seq_cableCoax");
              configTsCol = "coaxTsId";
              break;
            case "copper":
              configTsId = await getSeqNextValue("seq_cableCopper");
              configTsCol = "copperTsId";
              break;
            case "ethernet":
              configTsId = await getSeqNextValue("seq_cableEthernet");
              configTsCol = "ethernetTsId";
              break;
            case "singleFiber":
              configTsId = await getSeqNextValue("seq_cableSingleFiber");
              configTsCol = "singleFiberTsId";
              break;
            case "multiFiber":
              configTsId = await getSeqNextValue("seq_cableMultiFiber");
              configTsCol = "multiFiberTsId";
              break;
          }

          ddp = await DDC.prepare(
            "INSERT INTO _cable (tsId,point,source,cableId,technology,state," +
              configTsCol +
              ") VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8)"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body.point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.body.source);
          ddp.bindVarchar(5, req.params.cableId);
          ddp.bindVarchar(6, req.body.technology);
          ddp.bindVarchar(7, req.body.state);
          ddp.bindInteger(8, configTsId);
          await ddp.run();

          if (req.body?.ductId != null) {
            await DDC.run(
              "UPDATE _cable SET ductId = '" +
                req.body.ductId +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body?.poleId != null) {
            await DDC.run(
              "UPDATE _cable SET poleId = '" +
                req.body.poleId +
                "' WHERE tsId = " +
                tsId
            );
          }
          switch (req.body.technology) {
            case "coax":
              let ddCoax = await DDC.prepare(
                "INSERT INTO _cableCoax (tsId,point,source,cableId,frequencyLow,frequencyHigh,channels,width,unit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10)"
              );
              ddCoax.bindInteger(1, configTsId);
              ddCoax.bindVarchar(2, req.body.point);
              ddCoax.bindVarchar(3, pointFormat);
              ddCoax.bindVarchar(4, req.body.source);
              ddCoax.bindVarchar(5, req.params.cableId);
              ddCoax.bindFloat(
                6,
                req.body.configuration.frequencyRange.frequencyLow
              );
              ddCoax.bindFloat(
                7,
                req.body.configuration.frequencyRange.frequencyHigh
              );
              ddCoax.bindInteger(8, req.body.configuration.channels);
              ddCoax.bindFloat(9, req.body.configuration.width);
              ddCoax.bindVarchar(10, req.body.configuration.unit);
              await ddCoax.run();
              break;
            case "copper":
              let ddCopper = await DDC.prepare(
                "INSERT INTO _cableCopper (tsId,point,source,cableId,twistedPairs) VALUES ($1,strptime($2,$3),$4,$5,$6)"
              );
              ddCopper.bindInteger(1, configTsId);
              ddCopper.bindVarchar(2, req.body.point);
              ddCopper.bindVarchar(3, pointFormat);
              ddCopper.bindVarchar(4, req.body.source);
              ddCopper.bindVarchar(5, req.params.cableId);
              ddCopper.bindInteger(6, req.body.configuration.twistedPairs);
              await ddCopper.run();
              break;
            case "ethernet":
              let ddEthernet = await DDC.prepare(
                "INSERT INTO _cableEthernet (tsId,point,source,cableId,category,rate,unit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8)"
              );
              ddEthernet.bindInteger(1, configTsId);
              ddEthernet.bindVarchar(2, req.body.point);
              ddEthernet.bindVarchar(3, pointFormat);
              ddEthernet.bindVarchar(4, req.body.source);
              ddEthernet.bindVarchar(5, req.params.cableId);
              ddEthernet.bindVarchar(6, req.body.configuration.category);
              ddEthernet.bindInteger(7, req.body.configuration.rate);
              ddEthernet.bindVarchar(8, req.body.configuration.unit);
              await ddEthernet.run();
              break;
            case "singleFiber":
              let ddSingleFiber = await DDC.prepare(
                "INSERT INTO _cableSingleFiber (tsId,point,source,cableId,strands,mode,channels,width,unit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9)"
              );
              ddSingleFiber.bindInteger(1, configTsId);
              ddSingleFiber.bindVarchar(2, req.body.point);
              ddSingleFiber.bindVarchar(3, pointFormat);
              ddSingleFiber.bindVarchar(4, req.body.source);
              ddSingleFiber.bindVarchar(5, req.params.cableId);
              ddSingleFiber.bindInteger(6, req.body.configuration.strands);
              ddSingleFiber.bindVarchar(7, req.body.configuration.mode);
              ddSingleFiber.bindInteger(8, req.body.configuration.channels);
              ddSingleFiber.bindInteger(9, req.body.configuration.width);
              await ddSingleFiber.run();
              break;
            case "multiFiber":
              let ddMultiFiber = await DDC.prepare(
                "INSERT INTO _cableMultiFiber (tsId,point,source,cableId,ribbons,strands,mode,channels,width,unit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10)"
              );
              ddMultiFiber.bindInteger(1, configTsId);
              ddMultiFiber.bindVarchar(2, req.body.point);
              ddMultiFiber.bindVarchar(3, pointFormat);
              ddMultiFiber.bindVarchar(4, req.body.source);
              ddMultiFiber.bindVarchar(5, req.params.cableId);
              ddMultiFiber.bindInteger(6, req.body.configuration.ribbons);
              ddMultiFiber.bindInteger(7, req.body.configuration.strands);
              ddMultiFiber.bindVarchar(8, req.body.configuration.mode);
              ddMultiFiber.bindInteger(9, req.body.configuration.channels);
              ddMultiFiber.bindInteger(10, req.body.configuration.width);
              await ddMultiFiber.run();
              break;
          }
          if (req.body.source == "historical") {
            await dbAddPredictQueueItem("cable", req.params.cableId, "update");
          }
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "cableId " + req.params.cableId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateSingleCableCoaxState(req, res, next) {
    // TODO
    res.sendStatus(405);
  }

  async function updateSingleCableRibbonStrandState(req, res, next) {
    // TODO
    res.sendStatus(405);
  }

  async function updateSingleCableStrandState(req, res, next) {
    // TODO
    res.sendStatus(405);
  }

  async function getMultipleCables(req, res, next) {
    try {
      let resJson = [];
      let ddCable = await DDC.runAndReadAll(
        "SELECT cable.id,_cable.technology,_cable.state,cable.delete,_cable.ductId,_cable.poleId,_cable.tsId,_cable.coaxTsId,_cable.copperTsId,_cable.ethernetTsId,_cable.singleFiberTsId,_cable.multiFiberTsId FROM cable, _cable WHERE _cable.cableId = cable.id ORDER BY _cable.technology DESC, _cable.point"
      );
      let ddCableRows = ddCable.getRows();
      if (ddCableRows.length > 0) {
        for (let idx in ddCableRows) {
          let resObj = {
            cableId: ddCableRows[idx][0],
            technology: ddCableRows[idx][1],
            state: ddCableRows[idx][2],
            delete: toBoolean(ddCableRows[idx][3]),
            configuration: {},
          };
          if (ddCableRows[idx][4] != null) {
            resObj.ductId = ddCableRows[idx][4];
          } else if (ddCableRows[idx][5] != null) {
            resObj.poleId = ddCableRows[idx][5];
          }
          switch (ddCableRows[idx][1]) {
            case "coax":
              let ddCoax = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,frequencyLow,frequencyHigh,channels,width,unit FROM _cableCoax WHERE tsId = " +
                  ddCableRows[idx][7]
              );
              let ddCoaxRows = ddCoax.getRows();
              if (ddCoaxRows.length > 0) {
                resObj.point = ddCoaxRows[0][0];
                resObj.source = ddCoaxRows[0][1];
                resObj.configuration = {
                  frequencyRange: {
                    low: toDecimal(ddCoaxRows[0][2]),
                    high: toDecimal(ddCoaxRows[0][3]),
                  },
                  channels: toInteger(ddCoaxRows[0][4]),
                  width: toDecimal(ddCoaxRows[0][5]),
                  unit: ddCoaxRows[0][6],
                };
              }
              break;
            case "copper":
              let ddCopper = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,twistedPairs FROM _cableCopper WHERE tsId = " +
                  ddCableRows[idx][8]
              );
              let ddCopperRows = ddCopper.getRows();
              if (ddCopperRows.length > 0) {
                resObj.point = ddCopperRows[0][0];
                resObj.source = ddCopperRows[0][1];
                resObj.configuration = {
                  twistedPairs: toInteger(ddCopperRows[0][2]),
                };
              }
              break;
            case "ethernet":
              let ddEthernet = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,category,rate,unit FROM _cableEthernet WHERE tsId = " +
                  ddCableRows[idx][9]
              );
              let ddEthernetRows = ddEthernet.getRows();
              if (ddEthernetRows.length > 0) {
                resObj.point = ddEthernetRows[0][0];
                resObj.source = ddEthernetRows[0][1];
                resObj.configuration = {
                  category: ddEthernetRows[0][2],
                  rate: toInteger(ddEthernetRows[0][3]),
                  unit: ddEthernetRows[0][4],
                };
              }
              break;
            case "singleFiber":
              let ddSingleFiber = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,strands,mode,channels,width FROM _cableSingleFiber WHERE tsId = " +
                  ddCableRows[idx][10]
              );
              let ddSingleFiberRows = ddSingleFiber.getRows();
              if (ddSingleFiberRows.length > 0) {
                resObj.point = ddSingleFiberRows[0][0];
                resObj.source = ddSingleFiberRows[0][1];
                resObj.configuration = {
                  strands: toInteger(ddSingleFiberRows[0][2]),
                  mode: ddSingleFiberRows[0][3],
                  channels: toInteger(ddSingleFiberRows[0][4]),
                  width: toInteger(ddSingleFiberRows[0][5]),
                };
              }
              break;
            case "multiFiber":
              let ddMultiFiber = await DDC.runAndReadAll(
                "SELECT strftime(point,'" +
                  pointFormat +
                  "'),source,ribbons,strands,mode,channels,width FROM _cableMultiFiber WHERE tsId = " +
                  ddCableRows[idx][10]
              );
              let ddMultiFiberRows = ddMultiFiber.getRows();
              if (ddMultiFiberRows.length > 0) {
                resObj.point = ddMultiFiberRows[0][0];
                resObj.source = ddMultiFiberRows[0][1];
                resObj.configuration = {
                  ribbons: toInteger(ddMultiFiberRows[0][2]),
                  strands: toInteger(ddMultiFiberRows[0][3]),
                  mode: ddMultiFiberRows[0][4],
                  channels: toInteger(ddMultiFiberRows[0][5]),
                  width: toInteger(ddMultiFiberRows[0][6]),
                };
              }
              break;
          }
          resJson.push(resObj);
        }
      }
      resJson = jsonSortByMultiKeys(resJson, ["technology", "point", "source"]);
      res.contentType(OAS.mimeJSON).status(200).json(resJson);
    } catch (e) {
      return next(e);
    }
  }

  async function addMultipleCables(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        req.body = jsonSortByMultiKeys(req.body, [
          "technology",
          "point",
          "source",
        ]);
        let resJson = [];
        for (let i = 0; i < req.body.length; i++) {
          let ddd = await DDC.runAndReadAll(
            "SELECT cable.id,_cable.technology FROM cable,_cable WHERE _cable.cableId = cable.id AND cable.id = '" +
              req.body[i].cableId +
              "' LIMIT 1"
          );
          let dddRows = ddd.getRows();
          if (dddRows.length > 0) {
            switch (dddRows[0][1]) {
              case "coax":
                await DDC.run(
                  "DELETE FROM _cableCoax WHERE cableId = '" +
                    req.body[i].cableId +
                    "'"
                );
                break;
              case "copper":
                await DDC.run(
                  "DELETE FROM _cableCopper WHERE cableId = '" +
                    req.body[i].cableId +
                    "'"
                );
                break;
              case "ethernet":
                await DDC.run(
                  "DELETE FROM _cableEthernet WHERE cableId = '" +
                    req.body[i].cableId +
                    "'"
                );
                break;
              case "singleFiber":
                await DDC.run(
                  "DELETE FROM _cableSingleFiber WHERE cableId = '" +
                    req.body[i].cableId +
                    "'"
                );
                break;
              case "multiFiber":
                await DDC.run(
                  "DELETE FROM _cableMultiFiber WHERE cableId = '" +
                    req.body[i].cableId +
                    "'"
                );
                break;
            }
            await DDC.run(
              "DELETE FROM _cable WHERE cableId = '" + req.body[i].cableId + "'"
            );
            await DDC.run(
              "UPDATE cable SET delete = false, historicalTsId = NULL, predictedTsId = NULL, tsPoint = now()::timestamp WHERE id = '" +
                req.body[i].cableId +
                "'"
            );
          }
        }

        for (let i = 0; i < req.body.length; i++) {
          let tsId = await getSeqNextValue("seq_cable");
          let tsCol = "historicalTsId";

          switch (req.body[i].source) {
            case "historical":
              tsCol = "historicalTsId";
              break;
            case "predicted":
              tsCol = "predictedTsId";
              break;
          }

          let ddq = await DDC.runAndReadAll(
            "SELECT id FROM cable WHERE id = '" + req.body[i].cableId + "'"
          );
          let ddqRows = ddq.getRows();
          if (ddqRows.length == 0) {
            let ddp = await DDC.prepare(
              "INSERT INTO cable (id,delete," +
                tsCol +
                ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
            );
            ddp.bindVarchar(1, req.body[i].cableId);
            ddp.bindBoolean(2, toBoolean(req.body[i].delete));
            ddp.bindInteger(3, tsId);
            ddp.bindVarchar(4, req.body[i].point);
            ddp.bindVarchar(5, pointFormat);
            await ddp.run();
          } else {
            let ddp = await DDC.prepare(
              "UPDATE cable SET delete = $1, " + tsCol + " = $2 WHERE id = $3"
            );
            ddp.bindBoolean(1, toBoolean(req.body[i].delete));
            ddp.bindInteger(2, tsId);
            ddp.bindVarchar(3, req.body[i].cableId);
            await ddp.run();
          }

          let configTsId = -1;
          let configTsCol = "";
          switch (req.body[i].technology) {
            case "coax":
              configTsId = await getSeqNextValue("seq_cableCoax");
              configTsCol = "coaxTsId";
              break;
            case "copper":
              configTsId = await getSeqNextValue("seq_cableCopper");
              configTsCol = "copperTsId";
              break;
            case "ethernet":
              configTsId = await getSeqNextValue("seq_cableEthernet");
              configTsCol = "ethernetTsId";
              break;
            case "singleFiber":
              configTsId = await getSeqNextValue("seq_cableSingleFiber");
              configTsCol = "singleFiberTsId";
              break;
            case "multiFiber":
              configTsId = await getSeqNextValue("seq_cableMultiFiber");
              configTsCol = "multiFiberTsId";
              break;
          }

          let ddp = await DDC.prepare(
            "INSERT INTO _cable (tsId,point,source,cableId,technology,state," +
              configTsCol +
              ") VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8)"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body[i].point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.body[i].source);
          ddp.bindVarchar(5, req.body[i].cableId);
          ddp.bindVarchar(6, req.body[i].technology);
          ddp.bindVarchar(7, req.body[i].state);
          ddp.bindInteger(8, configTsId);
          await ddp.run();

          if (req.body[i].ductId != null) {
            if (await dbIdExists(req.body[i].ductId, "duct")) {
              await DDC.run(
                "UPDATE _cable SET ductId = '" +
                  req.body[i].ductId +
                  "' WHERE tsId = " +
                  tsId
              );
            }
          } else if (req.body[i].poleId != null) {
            if (await dbIdExists(req.body[i].poleId, "pole")) {
              await DDC.run(
                "UPDATE _cable SET poleId = '" +
                  req.body[i].poleId +
                  "' WHERE tsId = " +
                  tsId
              );
            }
          }

          switch (req.body[i].technology) {
            case "coax":
              let ddCoax = await DDC.prepare(
                "INSERT INTO _cableCoax (tsId,point,source,cableId,frequencyLow,frequencyHigh,channels,width,unit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10)"
              );
              ddCoax.bindInteger(1, configTsId);
              ddCoax.bindVarchar(2, req.body[i].point);
              ddCoax.bindVarchar(3, pointFormat);
              ddCoax.bindVarchar(4, req.body[i].source);
              ddCoax.bindVarchar(5, req.body[i].cableId);
              ddCoax.bindFloat(
                6,
                req.body[i].configuration.frequencyRange.frequencyLow
              );
              ddCoax.bindFloat(
                7,
                req.body[i].configuration.frequencyRange.frequencyHigh
              );
              ddCoax.bindInteger(8, req.body[i].configuration.channels);
              ddCoax.bindFloat(9, req.body[i].configuration.width);
              ddCoax.bindVarchar(10, req.body[i].configuration.unit);
              await ddCoax.run();
              break;
            case "copper":
              let ddCopper = await DDC.prepare(
                "INSERT INTO _cableCopper (tsId,point,source,cableId,twistedPairs) VALUES ($1,strptime($2,$3),$4,$5,$6)"
              );
              ddCopper.bindInteger(1, configTsId);
              ddCopper.bindVarchar(2, req.body[i].point);
              ddCopper.bindVarchar(3, pointFormat);
              ddCopper.bindVarchar(4, req.body[i].source);
              ddCopper.bindVarchar(5, req.body[i].cableId);
              ddCopper.bindInteger(6, req.body[i].configuration.twistedPairs);
              await ddCopper.run();
              break;
            case "ethernet":
              let ddEthernet = await DDC.prepare(
                "INSERT INTO _cableEthernet (tsId,point,source,cableId,category,rate,unit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8)"
              );
              ddEthernet.bindInteger(1, configTsId);
              ddEthernet.bindVarchar(2, req.body[i].point);
              ddEthernet.bindVarchar(3, pointFormat);
              ddEthernet.bindVarchar(4, req.body[i].source);
              ddEthernet.bindVarchar(5, req.body[i].cableId);
              ddEthernet.bindVarchar(6, req.body[i].configuration.category);
              ddEthernet.bindInteger(7, req.body[i].configuration.rate);
              ddEthernet.bindVarchar(8, req.body[i].configuration.unit);
              await ddEthernet.run();
              break;
            case "singleFiber":
              let ddSingleFiber = await DDC.prepare(
                "INSERT INTO _cableSingleFiber (tsId,point,source,cableId,strands,mode,channels,width,unit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9)"
              );
              ddSingleFiber.bindInteger(1, configTsId);
              ddSingleFiber.bindVarchar(2, req.body[i].point);
              ddSingleFiber.bindVarchar(3, pointFormat);
              ddSingleFiber.bindVarchar(4, req.body[i].source);
              ddSingleFiber.bindVarchar(5, req.body[i].cableId);
              ddSingleFiber.bindInteger(6, req.body[i].configuration.strands);
              ddSingleFiber.bindVarchar(7, req.body[i].configuration.mode);
              ddSingleFiber.bindInteger(8, req.body[i].configuration.channels);
              ddSingleFiber.bindInteger(9, req.body[i].configuration.width);
              await ddSingleFiber.run();
              break;
            case "multiFiber":
              let ddMultiFiber = await DDC.prepare(
                "INSERT INTO _cableMultiFiber (tsId,point,source,cableId,ribbons,strands,mode,channels,width,unit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10)"
              );
              ddMultiFiber.bindInteger(1, configTsId);
              ddMultiFiber.bindVarchar(2, req.body[i].point);
              ddMultiFiber.bindVarchar(3, pointFormat);
              ddMultiFiber.bindVarchar(4, req.body[i].source);
              ddMultiFiber.bindVarchar(5, req.body[i].cableId);
              ddMultiFiber.bindInteger(6, req.body[i].configuration.ribbons);
              ddMultiFiber.bindInteger(7, req.body[i].configuration.strands);
              ddMultiFiber.bindVarchar(8, req.body[i].configuration.mode);
              ddMultiFiber.bindInteger(9, req.body[i].configuration.channels);
              ddMultiFiber.bindInteger(10, req.body[i].configuration.width);
              await ddMultiFiber.run();
              break;
          }
          if (req.body[i].source == "historical") {
            await dbAddPredictQueueItem("cable", req.body[i].cableId, "create");
          }
          resJson.push(req.body[i].cableId);
        }
        resJson = Array.from(new Set(resJson.map(JSON.stringify)))
          .map(JSON.parse)
          .sort();
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllDuct(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let resJson = [];
        let ddRead = await DDC.runAndReadAll(
          "SELECT id FROM duct WHERE delete = false"
        );
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            resJson.push(ddRows[idx][0]);
          }
          resJson.sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getDuctsSimpleStatistics(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        res
          .contentType(OAS.mimeJSON)
          .status(200)
          .json(await dbActiveInactiveCounts("duct"));
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addSingleDuct(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ductId = uuidv4();
        let tsId = await getSeqNextValue("seq_duct");
        let tsCol = "historicalTsId";
        switch (req.body.source) {
          case "historical":
            tsCol = "historicalTsId";
            break;
          case "predicted":
            tsCol = "predictedTsId";
            break;
          default:
            tsCol = "historicalTsId";
        }

        let ddq = await DDC.runAndReadAll(
          "SELECT id FROM duct WHERE id = '" + ductId + "'"
        );
        let ddqRows = ddq.getRows();
        if (ddqRows.length == 0) {
          let ddp = await DDC.prepare(
            "INSERT INTO duct (id,delete," +
              tsCol +
              ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
          );
          ddp.bindVarchar(1, ductId);
          ddp.bindBoolean(2, toBoolean(req.body.delete));
          ddp.bindInteger(3, tsId);
          ddp.bindVarchar(4, req.body.point);
          ddp.bindVarchar(5, pointFormat);
          await ddp.run();
        } else {
          let ddp = await DDC.prepare(
            "UPDATE duct SET delete = $1, " + tsCol + " = $2 WHERE id = $3"
          );
          ddp.bindBoolean(1, toBoolean(req.body.delete));
          ddp.bindInteger(2, tsId);
          ddp.bindVarchar(3, ductId);
          await ddp.run();
        }

        let ddp = await DDC.prepare(
          "INSERT INTO _duct (tsId,point,ductid,trenchId,source,purpose,category,configuration,state,placementVertical,placementHorizontal,placementUnit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)"
        );
        ddp.bindInteger(1, tsId);
        ddp.bindVarchar(2, req.body.point);
        ddp.bindVarchar(3, pointFormat);
        ddp.bindVarchar(4, ductId);
        ddp.bindVarchar(5, req.body.trenchId);
        ddp.bindVarchar(6, req.body.source);
        ddp.bindVarchar(7, req.body.purpose);
        ddp.bindVarchar(8, req.body.category);
        ddp.bindInteger(9, req.body.configuration);
        ddp.bindVarchar(10, req.body.state);
        ddp.bindInteger(11, req.body.placement.vertical);
        ddp.bindInteger(12, req.body.placement.horizontal);
        ddp.bindVarchar(13, req.body.placement.unit);
        await ddp.run();

        if (req.body.within != null) {
          await DDC.run(
            "UPDATE _duct SET within = '" +
              req.body.within +
              "' WHERE tsId = " +
              tsId
          );
        }
        res.contentType(OAS.mimeJSON).status(200).json({ ductId: ductId });
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getDuctsCapacityState(req, res, next) {
    // TODO
    res.sendStatus(405);
  }

  async function deleteSingleDuct(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        // recover (restore) previously deleted if still exists
        if (req.query?.restore != null) {
          let point = dayjs().format(dayjsFormat);
          let ddRead = await DDC.runAndReadAll(
            "SELECT duct.id FROM duct,_duct WHERE duct.id = '" +
              req.params.ductId +
              "' AND _duct.ductId = duct.id AND _duct.source = 'historical' AND duct.delete = true LIMIT 1"
          );
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            await DDC.run(
              "UPDATE duct SET tsPoint = strptime('" +
                point +
                "','" +
                pointFormat +
                "'), delete = false WHERE id = '" +
                req.params.ductId +
                "'"
            );
            await dbAddPredictQueueItem("duct", req.params.ductId, "undelete");
            res.sendStatus(204);
          } else {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "ductId " + req.params.ductId + " does not exist",
              });
          }
        } else {
          let ddp = await DDC.prepare(
            "SELECT id,tsPoint,historicalTsId,predictedTsId,source FROM duct,_duct WHERE duct.id = $1 AND _duct.tsId = duct.historicalTsId AND duct.delete = false"
          );
          ddp.bindVarchar(1, req.params.ductId);
          let ddRead = await ddp.runAndReadAll();
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            if (req.query?.predicted != null) {
              await DDC.run(
                "DELETE FROM _duct WHERE ductId = '" +
                  req.params.ductId +
                  "' and source = 'predicted'"
              );
              await DDC.run(
                "UPDATE duct SET predictedTsId = NULL WHERE id = '" +
                  req.params.ductId +
                  "'"
              );
              res.sendStatus(204);
            } else {
              let point = dayjs().format(dayjsFormat);
              let tsId = await getSeqNextValue("seq_duct");
              let tsCol = "historicalTsId";
              switch (ddRows[0][4]) {
                case "historical":
                  tsCol = "historicalTsId";
                  break;
                case "predicted":
                  tsCol = "predictedTsId";
                  break;
              }
              let ddClone = await DDC.prepare(
                "INSERT INTO _duct (tsId,point,ductId,trenchId,source,within,purpose,category,configuration,state,placementVertical,placementHorizontal,placementUnit) SELECT $1,strptime($2,$3),ductId,trenchId,source,within,purpose,category,configuration,state,placementVertical,placementHorizontal,placementUnit FROM _duct WHERE tsId = $4"
              );
              ddClone.bindInteger(1, tsId);
              ddClone.bindVarchar(2, point);
              ddClone.bindVarchar(3, pointFormat);
              ddClone.bindInteger(4, ddRows[0][2]);
              await ddClone.run();
              await DDC.run(
                "UPDATE duct SET " +
                  tsCol +
                  " = " +
                  tsId +
                  ", tsPoint = strptime('" +
                  point +
                  "','" +
                  pointFormat +
                  "'), delete = true WHERE id = '" +
                  req.params.ductId +
                  "'"
              );
              await dbAddPredictQueueItem("duct", req.params.ductId, "delete");
              res.sendStatus(204);
            }
          } else {
            res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "ductId " + req.params.ductId + " does not exist",
              });
          }
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSingleDuct(req, res, next) {
    let datePoint = "AND _duct.tsId = duct.historicalTsId";
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.query?.point != null) {
          datePoint =
            "AND strftime(_duct.point,'" +
            pointFormat +
            "') = '" +
            req.query.point +
            "'";
        }
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,source,trenchId,purpose,category,configuration,state,within,placementVertical,placementHorizontal,placementUnit,strftime(point,'" +
            pointFormat +
            "') FROM duct, _duct WHERE id = $1 AND _duct.ductId = duct.id AND duct.delete = false " +
            datePoint +
            " ORDER BY _duct.point DESC LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.ductId);
        let ddDuct = await ddp.runAndReadAll();
        let ddRows = ddDuct.getRows();
        if (ddRows.length > 0) {
          resJson = {
            ductId: req.params.ductId,
            point: ddRows[0][15],
            trenchId: ddRows[0][6],
            purpose: ddRows[0][7],
            category: ddRows[0][8],
            configuration: toInteger(ddRows[0][9]),
            state: ddRows[0][10],
            placement: {
              horizontal: toDecimal(ddRows[0][13]),
              vertical: toDecimal(ddRows[0][12]),
              unit: ddRows[0][14],
            },
            source: ddRows[0][5],
            delete: toBoolean(ddRows[0][1]),
          };
          if (ddRows[0][11] != null) {
            resJson.within = ddRows[0][11];
          }
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "ductId " + req.params.ductId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getDuctTimeline(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddp = await DDC.prepare(
          "SELECT strftime(point,'" +
            pointFormat +
            "'),source FROM duct, _duct WHERE id = $1 AND ductId = id AND delete = false ORDER BY point DESC"
        );
        ddp.bindVarchar(1, req.params.ductId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let resJson = [];
          for (let idx in ddRows) {
            resJson.push({ point: ddRows[idx][0], source: ddRows[idx][1] });
          }
          resJson = Array.from(new Set(resJson.map(JSON.stringify)))
            .map(JSON.parse)
            .sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "ductId " + req.params.ductId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateSingleDuct(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,source,ductId,trenchId,purpose,category,configuration,state,within,placementVertical,placementHorizontal,placementUnit,strftime(point,'" +
            pointFormat +
            "') FROM duct,_duct WHERE duct.id = $1 AND _duct.tsId = duct.historicalTsId AND duct.delete = false LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.ductId);
        let ddDuct = await ddp.runAndReadAll();
        let ddDuctRows = ddDuct.getRows();
        if (ddDuctRows.length > 0) {
          if (req.body?.trenchId != null) {
            if (!(await dbIdExists(req.body.trenchId, "trench"))) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors: "trenchId " + req.body.trenchId + " does not exist",
                });
            }
          }
          if (req.body.within != null) {
            if (!(await dbIdExists(req.body.within, "duct"))) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors: "within " + req.body.within + " does not exist",
                });
            }
          }
          resJson = {
            ductId: ddDuctRows[0][6],
            point: ddDuctRows[0][16],
            trenchId: ddDuctRows[0][7],
            purpose: ddDuctRows[0][8],
            category: ddDuctRows[0][9],
            configuration: ddDuctRows[0][10],
            state: ddDuctRows[0][11],
            placement: {
              horizontal: toDecimal(ddDuctRows[0][14]),
              vertical: toDecimal(ddDuctRows[0][13]),
              unit: ddDuctRows[0][15],
            },
            source: ddDuctRows[0][5],
            delete: toBoolean(ddDuctRows[0][1]),
          };
          if (ddDuctRows[0][12] != null) {
            resJson.within = ddDuctRows[0][12];
          }
          // pass to replace to regenerate the record
          req.body = jsonDeepMerge(resJson, req.body);
          return next();
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "ductId " + req.params.ductId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function replaceSingleDuct(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddp = await DDC.prepare(
          "SELECT id FROM duct WHERE id = $1 AND delete = false LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.ductId);
        let ddDuct = await ddp.runAndReadAll();
        let ddDuctRows = ddDuct.getRows();
        if (ddDuctRows.length > 0) {
          let point = dayjs().format(dayjsFormat);
          let tsId = await getSeqNextValue("seq_duct");
          let tsCol = "historicalTsId";
          switch (req.body.source) {
            case "historical":
              tsCol = "historicalTsId";
              break;
            case "predicted":
              tsCol = "predictedTsId";
              break;
          }
          let ddp = await DDC.prepare(
            "UPDATE duct SET " +
              tsCol +
              " = $1, tsPoint = strptime($2,$3) WHERE id = $4"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body.point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.params.ductId);
          await ddp.run();

          ddp = await DDC.prepare(
            "INSERT INTO _duct (tsId,point,ductid,trenchId,source,purpose,category,configuration,state,placementVertical,placementHorizontal,placementUnit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body.point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.params.ductId);
          ddp.bindVarchar(5, req.body.trenchId);
          ddp.bindVarchar(6, req.body.source);
          ddp.bindVarchar(7, req.body.purpose);
          ddp.bindVarchar(8, req.body.category);
          ddp.bindInteger(9, req.body.configuration);
          ddp.bindVarchar(10, req.body.state);
          ddp.bindInteger(11, req.body.placement.vertical);
          ddp.bindInteger(12, req.body.placement.horizontal);
          ddp.bindVarchar(13, req.body.placement.unit);
          await ddp.run();

          if (req.body.within != null) {
            await DDC.run(
              "UPDATE _duct SET within = '" +
                req.params.within +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.source == "historical") {
            await dbAddPredictQueueItem("duct", req.params.ductId, "update");
          }
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "ductId " + req.params.ductId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getMultipleDucts(req, res, next) {
    try {
      let resJson = [];
      let ddDuct = await DDC.runAndReadAll(
        "SELECT id,delete,source,trenchId,purpose,category,configuration,state,within,placementVertical,placementHorizontal,placementUnit,strftime(point,'" +
          pointFormat +
          "') FROM duct,_duct WHERE _duct.ductId = duct.id ORDER BY _duct.point"
      );
      let ddDuctRows = ddDuct.getRows();
      if (ddDuctRows.length > 0) {
        for (let idx in ddDuctRows) {
          let resObj = {
            ductId: ddDuctRows[idx][0],
            point: ddDuctRows[idx][12],
            trenchId: ddDuctRows[idx][3],
            purpose: ddDuctRows[idx][4],
            category: ddDuctRows[idx][5],
            configuration: toInteger(ddDuctRows[idx][6]),
            state: ddDuctRows[idx][7],
            placement: {
              horizontal: toDecimal(ddDuctRows[idx][10]),
              vertical: toDecimal(ddDuctRows[idx][9]),
              unit: ddDuctRows[idx][11],
            },
            source: ddDuctRows[idx][2],
            delete: toBoolean(ddDuctRows[idx][1]),
          };
          if (ddDuctRows[idx][8] != null) {
            resObj.within = ddDuctRows[idx][8];
          }
          resJson.push(resObj);
        }
        resJson = jsonSortByMultiKeys(resJson, ["point", "source"]);
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res.sendStatus(204);
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addMultipleDucts(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        req.body = jsonSortByMultiKeys(req.body, ["point", "source"]);
        let resJson = [];
        for (let i = 0; i < req.body.length; i++) {
          let ddd = await DDC.runAndReadAll(
            "SELECT id FROM duct WHERE id = '" + req.body[i].ductId + "'"
          );
          let dddRows = ddd.getRows();
          if (dddRows.length > 0) {
            await DDC.run(
              "DELETE FROM _duct WHERE ductId = '" + req.body[i].ductId + "'"
            );
            await DDC.run(
              "UPDATE duct SET delete = false, historicalTsId = NULL, predictedTsId = NULL, tsPoint = now()::timestamp WHERE id = '" +
                req.body[i].ductId +
                "'"
            );
          }
        }
        for (let i = 0; i < req.body.length; i++) {
          if (!(await dbIdExists(req.body[i].trenchId, "trench"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "[" +
                  i +
                  "] trenchId " +
                  req.body[i].trenchId +
                  " does not exist",
              });
          }
          let tsId = await getSeqNextValue("seq_duct");
          let tsCol = "historicalTsId";
          switch (req.body.source) {
            case "historical":
              tsCol = "historicalTsId";
              break;
            case "predicted":
              tsCol = "predictedTsId";
              break;
          }

          let ddq = await DDC.runAndReadAll(
            "SELECT id FROM duct WHERE id = '" + req.body[i].ductId + "'"
          );
          let ddqRows = ddq.getRows();
          if (ddqRows.length == 0) {
            let ddp = await DDC.prepare(
              "INSERT INTO duct (id,delete," +
                tsCol +
                ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
            );
            ddp.bindVarchar(1, req.body[i].ductId);
            ddp.bindBoolean(2, toBoolean(req.body[i].delete));
            ddp.bindInteger(3, tsId);
            ddp.bindVarchar(4, req.body[i].point);
            ddp.bindVarchar(5, pointFormat);
            await ddp.run();
          } else {
            let ddp = await DDC.prepare(
              "UPDATE duct SET delete = $1, " + tsCol + " = $2 WHERE id = $3"
            );
            ddp.bindBoolean(1, toBoolean(req.body[i].delete));
            ddp.bindInteger(2, tsId);
            ddp.bindVarchar(3, req.body[i].ductId);
            await ddp.run();
          }

          let ddp = await DDC.prepare(
            "INSERT INTO _duct (tsId,point,ductid,trenchId,source,purpose,category,configuration,state,placementVertical,placementHorizontal,placementUnit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body[i].point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.body[i].ductId);
          ddp.bindVarchar(5, req.body[i].trenchId);
          ddp.bindVarchar(6, req.body[i].source);
          ddp.bindVarchar(7, req.body[i].purpose);
          ddp.bindVarchar(8, req.body[i].category);
          ddp.bindInteger(9, req.body[i].configuration);
          ddp.bindVarchar(10, req.body[i].state);
          ddp.bindInteger(11, req.body[i].placement.vertical);
          ddp.bindInteger(12, req.body[i].placement.horizontal);
          ddp.bindVarchar(13, req.body[i].placement.unit);
          await ddp.run();

          if (req.body[i].within != null) {
            if (await dbIdExists(req.body[i].within)) {
              await DDC.run(
                "UPDATE _duct SET within = '" +
                  req.body[i].within +
                  "' WHERE tsId = " +
                  tsId
              );
            }
          }
          if (req.body[i].source == "historical") {
            await dbAddPredictQueueItem("duct", req.body[i].ductId, "create");
          }
          resJson.push(req.body[i].ductId);
        }
        resJson = Array.from(new Set(resJson.map(JSON.stringify)))
          .map(JSON.parse)
          .sort();
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllNe(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let resJson = [];
        let ddRead = await DDC.runAndReadAll(
          "SELECT id FROM ne WHERE delete = false"
        );
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            resJson.push(ddRows[idx][0]);
          }
          resJson.sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getNesSimpleStatistics(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        res
          .contentType(OAS.mimeJSON)
          .status(200)
          .json(await dbActiveInactiveCounts("ne"));
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addNe(neId, body) {
    let tsId = await getSeqNextValue("seq_ne");
    let tsCol = "historicalTsId";
    let point = dayjs().format(dayjsFormat);
    switch (body.source) {
      case "historical":
        tsCol = "historicalTsId";
        break;
      case "predicted":
        tsCol = "predictedTsId";
        break;
      default:
        tsCol = "historicalTsId";
    }

    let ddq = await DDC.runAndReadAll(
      "SELECT id FROM ne WHERE id = '" + neId + "'"
    );
    let ddqRows = ddq.getRows();
    if (ddqRows.length == 0) {
      let ddp = await DDC.prepare(
        "INSERT INTO ne (id,delete," +
          tsCol +
          ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
      );
      ddp.bindVarchar(1, neId);
      ddp.bindBoolean(2, toBoolean(body.delete));
      ddp.bindInteger(3, tsId);
      ddp.bindVarchar(4, body.point || point);
      ddp.bindVarchar(5, pointFormat);
      await ddp.run();
    } else {
      let ddp = await DDC.prepare(
        "UPDATE ne SET delete = $1, " + tsCol + " = $2 WHERE id = $3"
      );
      ddp.bindBoolean(1, toBoolean(body.delete));
      ddp.bindInteger(2, tsId);
      ddp.bindVarchar(3, neId);
      await ddp.run();
    }

    let ddp = await DDC.prepare(
      "INSERT INTO _ne (tsId,point,neId,source,host,mgmtIP,vendor,model,image,version,commissioned,siteId,rackid,slotPosition) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10,$11,strptime($12,$13),$14,$15,$16)"
    );
    ddp.bindInteger(1, tsId);
    ddp.bindVarchar(2, body.point || point);
    ddp.bindVarchar(3, pointFormat);
    ddp.bindVarchar(4, neId);
    ddp.bindVarchar(5, body.source);
    ddp.bindVarchar(6, body.host);
    ddp.bindVarchar(7, body.mgmtIP);
    ddp.bindVarchar(8, body.vendor);
    ddp.bindVarchar(9, body.model);
    ddp.bindVarchar(10, body.image);
    ddp.bindVarchar(11, body.version);
    ddp.bindVarchar(12, body.commissioned);
    ddp.bindVarchar(13, dateFormat);
    ddp.bindVarchar(14, body.siteId);
    ddp.bindVarchar(15, body.rackId);
    ddp.bindInteger(16, toInteger(body.slotPosition));
    await ddp.run();

    if (body.decommissioned != null) {
      await DDC.run(
        "UPDATE _ne SET decommissioned = strptime('" +
          body.decommissioned +
          "','" +
          dateFormat +
          "') WHERE tsId = " +
          tsId
      );
    }

    for (let p = 0; p < body.ports.length; p++) {
      let nePortTsId = uuidv4();
      let tsPortId = await getSeqNextValue("seq_nePort");
      let ddq = await DDC.runAndReadAll(
        "SELECT id FROM nePort WHERE neId = '" +
          neId +
          "' AND lower(name) = lower('" +
          body.ports[p].name +
          "')"
      );
      let ddqRows = ddq.getRows();
      if (ddqRows.length == 0) {
        let ddp = await DDC.prepare(
          "INSERT INTO nePort (id,delete,neId,name," +
            tsCol +
            ",tsPoint) VALUES ($1,$2,$3,$4,$5,strptime($6,$7))"
        );
        ddp.bindVarchar(1, nePortTsId);
        ddp.bindBoolean(2, toBoolean(body.delete));
        ddp.bindVarchar(3, neId);
        ddp.bindVarchar(4, body.ports[p].name);
        ddp.bindInteger(5, tsPortId);
        ddp.bindVarchar(6, body.point || point);
        ddp.bindVarchar(7, pointFormat);
        await ddp.run();
      } else {
        nePortTsId = ddqRows[0][0];
        let ddp = await DDC.prepare(
          "UPDATE nePort SET delete = $1, " +
            tsCol +
            " = $2,tsPoint = strptime($3,$4) WHERE id = $5"
        );
        ddp.bindBoolean(1, toBoolean(body.delete));
        ddp.bindInteger(2, tsPortId);
        ddp.bindVarchar(3, body.point || point);
        ddp.bindVarchar(4, pointFormat);
        ddp.bindVarchar(5, nePortTsId);
        await ddp.run();
      }

      ddp = await DDC.prepare(
        "INSERT INTO _nePort (tsId,point,nePortId,source,neId,name,technology,state) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9)"
      );
      ddp.bindInteger(1, tsPortId);
      ddp.bindVarchar(2, body.point || point);
      ddp.bindVarchar(3, pointFormat);
      ddp.bindVarchar(4, nePortTsId);
      ddp.bindVarchar(5, body.source);
      ddp.bindVarchar(6, neId);
      ddp.bindVarchar(7, body.ports[p].name);
      ddp.bindVarchar(8, body.ports[p].technology);
      ddp.bindVarchar(9, body.ports[p].state);
      await ddp.run();

      switch (body.ports[p].technology) {
        case "coax":
          ddp = await DDC.prepare(
            "INSERT INTO _nePortCoax (nePortTsId,frequencyLow,frequencyHigh,channels,width,unit) VALUES ($1,$2,$3,$4,$5,$6)"
          );
          ddp.bindInteger(1, tsPortId);
          ddp.bindFloat(
            2,
            toDecimal(body.ports[p].configuration.frequencyRange.low)
          );
          ddp.bindFloat(
            3,
            toDecimal(body.ports[p].configuration.frequencyRange.high)
          );
          ddp.bindFloat(4, toDecimal(body.ports[p].configuration.channels));
          ddp.bindFloat(5, toDecimal(body.ports[p].configuration.width));
          ddp.bindVarchar(6, body.ports[p].configuration.unit);
          await ddp.run();
          break;
        case "ethernet":
          ddp = await DDC.prepare(
            "INSERT INTO _nePortEthernet (nePortTsId,category,rate,unit) VALUES ($1,$2,$3,$4)"
          );
          ddp.bindInteger(1, tsPortId);
          ddp.bindVarchar(2, body.ports[p].configuration.category);
          ddp.bindInteger(3, toInteger(body.ports[p].configuration.rate));
          ddp.bindVarchar(4, body.ports[p].configuration.unit);
          await ddp.run();
          break;
        case "loopback":
          ddp = await DDC.prepare(
            "INSERT INTO _nePortLoopback (nePortTsId,rate,unit) VALUES ($1,$2,$3)"
          );
          ddp.bindInteger(1, tsPortId);
          ddp.bindInteger(2, toInteger(body.ports[p].configuration.rate));
          ddp.bindVarchar(3, body.ports[p].configuration.unit);
          await ddp.run();
          break;
        case "fiber":
          ddp = await DDC.prepare(
            "INSERT INTO _nePortFiber (nePortTsId,rate,unit,mode,channels,width) VALUES ($1,$2,$3,$4,$5,$6)"
          );
          ddp.bindInteger(1, tsPortId);
          ddp.bindInteger(2, toInteger(body.ports[p].configuration.rate));
          ddp.bindVarchar(3, body.ports[p].configuration.unit);
          ddp.bindVarchar(4, body.ports[p].configuration.mode);
          ddp.bindInteger(5, toInteger(body.ports[p].configuration.channels));
          ddp.bindInteger(6, toInteger(body.ports[p].configuration.width));
          await ddp.run();
          break;
        case "xdsl":
          ddp = await DDC.prepare(
            "INSERT INTO _nePortXdsl (nePortTsId,category,rate,unit) VALUES ($1,$2,$3,$4)"
          );
          ddp.bindInteger(1, tsPortId);
          ddp.bindVarchar(2, body.ports[p].configuration.category);
          ddp.bindInteger(3, toInteger(body.ports[p].configuration.rate));
          ddp.bindVarchar(4, body.ports[p].configuration.unit);
          await ddp.run();
          break;
        case "virtual":
          ddp = await DDC.prepare(
            "INSERT INTO _nePortVirtual (nePortTsId,rate,unit) VALUES ($1,$2,$3)"
          );
          ddp.bindInteger(1, tsPortId);
          ddp.bindInteger(2, toInteger(body.ports[p].configuration.rate));
          ddp.bindVarchar(3, body.ports[p].configuration.unit);
          await ddp.run();
          break;
      }
    }
    return 200;
  }

  async function addSingleNe(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (body?.siteId != null) {
          if (!(await dbIdExists(body.siteId, "site"))) {
            return {
              status: 404,
              body: {
                errors: "siteId " + body.siteId + " does not exist",
              },
            };
          }
        }
        if (body?.rackId != null) {
          if (!(await dbIdExists(body.rackId, "rack"))) {
            return {
              status: 404,
              body: {
                errors: "rackId " + body.rackId + " does not exist",
              },
            };
          }
        }
        let neId = uuidv4();
        let status = await addNe(neId, req.body);
        if (status == 200) {
          if (body.source == "historical") {
            await dbAddPredictQueueItem("ne", neId, "create");
          }
          return res
            .contentType(OAS.mimeJSON)
            .status(status)
            .json({ id: neId });
        } else {
          return res.sendStatusstatus(status);
        }
      } else {
        return res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function deleteSingleNe(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        // recover (restore) previously deleted if still exists
        if (req.query?.restore != null) {
          let status = await undeleteNe(req.params.neId);
          await dbAddPredictQueueItem("ne", req.params.neId, "undelete");
          return res.sendStatus(status);
        } else if (req.query?.predicted != null) {
          let status = await deleteNe(req.params.neId, {
            predicted: req.query?.predicted,
          });
          return res.sendStatus(status);
        } else {
          let status = await deleteNe(req.params.neId);
          await dbAddPredictQueueItem("ne", req.params.neId, "delete");
          if (status == 204) {
            return res.sendStatus(status);
          } else if (status == 404) {
            return res
              .contentType(OAS.mimeJSON)
              .status(status)
              .json({
                errors: "neId " + req.params.neId + " does not exist",
              });
          } else {
            return res.sendStatus(status);
          }
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSingleNePorts(neId) {
    let resPorts = [];
    let ddp = await DDC.prepare(
      "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,source FROM ne, _ne WHERE ne.id = $1 AND _ne.neId = ne.id AND ne.delete = false AND _ne.tsId = ne.historicalTsId ORDER BY _ne.point DESC LIMIT 1"
    );
    ddp.bindVarchar(1, neId);
    let ddRead = await ddp.runAndReadAll();
    let ddRows = ddRead.getRows();
    if (ddRows.length > 0) {
      let ddPort = await DDC.runAndReadAll(
        "SELECT nePortTsId,name,technology,state FROM _nePort WHERE neId = '" +
          neId +
          "'"
      );
      let ddPortRows = ddPort.getRows();
      for (let idx in ddPortRows) {
        let resPort = {};
        switch (ddPortRows[idx][2]) {
          case "coax":
            let ddCoax = await DDC.runAndReadAll(
              "SELECT frequencyLow,frequencyHigh,channels,width,unit FROM _nePortCoax WHERE nePortTsId = '" +
                ddPortRows[idx][0] +
                "'"
            );
            let ddCoaxRows = ddCoax.getRows();
            if (ddCoaxRows.length > 0) {
              resPort = {
                name: ddPortRows[idx][1],
                technology: ddPortRows[idx][2],
                state: ddPortRows[idx][3],
                configuration: {
                  frequencyRange: {
                    low: toDecimal(ddCoaxRows[0][0]),
                    high: toDecimal(ddCoaxRows[0][1]),
                  },
                  channels: toDecimal(ddCoaxRows[0][2]),
                  width: toDecimal(ddCoaxRows[0][3]),
                  unit: ddCoaxRows[0][4],
                },
              };
            }
            break;
          case "ethernet":
            let ddEthernet = await DDC.runAndReadAll(
              "SELECT category,rate,unit FROM _nePortEthernet WHERE nePortTsId = '" +
                ddPortRows[idx][0] +
                "'"
            );
            let ddEthernetRows = ddEthernet.getRows();
            if (ddEthernetRows.length > 0) {
              resPort = {
                name: ddPortRows[idx][1],
                technology: ddPortRows[idx][2],
                state: ddPortRows[idx][3],
                configuration: {
                  category: ddEthernetRows[0][0],
                  rate: toInteger(ddEthernetRows[0][1]),
                  unit: ddEthernetRows[0][2],
                },
              };
            }
            break;
          case "loopback":
            let ddLoopback = await DDC.runAndReadAll(
              "SELECT rate,unit FROM _nePortLoopback WHERE nePortTsId = '" +
                ddPortRows[idx][0] +
                "'"
            );
            let ddLoopbackRows = ddLoopback.getRows();
            if (ddLoopbackRows.length > 0) {
              resPort = {
                name: ddPortRows[idx][1],
                technology: ddPortRows[idx][2],
                state: ddPortRows[idx][3],
                configuration: {
                  rate: toInteger(ddLoopbackRows[0][0]),
                  unit: ddLoopbackRows[0][1],
                },
              };
            }
            break;
          case "fiber":
            let ddFiber = await DDC.runAndReadAll(
              "SELECT rate,unit,mode,channels,width FROM _nePortFiber WHERE nePortTsId = '" +
                ddPortRows[idx][0] +
                "'"
            );
            let ddFiberRows = ddFiber.getRows();
            if (ddFiberRows.length > 0) {
              resPort = {
                name: ddPortRows[idx][1],
                technology: ddPortRows[idx][2],
                state: ddPortRows[idx][3],
                configuration: {
                  rate: toInteger(ddFiberRows[0][0]),
                  unit: ddFiberRows[0][1],
                  mode: ddFiberRows[0][2],
                  width: toInteger(ddFiberRows[0][3]),
                  channels: toInteger(ddFiberRows[0][4]),
                },
              };
            }
            break;
          case "xdsl":
            let ddXdsl = await DDC.runAndReadAll(
              "SELECT category,rate,unit FROM _nePortXdsl WHERE nePortTsId = '" +
                ddPortRows[idx][0] +
                "'"
            );
            let ddXdslRows = ddXdsl.getRows();
            if (ddXdslRows.length > 0) {
              resPort = {
                name: ddPortRows[idx][1],
                technology: ddPortRows[idx][2],
                state: ddPortRows[idx][3],
                configuration: {
                  category: ddXdslRows[0][0],
                  rate: toInteger(ddXdslRows[0][1]),
                  unit: ddXdslRows[0][2],
                },
              };
            }
            break;
          case "virtual":
            let ddVirtual = await DDC.runAndReadAll(
              "SELECT rate,unit FROM _nePortVirtual WHERE nePortTsId = '" +
                ddPortRows[idx][0] +
                "'"
            );
            let ddVirtualRows = ddVirtual.getRows();
            if (ddVirtualRows.length > 0) {
              resPort = {
                name: ddPortRows[idx][1],
                technology: ddPortRows[idx][2],
                state: ddPortRows[idx][3],
                configuration: {
                  rate: toInteger(ddVirtualRows[0][0]),
                  unit: ddVirtualRows[0][1],
                },
              };
            }
            break;
        }
        resPorts.push(resPort);
      }
    }
    return resPorts;
  }

  async function undeleteNe(neId) {
    let point = dayjs().format(dayjsFormat);
    let ddRead = await DDC.runAndReadAll(
      "SELECT ne.id FROM ne,_ne WHERE ne.id = '" +
        req.params.neId +
        "' AND _ne.neId = ne.id AND _ne.source = 'historical' AND ne.delete = true LIMIT 1"
    );
    let ddRows = ddRead.getRows();
    if (ddRows.length > 0) {
      await DDC.run(
        "UPDATE nePort SET tsPoint = strptime('" +
          point +
          "','" +
          pointFormat +
          "'), delete = false WHERE neId = '" +
          req.params.neId +
          "'"
      );
      await DDC.run(
        "UPDATE ne SET tsPoint = strptime('" +
          point +
          "','" +
          pointFormat +
          "'), delete = false WHERE id = '" +
          req.params.neId +
          "'"
      );
      return 204;
    } else {
      return 404;
    }
  }

  async function deleteNe(
    neId,
    {
      point = null,
      source = "historical",
      predicted = null,
      expunge = false,
    } = {}
  ) {
    if (expunge) {
      let ddd = await DDC.runAndReadAll(
        "SELECT id FROM ne WHERE id = '" + neId + "'"
      );
      let dddRows = ddd.getRows();
      if (dddRows.length > 0) {
        /*
DELETE FROM _nePortCoax WHERE nePortTsId IN (SELECT tsId FROM _nePort WHERE neId = 'ecd9b5ff-b9b8-47d2-a7bf-18dd25e710fc');
DELETE FROM _nePortEthernet WHERE nePortTsId IN (SELECT tsId FROM _nePort WHERE neId = 'ecd9b5ff-b9b8-47d2-a7bf-18dd25e710fc');
DELETE FROM _nePortLoopback WHERE nePortTsId IN (SELECT tsId FROM _nePort WHERE neId = 'ecd9b5ff-b9b8-47d2-a7bf-18dd25e710fc');
DELETE FROM _nePortFiber WHERE nePortTsId IN (SELECT tsId FROM _nePort WHERE neId = 'ecd9b5ff-b9b8-47d2-a7bf-18dd25e710fc');
DELETE FROM _nePortXdsl WHERE nePortTsId IN (SELECT tsId FROM _nePort WHERE neId = 'ecd9b5ff-b9b8-47d2-a7bf-18dd25e710fc');
DELETE FROM _nePortVirtual WHERE nePortTsId IN (SELECT tsId FROM _nePort WHERE neId = 'ecd9b5ff-b9b8-47d2-a7bf-18dd25e710fc');
DELETE FROM _nePort WHERE neId = 'ecd9b5ff-b9b8-47d2-a7bf-18dd25e710fc';
UPDATE nePort SET delete = false, historicalTsId = NULL, predictedTsId = NULL, tsPoint = now()::timestamp WHERE id = 'ecd9b5ff-b9b8-47d2-a7bf-18dd25e710fc';
DELETE FROM _ne WHERE neId = 'ecd9b5ff-b9b8-47d2-a7bf-18dd25e710fc';
UPDATE ne SET delete = false, historicalTsId = NULL, predictedTsId = NULL, tsPoint = now()::timestamp WHERE id = 'ecd9b5ff-b9b8-47d2-a7bf-18dd25e710fc';
        */
        await DDC.run(
          "DELETE FROM _nePortCoax WHERE nePortTsId IN (SELECT tsId FROM _nePort WHERE neId = '" +
            neId +
            "')"
        );
        await DDC.run(
          "DELETE FROM _nePortEthernet WHERE nePortTsId IN (SELECT tsId FROM _nePort WHERE neId = '" +
            neId +
            "')"
        );
        await DDC.run(
          "DELETE FROM _nePortLoopback WHERE nePortTsId IN (SELECT tsId FROM _nePort WHERE neId = '" +
            neId +
            "')"
        );
        await DDC.run(
          "DELETE FROM _nePortFiber WHERE nePortTsId IN (SELECT tsId FROM _nePort WHERE neId = '" +
            neId +
            "')"
        );
        await DDC.run(
          "DELETE FROM _nePortXdsl WHERE nePortTsId IN (SELECT tsId FROM _nePort WHERE neId = '" +
            neId +
            "')"
        );
        await DDC.run(
          "DELETE FROM _nePortVirtual WHERE nePortTsId IN (SELECT tsId FROM _nePort WHERE neId = '" +
            neId +
            "')"
        );
        await DDC.run("DELETE FROM _nePort WHERE neId = '" + neId + "'");
        await DDC.run(
          "UPDATE nePort SET delete = false, historicalTsId = NULL, predictedTsId = NULL, tsPoint = now()::timestamp WHERE id = '" +
            neId +
            "'"
        );
        await DDC.run("DELETE FROM _ne WHERE neId = '" + neId + "'");
        await DDC.run(
          "UPDATE ne SET delete = false, historicalTsId = NULL, predictedTsId = NULL, tsPoint = now()::timestamp WHERE id = '" +
            neId +
            "'"
        );
        return 204;
      }
    } else {
      let ddp = await DDC.prepare(
        "SELECT id,tsPoint,historicalTsId,predictedTsId,source FROM ne,_ne WHERE ne.id = $1 AND _ne.tsId = ne.historicalTsId AND ne.delete = false"
      );
      ddp.bindVarchar(1, neId);
      let ddRead = await ddp.runAndReadAll();
      let ddRows = ddRead.getRows();
      if (ddRows.length > 0) {
        if (predicted != null) {
          /*
DELETE FROM _nePortCoax WHERE nePortTsId IN (SELECT tsId FROM nePort,_nePort WHERE nePort.neId = '7a1a6b0c-01ec-41f2-8459-75784228f30d' AND _nePort.nePortId = nePort.id AND _nePort.source = 'predicted');
DELETE FROM _nePortEthernet WHERE nePortTsId IN (SELECT tsId FROM nePort,_nePort WHERE nePort.neId = '7a1a6b0c-01ec-41f2-8459-75784228f30d' AND _nePort.nePortId = nePort.id AND _nePort.source = 'predicted');
DELETE FROM _nePortLoopback WHERE nePortTsId IN (SELECT tsId FROM nePort,_nePort WHERE nePort.neId = '7a1a6b0c-01ec-41f2-8459-75784228f30d' AND _nePort.nePortId = nePort.id AND _nePort.source = 'predicted');
DELETE FROM _nePortFiber WHERE nePortTsId IN (SELECT tsId FROM nePort,_nePort WHERE nePort.neId = '7a1a6b0c-01ec-41f2-8459-75784228f30d' AND _nePort.nePortId = nePort.id AND _nePort.source = 'predicted');
DELETE FROM _nePortXdsl WHERE nePortTsId IN (SELECT tsId FROM nePort,_nePort WHERE nePort.neId = '7a1a6b0c-01ec-41f2-8459-75784228f30d' AND _nePort.nePortId = nePort.id AND _nePort.source = 'predicted');
DELETE FROM _nePortVirtual WHERE nePortTsId IN (SELECT tsId FROM nePort,_nePort WHERE nePort.neId = '7a1a6b0c-01ec-41f2-8459-75784228f30d' AND _nePort.nePortId = nePort.id AND _nePort.source = 'predicted');
DELETE FROM _nePort WHERE nePortId IN (SELECT id FROM nePort,_nePort WHERE nePort.neId = '7a1a6b0c-01ec-41f2-8459-75784228f30d' AND _nePort.nePortId = nePort.id) AND _nePort.source = 'predicted';
UPDATE nePort SET predictedTsId = NULL WHERE neId = '7a1a6b0c-01ec-41f2-8459-75784228f30d';
DELETE FROM _ne WHERE neId = '7a1a6b0c-01ec-41f2-8459-75784228f30d' AND source = 'predicted';
UPDATE ne SET predictedTsId = NULL WHERE id = '7a1a6b0c-01ec-41f2-8459-75784228f30d';
          */
          await DDC.run(
            "DELETE FROM _nePortCoax WHERE nePortTsId IN (SELECT tsId FROM nePort,_nePort WHERE nePort.neId = '" +
              neId +
              "' AND _nePort.nePortId = nePort.id AND _nePort.source = 'predicted')"
          );
          await DDC.run(
            "DELETE FROM _nePortEthernet WHERE nePortTsId IN (SELECT tsId FROM nePort,_nePort WHERE nePort.neId = '" +
              neId +
              "' AND _nePort.nePortId = nePort.id AND _nePort.source = 'predicted')"
          );
          await DDC.run(
            "DELETE FROM _nePortLoopback WHERE nePortTsId IN (SELECT tsId FROM nePort,_nePort WHERE nePort.neId = '" +
              neId +
              "' AND _nePort.nePortId = nePort.id AND _nePort.source = 'predicted')"
          );
          await DDC.run(
            "DELETE FROM _nePortFiber WHERE nePortTsId IN (SELECT tsId FROM nePort,_nePort WHERE nePort.neId = '" +
              neId +
              "' AND _nePort.nePortId = nePort.id AND _nePort.source = 'predicted')"
          );
          await DDC.run(
            "DELETE FROM _nePortXdsl WHERE nePortTsId IN (SELECT tsId FROM nePort,_nePort WHERE nePort.neId = '" +
              neId +
              "' AND _nePort.nePortId = nePort.id AND _nePort.source = 'predicted')"
          );
          await DDC.run(
            "DELETE FROM _nePortVirtual WHERE nePortTsId IN (SELECT tsId FROM nePort,_nePort WHERE nePort.neId = '" +
              neId +
              "' AND _nePort.nePortId = nePort.id AND _nePort.source = 'predicted')"
          );
          await DDC.run(
            "DELETE FROM _nePort WHERE nePortId IN (SELECT id FROM nePort,_nePort WHERE nePort.neId = '" +
              neId +
              "' AND _nePort.nePortId = nePort.id) AND _nePort.source = 'predicted'"
          );
          await DDC.run(
            "UPDATE nePort SET predictedTsId = NULL WHERE neId = '" + neId + "'"
          );
          await DDC.run(
            "DELETE FROM _ne WHERE neId = '" +
              neId +
              "' AND source = 'predicted'"
          );
          await DDC.run(
            "UPDATE ne SET predictedTsId = NULL WHERE id = '" + neId + "'"
          );
          return 204;
        } else {
          let { status, body } = await getNe(neId, { source: source });
          if (status == 200) {
            status = await addNe(
              neId,
              jsonDeepMerge(body, { point: point, delete: "true" })
            );
          }
          return status;
        }
      } else {
        return 400;
      }
    }
  }

  async function getNe(neId, { point = null, source = "historical" } = {}) {
    // optional source = historical|predicted
    // optional point = 20250508T174124
    let datePoint = "AND _ne.tsId = ne.historicalTsId";
    if (point != null) {
      datePoint =
        "AND strftime(_ne.point,'" + pointFormat + "') = '" + point + "'";
    }
    let resJson = {};
    let ddp = await DDC.prepare(
      "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,source,strftime(point,'" +
        pointFormat +
        "'),neId,host,mgmtIP,vendor,model,image,version,strftime(commissioned,'" +
        dateFormat +
        "'),strftime(decommissioned,'" +
        dateFormat +
        "'),siteId,rackId,slotPosition FROM ne, _ne WHERE ne.id = $1 AND _ne.neId = ne.id AND ne.delete = false " +
        datePoint +
        " ORDER BY _ne.point DESC LIMIT 1"
    );
    ddp.bindVarchar(1, neId);
    let ddRead = await ddp.runAndReadAll();
    let ddRows = ddRead.getRows();
    if (ddRows.length > 0) {
      resJson = {
        neId: neId,
        point: ddRows[0][6],
        host: ddRows[0][8],
        commissioned: ddRows[0][14],
        siteId: ddRows[0][16],
        rackId: ddRows[0][17],
        slotPosition: toInteger(ddRows[0][18]),
        mgmtIP: ddRows[0][9],
        vendor: ddRows[0][10],
        model: ddRows[0][11],
        image: ddRows[0][12],
        version: ddRows[0][13],
        ports: [],
        source: ddRows[0][5],
        delete: toBoolean(ddRows[0][1]),
      };
      if (ddRows[0][15] != null) {
        resJson.decommissioned = ddRows[0][15];
      }

      datePoint = "AND _nePort.tsId = nePort.historicalTsId";
      switch (source) {
        case "historical":
          datePoint = "AND _nePort.tsId = nePort.historicalTsId";
          break;
        case "predicted":
          datePoint = "AND _nePort.tsId = nePort.predictedTsId";
          break;
      }
      if (point != null) {
        datePoint +=
          " AND strftime(_nePort.point,'" +
          pointFormat +
          "') = '" +
          point +
          "'";
      }
      let ddn = await DDC.prepare(
        "SELECT _nePort.tsId,_nePort.name,_nePort.technology,_nePort.state,nePort.historicalTsId,nePort.predictedTsId FROM nePort,_nePort WHERE nePort.neId = $1 AND _nePort.neId = nePort.neId AND nePort.delete = false " +
          datePoint +
          " ORDER BY _nePort.point DESC"
      );
      ddn.bindVarchar(1, ddRows[0][0]);
      let ddPort = await ddn.runAndReadAll();
      let ddPortRows = ddPort.getRows();
      for (let idx in ddPortRows) {
        let resPort = {};
        switch (ddPortRows[idx][2]) {
          case "coax":
            let ddCoax = await DDC.prepare(
              "SELECT frequencyLow,frequencyHigh,channels,width,unit FROM _nePortCoax WHERE nePortTsId = " +
                ddPortRows[idx][0]
            );
            let ddCoaxRows = ddCoax.getRows();
            if (ddCoaxRows.length > 0) {
              resPort = {
                name: ddPortRows[idx][1],
                technology: ddPortRows[idx][2],
                state: ddPortRows[idx][3],
                configuration: {
                  frequencyRange: {
                    low: toDecimal(ddCoaxRows[0][0]),
                    high: toDecimal(ddCoaxRows[0][1]),
                  },
                  channels: toDecimal(ddCoaxRows[0][2]),
                  width: toDecimal(ddCoaxRows[0][3]),
                  unit: ddCoaxRows[0][4],
                },
              };
            }
            break;
          case "ethernet":
            let ddEthernet = await DDC.runAndReadAll(
              "SELECT category,rate,unit FROM _nePortEthernet WHERE nePortTsId = " +
                ddPortRows[idx][0]
            );
            let ddEthernetRows = ddEthernet.getRows();
            if (ddEthernetRows.length > 0) {
              resPort = {
                name: ddPortRows[idx][1],
                technology: ddPortRows[idx][2],
                state: ddPortRows[idx][3],
                configuration: {
                  category: ddEthernetRows[0][0],
                  rate: toInteger(ddEthernetRows[0][1]),
                  unit: ddEthernetRows[0][2],
                },
              };
            }
            break;
          case "loopback":
            let ddLoopback = await DDC.runAndReadAll(
              "SELECT rate,unit FROM _nePortLoopback WHERE nePortTsId = " +
                ddPortRows[idx][0]
            );
            let ddLoopbackRows = ddLoopback.getRows();
            if (ddLoopbackRows.length > 0) {
              resPort = {
                name: ddPortRows[idx][1],
                technology: ddPortRows[idx][2],
                state: ddPortRows[idx][3],
                configuration: {
                  rate: toInteger(ddLoopbackRows[0][0]),
                  unit: ddLoopbackRows[0][1],
                },
              };
            }
            break;
          case "fiber":
            let ddFiber = await DDC.runAndReadAll(
              "SELECT rate,unit,mode,channels,width FROM _nePortFiber WHERE nePortTsId = " +
                ddPortRows[idx][0]
            );
            let ddFiberRows = ddFiber.getRows();
            if (ddFiberRows.length > 0) {
              resPort = {
                name: ddPortRows[idx][1],
                technology: ddPortRows[idx][2],
                state: ddPortRows[idx][3],
                configuration: {
                  rate: toInteger(ddFiberRows[0][0]),
                  unit: ddFiberRows[0][1],
                  mode: ddFiberRows[0][2],
                  width: toInteger(ddFiberRows[0][3]),
                  channels: toInteger(ddFiberRows[0][4]),
                },
              };
            }
            break;
          case "xdsl":
            let ddXdsl = await DDC.runAndReadAll(
              "SELECT category,rate,unit FROM _nePortXdsl WHERE nePortTsId = " +
                ddPortRows[idx][0]
            );
            let ddXdslRows = ddXdsl.getRows();
            if (ddXdslRows.length > 0) {
              resPort = {
                name: ddPortRows[idx][1],
                technology: ddPortRows[idx][2],
                state: ddPortRows[idx][3],
                configuration: {
                  category: ddXdslRows[0][0],
                  rate: toInteger(ddXdslRows[0][1]),
                  unit: ddXdslRows[0][2],
                },
              };
            }
            break;
          case "virtual":
            let ddVirtual = await DDC.runAndReadAll(
              "SELECT rate,unit FROM _nePortVirtual WHERE nePortTsId = " +
                ddPortRows[idx][0]
            );
            let ddVirtualRows = ddVirtual.getRows();
            if (ddVirtualRows.length > 0) {
              resPort = {
                name: ddPortRows[idx][1],
                technology: ddPortRows[idx][2],
                state: ddPortRows[idx][3],
                configuration: {
                  rate: toInteger(ddVirtualRows[0][0]),
                  unit: ddVirtualRows[0][1],
                },
              };
            }
            break;
        }
        resJson.ports.push(resPort);
      }
      return { status: 200, body: resJson };
    } else {
      return { status: 404, body: null };
    }
  }

  async function getSingleNe(req, res, next) {
    try {
      let result = validationResult(req);
      let options = { source: "historical", point: null };
      if (result.isEmpty()) {
        if (req.query?.point != null) {
          options.point = req.query.point;
        }
        let { status, body } = await getNe(req.params.neId, options);
        if (status == 200) {
          res.contentType(OAS.mimeJSON).status(status).json(body);
        } else if (status == 404) {
          res
            .contentType(OAS.mimeJSON)
            .status(status)
            .json({
              errors: "neId " + req.params.neId + " does not exist",
            });
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(status)
            .json({
              errors: "neId " + req.params.neId,
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getNeTimeline(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddp = await DDC.prepare(
          "SELECT strftime(point,'" +
            pointFormat +
            "'),source FROM ne, _ne WHERE id = $1 AND neId = id AND delete = false ORDER BY point DESC"
        );
        ddp.bindVarchar(1, req.params.neId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let resJson = [];
          for (let idx in ddRows) {
            resJson.push({ point: ddRows[idx][0], source: ddRows[idx][1] });
          }
          resJson = Array.from(new Set(resJson.map(JSON.stringify)))
            .map(JSON.parse)
            .sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "neId " + req.params.neId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateSingleNe(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.body?.siteId != null) {
          if (!(await dbIdExists(req.body.siteId, "site"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "siteId " + req.body.siteId + " does not exist",
              });
          }
        }
        if (req.body?.rackId != null) {
          if (!(await dbIdExists(req.body.rackId, "rack"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "rackId " + req.body.rackId + " does not exist",
              });
          }
        }
        let { status, body } = await getNe(req.params.neId);
        if (status == 200 && body != null) {
          let point = dayjs().format(dayjsFormat);
          if (req.body?.point != null) {
            point = req.body.point;
          }
          req.body = jsonDeepMerge(req.body, { point: point });
          req.body = jsonDeepMerge(body, req.body);
          return next();
        } else if (status == 404) {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "neId " + req.params.neId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function replaceSingleNe(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.body?.siteId != null) {
          if (!(await dbIdExists(req.body.siteId, "site"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "siteId " + req.body.siteId + " does not exist",
              });
          }
        }
        if (req.body?.rackId != null) {
          if (!(await dbIdExists(req.body.rackId, "rack"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "rackId " + req.body.rackId + " does not exist",
              });
          }
        }
        let ddRead = await DDC.runAndReadAll(
          "SELECT id FROM ne WHERE id = '" + req.params.neId + "'"
        );
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let status = await addNe(req.params.neId, req.body);
          if (status == 200) {
            if (req.body.source == "historical") {
              await dbAddPredictQueueItem("ne", req.params.neId, "update");
            }
            return res.sendStatus(204);
          } else {
            res.sendStatus(status);
          }
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "neId " + req.params.neId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getMultipleNe(req, res, next) {
    try {
      let resJson = [];
      let ddRead = await DDC.runAndReadAll(
        "SELECT id,strftime(point,'" +
          pointFormat +
          "'),source FROM ne, _ne WHERE _ne.neId = ne.id ORDER BY _ne.point DESC"
      );
      let ddRows = ddRead.getRows();
      if (ddRows.length > 0) {
        for (let idx in ddRows) {
          let { status, body } = await getNe(ddRows[idx][0], {
            point: ddRows[idx][1],
            source: ddRows[idx][2],
          });
          if (status == 200) {
            resJson.push(body);
          }
        }
        resJson = jsonSortByMultiKeys(resJson, ["point", "source"]);
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res.sendStatus(204);
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addMultipleNe(req, res, next) {
    try {
      let result = validationResult(req);
      let resJson = [];
      if (result.isEmpty()) {
        req.body = jsonSortByMultiKeys(req.body, ["point", "source"]);
        for (let i = 0; i < req.body.length; i++) {
          if (req.body[i]?.siteId != null) {
            if (!(await dbIdExists(req.body[i].siteId, "site"))) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors: "siteId " + req.body[i].siteId + " does not exist",
                });
            }
          }
          if (req.body[i]?.rackId != null) {
            if (!(await dbIdExists(req.body[i].rackId, "rack"))) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors: "rackId " + req.body[i].rackId + " does not exist",
                });
            }
          }
        }
        for (let i = 0; i < req.body.length; i++) {
          let status = await deleteNe(req.body[i].neId, { expunge: true });
          status = await addNe(req.body[i].neId, req.body[i]);
          if (status == 200) {
            if (req.body[i].source == "historical") {
              await dbAddPredictQueueItem("ne", req.body[i].neId, "create");
            }
            resJson.push(req.body[i].neId);
          } else {
            return res
              .contentType(OAS.mimeJSON)
              .status(status)
              .json({
                errors: "neId " + req.params.neId,
              });
          }
        }
        resJson = Array.from(new Set(resJson.map(JSON.stringify)))
          .map(JSON.parse)
          .sort();
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllPole(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let resJson = [];
        let ddRead = await DDC.runAndReadAll(
          "SELECT id FROM pole WHERE delete = false"
        );
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            resJson.push(ddRows[idx][0]);
          }
          resJson.sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getPolesSimpleStatistics(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        res
          .contentType(OAS.mimeJSON)
          .status(200)
          .json(await dbActiveInactiveCounts("pole"));
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addSinglePole(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.body.connectsTo?.siteId != null) {
          if (!(await dbIdExists(req.body.connectsTo.siteId, "site"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "siteId " + req.body.connectsTo.siteId + " does not exist",
              });
          }
        }
        if (req.body.connectsTo?.trenchId != null) {
          if (!(await dbIdExists(req.body.connectsTo.trenchId, "trench"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "trenchId " +
                  req.body.connectsTo.trenchId +
                  " does not exist",
              });
          }
        }
        if (req.body.connectsTo?.poleId != null) {
          if (!(await dbIdExists(req.body.connectsTo.poleId, "pole"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "poleId " + req.body.connectsTo.poleId + " does not exist",
              });
          }
        }

        let poleId = uuidv4();
        let tsId = await getSeqNextValue("seq_pole");
        let tsCol = "historicalTsId";

        switch (req.body.source) {
          case "historical":
            tsCol = "historicalTsId";
            break;
          case "predicted":
            tsCol = "predictedTsId";
            break;
          default:
            tsCol = "historicalTsId";
        }

        let ddp = await DDC.prepare(
          "INSERT INTO pole (id,delete," +
            tsCol +
            ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
        );
        ddp.bindVarchar(1, poleId);
        ddp.bindBoolean(2, toBoolean(body.delete));
        ddp.bindInteger(3, tsId);
        ddp.bindVarchar(4, req.body.point);
        ddp.bindVarchar(5, pointFormat);
        await ddp.run();

        ddp = await DDC.prepare(
          "INSERT INTO _pole (tsId,point,source,poleId,purpose,height,classifier,unit,premisesPassed,area,state,x,y,z,plannedDuration,actualDuration,plannedUnit,actualUnit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)"
        );
        ddp.bindInteger(1, tsId);
        ddp.bindVarchar(2, req.body.point);
        ddp.bindVarchar(3, pointFormat);
        ddp.bindVarchar(4, req.body.source);
        ddp.bindVarchar(5, poleId);
        ddp.bindVarchar(6, req.body.purpose);
        ddp.bindFloat(7, toDecimal(req.body.construction.height));
        ddp.bindVarchar(8, req.body.construction.classifier);
        ddp.bindVarchar(9, req.body.construction.unit);
        ddp.bindInteger(10, toInteger(req.body.demographics.premises.passed));
        ddp.bindVarchar(11, req.body.demographics.premises.area);
        ddp.bindVarchar(12, req.body.state);
        ddp.bindFloat(
          13,
          toDecimal(req.body.coordinate.x, OAS.X_scale, OAS.XY_precision)
        );
        ddp.bindFloat(
          14,
          toDecimal(req.body.coordinate.y, OAS.Y_scale, OAS.XY_precision)
        );
        ddp.bindFloat(
          15,
          toDecimal(req.body.coordinate.z, OAS.Z_scale, OAS.Z_precision)
        );
        ddp.bindInteger(16, toInteger(req.body.build.planned.duration));
        ddp.bindInteger(17, toInteger(req.body.build.actual.duration));
        ddp.bindVarchar(18, req.body.build.planned.unit);
        ddp.bindVarchar(19, req.body.build.actual.unit);
        await ddp.run();
        if (req.body.build?.jobId != null) {
          await DDC.run(
            "UPDATE _pole SET jobId = '" +
              req.body.build.jobId +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.build?.permitId != null) {
          await DDC.run(
            "UPDATE _pole SET permitId = '" +
              req.body.build.permitId +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.build?.planned?.start != null) {
          await DDC.run(
            "UPDATE _pole SET plannedStart = strptime('" +
              req.body.build.planned.start +
              "','" +
              dateFormat +
              "') WHERE tsId = " +
              tsId
          );
        }
        if (req.body.build?.planned?.completion != null) {
          await DDC.run(
            "UPDATE _pole SET plannedCompletion = strptime('" +
              req.body.build.planned.completion +
              "','" +
              dateFormat +
              "') WHERE tsId = " +
              tsId
          );
        }
        if (req.body.build?.actual?.start != null) {
          await DDC.run(
            "UPDATE _pole SET actualStart = strptime('" +
              req.body.build.actual.start +
              "','" +
              dateFormat +
              "') WHERE tsId = " +
              tsId
          );
        }
        if (req.body.build?.actual?.completion != null) {
          await DDC.run(
            "UPDATE _pole SET actualCompletion = strptime('" +
              req.body.build.actual.completion +
              "','" +
              dateFormat +
              "') WHERE tsId = " +
              tsId
          );
        }
        if (req.body.coordinate?.m != null) {
          await DDC.run(
            "UPDATE _pole SET M = '" +
              req.body.coordinate.m +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.connectsTo?.siteId != null) {
          await DDC.run(
            "UPDATE _pole SET connectsToSiteId = '" +
              req.body.connectsTo.siteId +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.connectsTo?.trenchId != null) {
          await DDC.run(
            "UPDATE _pole SET connectsToTrenchId = '" +
              req.body.connectsTo.trenchId +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.connectsTo?.poleId != null) {
          await DDC.run(
            "UPDATE _pole SET connectsToPoleId = '" +
              req.body.connectsTo.poleId +
              "' WHERE tsId = " +
              tsId
          );
        }
        res.contentType(OAS.mimeJSON).status(200).json({ poleId: poleId });
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getPolesCapacityState(req, res, next) {
    // TODO
    res.sendStatus(405);
  }

  async function deleteSinglePole(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        // recover (restore) previously deleted if still exists
        if (req.query?.restore != null) {
          let point = dayjs().format(dayjsFormat);
          let ddRead = await DDC.runAndReadAll(
            "SELECT pole.id FROM pole,_pole WHERE pole.id = '" +
              req.params.poleId +
              "' AND _pole.poleId = pole.id AND _pole.source = 'historical' AND duct.delete = true LIMIT 1"
          );
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            await DDC.run(
              "UPDATE pole SET tsPoint = strptime('" +
                point +
                "','" +
                pointFormat +
                "'), delete = false WHERE id = '" +
                req.params.poleId +
                "'"
            );
            await dbAddPredictQueueItem("pole", req.params.poleId, "undelete");
            res.sendStatus(204);
          } else {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "poleId " + req.params.poleId + " does not exist",
              });
          }
        } else {
          let ddp = await DDC.prepare(
            "SELECT id,tsPoint,historicalTsId,predictedTsId,source FROM pole,_pole WHERE pole.id = $1 AND _pole.tsId = pole.historicalTsId AND pole.delete = false"
          );
          ddp.bindVarchar(1, req.params.poleId);
          let ddRead = await ddp.runAndReadAll();
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            if (req.query?.predicted != null) {
              await DDC.run(
                "DELETE FROM _pole WHERE poleId = '" +
                  req.params.poleId +
                  "' and source = 'predicted'"
              );
              await DDC.run(
                "UPDATE duct SET predictedTsId = NULL WHERE id = '" +
                  req.params.ductId +
                  "'"
              );
              res.sendStatus(204);
            } else {
              let point = dayjs().format(dayjsFormat);
              let tsId = await getSeqNextValue("seq_pole");
              let tsCol = "historicalTsId";
              switch (ddRows[0][4]) {
                case "historical":
                  tsCol = "historicalTsId";
                  break;
                case "predicted":
                  tsCol = "predictedTsId";
                  break;
              }
              let ddp = await DDC.prepare(
                "INSERT INTO _pole (tsId,point,source,poleId,purpose,height,classifier,unit,premisesPassed,area,jobId,permitId,plannedStart,plannedCompletion,plannedDuration,plannedUnit,actualStart,actualCompletion,actualDuration,actualUnit,state,connectsToSiteId,connectsToTrenchId,connectsToPoleId,X,Y,Z,M,geoPoint) SELECT $1,strptime($2,$3),source,poleId,purpose,height,classifier,unit,premisesPassed,area,jobId,permitId,plannedStart,plannedCompletion,plannedDuration,plannedUnit,actualStart,actualCompletion,actualDuration,actualUnit,state,connectsToSiteId,connectsToTrenchId,connectsToPoleId,X,Y,Z,M,geoPoint FROM _pole WHERE tsId = $4"
              );
              ddp.bindInteger(1, tsId);
              ddp.bindVarchar(2, point);
              ddp.bindVarchar(3, pointFormat);
              ddp.bindInteger(4, ddRows[0][2]);
              await ddp.run();
              await DDC.run(
                "UPDATE pole SET " +
                  tsCol +
                  " = " +
                  tsId +
                  ", tsPoint = strptime('" +
                  point +
                  "','" +
                  pointFormat +
                  "'), delete = true WHERE id = '" +
                  req.params.poleId +
                  "'"
              );
              await dbAddPredictQueueItem("pole", req.params.poleId, "delete");
              res.sendStatus(204);
            }
          } else {
            res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "poleId " + req.params.poleId + " does not exist",
              });
          }
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSinglePole(req, res, next) {
    let datePoint = "AND _pole.tsId = pole.historicalTsId";
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.query?.point != null) {
          datePoint =
            "AND strftime(_pole.point,'" +
            pointFormat +
            "') = '" +
            req.query.point +
            "'";
        }
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,source,purpose,height,classifier,unit,premisesPassed,area,jobId,permitId,strftime(plannedStart,'" +
            dateFormat +
            "'),strftime(plannedCompletion,'" +
            dateFormat +
            "'),plannedDuration,plannedUnit,strftime(actualStart,'" +
            dateFormat +
            "'),strftime(actualCompletion,'" +
            dateFormat +
            "'),actualDuration,actualUnit,state,connectsToSiteId,connectsToTrenchId,connectsToPoleId," +
            "X,Y,Z,M,strftime(point,'" +
            pointFormat +
            "') FROM pole,_pole WHERE pole.id = $1 AND _pole.poleId = pole.id AND pole.delete = false " +
            datePoint +
            " ORDER BY _pole.point DESC LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.poleId);
        let ddPole = await ddp.runAndReadAll();
        let ddRows = ddPole.getRows();
        if (ddRows.length > 0) {
          resJson = {
            poleId: req.params.poleId,
            point: ddRows[0][30],
            purpose: ddRows[0][6],
            construction: {
              height: toDecimal(ddRows[0][7]),
              unit: ddRows[0][9],
              classifier: ddRows[0][8],
            },
            demographics: {
              premises: {
                passed: toInteger(ddRows[0][10]),
                area: ddRows[0][11],
              },
            },
            build: {
              planned: {
                duration: toInteger(ddRows[0][16]),
                unit: ddRows[0][17],
              },
              actual: {
                duration: toInteger(ddRows[0][20]),
                unit: ddRows[0][21],
              },
            },
            state: ddRows[0][22],
            connectsTo: {},
            coordinate: {
              x: toDecimal(ddRows[0][26], OAS.X_scale, OAS.XY_precision),
              y: toDecimal(ddRows[0][27], OAS.Y_scale, OAS.XY_precision),
              z: toDecimal(ddRows[0][28], OAS.Z_scale, OAS.Z_precision),
            },
            source: ddRows[0][5],
            delete: toBoolean(ddRows[0][1]),
          };
          if (ddRows[0][12] != null) {
            resJson.build.jobId = ddRows[0][12];
          }
          if (ddRows[0][13] != null) {
            resJson.build.permitId = ddRows[0][13];
          }
          if (ddRows[0][14] != null) {
            resJson.build.planned.start = ddRows[0][14];
          }
          if (ddRows[0][15] != null) {
            resJson.build.planned.completion = ddRows[0][15];
          }
          if (ddRows[0][18] != null) {
            resJson.build.actual.start = ddRows[0][18];
          }
          if (ddRows[0][19] != null) {
            resJson.build.actual.completion = ddRows[0][19];
          }
          if (ddRows[0][23] != null) {
            resJson.connectsTo.siteId = ddRows[0][23];
          }
          if (ddRows[0][24] != null) {
            resJson.connectsTo.trenchId = ddRows[0][24];
          }
          if (ddRows[0][25] != null) {
            resJson.connectsTo.poleId = ddRows[0][25];
          }
          if (ddRows[0][29] != null) {
            resJson.coordinate.m = ddRows[0][29];
          }
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "poleId " + req.params.poleId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getPoleTimeline(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddp = await DDC.prepare(
          "SELECT strftime(point,'" +
            pointFormat +
            "'),source FROM pole, _pole WHERE id = $1 AND poleId = id AND delete = false ORDER BY point DESC"
        );
        ddp.bindVarchar(1, req.params.poleId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let resJson = [];
          for (let idx in ddRows) {
            resJson.push({ point: ddRows[idx][0], source: ddRows[idx][1] });
          }
          resJson = Array.from(new Set(resJson.map(JSON.stringify)))
            .map(JSON.parse)
            .sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "poleId " + req.params.poleId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateSinglePole(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.body.connectsTo?.siteId != null) {
          if (!(await dbIdExists(req.body.connectsTo.siteId, "site"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "siteId " + req.body.connectsTo.siteId + " does not exist",
              });
          }
        }
        if (req.body.connectsTo?.trenchId != null) {
          if (!(await dbIdExists(req.body.connectsTo.trenchId, "trench"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "trenchId " +
                  req.body.connectsTo.trenchId +
                  " does not exist",
              });
          }
        }
        if (req.body.connectsTo?.poleId != null) {
          if (!(await dbIdExists(req.body.connectsTo.poleId, "pole"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "poleId " + req.body.connectsTo.poleId + " does not exist",
              });
          }
        }
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,source,purpose,height,classifier,unit,premisesPassed,area,jobId,permitId,strftime(plannedStart,'" +
            dateFormat +
            "'),strftime(plannedCompletion,'" +
            dateFormat +
            "'),plannedDuration,plannedUnit,strftime(actualStart,'" +
            dateFormat +
            "'),strftime(actualCompletion,'" +
            dateFormat +
            "'),actualDuration,actualUnit,state,connectsToSiteId,connectsToTrenchId,connectsToPoleId," +
            "X,Y,Z,M,strftime(point,'" +
            pointFormat +
            "') FROM pole,_pole WHERE pole.id = $1 AND _pole.tsId = pole.historicalTsId AND pole.delete = false LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.poleId);
        let ddPole = await ddp.runAndReadAll();
        let ddRows = ddPole.getRows();
        if (ddRows.length > 0) {
          resJson = {
            poleId: req.params.poleId,
            purpose: ddRows[0][6],
            point: ddRows[0][30],
            construction: {
              height: toDecimal(ddRows[0][7]),
              unit: ddRows[0][9],
              classifier: ddRows[0][8],
            },
            demographics: {
              premises: {
                passed: toInteger(ddRows[0][10]),
                area: ddRows[0][11],
              },
            },
            build: {
              planned: {
                duration: toInteger(ddRows[0][16]),
                unit: ddRows[0][17],
              },
              actual: {
                duration: toInteger(ddRows[0][20]),
                unit: ddRows[0][21],
              },
            },
            state: ddRows[0][22],
            connectsTo: {},
            coordinate: {
              x: toDecimal(ddRows[0][26], OAS.X_scale, OAS.XY_precision),
              y: toDecimal(ddRows[0][27], OAS.Y_scale, OAS.XY_precision),
              z: toDecimal(ddRows[0][28], OAS.Z_scale, OAS.Z_precision),
            },
            source: ddRows[0][5],
            delete: toBoolean(ddRows[0][1]),
          };
          if (ddRows[0][12] != null) {
            resJson.build.jobId = ddRows[0][12];
          }
          if (ddRows[0][13] != null) {
            resJson.build.permitId = ddRows[0][13];
          }
          if (ddRows[0][14] != null) {
            resJson.build.planned.start = ddRows[0][14];
          }
          if (ddRows[0][15] != null) {
            resJson.build.planned.completion = ddRows[0][15];
          }
          if (ddRows[0][18] != null) {
            resJson.build.actual.start = ddRows[0][18];
          }
          if (ddRows[0][19] != null) {
            resJson.build.actual.completion = ddRows[0][19];
          }
          if (ddRows[0][23] != null) {
            resJson.connectsTo.siteId = ddRows[0][23];
          }
          if (ddRows[0][24] != null) {
            resJson.connectsTo.trenchId = ddRows[0][24];
          }
          if (ddRows[0][25] != null) {
            resJson.connectsTo.poleId = ddRows[0][25];
          }
          if (ddRows[0][29] != null) {
            resJson.coordinate.m = ddRows[0][29];
          }
          // pass to replace to regenerate the record
          req.body = jsonDeepMerge(resJson, req.body);
          return next();
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "poleId " + req.params.poleId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function replaceSinglePole(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.body.connectsTo?.siteId != null) {
          if (!(await dbIdExists(req.body.connectsTo.siteId, "site"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "siteId " + req.body.connectsTo.siteId + " does not exist",
              });
          }
        }
        if (req.body.connectsTo?.trenchId != null) {
          if (!(await dbIdExists(req.body.connectsTo.trenchId, "trench"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "trenchId " +
                  req.body.connectsTo.trenchId +
                  " does not exist",
              });
          }
        }
        if (req.body.connectsTo?.poleId != null) {
          if (!(await dbIdExists(req.body.connectsTo.poleId, "pole"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "poleId " + req.body.connectsTo.poleId + " does not exist",
              });
          }
        }

        let ddp = await DDC.prepare(
          "SELECT id,delete,historicalTsId,predictedTsId FROM pole WHERE id = $1 LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.poleId);
        let ddPole = await ddp.runAndReadAll();
        let ddPoleRows = ddPole.getRows();
        if (ddPoleRows.length > 0) {
          let point = dayjs().format(dayjsFormat);
          let tsId = await getSeqNextValue("seq_pole");
          let tsCol = "historicalTsId";
          switch (req.body.source) {
            case "historical":
              tsCol = "historicalTsId";
              break;
            case "predicted":
              tsCol = "predictedTsId";
              break;
          }

          let ddp = await DDC.prepare(
            "UPDATE pole SET " +
              tsCol +
              " = $1, tsPoint = strptime($2,$3) WHERE id = $4"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body.point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.params.poleId);
          await ddp.run();

          ddp = await DDC.prepare(
            "INSERT INTO _pole (tsId,point,source,poleId,purpose,height,classifier,unit,premisesPassed,area,state,x,y,z,plannedDuration,actualDuration,plannedUnit,actualUnit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body.point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.body.source);
          ddp.bindVarchar(5, req.params.poleId);
          ddp.bindVarchar(6, req.body.purpose);
          ddp.bindFloat(7, toDecimal(req.body.construction.height));
          ddp.bindVarchar(8, req.body.construction.classifier);
          ddp.bindVarchar(9, req.body.construction.unit);
          ddp.bindInteger(10, toInteger(req.body.demographics.premises.passed));
          ddp.bindVarchar(11, req.body.demographics.premises.area);
          ddp.bindVarchar(12, req.body.state);
          ddp.bindFloat(
            13,
            toDecimal(req.body.coordinate.x, OAS.X_scale, OAS.XY_precision)
          );
          ddp.bindFloat(
            14,
            toDecimal(req.body.coordinate.y, OAS.Y_scale, OAS.XY_precision)
          );
          ddp.bindFloat(
            15,
            toDecimal(req.body.coordinate.z, OAS.Z_scale, OAS.Z_precision)
          );

          ddp.bindInteger(16, toInteger(req.body.build.planned.duration));
          ddp.bindInteger(17, toInteger(req.body.build.actual.duration));
          ddp.bindVarchar(18, req.body.build.planned.unit);
          ddp.bindVarchar(19, req.body.build.actual.unit);
          await ddp.run();
          if (req.body.build?.jobId != null) {
            await DDC.run(
              "UPDATE _pole SET jobId = '" +
                req.body.build.jobId +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.build?.permitId != null) {
            await DDC.run(
              "UPDATE _pole SET permitId = '" +
                req.body.build.permitId +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.build?.planned?.start != null) {
            await DDC.run(
              "UPDATE _pole SET plannedStart = strptime('" +
                req.body.build.planned.start +
                "','" +
                dateFormat +
                "') WHERE tsId = " +
                tsId
            );
          }
          if (req.body.build?.planned?.completion != null) {
            await DDC.run(
              "UPDATE _pole SET plannedCompletion = strptime('" +
                req.body.build.planned.completion +
                "','" +
                dateFormat +
                "') WHERE tsId = " +
                tsId
            );
          }
          if (req.body.build?.actual?.start != null) {
            await DDC.run(
              "UPDATE _pole SET actualStart = strptime('" +
                req.body.build.actual.start +
                "','" +
                dateFormat +
                "') WHERE tsId = " +
                tsId
            );
          }
          if (req.body.build?.actual?.completion != null) {
            await DDC.run(
              "UPDATE _pole SET actualCompletion = strptime('" +
                req.body.build.actual.completion +
                "','" +
                dateFormat +
                "') WHERE tsId = " +
                tsId
            );
          }
          if (req.body.coordinate?.m != null) {
            await DDC.run(
              "UPDATE _pole SET M = '" +
                req.body.coordinate.m +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.connectsTo?.siteId != null) {
            await DDC.run(
              "UPDATE _pole SET connectsToSiteId = '" +
                req.body.connectsTo.siteId +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.connectsTo?.trenchId != null) {
            await DDC.run(
              "UPDATE _pole SET connectsToTrenchId = '" +
                req.body.connectsTo.trenchId +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.connectsTo?.poleId != null) {
            await DDC.run(
              "UPDATE _pole SET connectsToPoleId = '" +
                req.body.connectsTo.poleId +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.source == "historical") {
            await dbAddPredictQueueItem("pole", req.params.poleId, "update");
          }
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "poleId " + req.params.poleId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getMultiplePoles(req, res, next) {
    try {
      let resJson = [];
      let ddp = await DDC.runAndReadAll(
        "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,source,purpose,height,classifier,unit,premisesPassed,area,jobId,permitId,strftime(plannedStart,'" +
          dateFormat +
          "'),strftime(plannedCompletion,'" +
          dateFormat +
          "'),plannedDuration,plannedUnit,strftime(actualStart,'" +
          dateFormat +
          "'),strftime(actualCompletion,'" +
          dateFormat +
          "'),actualDuration,actualUnit,state,connectsToSiteId,connectsToTrenchId,connectsToPoleId," +
          "X,Y,Z,M,strftime(point,'" +
          pointFormat +
          "') FROM pole,_pole WHERE _pole.poleId = pole.id ORDER BY _pole.point"
      );
      let ddRows = ddp.getRows();
      if (ddRows.length > 0) {
        for (let idx in ddRows) {
          let resObj = {
            poleId: ddRows[idx][0],
            purpose: ddRows[idx][6],
            construction: {
              height: toDecimal(ddRows[idx][7]),
              unit: ddRows[idx][9],
              classifier: ddRows[idx][8],
            },
            demographics: {
              premises: {
                passed: toInteger(ddRows[idx][10]),
                area: ddRows[idx][11],
              },
            },
            build: {
              planned: {
                duration: toInteger(ddRows[idx][16]),
                unit: ddRows[idx][17],
              },
              actual: {
                duration: toInteger(ddRows[idx][20]),
                unit: ddRows[idx][21],
              },
            },
            state: ddRows[idx][22],
            connectsTo: {},
            coordinate: {
              x: toDecimal(ddRows[idx][26], OAS.X_scale, OAS.XY_precision),
              y: toDecimal(ddRows[idx][27], OAS.Y_scale, OAS.XY_precision),
              z: toDecimal(ddRows[idx][28], OAS.Z_scale, OAS.Z_precision),
            },
            point: ddRows[idx][30],
            source: ddRows[idx][5],
            delete: toBoolean(ddRows[idx][1]),
          };
          if (ddRows[idx][12] != null) {
            resObj.build.jobId = ddRows[idx][12];
          }
          if (ddRows[idx][13] != null) {
            resObj.build.permitId = ddRows[idx][13];
          }
          if (ddRows[idx][14] != null) {
            resObj.build.planned.start = ddRows[idx][14];
          }
          if (ddRows[idx][15] != null) {
            resObj.build.planned.completion = ddRows[idx][15];
          }
          if (ddRows[idx][18] != null) {
            resObj.build.actual.start = ddRows[idx][18];
          }
          if (ddRows[idx][19] != null) {
            resObj.build.actual.completion = ddRows[idx][19];
          }
          if (ddRows[idx][23] != null) {
            resObj.connectsTo.siteId = ddRows[idx][23];
          }
          if (ddRows[idx][24] != null) {
            resObj.connectsTo.trenchId = ddRows[idx][24];
          }
          if (ddRows[idx][25] != null) {
            resObj.connectsTo.poleId = ddRows[idx][25];
          }
          if (ddRows[idx][29] != null) {
            resObj.coordinate.m = ddRows[idx][29];
          }
          resJson.push(resObj);
        }
      }
      resJson = jsonSortByMultiKeys(resJson, ["point", "source"]);
      res.contentType(OAS.mimeJSON).status(200).json(resJson);
    } catch (e) {
      return next(e);
    }
  }

  async function addMultiplePoles(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        req.body = jsonSortByMultiKeys(req.body, ["point", "source"]);
        let resJson = [];
        for (let i = 0; i < req.body.length; i++) {
          let ddd = await DDC.runAndReadAll(
            "SELECT id FROM pole WHERE id = '" + req.body[i].poleId + "'"
          );
          let dddRows = ddd.getRows();
          if (dddRows.length > 0) {
            await DDC.run(
              "DELETE FROM _pole WHERE poleId = '" + req.body[i].poleId + "'"
            );
            await DDC.run(
              "UPDATE pole SET delete = false, historicalTsId = NULL, predictedTsId = NULL, tsPoint = now()::timestamp WHERE id = '" +
                req.body[i].poleId +
                "'"
            );
          }
        }
        for (let i = 0; i < req.body.length; i++) {
          let tsId = await getSeqNextValue("seq_pole");
          let tsCol = "historicalTsId";

          switch (req.body[i].source) {
            case "historical":
              tsCol = "historicalTsId";
              break;
            case "predicted":
              tsCol = "predictedTsId";
              break;
          }

          let ddq = await DDC.runAndReadAll(
            "SELECT id FROM pole WHERE id = '" + req.body[i].poleId + "'"
          );
          let ddqRows = ddq.getRows();
          if (ddqRows.length == 0) {
            let ddp = await DDC.prepare(
              "INSERT INTO pole (id,delete," +
                tsCol +
                ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
            );
            ddp.bindVarchar(1, req.body[i].poleId);
            ddp.bindBoolean(2, toBoolean(req.body[i].delete));
            ddp.bindInteger(3, tsId);
            ddp.bindVarchar(4, req.body[i].point);
            ddp.bindVarchar(5, pointFormat);
            await ddp.run();
          } else {
            let ddp = await DDC.prepare(
              "UPDATE pole SET delete = $1, " + tsCol + " = $2 WHERE id = $3"
            );
            ddp.bindBoolean(1, toBoolean(req.body[i].delete));
            ddp.bindInteger(2, tsId);
            ddp.bindVarchar(3, req.body[i].poleId);
            await ddp.run();
          }

          let ddp = await DDC.prepare(
            "INSERT INTO _pole (tsId,point,source,poleId,purpose,height,classifier,unit,premisesPassed,area,state,x,y,z,plannedDuration,actualDuration,plannedUnit,actualUnit) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body[i].point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.body[i].source);
          ddp.bindVarchar(5, req.body[i].poleId);
          ddp.bindVarchar(6, req.body[i].purpose);
          ddp.bindFloat(7, req.body[i].construction.height);
          ddp.bindVarchar(8, req.body[i].construction.classifier);
          ddp.bindVarchar(9, req.body[i].construction.unit);
          ddp.bindInteger(10, req.body[i].demographics.premises.passed);
          ddp.bindVarchar(11, req.body[i].demographics.premises.area);
          ddp.bindVarchar(12, req.body[i].state);
          ddp.bindFloat(13, req.body[i].coordinate.x);
          ddp.bindFloat(14, req.body[i].coordinate.y);
          ddp.bindFloat(15, req.body[i].coordinate.z);
          ddp.bindInteger(16, req.body[i].build.planned.duration);
          ddp.bindInteger(17, req.body[i].build.actual.duration);
          ddp.bindVarchar(18, req.body[i].build.planned.unit);
          ddp.bindVarchar(19, req.body[i].build.actual.unit);
          await ddp.run();
          if (req.body[i].build?.jobId != null) {
            await DDC.run(
              "UPDATE _pole SET jobId = '" + req.body[i].build.jobId + "'"
            );
          }
          if (req.body[i].build?.permitId != null) {
            await DDC.run(
              "UPDATE _pole SET permitId = '" + req.body[i].build.permitId + "'"
            );
          }
          if (req.body[i].build?.planned?.start != null) {
            await DDC.run(
              "UPDATE _pole SET plannedStart = strptime('" +
                req.body[i].build.planned.start +
                "','" +
                dateFormat +
                "')"
            );
          }
          if (req.body[i].build?.planned?.completion != null) {
            await DDC.run(
              "UPDATE _pole SET plannedCompletion = strptime('" +
                req.body[i].build.planned.completion +
                "','" +
                dateFormat +
                "')"
            );
          }
          if (req.body[i].build?.actual?.start != null) {
            await DDC.run(
              "UPDATE _pole SET actualStart = strptime('" +
                req.body[i].build.actual.start +
                "','" +
                dateFormat +
                "')"
            );
          }
          if (req.body[i].build?.actual?.completion != null) {
            await DDC.run(
              "UPDATE _pole SET actualCompletion = strptime('" +
                req.body[i].build.actual.completion +
                "','" +
                dateFormat +
                "')"
            );
          }
          if (req.body[i].coordinate?.m != null) {
            await DDC.run(
              "UPDATE _pole SET M = '" + req.body[i].coordinate.m + "'"
            );
          }
          if (req.body[i].connectsTo?.siteId != null) {
            if (await dbIdExists(req.body[i].connectsTo.siteId, "site")) {
              await DDC.run(
                "UPDATE _pole SET connectsToSiteId = '" +
                  req.body[i].connectsTo.siteId +
                  "'"
              );
            }
          }
          if (req.body[i].connectsTo?.trenchId != null) {
            if (await dbIdExists(req.body[i].connectsTo.trenchId, "trench")) {
              await DDC.run(
                "UPDATE _pole SET connectsToTrenchId = '" +
                  req.body[i].connectsTo.trenchId +
                  "'"
              );
            }
          }
          if (req.body[i].connectsTo?.poleId != null) {
            if (await dbIdExists(req.body[i].connectsTo.poleId, "pole")) {
              await DDC.run(
                "UPDATE _pole SET connectsToPoleId = '" +
                  req.body[i].connectsTo.poleId +
                  "'"
              );
            }
          }
          if (req.body[i].source == "historical") {
            await dbAddPredictQueueItem("pole", req.body[i].poleId, "create");
          }
          resJson.push(req.body[i].poleId);
        }
        resJson = Array.from(new Set(resJson.map(JSON.stringify)))
          .map(JSON.parse)
          .sort();
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllRacks(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let resJson = [];
        let ddRead = await DDC.runAndReadAll(
          "SELECT id FROM rack WHERE delete = false"
        );
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            resJson.push(ddRows[idx][0]);
          }
          resJson.sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getRackTimeline(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddp = await DDC.prepare(
          "SELECT strftime(point,'" +
            pointFormat +
            "'),source FROM rack, _rack WHERE id = $1 AND rackId = id AND delete = false ORDER BY point DESC"
        );
        ddp.bindVarchar(1, req.params.rackId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let resJson = [];
          for (let idx in ddRows) {
            resJson.push({ point: ddRows[idx][0], source: ddRows[idx][1] });
          }
          resJson = Array.from(new Set(resJson.map(JSON.stringify)))
            .map(JSON.parse)
            .sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "rackId " + req.params.rackid + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getRacksSimpleStatistics(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        res
          .contentType(OAS.mimeJSON)
          .status(200)
          .json(await dbActiveInactiveCounts("rack"));
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addSingleRack(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.body.siteId != null) {
          if (!(await dbIdExists(req.body.siteId, "site"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "siteId " + req.body.siteId + " does not exist",
              });
          }
        }
        if (req.body.slots.free != null) {
          if (
            toInteger(req.body.slots.free) > toInteger(req.body.slots.total)
          ) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "slots free " +
                  req.body.slots.free +
                  " can not be greater than total slots " +
                  req.body.slots.total,
              });
          }
        }
        if (req.body.slots.used != null) {
          if (
            toInteger(req.body.slots.used) > toInteger(req.body.slots.total)
          ) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "slots used " +
                  req.body.slots.used +
                  " can not be greater than total slots " +
                  req.body.slots.total,
              });
          }
        }
        if (req.body.slots.reserved != null) {
          if (
            toInteger(req.body.slots.reserved) > toInteger(req.body.slots.total)
          ) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "slots reserved " +
                  req.body.slots.reserved +
                  " can not be greater than total slots " +
                  req.body.slots.total,
              });
          }
        }
        if (req.body.slots.faulty != null) {
          if (
            toInteger(req.body.slots.faulty) > toInteger(req.body.slots.total)
          ) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "slots faulty " +
                  req.body.slots.faulty +
                  " can not be greater than total slots " +
                  req.body.slots.total,
              });
          }
        }
        let slotsConsumed =
          toInteger(req.body.slots.free) +
          toInteger(req.body.slots.used) +
          toInteger(req.body.slots.reserved) +
          toInteger(req.body.slots.faulty);
        if (slotsConsumed > toInteger(req.body.slots.total)) {
          return res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "slots consumed (free,used,reserved,faulty) " +
                slotsConsumed +
                " can not be greater than total slots " +
                req.body.slots.total,
            });
        }
        let slotsFree =
          toInteger(req.body.slots.total) -
          (toInteger(req.body.slots.used) +
            toInteger(req.body.slots.reserved) +
            toInteger(req.body.slots.faulty));
        if (slotsFree > toInteger(req.body.slots.free)) {
          req.body.slots.free = slotsFree;
        }

        let rackId = uuidv4();
        let tsId = await getSeqNextValue("seq_rack");
        let tsCol = "historicalTsId";

        switch (req.body.source) {
          case "historical":
            tsCol = "historicalTsId";
            break;
          case "predicted":
            tsCol = "predictedTsId";
            break;
          default:
            tsCol = "historicalTsId";
        }

        let ddp = await DDC.prepare(
          "INSERT INTO rack (id,delete," +
            tsCol +
            ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
        );
        ddp.bindVarchar(1, rackId);
        ddp.bindBoolean(2, toBoolean(req.body.delete));
        ddp.bindInteger(3, tsId);
        ddp.bindVarchar(4, req.body.point);
        ddp.bindVarchar(5, pointFormat);
        await ddp.run();

        ddp = await DDC.prepare(
          "INSERT INTO _rack (tsId,point,rackId,source,reference,commissioned,siteId,X,Y,Z,depth,height,width,unit,slotsTotal,slotsFree,slotsUsed,slotsReserved,slotsFaulty) VALUES ($1,strptime($2,$3),$4,$5,$6,strptime($7,$8),$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)"
        );
        ddp.bindInteger(1, tsId);
        ddp.bindVarchar(2, req.body.point);
        ddp.bindVarchar(3, pointFormat);
        ddp.bindVarchar(4, rackId);
        ddp.bindVarchar(5, req.body.source);
        ddp.bindVarchar(6, req.body.reference);
        ddp.bindVarchar(7, req.body.commissioned);
        ddp.bindVarchar(8, dateFormat);
        ddp.bindVarchar(9, req.body.siteId);
        ddp.bindFloat(
          10,
          toDecimal(req.body.coordinate.x, OAS.X_scale, OAS.XY_precision)
        );
        ddp.bindFloat(
          11,
          toDecimal(req.body.coordinate.y, OAS.Y_scale, OAS.XY_precision)
        );
        ddp.bindFloat(
          12,
          toDecimal(req.body.coordinate.z, OAS.Z_scale, OAS.Z_precision)
        );
        ddp.bindFloat(13, toDecimal(req.body.dimensions.depth));
        ddp.bindFloat(14, toDecimal(req.body.dimensions.height));
        ddp.bindFloat(15, toDecimal(req.body.dimensions.width));
        ddp.bindVarchar(16, req.body.dimensions.unit);
        ddp.bindInteger(17, toInteger(req.body.slots.total));
        ddp.bindInteger(18, toInteger(req.body.slots.free));
        ddp.bindInteger(19, toInteger(req.body.slots.used));
        ddp.bindInteger(20, toInteger(req.body.slots.reserved));
        ddp.bindInteger(21, toInteger(req.body.slots.faulty));
        await ddp.run();
        if (req.body.decommissioned != null) {
          await DDC.run(
            "UPDATE _rack SET decommissioned = strptime('" +
              req.body.decommissioned +
              "','" +
              dateFormat +
              "')" +
              " WHERE tsId = " +
              tsId
          );
        }
        if (req.body.floor != null) {
          await DDC.run(
            "UPDATE _rack SET floor = " +
              toInteger(req.body.floor) +
              " WHERE tsId = " +
              tsId
          );
        }
        if (req.body.area != null) {
          await DDC.run(
            "UPDATE _rack SET floorArea = '" +
              req.body.area +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.row != null) {
          await DDC.run(
            "UPDATE _rack SET floorRow = " +
              toInteger(req.body.row) +
              " WHERE tsId = " +
              tsId
          );
        }
        if (req.body.column != null) {
          await DDC.run(
            "UPDATE _rack SET floorColumn = " +
              toInteger(req.body.column) +
              " WHERE tsId = " +
              tsId
          );
        }
        if (req.body.coordinate?.m != null) {
          await DDC.run(
            "UPDATE _rack SET m = '" +
              req.body.coordinate.m +
              "' WHERE tsId = " +
              tsId
          );
        }
        res.contentType(OAS.mimeJSON).status(200).json({ rackId: rackId });
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function deleteSingleRack(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        // recover (restore) previously deleted if still exists
        if (req.query?.restore != null) {
          let point = dayjs().format(dayjsFormat);
          let ddRead = await DDC.runAndReadAll(
            "SELECT rack.id FROM rack,_rack WHERE rack.id = '" +
              req.params.rackId +
              "' AND _rack.rackId = rack.id AND _rack.source = 'historical' AND rack.delete = true LIMIT 1"
          );
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            await DDC.run(
              "UPDATE rack SET tsPoint = strptime('" +
                point +
                "','" +
                pointFormat +
                "'), delete = false WHERE id = '" +
                req.params.rackId +
                "'"
            );
            await dbAddPredictQueueItem("rack", req.params.rackId, "undelete");
            res.sendStatus(204);
          } else {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "rackId " + req.params.rackId + " does not exist",
              });
          }
        } else {
          let ddp = await DDC.prepare(
            "SELECT id,tsPoint,historicalTsId,predictedTsId,source FROM rack,_rack WHERE rack.id = $1 AND _rack.tsId = rack.historicalTsId AND rack.delete = false"
          );
          ddp.bindVarchar(1, req.params.rackId);
          let ddRead = await ddp.runAndReadAll();
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            if (req.query?.predicted != null) {
              await DDC.run(
                "DELETE FROM _rack WHERE rackId = '" +
                  req.params.rackId +
                  "' and source = 'predicted'"
              );
              await DDC.run(
                "UPDATE duct SET predictedTsId = NULL WHERE id = '" +
                  req.params.rackId +
                  "'"
              );
              res.sendStatus(204);
            } else {
              let point = dayjs().format(dayjsFormat);
              let tsId = await getSeqNextValue("seq_rack");
              let tsCol = "historicalTsId";
              switch (ddRows[0][4]) {
                case "historical":
                  tsCol = "historicalTsId";
                  break;
                case "predicted":
                  tsCol = "predictedTsId";
                  break;
              }
              let ddClone = await DDC.prepare(
                "INSERT INTO _rack (tsId,point,rackId,source,reference,commissioned,decommissioned,siteId,floor,floorArea,floorRow,floorColumn,X,Y,Z,M,depth,height,width,unit,slotsTotal,slotsFree,slotsUsed,slotsReserved,slotsFaulty) SELECT $1,strptime($2,$3),rackId,source,reference,commissioned,decommissioned,siteId,floor,floorArea,floorRow,floorColumn,X,Y,Z,M,depth,height,width,unit,slotsTotal,slotsFree,slotsUsed,slotsReserved,slotsFaulty FROM _rack WHERE tsId = $4"
              );
              ddClone.bindInteger(1, tsId);
              ddClone.bindVarchar(2, point);
              ddClone.bindVarchar(3, pointFormat);
              ddClone.bindInteger(4, ddRows[0][2]);
              await ddClone.run();
              await DDC.run(
                "UPDATE rack SET " +
                  tsCol +
                  " = " +
                  tsId +
                  ", tsPoint = strptime('" +
                  point +
                  "','" +
                  pointFormat +
                  "'), delete = true WHERE id = '" +
                  req.params.rackId +
                  "'"
              );
              await dbAddPredictQueueItem("rack", req.params.rackId, "delete");
              res.sendStatus(204);
            }
          } else {
            res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "rackId " + req.params.rackId + " does not exist",
              });
          }
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSingleRack(req, res, next) {
    let datePoint = "AND _rack.tsId = rack.historicalTsId";
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.query?.point != null) {
          datePoint =
            "AND strftime(_rack.point,'" +
            pointFormat +
            "') = '" +
            req.query.point +
            "'";
        }
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT id,delete,historicalTsId,predictedTsId,tsId,strftime(point,'" +
            pointFormat +
            "'),rackId,source,reference,strftime(commissioned,'" +
            dateFormat +
            "'),strftime(decommissioned,'" +
            dateFormat +
            "'),siteId,floor,floorArea,floorRow,floorColumn,X,Y,Z,M,depth,height,width,unit,slotsTotal,slotsFree,slotsUsed,slotsReserved,slotsFaulty FROM rack, _rack WHERE rack.id = $1 AND _rack.rackId = rack.id AND rack.delete = false " +
            datePoint +
            " ORDER BY _rack.point DESC LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.rackId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          resJson = {
            rackId: req.params.rackId,
            point: ddRows[0][5],
            reference: ddRows[0][8],
            commissioned: ddRows[0][9],
            siteId: ddRows[0][11],
            coordinate: {
              x: toDecimal(ddRows[0][16], OAS.X_scale, OAS.XY_precision),
              y: toDecimal(ddRows[0][17], OAS.Y_scale, OAS.XY_precision),
              z: toDecimal(ddRows[0][18], OAS.Z_scale, OAS.Z_precision),
            },
            dimensions: {
              depth: toDecimal(ddRows[0][20]),
              height: toDecimal(ddRows[0][21]),
              width: toDecimal(ddRows[0][22]),
              unit: ddRows[0][23],
            },
            slots: {
              total: toInteger(ddRows[0][24]),
              free: toInteger(ddRows[0][25]),
              used: toInteger(ddRows[0][26]),
              reserved: toInteger(ddRows[0][27]),
              faulty: toInteger(ddRows[0][28]),
            },
            source: ddRows[0][7],
            delete: toBoolean(ddRows[0][1]),
          };
          if (ddRows[0][10] != null) {
            resJson.decommissioned = ddRows[0][10];
          }
          if (ddRows[0][12] != null) {
            resJson.floor = ddRows[0][12];
          }
          if (ddRows[0][13] != null) {
            resJson.area = ddRows[0][13];
          }
          if (ddRows[0][14] != null) {
            resJson.row = ddRows[0][14];
          }
          if (ddRows[0][15] != null) {
            resJson.column = ddRows[0][15];
          }
          if (ddRows[0][19] != null) {
            resJson.coordinate.m = ddRows[0][19];
          }
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "rackId " + req.params.rackId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateSingleRack(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT id,delete,historicalTsId,predictedTsId,tsId,strftime(point,'" +
            pointFormat +
            "'),rackId,source,reference,strftime(commissioned,'" +
            dateFormat +
            "'),strftime(decommissioned,'" +
            dateFormat +
            "'),siteId,floor,floorArea,floorRow,floorColumn,X,Y,Z,M,depth,height,width,unit,slotsTotal,slotsFree,slotsUsed,slotsReserved,slotsFaulty FROM rack, _rack WHERE id = $1 AND _rack.rackId = rack.id AND tsId = historicalTsId AND rack.delete = false LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.rackId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          resJson = {
            rackId: req.params.rackId,
            point: ddRows[0][5],
            reference: ddRows[0][8],
            commissioned: ddRows[0][9],
            siteId: ddRows[0][11],
            coordinate: {
              x: toDecimal(ddRows[0][16], OAS.X_scale, OAS.XY_precision),
              y: toDecimal(ddRows[0][17], OAS.Y_scale, OAS.XY_precision),
              z: toDecimal(ddRows[0][18], OAS.Z_scale, OAS.Z_precision),
            },
            dimensions: {
              depth: toDecimal(ddRows[0][20]),
              height: toDecimal(ddRows[0][21]),
              width: toDecimal(ddRows[0][22]),
              unit: ddRows[0][23],
            },
            slots: {
              total: toInteger(ddRows[0][24]),
              free: toInteger(ddRows[0][25]),
              used: toInteger(ddRows[0][26]),
              reserved: toInteger(ddRows[0][27]),
              faulty: toInteger(ddRows[0][28]),
            },
            source: ddRows[0][7],
            delete: toBoolean(ddRows[0][1]),
          };
          if (ddRows[0][10] != null) {
            resJson.decommissioned = ddRows[0][10];
          }
          if (ddRows[0][12] != null) {
            resJson.floor = ddRows[0][12];
          }
          if (ddRows[0][13] != null) {
            resJson.area = ddRows[0][13];
          }
          if (ddRows[0][14] != null) {
            resJson.row = ddRows[0][14];
          }
          if (ddRows[0][15] != null) {
            resJson.column = ddRows[0][15];
          }
          if (ddRows[0][19] != null) {
            resJson.coordinate.m = ddRows[0][19];
          }
          // pass to replace to regenerate the record
          req.body = jsonDeepMerge(resJson, req.body);
          return next();
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "rackId " + req.params.rackId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function replaceSingleRack(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.body.siteId != null) {
          if (!(await dbIdExists(req.body.siteId, "site"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "siteId " + req.body.siteId + " does not exist",
              });
          }
        }
        if (req.body.slots.free != null) {
          if (
            toInteger(req.body.slots.free) > toInteger(req.body.slots.total)
          ) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "slots free " +
                  req.body.slots.free +
                  " can not be greater than total slots " +
                  req.body.slots.total,
              });
          }
        }
        if (req.body.slots.used != null) {
          if (
            toInteger(req.body.slots.used) > toInteger(req.body.slots.total)
          ) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "slots used " +
                  req.body.slots.used +
                  " can not be greater than total slots " +
                  req.body.slots.total,
              });
          }
        }
        if (req.body.slots.reserved != null) {
          if (
            toInteger(req.body.slots.reserved) > toInteger(req.body.slots.total)
          ) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "slots reserved " +
                  req.body.slots.reserved +
                  " can not be greater than total slots " +
                  req.body.slots.total,
              });
          }
        }
        if (req.body.slots.faulty != null) {
          if (
            toInteger(req.body.slots.faulty) > toInteger(req.body.slots.total)
          ) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "slots faulty " +
                  req.body.slots.faulty +
                  " can not be greater than total slots " +
                  req.body.slots.total,
              });
          }
        }
        let slotsConsumed =
          toInteger(req.body.slots.free) +
          toInteger(req.body.slots.used) +
          toInteger(req.body.slots.reserved) +
          toInteger(req.body.slots.faulty);
        if (slotsConsumed > toInteger(req.body.slots.total)) {
          return res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors:
                "slots consumed (free,used,reserved,faulty) " +
                slotsConsumed +
                " can not be greater than total slots " +
                req.body.slots.total,
            });
        }
        let slotsFree =
          toInteger(req.body.slots.total) -
          (toInteger(req.body.slots.used) +
            toInteger(req.body.slots.reserved) +
            toInteger(req.body.slots.faulty));
        if (slotsFree > toInteger(req.body.slots.free)) {
          req.body.slots.free = slotsFree;
        }

        let ddp = await DDC.prepare(
          "SELECT id FROM rack WHERE id = $1 AND delete = false LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.rackId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let point = dayjs().format(dayjsFormat);
          let tsId = await getSeqNextValue("seq_rack");
          let tsCol = "historicalTsId";
          switch (req.body.source) {
            case "historical":
              tsCol = "historicalTsId";
              break;
            case "predicted":
              tsCol = "predictedTsId";
              break;
          }
          let ddp = await DDC.prepare(
            "UPDATE rack SET " +
              tsCol +
              " = $1, tsPoint = strptime($2,$3) WHERE id = $4"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body.point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.params.rackId);
          await ddp.run();
          ddp = await DDC.prepare(
            "INSERT INTO _rack (tsId,point,rackId,source,reference,commissioned,siteId,X,Y,Z,depth,height,width,unit,slotsTotal,slotsFree,slotsUsed,slotsReserved,slotsFaulty) VALUES ($1,strptime($2,$3),$4,$5,$6,strptime($7,$8),$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body.point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.body.rackId);
          ddp.bindVarchar(5, req.body.source);
          ddp.bindVarchar(6, req.body.reference);
          ddp.bindVarchar(7, req.body.commissioned);
          ddp.bindVarchar(8, dateFormat);
          ddp.bindVarchar(9, req.body.siteId);
          ddp.bindFloat(
            10,
            toDecimal(req.body.coordinate.x, OAS.X_scale, OAS.XY_precision)
          );
          ddp.bindFloat(
            11,
            toDecimal(req.body.coordinate.y, OAS.Y_scale, OAS.XY_precision)
          );
          ddp.bindFloat(
            12,
            toDecimal(req.body.coordinate.z, OAS.Z_scale, OAS.Z_precision)
          );
          ddp.bindFloat(13, toDecimal(req.body.dimensions.depth));
          ddp.bindFloat(14, toDecimal(req.body.dimensions.height));
          ddp.bindFloat(15, toDecimal(req.body.dimensions.width));
          ddp.bindVarchar(16, req.body.dimensions.unit);
          ddp.bindInteger(17, toInteger(req.body.slots.total));
          ddp.bindInteger(18, toInteger(req.body.slots.free));
          ddp.bindInteger(19, toInteger(req.body.slots.used));
          ddp.bindInteger(20, toInteger(req.body.slots.reserved));
          ddp.bindInteger(21, toInteger(req.body.slots.faulty));
          await ddp.run();
          if (req.body.decommissioned != null) {
            await DDC.run(
              "UPDATE _rack SET decommissioned = strptime('" +
                req.body.decommissioned +
                "','" +
                dateFormat +
                "')" +
                " WHERE tsId = " +
                tsId
            );
          }
          if (req.body.floor != null) {
            await DDC.run(
              "UPDATE _rack SET floor = " +
                toInteger(req.body.floor) +
                " WHERE tsId = " +
                tsId
            );
          }
          if (req.body.area != null) {
            await DDC.run(
              "UPDATE _rack SET floorArea = '" +
                req.body.area +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.row != null) {
            await DDC.run(
              "UPDATE _rack SET floorRow = " +
                toInteger(req.body.row) +
                " WHERE tsId = " +
                tsId
            );
          }
          if (req.body.column != null) {
            await DDC.run(
              "UPDATE _rack SET floorColumn = " +
                toInteger(req.body.column) +
                " WHERE tsId = " +
                tsId
            );
          }
          if (req.body.coordinate?.m != null) {
            await DDC.run(
              "UPDATE _rack SET m = '" +
                req.body.coordinate.m +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.source == "historical") {
            await dbAddPredictQueueItem("rack", req.params.rackId, "update");
          }
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "rackId " + req.params.rackId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getMultipleRacks(req, res, next) {
    try {
      let resJson = [];
      let ddp = await DDC.runAndReadAll(
        "SELECT id,delete,historicalTsId,predictedTsId,tsId,strftime(point,'" +
          pointFormat +
          "'),rackId,source,reference,strftime(commissioned,'" +
          dateFormat +
          "'),strftime(decommissioned,'" +
          dateFormat +
          "'),siteId,floor,floorArea,floorRow,floorColumn,X,Y,Z,M,depth,height,width,unit,slotsTotal,slotsFree,slotsUsed,slotsReserved,slotsFaulty FROM rack, _rack WHERE _rack.rackId = rack.id ORDER BY _rack.point"
      );
      let ddRows = ddp.getRows();
      if (ddRows.length > 0) {
        for (let idx in ddRows) {
          let resObj = {
            rackId: ddRows[idx][0],
            point: ddRows[idx][5],
            reference: ddRows[idx][8],
            commissioned: ddRows[idx][9],
            siteId: ddRows[idx][11],
            coordinate: {
              x: toDecimal(ddRows[idx][16], OAS.X_scale, OAS.XY_precision),
              y: toDecimal(ddRows[idx][17], OAS.Y_scale, OAS.XY_precision),
              z: toDecimal(ddRows[idx][18], OAS.Z_scale, OAS.Z_precision),
            },
            dimensions: {
              depth: toDecimal(ddRows[idx][20]),
              height: toDecimal(ddRows[idx][21]),
              width: toDecimal(ddRows[idx][22]),
              unit: ddRows[idx][23],
            },
            slots: {
              total: toInteger(ddRows[idx][24]),
              free: toInteger(ddRows[idx][25]),
              used: toInteger(ddRows[idx][26]),
              reserved: toInteger(ddRows[idx][27]),
              faulty: toInteger(ddRows[idx][28]),
            },
            source: ddRows[idx][7],
            delete: toBoolean(ddRows[idx][1]),
          };
          if (ddRows[idx][10] != null) {
            resObj.decommissioned = ddRows[idx][10];
          }
          if (ddRows[idx][12] != null) {
            resObj.floor = ddRows[idx][12];
          }
          if (ddRows[idx][13] != null) {
            resObj.area = ddRows[idx][13];
          }
          if (ddRows[idx][14] != null) {
            resObj.row = ddRows[idx][14];
          }
          if (ddRows[idx][15] != null) {
            resObj.column = ddRows[idx][15];
          }
          if (ddRows[idx][19] != null) {
            resObj.coordinate.m = ddRows[idx][19];
          }
          resJson.push(resObj);
        }
        resJson = jsonSortByMultiKeys(resJson, ["point", "source"]);
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res.sendStatus(204);
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addMultipleRacks(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        req.body = jsonSortByMultiKeys(req.body, ["point", "source"]);
        let resJson = [];
        for (let i = 0; i < req.body.length; i++) {
          let ddd = await DDC.runAndReadAll(
            "SELECT id FROM rack WHERE id = '" + req.body[i].rackId + "'"
          );
          let dddRows = ddd.getRows();
          if (dddRows.length > 0) {
            await DDC.run(
              "DELETE FROM _rack WHERE rackId = '" + req.body[i].rackId + "'"
            );
            await DDC.run(
              "UPDATE rack SET delete = false, historicalTsId = NULL, predictedTsId = NULL, tsPoint = now()::timestamp WHERE id = '" +
                req.body[i].rackId +
                "'"
            );
          }
        }
        for (let i = 0; i < req.body.length; i++) {
          if (!(await dbIdExists(req.body[i].siteId, "site"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "[" +
                  i +
                  "] siteId " +
                  req.body[i].siteId +
                  " does not exist",
              });
          }
          if (req.body[i].slots.free != null) {
            if (
              toInteger(req.body[i].slots.free) >
              toInteger(req.body[i].slots.total)
            ) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "[" +
                    i +
                    "] slots free " +
                    req.body[i].slots.free +
                    " can not be greater than total slots " +
                    req.body[i].slots.total,
                });
            }
          }
          if (req.body[i].slots.used != null) {
            if (
              toInteger(req.body[i].slots.used) >
              toInteger(req.body[i].slots.total)
            ) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "[" +
                    i +
                    "] slots used " +
                    req.body[i].slots.used +
                    " can not be greater than total slots " +
                    req.body[i].slots.total,
                });
            }
          }
          if (req.body[i].slots.reserved != null) {
            if (
              toInteger(req.body[i].slots.reserved) >
              toInteger(req.body[i].slots.total)
            ) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "[" +
                    i +
                    "] slots reserved " +
                    req.body[i].slots.reserved +
                    " can not be greater than total slots " +
                    req.body[i].slots.total,
                });
            }
          }
          if (req.body[i].slots.faulty != null) {
            if (
              toInteger(req.body[i].slots.faulty) >
              toInteger(req.body[i].slots.total)
            ) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "[" +
                    i +
                    "] slots faulty " +
                    req.body[i].slots.faulty +
                    " can not be greater than total slots " +
                    req.body[i].slots.total,
                });
            }
          }
          let slotsConsumed =
            toInteger(req.body[i].slots.free) +
            toInteger(req.body[i].slots.used) +
            toInteger(req.body[i].slots.reserved) +
            toInteger(req.body[i].slots.faulty);
          if (slotsConsumed > toInteger(req.body[i].slots.total)) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "[" +
                  i +
                  "] slots consumed (free,used,reserved,faulty) " +
                  slotsConsumed +
                  " can not be greater than total slots " +
                  req.body[i].slots.total,
              });
          }
          let slotsFree =
            toInteger(req.body[i].slots.total) -
            (toInteger(req.body[i].slots.used) +
              toInteger(req.body[i].slots.reserved) +
              toInteger(req.body[i].slots.faulty));
          if (slotsFree > toInteger(req.body[i].slots.free)) {
            req.body[i].slots.free = slotsFree;
          }
          let tsId = await getSeqNextValue("seq_rack");
          let tsCol = "historicalTsId";
          switch (req.body.source) {
            case "historical":
              tsCol = "historicalTsId";
              break;
            case "predicted":
              tsCol = "predictedTsId";
              break;
          }
          let ddq = await DDC.runAndReadAll(
            "SELECT id FROM rack WHERE id = '" + req.body[i].rackId + "'"
          );
          let ddqRows = ddq.getRows();
          if (ddqRows.length == 0) {
            let ddp = await DDC.prepare(
              "INSERT INTO rack (id,delete," +
                tsCol +
                ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
            );
            ddp.bindVarchar(1, req.body[i].rackId);
            ddp.bindBoolean(2, toBoolean(req.body[i].delete));
            ddp.bindInteger(3, tsId);
            ddp.bindVarchar(4, req.body[i].point);
            ddp.bindVarchar(5, pointFormat);
            await ddp.run();
          } else {
            let ddp = await DDC.prepare(
              "UPDATE rack SET delete = $1, " + tsCol + " = $2 WHERE id = $3"
            );
            ddp.bindBoolean(1, toBoolean(req.body[i].delete));
            ddp.bindInteger(2, tsId);
            ddp.bindVarchar(3, req.body[i].rackId);
            await ddp.run();
          }
          let ddp = await DDC.prepare(
            "INSERT INTO _rack (tsId,point,rackId,source,reference,commissioned,siteId,X,Y,Z,depth,height,width,unit,slotsTotal,slotsFree,slotsUsed,slotsReserved,slotsFaulty) VALUES ($1,strptime($2,$3),$4,$5,$6,strptime($7,$8),$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body[i].point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.body[i].rackId);
          ddp.bindVarchar(5, req.body[i].source);
          ddp.bindVarchar(6, req.body[i].reference);
          ddp.bindVarchar(7, req.body[i].commissioned);
          ddp.bindVarchar(8, dateFormat);
          ddp.bindVarchar(9, req.body[i].siteId);
          ddp.bindFloat(
            10,
            toDecimal(req.body[i].coordinate.x, OAS.X_scale, OAS.XY_precision)
          );
          ddp.bindFloat(
            11,
            toDecimal(req.body[i].coordinate.y, OAS.Y_scale, OAS.XY_precision)
          );
          ddp.bindFloat(
            12,
            toDecimal(req.body[i].coordinate.z, OAS.Z_scale, OAS.Z_precision)
          );
          ddp.bindFloat(13, toDecimal(req.body[i].dimensions.depth));
          ddp.bindFloat(14, toDecimal(req.body[i].dimensions.height));
          ddp.bindFloat(15, toDecimal(req.body[i].dimensions.width));
          ddp.bindVarchar(16, req.body[i].dimensions.unit);
          ddp.bindInteger(17, toInteger(req.body[i].slots.total));
          ddp.bindInteger(18, toInteger(req.body[i].slots.free));
          ddp.bindInteger(19, toInteger(req.body[i].slots.used));
          ddp.bindInteger(20, toInteger(req.body[i].slots.reserved));
          ddp.bindInteger(21, toInteger(req.body[i].slots.faulty));
          await ddp.run();
          if (req.body[i].decommissioned != null) {
            await DDC.run(
              "UPDATE _rack SET decommissioned = strptime('" +
                req.body[i].decommissioned +
                "','" +
                dateFormat +
                "')" +
                " WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].floor != null) {
            await DDC.run(
              "UPDATE _rack SET floor = " +
                toInteger(req.body[i].floor) +
                " WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].area != null) {
            await DDC.run(
              "UPDATE _rack SET floorArea = '" +
                req.body[i].area +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].row != null) {
            await DDC.run(
              "UPDATE _rack SET floorRow = " +
                toInteger(req.body[i].row) +
                " WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].column != null) {
            await DDC.run(
              "UPDATE _rack SET floorColumn = " +
                toInteger(req.body[i].column) +
                " WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].coordinate?.m != null) {
            await DDC.run(
              "UPDATE _rack SET m = '" +
                req.body[i].coordinate.m +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].source == "historical") {
            await dbAddPredictQueueItem("rack", req.body[i].rackId, "create");
          }
          resJson.push(req.body[i].rackId);
        }
        resJson = Array.from(new Set(resJson.map(JSON.stringify)))
          .map(JSON.parse)
          .sort();
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllServices(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let resJson = [];
        let ddRead = await DDC.runAndReadAll(
          "SELECT id FROM service WHERE delete = false"
        );
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            resJson.push(ddRows[idx][0]);
          }
          resJson.sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getServicesSimpleStatistics(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        res
          .contentType(OAS.mimeJSON)
          .status(200)
          .json(await dbActiveInactiveCounts("service"));
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addSingleService(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.body.link?.ingress != null) {
          for (let i = 0; i < req.body.link.ingress.length; i++) {
            if (!(await dbIdExists(req.body.link.ingress[i].neId, "ne"))) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "neId " + req.body.link.ingress[i].neId + " does not exist",
                });
            }
            if (
              !(await dbNePortExists(
                req.body.link.ingress[i].neId,
                req.body.link.ingress[i].port
              ))
            ) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "neId " +
                    req.body.link.ingress[i].neId +
                    " ingress port " +
                    req.body.link.ingress[i].port +
                    " does not exist",
                });
            }
          }
        }
        if (req.body.link?.egress != null) {
          for (let i = 0; i < req.body.link.egress.length; i++) {
            if (!(await dbIdExists(req.body.link.egress[i].neId, "ne"))) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "neId " + req.body.link.egress[i].neId + " does not exist",
                });
            }
            if (
              !(await dbNePortExists(
                req.body.link.egress[i].neId,
                req.body.link.egress[i].port
              ))
            ) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "neId " +
                    req.body.link.egress[i].neId +
                    " egress port " +
                    req.body.link.egress[i].port +
                    " does not exist",
                });
            }
          }
        }

        let serviceId = uuidv4();
        let tsId = await getSeqNextValue("seq_service");
        let tsCol = "historicalTsId";

        switch (req.body.source) {
          case "historical":
            tsCol = "historicalTsId";
            break;
          case "predicted":
            tsCol = "predictedTsId";
            break;
          default:
            tsCol = "historicalTsId";
        }

        let ddp = await DDC.prepare(
          "INSERT INTO service (id,delete," +
            tsCol +
            ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
        );
        ddp.bindVarchar(1, serviceId);
        ddp.bindBoolean(2, toBoolean(req.body.delete));
        ddp.bindInteger(3, tsId);
        ddp.bindVarchar(4, req.body.point);
        ddp.bindVarchar(5, pointFormat);
        await ddp.run();

        ddp = await DDC.prepare(
          "INSERT INTO _service (tsId,point,source,serviceId,commissioned) VALUES ($1,strptime($2,$3),$4,$5,strptime($6,$7))"
        );
        ddp.bindInteger(1, tsId);
        ddp.bindVarchar(2, req.body.point);
        ddp.bindVarchar(3, pointFormat);
        ddp.bindVarchar(4, req.body.source);
        ddp.bindVarchar(5, serviceId);
        ddp.bindVarchar(6, req.body.commissioned);
        ddp.bindVarchar(7, dateFormat);
        await ddp.run();

        if (req.body.reference != null) {
          await DDC.run(
            "UPDATE _service SET reference = '" +
              req.body.reference +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.customer.name != null) {
          await DDC.run(
            "UPDATE _service SET customerName = '" +
              req.body.customer.name +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.customer.reference != null) {
          await DDC.run(
            "UPDATE _service SET customerReference = '" +
              req.body.customer.reference +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.decommissioned != null) {
          await DDC.run(
            "UPDATE _service SET decommissioned = strptime('" +
              req.body.decommissioned +
              "','" +
              dateFormat +
              "') " +
              "WHERE tsId = " +
              tsId
          );
        }
        if (req.body.lag?.group != null) {
          await DDC.run(
            "UPDATE _service SET lagGroup = '" +
              req.body.lag.group +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.lag?.members != null) {
          await DDC.run(
            "UPDATE _service SET lagMembers = " +
              toInteger(req.body.lag.members) +
              " WHERE tsId = " +
              tsId
          );
        }
        if (req.body.link?.ingress != null) {
          for (let n = 0; n < req.body.link.ingress.length; n++) {
            let tsIngressId = await getSeqNextValue("seq_serviceIngress");
            let nePortId = await dbNePortIdFromName(
              req.body.link.ingress[n].neId,
              req.body.link.ingress[n].port
            );
            ddp = await DDC.prepare(
              "INSERT INTO _serviceIngress (tsId,point,source,serviceId,serviceTsId,neId,nePortId) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8)"
            );
            ddp.bindInteger(1, tsIngressId);
            ddp.bindVarchar(2, req.body.point);
            ddp.bindVarchar(3, pointFormat);
            ddp.bindVarchar(4, req.body.source);
            ddp.bindVarchar(5, serviceId);
            ddp.bindInteger(6, tsId);
            ddp.bindVarchar(7, req.body.link.ingress[n].neId);
            ddp.bindVarchar(8, nePortId);
            await ddp.run();
            if (req.body.link.ingress[n]?.cVlanId != null) {
              await DDC.run(
                "UPDATE _serviceIngress SET cVlanId = " +
                  toInteger(req.body.link.ingress[n].cVlanId) +
                  " WHERE tsId = " +
                  tsIngressId
              );
            }
            if (req.body.link.ingress[n]?.sVlanId != null) {
              await DDC.run(
                "UPDATE _serviceIngress SET sVlanId = " +
                  toInteger(req.body.link.ingress[n].sVlanId) +
                  " WHERE tsId = " +
                  tsIngressId
              );
            }
            if (req.body.link.ingress[n]?.member != null) {
              await DDC.run(
                "UPDATE _serviceIngress SET lagMember = " +
                  toInteger(req.body.link.ingress[n].member) +
                  " WHERE tsId = " +
                  tsIngressId
              );
            }
            let { status, body } = await getNe(req.body.link.ingress[n].neId);
            for (let b = 0; b < body.ports.length; b++) {
              if (body.ports[b].name === req.body.link.ingress[n].port) {
                body.ports[b].state = "used";
                body.point = req.body.point;
                break;
              }
            }
            status = await addNe(req.body.link.ingress[n].neId, body);
            if (status != 200) {
              return res
                .contentType(OAS.mimeJSON)
                .status(status)
                .json({
                  errors:
                    "neId " +
                    req.body.link.ingress[n].neId +
                    " failed to set port " +
                    req.body.link.ingress[n].port +
                    " as used",
                });
            }
          }
        }
        if (req.body.link?.egress != null) {
          for (let n = 0; n < req.body.link.egress.length; n++) {
            let tsEgressId = await getSeqNextValue("seq_serviceEgress");
            let nePortId = await dbNePortIdFromName(
              req.body.link.egress[n].neId,
              req.body.link.egress[n].port
            );
            ddp = await DDC.prepare(
              "INSERT INTO _serviceEgress (tsId,point,source,serviceId,serviceTsId,neId,nePortId) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8)"
            );
            ddp.bindInteger(1, tsEgressId);
            ddp.bindVarchar(2, req.body.point);
            ddp.bindVarchar(3, pointFormat);
            ddp.bindVarchar(4, req.body.source);
            ddp.bindVarchar(5, serviceId);
            ddp.bindInteger(6, tsId);
            ddp.bindVarchar(7, req.body.link.egress[n].neId);
            ddp.bindVarchar(8, nePortId);
            await ddp.run();
            if (req.body.link.egress[n]?.cVlanId != null) {
              await DDC.run(
                "UPDATE _serviceEgress SET cVlanId = " +
                  toInteger(req.body.link.egress[n].cVlanId) +
                  " WHERE tsId = " +
                  tsEgressId
              );
            }
            if (req.body.link.egress[n]?.sVlanId != null) {
              await DDC.run(
                "UPDATE _serviceEgress SET sVlanId = " +
                  toInteger(req.body.link.egress[n].sVlanId) +
                  " WHERE tsId = " +
                  tsEgressId
              );
            }
            if (req.body.link.egress[n]?.member != null) {
              await DDC.run(
                "UPDATE _serviceEgress SET lagMember = " +
                  toInteger(req.body.link.egress[n].member) +
                  " WHERE tsId = " +
                  tsEgressId
              );
            }
            let { status, body } = await getNe(req.body.link.egress[n].neId);
            for (let b = 0; b < body.ports.length; b++) {
              if (body.ports[b].name === req.body.link.egress[n].port) {
                body.ports[b].state = "used";
                body.point = req.body.point;
                break;
              }
            }
            status = await addNe(req.body.link.egress[n].neId, body);
            if (status != 200) {
              return res
                .contentType(OAS.mimeJSON)
                .status(status)
                .json({
                  errors:
                    "neId " +
                    req.body.link.egress[n].neId +
                    " failed to set port " +
                    req.body.link.egress[n].port +
                    " as used",
                });
            }
          }
        }
        return res
          .contentType(OAS.mimeJSON)
          .status(200)
          .json({ serviceId: serviceId });
      } else {
        return res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function deleteSingleService(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        // recover (restore) previously deleted if still exists
        let point = dayjs().format(dayjsFormat);
        if (req.query?.restore != null) {
          let ddRead = await DDC.runAndReadAll(
            "SELECT service.id FROM service,_service WHERE service.id = '" +
              req.params.serviceId +
              "' AND _service.serviceId = service.id AND _service.source = 'historical' AND service.delete = true LIMIT 1"
          );
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            await DDC.run(
              "UPDATE service SET tsPoint = strptime('" +
                point +
                "','" +
                pointFormat +
                "'), delete = false WHERE id = '" +
                req.params.serviceId +
                "'"
            );
            await dbAddPredictQueueItem(
              "service",
              req.params.serviceId,
              "undelete"
            );
            res.sendStatus(204);
          } else {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "serviceId " + req.params.serviceId + " does not exist",
              });
          }
        } else {
          if (req.query?.predicted != null) {
            await DDC.run(
              "DELETE FROM _serviceIngress WHERE serviceId = '" +
                req.params.serviceId +
                "' and source = 'predicted'"
            );
            await DDC.run(
              "DELETE FROM _serviceEgress WHERE serviceId = '" +
                req.params.serviceId +
                "' and source = 'predicted'"
            );
            await DDC.run(
              "DELETE FROM _service WHERE serviceId = '" +
                req.params.serviceId +
                "' and source = 'predicted'"
            );
            await DDC.run(
              "UPDATE service SET predictedTsId = NULL WHERE id = '" +
                req.params.serviceId +
                "'"
            );
            res.sendStatus(204);
          } else {
            let ddp = await DDC.prepare(
              "SELECT id,tsPoint,historicalTsId,predictedTsId,source FROM service,_service WHERE service.id = $1 AND _service.tsId = service.historicalTsId AND service.delete = false"
            );
            ddp.bindVarchar(1, req.params.serviceId);
            let ddRead = await ddp.runAndReadAll();
            let ddRows = ddRead.getRows();
            if (ddRows.length > 0) {
              let tsId = await getSeqNextValue("seq_service");
              let tsCol = "historicalTsId";
              switch (ddRows[0][4]) {
                case "historical":
                  tsCol = "historicalTsId";
                  break;
                case "predicted":
                  tsCol = "predictedTsId";
                  break;
              }

              let ddp = await DDC.prepare(
                "INSERT INTO _service (tsId,point,source,serviceId,reference,customerName,customerReference,commissioned,decommissioned,lagGroup,lagMembers) SELECT $1,strptime($2,$3),source,serviceId,reference,customerName,customerReference,commissioned,decommissioned,lagGroup,lagMembers FROM _service WHERE tsId = $4"
              );
              ddp.bindInteger(1, tsId);
              ddp.bindVarchar(2, point);
              ddp.bindVarchar(3, pointFormat);
              ddp.bindInteger(4, ddRows[0][2]);
              await ddp.run();

              let ddi = await DDC.prepare(
                "SELECT tsId,serviceTsId FROM _serviceIngress WHERE serviceId = $1 AND serviceTsId = $2"
              );
              ddi.bindVarchar(1, req.params.serviceId);
              ddi.bindInteger(2, ddRows[0][2]);
              let ddIngress = await ddi.runAndReadAll();
              let ddIngressRows = ddIngress.getRows();
              if (ddIngressRows.length > 0) {
                ddp = await DDC.prepare(
                  "INSERT INTO _serviceIngress (point,source,serviceId,serviceTsId,neId,nePortId,cVlanId,sVlanId,lagMember) SELECT strptime($1,$2),source,serviceId,$3,neId,nePortId,cVlanId,sVlanId,lagMember FROM _serviceIngress WHERE serviceId = $4 AND serviceTsId = $5"
                );
                ddp.bindVarchar(1, point);
                ddp.bindVarchar(2, pointFormat);
                ddp.bindInteger(3, tsId);
                ddp.bindVarchar(4, req.params.serviceId);
                ddp.bindInteger(5, ddIngressRows[0][1]);
                await ddp.run();
              }

              let dde = await DDC.prepare(
                "SELECT tsId,serviceTsId FROM _serviceEgress WHERE serviceId = $1 AND serviceTsId = $2"
              );
              dde.bindVarchar(1, req.params.serviceId);
              dde.bindInteger(2, ddRows[0][2]);
              let ddEgress = await dde.runAndReadAll();
              let ddEgressRows = ddEgress.getRows();
              if (ddEgressRows.length > 0) {
                ddp = await DDC.prepare(
                  "INSERT INTO _serviceEgress (point,source,serviceId,serviceTsId,neId,nePortId,cVlanId,sVlanId,lagMember) SELECT strptime($1,$2),source,serviceId,$3,neId,nePortId,cVlanId,sVlanId,lagMember FROM _serviceEgress WHERE serviceId = $4 AND serviceTsId = $5"
                );
                ddp.bindVarchar(1, point);
                ddp.bindVarchar(2, pointFormat);
                ddp.bindInteger(3, tsId);
                ddp.bindVarchar(4, req.params.serviceId);
                ddp.bindInteger(5, ddEgressRows[0][1]);
                await ddp.run();
              }

              await DDC.run(
                "UPDATE service SET " +
                  tsCol +
                  " = " +
                  tsId +
                  ", tsPoint = strptime('" +
                  point +
                  "','" +
                  pointFormat +
                  "'), delete = true WHERE id = '" +
                  req.params.serviceId +
                  "'"
              );
              await dbAddPredictQueueItem(
                "service",
                req.params.serviceId,
                "delete"
              );
              res.sendStatus(204);
            } else {
              res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "serviceId " + req.params.serviceId + " does not exist",
                });
            }
          }
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSingleService(req, res, next) {
    let datePoint = "AND _service.tsId = service.historicalTsId";
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.query?.point != null) {
          datePoint =
            "AND strftime(_service.point,'" +
            pointFormat +
            "') = '" +
            req.query.point +
            "'";
        }
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,source,reference,customerName,customerReference,strftime(commissioned,'" +
            dateFormat +
            "'),strftime(decommissioned,'" +
            dateFormat +
            "'),lagGroup,lagMembers,strftime(point,'" +
            pointFormat +
            "') FROM service,_service WHERE service.id = $1 AND _service.serviceId = service.id " +
            datePoint +
            " AND service.delete = false ORDER BY _service.point DESC LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.serviceId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          resJson = {
            serviceId: req.params.serviceId,
            point: ddRows[0][13],
            customer: {},
            commissioned: ddRows[0][9],
            link: { ingress: [], egress: [] },
            source: ddRows[0][5],
            delete: toBoolean(ddRows[0][1]),
          };
          if (ddRows[0][6] != null) {
            resJson.reference = ddRows[0][6];
          }
          if (ddRows[0][7] != null) {
            resJson.customer.name = ddRows[0][7];
          }
          if (ddRows[0][8] != null) {
            resJson.customer.reference = ddRows[0][8];
          }
          if (ddRows[0][10] != null) {
            resJson.decommissioned = ddRows[0][10];
          }
          if (ddRows[0][11] != null || toInteger(ddRows[0][12]) > 0) {
            resJson.lag = {};
            if (ddRows[0][11] != null) {
              resJson.lag.group = ddRows[0][11];
            }
            if (ddRows[0][12] > 0) {
              resJson.lag.members = ddRows[0][12];
            }
          }

          let ddi = await DDC.prepare(
            "SELECT neId,nePortId,cVlanId,sVlanId,lagMember FROM _serviceIngress WHERE serviceId = $1 AND serviceTsId = $2"
          );
          ddi.bindVarchar(1, req.params.serviceId);
          ddi.bindInteger(2, ddRows[0][3]);
          let ddIngressRead = await ddi.runAndReadAll();
          let ddIngressRows = ddIngressRead.getRows();
          if (ddIngressRows.length > 0) {
            for (let pdx in ddIngressRows) {
              let resObj = {
                neId: ddIngressRows[pdx][0],
                port: await dbNePortNameFromId(
                  ddIngressRows[pdx][0],
                  ddIngressRows[pdx][1]
                ),
              };
              if (toInteger(ddIngressRows[pdx][2]) > 0) {
                resObj.cVlanId = toInteger(ddIngressRows[pdx][2]);
              }
              if (toInteger(ddIngressRows[pdx][3]) > 0) {
                resObj.sVlanId = toInteger(ddIngressRows[pdx][3]);
              }
              if (toInteger(ddIngressRows[pdx][4]) > 0) {
                resObj.member = toInteger(ddIngressRows[pdx][4]);
              }
              resJson.link.ingress.push(resObj);
            }
          }

          let dde = await DDC.prepare(
            "SELECT neId,nePortId,cVlanId,sVlanId,lagMember FROM _serviceEgress WHERE serviceId = $1 AND serviceTsId = $2"
          );
          dde.bindVarchar(1, req.params.serviceId);
          dde.bindInteger(2, ddRows[0][3]);
          let ddEgressRead = await dde.runAndReadAll();
          let ddEgressRows = ddEgressRead.getRows();
          if (ddEgressRows.length > 0) {
            for (let pdx in ddEgressRows) {
              let resObj = {
                neId: ddEgressRows[pdx][0],
                port: await dbNePortNameFromId(
                  ddEgressRows[pdx][0],
                  ddEgressRows[pdx][1]
                ),
              };
              if (toInteger(ddEgressRows[pdx][2]) > 0) {
                resObj.cVlanId = toInteger(toInteger(ddEgressRows[pdx][2]));
              }
              if (toInteger(ddEgressRows[pdx][3]) > 0) {
                resObj.sVlanId = toInteger(toInteger(ddEgressRows[pdx][3]));
              }
              if (toInteger(ddEgressRows[pdx][4]) > 0) {
                resObj.member = toInteger(toInteger(ddEgressRows[pdx][4]));
              }
              resJson.link.egress.push(resObj);
            }
          }
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "serviceId " + req.params.serviceId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getServiceTimeline(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddp = await DDC.prepare(
          "SELECT strftime(point,'" +
            pointFormat +
            "'),source FROM service, _service WHERE id = $1 AND serviceId = id AND delete = false ORDER BY point DESC"
        );
        ddp.bindVarchar(1, req.params.serviceId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let resJson = [];
          for (let idx in ddRows) {
            resJson.push({ point: ddRows[idx][0], source: ddRows[idx][1] });
          }
          resJson = Array.from(new Set(resJson.map(JSON.stringify)))
            .map(JSON.parse)
            .sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "serviceId " + req.params.serviceId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateSingleService(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,source,reference,customerName,customerReference,strftime(commissioned,'" +
            dateFormat +
            "'),strftime(decommissioned,'" +
            dateFormat +
            "'),lagGroup,lagMembers,strftime(point,'" +
            pointFormat +
            "'),tsId FROM service,_service WHERE service.id = $1 AND _service.serviceId = service.id AND _service.tsId = service.historicalTsId AND service.delete = false ORDER BY _service.point DESC LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.serviceId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          resJson = {
            serviceId: req.params.serviceId,
            point: ddRows[0][13],
            customer: {},
            commissioned: ddRows[0][9],
            link: { ingress: [], egress: [] },
            source: ddRows[0][5],
            delete: toBoolean(ddRows[0][1]),
          };
          if (ddRows[0][6] != null) {
            resJson.reference = ddRows[0][6];
          }
          if (ddRows[0][7] != null) {
            resJson.customer.name = ddRows[0][7];
          }
          if (ddRows[0][8] != null) {
            resJson.customer.reference = ddRows[0][8];
          }
          if (ddRows[0][10] != null) {
            resJson.decommissioned = ddRows[0][10];
          }
          if (ddRows[0][11] != null || toInteger(ddRows[0][12]) > 0) {
            resJson.lag = {};
            if (ddRows[0][11] != null) {
              resJson.lag.group = ddRows[0][11];
            }
            if (ddRows[0][12] > 0) {
              resJson.lag.members = ddRows[0][12];
            }
          }

          let ddi = await DDC.prepare(
            "SELECT neId,nePortId,cVlanId,sVlanId,lagMember FROM _serviceIngress WHERE serviceId = $1 AND serviceTsId = $2"
          );
          ddi.bindVarchar(1, req.params.serviceId);
          ddi.bindInteger(2, ddRows[0][14]);
          let ddIngressRead = await ddi.runAndReadAll();
          let ddIngressRows = ddIngressRead.getRows();
          if (ddIngressRows.length > 0) {
            for (let pdx in ddIngressRows) {
              let resIngressObj = {
                neId: ddIngressRows[pdx][0],
                port: await dbNePortNameFromId(
                  ddIngressRows[pdx][0],
                  ddIngressRows[pdx][1]
                ),
              };
              if (toInteger(ddIngressRows[pdx][2]) > 0) {
                resIngressObj.cVlanId = toInteger(ddIngressRows[pdx][2]);
              }
              if (toInteger(ddIngressRows[pdx][3]) > 0) {
                resIngressObj.sVlanId = toInteger(ddIngressRows[pdx][3]);
              }
              if (toInteger(ddIngressRows[pdx][4]) > 0) {
                resIngressObj.member = toInteger(ddIngressRows[pdx][4]);
              }
              resJson.link.ingress.push(resIngressObj);
            }
          }
          let dde = await DDC.prepare(
            "SELECT neId,nePortId,cVlanId,sVlanId,lagMember FROM _serviceEgress WHERE serviceId = $1 AND serviceTsId = $2"
          );
          dde.bindVarchar(1, req.params.serviceId);
          dde.bindInteger(2, ddRows[0][14]);
          let ddEgressRead = await dde.runAndReadAll();
          let ddEgressRows = ddEgressRead.getRows();
          if (ddEgressRows.length > 0) {
            for (let pdx in ddEgressRows) {
              let resEgressObj = {
                neId: ddEgressRows[pdx][0],
                port: await dbNePortNameFromId(
                  ddEgressRows[pdx][0],
                  ddEgressRows[pdx][1]
                ),
              };
              if (toInteger(ddEgressRows[pdx][2]) > 0) {
                resEgressObj.cVlanId = toInteger(
                  toInteger(ddEgressRows[pdx][2])
                );
              }
              if (toInteger(ddEgressRows[pdx][3]) > 0) {
                resEgressObj.sVlanId = toInteger(
                  toInteger(ddEgressRows[pdx][3])
                );
              }
              if (toInteger(ddEgressRows[pdx][4]) > 0) {
                resEgressObj.member = toInteger(
                  toInteger(ddEgressRows[pdx][4])
                );
              }
              resJson.link.egress.push(resEgressObj);
            }
          }

          // pass to replace to regenerate the record
          req.body = jsonDeepMerge(resJson, req.body);
          return next();
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "serviceId " + req.params.serviceId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function replaceSingleService(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.body.link?.ingress != null) {
          for (let i = 0; i < req.body.link.ingress.length; i++) {
            if (!(await dbIdExists(req.body.link.ingress[i].neId, "ne"))) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "neId " + req.body.link.ingress[i].neId + " does not exist",
                });
            }
            if (
              !(await dbNePortExists(
                req.body.link.ingress[i].neId,
                req.body.link.ingress[i].port
              ))
            ) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "neId " +
                    req.body.link.ingress[i].neId +
                    " ingress port " +
                    req.body.link.ingress[i].port +
                    " does not exist",
                });
            }
          }
        }
        if (req.body.link?.egress != null) {
          for (let i = 0; i < req.body.link.egress.length; i++) {
            if (!(await dbIdExists(req.body.link.egress[i].neId, "ne"))) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "neId " + req.body.link.egress[i].neId + " does not exist",
                });
            }
            if (
              !(await dbNePortExists(
                req.body.link.egress[i].neId,
                req.body.link.egress[i].port
              ))
            ) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "neId " +
                    req.body.link.egress[i].neId +
                    " egress port " +
                    req.body.link.egress[i].port +
                    " does not exist",
                });
            }
          }
        }
        let ddp = await DDC.prepare(
          "SELECT id FROM service WHERE id = $1 AND delete = false LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.serviceId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let point = dayjs().format(dayjsFormat);
          let tsId = await getSeqNextValue("seq_service");
          let tsCol = "historicalTsId";
          switch (req.body.source) {
            case "historical":
              tsCol = "historicalTsId";
              break;
            case "predicted":
              tsCol = "predictedTsId";
              break;
          }
          let ddp = await DDC.prepare(
            "UPDATE service SET " +
              tsCol +
              " = $1, tsPoint = strptime($2,$3) WHERE id = $4"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body.point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.params.serviceId);
          await ddp.run();

          ddp = await DDC.prepare(
            "INSERT INTO _service (tsId,point,source,serviceId,commissioned) VALUES ($1,strptime($2,$3),$4,$5,strptime($6,$7))"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body.point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.body.source);
          ddp.bindVarchar(5, req.params.serviceId);
          ddp.bindVarchar(6, req.body.commissioned);
          ddp.bindVarchar(7, dateFormat);
          await ddp.run();

          if (req.body.reference != null) {
            await DDC.run(
              "UPDATE _service SET reference = '" +
                req.body.reference +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.customer.name != null) {
            await DDC.run(
              "UPDATE _service SET customerName = '" +
                req.body.customer.name +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.customer.reference != null) {
            await DDC.run(
              "UPDATE _service SET customerReference = '" +
                req.body.customer.reference +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.decommissioned != null) {
            await DDC.run(
              "UPDATE _service SET decommissioned = strptime('" +
                req.body.decommissioned +
                "','" +
                dateFormat +
                "') " +
                "WHERE tsId = " +
                tsId
            );
          }
          if (req.body.lag?.group != null) {
            await DDC.run(
              "UPDATE _service SET lagGroup = '" +
                req.body.lag.group +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.lag?.members != null) {
            await DDC.run(
              "UPDATE _service SET lagMembers = " +
                toInteger(req.body.lag.members) +
                " WHERE tsId = " +
                tsId
            );
          }
          if (req.body.link?.ingress != null) {
            for (let n = 0; n < req.body.link.ingress.length; n++) {
              let tsIngressId = await getSeqNextValue("seq_serviceIngress");
              let nePortId = await dbNePortIdFromName(
                req.body.link.ingress[n].neId,
                req.body.link.ingress[n].port
              );
              ddp = await DDC.prepare(
                "INSERT INTO _serviceIngress (tsId,point,source,serviceId,serviceTsId,neId,nePortId) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8)"
              );
              ddp.bindInteger(1, tsIngressId);
              ddp.bindVarchar(2, req.body.point);
              ddp.bindVarchar(3, pointFormat);
              ddp.bindVarchar(4, req.body.source);
              ddp.bindVarchar(5, req.params.serviceId);
              ddp.bindInteger(6, tsId);
              ddp.bindVarchar(7, req.body.link.ingress[n].neId);
              ddp.bindVarchar(8, nePortId);
              await ddp.run();
              if (req.body.link.ingress[n]?.cVlanId != null) {
                await DDC.run(
                  "UPDATE _serviceIngress SET cVlanId = " +
                    toInteger(req.body.link.ingress[n].cVlanId) +
                    " WHERE tsId = " +
                    tsIngressId
                );
              }
              if (req.body.link.ingress[n]?.sVlanId != null) {
                await DDC.run(
                  "UPDATE _serviceIngress SET sVlanId = " +
                    toInteger(req.body.link.ingress[n].sVlanId) +
                    " WHERE tsId = " +
                    tsIngressId
                );
              }
              if (req.body.link.ingress[n]?.member != null) {
                await DDC.run(
                  "UPDATE _serviceIngress SET lagMember = " +
                    toInteger(req.body.link.ingress[n].member) +
                    " WHERE tsId = " +
                    tsIngressId
                );
              }
              let { status, body } = await getNe(req.body.link.ingress[n].neId);
              for (let b = 0; b < body.ports.length; b++) {
                if (body.ports[b].name === req.body.link.ingress[n].port) {
                  body.ports[b].state = "used";
                  body.point = req.body.point;
                  break;
                }
              }
              status = await addNe(req.body.link.ingress[n].neId, body);
              if (status != 200) {
                return res
                  .contentType(OAS.mimeJSON)
                  .status(status)
                  .json({
                    errors:
                      "neId " +
                      req.body.link.ingress[n].neId +
                      " failed to set port " +
                      req.body.link.ingress[n].port +
                      " as used",
                  });
              }
            }
          }
          if (req.body.link?.egress != null) {
            for (let n = 0; n < req.body.link.egress.length; n++) {
              let tsEgressId = await getSeqNextValue("seq_serviceEgress");
              let nePortId = await dbNePortIdFromName(
                req.body.link.egress[n].neId,
                req.body.link.egress[n].port
              );
              ddp = await DDC.prepare(
                "INSERT INTO _serviceEgress (tsId,point,source,serviceId,serviceTsId,neId,nePortId) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8)"
              );
              ddp.bindInteger(1, tsEgressId);
              ddp.bindVarchar(2, req.body.point);
              ddp.bindVarchar(3, pointFormat);
              ddp.bindVarchar(4, req.body.source);
              ddp.bindVarchar(5, req.params.serviceId);
              ddp.bindInteger(6, tsId);
              ddp.bindVarchar(7, req.body.link.egress[n].neId);
              ddp.bindVarchar(8, nePortId);
              await ddp.run();
              if (req.body.link.egress[n]?.cVlanId != null) {
                await DDC.run(
                  "UPDATE _serviceEgress SET cVlanId = " +
                    toInteger(req.body.link.egress[n].cVlanId) +
                    " WHERE tsId = " +
                    tsEgressId
                );
              }
              if (req.body.link.egress[n]?.sVlanId != null) {
                await DDC.run(
                  "UPDATE _serviceEgress SET sVlanId = " +
                    toInteger(req.body.link.egress[n].sVlanId) +
                    " WHERE tsId = " +
                    tsEgressId
                );
              }
              if (req.body.link.egress[n]?.member != null) {
                await DDC.run(
                  "UPDATE _serviceEgress SET lagMember = " +
                    toInteger(req.body.link.egress[n].member) +
                    " WHERE tsId = " +
                    tsEgressId
                );
              }
              let { status, body } = await getNe(req.body.link.egress[n].neId);
              for (let b = 0; b < body.ports.length; b++) {
                if (body.ports[b].name === req.body.link.egress[n].port) {
                  body.ports[b].state = "used";
                  body.point = req.body.point;
                  break;
                }
              }
              status = await addNe(req.body.link.egress[n].neId, body);
              if (status != 200) {
                return res
                  .contentType(OAS.mimeJSON)
                  .status(status)
                  .json({
                    errors:
                      "neId " +
                      req.body.link.egress[n].neId +
                      " failed to set port " +
                      req.body.link.egress[n].port +
                      " as used",
                  });
              }
            }
          }
          if (req.body.source == "historical") {
            await dbAddPredictQueueItem(
              "service",
              req.params.serviceId,
              "update"
            );
          }
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "serviceId " + req.params.serviceId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getMultipleServices(req, res, next) {
    try {
      let resJson = [];
      let ddRead = await DDC.runAndReadAll(
        "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,source,reference,customerName,customerReference,strftime(commissioned,'" +
          dateFormat +
          "'),strftime(decommissioned,'" +
          dateFormat +
          "'),lagGroup,lagMembers,strftime(point,'" +
          pointFormat +
          "'),tsId FROM service,_service WHERE _service.serviceId = service.id AND service.delete = false ORDER BY _service.point DESC"
      );
      let ddRows = ddRead.getRows();
      if (ddRows.length > 0) {
        for (let idx in ddRows) {
          let resObj = {
            serviceId: ddRows[idx][0],
            point: ddRows[idx][13],
            customer: {},
            commissioned: ddRows[idx][9],
            link: { ingress: [], egress: [] },
            source: ddRows[idx][5],
            delete: toBoolean(ddRows[idx][1]),
          };
          if (ddRows[idx][6] != null) {
            resObj.reference = ddRows[idx][6];
          }
          if (ddRows[idx][7] != null) {
            resObj.customer.name = ddRows[idx][7];
          }
          if (ddRows[idx][8] != null) {
            resObj.customer.reference = ddRows[idx][8];
          }
          if (ddRows[idx][10] != null) {
            resObj.decommissioned = ddRows[idx][10];
          }
          if (ddRows[idx][11] != null || toInteger(ddRows[idx][12]) > 0) {
            resObj.lag = {};
            if (ddRows[idx][11] != null) {
              resObj.lag.group = ddRows[idx][11];
            }
            if (ddRows[idx][12] > 0) {
              resObj.lag.members = ddRows[idx][12];
            }
          }

          let ddi = await DDC.prepare(
            "SELECT neId,nePortId,cVlanId,sVlanId,lagMember FROM _serviceIngress WHERE serviceId = $1 AND serviceTsId = $2"
          );
          ddi.bindVarchar(1, ddRows[idx][0]);
          ddi.bindInteger(2, ddRows[idx][14]);
          let ddIngressRead = await ddi.runAndReadAll();
          let ddIngressRows = ddIngressRead.getRows();
          if (ddIngressRows.length > 0) {
            for (let pdx in ddIngressRows) {
              let resIngressObj = {
                neId: ddIngressRows[pdx][0],
                port: await dbNePortNameFromId(
                  ddIngressRows[pdx][0],
                  ddIngressRows[pdx][1]
                ),
              };
              if (toInteger(ddIngressRows[pdx][2]) > 0) {
                resIngressObj.cVlanId = toInteger(ddIngressRows[pdx][2]);
              }
              if (toInteger(ddIngressRows[pdx][3]) > 0) {
                resIngressObj.sVlanId = toInteger(ddIngressRows[pdx][3]);
              }
              if (toInteger(ddIngressRows[pdx][4]) > 0) {
                resIngressObj.member = toInteger(ddIngressRows[pdx][4]);
              }
              resObj.link.ingress.push(resIngressObj);
            }
          }
          let dde = await DDC.prepare(
            "SELECT neId,nePortId,cVlanId,sVlanId,lagMember FROM _serviceEgress WHERE serviceId = $1 AND serviceTsId = $2"
          );
          dde.bindVarchar(1, ddRows[idx][0]);
          dde.bindInteger(2, ddRows[idx][14]);
          let ddEgressRead = await dde.runAndReadAll();
          let ddEgressRows = ddEgressRead.getRows();
          if (ddEgressRows.length > 0) {
            for (let pdx in ddEgressRows) {
              let resEgressObj = {
                neId: ddEgressRows[pdx][0],
                port: await dbNePortNameFromId(
                  ddEgressRows[pdx][0],
                  ddEgressRows[pdx][1]
                ),
              };
              if (toInteger(ddEgressRows[pdx][2]) > 0) {
                resEgressObj.cVlanId = toInteger(
                  toInteger(ddEgressRows[pdx][2])
                );
              }
              if (toInteger(ddEgressRows[pdx][3]) > 0) {
                resEgressObj.sVlanId = toInteger(
                  toInteger(ddEgressRows[pdx][3])
                );
              }
              if (toInteger(ddEgressRows[pdx][4]) > 0) {
                resEgressObj.member = toInteger(
                  toInteger(ddEgressRows[pdx][4])
                );
              }
              resObj.link.egress.push(resEgressObj);
            }
          }
          resJson.push(resObj);
        }
        resJson = jsonSortByMultiKeys(resJson, ["point", "source"]);
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res.sendStatus(204);
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addMultipleServices(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        req.body = jsonSortByMultiKeys(req.body, ["point", "source"]);
        let resJson = [];
        for (let t = 0; t < req.body.length; t++) {
          if (req.body[t].link?.ingress != null) {
            for (let i = 0; i < req.body[t].link.ingress.length; i++) {
              if (!(await dbIdExists(req.body[t].link.ingress[i].neId, "ne"))) {
                return res
                  .contentType(OAS.mimeJSON)
                  .status(404)
                  .json({
                    errors:
                      "neId " +
                      req.body[t].link.ingress[i].neId +
                      " does not exist",
                  });
              }
              if (
                !(await dbNePortExists(
                  req.body[t].link.ingress[i].neId,
                  req.body[t].link.ingress[i].port
                ))
              ) {
                return res
                  .contentType(OAS.mimeJSON)
                  .status(404)
                  .json({
                    errors:
                      "neId " +
                      req.body[t].link.ingress[i].neId +
                      " ingress port " +
                      req.body[t].link.ingress[i].port +
                      " does not exist",
                  });
              }
            }
          }
          if (req.body[t].link?.egress != null) {
            for (let i = 0; i < req.body[t].link.egress.length; i++) {
              if (!(await dbIdExists(req.body[t].link.egress[i].neId, "ne"))) {
                return res
                  .contentType(OAS.mimeJSON)
                  .status(404)
                  .json({
                    errors:
                      "neId " +
                      req.body[t].link.egress[i].neId +
                      " does not exist",
                  });
              }
              if (
                !(await dbNePortExists(
                  req.body[t].link.egress[i].neId,
                  req.body[t].link.egress[i].port
                ))
              ) {
                return res
                  .contentType(OAS.mimeJSON)
                  .status(404)
                  .json({
                    errors:
                      "neId " +
                      req.body[t].link.egress[i].neId +
                      " egress port " +
                      req.body[t].link.egress[i].port +
                      " does not exist",
                  });
              }
            }
          }
        }
        for (let i = 0; i < req.body.length; i++) {
          let ddd = await DDC.runAndReadAll(
            "SELECT id FROM service WHERE id = '" + req.body[i].serviceId + "'"
          );
          let dddRows = ddd.getRows();
          if (dddRows.length > 0) {
            await DDC.run(
              "DELETE FROM _serviceIngress WHERE serviceId = '" +
                req.body[i].serviceId +
                "'"
            );
            await DDC.run(
              "DELETE FROM _serviceEgress WHERE serviceId = '" +
                req.body[i].serviceId +
                "'"
            );
            await DDC.run(
              "DELETE FROM _service WHERE serviceId = '" +
                req.body[i].serviceId +
                "'"
            );
            await DDC.run(
              "UPDATE service SET delete = false, historicalTsId = NULL, predictedTsId = NULL, tsPoint = now()::timestamp WHERE id = '" +
                req.body[i].serviceId +
                "'"
            );
          }
        }
        for (let i = 0; i < req.body.length; i++) {
          let tsId = await getSeqNextValue("seq_service");
          let tsCol = "historicalTsId";

          switch (req.body[i].source) {
            case "historical":
              tsCol = "historicalTsId";
              break;
            case "predicted":
              tsCol = "predictedTsId";
              break;
          }

          let ddq = await DDC.runAndReadAll(
            "SELECT id FROM service WHERE id = '" + req.body[i].serviceId + "'"
          );
          let ddqRows = ddq.getRows();
          if (ddqRows.length == 0) {
            let ddp = await DDC.prepare(
              "INSERT INTO service (id,delete," +
                tsCol +
                ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
            );
            ddp.bindVarchar(1, req.body[i].serviceId);
            ddp.bindBoolean(2, toBoolean(req.body[i].delete));
            ddp.bindInteger(3, tsId);
            ddp.bindVarchar(4, req.body[i].point);
            ddp.bindVarchar(5, pointFormat);
            await ddp.run();
          } else {
            let ddp = await DDC.prepare(
              "UPDATE service SET delete = $1, " + tsCol + " = $2 WHERE id = $3"
            );
            ddp.bindBoolean(1, toBoolean(req.body[i].delete));
            ddp.bindInteger(2, tsId);
            ddp.bindVarchar(3, req.body[i].serviceId);
            await ddp.run();
          }

          let ddp = await DDC.prepare(
            "INSERT INTO _service (tsId,point,source,serviceId,commissioned) VALUES ($1,strptime($2,$3),$4,$5,strptime($6,$7))"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body[i].point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.body[i].source);
          ddp.bindVarchar(5, req.body[i].serviceId);
          ddp.bindVarchar(6, req.body[i].commissioned);
          ddp.bindVarchar(7, dateFormat);
          await ddp.run();

          if (req.body[i].reference != null) {
            await DDC.run(
              "UPDATE _service SET reference = '" +
                req.body[i].reference +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].customer.name != null) {
            await DDC.run(
              "UPDATE _service SET customerName = '" +
                req.body[i].customer.name +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].customer.reference != null) {
            await DDC.run(
              "UPDATE _service SET customerReference = '" +
                req.body[i].customer.reference +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].decommissioned != null) {
            await DDC.run(
              "UPDATE _service SET decommissioned = strptime('" +
                req.body[i].decommissioned +
                "','" +
                dateFormat +
                "') " +
                "WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].lag?.group != null) {
            await DDC.run(
              "UPDATE _service SET lagGroup = '" +
                req.body[i].lag.group +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].lag?.members != null) {
            await DDC.run(
              "UPDATE _service SET lagMembers = " +
                toInteger(req.body[i].lag.members) +
                " WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].link?.ingress != null) {
            for (let n = 0; n < req.body[i].link.ingress.length; n++) {
              let tsIngressId = await getSeqNextValue("seq_serviceIngress");
              let nePortId = await dbNePortIdFromName(
                req.body[i].link.ingress[n].neId,
                req.body[i].link.ingress[n].port
              );
              ddp = await DDC.prepare(
                "INSERT INTO _serviceIngress (tsId,point,source,serviceId,serviceTsId,neId,nePortId) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8)"
              );
              ddp.bindInteger(1, tsIngressId);
              ddp.bindVarchar(2, req.body[i].point);
              ddp.bindVarchar(3, pointFormat);
              ddp.bindVarchar(4, req.body[i].source);
              ddp.bindVarchar(5, req.body[i].serviceId);
              ddp.bindInteger(6, tsId);
              ddp.bindVarchar(7, req.body[i].link.ingress[n].neId);
              ddp.bindVarchar(8, nePortId);
              await ddp.run();
              if (req.body[i].link.ingress[n]?.cVlanId != null) {
                await DDC.run(
                  "UPDATE _serviceIngress SET cVlanId = " +
                    toInteger(req.body[i].link.ingress[n].cVlanId) +
                    " WHERE tsId = " +
                    tsIngressId
                );
              }
              if (req.body[i].link.ingress[n]?.sVlanId != null) {
                await DDC.run(
                  "UPDATE _serviceIngress SET sVlanId = " +
                    toInteger(req.body[i].link.ingress[n].sVlanId) +
                    " WHERE tsId = " +
                    tsIngressId
                );
              }
              if (req.body[i].link.ingress[n]?.member != null) {
                await DDC.run(
                  "UPDATE _serviceIngress SET lagMember = " +
                    toInteger(req.body[i].link.ingress[n].member) +
                    " WHERE tsId = " +
                    tsIngressId
                );
              }
              let { status, body } = await getNe(
                req.body[i].link.ingress[n].neId
              );
              for (let b = 0; b < body.ports.length; b++) {
                if (body.ports[b].name === req.body[i].link.ingress[n].port) {
                  body.ports[b].state = "used";
                  body.point = req.body[i].point;
                  break;
                }
              }
              status = await addNe(req.body[i].link.ingress[n].neId, body);
              if (status != 200) {
                return res
                  .contentType(OAS.mimeJSON)
                  .status(status)
                  .json({
                    errors:
                      "neId " +
                      req.body[i].link.ingress[n].neId +
                      " failed to set port " +
                      req.body[i].link.ingress[n].port +
                      " as used",
                  });
              }
            }
          }
          if (req.body[i].link?.egress != null) {
            for (let n = 0; n < req.body[i].link.egress.length; n++) {
              let tsEgressId = await getSeqNextValue("seq_serviceEgress");
              let nePortId = await dbNePortIdFromName(
                req.body[i].link.egress[n].neId,
                req.body[i].link.egress[n].port
              );
              ddp = await DDC.prepare(
                "INSERT INTO _serviceEgress (tsId,point,source,serviceId,serviceTsId,neId,nePortId) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8)"
              );
              ddp.bindInteger(1, tsEgressId);
              ddp.bindVarchar(2, req.body[i].point);
              ddp.bindVarchar(3, pointFormat);
              ddp.bindVarchar(4, req.body[i].source);
              ddp.bindVarchar(5, req.body[i].serviceId);
              ddp.bindInteger(6, tsId);
              ddp.bindVarchar(7, req.body[i].link.egress[n].neId);
              ddp.bindVarchar(8, nePortId);
              await ddp.run();
              if (req.body[i].link.egress[n]?.cVlanId != null) {
                await DDC.run(
                  "UPDATE _serviceEgress SET cVlanId = " +
                    toInteger(req.body[i].link.egress[n].cVlanId) +
                    " WHERE tsId = " +
                    tsEgressId
                );
              }
              if (req.body[i].link.egress[n]?.sVlanId != null) {
                await DDC.run(
                  "UPDATE _serviceEgress SET sVlanId = " +
                    toInteger(req.body[i].link.egress[n].sVlanId) +
                    " WHERE tsId = " +
                    tsEgressId
                );
              }
              if (req.body[i].link.egress[n]?.member != null) {
                await DDC.run(
                  "UPDATE _serviceEgress SET lagMember = " +
                    toInteger(req.body[i].link.egress[n].member) +
                    " WHERE tsId = " +
                    tsEgressId
                );
              }
              let { status, body } = await getNe(
                req.body[i].link.egress[n].neId
              );
              for (let b = 0; b < body.ports.length; b++) {
                if (body.ports[b].name === req.body[i].link.egress[n].port) {
                  body.ports[b].state = "used";
                  body.point = req.body[i].point;
                  break;
                }
              }
              status = await addNe(req.body[i].link.egress[n].neId, body);
              if (status != 200) {
                return res
                  .contentType(OAS.mimeJSON)
                  .status(status)
                  .json({
                    errors:
                      "neId " +
                      req.body[i].link.egress[n].neId +
                      " failed to set port " +
                      req.body[i].link.egress[n].port +
                      " as used",
                  });
              }
            }
          }
          if (req.body[i].source == "historical") {
            await dbAddPredictQueueItem(
              "service",
              req.body[i].serviceId,
              "create"
            );
          }
          resJson.push(req.body[i].serviceId);
        }
        resJson = Array.from(new Set(resJson.map(JSON.stringify)))
          .map(JSON.parse)
          .sort();
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllSites(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let resJson = [];
        let ddRead = await DDC.runAndReadAll(
          "SELECT id FROM site WHERE delete = false"
        );
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            resJson.push(ddRows[idx][0]);
          }
          resJson.sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllSitesOnNet(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let resJson = [];
        let ddRead = await DDC.runAndReadAll(
          "SELECT id,reference,area,type,postalcode,country FROM site,_site WHERE _site.siteId = site.id AND onnet = true AND delete = false AND _site.tsId = site.historicalTsId"
        );
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            resJson.push({
              siteId: ddRows[idx][0],
              reference: ddRows[idx][1],
              area: ddRows[idx][2],
              type: ddRows[idx][3],
              postalCode: ddRows[idx][4],
              country: ddRows[idx][5],
            });
          }
          resJson.sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllSitesOffNet(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let resJson = [];
        let ddRead = await DDC.runAndReadAll(
          "SELECT id,reference,area,type,postalcode,country FROM site,_site WHERE _site.siteId = site.id AND onnet = false AND delete = false AND _site.tsId = site.historicalTsId"
        );
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            resJson.push({
              siteId: ddRows[idx][0],
              reference: ddRows[idx][1],
              area: ddRows[idx][2],
              type: ddRows[idx][3],
              postalCode: ddRows[idx][4],
              country: ddRows[idx][5],
            });
          }
          resJson.sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSitesSimpleStatistics(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        res
          .contentType(OAS.mimeJSON)
          .status(200)
          .json(await dbActiveInactiveCounts("site"));
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addSingleSite(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let siteId = uuidv4();
        let tsId = await getSeqNextValue("seq_site");
        let tsCol = "historicalTsId";
        switch (req.body.source) {
          case "historical":
            tsCol = "historicalTsId";
            break;
          case "predicted":
            tsCol = "predictedTsId";
            break;
          default:
            tsCol = "historicalTsId";
        }

        let ddq = await DDC.runAndReadAll(
          "SELECT id FROM site WHERE id = '" + siteId + "'"
        );
        let ddqRows = ddq.getRows();
        if (ddqRows.length == 0) {
          let ddp = await DDC.prepare(
            "INSERT INTO site (id,delete," +
              tsCol +
              ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
          );
          ddp.bindVarchar(1, siteId);
          ddp.bindBoolean(2, toBoolean(req.body.delete));
          ddp.bindInteger(3, tsId);
          ddp.bindVarchar(4, req.body.point);
          ddp.bindVarchar(5, pointFormat);
          await ddp.run();
        } else {
          let ddp = await DDC.prepare(
            "UPDATE site SET delete = $1, " + tsCol + " = $2 WHERE id = $3"
          );
          ddp.bindBoolean(1, toBoolean(req.body.delete));
          ddp.bindInteger(2, tsId);
          ddp.bindVarchar(3, ductId);
          await ddp.run();
        }

        let ddp = await DDC.prepare(
          "INSERT INTO _site (tsId,point,siteId,source,reference,commissioned,area,type,country,region,town,street,premisesNameNumber,postalCode,x,y,z,onNet) VALUES ($1,strptime($2,$3),$4,$5,$6,strptime($7,$8),$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)"
        );
        ddp.bindInteger(1, tsId);
        ddp.bindVarchar(2, req.body.point);
        ddp.bindVarchar(3, pointFormat);
        ddp.bindVarchar(4, siteId);
        ddp.bindVarchar(5, req.body.source);
        ddp.bindVarchar(6, req.body.reference);
        ddp.bindVarchar(7, req.body.commissioned);
        ddp.bindVarchar(8, dateFormat);
        ddp.bindVarchar(9, req.body.area);
        ddp.bindVarchar(10, req.body.type);
        ddp.bindVarchar(11, req.body.location.country);
        ddp.bindVarchar(12, req.body.location.region);
        ddp.bindVarchar(13, req.body.location.town);
        ddp.bindVarchar(14, req.body.location.street);
        ddp.bindVarchar(15, req.body.location.premisesNameNumber);
        ddp.bindVarchar(16, req.body.location.postalCode);
        ddp.bindFloat(
          17,
          toDecimal(
            req.body.location.coordinate.x,
            OAS.X_scale,
            OAS.XY_precision
          )
        );
        ddp.bindFloat(
          18,
          toDecimal(
            req.body.location.coordinate.y,
            OAS.Y_scale,
            OAS.XY_precision
          )
        );
        ddp.bindFloat(
          19,
          toDecimal(
            req.body.location.coordinate.z,
            OAS.Z_scale,
            OAS.Z_precision
          )
        );
        ddp.bindBoolean(20, toBoolean(req.body.onNet));
        await ddp.run();

        if (req.body.location.district != null) {
          await DDC.run(
            "UPDATE _site SET district = '" +
              req.body.location.district +
              "' " +
              "WHERE tsId = " +
              tsId
          );
        }
        if (req.body.decommissioned != null) {
          await DDC.run(
            "UPDATE _site SET decommissioned = strptime('" +
              req.body.decommissioned +
              "','" +
              dateFormat +
              "') " +
              "WHERE tsId = " +
              tsId
          );
        }
        if (req.body.location.coordinate?.m != null) {
          await DDC.run(
            "UPDATE _site SET M = '" +
              req.body.location.coordinate.m +
              "' " +
              "WHERE tsId = " +
              tsId
          );
        }
        res.contentType(OAS.mimeJSON).status(200).json({ siteId: siteId });
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function deleteSingleSite(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        // recover (restore) previously deleted if still exists
        if (req.query?.restore != null) {
          let point = dayjs().format(dayjsFormat);
          let ddRead = await DDC.runAndReadAll(
            "SELECT site.id FROM site,_site WHERE site.id = '" +
              req.params.siteId +
              "' AND _site.siteId = site.id AND _site.source = 'historical' AND site.delete = true LIMIT 1"
          );
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            await DDC.run(
              "UPDATE site SET tsPoint = strptime('" +
                point +
                "','" +
                pointFormat +
                "'), delete = false WHERE id = '" +
                req.params.siteId +
                "'"
            );
            await dbAddPredictQueueItem("site", req.params.siteId, "undelete");
            res.sendStatus(204);
          } else {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "siteId " + req.params.siteId + " does not exist",
              });
          }
        } else {
          let ddp = await DDC.prepare(
            "SELECT id,tsPoint,historicalTsId,predictedTsId,source FROM site,_site WHERE site.id = $1 AND _site.tsId = site.historicalTsId AND site.delete = false"
          );
          ddp.bindVarchar(1, req.params.siteId);
          let ddRead = await ddp.runAndReadAll();
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            if (req.query?.predicted != null) {
              await DDC.run(
                "DELETE FROM _site WHERE siteId = '" +
                  req.params.siteId +
                  "' and source = 'predicted'"
              );
              await DDC.run(
                "UPDATE site SET predictedTsId = NULL WHERE id = '" +
                  req.params.siteId +
                  "'"
              );
              res.sendStatus(204);
            } else {
              let point = dayjs().format(dayjsFormat);
              let tsId = await getSeqNextValue("seq_site");
              let tsCol = "historicalTsId";
              switch (ddRows[0][4]) {
                case "historical":
                  tsCol = "historicalTsId";
                  break;
                case "predicted":
                  tsCol = "predictedTsId";
                  break;
              }
              let ddClone = await DDC.prepare(
                "INSERT INTO _site (tsId,point,siteId,source,reference,commissioned,decommissioned,onNet,area,type,country,region,town,district,street,premisesNameNumber,postalCode,x,y,z,m) SELECT $1,strptime($2,$3),siteId,source,reference,commissioned,decommissioned,onNet,area,type,country,region,town,district,street,premisesNameNumber,postalCode,x,y,z,m FROM _site WHERE tsId = $4"
              );
              ddClone.bindInteger(1, tsId);
              ddClone.bindVarchar(2, point);
              ddClone.bindVarchar(3, pointFormat);
              ddClone.bindInteger(4, ddRows[0][2]);
              await ddClone.run();
              await DDC.run(
                "UPDATE site SET " +
                  tsCol +
                  " = " +
                  tsId +
                  ", tsPoint = strptime('" +
                  point +
                  "','" +
                  pointFormat +
                  "'), delete = true WHERE id = '" +
                  req.params.siteId +
                  "'"
              );
              await dbAddPredictQueueItem("site", req.params.siteId, "delete");
              res.sendStatus(204);
            }
          } else {
            res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "siteId " + req.params.siteId + " does not exist",
              });
          }
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSingleSite(req, res, next) {
    let datePoint = "AND _site.tsId = site.historicalTsId";
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.query?.point != null) {
          datePoint =
            "AND strftime(_site.point,'" +
            pointFormat +
            "') = '" +
            req.query.point +
            "'";
        }
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,strftime(point,'" +
            pointFormat +
            "'),source,reference,strftime(commissioned,'" +
            dateFormat +
            "'),strftime(decommissioned,'" +
            dateFormat +
            "'),area,type,country,region,town,district,street,premisesNameNumber,postalCode,x,y,z,m,strftime(point,'" +
            pointFormat +
            "'),onNet FROM site, _site WHERE site.id = $1 AND _site.siteId = site.id AND site.delete = false " +
            datePoint +
            " ORDER BY _site.point DESC LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.siteId);
        let ddSite = await ddp.runAndReadAll();
        let ddRows = ddSite.getRows();
        if (ddRows.length > 0) {
          resJson = {
            siteId: req.params.siteId,
            point: ddRows[0][23],
            reference: ddRows[0][7],
            commissioned: ddRows[0][8],
            onNet: ddRows[0][24],
            area: ddRows[0][10],
            type: ddRows[0][11],
            location: {
              country: ddRows[0][12],
              region: ddRows[0][13],
              town: ddRows[0][14],
              street: ddRows[0][16],
              premisesNameNumber: ddRows[0][17],
              postalCode: ddRows[0][18],
              coordinate: {
                x: toDecimal(ddRows[0][19], OAS.X_scale, OAS.XY_precision),
                y: toDecimal(ddRows[0][20], OAS.Y_scale, OAS.XY_precision),
                z: toDecimal(ddRows[0][21], OAS.Z_scale, OAS.Z_precision),
              },
            },
            source: ddRows[0][6],
            delete: toBoolean(ddRows[0][1]),
          };
          if (ddRows[0][9] != null) {
            resJson.decommissioned = ddRows[0][9];
          }
          if (ddRows[0][15] != null) {
            resJson.location.district = ddRows[0][15];
          }
          if (ddRows[0][22] != null) {
            resJson.location.coordinate.m = ddRows[0][22];
          }
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "siteId " + req.params.siteId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSiteTimeline(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddp = await DDC.prepare(
          "SELECT strftime(point,'" +
            pointFormat +
            "'),source FROM site, _site WHERE id = $1 AND siteId = id AND delete = false ORDER BY point DESC"
        );
        ddp.bindVarchar(1, req.params.siteId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let resJson = [];
          for (let idx in ddRows) {
            resJson.push({ point: ddRows[idx][0], source: ddRows[idx][1] });
          }
          resJson = Array.from(new Set(resJson.map(JSON.stringify)))
            .map(JSON.parse)
            .sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "siteId " + req.params.siteId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateSingleSite(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,strftime(point,'" +
            pointFormat +
            "'),source,reference,strftime(commissioned,'" +
            dateFormat +
            "'),strftime(decommissioned,'" +
            dateFormat +
            "'),area,type,country,region,town,district,street,premisesNameNumber,postalCode,x,y,z,m,onNet FROM site, _site WHERE id = $1 AND tsId = historicalTsId AND site.delete = false LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.siteId);
        let ddSite = await ddp.runAndReadAll();
        let ddRows = ddSite.getRows();
        if (ddRows.length > 0) {
          resJson = {
            siteId: req.params.siteId,
            point: ddRows[0][5],
            reference: ddRows[0][7],
            commissioned: ddRows[0][8],
            onNet: toBoolean(ddRows[0][23]),
            area: ddRows[0][10],
            type: ddRows[0][11],
            location: {
              country: ddRows[0][12],
              region: ddRows[0][13],
              town: ddRows[0][14],
              street: ddRows[0][16],
              premisesNameNumber: ddRows[0][17],
              postalCode: ddRows[0][18],
              coordinate: {
                x: toDecimal(ddRows[0][19], OAS.X_scale, OAS.XY_precision),
                y: toDecimal(ddRows[0][20], OAS.Y_scale, OAS.XY_precision),
                z: toDecimal(ddRows[0][21], OAS.Z_scale, OAS.Z_precision),
              },
            },
            source: ddRows[0][6],
            delete: toBoolean(ddRows[0][1]),
          };
          if (ddRows[0][9] != null) {
            resJson.decommissioned = ddRows[0][9];
          }
          if (ddRows[0][15] != null) {
            resJson.location.district = ddRows[0][15];
          }
          if (ddRows[0][22] != null) {
            resJson.location.coordinate.m = ddRows[0][22];
          }
          // pass to replace to regenerate the record
          req.body = jsonDeepMerge(resJson, req.body);
          return next();
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "siteId " + req.params.siteId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function replaceSingleSite(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddp = await DDC.prepare(
          "SELECT id FROM site WHERE id = $1 AND delete = false LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.siteId);
        let ddSite = await ddp.runAndReadAll();
        let ddRows = ddSite.getRows();
        if (ddRows.length > 0) {
          let point = dayjs().format(dayjsFormat);
          let tsId = await getSeqNextValue("seq_site");
          let tsCol = "historicalTsId";
          switch (req.body.source) {
            case "historical":
              tsCol = "historicalTsId";
              break;
            case "predicted":
              tsCol = "predictedTsId";
              break;
          }
          let ddp = await DDC.prepare(
            "UPDATE site SET " +
              tsCol +
              " = $1, tsPoint = strptime($2,$3) WHERE id = $4"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body.point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.params.siteId);
          await ddp.run();

          ddp = await DDC.prepare(
            "INSERT INTO _site (tsId,point,siteId,source,reference,commissioned,area,type,country,region,town,street,premisesNameNumber,postalCode,x,y,z,onNet) VALUES ($1,strptime($2,$3),$4,$5,$6,strptime($7,$8),$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body.point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.params.siteId);
          ddp.bindVarchar(5, req.body.source);
          ddp.bindVarchar(6, req.body.reference);
          ddp.bindVarchar(7, req.body.commissioned);
          ddp.bindVarchar(8, dateFormat);
          ddp.bindVarchar(9, req.body.area);
          ddp.bindVarchar(10, req.body.type);
          ddp.bindVarchar(11, req.body.location.country);
          ddp.bindVarchar(12, req.body.location.region);
          ddp.bindVarchar(13, req.body.location.town);
          ddp.bindVarchar(14, req.body.location.street);
          ddp.bindVarchar(15, req.body.location.premisesNameNumber);
          ddp.bindVarchar(16, req.body.location.postalCode);
          ddp.bindFloat(
            17,
            toDecimal(
              req.body.location.coordinate.x,
              OAS.X_scale,
              OAS.XY_precision
            )
          );
          ddp.bindFloat(
            18,
            toDecimal(
              req.body.location.coordinate.y,
              OAS.Y_scale,
              OAS.XY_precision
            )
          );
          ddp.bindFloat(
            19,
            toDecimal(
              req.body.location.coordinate.z,
              OAS.Z_scale,
              OAS.Z_precision
            )
          );
          ddp.bindBoolean(20, toBoolean(req.body.onNet));
          await ddp.run();

          if (req.body.location.district != null) {
            await DDC.run(
              "UPDATE _site SET district = '" +
                req.body.location.district +
                "' " +
                "WHERE tsId = " +
                tsId
            );
          }
          if (req.body.decommissioned != null) {
            await DDC.run(
              "UPDATE _site SET decommissioned = strptime('" +
                req.body.decommissioned +
                "','" +
                dateFormat +
                "') " +
                "WHERE tsId = " +
                tsId
            );
          }
          if (req.body.location?.coordinate?.m != null) {
            await DDC.run(
              "UPDATE _site SET M = '" +
                req.body.location.coordinate.m +
                "' " +
                "WHERE tsId = " +
                tsId
            );
          }
          if (req.body.source == "historical") {
            await dbAddPredictQueueItem("site", req.params.siteId, "update");
          }
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "siteId " + req.params.siteId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getMultipleSites(req, res, next) {
    try {
      let resJson = [];
      let ddSite = await DDC.runAndReadAll(
        "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,strftime(point,'" +
          pointFormat +
          "'),source,reference,strftime(commissioned,'" +
          dateFormat +
          "'),strftime(decommissioned,'" +
          dateFormat +
          "'),area,type,country,region,town,district,street,premisesNameNumber,postalCode,x,y,z,m,onNet FROM site, _site WHERE _site.siteId = site.id ORDER BY _site.point"
      );
      let ddRows = ddSite.getRows();
      if (ddRows.length > 0) {
        for (let idx in ddRows) {
          let resObj = {
            siteId: ddRows[idx][0],
            point: ddRows[idx][5],
            reference: ddRows[idx][7],
            commissioned: ddRows[idx][8],
            onNet: ddRows[idx][23],
            area: ddRows[idx][10],
            type: ddRows[idx][11],
            location: {
              country: ddRows[idx][12],
              region: ddRows[idx][13],
              town: ddRows[idx][14],
              street: ddRows[idx][16],
              premisesNameNumber: ddRows[idx][17],
              postalCode: ddRows[idx][18],
              coordinate: {
                x: toDecimal(ddRows[idx][19], OAS.X_scale, OAS.XY_precision),
                y: toDecimal(ddRows[idx][20], OAS.Y_scale, OAS.XY_precision),
                z: toDecimal(ddRows[idx][21], OAS.Z_scale, OAS.Z_precision),
              },
            },
            source: ddRows[idx][6],
            delete: toBoolean(ddRows[idx][1]),
          };
          if (ddRows[idx][9] != null) {
            resObj.decommissioned = ddRows[idx][9];
          }
          if (ddRows[idx][15] != null) {
            resObj.location.district = ddRows[idx][15];
          }
          if (ddRows[idx][22] != null) {
            resObj.location.coordinate.m = ddRows[idx][22];
          }
          resJson.push(resObj);
        }
        resJson = jsonSortByMultiKeys(resJson, ["point", "source"]);
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res.sendStatus(204);
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addMultipleSites(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        req.body = jsonSortByMultiKeys(req.body, ["point", "source"]);
        let resJson = [];
        for (let i = 0; i < req.body.length; i++) {
          let ddd = await DDC.runAndReadAll(
            "SELECT id FROM site WHERE id = '" + req.body[i].siteId + "'"
          );
          let dddRows = ddd.getRows();
          if (dddRows.length > 0) {
            await DDC.run(
              "DELETE FROM _site WHERE siteId = '" + req.body[i].siteId + "'"
            );
            await DDC.run(
              "UPDATE site SET delete = false, historicalTsId = NULL, predictedTsId = NULL, tsPoint = now()::timestamp WHERE id = '" +
                req.body[i].siteId +
                "'"
            );
          }
        }
        for (let i = 0; i < req.body.length; i++) {
          let tsId = await getSeqNextValue("seq_site");
          let tsCol = "historicalTsId";
          switch (req.body.source) {
            case "historical":
              tsCol = "historicalTsId";
              break;
            case "predicted":
              tsCol = "predictedTsId";
              break;
          }

          let ddq = await DDC.runAndReadAll(
            "SELECT id FROM site WHERE id = '" + req.body[i].siteId + "'"
          );
          let ddqRows = ddq.getRows();
          if (ddqRows.length == 0) {
            let ddp = await DDC.prepare(
              "INSERT INTO site (id,delete," +
                tsCol +
                ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
            );
            ddp.bindVarchar(1, req.body[i].siteId);
            ddp.bindBoolean(2, toBoolean(req.body[i].delete));
            ddp.bindInteger(3, tsId);
            ddp.bindVarchar(4, req.body[i].point);
            ddp.bindVarchar(5, pointFormat);
            await ddp.run();
          } else {
            let ddp = await DDC.prepare(
              "UPDATE site SET delete = $1, " + tsCol + " = $2 WHERE id = $3"
            );
            ddp.bindBoolean(1, toBoolean(req.body[i].delete));
            ddp.bindInteger(2, tsId);
            ddp.bindVarchar(3, req.body[i].siteId);
            await ddp.run();
          }

          let ddp = await DDC.prepare(
            "INSERT INTO _site (tsId,point,siteId,source,reference,commissioned,area,type,country,region,town,street,premisesNameNumber,postalCode,x,y,z,onNet) VALUES ($1,strptime($2,$3),$4,$5,$6,strptime($7,$8),$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body[i].point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.body[i].siteId);
          ddp.bindVarchar(5, req.body[i].source);
          ddp.bindVarchar(6, req.body[i].reference);
          ddp.bindVarchar(7, req.body[i].commissioned);
          ddp.bindVarchar(8, dateFormat);
          ddp.bindVarchar(9, req.body[i].area);
          ddp.bindVarchar(10, req.body[i].type);
          ddp.bindVarchar(11, req.body[i].location.country);
          ddp.bindVarchar(12, req.body[i].location.region);
          ddp.bindVarchar(13, req.body[i].location.town);
          ddp.bindVarchar(14, req.body[i].location.street);
          ddp.bindVarchar(15, req.body[i].location.premisesNameNumber);
          ddp.bindVarchar(16, req.body[i].location.postalCode);
          ddp.bindFloat(
            17,
            toDecimal(
              req.body[i].location.coordinate.x,
              OAS.X_scale,
              OAS.XY_precision
            )
          );
          ddp.bindFloat(
            18,
            toDecimal(
              req.body[i].location.coordinate.y,
              OAS.Y_scale,
              OAS.XY_precision
            )
          );
          ddp.bindFloat(
            19,
            toDecimal(
              req.body[i].location.coordinate.z,
              OAS.Z_scale,
              OAS.Z_precision
            )
          );
          ddp.bindBoolean(20, toBoolean(req.body[i].onNet));
          await ddp.run();

          if (req.body[i].location.district != null) {
            await DDC.run(
              "UPDATE _site SET district = '" +
                req.body[i].location.district +
                "' " +
                "WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].decommissioned != null) {
            await DDC.run(
              "UPDATE _site SET decommissioned = strptime('" +
                req.body[i].decommissioned +
                "','" +
                dateFormat +
                "') " +
                "WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].location.coordinate?.m != null) {
            await DDC.run(
              "UPDATE _site SET M = '" +
                req.body[i].location.coordinate.m +
                "' " +
                "WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].source == "historical") {
            await dbAddPredictQueueItem("site", req.body[i].siteId, "create");
          }
          resJson.push(req.body[i].siteId);
        }
        resJson = Array.from(new Set(resJson.map(JSON.stringify)))
          .map(JSON.parse)
          .sort();
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function distanceSites(req, res, next) {
    try {
      let fromX = 0;
      let fromY = 0;
      let fromZ = 0;
      let toX = 0;
      let toY = 0;
      let toZ = 0;
      let ddFrom = await DDC.runAndReadAll(
        "SELECT X,Y FROM _site WHERE id = (SELECT historicalTsId FROM site WHERE id = '" +
          req.body.from +
          "')"
      );
      let ddFromRows = ddFrom.getRows();
      if (ddFromRows.length > 0) {
        // should only be one row
        fromX = ddFromRows[0][0];
        fromY = ddFromRows[0][1];
        let ddTo = await DDC.runAndReadAll(
          "SELECT X,Y FROM _site WHERE id = (SELECT historicalTsId FROM site WHERE id = '" +
            req.body.to +
            "')"
        );
        let ddToRows = ddFrom.getRows();
        if (ddToRows.length > 0) {
          toX = ddToRows[0][0];
          toY = ddToRows[0][1];
          let ddDistance = await DDC.runAndReadAll(
            "SELECT st_distance_spheroid(ST_Point2D(" +
              fromX +
              "," +
              fromY +
              ")," +
              "ST_Point2D(" +
              toX +
              "," +
              toY +
              "))"
          );
          let ddDistanceRows = ddDistance.getRows();
          let resJson = {};
          if (ddDistanceRows.length > 0) {
            resJson = {
              distance: toDecimal(
                ddDistanceRows[0][0],
                OAS.X_scale,
                OAS.XY_precision
              ),
              unit: "m",
            };
          } else {
            resJson = {
              distance: 0,
              unit: "m",
            };
          }
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({ errors: "not found", id: req.body.to });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(404)
          .json({ errors: "not found", id: req.body.from });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getAllTrench(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let { pageSize, pageNumber } = pageSizeNumber(
          req.query.pageSize,
          req.query.pageNumber
        );
        let resJson = [];
        let ddRead = await DDC.runAndReadAll(
          "SELECT id FROM trench WHERE delete = false"
        );
        let ddRows = getArrayPage(ddRead.getRows(), pageSize, pageNumber);
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            resJson.push(ddRows[idx][0]);
          }
          resJson.sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res.sendStatus(204);
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getTrenchesSimpleStatistics(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        res
          .contentType(OAS.mimeJSON)
          .status(200)
          .json(await dbActiveInactiveCounts("trench"));
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addSingleTrench(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.body.connectsTo?.siteId != null) {
          if (!(await dbIdExists(req.body.connectsTo.siteId, "site"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "siteId " + req.body.connectsTo.siteId + " does not exist",
              });
          }
        }
        if (req.body.connectsTo?.trenchId != null) {
          if (!(await dbIdExists(req.body.connectsTo.trenchId, "trench"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "trenchId " +
                  req.body.connectsTo.trenchId +
                  " does not exist",
              });
          }
        }
        if (req.body.connectsTo?.poleId != null) {
          if (!(await dbIdExists(req.body.connectsTo.poleId, "pole"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "poleId " + req.body.connectsTo.poleId + " does not exist",
              });
          }
        }

        let trenchId = uuidv4();
        let tsId = await getSeqNextValue("seq_trench");
        let tsCol = "historicalTsId";
        switch (req.body.source) {
          case "historical":
            tsCol = "historicalTsId";
            break;
          case "predicted":
            tsCol = "predictedTsId";
            break;
          default:
            tsCol = "historicalTsId";
        }

        let ddq = await DDC.runAndReadAll(
          "SELECT id FROM trench WHERE id = '" + trenchId + "'"
        );
        let ddqRows = ddq.getRows();
        if (ddqRows.length == 0) {
          let ddp = await DDC.prepare(
            "INSERT INTO trench (id,delete," +
              tsCol +
              ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
          );
          ddp.bindVarchar(1, trenchId);
          ddp.bindBoolean(2, toBoolean(req.body.delete));
          ddp.bindInteger(3, tsId);
          ddp.bindVarchar(4, req.body.point);
          ddp.bindVarchar(5, pointFormat);
          await ddp.run();
        } else {
          let ddp = await DDC.prepare(
            "UPDATE trench SET delete = $1, " + tsCol + " = $2 WHERE id = $3"
          );
          ddp.bindBoolean(1, toBoolean(req.body.delete));
          ddp.bindInteger(2, tsId);
          ddp.bindVarchar(3, trenchId);
          await ddp.run();
        }

        let ddp = await DDC.prepare(
          "INSERT INTO _trench (tsId, point, trenchId, source, purpose, depth, classifier, unit, type, premisesPassed, area, plannedDuration, actualDuration, state) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)"
        );
        ddp.bindInteger(1, tsId);
        ddp.bindVarchar(2, req.body.point);
        ddp.bindVarchar(3, pointFormat);
        ddp.bindVarchar(4, trenchId);
        ddp.bindVarchar(5, req.body.source);
        ddp.bindVarchar(6, req.body.purpose);
        ddp.bindFloat(7, toDecimal(req.body.construction.depth));
        ddp.bindVarchar(8, req.body.construction.classifier);
        ddp.bindVarchar(9, req.body.construction.unit);
        ddp.bindVarchar(10, req.body.construction.type);
        ddp.bindInteger(11, toInteger(req.body.demographics.premises.passed));
        ddp.bindVarchar(12, req.body.demographics.premises.area);
        ddp.bindInteger(13, toInteger(req.body.build.planned.duration));
        ddp.bindInteger(14, toInteger(req.body.build.actual.duration));
        ddp.bindVarchar(15, req.body.state);
        await ddp.run();

        if (req.body.build?.jobId != null) {
          await DDC.run(
            "UPDATE _trench SET jobId = '" +
              req.body.build.jobId +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.build?.permitId != null) {
          await DDC.run(
            "UPDATE _trench SET permitId = '" +
              req.body.build.permitId +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.build?.planned?.start != null) {
          await DDC.run(
            "UPDATE _trench SET plannedStart = strptime('" +
              req.body.build.planned.start +
              "','" +
              dateFormat +
              "') WHERE tsId = " +
              tsId
          );
        }
        if (req.body.build?.planned?.completion != null) {
          await DDC.run(
            "UPDATE _trench SET plannedCompletion = strptime('" +
              req.body.build.planned.completion +
              "','" +
              dateFormat +
              "') WHERE tsId = " +
              tsId
          );
        }
        if (req.body.build?.planned?.unit != null) {
          await DDC.run(
            "UPDATE _trench SET plannedUnit = '" +
              req.body.build.planned.unit +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.build?.actual?.start != null) {
          await DDC.run(
            "UPDATE _trench SET actualStart = strptime('" +
              req.body.build.actual.start +
              "','" +
              dateFormat +
              "') WHERE tsId = " +
              tsId
          );
        }
        if (req.body.build?.actual?.completion != null) {
          await DDC.run(
            "UPDATE _trench SET actualCompletion = strptime('" +
              req.body.build.actual.completion +
              "','" +
              dateFormat +
              "') WHERE tsId = " +
              tsId
          );
        }
        if (req.body.build?.actual?.unit != null) {
          await DDC.run(
            "UPDATE _trench SET actualUnit = '" +
              req.body.build.actual.unit +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.connectsTo?.siteId != null) {
          await DDC.run(
            "UPDATE _trench SET connectsToSiteId = '" +
              req.body.connectsTo.siteId +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.connectsTo?.trenchId != null) {
          await DDC.run(
            "UPDATE _trench SET connectsToTrenchId = '" +
              req.body.connectsTo.trenchId +
              "' WHERE tsId = " +
              tsId
          );
        }
        if (req.body.connectsTo?.poleId != null) {
          await DDC.run(
            "UPDATE _trench SET connectsToPoleId = '" +
              req.body.connectsTo.poleId +
              "' WHERE tsId = " +
              tsId
          );
        }

        for (let i = 0; i < req.body.coordinates.length; i++) {
          let ddtc = await DDC.prepare(
            "INSERT INTO _trenchCoordinate (point,trenchTsId,trenchId,source,x,y,z) VALUES (strptime($1,$2),$3,$4,$5,$6,$7,$8)"
          );
          ddtc.bindVarchar(1, req.body.point);
          ddtc.bindVarchar(2, pointFormat);
          ddtc.bindInteger(3, tsId);
          ddtc.bindVarchar(4, trenchId);
          ddtc.bindVarchar(5, req.body.source);
          ddtc.bindFloat(
            6,
            toDecimal(req.body.coordinates[i].x, OAS.X_scale, OAS.XY_precision)
          );
          ddtc.bindFloat(
            7,
            toDecimal(req.body.coordinates[i].y, OAS.Y_scale, OAS.XY_precision)
          );
          ddtc.bindFloat(
            8,
            toDecimal(req.body.coordinates[i].z, OAS.Z_scale, OAS.Z_precision)
          );
          await ddtc.run();
          if (req.body.coordinates[i]?.m != null) {
            await DDC.run(
              "UPDATE _trenchCoordinate SET m = '" +
                req.body.coordinates[i].m +
                "' WHERE tsId = " +
                tsCId
            );
          }
        }
        res.contentType(OAS.mimeJSON).status(200).json({ trenchId: trenchId });
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getTrenchesCapacityState(req, res, next) {
    // TODO
    res.sendStatus(405);
  }

  async function deleteSingleTrench(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        // recover (restore) previously deleted if still exists
        if (req.query?.restore != null) {
          let point = dayjs().format(dayjsFormat);
          let ddRead = await DDC.runAndReadAll(
            "SELECT trench.id FROM trench,_trench WHERE trench.id = '" +
              req.params.trenchId +
              "' AND _trench.trenchId = trench.id AND _trench.source = 'historical' AND trench.delete = true LIMIT 1"
          );
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            await DDC.run(
              "UPDATE trench SET tsPoint = strptime('" +
                point +
                "','" +
                pointFormat +
                "'), delete = false WHERE id = '" +
                req.params.trenchId +
                "'"
            );
            await dbAddPredictQueueItem(
              "trench",
              req.params.trenchId,
              "undelete"
            );
            res.sendStatus(204);
          } else {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "trenchId " + req.params.trenchId + " does not exist",
              });
          }
        } else {
          let ddp = await DDC.prepare(
            "SELECT id,tsPoint,historicalTsId,predictedTsId,source,tsId FROM trench,_trench WHERE trench.id = $1 AND _trench.tsId = trench.historicalTsId AND trench.delete = false"
          );
          ddp.bindVarchar(1, req.params.trenchId);
          let ddRead = await ddp.runAndReadAll();
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            if (req.query?.predicted != null) {
              await DDC.run(
                "DELETE FROM _trenchCoordinate WHERE trenchId = '" +
                  req.params.trenchId +
                  "' and source = 'predicted'"
              );
              await DDC.run(
                "DELETE FROM _trench WHERE trenchId = '" +
                  req.params.trenchId +
                  "' and source = 'predicted'"
              );
              await DDC.run(
                "UPDATE trench SET predictedTsId = NULL WHERE id = '" +
                  req.params.trenchId +
                  "'"
              );
              res.sendStatus(204);
            } else {
              let point = dayjs().format(dayjsFormat);
              let tsCol = "historicalTsId";
              switch (ddRows[0][4]) {
                case "historical":
                  tsCol = "historicalTsId";
                  break;
                case "predicted":
                  tsCol = "predictedTsId";
                  break;
              }
              let tsId = await getSeqNextValue("seq_trench");
              let ddClone = await DDC.prepare(
                "INSERT INTO _trench (tsId,point,trenchId,source,purpose,depth,classifier,unit,type,premisesPassed,area,jobId,permitId,plannedStart,plannedCompletion,plannedDuration,plannedUnit,actualStart,actualCompletion,actualDuration,actualUnit,state,connectsToSiteId,connectsToTrenchId,connectsToPoleId) SELECT $1,strptime($2,$3),trenchId,source,purpose,depth,classifier,unit,type,premisesPassed,area,jobId,permitId,plannedStart,plannedCompletion,plannedDuration,plannedUnit,actualStart,actualCompletion,actualDuration,actualUnit,state,connectsToSiteId,connectsToTrenchId,connectsToPoleId FROM _trench WHERE tsId = $4"
              );
              ddClone.bindInteger(1, tsId);
              ddClone.bindVarchar(2, point);
              ddClone.bindVarchar(3, pointFormat);
              ddClone.bindInteger(4, ddRows[0][2]);
              await ddClone.run();
              await DDC.run(
                "UPDATE trench SET " +
                  tsCol +
                  " = " +
                  tsId +
                  ", tsPoint = strptime('" +
                  point +
                  "','" +
                  pointFormat +
                  "'), delete = true WHERE id = '" +
                  req.params.trenchId +
                  "'"
              );
              ddClone = await DDC.prepare(
                "INSERT INTO _trenchCoordinate (point,trenchTsId,trenchId,source,x,y,z,m) SELECT strptime($1,$2),$3,$4,source,x,y,z,m FROM _trenchCoordinate WHERE trenchTsId = $5"
              );
              ddClone.bindVarchar(1, point);
              ddClone.bindVarchar(2, pointFormat);
              ddClone.bindInteger(3, tsId);
              ddClone.bindVarchar(4, req.params.trenchId);
              ddClone.bindInteger(5, ddRows[0][5]);
              await ddClone.run();
              await dbAddPredictQueueItem(
                "trench",
                req.params.trenchId,
                "delete"
              );
              res.sendStatus(204);
            }
          } else {
            res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors: "trenchId " + req.params.trenchId + " does not exist",
              });
          }
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSingleTrench(req, res, next) {
    let datePoint = "AND _trench.tsId = trench.historicalTsId";
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.query?.point != null) {
          if (req.query?.point != null) {
            datePoint =
              "AND strftime(_trench.point,'" +
              pointFormat +
              "') = '" +
              req.query.point +
              "'";
          }
        }
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,trenchId, source, purpose, depth, classifier, unit, type, premisesPassed, area, jobId, permitId, strftime(plannedStart,'" +
            dateFormat +
            "'), strftime(plannedCompletion,'" +
            dateFormat +
            "'), plannedDuration, plannedUnit, strftime(actualStart,'" +
            dateFormat +
            "'), strftime(actualCompletion,'" +
            dateFormat +
            "'), actualDuration, actualUnit, state, connectsToSiteId, connectsToTrenchId, connectsToPoleId,strftime(point,'" +
            pointFormat +
            "') FROM trench, _trench WHERE trench.id = $1 AND _trench.trenchId = trench.id AND trench.delete = false " +
            datePoint +
            " ORDER BY _trench.point DESC LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.trenchId);
        let ddTrench = await ddp.runAndReadAll();
        let ddRows = ddTrench.getRows();
        if (ddRows.length > 0) {
          resJson = {
            trenchId: req.params.trenchId,
            point: ddRows[0][28],
            source: ddRows[0][6],
            purpose: ddRows[0][7],
            construction: {
              depth: toDecimal(ddRows[0][8]),
              classifier: ddRows[0][9],
              unit: ddRows[0][10],
              type: ddRows[0][11],
            },
            demographics: { premises: {} },
            build: {
              planned: {},
              actual: {},
            },
            state: ddRows[0][24],
            connectsTo: {},
            coordinates: [],
          };
          if (ddRows[0][12] != null) {
            resJson.demographics.premises.passed = toInteger(ddRows[0][12]);
          }
          if (ddRows[0][13] != null) {
            resJson.demographics.premises.area = ddRows[0][13];
          }
          if (ddRows[0][14] != null) {
            resJson.build.jobId = ddRows[0][14];
          }
          if (ddRows[0][15] != null) {
            resJson.build.permitId = ddRows[0][15];
          }
          if (ddRows[0][16] != null) {
            resJson.build.planned.start = ddRows[0][16];
          }
          if (ddRows[0][17] != null) {
            resJson.build.planned.completion = ddRows[0][17];
          }
          if (ddRows[0][18] != null) {
            resJson.build.planned.duration = toInteger(ddRows[0][18]);
          }
          if (ddRows[0][19] != null) {
            resJson.build.planned.unit = ddRows[0][19];
          }
          if (ddRows[0][20] != null) {
            resJson.build.actual.start = ddRows[0][20];
          }
          if (ddRows[0][21] != null) {
            resJson.build.actual.completion = ddRows[0][21];
          }
          if (ddRows[0][22] != null) {
            resJson.build.actual.duration = toInteger(ddRows[0][22]);
          }
          if (ddRows[0][23] != null) {
            resJson.build.actual.unit = ddRows[0][23];
          }
          if (ddRows[0][25] != null) {
            resJson.connectsTo.siteId = ddRows[0][25];
          }
          if (ddRows[0][26] != null) {
            resJson.connectsTo.trenchId = ddRows[0][26];
          }
          if (ddRows[0][27] != null) {
            resJson.connectsTo.poleId = ddRows[0][27];
          }
          let trenchTsId = 0;
          if (req.query?.point != null) {
            let ddq = await DDC.prepare(
              "SELECT tsId FROM _trench WHERE trenchId = $1 AND strftime(point,$2) = $3 ORDER BY point DESC LIMIT 1"
            );
            ddq.bindVarchar(1, req.params.trenchId);
            ddq.bindVarchar(2, pointFormat);
            ddq.bindVarchar(3, req.query.point);
            let ddPoint = await ddq.runAndReadAll();
            let ddPointRows = ddPoint.getRows();
            if (ddPointRows.length > 0) {
              trenchTsId = ddPointRows[0][0];
            } else {
              trenchTsId = ddRows[0][3];
            }
          } else {
            trenchTsId = ddRows[0][3];
          }
          let ddc = await DDC.prepare(
            "SELECT x,y,z FROM _trenchCoordinate WHERE trenchId = $1 AND trenchTsId = $2"
          );
          ddc.bindVarchar(1, req.params.trenchId);
          ddc.bindInteger(2, toInteger(trenchTsId));
          let ddCoordinate = await ddc.runAndReadAll();
          let ddCoordinateRows = ddCoordinate.getRows();
          if (ddCoordinateRows.length > 0) {
            for (let idx in ddCoordinateRows) {
              let resObj = {
                x: toDecimal(
                  ddCoordinateRows[idx][0],
                  OAS.X_scale,
                  OAS.XY_precision
                ),
                y: toDecimal(
                  ddCoordinateRows[idx][1],
                  OAS.Y_scale,
                  OAS.XY_precision
                ),
                z: toDecimal(
                  ddCoordinateRows[idx][2],
                  OAS.Z_scale,
                  OAS.XY_precision
                ),
              };
              resJson.coordinates.push(resObj);
            }
          }
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "trenchId " + req.params.trenchId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getTrenchPremisesPassed(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT id,strftime(point,'" +
            pointFormat +
            "') FROM trench, _trench WHERE id = $1 AND tsId = historicalTsId AND trench.delete = false LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.trenchId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let ddq = await DDC.prepare(
            "SELECT premisesPassed FROM _trench WHERE trenchId = $1 AND strftime(point,$2) = $3 ORDER BY point DESC LIMIT 1"
          );
          ddq.bindVarchar(1, req.params.trenchId);
          ddq.bindVarchar(2, pointFormat);
          if (req.query?.point != null) {
            ddq.bindVarchar(3, req.query.point);
          } else {
            ddq.bindVarchar(3, ddRows[0][1]);
          }
          let ddPremises = await ddq.runAndReadAll();
          let ddPremisesRows = ddPremises.getRows();
          if (ddPremisesRows.length > 0) {
            resJson = { passed: toInteger(ddPremisesRows[0][0]) };
            res.contentType(OAS.mimeJSON).status(200).json(resJson);
          } else {
            res.sendStatus(204);
          }
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "trenchId " + req.params.trenchId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getTrenchGeometry(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = [];
        let ddp = await DDC.prepare(
          "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,trenchId,source FROM trench, _trench WHERE id = $1 AND tsId = historicalTsId AND trench.delete = false LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.trenchId);
        let ddTrench = await ddp.runAndReadAll();
        let ddRows = ddTrench.getRows();
        if (ddRows.length > 0) {
          let trenchTsId = 0;
          if (req.query?.point != null) {
            let ddq = await DDC.prepare(
              "SELECT tsId FROM _trench WHERE trenchId = $1 AND strftime(point,$2) = $3 ORDER BY point DESC LIMIT 1"
            );
            ddq.bindVarchar(1, req.params.trenchId);
            ddq.bindVarchar(2, pointFormat);
            ddq.bindVarchar(3, req.query.point);
            let ddPoint = await ddq.runAndReadAll();
            let ddPointRows = ddPoint.getRows();
            if (ddPointRows.length > 0) {
              trenchTsId = ddPointRows[0][0];
            } else {
              trenchTsId = ddRows[0][3];
            }
          } else {
            trenchTsId = ddRows[0][3];
          }
          let ddc = await DDC.prepare(
            "SELECT x,y,z FROM _trenchCoordinate WHERE trenchId = $1 AND trenchTsId = $2"
          );
          ddc.bindVarchar(1, req.params.trenchId);
          ddc.bindInteger(2, toInteger(trenchTsId));
          let ddCoordinate = await ddc.runAndReadAll();
          let ddCoordinateRows = ddCoordinate.getRows();
          if (ddCoordinateRows.length > 0) {
            for (let idx in ddCoordinateRows) {
              let resObj = {
                x: toDecimal(
                  ddCoordinateRows[idx][0],
                  OAS.X_scale,
                  OAS.XY_precision
                ),
                y: toDecimal(
                  ddCoordinateRows[idx][1],
                  OAS.Y_scale,
                  OAS.XY_precision
                ),
                z: toDecimal(
                  ddCoordinateRows[idx][2],
                  OAS.Z_scale,
                  OAS.XY_precision
                ),
              };
              resJson.push(resObj);
            }
          }
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "trenchId " + req.params.trenchId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getTrenchGeometryLifetime(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let resSets = [];
        let ddp = await DDC.prepare(
          "SELECT strftime(point,'" +
            pointFormat +
            "'),source FROM trench, _trench WHERE id = $1 AND trenchId = id AND delete = false ORDER BY point"
        );
        ddp.bindVarchar(1, req.params.trenchId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          for (let idx in ddRows) {
            let ddq = await DDC.prepare(
              "SELECT tsId FROM _trench WHERE trenchId = $1 AND strftime(point,$2) = $3 ORDER BY point DESC LIMIT 1"
            );
            ddq.bindVarchar(1, req.params.trenchId);
            ddq.bindVarchar(2, pointFormat);
            ddq.bindVarchar(3, ddRows[idx][0]);
            let ddPoint = await ddq.runAndReadAll();
            let ddPointRows = ddPoint.getRows();
            if (ddPointRows.length > 0) {
              let ddg = await DDC.prepare(
                "SELECT x,y,z FROM _trenchCoordinate WHERE trenchId = $1 AND trenchTsId = $2"
              );
              ddg.bindVarchar(1, req.params.trenchId);
              ddg.bindInteger(2, toInteger(ddPointRows[0][0]));
              let ddCoordinate = await ddg.runAndReadAll();
              let ddCoordinateRows = ddCoordinate.getRows();
              if (ddCoordinateRows.length > 0) {
                let resGeometry = [];
                for (let cdx in ddCoordinateRows) {
                  let resObj = {
                    x: toDecimal(
                      ddCoordinateRows[cdx][0],
                      OAS.X_scale,
                      OAS.XY_precision
                    ),
                    y: toDecimal(
                      ddCoordinateRows[cdx][1],
                      OAS.Y_scale,
                      OAS.XY_precision
                    ),
                    z: toDecimal(
                      ddCoordinateRows[cdx][2],
                      OAS.Z_scale,
                      OAS.XY_precision
                    ),
                  };
                  resGeometry.push(resObj);
                }
                resJson[ddRows[idx][0]] = resGeometry;
                resSets.push({
                  point: ddRows[idx][0],
                  source: ddRows[idx][1],
                });
              }
            }
          }
          resJson.sets = resSets;
          // remove overlapping entries (coordinate3d only)
          //
          if (resJson.sets.length > 1) {
            let tmpLength = resJson.sets.length - 1;
            for (let s = tmpLength; s > 0; s--) {
              let right = resJson.sets[s].point;
              let left = resJson.sets[s - 1].point;
              let newRight = resJson[right].filter(
                (obj2) =>
                  !resJson[left].some(
                    (obj1) =>
                      obj1.x === obj2.x &&
                      obj1.y === obj2.y &&
                      obj1.z === obj2.z
                  )
              );
              // now put back start point for each set, start point is previous set last coordinate
              // that acts as the polyline start coordinate
              //let lastLeft = resJson[left][resJson[left].length - 1];
              newRight.unshift(resJson[left][resJson[left].length - 1]);
              //
              resJson[right] = newRight;
            }
          }

          //
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "trenchId " + req.params.trenchId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getTrenchDistance(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {
          distance: 0.0,
          unit: "m",
        };
        let resCoordinate = [];
        let distance = 0;
        let ddp = await DDC.prepare(
          "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,trenchId,source FROM trench, _trench WHERE id = $1 AND tsId = historicalTsId AND trench.delete = false LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.trenchId);
        let ddTrench = await ddp.runAndReadAll();
        let ddRows = ddTrench.getRows();
        if (ddRows.length > 0) {
          let trenchTsId = 0;
          if (req.query?.point != null) {
            let ddq = await DDC.prepare(
              "SELECT tsId FROM _trench WHERE trenchId = $1 AND strftime(point,$2) = $3 ORDER BY point DESC LIMIT 1"
            );
            ddq.bindVarchar(1, req.params.trenchId);
            ddq.bindVarchar(2, pointFormat);
            ddq.bindVarchar(3, req.query.point);
            let ddPoint = await ddq.runAndReadAll();
            let ddPointRows = ddPoint.getRows();
            if (ddPointRows.length > 0) {
              trenchTsId = ddPointRows[0][0];
            } else {
              trenchTsId = ddRows[0][3];
            }
          } else {
            trenchTsId = ddRows[0][3];
          }
          let ddc = await DDC.prepare(
            "SELECT x,y FROM _trenchCoordinate WHERE trenchId = $1 AND trenchTsId = $2"
          );
          ddc.bindVarchar(1, req.params.trenchId);
          ddc.bindInteger(2, toInteger(trenchTsId));
          let ddCoordinate = await ddc.runAndReadAll();
          let ddCoordinateRows = ddCoordinate.getRows();
          if (ddCoordinateRows.length > 0) {
            for (let idx in ddCoordinateRows) {
              let resObj = {
                x: toDecimal(
                  ddCoordinateRows[idx][0],
                  OAS.X_scale,
                  OAS.XY_precision
                ),
                y: toDecimal(
                  ddCoordinateRows[idx][1],
                  OAS.Y_scale,
                  OAS.XY_precision
                ),
              };
              resCoordinate.push(resObj);
            }
          }
          if (resCoordinate.length > 0) {
            for (let i = 0; i < resCoordinate.length - 1; i++) {
              let fromX = resCoordinate[i].x;
              let fromY = resCoordinate[i].y;
              let toX = resCoordinate[i + 1].x;
              let toY = resCoordinate[i + 1].y;
              let ddRead = await DDC.runAndReadAll(
                "SELECT st_distance_spheroid(ST_Point2D(" +
                  fromX +
                  "," +
                  fromY +
                  ")," +
                  "ST_Point2D(" +
                  toX +
                  "," +
                  toY +
                  "))"
              );
              let ddRows = ddRead.getRows();
              if (ddRows.length > 0) {
                distance += Number.parseFloat(ddRows[0][0]);
              }
            }
          }
          resJson.distance = toDecimal(distance, OAS.X_scale, OAS.XY_precision);
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "trenchId " + req.params.trenchId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getTrenchTimeline(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let ddp = await DDC.prepare(
          "SELECT strftime(point,'" +
            pointFormat +
            "'),source FROM trench, _trench WHERE id = $1 AND trenchId = id AND delete = false ORDER BY point DESC"
        );
        ddp.bindVarchar(1, req.params.trenchId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let resJson = [];
          for (let idx in ddRows) {
            resJson.push({ point: ddRows[idx][0], source: ddRows[idx][1] });
          }
          resJson = Array.from(new Set(resJson.map(JSON.stringify)))
            .map(JSON.parse)
            .sort();
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "trenchId " + req.params.trenchId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function updateSingleTrench(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.body.connectsTo?.siteId != null) {
          if (!(await dbIdExists(req.body.connectsTo.siteId, "site"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "siteId " + req.body.connectsTo.siteId + " does not exist",
              });
          }
        }
        if (req.body.connectsTo?.trenchId != null) {
          if (!(await dbIdExists(req.body.connectsTo.trenchId, "trench"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "trenchId " +
                  req.body.connectsTo.trenchId +
                  " does not exist",
              });
          }
        }
        if (req.body.connectsTo?.poleId != null) {
          if (!(await dbIdExists(req.body.connectsTo.poleId, "pole"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "poleId " + req.body.connectsTo.poleId + " does not exist",
              });
          }
        }
        let resJson = {};
        let ddp = await DDC.prepare(
          "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,trenchId,source,purpose,depth,classifier,unit,type,premisesPassed,area,jobId,permitId,strftime(plannedStart,'" +
            dateFormat +
            "'),strftime(plannedCompletion,'" +
            dateFormat +
            "'),plannedDuration, plannedUnit, strftime(actualStart,'" +
            dateFormat +
            "'),strftime(actualCompletion,'" +
            dateFormat +
            "'),actualDuration,actualUnit,state,connectsToSiteId,connectsToTrenchId,connectsToPoleId,strftime(point,'" +
            pointFormat +
            "') FROM trench, _trench WHERE id = $1 AND tsId = historicalTsId AND trench.delete = false LIMIT 1"
        );
        ddp.bindVarchar(1, req.params.trenchId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          resJson = {
            trenchId: req.params.trenchId,
            point: ddRows[0][28],
            purpose: ddRows[0][7],
            construction: {
              depth: toDecimal(ddRows[0][8]),
              classifier: ddRows[0][9],
              unit: ddRows[0][10],
              type: ddRows[0][11],
            },
            demographics: { premises: {} },
            build: {
              planned: {},
              actual: {},
            },
            state: ddRows[0][24],
            connectsTo: {},
            coordinates: [],
            source: ddRows[0][6],
            delete: ddRows[0][1],
          };
          if (ddRows[0][12] != null) {
            resJson.demographics.premises.passed = toInteger(ddRows[0][12]);
          }
          if (ddRows[0][13] != null) {
            resJson.demographics.premises.area = ddRows[0][13];
          }
          if (ddRows[0][14] != null) {
            resJson.build.jobId = ddRows[0][14];
          }
          if (ddRows[0][15] != null) {
            resJson.build.permitId = ddRows[0][15];
          }
          if (ddRows[0][16] != null) {
            resJson.build.planned.start = ddRows[0][16];
          }
          if (ddRows[0][17] != null) {
            resJson.build.planned.completion = ddRows[0][17];
          }
          if (ddRows[0][18] != null) {
            resJson.build.planned.duration = toInteger(ddRows[0][18]);
          }
          if (ddRows[0][19] != null) {
            resJson.build.planned.unit = ddRows[0][19];
          }
          if (ddRows[0][20] != null) {
            resJson.build.actual.start = ddRows[0][20];
          }
          if (ddRows[0][21] != null) {
            resJson.build.actual.completion = ddRows[0][21];
          }
          if (ddRows[0][22] != null) {
            resJson.build.actual.duration = toInteger(ddRows[0][22]);
          }
          if (ddRows[0][23] != null) {
            resJson.build.actual.unit = ddRows[0][23];
          }
          if (ddRows[0][25] != null) {
            resJson.connectsTo.siteId = ddRows[0][25];
          }
          if (ddRows[0][26] != null) {
            resJson.connectsTo.trenchId = ddRows[0][26];
          }
          if (ddRows[0][27] != null) {
            resJson.connectsTo.poleId = ddRows[0][27];
          }
          let ddc = await DDC.prepare(
            "SELECT x,y,z FROM _trenchCoordinate WHERE trenchId = $1 AND trenchTsId = $2"
          );
          ddc.bindVarchar(1, req.params.trenchId);
          ddc.bindInteger(2, toInteger(ddRows[0][3]));
          let ddCoordinate = await ddc.runAndReadAll();
          let ddCoordinateRows = ddCoordinate.getRows();
          if (ddCoordinateRows.length > 0) {
            for (let idx in ddCoordinateRows) {
              let resObj = {
                x: toDecimal(
                  ddCoordinateRows[idx][0],
                  OAS.X_scale,
                  OAS.XY_precision
                ),
                y: toDecimal(
                  ddCoordinateRows[idx][1],
                  OAS.Y_scale,
                  OAS.XY_precision
                ),
                z: toDecimal(
                  ddCoordinateRows[idx][2],
                  OAS.Z_scale,
                  OAS.XY_precision
                ),
              };
              resJson.coordinates.push(resObj);
            }
          }
          /*
          LOGGER.debug({
            delta: req.body,
            before: resJson,
            after: jsonDeepMerge(resJson, req.body),
          });
          */
          // pass to replace to regenerate the record
          req.body = jsonDeepMerge(resJson, req.body);
          return next();
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "trenchId " + req.params.trenchId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function replaceSingleTrench(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        if (req.body.connectsTo?.siteId != null) {
          if (!(await dbIdExists(req.body.connectsTo.siteId, "site"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "siteId " + req.body.connectsTo.siteId + " does not exist",
              });
          }
        }
        if (req.body.connectsTo?.trenchId != null) {
          if (!(await dbIdExists(req.body.connectsTo.trenchId, "trench"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "trenchId " +
                  req.body.connectsTo.trenchId +
                  " does not exist",
              });
          }
        }
        if (req.body.connectsTo?.poleId != null) {
          if (!(await dbIdExists(req.body.connectsTo.poleId, "pole"))) {
            return res
              .contentType(OAS.mimeJSON)
              .status(404)
              .json({
                errors:
                  "poleId " + req.body.connectsTo.poleId + " does not exist",
              });
          }
        }
        let ddp = await DDC.prepare(
          "SELECT id,tsPoint,historicalTsId,predictedTsId,source,tsId FROM trench,_trench WHERE trench.id = $1 AND _trench.tsId = trench.historicalTsId AND trench.delete = false"
        );
        ddp.bindVarchar(1, req.params.trenchId);
        let ddRead = await ddp.runAndReadAll();
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          let point = dayjs().format(dayjsFormat);
          let tsId = await getSeqNextValue("seq_trench");
          let tsCol = "historicalTsId";
          switch (req.body.source) {
            case "historical":
              tsCol = "historicalTsId";
              break;
            case "predicted":
              tsCol = "predictedTsId";
              break;
          }
          let ddp = await DDC.prepare(
            "UPDATE trench SET " +
              tsCol +
              " = $1, tsPoint = strptime($2,$3) WHERE id = $4"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body.point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.params.trenchId);
          await ddp.run();

          ddp = await DDC.prepare(
            "INSERT INTO _trench (tsId,point,trenchId,source,purpose,depth,classifier,unit,type,premisesPassed,area,plannedDuration,actualDuration,state) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body.point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.params.trenchId);
          ddp.bindVarchar(5, req.body.source);
          ddp.bindVarchar(6, req.body.purpose);
          ddp.bindFloat(7, toDecimal(req.body.construction.depth));
          ddp.bindVarchar(8, req.body.construction.classifier);
          ddp.bindVarchar(9, req.body.construction.unit);
          ddp.bindVarchar(10, req.body.construction.type);
          ddp.bindInteger(11, toInteger(req.body.demographics.premises.passed));
          ddp.bindVarchar(12, req.body.demographics.premises.area);
          ddp.bindInteger(13, toInteger(req.body.build.planned.duration));
          ddp.bindInteger(14, toInteger(req.body.build.actual.duration));
          ddp.bindVarchar(15, req.body.state);
          await ddp.run();

          if (req.body.build?.jobId != null) {
            await DDC.run(
              "UPDATE _trench SET jobId = '" +
                req.body.build.jobId +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.build?.permitId != null) {
            await DDC.run(
              "UPDATE _trench SET permitId = '" +
                req.body.build.permitId +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.build?.planned?.start != null) {
            await DDC.run(
              "UPDATE _trench SET plannedStart = strptime('" +
                req.body.build.planned.start +
                "','" +
                dateFormat +
                "') WHERE tsId = " +
                tsId
            );
          }
          if (req.body.build?.planned?.completion != null) {
            await DDC.run(
              "UPDATE _trench SET plannedCompletion = strptime('" +
                req.body.build.planned.completion +
                "','" +
                dateFormat +
                "') WHERE tsId = " +
                tsId
            );
          }
          if (req.body.build?.planned?.unit != null) {
            await DDC.run(
              "UPDATE _trench SET plannedUnit = '" +
                req.body.build.planned.unit +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.build?.actual?.start != null) {
            await DDC.run(
              "UPDATE _trench SET actualStart = strptime('" +
                req.body.build.actual.start +
                "','" +
                dateFormat +
                "') WHERE tsId = " +
                tsId
            );
          }
          if (req.body.build?.actual?.completion != null) {
            await DDC.run(
              "UPDATE _trench SET actualCompletion = strptime('" +
                req.body.build.actual.completion +
                "','" +
                dateFormat +
                "') WHERE tsId = " +
                tsId
            );
          }
          if (req.body.build?.actual?.unit != null) {
            await DDC.run(
              "UPDATE _trench SET actualUnit = '" +
                req.body.build.actual.unit +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.connectsTo?.siteId != null) {
            await DDC.run(
              "UPDATE _trench SET connectsToSiteId = '" +
                req.body.connectsTo.siteId +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.connectsTo?.trenchId != null) {
            await DDC.run(
              "UPDATE _trench SET connectsToTrenchId = '" +
                req.body.connectsTo.trenchId +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body.connectsTo?.poleId != null) {
            await DDC.run(
              "UPDATE _trench SET connectsToPoleId = '" +
                req.body.connectsTo.poleId +
                "' WHERE tsId = " +
                tsId
            );
          }

          for (let i = 0; i < req.body.coordinates.length; i++) {
            let ddtc = await DDC.prepare(
              "INSERT INTO _trenchCoordinate (point,trenchTsId,trenchId,source,x,y,z) VALUES (strptime($1,$2),$3,$4,$5,$6,$7,$8)"
            );
            ddtc.bindVarchar(1, req.body.point);
            ddtc.bindVarchar(2, pointFormat);
            ddtc.bindInteger(3, tsId);
            ddtc.bindVarchar(4, req.params.trenchId);
            ddtc.bindVarchar(5, req.body.source);
            ddtc.bindFloat(
              6,
              toDecimal(
                req.body.coordinates[i].x,
                OAS.X_scale,
                OAS.XY_precision
              )
            );
            ddtc.bindFloat(
              7,
              toDecimal(
                req.body.coordinates[i].y,
                OAS.Y_scale,
                OAS.XY_precision
              )
            );
            ddtc.bindFloat(
              8,
              toDecimal(req.body.coordinates[i].z, OAS.Z_scale, OAS.Z_precision)
            );
            await ddtc.run();
            if (req.body.coordinates[i]?.m != null) {
              await DDC.run(
                "UPDATE _trenchCoordinate SET m = '" +
                  req.body.coordinates[i].m +
                  "' WHERE tsId = " +
                  tsCId
              );
            }
          }
          if (req.body.source == "historical") {
            await dbAddPredictQueueItem(
              "trench",
              req.params.trenchId,
              "update"
            );
          }
          res.sendStatus(204);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({
              errors: "trenchId " + req.params.trenchId + " does not exist",
            });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getMultipleTrenches(req, res, next) {
    try {
      let resJson = [];
      let ddp = await DDC.runAndReadAll(
        "SELECT id,delete,tsPoint,historicalTsId,predictedTsId,trenchId,source,purpose,depth,classifier,unit,type,premisesPassed,area,jobId,permitId,strftime(plannedStart,'" +
          dateFormat +
          "'),strftime(plannedCompletion,'" +
          dateFormat +
          "'),plannedDuration,plannedUnit,strftime(actualStart,'" +
          dateFormat +
          "'),strftime(actualCompletion,'" +
          dateFormat +
          "'),actualDuration,actualUnit,state,connectsToSiteId,connectsToTrenchId,connectsToPoleId,tsId,strftime(point,'" +
          pointFormat +
          "') FROM trench, _trench WHERE _trench.trenchId = trench.id ORDER BY _trench.point"
      );
      let ddRows = ddp.getRows();
      if (ddRows.length > 0) {
        for (let idx in ddRows) {
          let resObj = {
            trenchId: ddRows[idx][0],
            purpose: ddRows[idx][7],
            construction: {
              depth: toDecimal(ddRows[idx][8]),
              classifier: ddRows[idx][9],
              unit: ddRows[idx][10],
              type: ddRows[idx][11],
            },
            demographics: { premises: {} },
            build: {
              planned: {},
              actual: {},
            },
            state: ddRows[idx][24],
            connectsTo: {},
            coordinates: [],
            point: ddRows[idx][29],
            source: ddRows[idx][6],
            delete: toBoolean(ddRows[idx][1]),
          };
          if (ddRows[idx][12] != null) {
            resObj.demographics.premises.passed = toInteger(ddRows[idx][12]);
          }
          if (ddRows[idx][13] != null) {
            resObj.demographics.premises.area = ddRows[idx][13];
          }
          if (ddRows[idx][14] != null) {
            resObj.build.jobId = ddRows[idx][14];
          }
          if (ddRows[idx][15] != null) {
            resObj.build.permitId = ddRows[idx][15];
          }
          if (ddRows[idx][16] != null) {
            resObj.build.planned.start = ddRows[idx][16];
          }
          if (ddRows[idx][17] != null) {
            resObj.build.planned.completion = ddRows[idx][17];
          }
          if (ddRows[idx][18] != null) {
            resObj.build.planned.duration = toInteger(ddRows[idx][18]);
          }
          if (ddRows[idx][19] != null) {
            resObj.build.planned.unit = ddRows[idx][19];
          }
          if (ddRows[idx][20] != null) {
            resObj.build.actual.start = ddRows[idx][20];
          }
          if (ddRows[idx][21] != null) {
            resObj.build.actual.completion = ddRows[idx][21];
          }
          if (ddRows[idx][22] != null) {
            resObj.build.actual.duration = toInteger(ddRows[idx][22]);
          }
          if (ddRows[idx][23] != null) {
            resObj.build.actual.unit = ddRows[idx][23];
          }
          if (ddRows[idx][25] != null) {
            resObj.connectsTo.siteId = ddRows[idx][25];
          }
          if (ddRows[idx][26] != null) {
            resObj.connectsTo.trenchId = ddRows[idx][26];
          }
          if (ddRows[idx][27] != null) {
            resObj.connectsTo.poleId = ddRows[idx][27];
          }
          let ddc = await DDC.prepare(
            "SELECT x,y,z FROM _trenchCoordinate WHERE trenchId = $1 AND trenchTsId = $2"
          );
          ddc.bindVarchar(1, ddRows[idx][0]);
          ddc.bindInteger(2, toInteger(ddRows[idx][28]));
          let ddCoordinate = await ddc.runAndReadAll();
          let ddCoordinateRows = ddCoordinate.getRows();
          if (ddCoordinateRows.length > 0) {
            for (let idx in ddCoordinateRows) {
              let resCoordObj = {
                x: toDecimal(
                  ddCoordinateRows[idx][0],
                  OAS.X_scale,
                  OAS.XY_precision
                ),
                y: toDecimal(
                  ddCoordinateRows[idx][1],
                  OAS.Y_scale,
                  OAS.XY_precision
                ),
                z: toDecimal(
                  ddCoordinateRows[idx][2],
                  OAS.Z_scale,
                  OAS.XY_precision
                ),
              };
              resObj.coordinates.push(resCoordObj);
            }
          }
          resJson.push(resObj);
        }
        resJson = jsonSortByMultiKeys(resJson, ["point", "source"]);
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res.sendStatus(204);
      }
    } catch (e) {
      return next(e);
    }
  }

  async function addMultipleTrench(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        req.body = jsonSortByMultiKeys(req.body, ["point", "source"]);
        let resJson = [];
        for (let i = 0; i < req.body.length; i++) {
          let ddRead = await DDC.runAndReadAll(
            "SELECT id FROM trench WHERE id = '" + req.body[i].trenchId + "'"
          );
          let ddRows = ddRead.getRows();
          if (ddRows.length > 0) {
            ddRead = await DDC.runAndReadAll(
              "SELECT rowid from _trenchCoordinate WHERE trenchId = '" +
                req.body[i].trenchId +
                "'"
            );
            ddRows = ddRead.getRows();
            if (ddRows.length > 0) {
              await DDC.run(
                "DELETE FROM _trenchCoordinate WHERE trenchId = '" +
                  req.body[i].trenchId +
                  "'"
              );
            }
            ddRead = await DDC.runAndReadAll(
              "SELECT rowid from _trench WHERE trenchId = '" +
                req.body[i].trenchId +
                "'"
            );
            ddRows = ddRead.getRows();
            if (ddRows.length > 0) {
              await DDC.run(
                "DELETE FROM _trench WHERE trenchId = '" +
                  req.body[i].trenchId +
                  "'"
              );
            }
            await DDC.run(
              "UPDATE trench SET delete = false, historicalTsId = NULL, predictedTsId = NULL, tsPoint = now()::timestamp WHERE id = '" +
                req.body[i].trenchId +
                "'"
            );
          }
        }
        for (let i = 0; i < req.body.length; i++) {
          if (req.body[i].connectsTo?.siteId != null) {
            if (!(await dbIdExists(req.body[i].connectsTo.siteId, "site"))) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "siteId " +
                    req.body[i].connectsTo.siteId +
                    " does not exist",
                });
            }
          }
          if (req.body[i].connectsTo?.trenchId != null) {
            if (
              !(await dbIdExists(req.body[i].connectsTo.trenchId, "trench"))
            ) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "trenchId " +
                    req.body[i].connectsTo.trenchId +
                    " does not exist",
                });
            }
          }
          if (req.body[i].connectsTo?.poleId != null) {
            if (!(await dbIdExists(req.body[i].connectsTo.poleId, "pole"))) {
              return res
                .contentType(OAS.mimeJSON)
                .status(404)
                .json({
                  errors:
                    "poleId " +
                    req.body[i].connectsTo.poleId +
                    " does not exist",
                });
            }
          }
          let tsId = await getSeqNextValue("seq_trench");
          let tsCol = "historicalTsId";
          switch (req.body[i].source) {
            case "historical":
              tsCol = "historicalTsId";
              break;
            case "predicted":
              tsCol = "predictedTsId";
              break;
          }

          let ddRead = await DDC.runAndReadAll(
            "SELECT id FROM trench WHERE id = '" + req.body[i].trenchId + "'"
          );
          let ddRows = ddRead.getRows();
          if (ddRows.length == 0) {
            let ddp = await DDC.prepare(
              "INSERT INTO trench (id,delete," +
                tsCol +
                ",tsPoint) VALUES ($1,$2,$3,strptime($4,$5))"
            );
            ddp.bindVarchar(1, req.body[i].trenchId);
            ddp.bindBoolean(2, toBoolean(req.body[i].delete));
            ddp.bindInteger(3, tsId);
            ddp.bindVarchar(4, req.body[i].point);
            ddp.bindVarchar(5, pointFormat);
            await ddp.run();
          } else {
            let ddp = await DDC.prepare(
              "UPDATE trench SET delete = $1, " + tsCol + " = $2 WHERE id = $3"
            );
            ddp.bindBoolean(1, toBoolean(req.body[i].delete));
            ddp.bindInteger(2, tsId);
            ddp.bindVarchar(3, req.body[i].trenchId);
            await ddp.run();
          }

          let ddp = await DDC.prepare(
            "INSERT INTO _trench (tsId,point,trenchId,source,purpose,depth,classifier,unit,type,premisesPassed,area,plannedDuration,actualDuration,state) VALUES ($1,strptime($2,$3),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)"
          );
          ddp.bindInteger(1, tsId);
          ddp.bindVarchar(2, req.body[i].point);
          ddp.bindVarchar(3, pointFormat);
          ddp.bindVarchar(4, req.body[i].trenchId);
          ddp.bindVarchar(5, req.body[i].source);
          ddp.bindVarchar(6, req.body[i].purpose);
          ddp.bindFloat(7, toDecimal(req.body[i].construction.depth));
          ddp.bindVarchar(8, req.body[i].construction.classifier);
          ddp.bindVarchar(9, req.body[i].construction.unit);
          ddp.bindVarchar(10, req.body[i].construction.type);
          ddp.bindInteger(
            11,
            toInteger(req.body[i].demographics.premises.passed)
          );
          ddp.bindVarchar(12, req.body[i].demographics.premises.area);
          ddp.bindInteger(13, toInteger(req.body[i].build.planned.duration));
          ddp.bindInteger(14, toInteger(req.body[i].build.actual.duration));
          ddp.bindVarchar(15, req.body[i].state);
          await ddp.run();

          if (req.body[i].build?.jobId != null) {
            await DDC.run(
              "UPDATE _trench SET jobId = '" +
                req.body[i].build.jobId +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].build?.permitId != null) {
            await DDC.run(
              "UPDATE _trench SET permitId = '" +
                req.body[i].build.permitId +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].build?.planned?.start != null) {
            await DDC.run(
              "UPDATE _trench SET plannedStart = strptime('" +
                req.body[i].build.planned.start +
                "','" +
                dateFormat +
                "') WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].build?.planned?.completion != null) {
            await DDC.run(
              "UPDATE _trench SET plannedCompletion = strptime('" +
                req.body[i].build.planned.completion +
                "','" +
                dateFormat +
                "') WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].build?.planned?.unit != null) {
            await DDC.run(
              "UPDATE _trench SET plannedUnit = '" +
                req.body[i].build.planned.unit +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].build?.actual?.start != null) {
            await DDC.run(
              "UPDATE _trench SET actualStart = strptime('" +
                req.body[i].build.actual.start +
                "','" +
                dateFormat +
                "') WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].build?.actual?.completion != null) {
            await DDC.run(
              "UPDATE _trench SET actualCompletion = strptime('" +
                req.body[i].build.actual.completion +
                "','" +
                dateFormat +
                "') WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].build?.actual?.unit != null) {
            await DDC.run(
              "UPDATE _trench SET actualUnit = '" +
                req.body[i].build.actual.unit +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].connectsTo?.siteId != null) {
            await DDC.run(
              "UPDATE _trench SET connectsToSiteId = '" +
                req.body[i].connectsTo.siteId +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].connectsTo?.trenchId != null) {
            await DDC.run(
              "UPDATE _trench SET connectsToTrenchId = '" +
                req.body[i].connectsTo.trenchId +
                "' WHERE tsId = " +
                tsId
            );
          }
          if (req.body[i].connectsTo?.poleId != null) {
            await DDC.run(
              "UPDATE _trench SET connectsToPoleId = '" +
                req.body[i].connectsTo.poleId +
                "' WHERE tsId = " +
                tsId
            );
          }

          for (let c = 0; c < req.body[i].coordinates.length; c++) {
            let ddtc = await DDC.prepare(
              "INSERT INTO _trenchCoordinate (point,trenchTsId,trenchId,source,x,y,z) VALUES (strptime($1,$2),$3,$4,$5,$6,$7,$8)"
            );
            ddtc.bindVarchar(1, req.body[i].point);
            ddtc.bindVarchar(2, pointFormat);
            ddtc.bindInteger(3, tsId);
            ddtc.bindVarchar(4, req.body[i].trenchId);
            ddtc.bindVarchar(5, req.body[i].source);
            ddtc.bindFloat(
              6,
              toDecimal(
                req.body[i].coordinates[c].x,
                OAS.X_scale,
                OAS.XY_precision
              )
            );
            ddtc.bindFloat(
              7,
              toDecimal(
                req.body[i].coordinates[c].y,
                OAS.Y_scale,
                OAS.XY_precision
              )
            );
            ddtc.bindFloat(
              8,
              toDecimal(
                req.body[i].coordinates[c].z,
                OAS.Z_scale,
                OAS.Z_precision
              )
            );
            await ddtc.run();
            if (req.body[i].coordinates[c]?.m != null) {
              await DDC.run(
                "UPDATE _trenchCoordinate SET m = '" +
                  req.body[i].coordinates[c].m +
                  "' WHERE tsId = " +
                  tsCId
              );
            }
          }
          if (req.body[i].source == "historical") {
            await dbAddPredictQueueItem(
              "trench",
              req.body[i].trenchId,
              "create"
            );
          }
          resJson.push(req.body[i].trenchId);
        }
        resJson = Array.from(new Set(resJson.map(JSON.stringify)))
          .map(JSON.parse)
          .sort();
        res.contentType(OAS.mimeJSON).status(200).json(resJson);
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getReadiness(req, res, next) {
    try {
      res
        .status(200)
        .contentType(OAS.mimeJSON)
        .json({ point: dayjs().format(dayjsFormat) });
    } catch (e) {
      return next(e);
    }
  }

  async function getMapRender(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        let resJson = {};
        let ddRead = await DDC.runAndReadAll(
          "SELECT vendor,renderUrl,credentialsIdentity,credentialsKey FROM adminMap WHERE systemDefault = true"
        );
        let ddRows = ddRead.getRows();
        if (ddRows.length > 0) {
          switch (ddRows[0][0]) {
            case OAS.mapVendorOpenStreetMap:
              resJson = {
                vendor: OAS.mapVendorOpenStreetMap,
                url: ddRows[0][1] + "?key=" + ddRows[0][3],
              };
              break;
            case OAS.mapVendorGoogleMaps:
              resJson = {
                vendor: OAS.mapVendorGoogleMaps,
                url: ddRows[0][1] + "?key=" + ddRows[0][3],
              };
              break;
            case OAS.mapVendorMicrosoftAzure:
              resJson = {
                vendor: OAS.mapVendorMicrosoftAzure,
                url: ddRows[0][1] + "?key=" + ddRows[0][3],
              };
              break;
            case OAS.mapVendorERSI:
              resJson = {
                vendor: OAS.mapVendorERSI,
                url: ddRows[0][1] + "?key=" + ddRows[0][3],
              };
              break;
          }
          res.contentType(OAS.mimeJSON).status(200).json(resJson);
        } else {
          res
            .contentType(OAS.mimeJSON)
            .status(404)
            .json({ errors: "not found default map provider" });
        }
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getOpenAPI(req, res, next) {
    try {
      let accepts = req.get("Accept") || OAS.mimeJSON;
      switch (accepts.toLowerCase()) {
        case OAS.mimeJSON:
          res
            .status(200)
            .contentType(accepts)
            .sendFile("mni.json", { root: apiDirectory });
          break;
        case OAS.mimeYAML:
          res
            .status(200)
            .contentType(accepts)
            .sendFile("mni.yaml", { root: apiDirectory });
          break;
        default:
          res.sendStatus(404);
      }
    } catch (e) {
      return next(e);
    }
  }

  async function getSimpleStatistics(req, res, next) {
    try {
      let result = validationResult(req);
      if (result.isEmpty()) {
        res
          .status(200)
          .contentType(OAS.mimeJSON)
          .json({
            providers: {
              email: await dbCounts("adminEmail"),
              kafka: await dbCounts("adminKafka"),
              map: await dbCounts("adminMap"),
              workflow: await dbCounts("adminWorkflow"),
            },
            alerts: {
              available: await dbCounts("alert"),
              active: {
                callbacks: await dbCounts("alertCallback"),
                publish: await dbCounts("alertPublish"),
                notify: await dbCounts("alertNotify"),
                workflow: await dbCounts("alertWorkflow"),
              },
            },
            queues: {
              predict: await dbQueueCounts("predictQueue"),
              alert: await dbQueueCounts("alertQueue"),
            },
            resources: {
              cables: await dbActiveInactiveCounts("cable"),
              ducts: await dbActiveInactiveCounts("duct"),
              nes: await dbActiveInactiveCounts("ne"),
              racks: await dbActiveInactiveCounts("rack"),
              poles: await dbActiveInactiveCounts("pole"),
              services: await dbActiveInactiveCounts("service"),
              sites: await dbActiveInactiveCounts("site"),
              trenches: await dbActiveInactiveCounts("trench"),
            },
          });
      } else {
        res
          .contentType(OAS.mimeJSON)
          .status(400)
          .json({ errors: result.array() });
      }
    } catch (e) {
      return next(e);
    }
  }
  // Express API routes

  /*
       Tag:           API
       operationId:   getReadiness
       exposed Route: /mni/v1//api/readiness
       HTTP method:   GET
       OpenID Scope:  read:mni_api
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/api/readiness",
    // security("read:mni_api"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getReadiness
  );

  /*
       Tag:           API
       operationId:   getOpenAPI
       exposed Route: /mni/v1/api
       HTTP method:   GET
       OpenID Scope:  read:mni_api
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/api",
    // security("read:mni_api"),
    header("Accept").default(OAS.mimeYAML).isIn(OAS.mimeAcceptType),
    getOpenAPI
  );

  /*
     Tag:           Administration - Data
     operationId:   getAdminData
     exposed Route: /mni/v1/admin/data
     HTTP method:   GET
     OpenID Scope:  read:mni_admin
  */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/data",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getAdminData
  );

  /*
       Tag:           Administration - Data
       operationId:   addAdminData
       exposed Route: /mni/v1/admin/data
       HTTP method:   POST
       OpenID Scope:  read:mni_admin
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/admin/data",
    // security("read:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    body("historical.duration").default(0).isInt(OAS.duration),
    body("historical.unit").default("day").isString().isIn(OAS.durationUnit),
    body("predicted.duration").default(0).isInt(OAS.duration),
    body("predicted.unit").default("day").isString().isIn(OAS.durationUnit),
    addAdminData
  );

  /*
       Tag:           Administration - Data
       operationId:   getMaxRetentionPeriodDuration
       exposed Route: /mni/v1/admin/data/historical/duration
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/data/historical/duration",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMaxRetentionPeriodDuration
  );

  /*
       Tag:           Administration - Data
       operationId:   updateMaxRetentionPeriodDuration
       exposed Route: /mni/v1/admin/data/historical/duration
       HTTP method:   PATCH
       OpenID Scope:  write:mni_admin
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/admin/data/historical/duration",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    body("duration").isInt(OAS.duration),
    body("unit").isString().isIn(OAS.durationUnit),
    updateMaxRetentionPeriodDuration
  );

  /*
       Tag:           Administration - Data
       operationId:   getMaxPredictedPeriodDuration
       exposed Route: /mni/v1/admin/data/predicted/duration
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/data/predicted/duration",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMaxRetentionPeriodDuration
  );

  /*
       Tag:           Administration - Data
       operationId:   updateMaxPredictedPeriodDuration
       exposed Route: /mni/v1/admin/data/predicted/duration
       HTTP method:   PATCH
       OpenID Scope:  write:mni_admin
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/admin/data/predicted/duration",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    body("duration").isInt(OAS.duration),
    body("unit").isIn(OAS.durationUnit),
    updateMaxPredictedPeriodDuration
  );

  /*
       Tag:           Administration - Email
       operationId:   getMultipleEmail
       exposed Route: /mni/v1/admin/email
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/email",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMultipleEmail
  );

  /*
       Tag:           Administration - Email
       operationId:   addMultipleEmail
       exposed Route: /mni/v1/admin/email
       HTTP method:   POST
       OpenID Scope:  write:mni_admin
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/admin/email",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body().isArray({ min: 1 }),
    body("*.emailProviderId").isUUID(4),
    body("*.vendor").isString().trim(),
    body("*.address").isEmail(),
    body("*.name").isString().trim(),
    body("*.send").isObject(),
    body("*.send.username").isString().trim(),
    body("*.send.password").isString().trim(),
    body("*.send.host").isFQDN({ require_tld: true, allow_numeric_tld: true }),
    body("*.send.port").default(465).isPort(),
    body("*.send.protocol").default("smtp").isIn(OAS.emailSendProtocol),
    body("*.send.authentication")
      .default("PLAIN")
      .isIn(OAS.emailSendAuthentication),
    body("*.send.encryption.enabled").default(true).isBoolean({ strict: true }),
    body("*.send.encryption.starttls")
      .default(false)
      .isBoolean({ strict: true }),
    body("*.receive").optional().isObject(),
    body("*.receive.username").if(body("*.receive").exists()).isString().trim(),
    body("*.receive.password").if(body("*.receive").exists()).isString().trim(),
    body("*.receive.host").if(body("*.receive").exists()).isFQDN({
      require_tld: true,
      allow_numeric_tld: true,
    }),
    body("*.receive.port").if(body("*.receive").exists()).default(993).isPort(),
    body("*.receive.protocol")
      .if(body("*.receive").exists())
      .default("imap4")
      .isIn(OAS.emailReceiveProtocol),
    body("*.receive.encryption.enabled")
      .if(body("*.receive").exists())
      .optional()
      .isBoolean({ strict: true }),
    body("*.receive.encryption.starttls")
      .if(body("*.receive").exists())
      .optional()
      .isBoolean({ strict: true }),
    body("*.receive.rootFolder")
      .if(body("*.receive").exists())
      .optional()
      .isString()
      .trim(),
    body("*.receive.folderSeparator")
      .if(body("*.receive").exists())
      .optional()
      .isIn(OAS.emailReceiveFolderSeparator),
    addMultipleEmail
  );

  /*
       Tag:           Administration - Email
       operationId:   getAllEmailProviders
       exposed Route: /mni/v1/admin/email/provider
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/email/provider",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("pageSize").optional().isInt(OAS.pageSize),
    query("pageNumber").optional().isInt(OAS.pageNumber),
    getAllEmailProviders
  );

  /*
       Tag:           Administration - Email
       operationId:   registerEmailProvider
       exposed Route: /mni/v1/admin/email/provider
       HTTP method:   POST
       OpenID Scope:  write:mni_admin
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/admin/email/provider",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("vendor").isString().trim(),
    body("address").isEmail(),
    body("name").isString().trim(),
    body("send").isObject(),
    body("send.username").isString().trim(),
    body("send.password").isString().trim(),
    body("send.host").isFQDN({ require_tld: true, allow_numeric_tld: true }),
    body("send.port").default(465).isPort(),
    body("send.protocol").default("smtp").isIn(OAS.emailSendProtocol),
    body("send.authentication")
      .default("PLAIN")
      .isIn(OAS.emailSendAuthentication),
    body("send.encryption.enabled").default(true).isBoolean({ strict: true }),
    body("send.encryption.starttls").default(false).isBoolean({ strict: true }),
    body("receive").optional().isObject(),
    body("receive.username").if(body("receive").exists()).isString().trim(),
    body("receive.password").if(body("receive").exists()).isString().trim(),
    body("receive.host").if(body("receive").exists()).isFQDN({
      require_tld: true,
      allow_numeric_tld: true,
    }),
    body("receive.port").if(body("receive").exists()).isPort(),
    body("receive.protocol")
      .if(body("receive").exists())
      .isIn(OAS.emailReceiveProtocol),
    body("receive.encryption.enabled")
      .if(body("receive").exists())
      .optional()
      .isBoolean({ strict: true }),
    body("receive.encryption.starttls")
      .if(body("receive").exists())
      .optional()
      .isBoolean({ strict: true }),
    body("receive.rootFolder").optional().isString().trim(),
    body("receive.folderSeparator")
      .if(body("receive").exists())
      .optional()
      .isIn(OAS.emailReceiveFolderSeparator),
    registerEmailProvider
  );

  /*
       Tag:           Administration - Email
       operationId:   deleteEmailProvider
       exposed Route: /mni/v1/admin/email/provider/:emailProviderId
       HTTP method:   DELETE
       OpenID Scope:  write:mni_admin
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/admin/email/provider/:emailProviderId",
    // security("write:mni_admin"),
    param("emailProviderId").isUUID(4),
    deleteEmailProvider
  );

  /*
       Tag:           Administration - Email
       operationId:   getSingleEmailProvider
       exposed Route: /mni/v1/admin/email/provider/:emailProviderId
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/email/provider/:emailProviderId",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("emailProviderId").isUUID(4),
    getSingleEmailProvider
  );

  /*
       Tag:           Administration - Email
       operationId:   updateEmailProvider
       exposed Route: /mni/v1/admin/email/provider/:emailProviderId
       HTTP method:   PATCH
       OpenID Scope:  write:mni_admin
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/admin/email/provider/:emailProviderId",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("emailProviderId").isUUID(4),
    body("vendor").optional().isString().trim(),
    body("address").optional().isEmail(),
    body("name").optional().isString().trim(),
    body("send").optional().isObject(),
    body("send.username").optional().isString().trim(),
    body("send.password").optional().isString().trim(),
    body("send.host")
      .optional()
      .isFQDN({ require_tld: true, allow_numeric_tld: true }),
    body("send.port").optional().isPort(),
    body("send.protocol").optional().isIn(OAS.emailSendProtocol),
    body("send.authentication").optional().isIn(OAS.emailSendAuthentication),
    body("send.encryption.enabled").optional().isBoolean({ strict: true }),
    body("send.encryption.starttls").optional().isBoolean({ strict: true }),
    body("receive").optional().isObject(),
    body("receive.username").optional().isString().trim(),
    body("receive.password").optional().isString().trim(),
    body("receive.host").optional().isFQDN({
      require_tld: true,
      allow_numeric_tld: true,
    }),
    body("receive.port").optional().isPort(),
    body("receive.protocol").optional().isIn(OAS.emailReceiveProtocol),
    body("receive.encryption.enabled")
      .optional()
      .default(true)
      .isBoolean({ strict: true }),
    body("receive.encryption.starttls")
      .optional()
      .default(false)
      .isBoolean({ strict: true }),
    body("receive.rootFolder").optional().isString().trim(),
    body("receive.folderSeparator")
      .optional()
      .isIn(OAS.emailReceiveFolderSeparator),
    updateEmailProvider,
    replaceEmailProvider
  );

  /*
       Tag:           Administration - Email
       operationId:   replaceEmailProvider
       exposed Route: /mni/v1/admin/email/provider/:emailProviderId
       HTTP method:   PUT
       OpenID Scope:  write:mni_admin
    */
  app.put(
    serveUrlPrefix + serveUrlVersion + "/admin/email/provider/:emailProviderId",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("emailProviderId").isUUID(4),
    body("vendor").isString().trim(),
    body("address").isEmail(),
    body("name").isString().trim(),
    body("send").isObject(),
    body("send.username").isString().trim(),
    body("send.password").isString().trim(),
    body("send.host").isFQDN({ require_tld: true, allow_numeric_tld: true }),
    body("send.port").default(465).isPort(),
    body("send.protocol").isIn(OAS.emailSendProtocol).default("imap4"),
    body("send.authentication")
      .default("PLAIN")
      .isIn(OAS.emailSendAuthentication),
    body("send.encryption.enabled").default(true).isBoolean({ strict: true }),
    body("send.encryption.starttls").default(false).isBoolean({ strict: true }),
    body("receive").optional().isObject(),
    body("receive.username").if(body("receive").exists()).isString().trim(),
    body("receive.password").if(body("receive").exists()).isString().trim(),
    body("receive.host").if(body("receive").exists()).isFQDN({
      require_tld: true,
      allow_numeric_tld: true,
    }),
    body("receive.port").if(body("receive").exists()).isPort(),
    body("receive.protocol")
      .if(body("receive").exists())
      .default("imap4")
      .isIn(OAS.emailReceiveProtocol),
    body("receive.encryption.enabled")
      .if(body("receive").exists())
      .optional()
      .isBoolean({ strict: true }),
    body("receive.encryption.starttls")
      .if(body("receive").exists())
      .optional()
      .isBoolean({ strict: true }),
    body("receive.rootFolder").optional().isString().trim(),
    body("receive.folderSeparator")
      .if(body("receive").exists())
      .optional()
      .isIn(OAS.emailReceiveFolderSeparator),
    replaceEmailProvider
  );

  /*
       Tag:           Administration - Kafka
       operationId:   getMultipleKafka
       exposed Route: /mni/v1/admin/kafka
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/kafka",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMultipleKafka
  );

  /*
       Tag:           Administration - Kafka
       operationId:   addMultipleKafka
       exposed Route: /mni/v1/admin/kafka
       HTTP method:   POST
       OpenID Scope:  write:mni_admin
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/admin/kafka",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body().isArray({ min: 1 }),
    body("*.kafkaProducerId").isUUID(4),
    body("*.name").isString().trim(),
    body("*.clientId").default("mni").isString().trim(),
    body("*.producer").isObject(),
    body("*.producer.username").isString().trim(),
    body("*.producer.password").isString().trim(),
    body("*.producer.host").isFQDN({
      require_tld: true,
      allow_numeric_tld: true,
    }),
    body("*.producer.port").default(9092).isPort(),
    body("*.producer.retryDelay").default(10000).isInt(OAS.kafka_retryDelay),
    body("*.producer.retries").default(2).isInt(OAS.kafka_retries),
    body("*.producer.acks").default("leader").isIn(OAS.kafkaProducerAcks),
    body("*.producer.linger").default(0).isInt(OAS.kafka_linger),
    body("*.producer.batchSize").default(16).isInt(OAS.kafka_batchSize),
    body("*.producer.bufferMemory").default(32).isInt(OAS.kafka_bufferMemory),
    body("*.producer.maxInflightRequestsPerConnection")
      .default(5)
      .isInt(OAS.kafka_maxInFlightRequestsPerConnection),
    body("*.producer.compressionMethod")
      .default("none")
      .isIn(OAS.kafkaProducerCompressionMethod),
    body("*.producer.authentication")
      .default("none")
      .isIn(OAS.kafkaProducerAuthentication),
    addMultipleKafka
  );

  /*
       Tag:           Administration - Kafka
       operationId:   getAllKafkaBrokers
       exposed Route: /mni/v1/admin/kafka/broker
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/kafka/broker",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("pageSize").optional().isInt(OAS.pageSize),
    query("pageNumber").optional().isInt(OAS.pageNumber),
    getAllKafkaBrokers
  );

  /*
       Tag:           Administration - Kafka
       operationId:   registerKafkaBroker
       exposed Route: /mni/v1/admin/kafka/broker
       HTTP method:   POST
       OpenID Scope:  write:mni_admin
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/admin/kafka/broker",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("name").isString().trim(),
    body("clientId").default("mni").isString().trim(),
    body("producer").isObject(),
    body("producer.username").isString().trim(),
    body("producer.password").isString().trim(),
    body("producer.host").isFQDN({
      require_tld: true,
      allow_numeric_tld: true,
    }),
    body("producer.port").default(9092).isPort(),
    body("producer.retryDelay").default(10000).isInt(OAS.kafka_retryDelay),
    body("producer.retries").default(2).isInt(OAS.kafka_retries),
    body("producer.acks").default("leader").isIn(OAS.kafkaProducerAcks),
    body("producer.linger").default(0).isInt(OAS.kafka_linger),
    body("producer.batchSize").default(16).isInt(OAS.kafka_batchSize),
    body("producer.bufferMemory").default(32).isInt(OAS.kafka_bufferMemory),
    body("producer.maxInflightRequestsPerConnection")
      .default(5)
      .isInt(OAS.kafka_maxInFlightRequestsPerConnection),
    body("producer.compressionMethod")
      .default("none")
      .isIn(OAS.kafkaProducerCompressionMethod),
    body("producer.authentication")
      .default("none")
      .isIn(OAS.kafkaProducerAuthentication),
    registerKafkaBroker
  );

  /*
       Tag:           Administration - Kafka
       operationId:   deleteKafkaBroker
       exposed Route: /mni/v1/admin/kafka/broker/:kafkaProducerId
       HTTP method:   DELETE
       OpenID Scope:  write:mni_admin
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/admin/kafka/broker/:kafkaProducerId",
    // security("write:mni_admin"),
    param("kafkaProducerId").isUUID(4),
    deleteKafkaBroker
  );

  /*
       Tag:           Administration - Kafka
       operationId:   getSingleKafkaBroker
       exposed Route: /mni/v1/admin/kafka/broker/:kafkaProducerId
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/kafka/broker/:kafkaProducerId",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("kafkaProducerId").isUUID(4),
    getSingleKafkaBroker
  );

  /*
       Tag:           Administration - Kafka
       operationId:   updateKafkaBroker
       exposed Route: /mni/v1/admin/kafka/broker/:kafkaProducerId
       HTTP method:   PATCH
       OpenID Scope:  write:mni_admin
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/admin/kafka/broker/:kafkaProducerId",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    body("name").optional().isString().trim(),
    body("clientId").optional().isString().trim(),
    body("producer").optional().isObject(),
    body("producer.username").optional().isString().trim(),
    body("producer.password").optional().isString().trim(),
    body("producer.host").optional().isFQDN({
      require_tld: true,
      allow_numeric_tld: true,
    }),
    body("producer.port").optional().isPort(),
    body("producer.retryDelay").optional().isInt(OAS.kafka_retryDelay),
    body("producer.retries").optional().isInt(OAS.kafka_retries),
    body("producer.acks").optional().isIn(OAS.kafkaProducerAcks),
    body("producer.linger").optional().isInt(OAS.kafka_linger),
    body("producer.batchSize").optional().isInt(OAS.kafka_batchSize),
    body("producer.bufferMemory").optional().isInt(OAS.kafka_bufferMemory),
    body("producer.maxInflightRequestsPerConnection")
      .optional()
      .isInt(OAS.kafka_maxInFlightRequestsPerConnection),
    body("producer.compressionMethod")
      .optional()
      .isIn(OAS.kafkaProducerCompressionMethod),
    body("producer.authentication")
      .optional()
      .isIn(OAS.kafkaProducerAuthentication),
    updateKafkaBroker,
    replaceKafkaBroker
  );

  /*
       Tag:           Administration - Kafka
       operationId:   replaceKafkaBroker
       exposed Route: /mni/v1/admin/kafka/broker/:kafkaProducerId
       HTTP method:   PUT
       OpenID Scope:  write:mni_admin
    */
  app.put(
    serveUrlPrefix + serveUrlVersion + "/admin/kafka/broker/:kafkaProducerId",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("kafkaProducerId").isUUID(4),
    body("name").isString().trim(),
    body("clientId").isString().trim(),
    body("producer").isObject(),
    body("producer.username").isString().trim(),
    body("producer.password").isString().trim(),
    body("producer.host").isFQDN({
      require_tld: true,
      allow_numeric_tld: true,
    }),
    body("producer.port").default(9092).isPort(),
    body("producer.retryDelay").default(10000).isInt(OAS.kafka_retryDelay),
    body("producer.retries").default(2).isInt(OAS.kafka_retries),
    body("producer.acks").default("leader").isIn(OAS.kafkaProducerAcks),
    body("producer.linger").default(0).isInt(OAS.kafka_linger),
    body("producer.batchSize").default(16).isInt(OAS.kafka_batchSize),
    body("producer.bufferMemory").default(32).isInt(OAS.kafka_bufferMemory),
    body("producer.maxInflightRequestsPerConnection")
      .default(5)
      .isInt(OAS.kafka_maxInFlightRequestsPerConnection),
    body("producer.compressionMethod")
      .default("none")
      .isIn(OAS.kafkaProducerCompressionMethod),
    body("producer.authentication")
      .default("none")
      .isIn(OAS.kafkaProducerAuthentication),
    replaceKafkaBroker
  );

  /*
       Tag:           Administration - Maps
       operationId:   addMultipleMap
       exposed Route: /mni/v1/admin/map
       HTTP method:   POST
       OpenID Scope:  write:mni_admin
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/admin/map",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body().isArray({ min: 1 }),
    body("*.mapProviderId").isUUID(4),
    body("*.vendor").isIn(OAS.mapVendorPlatform),
    body("*.default").default(false).isBoolean({ strict: true }),
    body("*.renderUrl").isURL({ protocols: OAS.url_protocols }),
    /* oneOf not working with array in this context
       https://github.com/express-validator/express-validator/issues/778
       https://github.com/express-validator/express-validator/issues/950
      
    oneOf(
      [
        [
          body("*.credentials").isObject(),
          body("*.credentials.identity").isString().trim(),
          body("*.credentials.key").isString().trim(),
        ],
        [
          body("*.identityProvider").isObject(),
          body("*.identityProvider.base").isURL({
            protocols: OAS.url_protocols,
          }),
          body("*.identityProvider.authorization").isURL({
            require_protocol: false,
            require_host: false,
            require_port: false,
            allow_protocol_relative_urls: true,
            allow_fragments: true,
            allow_query_components: false,
          }),
          body("*.identityProvider.token").isURL({
            require_protocol: false,
            require_host: false,
            require_port: false,
            allow_protocol_relative_urls: true,
            allow_fragments: true,
            allow_query_components: false,
          }),
          body("*.identityProvider.wellKnown").isURL({
            require_protocol: false,
            require_host: false,
            require_port: false,
            allow_protocol_relative_urls: true,
            allow_fragments: true,
            allow_query_components: false,
          }),
        ],
      ],
      {
        message:
          "either credential keys or identity provider URLs must be supplied"
      }
    ),
    */
    addMultipleMap
  );

  /*
       Tag:           Administration - Maps
       operationId:   getMultipleMap
       exposed Route: /mni/v1/admin/map
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/map",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMultipleMap
  );

  /*
       Tag:           Administration - Maps
       operationId:   getAllMapProviders
       exposed Route: /mni/v1/admin/map/provider
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/map/provider",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("pageSize").optional().isInt(OAS.pageSize),
    query("pageNumber").optional().isInt(OAS.pageNumber),
    getAllMapProviders
  );

  /*
       Tag:           Administration - Maps
       operationId:   registerMapProvider
       exposed Route: /mni/v1/admin/map/provider
       HTTP method:   POST
       OpenID Scope:  write:mni_admin
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/admin/map/provider",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("vendor").isIn(OAS.mapVendorPlatform),
    body("default").default(false).isBoolean({ strict: true }),
    body("renderUrl").isURL({ protocols: OAS.url_protocols }),
    oneOf(
      [
        [
          body("credentials").isObject(),
          body("credentials.identity").isString().trim(),
          body("credentials.key").isString().trim(),
        ],
        [
          body("identityProvider").isObject(),
          body("identityProvider.base").isURL({
            protocols: OAS.url_protocols,
          }),
          body("identityProvider.authorization").isURL({
            require_protocol: false,
            require_host: false,
            require_port: false,
            allow_protocol_relative_urls: true,
            allow_fragments: true,
            allow_query_components: false,
          }),
          body("identityProvider.token").isURL({
            require_protocol: false,
            require_host: false,
            require_port: false,
            allow_protocol_relative_urls: true,
            allow_fragments: true,
            allow_query_components: false,
          }),
          body("identityProvider.wellKnown").isURL({
            require_protocol: false,
            require_host: false,
            require_port: false,
            allow_protocol_relative_urls: true,
            allow_fragments: true,
            allow_query_components: false,
          }),
        ],
      ],
      {
        message:
          "either credential keys or identity provider URLs must be supplied",
      }
    ),
    registerMapProvider
  );

  /*
       Tag:           Administration - Maps
       operationId:   deleteMapProvider
       exposed Route: /mni/v1/admin/map/provider/:mapProviderId
       HTTP method:   DELETE
       OpenID Scope:  write:mni_admin
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/admin/map/provider/:mapProviderId",
    // security("write:mni_admin"),
    param("mapProviderId").isUUID(4),
    deleteMapProvider
  );

  /*
       Tag:           Administration - Maps
       operationId:   getSingleMapProvider
       exposed Route: /mni/v1/admin/map/provider/:mapProviderId
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/map/provider/:mapProviderId",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("mapProviderId").isUUID(4),
    getSingleMapProvider
  );

  /*
       Tag:           Administration - Maps
       operationId:   updateMapProvider
       exposed Route: /mni/v1/admin/map/provider
       HTTP method:   PATCH
       OpenID Scope:  write:mni_admin
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/admin/map/provider/:mapProviderId",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    body("vendor").optional().isIn(OAS.mapVendorPlatform),
    body("default").optional().default(false).isBoolean({ strict: true }),
    body("renderUrl").optional().isURL({ protocols: OAS.url_protocols }),
    oneOf(
      [
        [
          body("credentials").optional().isObject(),
          body("credentials.identity").optional().isString().trim(),
          body("credentials.key").optional().isString().trim(),
        ],
        [
          body("identityProvider").optional().isObject(),
          body("identityProvider.base").optional().isURL({
            protocols: OAS.url_protocols,
          }),
          body("identityProvider.authorization").optional().isURL({
            require_protocol: false,
            require_host: false,
            require_port: false,
            allow_protocol_relative_urls: true,
            allow_fragments: true,
            allow_query_components: false,
          }),
          body("identityProvider.token").optional().isURL({
            require_protocol: false,
            require_host: false,
            require_port: false,
            allow_protocol_relative_urls: true,
            allow_fragments: true,
            allow_query_components: false,
          }),
          body("identityProvider.wellKnown").optional().isURL({
            require_protocol: false,
            require_host: false,
            require_port: false,
            allow_protocol_relative_urls: true,
            allow_fragments: true,
            allow_query_components: false,
          }),
        ],
      ],
      {
        message:
          "either credential keys or identity provider URLs must be supplied",
      }
    ),
    updateMapProvider,
    replaceMapProvider
  );

  /*
       Tag:           Administration - Maps
       operationId:   replaceMapProvider
       exposed Route: /mni/v1/admin/map/provider
       HTTP method:   PUT
       OpenID Scope:  write:mni_admin
    */
  app.put(
    serveUrlPrefix + serveUrlVersion + "/admin/map/provider/:mapProviderId",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    body("vendor").isIn(OAS.mapVendorPlatform),
    body("default").default(false).isBoolean({ strict: true }),
    body("renderUrl").isURL({ protocols: OAS.url_protocols }),
    oneOf(
      [
        [
          body("credentials").isObject(),
          body("credentials.identity").isString().trim(),
          body("credentials.key").isString().trim(),
        ],
        [
          body("identityProvider").isObject(),
          body("identityProvider.base").isURL({
            protocols: OAS.url_protocols,
          }),
          body("identityProvider.authorization").isURL({
            require_protocol: false,
            require_host: false,
            require_port: false,
            allow_protocol_relative_urls: true,
            allow_fragments: true,
            allow_query_components: false,
          }),
          body("identityProvider.token").isURL({
            require_protocol: false,
            require_host: false,
            require_port: false,
            allow_protocol_relative_urls: true,
            allow_fragments: true,
            allow_query_components: false,
          }),
          body("identityProvider.wellKnown").isURL({
            require_protocol: false,
            require_host: false,
            require_port: false,
            allow_protocol_relative_urls: true,
            allow_fragments: true,
            allow_query_components: false,
          }),
        ],
      ],
      {
        message:
          "either credential keys or identity provider URLs must be supplied",
      }
    ),
    replaceMapProvider
  );

  /*
       Tag:           Administration - Maps
       operationId:   getDefaultMapProvider
       exposed Route: /mni/v1/admin/map/provider/default
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/map/provider/default",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getDefaultMapProvider
  );

  /*
       Tag:           Administration - Workflow Engine
       operationId:   getMultipleWorkflow
       exposed Route: /mni/v1/admin/workflow
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/workflow",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMultipleWorkflow
  );

  /*
       Tag:           Administration - Workflow Engine
       operationId:   addMultipleWorkflow
       exposed Route: /mni/v1/admin/workflow
       HTTP method:   POST
       OpenID Scope:  write:mni_admin
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/admin/workflow",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body().isArray({ min: 1 }),
    body("*.workflowEngineId").isUUID(4),
    body("*.name").isString().trim(),
    body("*.engine").isObject(),
    body("*.engine.url").isURL({ protocols: OAS.url_protocols }),
    body("*.engine.username").isString().trim(),
    body("*.engine.password").isString().trim(),
    body("*.engine.type").isIn(OAS.workflowEngineType),
    addMultipleWorkflow
  );

  /*
       Tag:           Administration - Workflow Engine
       operationId:   getAllWorkflowEngines
       exposed Route: /mni/v1/admin/workflow/engine
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/admin/workflow/engine",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("pageSize").optional().isInt(OAS.pageSize),
    query("pageNumber").optional().isInt(OAS.pageNumber),
    getAllWorkflowEngines
  );

  /*
       Tag:           Administration - Workflow Engine
       operationId:   registerWorkflowEngine
       exposed Route: /mni/v1/admin/workflow/engine
       HTTP method:   POST
       OpenID Scope:  write:mni_admin
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/admin/workflow/engine",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("name").isString().trim(),
    body("engine").isObject(),
    body("engine.url").isURL({ protocols: OAS.url_protocols }),
    body("engine.username").isString().trim(),
    body("engine.password").isString().trim(),
    body("engine.type").isIn(OAS.workflowEngineType),
    registerWorkflowEngine
  );

  /*
       Tag:           Administration - Workflow Engine
       operationId:   deleteWorkflowEngine
       exposed Route: /mni/v1/admin/workflow/engine/:workflowEngineId
       HTTP method:   DELETE
       OpenID Scope:  write:mni_admin
    */
  app.delete(
    serveUrlPrefix +
      serveUrlVersion +
      "/admin/workflow/engine/:workflowEngineId",
    // security("write:mni_admin"),
    param("workflowEngineId").isUUID(4),
    deleteWorkflowEngine
  );

  /*
       Tag:           Administration - Workflow Engine
       operationId:   getSingleWorkflowEngine
       exposed Route: /mni/v1/admin/workflow/engine/:workflowEngineId
       HTTP method:   GET
       OpenID Scope:  read:mni_admin
    */
  app.get(
    serveUrlPrefix +
      serveUrlVersion +
      "/admin/workflow/engine/:workflowEngineId",
    // security("read:mni_admin"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("workflowEngineId").isUUID(4),
    getSingleWorkflowEngine
  );

  /*
       Tag:           Administration - Workflow Engine
       operationId:   updateWorkflowEngine
       exposed Route: /mni/v1/admin/workflow/engine/:workflowEngineId
       HTTP method:   PATCH
       OpenID Scope:  write:mni_admin
    */
  app.patch(
    serveUrlPrefix +
      serveUrlVersion +
      "/admin/workflow/engine/:workflowEngineId",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("workflowEngineId").isUUID(4),
    body("name").optional().isString().trim(),
    body("engine").optional().isObject(),
    body("engine.url").optional().isURL({ protocols: OAS.url_protocols }),
    body("engine.username").optional().isString().trim(),
    body("engine.password").optional().isString().trim(),
    body("engine.type").optional().isIn(OAS.workflowEngineType),
    updateWorkflowEngine,
    replaceWorkflowEngine
  );

  /*
       Tag:           Administration - Workflow Engine
       operationId:   replaceWorkflowEngine
       exposed Route: /mni/v1/admin/workflow/engine/:workflowEngineId
       HTTP method:   PUT
       OpenID Scope:  write:mni_admin
    */
  app.put(
    serveUrlPrefix +
      serveUrlVersion +
      "/admin/workflow/engine/:workflowEngineId",
    // security("write:mni_admin"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("workflowEngineId").isUUID(4),
    body("name").isString().trim(),
    body("engine").isObject(),
    body("engine.url").isURL({ protocols: OAS.url_protocols }),
    body("engine.username").isString().trim(),
    body("engine.password").isString().trim(),
    body("engine.type").isIn(OAS.workflowEngineType),
    replaceWorkflowEngine
  );

  /*
       Tag:           Alerts
       operationId:   getMultipleAlerts
       exposed Route: /mni/v1/alerts
       HTTP method:   GET
       OpenID Scope:  read:mni_alert
    */
  app.get(
    // security("read:mni_alert"),
    serveUrlPrefix + serveUrlVersion + "/alerts",
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMultipleAlerts
  );

  /*
       Tag:           Alerts
       operationId:   getNextAlertQueueItem
       exposed Route: /mni/v1/alert/queue
       HTTP method:   GET
       OpenID Scope:  read:mni_internal
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/alert/queue",
    // security("read:mni_internal"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getNextAlertQueueItem
  );

  /*
       Tag:           Alerts
       operationId:   deleteAlertQueueItem
       exposed Route: /mni/v1/alert/queue
       HTTP method:   DELETE
       OpenID Scope:  read:mni_internal
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/alert/queue/:qId",
    // security("read:mni_internal"),
    param("qId").default(0).isInt({ min: 0, max: Number.MAX_SAFE_INTEGER }),
    deleteAlertQueueItem
  );

  /*
       Tag:           Alerts
       operationId:   getAllAlerts
       exposed Route: /mni/v1/alert
       HTTP method:   GET
       OpenID Scope:  read:mni_alert
    */
  app.get(
    // security("read:mni_alert"),
    serveUrlPrefix + serveUrlVersion + "/alert",
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("pageSize").optional().isInt(OAS.pageSize),
    query("pageNumber").optional().isInt(OAS.pageNumber),
    getAllAlerts
  );

  /*
       Tag:           Alerts
       operationId:   addSingleAlert
       exposed Route: /mni/v1/alert
       HTTP method:   GET
       OpenID Scope:  write:mni_internal
    */
  app.post(
    // security("write:mni_internal"),
    serveUrlPrefix + serveUrlVersion + "/alert",
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("description").isString().trim(),
    body("delete").default(false).isBoolean({ strict: true }),
    addSingleAlert
  );

  /*
       Tag:           Alerts
       operationId:   unsubscribeAlert
       exposed Route: /mni/v1/alert/callback
       HTTP method:   DELETE
       OpenID Scope:  write:mni_alert
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/alert/callback",
    // security("write:mni_alert"),
    query("requestorId").isUUID(4),
    query("subscriptionId").matches(OAS.csv_uuids),
    unsubscribeAlert
  );

  /*
       Tag:           Alerts
       operationId:   subscribeAlert
       exposed Route: /mni/v1/alert/callback
       HTTP method:   POST
       OpenID Scope:  write:mni_alert
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/alert/callback",
    // security("write:mni_alert"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("requestorId").isUUID(4),
    body("alerts").isArray({ min: 1 }),
    body("alerts.*.alertId").isUUID(4),
    body("alerts.*.callbackUrl").isURL({ protocols: OAS.url_protocols }),
    body("alerts.*.username").optional().isString().trim(),
    body("alerts.*.password").optional().isString().trim(),
    body("alerts.*.authentication")
      .default("none")
      .isIn(OAS.callbackAuthentication),
    body("alerts.*.retires").default(0).isInt(OAS.callback_retries),
    body("alerts.*.retryDelay").isInt(OAS.callback_retryDelay).default(60),
    body("alerts.*.maxLifeRetries")
      .default(16)
      .isInt(OAS.callback_maxLifeRetries),
    subscribeAlert
  );

  /*
       Tag:           Alerts
       operationId:   unNotifyAlert
       exposed Route: /mni/v1/alert/notify
       HTTP method:   DELETE
       OpenID Scope:  write:mni_alert
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/alert/notify",
    // security("write:mni_alert"),
    query("requestorId").isUUID(4),
    query("notificationId").matches(OAS.csv_uuids),
    unNotifyAlert
  );

  /*
       Tag:           Alerts
       operationId:   getNotifyAlert
       exposed Route: /mni/v1/alert/notify
       HTTP method:   GET
       OpenID Scope:  read:mni_alert
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/alert/notify",
    // security("read:mni_alert"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("notificationId").isUUID(4),
    getNotifyAlert
  );

  /*
       Tag:           Alerts
       operationId:   notifyAlert
       exposed Route: /mni/v1/alert/notify
       HTTP method:   POST
       OpenID Scope:  write:mni_alert
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/alert/notify",
    // security("write:mni_alert"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("requestorId").isUUID(4),
    body("alerts").isArray({ min: 1 }),
    body("alerts.*.alertId").isUUID(4),
    body("alerts.*.emailProviderId").isUUID(4),
    body("alerts.*.subject").isString().isLength(OAS.emailSubject),
    body("alerts.*.recipients").isArray({ min: 1 }),
    notifyAlert
  );

  /*
       Tag:           Alerts
       operationId:   unpublishAlert
       exposed Route: /mni/v1/alert/publish
       HTTP method:   DELETE
       OpenID Scope:  write:mni_alert
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/alert/publish",
    // security("write:mni_alert"),
    query("requestorId").isUUID(4),
    query("publicationId").matches(OAS.csv_uuids),
    unpublishAlert
  );

  /*
       Tag:           Alerts
       operationId:   publishAlert
       exposed Route: /mni/v1/alert/publish
       HTTP method:   POST
       OpenID Scope:  write:mni_alert
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/alert/publish",
    // security("write:mni_alert"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("requestorId").isUUID(4),
    body("alerts").isArray({ min: 1 }),
    body("alerts.*.alertId").isUUID(4),
    body("alerts.*.kafkaProducerId").isUUID(4),
    body("alerts.*.topic").matches(OAS.kafkaTopic),
    publishAlert
  );

  /*
       Tag:           Alerts
       operationId:   workflowAlertUnassign
       exposed Route: /mni/v1/alert/workflow
       HTTP method:   DELETE
       OpenID Scope:  write:mni_alert
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/alert/workflow",
    // security("write:mni_alert"),
    query("requestorId").isUUID(4),
    query("workflowRunnerId").matches(OAS.csv_uuids),
    workflowAlertUnassign
  );

  /*
       Tag:           Alerts
       operationId:   workflowAlertAssign
       exposed Route: /mni/v1/alert/workflow
       HTTP method:   POST
       OpenID Scope:  write:mni_alert
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/alert/workflow",
    // security("write:mni_alert"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("requestorId").isUUID(4),
    body("alerts").isArray({ min: 1 }),
    body("alerts.*.alertId").isUUID(4),
    body("alerts.*.workflowEngineId").isUUID(4),
    body("alerts.*.flowName").isString().trim(),
    workflowAlertAssign
  );

  /*
       Tag:           Alerts
       operationId:   getSingleAlert
       exposed Route: /mni/v1/alert/{alertId}
       HTTP method:   GET
       OpenID Scope:  read:mni_alert
    */
  app.get(
    // security("read:mni_alert"),
    serveUrlPrefix + serveUrlVersion + "/alert/:alertId",
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("alertId").isUUID(4),
    getSingleAlert
  );

  /*
       Tag:           Alerts
       operationId:   deleteSingleAlert
       exposed Route: /mni/v1/alert/:alertId
       HTTP method:   DELETE
       OpenID Scope:  write:mni_internal
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/alert/:alertId",
    // security("write:mni_internal"),
    param("alertId").isUUID(4),
    deleteSingleAlert
  );

  /*
       Tag:           Alerts
       operationId:   updateSingleAlert
       exposed Route: /mni/v1/alert/:alertId
       HTTP method:   PATCH
       OpenID Scope:  write:mni_internal
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/alert/:alertId",
    // security("write:mni_internal"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("alertId").isUUID(4),
    body("description").isString().trim(),
    updateSingleAlert
  );

  /*
       Tag:           Cables
       operationId:   getAllCables
       exposed Route: /mni/v1/cable
       HTTP method:   GET
       OpenID Scope:  read:mni_cable
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/cable",
    // security("read:mni_cable"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("pageSize").optional().isInt(OAS.pageSize),
    query("pageNumber").optional().isInt(OAS.pageNumber),
    getAllCables
  );

  /*
       Tag:           Cables
       operationId:   getCablesSimpleStatistics
       exposed Route: /mni/v1/cables/state
       HTTP method:   GET
       OpenID Scope:  read:mni_cable
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/cables/state",
    // security("read:mni_cable"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getCablesSimpleStatistics
  );

  /*
       Tag:           Cables
       operationId:   addSingleCable
       exposed Route: /mni/v1/cable
       HTTP method:   POST
       OpenID Scope:  cable_write
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/cable",
    // security("cable_write"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    oneOf([body("poleId").isUUID(4), body("ductId").isUUID(4)], {
      message: "either pole or duct identifier must be supplied",
    }),
    body("technology").isIn(OAS.cableTechnology),
    body("configuration").isObject(),
    oneOf(
      [
        // single fiber cable
        body("configuration.strands")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_strands),
        body("configuration.mode").isIn(OAS.portFiberConfigurationMode),
        body("configuration.channels")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_channel),
        body("configuration.width")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_width),
        body("configuration.unit")
          .default("Gbps")
          .isIn(OAS.cableFiberConfigurationRate),
      ],
      [
        // multi-fiber cable
        body("configuration.ribbons").default(1).isInt(OAS.ribbons),
        body("configuration.strands")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_strands),
        body("configuration.mode").isIn(OAS.portFiberConfigurationMode),
        body("configuration.channels")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_channel),
        body("configuration.width")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_width),
        body("configuration.unit")
          .default("Gbps")
          .isIn(OAS.cableFiberConfigurationRate),
      ],
      [
        // coax
        body("configuration.frequencyRange").isObject(),
        body("configuration.frequencyRange.low")
          .default(0.1)
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("configuration.frequencyRange.high")
          .default(100000)
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("configuration.channels")
          .default(1)
          .isInt(OAS.cableConfiguration_coax_channels),
        body("configuration.width")
          .default(1)
          .isInt(OAS.cableConfiguration_coax_width),
        body("configuration.unit")
          .default("GHz")
          .isIn(OAS.cableCoaxConfigurationFrequency),
      ],
      [
        // copper
        body("configuration.twistedPairs")
          .default(4)
          .isInt(OAS.cableConfiguration_copper_twistedPairs),
      ],
      [
        // ethernet
        body("configuration.category")
          .default("Cat6A")
          .isIn(OAS.cableEthernetConfiguration),
        body("configuration.rate")
          .default(10)
          .isInt(OAS.cableConfiguration_ethernet_rate),
        body("configuration.unit")
          .default("Gbps")
          .isIn(OAS.cableEthernetConfigurationRate),
      ],
      {
        message:
          "configuration for single fiber, multi-fiber, coax, copper or ethernet cable must be supplied",
      }
    ),
    body("state").isIn(OAS.cableState),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    addSingleCable
  );

  /*
       Tag:           Cables
       operationId:   getCablesCapacityState
       exposed Route: /mni/v1/cables/capacity/state
       HTTP method:   GET
       OpenID Scope:  read:mni_cable
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/cables/capacity/state",
    // security("read:mni_cable"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("from").optional().matches(OAS.datePeriodYearMonthDay),
    query("to").optional().matches(OAS.datePeriodYearMonthDay),
    query("before").optional().matches(OAS.datePeriodYearMonthDay),
    query("after").optional().matches(OAS.datePeriodYearMonthDay),
    query("aggregate").optional().isString().trim(),
    getCablesCapacityState
  );

  /*
       Tag:           Cables
       operationId:   deleteSingleCable
       exposed Route: /mni/v1/cable/:cableId
       HTTP method:   DELETE
       OpenID Scope:  cable_write
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/cable/:cableId",
    // security("cable_write"),
    param("cableId").isUUID(4),
    oneOf([query("predicted").optional()], [query("restore").optional()], {
      message: "predicted or restore query parameters can not be mixed",
    }),
    deleteSingleCable
  );

  /*
       Tag:           Cables
       operationId:   getSingleCable
       exposed Route: /mni/v1/cable/:cableId
       HTTP method:   GET
       OpenID Scope:  read:mni_cable
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/cable/:cableId",
    // security("read:mni_cable"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("cableId").isUUID(4),
    getSingleCable
  );

  /*
       Tag:           Cables
       operationId:   getCableTimeline
       exposed Route: /mni/v1/cable/timeline/:cableId
       HTTP method:   GET
       OpenID Scope:  read:mni_cable
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/cable/timeline/:cableId",
    // security("read:mni_cable"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("cableId").isUUID(4),
    getCableTimeline
  );

  /*
       Tag:           Cables
       operationId:   updateSingleCable
       exposed Route: /mni/v1/cable/:cableId
       HTTP method:   PATCH
       OpenID Scope:  cable_write
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/cable/:cableId",
    // security("cable_write"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("cableId").isUUID(4),
    oneOf(
      [
        body("poleId").optional().isUUID(4),
        body("ductId").optional().isUUID(4),
      ],
      {
        message: "either pole or duct identifier must be supplied",
      }
    ),
    body("technology").optional().isIn(OAS.cableTechnology),
    body("configuration").optional().isObject(),
    oneOf(
      [
        // single fiber cable
        body("configuration.strands")
          .optional()
          .isInt(OAS.cableConfiguration_single_fiber_strands),
        body("configuration.mode")
          .optional()
          .isIn(OAS.cableFiberConfigurationMode),
        body("configuration.channels")
          .optional()
          .isInt(OAS.cableConfiguration_single_fiber_channel),
        body("configuration.width")
          .optional()
          .isInt(OAS.cableConfiguration_single_fiber_width),
        body("configuration.unit")
          .optional()
          .isIn(OAS.cableFiberConfigurationRate),
      ],
      [
        // multi-fiber cable
        body("configuration.ribbons").optional().isInt(OAS.ribbons),
        body("configuration.strands")
          .optional()
          .isInt(OAS.cableConfiguration_single_fiber_strands),
        body("configuration.mode")
          .optional()
          .isIn(OAS.cableFiberConfigurationMode),
        body("configuration.channels")
          .optional()
          .isInt(OAS.cableConfiguration_single_fiber_channel),
        body("configuration.width")
          .optional()
          .isInt(OAS.cableConfiguration_single_fiber_width),
        body("configuration.unit")
          .optional()
          .isIn(OAS.cableFiberConfigurationMode),
      ],
      [
        // coax
        body("configuration.frequencyRange").optional().isObject(),
        body("configuration.frequencyRange.low")
          .optional()
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("configuration.frequencyRange.high")
          .optional()
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("configuration.channels")
          .optional()
          .isInt(OAS.cableConfiguration_coax_channels),
        body("configuration.width")
          .optional()
          .isFloat(OAS.cableConfiguration_coax_width),
        body("configuration.unit")
          .optional()
          .isIn(OAS.cableCoaxConfigurationFrequency),
      ],
      [
        // copper
        body("configuration.twistedPairs")
          .optional()
          .isInt(OAS.cableConfiguration_copper_twistedPairs),
      ],
      [
        // ethernet
        body("configuration.category")
          .optional()
          .isIn(OAS.cableEthernetConfiguration),
        body("configuration.rate")
          .optional()
          .isInt(OAS.cableConfiguration_ethernet_rate),
        body("configuration.unit")
          .optional()
          .isIn(OAS.cableEthernetConfigurationRate),
      ],
      {
        message:
          "configuration for single fiber, multi-fiber, coax, copper or ethernet cable must be supplied",
      }
    ),
    body("state").optional().isIn(OAS.cableState),
    body("point").optional().matches(OAS.dateTime),
    body("source").optional().isIn(OAS.source),
    body("delete").optional().isBoolean({ strict: true }),
    updateSingleCable,
    replaceSingleCable
  );

  /*
       Tag:           Cables
       operationId:   replaceSingleCable
       exposed Route: /mni/v1/cable/:cableId
       HTTP method:   PUT
       OpenID Scope:  cable_write
    */
  app.put(
    serveUrlPrefix + serveUrlVersion + "/cable/:cableId",
    // security("cable_write"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("cableId").isUUID(4),
    oneOf([body("poleId").isUUID(4), body("ductId").isUUID(4)], {
      message: "either pole or duct identifier must be supplied",
    }),
    body("technology").isIn(OAS.cableTechnology),
    body("configuration").isObject(),
    oneOf(
      [
        // single fiber cable
        body("configuration.strands")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_strands),
        body("configuration.mode").isIn(OAS.cableFiberConfigurationMode),
        body("configuration.channels")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_channel),
        body("configuration.width")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_width),
        body("configuration.unit")
          .default("Gbps")
          .isIn(OAS.cableFiberConfigurationRate),
      ],
      [
        // multi-fiber cable
        body("configuration.ribbons").default(1).isInt(OAS.ribbons),
        body("configuration.strands")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_strands),
        body("configuration.mode").isIn(OAS.cableFiberConfigurationMode),
        body("configuration.channels")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_channel),
        body("configuration.width")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_width),
        body("configuration.unit")
          .default("GHz")
          .isIn(OAS.cableFiberConfigurationRate),
      ],
      [
        // coax
        body("configuration.frequencyRange").isObject(),
        body("configuration.frequencyRange.low")
          .default(0.1)
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("configuration.frequencyRange.high")
          .default(100000)
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("configuration.channels")
          .default(1)
          .isInt(OAS.cableConfiguration_coax_channels),
        body("configuration.width")
          .default(1)
          .isInt(OAS.cableConfiguration_coax_width),
        body("configuration.unit")
          .default("GHz")
          .isIn(OAS.cableCoaxConfigurationFrequency),
      ],
      [
        // copper
        body("configuration.twistedPairs")
          .default(4)
          .isInt(OAS.cableConfiguration_copper_twistedPairs),
      ],
      [
        // ethernet
        body("configuration.category")
          .default("Cat6A")
          .isIn(OAS.cableEthernetConfiguration),
        body("configuration.rate")
          .default(10)
          .isInt(OAS.cableConfiguration_ethernet_rate),
        body("configuration.unit")
          .default("Gbps")
          .isIn(OAS.cableEthernetConfigurationRate),
      ],
      {
        message:
          "configuration for single fiber, multi-fiber, coax, copper or ethernet cable must be supplied",
      }
    ),
    body("state").isIn(OAS.cableState),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    replaceSingleCable
  );

  /*
       Tag:           Cables
       operationId:   updateSingleCableCoaxState
       exposed Route: /mni/v1/cable/:cableId/channel/:channel
       HTTP method:   PATCH
       OpenID Scope:  cable_write
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/cable/:cableId/channel/:channel",
    // security("cable_write"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("cableId").isUUID(4),
    param("channel").isInt(OAS.cableConfiguration_coax_channels),
    body("state").isIn(OAS.cableState),
    updateSingleCableCoaxState
  );

  /*
       Tag:           Cables
       operationId:   updateSingleCableRibbonStrandState
       exposed Route: /mni/v1/cable/:cableId/state/multi/:ribbon/:strand
       HTTP method:   PATCH
       OpenID Scope:  cable_write
    */
  app.patch(
    serveUrlPrefix +
      serveUrlVersion +
      "/cable/:cableId/state/multi/:ribbon/:strand",
    // security("cable_write"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("cableId").isUUID(4),
    param("ribbon").isInt(OAS.ribbons),
    param("strand").isInt(OAS.cableConfiguration_single_fiber_strands),
    body("state").isIn(OAS.cableState),
    updateSingleCableRibbonStrandState
  );

  /*
       Tag:           Cables
       operationId:   updateSingleCableStrandState
       exposed Route: /mni/v1/cable/:cableId/state/single/:strand
       HTTP method:   PATCH
       OpenID Scope:  cable_write
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/cable/:cableId/state/single/:strand",
    // security("cable_write"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("cableId").isUUID(4),
    param("strand").isInt(OAS.cableConfiguration_single_fiber_strands),
    body("state").isIn(OAS.cableState),
    updateSingleCableStrandState
  );

  /*
       Tag:           Cables
       operationId:   getMultipleCables
       exposed Route: /mni/v1/cables
       HTTP method:   GET
       OpenID Scope:  read:mni_cable
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/cables",
    // security("read:mni_cable"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMultipleCables
  );

  /*
       Tag:           Cables
       operationId:   addMultipleCables
       exposed Route: /mni/v1/cables
       HTTP method:   POST
       OpenID Scope:  cable_write
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/cables",
    // security("cable_write"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body().isArray({ min: 1 }),
    body("*.cableId").isUUID(4),
    oneOf([body("*.poleId").isUUID(4), body("*.ductId").isUUID(4)], {
      message: "either pole or duct identifier must be supplied",
    }),
    body("*.technology").isIn(OAS.cableTechnology),
    body("*.configuration").isObject(),
    oneOf(
      [
        // single fiber cable
        body("*.configuration.strands")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_strands),
        body("*.configuration.mode").isIn(OAS.cableFiberConfigurationMode),
        body("*.configuration.channels")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_channel),
        body("*.configuration.width")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_width),
        body("*.configuration.unit")
          .default("Gbps")
          .isIn(OAS.cableFiberConfigurationRate),
      ],
      [
        // multi-fiber cable
        body("*.configuration.ribbons").default(1).isInt(OAS.ribbons),
        body("*.configuration.strands")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_strands),
        body("*.configuration.mode").isIn(OAS.cableFiberConfigurationMode),
        body("*.configuration.channels")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_channel),
        body("*.configuration.width")
          .default(1)
          .isInt(OAS.cableConfiguration_single_fiber_width),
        body("*.configuration.unit")
          .default("Gbps")
          .isIn(OAS.cableFiberConfigurationRate),
      ],
      [
        // coax
        body("*.configuration.frequencyRange").isObject(),
        body("*.configuration.frequencyRange.low")
          .default(0.1)
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("*.configuration.frequencyRange.high")
          .default(100000)
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("*.configuration.channels")
          .default(1)
          .isInt(OAS.cableConfiguration_coax_channels),
        body("*.configuration.width")
          .default(1)
          .isInt(OAS.cableConfiguration_coax_width),
        body("*.configuration.unit")
          .default("GHz")
          .isIn(OAS.cableCoaxConfigurationFrequency),
      ],
      [
        // copper
        body("*.configuration.twistedPairs")
          .default(4)
          .isInt(OAS.cableConfiguration_copper_twistedPairs),
      ],
      [
        // ethernet
        body("*.configuration.category")
          .default("Cat6A")
          .isIn(OAS.cableEthernetConfiguration),
        body("*.configuration.rate")
          .default(10)
          .isInt(OAS.cableConfiguration_ethernet_rate),
        body("*.configuration.unit")
          .default("Gbps")
          .isIn(OAS.cableEthernetConfigurationRate),
      ],
      {
        message:
          "configuration for single fiber, multi-fiber, coax, copper or ethernet cable must be supplied",
      }
    ),
    body("*.state").isIn(OAS.cableState),
    body("*.point")
      .default(dayjs().format(dayjsFormat))
      .matches(OAS.datePeriodYearMonthDay),
    body("*.source").default("historical").isIn(OAS.source),
    body("*.delete").default(false).isBoolean({ strict: true }),
    addMultipleCables
  );

  /*
       Tag:           Ducts
       operationId:   getAllDuct
       exposed Route: /mni/v1/duct
       HTTP method:   GET
       OpenID Scope:  read:mni_duct
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/duct",
    // security("read:mni_duct"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("pageSize").optional().isInt(OAS.pageSize),
    query("pageNumber").optional().isInt(OAS.pageNumber),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getAllDuct
  );

  /*
       Tag:           Ducts
       operationId:   getDuctsSimpleStatistics
       exposed Route: /mni/v1/ducts/state
       HTTP method:   GET
       OpenID Scope:  read:mni_duct
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/ducts/state",
    // security("read:mni_duct"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getDuctsSimpleStatistics
  );

  /*
       Tag:           Ducts
       operationId:   addSingleDuct
       exposed Route: /mni/v1/duct
       HTTP method:   POST
       OpenID Scope:  write:mni_duct
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/duct",
    // security("write:mni_duct"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("trenchId").isUUID(4),
    body("purpose").isIn(OAS.ductPurpose),
    body("category").isIn(OAS.ductSizeCategory),
    body("configuration").isInt(OAS.ductConfiguration),
    body("state").default("free").isIn(OAS.ductState),
    body("within").optional({ values: "null" }).isUUID(4),
    body("placement").isObject(),
    body("placement.vertical").default(350).isFloat(OAS.placement_vertical),
    body("placement.horizontal")
      .default(1579)
      .isFloat(OAS.placement_horizontal),
    body("placement.unit").default("mm").isIn(OAS.sizeUnit),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    addSingleDuct
  );

  /*
       Tag:           Ducts
       operationId:   getDuctsCapacityState
       exposed Route: /mni/v1/ducts/capacity/state
       HTTP method:   GET
       OpenID Scope:  read:mni_duct
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/ducts/capacity/state",
    // security("read:mni_duct"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("from").optional().matches(OAS.datePeriodYearMonthDay),
    query("to").optional().matches(OAS.datePeriodYearMonthDay),
    query("before").optional().matches(OAS.datePeriodYearMonthDay),
    query("after").optional().matches(OAS.datePeriodYearMonthDay),
    query("aggregate").optional().isString().trim(),
    getDuctsCapacityState
  );

  /*
       Tag:           Ducts
       operationId:   deleteSingleDuct
       exposed Route: /mni/v1/duct/:ductId
       HTTP method:   DELETE
       OpenID Scope:  write:mni_duct
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/duct/:ductId",
    // security("write:mni_duct"),
    param("ductId").isUUID(4),
    oneOf([query("predicted").optional()], [query("restore").optional()], {
      message: "predicted or restore query parameters can not be mixed",
    }),
    deleteSingleDuct
  );

  /*
       Tag:           Ducts
       operationId:   getSingleDuct
       exposed Route: /mni/v1/duct/:ductId
       HTTP method:   GET
       OpenID Scope:  read:mni_duct
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/duct/:ductId",
    // security("read:mni_duct"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("ductId").isUUID(4),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getSingleDuct
  );

  /*
       Tag:           Ducts
       operationId:   getDuctTimeline
       exposed Route: /mni/v1/duct/timeline/:ductId
       HTTP method:   GET
       OpenID Scope:  read:mni_duct
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/duct/timeline/:ductId",
    // security("read:mni_duct"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("ductId").isUUID(4),
    getDuctTimeline
  );

  /*
       Tag:           Ducts
       operationId:   updateSingleDuct
       exposed Route: /mni/v1/duct/:ductId
       HTTP method:   PATCH
       OpenID Scope:  write:mni_duct
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/duct/:ductId",
    // security("write:mni_duct"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("ductId").isUUID(4),
    body("trenchId").optional().isUUID(4),
    body("purpose").optional().isIn(OAS.ductPurpose),
    body("category").optional().isIn(OAS.ductSizeCategory),
    body("configuration").optional().isInt(OAS.ductConfiguration),
    body("state").optional().isIn(OAS.ductState),
    body("within").optional().isUUID(4),
    body("placement").optional().isObject(),
    body("placement.vertical").optional().isFloat(OAS.placement_vertical),
    body("placement.horizontal").optional().isFloat(OAS.placement_horizontal),
    body("placement.unit").optional().isIn(OAS.sizeUnit),
    body("point").optional().matches(OAS.dateTime),
    body("source").optional().isIn(OAS.source),
    body("delete").optional().isBoolean({ strict: true }),
    updateSingleDuct,
    replaceSingleDuct
  );

  /*
       Tag:           Ducts
       operationId:   replaceSingleDuct
       exposed Route: /mni/v1/duct/:ductId
       HTTP method:   PUT
       OpenID Scope:  write:mni_duct
    */
  app.put(
    serveUrlPrefix + serveUrlVersion + "/duct/:ductId",
    // security("write:mni_duct"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("ductId").isUUID(4),
    body("trenchId").isUUID(4),
    body("purpose").isIn(OAS.ductPurpose),
    body("category").isIn(OAS.ductSizeCategory),
    body("configuration").isInt(OAS.ductConfiguration),
    body("state").default("free").isIn(OAS.ductState),
    body("within").optional({ values: "null" }).isUUID(4),
    body("placement").isObject(),
    body("placement.vertical").default(350).isFloat(OAS.placement_vertical),
    body("placement.horizontal")
      .default(1579)
      .isFloat(OAS.placement_horizontal),
    body("placement.unit").default("mm").isIn(OAS.sizeUnit),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    replaceSingleDuct
  );

  /*
       Tag:           Ducts
       operationId:   getMultipleDucts
       exposed Route: /mni/v1/ducts
       HTTP method:   GET
       OpenID Scope:  read:mni_duct
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/ducts",
    // security("read:mni_duct"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMultipleDucts
  );

  /*
       Tag:           Ducts
       operationId:   addMultipleDucts
       exposed Route: /mni/v1/ducts
       HTTP method:   POST
       OpenID Scope:  write:mni_duct
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/ducts",
    // security("write:mni_duct"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body().isArray({ min: 1 }),
    body("*.ductId").isUUID(4),
    body("*.trenchId").isUUID(4),
    body("*.purpose").isIn(OAS.ductPurpose),
    body("*.category").isIn(OAS.ductSizeCategory),
    body("*.configuration").isInt(OAS.ductConfiguration),
    body("*.state").default("free").isIn(OAS.ductState),
    body("*.within").optional({ values: "null" }).isUUID(4),
    body("*.placement").isObject(),
    body("*.placement.vertical").default(350).isFloat(OAS.placement_vertical),
    body("*.placement.horizontal")
      .default(1579)
      .isFloat(OAS.placement_horizontal),
    body("*.placement.unit").default("mm").isIn(OAS.sizeUnit),
    body("*.point")
      .default(dayjs().format(dayjsFormat))
      .matches(OAS.datePeriodYearMonthDay),
    body("*.source").default("historical").isIn(OAS.source),
    body("*.delete").default(false).isBoolean({ strict: true }),
    addMultipleDucts
  );

  /*
       Tag:           Network Equipment
       operationId:   getAllNe
       exposed Route: /mni/v1/ne
       HTTP method:   GET
       OpenID Scope:  read:mni_ne
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/ne",
    // security("read:mni_ne"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("pageSize").optional().isInt(OAS.pageSize),
    query("pageNumber").optional().isInt(OAS.pageNumber),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getAllNe
  );

  /*
       Tag:           Network Equipment
       operationId:   getNesSimpleStatistics
       exposed Route: /mni/v1/nes/state
       HTTP method:   GET
       OpenID Scope:  read:mni_duct
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/nes/state",
    // security("read:mni_ne"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getNesSimpleStatistics
  );

  /*
       Tag:           Network Equipment
       operationId:   addSingleNe
       exposed Route: /mni/v1/ne
       HTTP method:   POST
       OpenID Scope:  write:mni_ne
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/ne",
    // security("write:mni_ne"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("host").isFQDN({ require_tld: false, allow_numeric_tld: true }),
    body("commissioned").matches(OAS.datePeriodYearMonthDay),
    body("decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("siteId").isUUID(4),
    body("rackId").isUUID(4),
    body("slotPosition").isInt(OAS.rackSlots),
    body("mgmtIP").isIP(),
    body("vendor").isString().trim(),
    body("model").isString().trim(),
    body("image").isString().trim(),
    body("version").isString().trim(),
    body("ports").isArray({ min: 1 }),
    body("ports.*.name").isString().isLength(OAS.portName),
    body("ports.*.technology").isIn(OAS.portTechnology),
    body("ports.*.configuration").isObject(),
    oneOf(
      [
        // fiber
        body("ports.*.configuration.rate")
          .default(1)
          .isInt(OAS.portConfiguration_single_fiber_rate),
        body("ports.*.configuration.unit")
          .default("Gbps")
          .isIn(OAS.portFiberConfigurationRate),
        body("ports.*.configuration.mode").isIn(OAS.portFiberConfigurationMode),
        body("ports.*.configuration.channels")
          .default(1)
          .isInt(OAS.portConfiguration_single_fiber_channels),
        body("ports.*.configuration.width")
          .default(1)
          .isInt(OAS.portConfiguration_single_fiber_width),
      ],
      [
        // coax
        body("ports.*.configuration.frequencyRange").isObject(),
        body("ports.*.configuration.frequencyRange.low")
          .default(0.1)
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("ports.*.configuration.frequencyRange.high")
          .default(100000)
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("ports.*.configuration.unit")
          .default("GHz")
          .isIn(OAS.portCoaxConfigurationRate),
        body("ports.*.configuration.width"),
      ],
      [
        // xdsl
        body("ports.*.configuration.category")
          .default("VDSDL2")
          .isIn(OAS.portXdslConfiguration),
        body("ports.*.configuration.rate")
          .default(10)
          .isInt(OAS.portConfiguration_xdsl_rate),
        body("ports.*.configuration.unit")
          .default("Mbps")
          .isIn(OAS.portXdslConfigurationRate),
      ],
      [
        // ethernet
        body("ports.*.configuration.category")
          .default("Cat6A")
          .isIn(OAS.portEthernetConfiguration),
        body("ports.*.configuration.rate")
          .default(10)
          .isInt(OAS.portConfiguration_ethernet_rate),
        body("ports.*.configuration.unit")
          .default("Gbps")
          .isIn(OAS.portEthernetConfigurationRate),
      ],
      [
        // loopback or virtual
        body("ports.*.configuration.rate")
          .default(10)
          .isInt(OAS.portConfiguration_ethernet_rate),
        body("ports.*.configuration.unit")
          .default("Gbps")
          .isIn(OAS.portEthernetConfigurationRate),
      ],
      {
        message:
          "port configuration for fiber, coax, xdsl, ethernet, loopback or virtual must be supplied",
      }
    ),
    body("ports.*.state").isIn(OAS.portState),
    body("ports.*.connectsTo").optional().isObject(),
    oneOf(
      [
        // single fiber
        body("ports.*.connectsTo.cableId").optional().isUUID(4),
        body("ports.*.connectsTo.strand")
          .optional()
          .isInt(OAS.cableConfiguration_single_fiber_strands),
      ],
      [
        // multi-fiber
        body("ports.*.connectsTo.cableId").optional().isUUID(4),
        body("ports.*.connectsTo.ribbon").optional().isInt(OAS.ribbons),
        body("ports.*.connectsTo.strand")
          .optional()
          .isInt(OAS.cableConfiguration_single_fiber_strands),
      ],
      [
        // ethernet, xdsl, coax
        body("ports.*.connectsTo.cableId").optional().isUUID(4),
      ],
      {
        message:
          "port connection to cable for single fiber, multi-fiber, coax, xdsl or ethernet must be supplied",
      }
    ),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    addSingleNe
  );

  /*
       Tag:           Network Equipment
       operationId:   deleteSingleNe
       exposed Route: /mni/v1/ne/:neId
       HTTP method:   DELETE
       OpenID Scope:  write:mni_ne
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/ne/:neId",
    // security("write:mni_ne"),
    param("neId").isUUID(4),
    oneOf([query("predicted").optional()], [query("restore").optional()], {
      message: "predicted or restore query parameters can not be mixed",
    }),
    deleteSingleNe
  );

  /*
       Tag:           Network Equipment
       operationId:   getSingleNe
       exposed Route: /mni/v1/ne/:neId
       HTTP method:   GET
       OpenID Scope:  read:mni_ne
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/ne/:neId",
    // security("read:mni_ne"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("neId").isUUID(4),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getSingleNe
  );

  /*
       Tag:           Network Equipment
       operationId:   getNeTimeline
       exposed Route: /mni/v1/ne/timeline/:neId
       HTTP method:   GET
       OpenID Scope:  read:mni_ne
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/ne/timeline/:neId",
    // security("read:mni_ne"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("neId").isUUID(4),
    getNeTimeline
  );

  /*
       Tag:           Network Equipment
       operationId:   updateSingleNe
       exposed Route: /mni/v1/ne/:neId
       HTTP method:   PATCH
       OpenID Scope:  write:mni_ne
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/ne/:neId",
    // security("write:mni_ne"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("neId").optional().isUUID(4),
    body("host")
      .optional()
      .isFQDN({ require_tld: false, allow_numeric_tld: true }),
    body("commissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("siteId").optional().isUUID(4),
    body("rackId").optional().isUUID(4),
    body("slotPosition").optional().isInt(OAS.rackSlots),
    body("mgmtIP").optional().isIP(),
    body("vendor").optional().isString().trim(),
    body("model").optional().isString().trim(),
    body("image").optional().isString().trim(),
    body("version").optional().isString().trim(),
    body("ports").optional().isArray({ min: 1 }),
    body("ports.*.name").optional().isString().isLength(OAS.portName),
    body("ports.*.technology").optional().isIn(OAS.portTechnology),
    body("ports.*.configuration").optional().isObject(),
    oneOf(
      [
        // fiber
        body("ports.*.configuration.rate")
          .optional()
          .isInt(OAS.portConfiguration_single_fiber_rate),
        body("ports.*.configuration.unit")
          .optional()
          .isIn(OAS.portFiberConfigurationRate),
        body("ports.*.configuration.mode")
          .optional()
          .isIn(OAS.portFiberConfigurationMode),
        body("ports.*.configuration.channels")
          .optional()
          .isInt(OAS.portConfiguration_single_fiber_channels),
        body("ports.*.configuration.width")
          .optional()
          .isInt(OAS.portConfiguration_single_fiber_width),
      ],
      [
        // coax
        body("ports.*.configuration.frequencyRange").optional().isObject(),
        body("ports.*.configuration.frequencyRange.low")
          .optional()
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("ports.*.configuration.frequencyRange.high")
          .optional()
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("ports.*.configuration.unit")
          .optional()
          .isIn(OAS.portCoaxConfigurationRate),
      ],
      [
        // xdsl
        body("ports.*.configuration.category")
          .optional()
          .isIn(OAS.portXdslConfiguration),
        body("ports.*.configuration.rate")
          .optional()
          .isInt(OAS.portConfiguration_xdsl_rate),
        body("ports.*.configuration.unit")
          .optional()
          .isIn(OAS.portXdslConfigurationRate),
      ],
      [
        // ethernet
        body("ports.*.configuration.category")
          .optional()
          .isIn(OAS.portEthernetConfiguration),
        body("ports.*.configuration.rate")
          .optional()
          .isInt(OAS.portConfiguration_ethernet_rate),
        body("ports.*.configuration.unit")
          .optional()
          .isIn(OAS.portEthernetConfigurationRate),
      ],
      [
        // loopback or virtual
        body("ports.*.configuration.rate")
          .optional()
          .isInt(OAS.portConfiguration_ethernet_rate),
        body("ports.*.configuration.unit")
          .optional()
          .isIn(OAS.portEthernetConfigurationRate),
      ],
      {
        message:
          "port configuration for fiber, coax, xdsl, ethernet, loopback or virtual must be supplied",
      }
    ),
    body("ports.*.state").isIn(OAS.portState),
    body("ports.*.connectsTo").optional().isObject(),
    oneOf(
      [
        // single fiber
        body("ports.*.connectsTo.cableId").optional().isUUID(4),
        body("ports.*.connectsTo.strand")
          .optional()
          .isInt(OAS.cableConfiguration_single_fiber_strands),
      ],
      [
        // multi-fiber
        body("ports.*.connectsTo.cableId").optional().isUUID(4),
        body("ports.*.connectsTo.ribbon").optional().isInt(OAS.ribbons),
        body("ports.*.connectsTo.strand")
          .optional()
          .isInt(OAS.cableConfiguration_single_fiber_strands),
      ],
      [
        // ethernet, xdsl, coax
        body("ports.*.connectsTo.cableId").optional().isUUID(4),
      ],
      {
        message:
          "port connection to cable for single fiber, multi-fiber, coax, xdsl or ethernet must be supplied",
      }
    ),
    body("point").optional().matches(OAS.dateTime),
    body("source").optional().isIn(OAS.source),
    body("delete").optional().isBoolean({ strict: true }),
    updateSingleNe,
    replaceSingleNe
  );

  /*
       Tag:           Network Equipment
       operationId:   replaceSingleNe
       exposed Route: /mni/v1/ne/:neId
       HTTP method:   PUT
       OpenID Scope:  write:mni_ne
    */
  app.put(
    serveUrlPrefix + serveUrlVersion + "/ne/:neId",
    // security("write:mni_ne"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("neId").isUUID(4),
    body("host").isFQDN({ require_tld: false, allow_numeric_tld: true }),
    body("commissioned").matches(OAS.datePeriodYearMonthDay),
    body("decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("siteId").isUUID(4),
    body("rackId").isUUID(4),
    body("slotPosition").isInt(OAS.rackSlots),
    body("mgmtIP").isIP(),
    body("vendor").isString().trim(),
    body("model").isString().trim(),
    body("image").isString().trim(),
    body("version").isString().trim(),
    body("ports").isArray({ min: 1 }),
    body("ports.*.name").isString().isLength(OAS.portName),
    body("ports.*.technology").isIn(OAS.portTechnology),
    body("ports.*.configuration").isObject(),
    oneOf(
      [
        // fiber
        body("ports.*.configuration.rate")
          .default(1)
          .isInt(OAS.portConfiguration_single_fiber_rate),
        body("ports.*.configuration.unit")
          .default("Gbps")
          .isIn(OAS.portFiberConfigurationRate),
        body("ports.*.configuration.mode").isIn(OAS.portFiberConfigurationMode),
        body("ports.*.configuration.channels")
          .default(1)
          .isInt(OAS.portConfiguration_single_fiber_channels),
        body("ports.*.configuration.width")
          .default(1)
          .isInt(OAS.portConfiguration_single_fiber_width),
      ],
      [
        // coax
        body("ports.*.configuration.frequencyRange").isObject(),
        body("ports.*.configuration.frequencyRange.low")
          .default(0.1)
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("ports.*.configuration.frequencyRange.high")
          .default(100000)
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("ports.*.configuration.unit").isIn(OAS.portCoaxConfigurationRate),
      ],
      [
        // xdsl
        body("ports.*.configuration.category")
          .default("VDSDL2")
          .isIn(OAS.portXdslConfiguration),
        body("ports.*.configuration.rate")
          .default(10)
          .isInt(OAS.portConfiguration_xdsl_rate),
        body("ports.*.configuration.unit")
          .default("Mbps")
          .isIn(OAS.portXdslConfigurationRate),
      ],
      [
        // ethernet
        body("ports.*.configuration.category")
          .default("Cat6A")
          .isIn(OAS.portEthernetConfiguration),
        body("ports.*.configuration.rate")
          .default(10)
          .isInt(OAS.portConfiguration_ethernet_rate),
        body("ports.*.configuration.unit")
          .default("Gbps")
          .isIn(OAS.portEthernetConfigurationRate),
      ],
      [
        // loopback or virtual
        body("ports.*.configuration.rate")
          .default(10)
          .isInt(OAS.portConfiguration_ethernet_rate),
        body("ports.*.configuration.unit")
          .default("Gbps")
          .isIn(OAS.portEthernetConfigurationRate),
      ],
      {
        message:
          "port configuration for fiber, coax, xdsl, ethernet, loopback or virtual must be supplied",
      }
    ),
    body("ports.*.state").isIn(OAS.portState),
    body("ports.*.connectsTo").optional().isObject(),
    oneOf(
      [
        // single fiber
        body("ports.*.connectsTo.cableId").optional().isUUID(4),
        body("ports.*.connectsTo.strand")
          .optional()
          .isInt(OAS.cableConfiguration_single_fiber_strands),
      ],
      [
        // multi-fiber
        body("ports.*.connectsTo.cableId").optional().isUUID(4),
        body("ports.*.connectsTo.ribbon").optional().isInt(OAS.ribbons),
        body("ports.*.connectsTo.strand")
          .optional()
          .isInt(OAS.cableConfiguration_single_fiber_strands),
      ],
      [
        // ethernet, xdsl, coax
        body("ports.*.connectsTo.cableId").optional().isUUID(4),
      ],
      {
        message:
          "port connection to cable for single fiber, multi-fiber, coax, xdsl or ethernet must be supplied",
      }
    ),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    replaceSingleNe
  );

  /*
       Tag:           Network Equipment
       operationId:   getMultipleNe
       exposed Route: /mni/v1/nes
       HTTP method:   GET
       OpenID Scope:  read:mni_ne
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/nes",
    // security("read:mni_ne"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMultipleNe
  );

  /*
       Tag:           Network Equipment
       operationId:   addMultipleNe
       exposed Route: /mni/v1/nes
       HTTP method:   POST
       OpenID Scope:  write:mni_ne
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/nes",
    // security("write:mni_ne"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body().isArray({ min: 1 }),
    body("*.neId").isUUID(4),
    body("*.host").isFQDN({ require_tld: false, allow_numeric_tld: true }),
    body("*.commissioned").matches(OAS.datePeriodYearMonthDay),
    body("*.decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("*.siteId").isUUID(4),
    body("*.rackId").isUUID(4),
    body("*.slotPosition").isInt({ min: 1, max: 58 }),
    body("*.mgmtIP").isIP(),
    body("*.vendor").isString().trim(),
    body("*.model").isString().trim(),
    body("*.image").isString().trim(),
    body("*.version").isString().trim(),
    body("*.ports").isArray({ min: 1 }),
    body("*.ports.*.name").isString().isLength(OAS.portName),
    body("*.ports.*.technology").isIn(OAS.portTechnology),
    body("*.ports.*.configuration").isObject(),
    oneOf(
      [
        // fiber
        body("*.ports.*.configuration.rate")
          .default(1)
          .isInt(OAS.portConfiguration_single_fiber_rate),
        body("*.ports.*.configuration.unit")
          .default("Gbps")
          .isIn(OAS.portFiberConfigurationRate),
        body("*.ports.*.configuration.mode").isIn(
          OAS.portFiberConfigurationMode
        ),
        body("*.ports.*.configuration.channels")
          .default(1)
          .isInt(OAS.portConfiguration_single_fiber_channels),
        body("*.ports.*.configuration.width")
          .optional()
          .default(1)
          .isInt(OAS.portConfiguration_single_fiber_width),
      ],
      [
        // coax
        body("*.ports.*.configuration.frequencyRange").isObject(),
        body("*.ports.*.configuration.frequencyRange.low")
          .default(0.1)
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("*.ports.*.configuration.frequencyRange.high")
          .default(100000)
          .isFloat(OAS.cableConfiguration_coax_frequency),
        body("*.ports.*.configuration.unit")
          .default("GHz")
          .isIn(OAS.portCoaxConfigurationRate),
      ],
      [
        // xdsl
        body("*.ports.*.configuration.category")
          .default("VDSDL2")
          .isIn(OAS.portXdslConfiguration),
        body("*.ports.*.configuration.rate")
          .default(10)
          .isInt(OAS.portConfiguration_xdsl_rate),
        body("*.ports.*.configuration.unit")
          .default("Mbps")
          .isIn(OAS.portXdslConfigurationRate),
      ],
      [
        // ethernet
        body("*.ports.*.configuration.category")
          .default("Cat6A")
          .isIn(OAS.portEthernetConfiguration),
        body("*.ports.*.configuration.rate")
          .default(10)
          .isInt(OAS.portConfiguration_ethernet_rate),
        body("*.ports.*.configuration.unit")
          .default("Gbps")
          .isIn(OAS.portEthernetConfigurationRate),
      ],
      [
        // loopback or virtual
        body("*.ports.*.configuration.rate")
          .default(10)
          .isInt(OAS.portConfiguration_ethernet_rate),
        body("*.ports.*.configuration.unit")
          .default("Gbps")
          .isIn(OAS.portEthernetConfigurationRate),
      ],
      {
        message:
          "port configuration for fiber, coax, xdsl, ethernet, loopback or virtual must be supplied",
      }
    ),
    body("*.ports.*.state").isIn(OAS.portState),
    body("*.ports.*.connectsTo").optional().isObject(),
    oneOf(
      [
        // single fiber
        body("*.ports.*.connectsTo.cableId").optional().isUUID(4),
        body("*.ports.*.connectsTo.strand")
          .optional()
          .isInt(OAS.cableConfiguration_single_fiber_strands),
      ],
      [
        // multi-fiber
        body("*.ports.*.connectsTo.cableId").optional().isUUID(4),
        body("*.ports.*.connectsTo.ribbon").optional().isInt(OAS.ribbons),
        body("*.ports.*.connectsTo.strand")
          .optional()
          .isInt(OAS.cableConfiguration_single_fiber_strands),
      ],
      [
        // ethernet, xdsl, coax
        body("*.ports.*.connectsTo.cableId").optional().isUUID(4),
      ],
      {
        message:
          "port connection to cable for single fiber, multi-fiber, coax, xdsl or ethernet must be supplied",
      }
    ),
    body("*.point")
      .default(dayjs().format(dayjsFormat))
      .matches(OAS.datePeriodYearMonthDay),
    body("*.source").default("historical").isIn(OAS.source),
    body("*.delete").default(false).isBoolean({ strict: true }),
    addMultipleNe
  );

  /*
       Tag:           Poles
       operationId:   getAllPole
       exposed Route: /mni/v1/pole
       HTTP method:   GET
       OpenID Scope:  read:mni_pole
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/pole",
    // security("read:mni_pole"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("pageSize").optional().isInt(OAS.pageSize),
    query("pageNumber").optional().isInt(OAS.pageNumber),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getAllPole
  );

  /*
       Tag:           Poles
       operationId:   getPolesSimpleStatistics
       exposed Route: /mni/v1/poles/state
       HTTP method:   GET
       OpenID Scope:  read:mni_pole
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/poles/state",
    // security("read:mni_pole"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getPolesSimpleStatistics
  );

  /*
       Tag:           Poles
       operationId:   addSinglePole
       exposed Route: /mni/v1/pole
       HTTP method:   POST
       OpenID Scope:  write:mni_pole
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/pole",
    // security("write:mni_pole"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("purpose").default("unclassified").isIn(OAS.polePurpose),
    body("construction").isObject(),
    body("construction.height").default(20).isFloat(OAS.height),
    body("construction.classifier")
      .default("unclassified")
      .isIn(OAS.heightClassifier),
    body("construction.unit").optional().default("m").isIn(OAS.sizeUnit),
    body("demographics").optional().isObject(),
    body("demographics.premises").optional().isObject(),
    body("demographics.premises.passed")
      .optional()
      .default(0)
      .isInt(OAS.premisesPassed),
    body("demographics.premises.area")
      .optional()
      .default("unclassified")
      .isIn(OAS.areaType),
    body("build").optional().isObject(),
    body("build.jobId").optional().isString().trim(),
    body("build.permitId").optional().isString().trim(),
    body("build.planned").optional().isObject(),
    body("build.planned.start").optional().matches(OAS.datePeriodYearMonthDay),
    body("build.planned.completion")
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.planned.duration").default(0).isInt(OAS.duration),
    body("build.planned.unit").default("day").isIn(OAS.durationUnit),
    body("build.actual").optional().isObject(),
    body("build.actual.start")
      .if(body("build.actual").exists())
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.actual.completion")
      .if(body("build.actual").exists())
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.actual.duration")
      .if(body("build.actual").exists())
      .default(0)
      .isInt(OAS.duration),
    body("build.actual.unit")
      .if(body("build.actual").exists())
      .default("day")
      .isIn(OAS.durationUnit),
    body("state").default("free").isIn(OAS.poleState),
    body("connectsTo").optional().isObject(),
    oneOf(
      [
        // site
        body("connectsTo.siteId").if(body("connectsTo").exists()).isUUID(4),
      ],
      [
        // trench
        body("connectsTo.trenchId").if(body("connectsTo").exists()).isUUID(4),
      ],
      [
        // pole
        body("connectsTo.poleId").if(body("connectsTo").exists()).isUUID(4),
      ],
      {
        message: "either site, trench or pole identifier must be supplied",
      }
    ),
    body("coordinate").isObject(),
    body("coordinate.x").default(0).isFloat(OAS.coordinate_x),
    body("coordinate.y").default(0).isFloat(OAS.coordinate_y),
    body("coordinate.z").default(0).isFloat(OAS.coordinate_z),
    body("coordinate.m").optional().isString().trim(),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    addSinglePole
  );

  /*
       Tag:           Poles
       operationId:   getPolesCapacityState
       exposed Route: /mni/v1/poles/capacity/state
       HTTP method:   GET
       OpenID Scope:  read:mni_pole
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/poles/capacity/state",
    // security("read:mni_pole"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("from").optional().matches(OAS.datePeriodYearMonthDay),
    query("to").optional().matches(OAS.datePeriodYearMonthDay),
    query("before").optional().matches(OAS.datePeriodYearMonthDay),
    query("after").optional().matches(OAS.datePeriodYearMonthDay),
    query("aggregate").optional().isString().trim(),
    getPolesCapacityState
  );

  /*
       Tag:           Poles
       operationId:   deleteSinglePole
       exposed Route: /mni/v1/pole/:poleId
       HTTP method:   DELETE
       OpenID Scope:  write:mni_pole
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/pole/:poleId",
    // security("write:mni_pole"),
    param("poleId").isUUID(4),
    oneOf([query("predicted").optional()], [query("restore").optional()], {
      message: "predicted or restore query parameters can not be mixed",
    }),
    deleteSinglePole
  );

  /*
       Tag:           Poles
       operationId:   getSinglePole
       exposed Route: /mni/v1/pole/:poleId
       HTTP method:   GET
       OpenID Scope:  read:mni_pole
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/pole/:poleId",
    // security("read:mni_pole"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("poleId").isUUID(4),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getSinglePole
  );

  /*
       Tag:           Poles
       operationId:   getPoleTimeline
       exposed Route: /mni/v1/pole/timeline/:neId
       HTTP method:   GET
       OpenID Scope:  read:mni_pole
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/pole/timeline/:poleId",
    // security("read:mni_pole"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("poleId").isUUID(4),
    getPoleTimeline
  );

  /*
       Tag:           Poles
       operationId:   updateSinglePole
       exposed Route: /mni/v1/pole/:poleId
       HTTP method:   PATCH
       OpenID Scope:  write:mni_pole
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/pole/:poleId",
    // security("write:mni_pole"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("poleId").isUUID(4),
    body("purpose").optional().isIn(OAS.polePurpose),
    body("construction").optional().isObject(),
    body("construction.height").optional().isFloat(OAS.height),
    body("construction.classifier").optional().isIn(OAS.heightClassifier),
    body("construction.unit").optional().isIn(OAS.sizeUnit),
    body("demographics").optional().isObject(),
    body("demographics.premises").optional().isObject(),
    body("demographics.premises.passed").optional().isInt(OAS.premisesPassed),
    body("demographics.premises.area").optional().isIn(OAS.areaType),
    body("build").optional().isObject(),
    body("build.jobId").optional().isString().trim(),
    body("build.permitId").optional().isString().trim(),
    body("build.planned").optional().isObject(),
    body("build.planned.start").optional().matches(OAS.datePeriodYearMonthDay),
    body("build.planned.completion")
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.planned.duration").optional().isInt(OAS.duration),
    body("build.planned.unit").optional().isIn(OAS.durationUnit),
    body("build.actual").optional().isObject(),
    body("build.actual.start").optional().matches(OAS.datePeriodYearMonthDay),
    body("build.actual.completion")
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.actual.duration").optional().isInt(OAS.duration),
    body("build.actual.unit").optional().isIn(OAS.durationUnit),
    body("state").optional().isIn(OAS.poleState),
    body("connectsTo").optional().isObject(),
    oneOf(
      [
        // site
        body("connectsTo.siteId").optional().isUUID(4),
      ],
      [
        // trench
        body("connectsTo.trenchId").optional().isUUID(4),
      ],
      [
        // pole
        body("connectsTo.poleId").optional().isUUID(4),
      ],
      {
        message: "either site, trench or pole identifier must be supplied",
      }
    ),
    body("coordinate").optional().isObject(),
    body("coordinate.x").optional().isFloat(OAS.coordinate_x),
    body("coordinate.y").optional().isFloat(OAS.coordinate_y),
    body("coordinate.z").optional().isFloat(OAS.coordinate_z),
    body("coordinate.m").optional().isString().trim(),
    body("point").optional().matches(OAS.dateTime),
    body("source").optional().isIn(OAS.source),
    body("delete").optional().isBoolean({ strict: true }),
    updateSinglePole,
    replaceSinglePole
  );

  /*
       Tag:           Poles
       operationId:   replaceSinglePole
       exposed Route: /mni/v1/pole/:poleId
       HTTP method:   PUT
       OpenID Scope:  write:mni_pole
    */
  app.put(
    serveUrlPrefix + serveUrlVersion + "/pole/:poleId",
    // security("write:mni_pole"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("poleId").isUUID(4),
    body("purpose").default("unclassified").isIn(OAS.polePurpose),
    body("construction").optional().isObject(),
    body("construction.height").optional().default(20).isFloat(OAS.height),
    body("construction.classifier")
      .optional()
      .isIn(OAS.heightClassifier)
      .default("unclassified"),
    body("construction.unit").optional().default("m").isIn(OAS.sizeUnit),
    body("demographics").optional().isObject(),
    body("demographics.premises").optional().isObject(),
    body("demographics.premises.passed").default(0).isInt(OAS.premisesPassed),
    body("demographics.premises.area")
      .default("unclassified")
      .isIn(OAS.areaType),
    body("build").optional().isObject(),
    body("build.jobId").optional().isString().trim(),
    body("build.permitId").optional().isString().trim(),
    body("build.planned").optional().isObject(),
    body("build.planned.start").optional().matches(OAS.datePeriodYearMonthDay),
    body("build.planned.completion")
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.planned.duration").default(0).isInt(OAS.duration),
    body("build.planned.unit").default("day").isIn(OAS.durationUnit),
    body("build.actual").optional().isObject(),
    body("build.actual.start")
      .if(body("build.actual").exists())
      .matches(OAS.datePeriodYearMonthDay),
    body("build.actual.completion")
      .if(body("build.actual").exists())
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.actual.duration")
      .if(body("build.actual").exists())
      .optional()
      .default(0)
      .isInt(OAS.duration),
    body("build.actual.unit")
      .if(body("build.actual").exists())
      .optional()
      .default("day")
      .isIn(OAS.durationUnit),
    body("state").default("free").isIn(OAS.poleState),
    body("connectsTo").optional().isObject(),
    oneOf(
      [
        // site
        body("connectsTo.siteId").if(body("build.actual").exists()).isUUID(4),
      ],
      [
        // trench
        body("connectsTo.trenchId").if(body("build.actual").exists()).isUUID(4),
      ],
      [
        // pole
        body("connectsTo.poleId").if(body("build.actual").exists()).isUUID(4),
      ],
      {
        message: "either site, trench or pole identifier must be supplied",
      }
    ),
    body("coordinate").isObject(),
    body("coordinate.x").default(0).isFloat(OAS.coordinate_x),
    body("coordinate.y").default(0).isFloat(OAS.coordinate_y),
    body("coordinate.z").default(0).isFloat(OAS.coordinate_z),
    body("coordinate.m").optional().isString().trim(),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    replaceSinglePole
  );

  /*
       Tag:           Poles
       operationId:   getMultiplePoles
       exposed Route: /mni/v1/poles
       HTTP method:   GET
       OpenID Scope:  read:mni_pole
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/poles",
    // security("read:mni_pole"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMultiplePoles
  );

  /*
       Tag:           Poles
       operationId:   addMultiplePoles
       exposed Route: /mni/v1/poles
       HTTP method:   POST
       OpenID Scope:  write:mni_pole
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/poles",
    // security("write:mni_pole"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body().isArray({ min: 1 }),
    body("*.poleId").isUUID(4),
    body("*.purpose").default("unclassified").isIn(OAS.polePurpose),
    body("*.construction").isObject(),
    body("*.construction.height").default(0).isFloat(OAS.height),
    body("*.construction.classifier")
      .isIn(OAS.heightClassifier)
      .default("unclassified"),
    body("*.construction.unit").default("m").isIn(OAS.sizeUnit),
    body("*.demographics").optional().isObject(),
    body("*.demographics.premises").optional().isObject(),
    body("*.demographics.premises.passed")
      .optional()
      .default(0)
      .isInt(OAS.premisesPassed),
    body("*.demographics.premises.area")
      .optional()
      .default("unclassified")
      .isIn(OAS.areaType),
    body("*.build").optional().isObject(),
    body("*.build.jobId").optional().isString().trim(),
    body("*.build.permitId").optional().isString().trim(),
    body("*.build.planned").optional().isObject(),
    body("*.build.planned.start")
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("*.build.planned.completion")
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("*.build.planned.duration").default(0).isInt(OAS.duration),
    body("*.build.planned.unit").default("day").isIn(OAS.durationUnit),
    body("*.build.actual").optional().isObject(),
    body("*.build.actual.start")
      .if(body("*.build.actual").exists())
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("*.build.actual.completion")
      .if(body("*.build.actual").exists())
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("*.build.actual.duration")
      .if(body("*.build.actual").exists())
      .default(0)
      .isInt(OAS.duration),
    body("*.build.actual.unit")
      .if(body("*.build.actual").exists())
      .default("day")
      .isIn(OAS.durationUnit),
    body("*.state").default("free").isIn(OAS.poleState),
    body("*.connectsTo").optional().isObject(),
    oneOf(
      [
        // site
        body("*.connectsTo.siteId")
          .optional()
          .if(body("*.connectsTo").exists())
          .isUUID(4),
      ],
      [
        // trench
        body("*.connectsTo.trenchId")
          .optional()
          .if(body("*.connectsTo").exists())
          .isUUID(4),
      ],
      [
        // pole
        body("*.connectsTo.poleId")
          .optional()
          .if(body("*.connectsTo").exists())
          .isUUID(4),
      ],
      {
        message: "either site, trench or pole identifier must be supplied",
      }
    ),
    body("*.coordinate").isObject(),
    body("*.coordinate.x").default(0).isFloat(OAS.coordinate_x),
    body("*.coordinate.y").default(0).isFloat(OAS.coordinate_y),
    body("*.coordinate.z").default(0).isFloat(OAS.coordinate_z),
    body("*.coordinate.m").optional().isString().trim(),
    body("*.point")
      .default(dayjs().format(dayjsFormat))
      .matches(OAS.datePeriodYearMonthDay),
    body("*.source").default("historical").isIn(OAS.source),
    body("*.delete").default(false).isBoolean({ strict: true }),
    addMultiplePoles
  );

  /*
       Tag:           Racks
       operationId:   getAllRacks
       exposed Route: /mni/v1/rack
       HTTP method:   GET
       OpenID Scope:  read:mni_rack
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/rack",
    // security("read:mni_rack"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("pageSize").optional().isInt(OAS.pageSize),
    query("pageNumber").optional().isInt(OAS.pageNumber),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getAllRacks
  );

  /*
       Tag:           Racks
       operationId:   getRackTimeline
       exposed Route: /mni/v1/rack/timeline/:rackId
       HTTP method:   GET
       OpenID Scope:  read:mni_rack
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/rack/timeline/:rackId",
    // security("read:mni_rack"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("rackId").isUUID(4),
    getRackTimeline
  );

  /*
       Tag:           Racks
       operationId:   getRacksSimpleStatistics
       exposed Route: /mni/v1/racks/state
       HTTP method:   GET
       OpenID Scope:  read:mni_rack
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/racks/state",
    // security("read:mni_rack"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getRacksSimpleStatistics
  );

  /*
       Tag:           Racks
       operationId:   addSingleRack
       exposed Route: /mni/v1/rack
       HTTP method:   POST
       OpenID Scope:  write:mni_rack
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/rack",
    // security("write:mni_rack"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("reference").isString().trim(),
    body("commissioned").matches(OAS.datePeriodYearMonthDay),
    body("decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("siteId").isUUID(4),
    body("floor").optional().isInt(OAS.rack_floor),
    body("area").optional().isString().trim(),
    body("row").optional().isInt(OAS.rack_row),
    body("column").optional().isInt(OAS.rack_column),
    body("coordinate").isObject(),
    body("coordinate.x").default(0).isFloat(OAS.coordinate_x),
    body("coordinate.y").default(0).isFloat(OAS.coordinate_y),
    body("coordinate.z").default(0).isFloat(OAS.coordinate_z),
    body("coordinate.m").optional().isString().trim(),
    body("dimensions").isObject(),
    body("dimensions.depth").default(914.4).isFloat(OAS.rack_dimension),
    body("dimensions.height").default(2000).isFloat(OAS.rack_dimension),
    body("dimensions.width").default(600).isFloat(OAS.rack_dimension),
    body("dimensions.unit").default("mm").isIn(OAS.sizeUnit),
    body("slots").isObject(),
    body("slots.total").default(42).isInt(OAS.rackSlots),
    body("slots.free").default(0).isInt(OAS.rackSlots_u),
    body("slots.used").default(0).isInt(OAS.rackSlots_u),
    body("slots.reserved").default(0).isInt(OAS.rackSlots_u),
    body("slots.faulty").default(0).isInt(OAS.rackSlots_u),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    addSingleRack
  );

  /*
       Tag:           Racks
       operationId:   deleteSingleRack
       exposed Route: /mni/v1/rack/:rackId
       HTTP method:   DELETE
       OpenID Scope:  write:mni_rack
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/rack/:rackId",
    // security("write:mni_rack"),
    param("rackId").isUUID(4),
    oneOf([query("predicted").optional()], [query("restore").optional()], {
      message: "predicted or restore query parameters can not be mixed",
    }),
    deleteSingleRack
  );

  /*
       Tag:           Racks
       operationId:   getSingleRack
       exposed Route: /mni/v1/rack/:rackId
       HTTP method:   GET
       OpenID Scope:  read:mni_rack
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/rack/:rackId",
    // security("read:mni_rack"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("rackId").isUUID(4),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getSingleRack
  );

  /*
       Tag:           Racks
       operationId:   updateSingleRack
       exposed Route: /mni/v1/rack/:rackId
       HTTP method:   PATCH
       OpenID Scope:  write:mni_rack
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/rack/:rackId",
    // security("write:mni_rack"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("rackId").optional().isUUID(4),
    body("reference").optional().isString().trim(),
    body("commissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("siteId").optional().isUUID(4),
    body("floor").optional().isInt(OAS.rack_floor),
    body("area").optional().isString().trim(),
    body("row").optional().isInt(OAS.rack_row),
    body("column").optional().isInt(OAS.rack_column),
    body("coordinate").optional().isObject(),
    body("coordinate.x").optional().isFloat(OAS.coordinate_x),
    body("coordinate.y").optional().isFloat(OAS.coordinate_y),
    body("coordinate.z").optional().isFloat(OAS.coordinate_z),
    body("coordinate.m").optional().isString().trim(),
    body("dimensions").optional().isObject(),
    body("dimensions.depth").optional().isFloat(OAS.rack_dimension),
    body("dimensions.height").optional().isFloat(OAS.rack_dimension),
    body("dimensions.width").optional().isFloat(OAS.rack_dimension),
    body("dimensions.unit").optional().isIn(OAS.sizeUnit),
    body("slots").optional().isObject(),
    body("slots.total").optional().isInt(OAS.rackSlots),
    body("slots.free").optional().isInt(OAS.rackSlots_u),
    body("slots.used").optional().isInt(OAS.rackSlots_u),
    body("slots.reserved").optional().isInt(OAS.rackSlots_u),
    body("slots.faulty").optional().isInt(OAS.rackSlots_u),
    body("point").optional().matches(OAS.dateTime),
    body("source").optional().isIn(OAS.source),
    body("delete").optional().isBoolean({ strict: true }),
    updateSingleRack,
    replaceSingleRack
  );

  /*
       Tag:           Racks
       operationId:   replaceSingleRack
       exposed Route: /mni/v1/rack/:rackId
       HTTP method:   PUT
       OpenID Scope:  write:mni_rack
    */
  app.put(
    serveUrlPrefix + serveUrlVersion + "/rack/:rackId",
    // security("write:mni_rack"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("rackId").isUUID(4),
    body("reference").isString().trim(),
    body("commissioned").matches(OAS.datePeriodYearMonthDay),
    body("decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("siteId").isUUID(4),
    body("floor").optional().isInt(OAS.rack_floor),
    body("area").optional().isString().trim(),
    body("row").optional().isInt(OAS.rack_row),
    body("column").optional().isInt(OAS.rack_column),
    body("coordinate").isObject(),
    body("coordinate.x").default(0).isFloat(OAS.coordinate_x),
    body("coordinate.y").default(0).isFloat(OAS.coordinate_y),
    body("coordinate.z").default(0).isFloat(OAS.coordinate_z),
    body("coordinate.m").optional().isString().trim(),
    body("dimensions").isObject(),
    body("dimensions.depth").default(914.4).isFloat(OAS.rack_dimension),
    body("dimensions.height").default(2000).isFloat(OAS.rack_dimension),
    body("dimensions.width").default(600).isFloat(OAS.rack_dimension),
    body("dimensions.unit").default("mm").isIn(OAS.sizeUnit),
    body("slots").isObject(),
    body("slots.total").default(42).isInt(OAS.rackSlots),
    body("slots.free").default(0).isInt(OAS.rackSlots_u),
    body("slots.used").default(0).isInt(OAS.rackSlots_u),
    body("slots.reserved").default(0).isInt(OAS.rackSlots_u),
    body("slots.faulty").default(0).isInt(OAS.rackSlots_u),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    replaceSingleRack
  );

  /*
       Tag:           Racks
       operationId:   getMultipleRacks
       exposed Route: /mni/v1/racks
       HTTP method:   GET
       OpenID Scope:  read:mni_rack
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/racks",
    // security("read:mni_rack"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMultipleRacks
  );

  /*
       Tag:           Racks
       operationId:   addMultipleRacks
       exposed Route: /mni/v1/racks
       HTTP method:   POST
       OpenID Scope:  write:mni_rack
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/racks",
    // security("write:mni_rack"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body().isArray({ min: 1 }),
    body("*.rackId").isUUID(4),
    body("*.reference").isString().trim(),
    body("*.commissioned").matches(OAS.datePeriodYearMonthDay),
    body("*.decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("*.siteId").isUUID(4),
    body("*.floor").optional().isInt(OAS.rack_floor),
    body("*.area").optional().isString().trim(),
    body("*.row").optional().isInt(OAS.rack_row),
    body("*.column").optional().isInt(OAS.rack_column),
    body("*.coordinate").isObject(),
    body("*.coordinate.x").default(0).isFloat(OAS.coordinate_x),
    body("*.coordinate.y").default(0).isFloat(OAS.coordinate_y),
    body("*.coordinate.z").default(0).isFloat(OAS.coordinate_z),
    body("*.coordinate.m").optional().isString().trim(),
    body("*.dimensions").isObject(),
    body("*.dimensions.depth").default(914.4).isFloat(OAS.rack_dimension),
    body("*.dimensions.height").default(2000).isFloat(OAS.rack_dimension),
    body("*.dimensions.width").default(600).isFloat(OAS.rack_dimension),
    body("*.dimensions.unit").default("mm").isIn(OAS.sizeUnit),
    body("*.slots").isObject(),
    body("*.slots.total").default(42).isInt(OAS.rackSlots),
    body("*.slots.free").default(0).isInt(OAS.rackSlots_u),
    body("*.slots.used").default(0).isInt(OAS.rackSlots_u),
    body("*.slots.reserved").default(0).isInt(OAS.rackSlots_u),
    body("*.slots.faulty").default(0).isInt(OAS.rackSlots_u),
    body("*.point")
      .default(dayjs().format(dayjsFormat))
      .matches(OAS.datePeriodYearMonthDay),
    body("*.source").default("historical").isIn(OAS.source),
    body("*.delete").default(false).isBoolean({ strict: true }),
    addMultipleRacks
  );

  /*
       Tag:           Services
       operationId:   getAllServices
       exposed Route: /mni/v1/service
       HTTP method:   GET
       OpenID Scope:  read:mni_service
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/service",
    // security("read:mni_service"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getAllServices
  );

  /*
       Tag:           Services
       operationId:   getServicesSimpleStatistics
       exposed Route: /mni/v1/services/state
       HTTP method:   GET
       OpenID Scope:  read:mni_service
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/services/state",
    // security("read:mni_service"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getServicesSimpleStatistics
  );

  /*
       Tag:           Services
       operationId:   addSingleService
       exposed Route: /mni/v1/service
       HTTP method:   POST
       OpenID Scope:  write:mni_service
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/service",
    // security("write:mni_service"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("reference").isString().trim(),
    body("commissioned").matches(OAS.datePeriodYearMonthDay),
    body("decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("lag").optional().isObject(),
    body("lag.group").optional().isString().trim(),
    body("lag.members").optional().isInt(OAS.lag_members),
    body("link").isObject(),
    body("link.ingress").isArray({ min: 1 }),
    body("link.ingress.*.neId").isUUID(4),
    body("link.ingress.*.port").isString().isLength(OAS.portName),
    body("link.ingress.*.cVlanId").default(0).isInt(OAS.vlanId),
    body("link.ingress.*.sVlanId").default(0).isInt(OAS.vlanId),
    body("link.ingress.*.member").optional().isInt(OAS.lag_members),
    body("link.egress").isArray({ min: 1 }),
    body("link.egress.*.neId").isUUID(4),
    body("link.egress.*.port").isString().isLength(OAS.portName),
    body("link.egress.*.cVlanId").default(0).isInt(OAS.vlanId),
    body("link.egress.*.sVlanId").default(0).isInt(OAS.vlanId),
    body("link.egress.*.member").optional().isInt(OAS.lag_members),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    addSingleService
  );

  /*
       Tag:           Services
       operationId:   deleteSingleService
       exposed Route: /mni/v1/service/:serviceId
       HTTP method:   DELETE
       OpenID Scope:  write:mni_service
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/service/:serviceId",
    // security("write:mni_service"),
    param("serviceId").isUUID(4),
    oneOf([query("predicted").optional()], [query("restore").optional()], {
      message: "predicted or restore query parameters can not be mixed",
    }),
    deleteSingleService
  );

  /*
       Tag:           Services
       operationId:   getSingleService
       exposed Route: /mni/v1/service/:serviceId
       HTTP method:   GET
       OpenID Scope:  read:mni_service
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/service/:serviceId",
    // security("read:mni_service"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("serviceId").isUUID(4),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getSingleService
  );

  /*
       Tag:           Services
       operationId:   getServiceTimeline
       exposed Route: /mni/v1/service/timeline/:serviceId
       HTTP method:   GET
       OpenID Scope:  read:mni_service
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/service/timeline/:serviceId",
    // security("read:mni_service"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("serviceId").isUUID(4),
    getServiceTimeline
  );

  /*
       Tag:           Services
       operationId:   updateSingleService
       exposed Route: /mni/v1/service/:serviceId
       HTTP method:   PATCH
       OpenID Scope:  write:mni_service
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/service/:serviceId",
    // security("write:mni_service"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("serviceId").isUUID(4),
    body("reference").optional().isString().trim(),
    body("commissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("lag").optional().isObject(),
    body("lag.group").optional().isString().trim(),
    body("lag.members").optional().isInt(OAS.lag_members),
    body("link").optional().isObject(),
    body("link.ingress").optional().isArray({ min: 1 }),
    body("link.ingress.*.neId").optional().isUUID(4),
    body("link.ingress.*.port").optional().isString().isLength(OAS.portName),
    body("link.ingress.*.cVlanId").optional().isInt(OAS.vlanId),
    body("link.ingress.*.sVlanId").optional().isInt(OAS.vlanId),
    body("link.ingress.*.member").optional().isInt(OAS.lag_members),
    body("link.egress").optional().isArray({ min: 1 }),
    body("link.egress.*.neId").optional().isUUID(4),
    body("link.egress.*.port").optional().isString().isLength(OAS.portName),
    body("link.egress.*.cVlanId").optional().isInt(OAS.vlanId),
    body("link.egress.*.sVlanId").optional().isInt(OAS.vlanId),
    body("link.egress.*.member").optional().isInt(OAS.lag_members),
    body("point").optional().matches(OAS.dateTime),
    body("source").optional().isIn(OAS.source),
    body("delete").optional().isBoolean({ strict: true }),
    updateSingleService,
    replaceSingleService
  );

  /*
       Tag:           Services
       operationId:   replaceSingleService
       exposed Route: /mni/v1/service/:serviceId
       HTTP method:   PUT
       OpenID Scope:  write:mni_service
    */
  app.put(
    serveUrlPrefix + serveUrlVersion + "/service/:serviceId",
    // security("write:mni_service"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("serviceId").isUUID(4),
    body("reference").isString().trim(),
    body("commissioned").matches(OAS.datePeriodYearMonthDay),
    body("decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("lag").optional().isObject(),
    body("lag.group").optional().isString().trim(),
    body("lag.members").optional().isInt(OAS.lag_members),
    body("link").isObject(),
    body("link.ingress").isArray({ min: 1 }),
    body("link.ingress.*.neId").isUUID(4),
    body("link.ingress.*.port").isString().isLength(OAS.portName),
    body("link.ingress.*.cVlanId").default(0).isInt(OAS.vlanId),
    body("link.ingress.*.sVlanId").default(0).isInt(OAS.vlanId),
    body("link.ingress.*.member").optional().isInt(OAS.lag_members),
    body("link.egress").isArray({ min: 1 }),
    body("link.egress.*.neId").isUUID(4),
    body("link.egress.*.port").isString().isLength(OAS.portName),
    body("link.egress.*.cVlanId").default(0).isInt(OAS.vlanId),
    body("link.egress.*.sVlanId").default(0).isInt(OAS.vlanId),
    body("link.egress.*.member").optional().isInt(OAS.lag_members),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    replaceSingleService
  );

  /*
       Tag:           Services
       operationId:   getMultipleServices
       exposed Route: /mni/v1/services
       HTTP method:   GET
       OpenID Scope:  read:mni_service
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/services",
    // security("read:mni_service"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMultipleServices
  );

  /*
       Tag:           Services
       operationId:   addMultipleServices
       exposed Route: /mni/v1/services
       HTTP method:   POST
       OpenID Scope:  write:mni_service
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/services",
    // security("write:mni_service"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body().isArray({ min: 1 }),
    body("*.serviceId").isUUID(4),
    body("*.reference").isString().trim(),
    body("*.commissioned").matches(OAS.datePeriodYearMonthDay),
    body("*.decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("*.lag").optional().isObject(),
    body("*.lag.group").optional().isString().trim(),
    body("*.lag.members").optional().isInt(OAS.lag_members),
    body("*.link").isObject(),
    body("*.link.ingress").isArray({ min: 1 }),
    body("*.link.ingress.*.neId").isUUID(4),
    body("*.link.ingress.*.port").isString().isLength(OAS.portName),
    body("*.link.ingress.*.cVlanId").default(0).isInt(OAS.vlanId),
    body("*.link.ingress.*.sVlanId").default(0).isInt(OAS.vlanId),
    body("*.link.ingress.*.member").optional().isInt(OAS.lag_members),
    body("*.link.egress").isArray({ min: 1 }),
    body("*.link.egress.*.neId").isUUID(4),
    body("*.link.egress.*.port").isString().isLength(OAS.portName),
    body("*.link.egress.*.cVlanId").default(0).isInt(OAS.vlanId),
    body("*.link.egress.*.sVlanId").default(0).isInt(OAS.vlanId),
    body("*.link.egress.*.member").optional().isInt(OAS.lag_members),
    body("*.point")
      .default(dayjs().format(dayjsFormat))
      .matches(OAS.datePeriodYearMonthDay),
    body("*.source").default("historical").isIn(OAS.source),
    body("*.delete").default(false).isBoolean({ strict: true }),
    addMultipleServices
  );

  /*
       Tag:           Sites
       operationId:   getAllSites
       exposed Route: /mni/v1/site
       HTTP method:   GET
       OpenID Scope:  read:mni_site
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/site",
    // security("read:mni_site"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("pageSize").optional().isInt(OAS.pageSize),
    query("pageNumber").optional().isInt(OAS.pageNumber),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getAllSites
  );

  /*
       Tag:           Sites
       operationId:   getAllSitesOnNet
       exposed Route: /mni/v1/site/onnet
       HTTP method:   GET
       OpenID Scope:  read:mni_site
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/site/onnet",
    // security("read:mni_site"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("pageSize").optional().isInt(OAS.pageSize),
    query("pageNumber").optional().isInt(OAS.pageNumber),
    getAllSitesOnNet
  );

  /*
       Tag:           Sites
       operationId:   getAllSitesOffNet
       exposed Route: /mni/v1/site/offnet
       HTTP method:   GET
       OpenID Scope:  read:mni_site
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/site/offnet",
    // security("read:mni_site"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("pageSize").optional().isInt(OAS.pageSize),
    query("pageNumber").optional().isInt(OAS.pageNumber),
    getAllSitesOffNet
  );

  /*
       Tag:           Sites
       operationId:   getSitesSimpleStatistics
       exposed Route: /mni/v1/sites/state
       HTTP method:   GET
       OpenID Scope:  read:mni_site
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/sites/state",
    // security("read:mni_site"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getSitesSimpleStatistics
  );

  /*
       Tag:           Sites
       operationId:   addSingleSite
       exposed Route: /mni/v1/site
       HTTP method:   POST
       OpenID Scope:  write:mni_site
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/site",
    // security("write:mni_site"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("reference").isString().trim(),
    body("commissioned").matches(OAS.datePeriodYearMonthDay),
    body("decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("onNet").default(false).isBoolean({ strict: true }),
    body("area").default("unclassified").isIn(OAS.areaType),
    body("type").default("unclassified").isIn(OAS.siteType),
    body("location").isObject(),
    body("location.country").isIn(OAS.countryCode),
    body("location.region").isString().trim(),
    body("location.town").isString().trim(),
    body("location.district").optional().isString().trim(),
    body("location.street").isString().trim(),
    body("location.premisesNameNumber").isString().trim(),
    body("location.postalCode").isString().trim(),
    body("location.coordinate").isObject(),
    body("location.coordinate.x").default(0).isFloat(OAS.coordinate_x),
    body("location.coordinate.y").default(0).isFloat(OAS.coordinate_y),
    body("location.coordinate.z").default(0).isFloat(OAS.coordinate_z),
    body("location.coordinate.m").optional().isString().trim(),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    addSingleSite
  );

  /*
       Tag:           Sites
       operationId:   deleteSingleSite
       exposed Route: /mni/v1/site/:siteId
       HTTP method:   DELETE
       OpenID Scope:  write:mni_site
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/site/:siteId",
    // security("write:mni_site"),
    param("siteId").isUUID(4),
    oneOf([query("predicted").optional()], [query("restore").optional()], {
      message: "predicted or restore query parameters can not be mixed",
    }),
    deleteSingleSite
  );

  /*
       Tag:           Sites
       operationId:   getSingleSite
       exposed Route: /mni/v1/site/:siteId
       HTTP method:   GET
       OpenID Scope:  read:mni_site
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/site/:siteId",
    // security("read:mni_site"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("siteId").isUUID(4),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getSingleSite
  );

  /*
       Tag:           Sites
       operationId:   getSiteTimeline
       exposed Route: /mni/v1/site/timeline/:siteId
       HTTP method:   GET
       OpenID Scope:  read:mni_site
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/site/timeline/:siteId",
    // security("read:mni_site"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("siteId").isUUID(4),
    getSiteTimeline
  );

  /*
       Tag:           Sites
       operationId:   updateSingleSite
       exposed Route: /mni/v1/site/:siteId
       HTTP method:   PATCH
       OpenID Scope:  write:mni_site
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/site/:siteId",
    // security("write:mni_site"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("siteId").isUUID(4),
    body("reference").optional().isString().trim(),
    body("commissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("onNet").optional().isBoolean({ strict: true }),
    body("area").optional().isIn(OAS.areaType),
    body("type").optional().isIn(OAS.siteType),
    body("location").optional().isObject(),
    body("location.country").optional().isIn(OAS.countryCode),
    body("location.region").optional().isString().trim(),
    body("location.town").optional().isString().trim(),
    body("location.district").optional().isString().trim(),
    body("location.street").optional().isString().trim(),
    body("location.premisesNameNumber").optional().isString().trim(),
    body("location.postalCode").optional().isString().trim(),
    body("location.coordinate").optional().isObject(),
    body("location.coordinate.x").optional().isFloat(OAS.coordinate_x),
    body("location.coordinate.y").optional().isFloat(OAS.coordinate_y),
    body("location.coordinate.z").optional().isFloat(OAS.coordinate_z),
    body("location.coordinate.m").optional().isString().trim(),
    body("point").optional().matches(OAS.dateTime),
    body("source").optional().isIn(OAS.source),
    body("delete").optional().isBoolean({ strict: true }),
    updateSingleSite,
    replaceSingleSite
  );

  /*
       Tag:           Sites
       operationId:   replaceSingleSite
       exposed Route: /mni/v1/site/:siteId
       HTTP method:   PUT
       OpenID Scope:  write:mni_site
    */
  app.put(
    serveUrlPrefix + serveUrlVersion + "/site/:siteId",
    // security("write:mni_site"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("siteId").isUUID(4),
    body("reference").isString().trim(),
    body("commissioned").matches(OAS.datePeriodYearMonthDay),
    body("decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("onNet").default(false).isBoolean({ strict: true }),
    body("area").default("unclassified").isIn(OAS.areaType),
    body("type").default("unclassified").isIn(OAS.siteType),
    body("location").isObject(),
    body("location.country").isIn(OAS.countryCode),
    body("location.region").isString().trim(),
    body("location.town").isString().trim(),
    body("location.district").optional().isString().trim(),
    body("location.street").isString().trim(),
    body("location.premisesNameNumber").isString().trim(),
    body("location.postalCode").isString().trim(),
    body("location.coordinate").isObject(),
    body("location.coordinate.x").default(0).isFloat(OAS.coordinate_x),
    body("location.coordinate.y").default(0).isFloat(OAS.coordinate_y),
    body("location.coordinate.z").default(0).isFloat(OAS.coordinate_z),
    body("location.coordinate.m").optional().isString().trim(),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    replaceSingleSite
  );

  /*
       Tag:           Sites
       operationId:   getMultipleSites
       exposed Route: /mni/v1/sites
       HTTP method:   GET
       OpenID Scope:  read:mni_site
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/sites",
    // security("read:mni_site"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMultipleSites
  );

  /*
       Tag:           Sites
       operationId:   addMultipleSites
       exposed Route: /mni/v1/sites
       HTTP method:   POST
       OpenID Scope:  write:mni_site
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/sites",
    // security("write:mni_site"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body().isArray({ min: 1 }),
    body("*.siteId").isUUID(4),
    body("*.reference").isString().trim(),
    body("*.commissioned").matches(OAS.datePeriodYearMonthDay),
    body("*.decommissioned").optional().matches(OAS.datePeriodYearMonthDay),
    body("*.onNet").default(false).isBoolean({ strict: true }),
    body("*.area").default("unclassified").isIn(OAS.areaType),
    body("*.type").default("unclassified").isIn(OAS.siteType),
    body("*.location").isObject(),
    body("*.location.country").isIn(OAS.countryCode),
    body("*.location.region").isString().trim(),
    body("*.location.town").isString().trim(),
    body("*.location.district").optional().isString().trim(),
    body("*.location.street").isString().trim(),
    body("*.location.premisesNameNumber").isString().trim(),
    body("*.location.postalCode").isString().trim(),
    body("*.location.coordinate").isObject(),
    body("*.location.coordinate.x").default(0).isFloat(OAS.coordinate_x),
    body("*.location.coordinate.y").default(0).isFloat(OAS.coordinate_y),
    body("*.location.coordinate.z").default(0).isFloat(OAS.coordinate_z),
    body("*.location.coordinate.m").optional().isString().trim(),
    body("*.point")
      .default(dayjs().format(dayjsFormat))
      .matches(OAS.datePeriodYearMonthDay),
    body("*.source").default("historical").isIn(OAS.source),
    body("*.delete").default(false).isBoolean({ strict: true }),
    addMultipleSites
  );

  /*
       Tag:           Sites
       operationId:   distanceSites
       exposed Route: /mni/v1/sites/distance
       HTTP method:   POST
       OpenID Scope:  write:mni_site
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/sites",
    // security("read:mni_site"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("from").isUUID(4),
    param("to").isUUID(4),
    distanceSites
  );

  /*
       Tag:           Trenches
       operationId:   getAllTrench
       exposed Route: /mni/v1/trench
       HTTP method:   GET
       OpenID Scope:  read:mni_trench
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/trench",
    // security("read:mni_trench"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("pageSize").optional().isInt(OAS.pageSize),
    query("pageNumber").optional().isInt(OAS.pageNumber),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getAllTrench
  );

  /*
       Tag:           Trenches
       operationId:   getTrenchesSimpleStatistics
       exposed Route: /mni/v1/trenchs/state
       HTTP method:   GET
       OpenID Scope:  read:mni_trench
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/trenches/state",
    // security("read:mni_trench"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getTrenchesSimpleStatistics
  );

  /*
       Tag:           Trenches
       operationId:   addSingleTrench
       exposed Route: /mni/v1/trench
       HTTP method:   POST
       OpenID Scope:  write:mni_trench
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/trench",
    // security("write:mni_trench"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body("purpose").isIn(OAS.trenchPurpose),
    body("construction").isObject(),
    body("construction.depth")
      .default(914.4)
      .isFloat({ min: 0, max: Number.MAX_VALUE }),
    body("construction.classifier").isIn(OAS.depthClassifier),
    body("construction.unit").default("mm").isIn(OAS.sizeUnit),
    body("construction.type").isIn(OAS.constructionType),
    body("demographics").isObject(),
    body("demographics.premises").isObject(),
    body("demographics.premises.passed").default(0).isInt(OAS.premisesPassed),
    body("demographics.premises.area")
      .default("unclassified")
      .isIn(OAS.areaType),
    body("build").isObject(),
    body("build.jobId").optional().isString().trim(),
    body("build.permitId").optional().isString().trim(),
    body("build.planned").optional().isObject(),
    body("build.planned.start").optional().matches(OAS.datePeriodYearMonthDay),
    body("build.planned.completion")
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.planned.duration").default(0).isInt(OAS.duration),
    body("build.planned.unit").default("day").isIn(OAS.durationUnit),
    body("build.actual").optional().isObject(),
    body("build.actual.start")
      .if(body("build.actual").exists())
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.actual.completion")
      .if(body("build.actual").exists())
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.actual.duration")
      .if(body("build.actual").exists())
      .default(0)
      .isInt(OAS.duration),
    body("build.actual.unit")
      .if(body("build.actual").exists())
      .default("day")
      .isIn(OAS.durationUnit),
    body("state").default("free").isIn(OAS.trenchState),
    body("connectsTo").optional().isObject(),
    oneOf(
      [
        // site
        body("connectsTo.siteId").if(body("connectsTo").exists()).isUUID(4),
      ],
      [
        // trench
        body("connectsTo.trenchId").if(body("connectsTo").exists()).isUUID(4),
      ],
      [
        // pole
        body("connectsTo.poleId").if(body("connectsTo").exists()).isUUID(4),
      ],
      {
        message: "either site, trench or pole identifier must be supplied",
      }
    ),
    body("coordinates").isArray({ min: 1 }),
    body("coordinates.*.x").default(0).isFloat(OAS.coordinate_x),
    body("coordinates.*.y").default(0).isFloat(OAS.coordinate_y),
    body("coordinates.*.z").default(0).isFloat(OAS.coordinate_z),
    body("coordinates.*.m").optional().isString().trim(),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    addSingleTrench
  );

  /*
       Tag:           Trenches
       operationId:   getTrenchesCapacityState
       exposed Route: /mni/v1/trenches/capacity/state
       HTTP method:   GET
       OpenID Scope:  read:mni_trench
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/trenches/capacity/state",
    // security("read:mni_trench"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    query("from").optional().matches(OAS.datePeriodYearMonthDay),
    query("to").optional().matches(OAS.datePeriodYearMonthDay),
    query("before").optional().matches(OAS.datePeriodYearMonthDay),
    query("after").optional().matches(OAS.datePeriodYearMonthDay),
    query("aggregate").optional().isString().trim(),
    getTrenchesCapacityState
  );

  /*
       Tag:           Trenches
       operationId:   deleteSingleTrench
       exposed Route: /mni/v1/trench/:trenchId
       HTTP method:   DELETE
       OpenID Scope:  write:mni_trench
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/trench/:trenchId",
    // security("write:mni_trench"),
    param("trenchId").isUUID(4),
    oneOf([query("predicted").optional()], [query("restore").optional()], {
      message: "predicted or restore query parameters can not be mixed",
    }),
    deleteSingleTrench
  );

  /*
       Tag:           Trenches
       operationId:   getSingleTrench
       exposed Route: /mni/v1/trench/:trenchId
       HTTP method:   GET
       OpenID Scope:  read:mni_trench
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/trench/:trenchId",
    // security("read:mni_trench"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("trenchId").isUUID(4),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getSingleTrench
  );

  /*
       Tag:           Trenches
       operationId:   getTrenchPremisesPassed
       exposed Route: /mni/v1/trench/premises/:trenchId
       HTTP method:   GET
       OpenID Scope:  read:mni_trench
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/trench/premisesPassed/:trenchId",
    // security("read:mni_trench"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("trenchId").isUUID(4),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getTrenchPremisesPassed
  );

  /*
       Tag:           Trenches
       operationId:   getTrenchGeometry
       exposed Route: /mni/v1/trench/geometry/:trenchId
       HTTP method:   GET
       OpenID Scope:  read:mni_trench
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/trench/geometry/:trenchId",
    // security("read:mni_trench"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("trenchId").isUUID(4),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getTrenchGeometry
  );

  /*
       Tag:           Trenches
       operationId:   getTrenchGeometryLifetime
       exposed Route: /mni/v1/trench/geometry/lifetime/:trenchId
       HTTP method:   GET
       OpenID Scope:  read:mni_trench
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/trench/geometry/lifetime/:trenchId",
    // security("read:mni_trench"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("trenchId").isUUID(4),
    getTrenchGeometryLifetime
  );

  /*
       Tag:           Trenches
       operationId:   getTrenchDistance
       exposed Route: /mni/v1/trench/distance/:trenchId
       HTTP method:   GET
       OpenID Scope:  read:mni_trench
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/trench/distance/:trenchId",
    // security("read:mni_trench"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("trenchId").isUUID(4),
    query("point").optional().matches(OAS.datePeriodYearMonthDay),
    getTrenchDistance
  );

  /*
       Tag:           Trenches
       operationId:   getTrenchTimeline
       exposed Route: /mni/v1/trench/timeline/:trenchId
       HTTP method:   GET
       OpenID Scope:  read:mni_trench
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/trench/timeline/:trenchId",
    // security("read:mni_trench"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    param("trenchId").isUUID(4),
    getTrenchTimeline
  );

  /*
       Tag:           Trenches
       operationId:   updateSingleTrench
       exposed Route: /mni/v1/trench/:trenchId
       HTTP method:   PATCH
       OpenID Scope:  write:mni_trench
    */
  app.patch(
    serveUrlPrefix + serveUrlVersion + "/trench/:trenchId",
    // security("write:mni_trench"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("trenchId").isUUID(4),
    body("purpose").optional().isIn(OAS.trenchPurpose),
    body("construction").optional().isObject(),
    body("construction.depth")
      .optional()
      .isFloat({ min: 0, max: Number.MAX_VALUE }),
    body("construction.classifier").optional().isIn(OAS.depthClassifier),
    body("construction.unit").optional().isIn(OAS.sizeUnit),
    body("construction.type").optional().isIn(OAS.constructionType),
    body("demographics").optional().isObject(),
    body("demographics.premises").optional().isObject(),
    body("demographics.premises.passed").optional().isInt(OAS.premisesPassed),
    body("demographics.premises.area").optional().isIn(OAS.areaType),
    body("build").optional().isObject(),
    body("build.jobId").optional().isString().trim(),
    body("build.permitId").optional().isString().trim(),
    body("build.planned").optional().isObject(),
    body("build.planned.start").optional().matches(OAS.datePeriodYearMonthDay),
    body("build.planned.completion")
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.planned.duration").optional().isInt(OAS.duration),
    body("build.planned.unit").optional().isIn(OAS.durationUnit),
    body("build.actual").optional().isObject(),
    body("build.actual.start").optional().matches(OAS.datePeriodYearMonthDay),
    body("build.actual.completion")
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.actual.duration").optional().isInt(OAS.duration),
    body("build.actual.unit").optional().isIn(OAS.durationUnit),
    body("state").optional().isIn(OAS.trenchState),
    body("connectsTo").optional().isObject(),
    oneOf(
      [
        // site
        body("connectsTo.siteId").optional().isUUID(4),
      ],
      [
        // trench
        body("connectsTo.trenchId").optional().isUUID(4),
      ],
      [
        // pole
        body("connectsTo.poleId").optional().isUUID(4),
      ],
      {
        message: "either site, trench or pole identifier must be supplied",
      }
    ),
    body("coordinates").optional().isArray({ min: 1 }),
    body("coordinates.*.x").optional().isFloat(OAS.coordinate_x),
    body("coordinates.*.y").optional().isFloat(OAS.coordinate_y),
    body("coordinates.*.z").optional().isFloat(OAS.coordinate_z),
    body("coordinates.*.m").optional().isString().trim(),
    body("point").optional().matches(OAS.dateTime),
    body("source").optional().isIn(OAS.source),
    body("delete").optional().isBoolean({ strict: true }),
    updateSingleTrench,
    replaceSingleTrench
  );

  /*
       Tag:           Trenches
       operationId:   replaceSingleTrench
       exposed Route: /mni/v1/trench/:trenchId
       HTTP method:   PUT
       OpenID Scope:  write:mni_trench
    */
  app.put(
    serveUrlPrefix + serveUrlVersion + "/trench/:trenchId",
    // security("write:mni_trench"),
    dumpRequest,
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    param("trenchId").isUUID(4),
    body("purpose").isIn(OAS.trenchPurpose),
    body("construction").isObject(),
    body("construction.depth")
      .default(914.4)
      .isFloat({ min: 0, max: Number.MAX_VALUE }),
    body("construction.classifier").isIn(OAS.depthClassifier),
    body("construction.unit").default("mm").isIn(OAS.sizeUnit),
    body("construction.type").isIn(OAS.constructionType),
    body("demographics").isObject(),
    body("demographics.premises").isObject(),
    body("demographics.premises.passed").default(0).isInt(OAS.premisesPassed),
    body("demographics.premises.area")
      .default("unclassified")
      .isIn(OAS.areaType),
    body("build").isObject(),
    body("build.jobId").isString().trim(),
    body("build.permitId").isString().trim(),
    body("build.planned").isObject(),
    body("build.planned.start").optional().matches(OAS.datePeriodYearMonthDay),
    body("build.planned.completion")
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.planned.duration").default(0).isInt(OAS.duration),
    body("build.planned.unit").default("day").isIn(OAS.durationUnit),
    body("build.actual").isObject(),
    body("build.actual.start")
      .if(body("build.actual").exists())
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.actual.completion")
      .if(body("build.actual").exists())
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("build.actual.duration")
      .if(body("build.actual").exists())
      .default(0)
      .isInt(OAS.duration),
    body("build.actual.unit")
      .if(body("build.actual").exists())
      .default("day")
      .isIn(OAS.durationUnit),
    body("state").default("free").isIn(OAS.trenchState),
    body("connectsTo").optional().isObject(),
    oneOf(
      [
        // site
        body("connectsTo.siteId").if(body("connectsTo").exists()).isUUID(4),
      ],
      [
        // trench
        body("connectsTo.trenchId").if(body("connectsTo").exists()).isUUID(4),
      ],
      [
        // pole
        body("connectsTo.poleId").if(body("connectsTo").exists()).isUUID(4),
      ],
      {
        message: "either site, trench or pole identifier must be supplied",
      }
    ),
    body("coordinates").isArray({ min: 1 }),
    body("coordinates.*.x").default(0).isFloat(OAS.coordinate_x),
    body("coordinates.*.y").default(0).isFloat(OAS.coordinate_y),
    body("coordinates.*.z").default(0).isFloat(OAS.coordinate_z),
    body("coordinates.*.m").optional().isString().trim(),
    body("point").default(dayjs().format(dayjsFormat)).matches(OAS.dateTime),
    body("source").default("historical").isIn(OAS.source),
    body("delete").default(false).isBoolean({ strict: true }),
    replaceSingleTrench
  );

  /*
       Tag:           Trenches
       operationId:   getMultipleTrenches
       exposed Route: /mni/v1/trenches
       HTTP method:   GET
       OpenID Scope:  read:mni_trench
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/trenches",
    //  security("read:mni_trench")
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMultipleTrenches
  );

  /*
       Tag:           Trenches
       operationId:   addMultipleTrench
       exposed Route: /mni/v1/trenches
       HTTP method:   POST
       OpenID Scope:  write:mni_trench
    */
  app.post(
    serveUrlPrefix + serveUrlVersion + "/trenches",
    // security("write:mni_trench"),
    header("Content-Type").default(OAS.mimeJSON).isIn(OAS.mimeContentType),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    body().isArray({ min: 1 }),
    body("*.trenchId").isUUID(4),
    body("*.purpose").isIn(OAS.trenchPurpose),
    body("*.construction").isObject(),
    body("*.construction.depth")
      .default(914.4)
      .isFloat({ min: 0, max: Number.MAX_VALUE }),
    body("*.construction.classifier").isIn(OAS.depthClassifier),
    body("*.construction.unit").default("mm").isIn(OAS.sizeUnit),
    body("*.construction.type").isIn(OAS.constructionType),
    body("*.demographics").optional().isObject(),
    body("*.demographics.premises").optional().isObject(),
    body("*.demographics.premises.passed").default(0).isInt(OAS.premisesPassed),
    body("*.demographics.premises.area")
      .default("unclassified")
      .isIn(OAS.areaType),
    body("*.build").isObject(),
    body("*.build.jobId").optional().isString().trim(),
    body("*.build.permitId").optional().isString().trim(),
    body("*.build.planned").optional().isObject(),
    body("*.build.planned.start")
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("*.build.planned.completion")
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("*.build.planned.duration").default(0).isInt(OAS.duration),
    body("*.build.planned.unit").default("day").isIn(OAS.durationUnit),
    body("*.build.actual").isObject(),
    body("*.build.actual.start")
      .if(body("*.build.actual").exists())
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("*.build.actual.completion")
      .if(body("*.build.actual").exists())
      .optional()
      .matches(OAS.datePeriodYearMonthDay),
    body("*.build.actual.duration")
      .if(body("*.build.actual").exists())
      .optional()
      .default(0)
      .isInt(OAS.duration),
    body("*.build.actual.unit")
      .if(body("*.build.actual").exists())
      .optional()
      .default("day")
      .isIn(OAS.durationUnit),
    body("*.state").default("free").isIn(OAS.trenchState),
    body("*.connectsTo").optional().isObject(),
    oneOf(
      [
        // site
        body("*.connectsTo.siteId")
          .optional()
          .if(body("*.connectsTo").exists())
          .isUUID(4),
      ],
      [
        // trench
        body("*.connectsTo.trenchId")
          .optional()
          .if(body("*.connectsTo").exists())
          .isUUID(4),
      ],
      [
        // pole
        body("*.connectsTo.poleId")
          .optional()
          .if(body("*.connectsTo").exists())
          .isUUID(4),
      ],
      {
        message: "either site, trench or pole identifier must be supplied",
      }
    ),
    body("*.coordinates").isArray({ min: 1 }),
    body("*.coordinates.*.x").default(0).isFloat(OAS.coordinate_x),
    body("*.coordinates.*.y").default(0).isFloat(OAS.coordinate_y),
    body("*.coordinates.*.z").default(0).isFloat(OAS.coordinate_z),
    body("*.coordinates.*.m").optional().isString().trim(),
    body("*.point")
      .default(dayjs().format(dayjsFormat))
      .matches(OAS.datePeriodYearMonthDay),
    body("*.source").default("historical").isIn(OAS.source),
    body("*.delete").default(false).isBoolean({ strict: true }),
    addMultipleTrench
  );

  /*
       Tag:           UI
       operationId:   getMapRender
       exposed Route: /mni/v1/ui/mapRender
       HTTP method:   GET
       OpenID Scope:  read:mni_ui
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/ui/mapRender",
    // security("read:mni_api"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getMapRender
  );

  /*
       Tag:           UI
       operationId:   getSimpleStatistics
       exposed Route: /mni/v1/ui/statistic
       HTTP method:   GET
       OpenID Scope:  read:mni_ui
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/ui/statistic",
    // security("read:mni_api"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getSimpleStatistics
  );

  /*
       Tag:           Predict
       operationId:   getAllPredictedTimeline
       exposed Route: /mni/v1/predict/predictedTimeline
       HTTP method:   GET
       OpenID Scope:  read:mni_predict
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/predict/predictedTimeline",
    // security("read:mni_predict"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getAllPredictedTimeline
  );

  /*
       Tag:           Predict
       operationId:   getAllHistoricalTimeline
       exposed Route: /mni/v1/predict/historicalTimeline
       HTTP method:   GET
       OpenID Scope:  read:mni_predict
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/predict/historicalTimeline",
    // security("read:mni_predict"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getAllHistoricalTimeline
  );

  /*
       Tag:           Predict
       operationId:   getNextPredictQueueItem
       exposed Route: /mni/v1/predict/queue
       HTTP method:   GET
       OpenID Scope:  read:mni_internal
    */
  app.get(
    serveUrlPrefix + serveUrlVersion + "/predict/queue",
    // security("read:mni_internal"),
    header("Accept").default(OAS.mimeJSON).isIn(OAS.mimeAcceptType),
    getNextPredictQueueItem
  );

  /*
       Tag:           Predict
       operationId:   deletePredictQueueItem
       exposed Route: /mni/v1/predict/queue
       HTTP method:   DELETE
       OpenID Scope:  read:mni_internal
    */
  app.delete(
    serveUrlPrefix + serveUrlVersion + "/predict/queue/:qId",
    // security("read:mni_internal"),
    param("qId").default(0).isInt({ min: 0, max: Number.MAX_SAFE_INTEGER }),
    deletePredictQueueItem
  );

  // Express 404 handling ¯\_(ツ)_/¯
  app.use((req, res, next) => {
    res
      .contentType(OAS.mimeJSON)
      .status(404)
      .json({ errors: "not found", url: req.originalUrl });
  });

  // banner
  process.stdout.write(String.fromCharCode.apply(null, OAS.bannerGraffti));

  LOGGER.info(dayjs().format(dayjsFormat), "info", {
    event: "starting",
    mni: {
      name: appName,
      version: appVersion,
      build: appBuild,
    },
    backup: {
      cron: backupCronTime,
      enabled: jobBackupEnabled,
    },
    credentials: {
      username: serviceUsername.replace(allPrintableRegEx, "*"),
      key: serviceKey.replace(allPrintableRegEx, "*"),
    },
    duckdb: {
      version: duckDbVerison,
      //config: duckdb.configurationOptionDescriptions(),
      maxBufferMemory: duckDbMaxMemory,
      threads: duckDbThreads,
      dbFile: duckDbFile,
      backup: jobBackupEnabled,
      extensions: duckDbExtensions,
    },
    endpoint: {
      address: serveAddress,
      domain: serveDomain,
      fqdn: serveHost + "." + serveDomain,
      host: serveHost,
      port: servePort,
      serviceDiscoveryName: serveName,
      urlPrefix: serveUrlPrefix,
      urlVersion: serveUrlVersion,
      useDnsSD: serveUseDnsSd,
    },
    environment: {
      apiDirectory: apiDirectory,
      backupDirectory: backupDirectory,
      configDirectory: configDirectory,
      tickInterval: tickIntervalMs,
      timestamp: dayjsFormat,
    },
    geometry: {
      premisesPassedBoundaryDistance: premisesPassedBoundaryDistance,
    },
    ssl: {
      key: sslKey,
      cert: sslCert,
    },
    timeouts: {
      request: serveTimeOutRequest,
    },
  });

  // Install non-auto DuckDB extensions
  // DuckDB will ignore the LOAD command if extension already loaded etc.
  for (let i = 0; i < duckDbExtensions.length; i++) {
    if (DEBUG) {
      LOGGER.info(dayjs().format(dayjsFormat), "debug", {
        event: "extension",
        extension: duckDbExtensions[i],
        state: "install",
      });
    }
    await DDC.run("INSTALL " + duckDbExtensions[i]);
    if (DEBUG) {
      LOGGER.info(dayjs().format(dayjsFormat), "debug", {
        event: "extension",
        extension: duckDbExtensions[i],
        state: "load",
      });
    }
    await DDC.run("LOAD " + duckDbExtensions[i]);
  }

  // cron jobs - Database backup
  if (jobBackupEnabled) {
    backupCron = cron.schedule(
      backupCronTime,
      () => {
        jobBackup(backupDirectory);
      },
      {
        scheduled: true,
        recoverMissedExecutions: false,
        name: "backup",
      }
    );
  }
  // timer jobs
  updateGeometryTimer = setTimeout(
    jobUpdateGeometry,
    updateGeometryIntervalMs * Math.floor(Math.random() * 5)
  );
  updatePremisesPassedTimer = setTimeout(
    jobUpdatePremisesPassed,
    updatePremisesPassedIntervalMs * Math.floor(Math.random() * 5)
  );
  predictQueueTimer = setTimeout(
    jobPredictQueueFill,
    predictQueueIntervalMs * Math.floor(Math.random() * 5)
  );
  await jobPrune();
  await jobPruneQueues();

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

  // http express server
  server = https.createServer(
    {
      key: fs.readFileSync(path.join(configDirectory, sslKey), "utf-8"),
      cert: fs.readFileSync(path.join(configDirectory, sslCert), "utf-8"),
    },
    app
  );

  // http - app.listen(servePort, serveAddress, function (error) {
  server.listen({ port: servePort, host: serveAddress }, function (error) {
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
