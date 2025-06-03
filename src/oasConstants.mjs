//=====================================================================
// MarlinDT Network Intelligence (MNI) - OpenAPI Specification Constants
//
// Corporate Headquarters:
// Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
// https://www.merkator.com/
//
// © 2024-2025 Merkator nv/sa. All rights reserved.
//=====================================================================
//
// OpenAPI types, enums and sizes
export const X_scale = 3;
export const Y_scale = 2;
export const Z_scale = 8;
export const XY_precision = 6;
export const Z_precision = 2;
export const float_scale = 6;
export const float_precision = 2;
export const mimeJSON = "application/json";
export const mimeYAML = "application/yaml";
export const mimeContentType = [mimeJSON];
export const mimeAcceptType = [mimeJSON, mimeYAML];
export const aggregationUnit = [
  "hour",
  "day",
  "week",
  "month",
  "quarter",
  "half-year",
  "year",
];
export const areaType = [
  "residential",
  "rural",
  "industrial",
  "mixed",
  "psz",
  "urban",
  "unclassified",
];
export const cableCoaxConfigurationFrequency = ["MHz", "GHz"];
export const cableConfiguration_coax_channels = { min: 1, max: 512 };
export const cableConfiguration_coax_frequency = { min: 0.1, max: 100000 };
export const cableConfiguration_coax_width = { min: 1, max: 1000 };
export const cableConfiguration_copper_twistedPairs = { min: 1, max: 48 };
export const cableConfiguration_ethernet_rate = { min: 1, max: 200 };
export const cableConfiguration_single_fiber_channel = { min: 1, max: 512 };
export const cableConfiguration_single_fiber_strands = { min: 1, max: 48 };
export const cableConfiguration_single_fiber_width = { min: 1, max: 1000 };
export const cableEthernetConfiguration = [
  "Cat3",
  "Cat4",
  "Cat5",
  "Cat5e",
  "Cat6",
  "Cat6A",
  "Cat7",
  "Cat8",
];
export const cableEthernetConfigurationRate = ["Mbps", "Gbps", "Tbps"];
export const cableFiberConfigurationMode = ["SMOF", "MMOF"];
export const cableFiberConfigurationRate = ["Gbps", "Tbps"];
export const cableState = ["free", "used", "reserved", "faulty"];
export const cableTechnology = [
  "coax",
  "ethernet",
  "copper",
  "singleFiber",
  "multiFiber",
];
export const callback_maxLifeRetries = { min: 0, max: 255 };
export const callback_retries = { min: 1, max: 8 };
export const callback_retryDelay = { min: 0, max: 86400 };
export const callbackAuthentication = ["none", "basic"];
export const coordinate_x = { min: -180, max: 180 };
export const coordinate_y = { min: -90, max: 90 };
export const coordinate_z = { min: Number.MIN_VALUE, max: Number.MAX_VALUE };
export const channels = { min: 1, max: 512 };
export const csv_uuids =
  "(()?([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})+(,[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})?())?";
