//=====================================================================
// Network Insight (NI)
//
// Corporate Headquarters:
// Cowdrey Consulting · United Kingdom · T:+447442104556 
// https://www.cowdrey.net/
//
// © 2026 Cowdrey Consulting. All rights reserved.
//=====================================================================
//
import * as OAS from "./oasConstants.mjs";
import "dotenv/config";
import { Console } from "node:console";
import dayjs from "dayjs";
import { Base64 } from "js-base64";
import SoftwareLicenseKey from "software-license-key";
import fs from "fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
const argv = yargs(hideBin(process.argv)).parse();

const allPrintableRegEx = /[ -~]/gi;
const niMasterKey = "niMasterKey.pem";
const niDefaultDuration = 13;
const niDefaultUnit = "month";
const niDefaultHost = "NI";
const niDefaultDomain = "cowdrey.local";
const niDefaultKey = "ni.key";
const niDefaultRole = OAS.roleStandalone;

var DEBUG = false;

//const output = fs.createWriteStream('./stdout.log');
//const errorOutput = fs.createWriteStream('./stderr.log');
var LOGGER = new Console({
  stdout: process.stdout,
  stderr: process.stderr,
  colorMode: false,
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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

// quit
function quit() {}

function help() {
  LOGGER.info(dayjs().format(OAS.dayjsFormat), "usage:\n");
  LOGGER.info("\tnode " + argv.$0 + " \\");
  LOGGER.info(
    "\t--generate\t\t\t\tcreate a new encrypted key for inclusion within ni.ini\n" +
    "\t\t[--out=" +
      niDefaultKey +
      "]\t\t\tfilename to save encrypted key to\n" + 
      "\t\t[--start=YYYYMMDD[T]HHmmss]\n" +
      "\t\t[--duration=" +
      niDefaultDuration +
      "]\t\t\tpositive integer, no validation against unit is performed\n" + 
      "\t\t[--unit=" +
      niDefaultUnit +
      "]\t\t\tsecond,minute,hour,day,week,month,quarter or year\n" +
      "\t\t[--role=" +
      niDefaultRole +
      "\n\t\t[--host=" +
      niDefaultHost +
      "]\t\t\tthe hostname executing API Server\n" + 
      "\t\t[--domain=" +
      niDefaultDomain +
      "]\tthe domain name executing API Server"
  );
  LOGGER.info("\t--verify\t\t\t\tverify encrypted key contents\n"+
     "\t\t[--in=" + niDefaultKey + "]\t\t\tfilename to read encrypted key from\n");
  LOGGER.info(dayjs().format(OAS.dayjsFormat), "example:\n");
  LOGGER.info(
    "\tnode " +
      argv.$0 +
      " --generate --start=20250801T000000 --duration=1 --unit=month --role=standalone --host=mdt --domain=cowdrey.net --out=mdt.pem"
  );
}

function generate({
  duration = niDefaultDuration,
  unit = niDefaultUnit,
  start = null,
  role = niDefaultRole,
  host = niDefaultHost,
  domain = niDefaultDomain,
  pemFile = niDefaultKey,
} = {}) {
  let expiry = null;
  let keyData = null;
  let key = null;
  //instantiate with the private key
  let privateKeyFile = fs.readFileSync(niMasterKey, "utf8");
  let generator = new SoftwareLicenseKey(privateKeyFile);

  //instantiate with the public key
  let validator = new SoftwareLicenseKey(OAS.niMasterPublicKey);

  // adjust units - ('second','minute','hour','day','week','month','quarter','year');
  switch (unit) {
    case "second":
      unit = "s";
      break;
    case "minute":
      unit = "m";
      break;
    case "hour":
      unit = "h";
      break;
    case "day":
      unit = "d";
      break;
    case "week":
      unit = "w";
      break;
    case "month":
      unit = "M";
      break;
    case "quarter":
      unit = "M";
      duration = duration * 3;
      break;
    case "year":
      unit = "y";
      break;
  }

  //  let point = dayjs().format(OAS.dayjsFormat);
  if (start == null) {
    start = dayjs().format(OAS.dayjsFormat);
  }
  expiry = dayjs(start, OAS.dayjsFormat)
    .add(duration, unit)
    .subtract(1, "s")
    .format(OAS.dayjsFormat);

  keyData = {
    role: role,
    host: host,
    domain: domain,
    start: start,
    expiry: expiry,
  };

  key = generator.generateLicense(keyData);
  LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
    out: pemFile,
    role: keyData.role,
    host: keyData.host,
    domain: keyData.domain,
    start: keyData.start,
    expiry: keyData.expiry,
  });
  fs.writeFileSync(pemFile, Base64.encode(key,true));
}

function verify({ pemFile = niDefaultKey } = {}) {
  let keyData = null;
  let key = null;
  let validator = new SoftwareLicenseKey(OAS.niMasterPublicKey);

  if (fs.existsSync(pemFile)) {
    key = Base64.decode(fs.readFileSync(pemFile, "utf8"));
    keyData = JSON.parse(JSON.stringify(validator.validateLicense(key)));
    LOGGER.info(dayjs().format(OAS.dayjsFormat), "info", {
      key: key,
      role: keyData.role,
      host: keyData.host,
      domain: keyData.domain,
      start: keyData.start,
      expiry: keyData.expiry,
    });
  } else {
    LOGGER.error(
      dayjs().format(OAS.dayjsFormat),
      "error",
      pemFile,
      "key file not found"
    );
  }
}

//
var run = async () => {
  if (argv.generate) {
    generate({
      duration: argv.duration,
      unit: argv.unit,
      start: argv.start,
      role: argv.role,
      host: argv.host,
      domain: argv.domain,
      pemFile: argv.out,
    });
  } else if (argv.verify) {
    verify({
      pemFile: argv.in,
    });
  } else if (argv.help) {
    help();
  } else {
    LOGGER.error(
      dayjs().format(OAS.dayjsFormat),
      "error",
      "missing CLI options/parameters"
    );
    help();
  }
  quit();
};

// main
run().catch((e) => LOGGER.error(e));