export const constructionType = [
  "micro",
  "narrow",
  "hang-dug",
  "backhoe",
  "inline",
  "portable",
  "large",
];
export const datePeriodYear = "[0-9]{4}";
export const datePeriodYearHalf = "[1-2][H|h][0-9]{4}";
export const datePeriodYearMonth = "[0-9]{6}";
export const datePeriodYearMonthDay = "[0-9]{8}";
export const datePeriodYearQuarter = "[Q|q][1,2,3,4][0-9]{4}";
export const dateTime = "[0-9]{8}T[0-9]{6}";
export const depthClassifier = ["low", "medium", "deep"];
export const ductConfiguration = { min: 1, max: 48 };
export const ductPurpose = ["gas", "power", "cable", "water"];
export const ductSizeCategory = ["duct", "microduct", "subduct"];
export const ductState = ["free", "used", "reserved", "faulty"];
export const duration = { min: 0, max: Number.MAX_SAFE_INTEGER };
export const durationUnit = [
  "second",
  "minute",
  "hour",
  "day",
  "week",
  "month",
  "quarter",
  "year",
];
export const emailReceiveFolderSeparator = ["/", "."];
export const emailReceiveProtocol = ["imap4"];
export const emailSendAuthentication = [
  "PLAIN",
  "AUTH",
  "GSSAPI",
  "DIGEST-MD5",
  "MD5",
  "CRAM-MD5",
  "OAUTH10A",
  "OAUTHBEARER",
  "XOAUTH2",
];
export const emailSendProtocol = ["smtp"];
export const emailSubject = { min: 1, max: 998 };
export const rack_floor = { min: 0, max: 256 };
export const rack_row = { min: 0, max: 256 };
export const rack_column = { min: 0, max: 256 };
export const rack_dimension = { min: 0, max: Number.MAX_VALUE };
export const height = { min: 1, max: Number.MAX_VALUE };
export const heightClassifier = [
  "residential",
  "rural",
  "commercial",
  "urban",
  "highways",
  "unclassified",
];
export const kafka_batchSize = { min: 1, max: Number.MAX_SAFE_INTEGER };
export const kafka_bufferMemory = { min: 1, max: Number.MAX_SAFE_INTEGER };
export const kafka_linger = { min: 0, max: Number.MAX_SAFE_INTEGER };
export const kafka_maxInFlightRequestsPerConnection = { min: 1, max: 255 };
export const kafka_retries = { min: 0, max: 8 };
export const kafka_retryDelay = { min: 0, max: Number.MAX_SAFE_INTEGER };
export const kafkaProducerAcks = ["all", "leader", "none"];
export const kafkaProducerAuthentication = [
  "none",
  "basic",
  "digest",
  "plaintext",
  "sasl_ssl",
  "sasl_plain",
];
export const kafkaProducerCompressionMethod = ["none", "gzip"];
export const kafkaTopic = "[a-zA-Z0-9|_|.|,|-]+";
export const lag_members = { min: 0, max: 256 };
export const countryCode = [
  "ABW",
  "AFG",
  "AGO",
  "AIA",
  "ALA",
  "ALB",
  "AND",
  "ARE",
  "ARG",
  "ARM",
  "ASM",
  "ATA",
  "ATF",
  "ATG",
  "AUS",
  "AUT",
  "AZE",
  "BDI",
  "BEL",
  "BEN",
  "BES",
  "BFA",
  "BGD",
  "BGR",
  "BHR",
  "BHS",
  "BIH",
  "BLM",
  "BLR",
  "BLZ",
  "BMU",
  "BOL",
  "BRA",
  "BRB",
  "BRN",
  "BTN",
  "BVT",
  "BWA",
  "CAF",
  "CAN",
  "CCK",
  "CHE",
  "CHL",
  "CHN",
  "CIV",
  "CMR",
  "COD",
  "COG",
  "COK",
  "COL",
  "COM",
  "CPV",
  "CRI",
  "CUB",
  "CUW",
  "CXR",
  "CYM",
  "CYP",
  "CZE",
  "DEU",
  "DJI",
  "DMA",
  "DNK",
  "DOM",
  "DZA",
  "ECU",
  "EGY",
  "ERI",
  "ESH",
  "ESP",
  "EST",
  "ETH",
  "FIN",
  "FJI",
  "FLK",
  "FRA",
  "FRO",
  "FSM",
  "GAB",
  "GBR",
  "GEO",
  "GGY",
  "GHA",
  "GIB",
  "GIN",
  "GLP",
  "GMB",
  "GNB",
  "GNQ",
  "GRC",
  "GRD",
  "GRL",
  "GTM",
  "GUF",
  "GUM",
  "GUY",
  "HKG",
  "HMD",
  "HND",
  "HRV",
  "HTI",
  "HUN",
  "IDN",
  "IMN",
  "IND",
  "IOT",
  "IRL",
  "IRN",
  "IRQ",
  "ISL",
  "ISR",
  "ITA",
  "JAM",
  "JEY",
  "JOR",
  "JPN",
  "KAZ",
  "KEN",
  "KGZ",
  "KHM",
  "KIR",
  "KNA",
  "KOR",
  "KWT",
  "LAO",
  "LBN",
  "LBR",
  "LBY",
  "LCA",
  "LIE",
  "LKA",
  "LSO",
  "LTU",
  "LUX",
  "LVA",
  "MAC",
  "MAF",
  "MAR",
  "MCO",
  "MDA",
  "MDG",
  "MDV",
  "MEX",
  "MHL",
  "MKD",
  "MLI",
  "MLT",
  "MMR",
  "MNE",
  "MNG",
  "MNP",
  "MOZ",
  "MRT",
  "MSR",
  "MTQ",
  "MUS",
  "MWI",
  "MYS",
  "MYT",
  "NAM",
  "NCL",
  "NER",
  "NFK",
  "NGA",
  "NIC",
  "NIU",
  "NLD",
  "NOR",
  "NPL",
  "NRU",
  "NZL",
  "OMN",
  "PAK",
  "PAN",
  "PCN",
  "PER",
  "PHL",
  "PLW",
  "PNG",
  "POL",
  "PRI",
  "PRK",
  "PRT",
  "PRY",
  "PSE",
  "PYF",
  "QAT",
  "REU",
  "ROU",
  "RUS",
  "RWA",
  "SAU",
  "SDN",
  "SEN",
  "SGP",
  "SGS",
  "SHN",
  "SJM",
  "SLB",
  "SLE",
  "SLV",
  "SMR",
  "SOM",
  "SPM",
  "SRB",
  "SSD",
  "STP",
  "SUR",
  "SVK",
  "SVN",
  "SWE",
  "SWZ",
  "SXM",
  "SYC",
  "SYR",
  "TCA",
  "TCD",
  "TGO",
  "THA",
  "TJK",
  "TKL",
  "TKM",
  "TLS",
  "TON",
  "TTO",
  "TUN",
  "TUR",
  "TUV",
  "TWN",
  "TZA",
  "UGA",
  "UKR",
  "UMI",
  "URY",
  "USA",
  "UZB",
  "VAT",
  "VCT",
  "VEN",
  "VGB",
  "VIR",
  "VNM",
  "VUT",
  "WLF",
  "WSM",
  "YEM",
  "ZAF",
  "ZMB",
  "ZWE",
];
export const languageCode = [
  "aa",
  "ab",
  "ae",
  "af",
  "ak",
  "am",
  "an",
  "ar",
  "as",
  "av",
  "ay",
  "az",
  "ba",
  "be",
  "bg",
  "bh",
  "bi",
  "bm",
  "bn",
  "bo",
  "br",
  "bs",
  "ca",
  "ce",
  "ch",
  "co",
  "cr",
  "cs",
  "cu",
  "cv",
  "cy",
  "da",
  "de",
  "dv",
  "dz",
  "ee",
  "el",
  "en",
  "eo",
  "es",
  "et",
  "eu",
  "fa",
  "ff",
  "fi",
  "fj",
  "fo",
  "fr",
  "fy",
  "ga",
  "gd",
  "gl",
  "gn",
  "gu",
  "gv",
  "ha",
  "he",
  "hi",
  "ho",
  "hr",
  "ht",
  "hu",
  "hy",
  "hz",
  "ia",
  "id",
  "ie",
  "ig",
  "ii",
  "ik",
  "io",
  "is",
  "it",
  "iu",
  "ja",
  "jv",
  "ka",
  "kg",
  "ki",
  "kj",
  "kk",
  "kl",
  "km",
  "kn",
  "ko",
  "kr",
  "ks",
  "ku",
  "kv",
  "kw",
  "ky",
  "la",
  "lb",
  "lg",
  "li",
  "ln",
  "lo",
  "lt",
  "lu",
  "lv",
  "mg",
  "mh",
  "mi",
  "mk",
  "ml",
  "mn",
  "mr",
  "ms",
  "mt",
  "my",
  "na",
  "nb",
  "nd",
  "ne",
  "ng",
  "nl",
  "nn",
  "nr",
  "nv",
  "ny",
  "oc",
  "oj",
  "om",
  "or",
  "os",
  "pa",
  "pi",
  "pl",
  "ps",
  "pt",
  "qu",
  "rm",
  "rn",
  "ro",
  "ru",
  "rw",
  "sa",
  "sc",
  "sd",
  "se",
  "sg",
  "si",
  "sk",
  "sl",
  "sm",
  "sn",
  "so",
  "sq",
  "sr",
  "ss",
  "st",
  "su",
  "sv",
  "sw",
  "ta",
  "te",
  "tg",
  "th",
  "ti",
  "tk",
  "tl",
  "tn",
  "to",
  "tr",
  "ts",
  "tt",
  "tw",
  "ty",
  "ug",
  "uk",
  "ur",
  "uz",
  "ve",
  "vi",
  "vo",
  "wa",
  "wo",
  "xh",
  "yi",
  "yo",
  "za",
  "zh",
  "zu",
];
export const mapVendorOpenStreetMap = "OpenStreet Map";
export const mapVendorGoogleMaps = "Google Maps";
export const mapVendorMicrosoftAzure = "Microsoft Azure";
export const mapVendorERSI = "ERSI";
export const mapVendorPlatform = [
  mapVendorOpenStreetMap,
  mapVendorGoogleMaps,
  mapVendorMicrosoftAzure,
  mapVendorERSI,
];
export const pageNumber = { min: 1, max: Number.MAX_SAFE_INTEGER };
export const pageSize = { min: 1, max: 128 };
export const placement_horizontal = { min: 0, max: Number.MAX_VALUE };
export const placement_vertical = { min: 0, max: Number.MAX_VALUE };
export const polePurpose = ["service/drop", "link", "backhaul", "unclassified"];
export const poleState = ["free", "used", "reserved", "faulty"];
export const port = { min: 1, max: 65536 };
export const portCoaxConfigurationRate = ["MHz", "GHz"];
export const portConfiguration_coax_channels = { min: 1, max: 512 };
export const portConfiguration_coax_width = { min: 0.1, max: 100000 };
export const portConfiguration_ethernet_rate = { min: 1, max: 200 };
export const portConfiguration_single_fiber_channels = { min: 1, max: 512 };
export const portConfiguration_single_fiber_rate = { min: 1, max: 200 };
export const portConfiguration_single_fiber_width = { min: 1, max: 1000 };
export const portConfiguration_xdsl_rate = { min: 1, max: 100 };
export const portEthernetConfiguration = [
  "Cat3",
  "Cat4",
  "Cat5",
  "Cat5e",
  "Cat6",
  "Cat6A",
  "Cat7",
  "Cat8",
];
export const portEthernetConfigurationRate = ["Mbps", "Gbps", "Tbps"];
export const portFiberConfigurationMode = ["SMOF", "MMOF"];
export const portFiberConfigurationRate = ["Gbps", "Tbps"];
export const portName = { min: 3, max: 64 };
export const portState = ["free", "used", "reserved", "faulty"];
export const portTechnology = [
  "coax",
  "ethernet",
  "loopback",
  "fiber",
  "xdsl",
  ,
  "virtual",
];
export const portXdslConfiguration = ["ADSL", "ADSL2", "ADSL2+", "VDSL", "VDSL2"];
export const portXdslConfigurationRate = ["Mbps"];
export const premisesPassed = { min: 0, max: Number.MAX_SAFE_INTEGER };
export const rackSlots = { min: 1, max: 58 };
export const rackSlots_u = { min: 0, max: 58 };
export const ribbons = { min: 1, max: 36 };
export const siteType = [
  "street",
  "exchange",
  "pop",
  "dc",
  "colo",
  "unclassified",
];
export const sizeUnit = ["cm", "mm", "m", "inch", "feet"];
export const source = ["historical", "predicted"];
export const trenchPurpose = ["service/drop", "link", "backhaul", "unclassified"];
export const trenchState = ["free", "used", "reserved", "faulty"];
export const url_protocols = ["http", "https"];
export const vlanId = { min: 0, max: 4095 };
export const vxlanId = { min: 4096, max: 16777215 };
export const workflowEngineType = ["bpmn", "elsa"];
