--=====================================================================
-- MarlinDT Network Intelligence (MNI)
--
-- Corporate Headquarters:
-- Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
-- https://www.merkator.com/
--
-- © 2024-2025 Merkator nv/sa. All rights reserved.
--=====================================================================

---
--- optional/custom extensions that are required
---
-- see https://duckdb.org/docs/extensions/inet
INSTALL inet;
LOAD inet;

-- see https://github.com/duckdb/duckdb-spatial/blob/main/docs/example.md
INSTALL spatial;
LOAD spatial;
---- Represent a latitude and longitude as a point
-- The Eiffel Tower in Paris, France has a 
-- latitude of 48.858935 and longitude of 2.293412
-- We can represent this location as a point
-- SELECT st_point(48.858935, 2.293412) AS Eiffel_Tower;
--
--SELECT
--    st_point(48.858935, 2.293412) AS Eiffel_Tower, 
--    st_point(48.873407, 2.295471) AS Arc_de_Triomphe,
--    st_distance(
--        st_transform(Eiffel_Tower, 'EPSG:4326', 'EPSG:27563'), 
--        st_transform(Arc_de_Triomphe, 'EPSG:4326', 'EPSG:27563')
--    ) AS Aerial_Distance_M;
--
-- for MNI can use ST_Point3D(X,Y,Z) or ST_Point4D(X,Y,Z,M) 

---
--- custom types (ENUMs to match Open API)
---

CREATE TYPE aggregationUnit AS ENUM ('hour','day','week','month','quarter','half-year','year');
CREATE TYPE areaType AS ENUM ('residential','rural','industrial','mixed','psz','urban','unclassified');
CREATE TYPE alertType AS ENUM ('callback','publish','notify','workflow');
CREATE TYPE callbackAuthentication AS ENUM ('none','basic');
CREATE TYPE cableCoaxConfigurationFrequency AS ENUM ('MHz','GHz');
CREATE TYPE cableEthernetConfiguration AS ENUM ('Cat3','Cat4','Cat5','Cat5e','Cat6','Cat6A','Cat7','Cat8');
CREATE TYPE cableEthernetConfigurationRate AS ENUM ('Mbps','Gbps','Tbps');
CREATE TYPE cableFiberConfigurationMode AS ENUM ('SMOF','MMOF');
CREATE TYPE cableFiberConfigurationRate AS ENUM ('Gbps','Tbps');
CREATE TYPE cableState AS ENUM ('free','used','reserved','faulty');
CREATE TYPE cableTechnology AS ENUM ('coax','ethernet','copper','singleFiber','multiFiber');
CREATE TYPE constructionType AS ENUM ('micro','narrow','hand-dug','backhoe','inline','portable','large', 'unclassified');
CREATE TYPE countryCode AS ENUM ( 'ABW', 'AFG', 'AGO', 'AIA', 'ALA', 'ALB', 'AND', 'ARE', 'ARG', 'ARM', 'ASM', 'ATA', 'ATF', 'ATG', 'AUS', 'AUT', 'AZE', 'BDI', 'BEL', 'BEN', 'BES', 'BFA', 'BGD', 'BGR', 'BHR', 'BHS', 'BIH', 'BLM', 'BLR', 'BLZ', 'BMU', 'BOL', 'BRA', 'BRB', 'BRN', 'BTN', 'BVT', 'BWA', 'CAF', 'CAN', 'CCK', 'CHE', 'CHL', 'CHN', 'CIV', 'CMR', 'COD', 'COG', 'COK', 'COL', 'COM', 'CPV', 'CRI', 'CUB', 'CUW', 'CXR', 'CYM', 'CYP', 'CZE', 'DEU', 'DJI', 'DMA', 'DNK', 'DOM', 'DZA', 'ECU', 'EGY', 'ERI', 'ESH', 'ESP', 'EST', 'ETH', 'FIN', 'FJI', 'FLK', 'FRA', 'FRO', 'FSM', 'GAB', 'GBR', 'GEO', 'GGY', 'GHA', 'GIB', 'GIN', 'GLP', 'GMB', 'GNB', 'GNQ', 'GRC', 'GRD', 'GRL', 'GTM', 'GUF', 'GUM', 'GUY', 'HKG', 'HMD', 'HND', 'HRV', 'HTI', 'HUN', 'IDN', 'IMN', 'IND', 'IOT', 'IRL', 'IRN', 'IRQ', 'ISL', 'ISR', 'ITA', 'JAM', 'JEY', 'JOR', 'JPN', 'KAZ', 'KEN', 'KGZ', 'KHM', 'KIR', 'KNA', 'KOR', 'KWT', 'LAO', 'LBN', 'LBR', 'LBY', 'LCA', 'LIE', 'LKA', 'LSO', 'LTU', 'LUX', 'LVA', 'MAC', 'MAF', 'MAR', 'MCO', 'MDA', 'MDG', 'MDV', 'MEX', 'MHL', 'MKD', 'MLI', 'MLT', 'MMR', 'MNE', 'MNG', 'MNP', 'MOZ', 'MRT', 'MSR', 'MTQ', 'MUS', 'MWI', 'MYS', 'MYT', 'NAM', 'NCL', 'NER', 'NFK', 'NGA', 'NIC', 'NIU', 'NLD', 'NOR', 'NPL', 'NRU', 'NZL', 'OMN', 'PAK', 'PAN', 'PCN', 'PER', 'PHL', 'PLW', 'PNG', 'POL', 'PRI', 'PRK', 'PRT', 'PRY', 'PSE', 'PYF', 'QAT', 'REU', 'ROU', 'RUS', 'RWA', 'SAU', 'SDN', 'SEN', 'SGP', 'SGS', 'SHN', 'SJM', 'SLB', 'SLE', 'SLV', 'SMR', 'SOM', 'SPM', 'SRB', 'SSD', 'STP', 'SUR', 'SVK', 'SVN', 'SWE', 'SWZ', 'SXM', 'SYC', 'SYR', 'TCA', 'TCD', 'TGO', 'THA', 'TJK', 'TKL', 'TKM', 'TLS', 'TON', 'TTO', 'TUN', 'TUR', 'TUV', 'TWN', 'TZA', 'UGA', 'UKR', 'UMI', 'URY', 'USA', 'UZB', 'VAT', 'VCT', 'VEN', 'VGB', 'VIR', 'VNM', 'VUT', 'WLF', 'WSM', 'YEM', 'ZAF', 'ZMB', 'ZWE' );
CREATE TYPE currencySymbol AS ENUM ('$','£','¥','฿','₣','₦','₪','€','₴','₹','₺','₽','B$','Cg','DH','EC$','F.CFA','Fr','JD','kr','QR','R','RM','Rp','S$','XCG','zł');
CREATE TYPE currencyIsoCode AS ENUM ('AUD','BND','CHF','CLP','DKK','EUR','FKP','GBP','HKD','IDR','ILS','INR','ISK','JOD','JPY','MAD','MXN','MYR','NGN','NOK','NZD','PLN','QAR','RUB','SEK','SGD','SHP','THB','TRY','UAH','USD','XAF','XCD','XCG','XOF','XPF','ZAR');
CREATE TYPE depthClassifier AS ENUM ('low','medium','deep');
CREATE TYPE ductPurpose AS ENUM ('gas','power','cable','water');
CREATE TYPE ductSizeCategory AS ENUM ('duct','microduct','subduct');
CREATE TYPE ductState AS ENUM ('free','used','reserved','faulty');
CREATE TYPE durationUnit AS ENUM ('second','minute','hour','day','week','month','quarter','year');
CREATE TYPE emailReceiveFolderSeparator AS ENUM ('/','.');
CREATE TYPE emailReceiveProtocol AS ENUM ('imap4');
CREATE TYPE emailSendAuthentication AS ENUM ('PLAIN','AUTH','GSSAPI','DIGEST-MD5','MD5','CRAM-MD5','OAUTH10A','OAUTHBEARER','XOAUTH2');
CREATE TYPE emailSendProtocol AS ENUM ('smtp');
CREATE TYPE heightClassifier AS ENUM ('residential','rural','commercial','urban','highways','unclassified');
CREATE TYPE kafkaProducerAcks AS ENUM ('all','leader','none');
CREATE TYPE kafkaProducerAuthentication AS ENUM ('none','basic','digest','plaintext','sasl_ssl','sasl_plain');
CREATE TYPE kafkaProducerCompressionMethod AS ENUM ('none','gzip');
CREATE TYPE languageCode AS ENUM ('aa' ,'ab' ,'ae' ,'af' ,'ak' ,'am' ,'an' ,'ar' ,'as' ,'av' ,'ay' ,'az' ,'ba' ,'be' ,'bg' ,'bh' ,'bi' ,'bm' ,'bn' ,'bo' ,'br' ,'bs' ,'ca' ,'ce' ,'ch' ,'co' ,'cr' ,'cs' ,'cu' ,'cv' ,'cy' ,'da' ,'de' ,'dv' ,'dz' ,'ee' ,'el' ,'en' ,'eo' ,'es' ,'et' ,'eu' ,'fa' ,'ff' ,'fi' ,'fj' ,'fo' ,'fr' ,'fy' ,'ga' ,'gd' ,'gl' ,'gn' ,'gu' ,'gv' ,'ha' ,'he' ,'hi' ,'ho' ,'hr' ,'ht' ,'hu' ,'hy' ,'hz' ,'ia' ,'id' ,'ie' ,'ig' ,'ii' ,'ik' ,'io' ,'is' ,'it' ,'iu' ,'ja' ,'jv' ,'ka' ,'kg' ,'ki' ,'kj' ,'kk' ,'kl' ,'km' ,'kn' ,'ko' ,'kr' ,'ks' ,'ku' ,'kv' ,'kw' ,'ky' ,'la' ,'lb' ,'lg' ,'li' ,'ln' ,'lo' ,'lt' ,'lu' ,'lv' ,'mg' ,'mh' ,'mi' ,'mk' ,'ml' ,'mn' ,'mr' ,'ms' ,'mt' ,'my' ,'na' ,'nb' ,'nd' ,'ne' ,'ng' ,'nl' ,'nn' ,'nr' ,'nv' ,'ny' ,'oc' ,'oj' ,'om' ,'or' ,'os' ,'pa' ,'pi' ,'pl' ,'ps' ,'pt' ,'qu' ,'rm' ,'rn' ,'ro' ,'ru' ,'rw' ,'sa' ,'sc' ,'sd' ,'se' ,'sg' ,'si' ,'sk' ,'sl' ,'sm' ,'sn' ,'so' ,'sq' ,'sr' ,'ss' ,'st' ,'su' ,'sv' ,'sw' ,'ta' ,'te' ,'tg' ,'th' ,'ti' ,'tk' ,'tl' ,'tn' ,'to' ,'tr' ,'ts' ,'tt' ,'tw' ,'ty' ,'ug' ,'uk' ,'ur' ,'uz' ,'ve' ,'vi' ,'vo' ,'wa' ,'wo' ,'xh' ,'yi' ,'yo' ,'za' ,'zh' ,'zu');
CREATE TYPE languageName AS ENUM ('Afar (aar)' ,'Abkhaz (abk)' ,'Avestan (ave)' ,'Afrikaans (afr)' ,'Akan (aka)' ,'Amharic (amh)' ,'Aragonese (arg)' ,'Arabic (ara)' ,'Assamese (asm)' ,'Avaric (ava)' ,'Aymara (aym)' ,'Azerbaijani (aze)' ,'Bashkir (bak)' ,'Belarusian (bel)' ,'Bulgarian (bul)' ,'Bihari (bih)' ,'Bislama (bis)' ,'Bambara (bam)' ,'Bengali (ben)' ,'Tibetan (bod, tib)' ,'Breton (bre)' ,'Bosnian (bos)' ,'Catalan (cat)' ,'Chechen (che)' ,'Chamorro (cha)' ,'Corsican (cos)' ,'Cree (cre)' ,'Czech (ces, cze)' ,'Church Slavonic (chu)' ,'Chuvash (chv)' ,'Welsh (cym, wel)' ,'Danish (dan)' ,'German (deu, ger)' ,'Dhivehi (div)' ,'Dzongkha (dzo)' ,'Ewe (ewe)' ,'Greek (ell, gre)' ,'English (eng)' ,'Esperanto (epo)' ,'Spanish (spa)' ,'Estonian (est)' ,'Basque (eus, baq)' ,'Persian (fas, per)' ,'Fula (ful)' ,'Finnish (fin)' ,'Fijian (fij)' ,'Faroese (fao)' ,'French (fra, fre)' ,'West Frisian (fry)' ,'Irish (gle)' ,'Scottish Gaelic (gla)' ,'Galician (glg)' ,'Guaraní (grn)' ,'Gujarati (guj)' ,'Manx (glv)' ,'Hausa (hau)' ,'Hebrew (heb)' ,'Hindi (hin)' ,'Hiri Motu (hmo)' ,'Croatian (hrv)' ,'Haitian (hat)' ,'Hungarian (hun)' ,'Armenian (hye, arm)' ,'Herero (her)' ,'Interlingua (ina)' ,'Indonesian (ind)' ,'Interlingue (ile)' ,'Igbo (ibo)' ,'Nuosu (iii)' ,'Inupiaq (ipk)' ,'Ido (ido)' ,'Icelandic (isl, ice)' ,'Italian (ita)' ,'Inuktitut (iku)' ,'Japanese (jpn)' ,'Javanese (jav)' ,'Georgian (kat, geo)' ,'Kongo (kon)' ,'Kikuyu (kik)' ,'Kwanyama (kua)' ,'Kazakh (kaz)' ,'Kalaallisut (kal)' ,'Khmer (khm)' ,'Kannada (kan)' ,'Korean (kor)' ,'Kanuri (kau)' ,'Kashmiri (kas)' ,'Kurdish (kur)' ,'Komi (kom)' ,'Cornish (cor)' ,'Kyrgyz (kir)' ,'Latin (lat)' ,'Luxembourgish (ltz)' ,'Ganda (lug)' ,'Limburgish (lim)' ,'Lingala (lin)' ,'Lao (lao)' ,'Lithuanian (lit)' ,'Luba-Katanga (lub)' ,'Latvian (lav)' ,'Malagasy (mlg)' ,'Marshallese (mah)' ,'Māori (mir, mao)' ,'Macedonian (mkd, mac)' ,'Malayalam (mal)' ,'Mongolian (mon)' ,'Marathi (mar)' ,'Malay (msa, may)' ,'Maltese (mlt)' ,'Burmese (may, bur)' ,'Nauru (nau)' ,'Norwegian Bokmål (nob)' ,'Northern Ndebele (nde)' ,'Nepali (nep)' ,'Ndonga (ndo)' ,'Dutch (nld, dut)' ,'Norwegian Nynorsk (nno)' ,'Southern Ndebele (nbl)' ,'Navajo (nav)' ,'Chichewa (nya)' ,'Occitan (oci)' ,'Ojibwe (oji)' ,'Oromo (orm)' ,'Oriya (ori)' ,'Ossetian (oss)' ,'Punjabi (pan)' ,'Pāli (pli)' ,'Polish (pol)' ,'Pashto (pus)' ,'Portuguese (por)' ,'Quechua (que)' ,'Romansh (roh)' ,'Kirundi (run)' ,'Romanian (ron, rum)' ,'Russian (run)' ,'Kinyarwanda (kin)' ,'Sanskrit (san)' ,'Sardinian (srd)' ,'Sindhi (snd)' ,'Northern Sami (sme)' ,'Sango (sag)' ,'Sinhala (sin)' ,'Slovak (slk, slo)' ,'Slovene (slv)' ,'Samoan (smo)' ,'Shona (sna)' ,'Somali (som)' ,'Albanian (sqi, alb)' ,'Serbian (srp)' ,'Swati (ssw)' ,'Southern Sotho (sot)' ,'Sundanese (sun)' ,'Swedish (swe)' ,'Swahili (swa)' ,'Tamil (tam)' ,'Telugu (tel)' ,'Tajik (tgk)' ,'Thai (tha)' ,'Tigrinya (tir)' ,'Turkmen (tuk)' ,'Tagalog (tgl)' ,'Tswana (tsn)' ,'Tongan (ton)' ,'Turkish (tur)' ,'Tsonga (tso)' ,'Tatar (tat)' ,'Twi (twi)' ,'Tahitian (tah)' ,'Uighur (uig)' ,'Ukrainian (ukr)' ,'Urdu (urd)' ,'Uzbek (uzb)' ,'Venda (ven)' ,'Vietnamese (vie)' ,'Volapük (vol)' ,'Walloon (wln)' ,'Wolof (wol)' ,'Xhosa (xho)' ,'Yiddish (yid)' ,'Yoruba (yor)' ,'Zhuang (zha)' ,'Chinese (zho, chi)' ,'Zulu (zul)');
CREATE TYPE mapVendorPlatform AS ENUM ('OpenStreet Map','Google Maps','Microsoft Azure','ERSI');
CREATE TYPE polePurpose AS ENUM ('service/drop','link','backhaul','unclassified');
CREATE TYPE poleState AS ENUM ('free','used','reserved','faulty');
CREATE TYPE portCoaxConfigurationRate AS ENUM ('MHz','GHz');
CREATE TYPE portEthernetConfiguration AS ENUM ('Cat3','Cat4','Cat5','Cat5e','Cat6','Cat6A','Cat7','Cat8');
CREATE TYPE portEthernetConfigurationRate AS ENUM ('Mbps','Gbps','Tbps');
CREATE TYPE portFiberConfigurationMode AS ENUM ('SMOF','MMOF');
CREATE TYPE portFiberConfigurationRate AS ENUM ('Gbps','Tbps');
CREATE TYPE portState AS ENUM ('free','used','reserved','faulty');
CREATE TYPE portTechnology AS ENUM ('coax','ethernet','fiber','loopback','xdsl','virtual');
CREATE TYPE portXdslConfiguration AS ENUM ('ADSL','ADSL2','ADSL2+','VDSL','VDSL2');
CREATE TYPE portXdslConfigurationRate AS ENUM ('Mbps','Gbps');
CREATE TYPE predictResourceType AS ENUM ('cable','duct','ne','pole','rack','service','site','trench');
CREATE TYPE predictResourceStateType AS ENUM ('create','delete','update','undelete','read');
CREATE TYPE serviceType AS ENUM ('broadband','circuit','ethernet','sogea','fttx','optical','unclassified','voice');
CREATE TYPE siteType AS ENUM ('street','exchange','pop','dc','colo','unclassified');
CREATE TYPE sizeUnit AS ENUM ('cm','mm','m','km','Mm','inch','feet');
CREATE TYPE slotState AS ENUM ('free','used','reserved','faulty');
CREATE TYPE source AS ENUM ('historical','predicted');
CREATE TYPE trenchPurpose AS ENUM ('service/drop','ring','backhaul','pole','tower','unclassified');
CREATE TYPE trenchState AS ENUM ('free','used','reserved','faulty');
CREATE TYPE workflowEngineType AS ENUM ('bpmn','elsa');

---
--- sequences
---
CREATE SEQUENCE IF NOT EXISTS seq_alertQueue;
CREATE SEQUENCE IF NOT EXISTS seq_cable;
CREATE SEQUENCE IF NOT EXISTS seq_cableCoax;
CREATE SEQUENCE IF NOT EXISTS seq_cableCopper;
CREATE SEQUENCE IF NOT EXISTS seq_cableEthernet;
CREATE SEQUENCE IF NOT EXISTS seq_cableMultiFiber;
CREATE SEQUENCE IF NOT EXISTS seq_cableSingleFiber;
CREATE SEQUENCE IF NOT EXISTS seq_cvePlatforms;
CREATE SEQUENCE IF NOT EXISTS seq_cveVersions;
CREATE SEQUENCE IF NOT EXISTS seq_dashboard;
CREATE SEQUENCE IF NOT EXISTS seq_duct;
CREATE SEQUENCE IF NOT EXISTS seq_ne;
CREATE SEQUENCE IF NOT EXISTS seq_nePort;
CREATE SEQUENCE IF NOT EXISTS seq_nePortCoax;
CREATE SEQUENCE IF NOT EXISTS seq_nePortEthernet;
CREATE SEQUENCE IF NOT EXISTS seq_nePortFiber;
CREATE SEQUENCE IF NOT EXISTS seq_nePortLoopback;
CREATE SEQUENCE IF NOT EXISTS seq_nePortVirtual;
CREATE SEQUENCE IF NOT EXISTS seq_nePortXdsl;
CREATE SEQUENCE IF NOT EXISTS seq_pole;
CREATE SEQUENCE IF NOT EXISTS seq_predictQueue;
CREATE SEQUENCE IF NOT EXISTS seq_rack;
CREATE SEQUENCE IF NOT EXISTS seq_rackSlot;
CREATE SEQUENCE IF NOT EXISTS seq_service;
CREATE SEQUENCE IF NOT EXISTS seq_serviceEgress;
CREATE SEQUENCE IF NOT EXISTS seq_serviceIngress;
CREATE SEQUENCE IF NOT EXISTS seq_site;
CREATE SEQUENCE IF NOT EXISTS seq_trench;
CREATE SEQUENCE IF NOT EXISTS seq_trenchCoordinate;

---
--- parent referential tables
---

CREATE TABLE IF NOT EXISTS currency (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    name VARCHAR NOT NULL,
    symbol currencySymbol NOT NULL,
    isoCode currencyIsoCode NOT NULL,
    systemDefault BOOLEAN NOT NULL DEFAULT false,
    rateFromDefault DECIMAL(18,6) NOT NULL DEFAULT 0 CHECK (rateFromDefault >= 0 AND rateFromDefault <= 99999.99999)
);

CREATE TABLE IF NOT EXISTS costCable (
    technology cableTechnology NOT NULL PRIMARY KEY,
    unit sizeUnit NOT NULL DEFAULT 'm',
    costPerUnit DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (costPerUnit >= 0 AND costPerUnit <= 999999.99)
);

CREATE TABLE IF NOT EXISTS costDuct (
    category ductSizeCategory NOT NULL,
    configuration INTEGER NOT NULL DEFAULT 1 CHECK (configuration >= 1 AND configuration <= 48),
    unit sizeUnit NOT NULL DEFAULT 'm',
    costPerUnit DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (costPerUnit >= 0 AND costPerUnit <= 999999.99),
    PRIMARY KEY (category,configuration)
);

CREATE TABLE IF NOT EXISTS costNe (
    vendor VARCHAR NOT NULL, 
    model VARCHAR NOT NULL,
    costPerUnit DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (costPerUnit >= 0 AND costPerUnit <= 999999.99),
    PRIMARY KEY (vendor,model)
);

CREATE TABLE IF NOT EXISTS costPole (
    purpose polePurpose NOT NULL,
    classifier heightClassifier NOT NULL,
    costPerUnit DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (costPerUnit >= 0 AND costPerUnit <= 999999.99),
    PRIMARY KEY (purpose,classifier)
);

CREATE TABLE IF NOT EXISTS costRack (
    slots INTEGER NOT NULL DEFAULT 42 CHECK (slots >= 1 AND slots <= 59),
    costPerUnit DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (costPerUnit >= 0 AND costPerUnit <= 999999.99)
);

CREATE TABLE IF NOT EXISTS costService (
    type serviceType NOT NULL,
    rate INTEGER NOT NULL CHECK (rate >= 0 AND rate <= 768),
    unit portEthernetConfigurationRate NOT NULL DEFAULT 'Gbps',
    lagMembers INTEGER DEFAULT 0 CHECK (lagMembers >= 0 AND lagMembers <= 256),
    costPerUnit DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (costPerUnit >= 0 AND costPerUnit <= 999999.99),
    PRIMARY KEY (type,rate,unit,lagMembers)
);

CREATE TABLE IF NOT EXISTS costSite (
    area areaType NOT NULL,
    type siteType NOT NULL,
    costPerUnit DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (costPerUnit >= 0 AND costPerUnit <= 999999.99),
    PRIMARY KEY (area,type)
);

CREATE TABLE IF NOT EXISTS costTrench (
    purpose trenchPurpose NOT NULL,
    type constructionType DEFAULT 'unclassified',
    unit sizeUnit NOT NULL DEFAULT 'm',
    costPerUnit DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (costPerUnit >= 0 AND costPerUnit <= 999999.99),
    PRIMARY KEY (purpose,type)
);

CREATE TABLE IF NOT EXISTS cve (
    id VARCHAR NOT NULL PRIMARY KEY,
    published TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    updated TIMESTAMP,
    vendor VARCHAR NOT NULL,
    uri VARCHAR NOT NULL,
);

CREATE TABLE IF NOT EXISTS cvePlatforms (
    id INTEGER NOT NULL DEFAULT nextval('seq_cvePlatforms') PRIMARY KEY,
    cveId VARCHAR NOT NULL,
    platform VARCHAR NOT NULL,
    FOREIGN KEY (cveId) REFERENCES cve (id)
);

CREATE TABLE IF NOT EXISTS cveVersions (
    id INTEGER NOT NULL DEFAULT nextval('seq_cveVersions') PRIMARY KEY,
    cveId VARCHAR NOT NULL,
    lessThan VARCHAR,
    status VARCHAR,
    version VARCHAR,
    versionType VARCHAR,
    FOREIGN KEY (cveId) REFERENCES cve (id)
);

CREATE TABLE IF NOT EXISTS predictQueue (
    qId INTEGER NOT NULL DEFAULT nextval('seq_predictQueue') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    delete BOOLEAN NOT NULL DEFAULT false,
    resource predictResourceType NOT NULL,
    id VARCHAR NOT NULL,
    state predictResourceStateType NOT NULL
);

CREATE TABLE IF NOT EXISTS adminData (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    historicalDuration INTEGER NOT NULL DEFAULT 1 CHECK (historicalDuration > 0),
    historicalUnit durationUnit NOT NULL DEFAULT 'year',
    predictedDuration INTEGER NOT NULL DEFAULT 6 CHECK (predictedDuration > 0),
    predictedUnit durationUnit NOT NULL DEFAULT 'month'
);

CREATE TABLE IF NOT EXISTS adminEmail (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    vendor VARCHAR NOT NULL,
    address VARCHAR NOT NULL CHECK (regexp_full_match(address,'[\w-\.]+@([\w-]+\.)+[\w-]{2,4}')),
    name VARCHAR
);
CREATE TABLE IF NOT EXISTS adminEmailSend (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    adminEmailId VARCHAR NOT NULL,
    username VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    host VARCHAR NOT NULL,
    port INTEGER NOT NULL DEFAULT 465 CHECK (port >= 1 AND port <= 65535),
    protocol emailSendProtocol NOT NULL DEFAULT 'smtp',
    authentication emailSendAuthentication NOT NULL DEFAULT 'PLAIN',
    encryptionEnabled BOOLEAN NOT NULL DEFAULT false,
    encryptionStartTls BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY (adminEmailId) REFERENCES adminEmail (id)
);
CREATE TABLE IF NOT EXISTS adminEmailReceive (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    adminEmailId VARCHAR NOT NULL,
    username VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    host VARCHAR NOT NULL,
    port INTEGER NOT NULL DEFAULT 993 CHECK (port >= 1 AND port <= 65535),
    protocol emailReceiveProtocol NOT NULL DEFAULT 'imap4',
    encryptionEnabled BOOLEAN DEFAULT FALSE,
    encryptionStartTls BOOLEAN DEFAULT FALSE,
    rootFolder VARCHAR,
    folderSeparator emailReceiveFolderSeparator DEFAULT '/',
    FOREIGN KEY (adminEmailId) REFERENCES adminEmail (id)
);
CREATE TABLE IF NOT EXISTS adminKafka (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    name VARCHAR NOT NULL,
    clientId VARCHAR NOT NULL DEFAULT 'mni',
    username VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    host VARCHAR NOT NULL,
    port INTEGER NOT NULL DEFAULT 9092 CHECK (port >= 1 AND port <= 65535),
    retryDelay INTEGER NOT NULL DEFAULT 10000 CHECK (retryDelay >= 0),
    retries INTEGER NOT NULL DEFAULT 2 CHECK (retries >= 0 AND retries <= 8),
    acks kafkaProducerAcks NOT NULL DEFAULT 'leader',
    linger INTEGER NOT NULL DEFAULT 0 CHECK (linger >= 0),
    batchSize INTEGER NOT NULL DEFAULT 16 CHECK (batchSize >= 0),
    bufferMemory INTEGER NOT NULL DEFAULT 32 CHECK (bufferMemory >= 0),
    maxInFlightRequestsPerConnection INTEGER NOT NULL DEFAULT 5 CHECK (maxInFlightRequestsPerConnection >= 1 AND maxInFlightRequestsPerConnection <= 255),
    compressionMethod kafkaProducerCompressionMethod NOT NULL DEFAULT 'none',
    authentication kafkaProducerAuthentication NOT NULL DEFAULT 'none'
);
CREATE TABLE IF NOT EXISTS adminMap (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    vendor mapVendorPlatform NOT NULL,
    systemDefault BOOLEAN NOT NULL DEFAULT false,
    renderUrl VARCHAR NOT NULL,
    credentialsIdentity VARCHAR,
    credentialsKey VARCHAR,
    identityProviderBase VARCHAR,
    identityProviderAuthorization VARCHAR,
    identityProviderToken VARCHAR,
    identityProviderWellKnown VARCHAR
);
CREATE TABLE IF NOT EXISTS adminWorkflow (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    name VARCHAR NOT NULL,
    engineUsername VARCHAR NOT NULL,
    enginePassword VARCHAR NOT NULL,
    engineUrl VARCHAR NOT NULL,
    engineType workflowEngineType NOT NULL DEFAULT 'bpmn'
);
CREATE TABLE IF NOT EXISTS alert (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    description VARCHAR NOT NULL,
    function VARCHAR NOT NULL DEFAULT 'noop();'
);

CREATE TABLE IF NOT EXISTS alertCallback (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    alertId VARCHAR NOT NULL,
    requestorId VARCHAR NOT NULL,
    subscriptionId VARCHAR NOT NULL,
    callbackUrl VARCHAR NOT NULL,
    username VARCHAR,
    password VARCHAR,
    authentication callbackAuthentication NOT NULL DEFAULT 'none',
    retries INTEGER NOT NULL DEFAULT 1 CHECK (retries >= 0 AND retries <= 8),
    currentRetry INTEGER NOT NULL DEFAULT 0 CHECK (currentRetry >= 0 AND currentRetry <= 8),
    retryDelay INTEGER NOT NULL DEFAULT 60 CHECK (retryDelay >=0 AND retryDelay <= 86400), -- seconds
    maxLifeRetries INTEGER NOT NULL DEFAULT 16 CHECK (maxLifeRetries >= 0 AND maxLifeRetries <= 255),
    currentLifeRetries INTEGER NOT NULL DEFAULT 0 CHECK (currentLifeRetries >= 0 AND currentLifeRetries <= 255),
    FOREIGN KEY (alertId) REFERENCES alert (id)
);

CREATE TABLE IF NOT EXISTS alertContent (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    alertId VARCHAR NOT NULL,
    content VARCHAR USING COMPRESSION zstd, -- JSON content
    FOREIGN KEY (alertId) REFERENCES alert (id)
);

CREATE TABLE IF NOT EXISTS alertPublish (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    alertId VARCHAR NOT NULL,
    requestorId VARCHAR NOT NULL,
    publicationId VARCHAR NOT NULL,
    kafkaId VARCHAR NOT NULL,
    topic VARCHAR NOT NULL,
    FOREIGN KEY (alertId) REFERENCES alert (id),
    FOREIGN KEY (kafkaId) REFERENCES adminKafka (id)
);
CREATE TABLE IF NOT EXISTS alertNotify (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    alertId VARCHAR NOT NULL,
    requestorId VARCHAR NOT NULL,
    emailProviderId VARCHAR NOT NULL,
    notificationId VARCHAR NOT NULL,
    subject VARCHAR NOT NULL CHECK (length(subject) >= 1 AND length(subject) <= 998),
    FOREIGN KEY (alertId) REFERENCES alert (id),
    FOREIGN KEY (emailProviderId) REFERENCES adminEmail (id)
);
CREATE TABLE IF NOT EXISTS alertNotifyRecipient (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    alertNotifyId VARCHAR NOT NULL,
    notificationId VARCHAR NOT NULL,
    recipient VARCHAR NOT NULL CHECK (regexp_full_match(recipient,'[\w-\.]+@([\w-]+\.)+[\w-]{2,4}')),
    FOREIGN KEY (alertNotifyId) REFERENCES alertNotify (id)
);
CREATE TABLE IF NOT EXISTS alertWorkflow (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    alertId VARCHAR NOT NULL,
    requestorId VARCHAR NOT NULL,
    workflowEngineId VARCHAR NOT NULL,
    workflowRunnerId VARCHAR NOT NULL,
    flowName VARCHAR NOT NULL,
    FOREIGN KEY (alertId) REFERENCES alert (id),
    FOREIGN KEY (workflowEngineId) REFERENCES adminWorkflow (id)
);
CREATE TABLE IF NOT EXISTS alertQueue (
    qId INTEGER NOT NULL DEFAULT nextval('seq_alertQueue') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    delete BOOLEAN NOT NULL DEFAULT false,
    alertType alertType NOT NULL,
    alertId VARCHAR NOT NULL,
    callbackAlertId VARCHAR,
    publishAlertId VARCHAR,
    notifyAlertId VARCHAR,
    workflowAlertId VARCHAR,
    FOREIGN KEY (alertId) REFERENCES alert (id),
    FOREIGN KEY (callbackAlertId) REFERENCES alertCallback (id),
    FOREIGN KEY (publishAlertId) REFERENCES alertPublish (id),
    FOREIGN KEY (notifyAlertId) REFERENCES alertNotify (id),
    FOREIGN KEY (workflowAlertId) REFERENCES alertWorkflow (id)
);
CREATE TABLE IF NOT EXISTS trench (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    predictedTsId INTEGER
);
CREATE TABLE IF NOT EXISTS duct (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    predictedTsId INTEGER
);
CREATE TABLE IF NOT EXISTS site (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    predictedTsId INTEGER,
    geometry GEOMETRY
);
CREATE TABLE IF NOT EXISTS pole (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    predictedTsId INTEGER,
    geometry GEOMETRY
);
CREATE TABLE IF NOT EXISTS cable (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    predictedTsId INTEGER
);
CREATE TABLE IF NOT EXISTS rack (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    predictedTsId INTEGER,
    geometry GEOMETRY
);
CREATE TABLE IF NOT EXISTS ne (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    predictedTsId INTEGER
);
CREATE TABLE IF NOT EXISTS service (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    predictedTsId INTEGER
);

---
--- shadow time-series tables
---

CREATE TABLE IF NOT EXISTS _trench (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_trench') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    trenchId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    reference VARCHAR NOT NULL,
    purpose trenchPurpose NOT NULL,
    depth DECIMAL(6,2) NOT NULL DEFAULT 914.4 CHECK (depth >= 0),
    classifier depthClassifier NOT NULL DEFAULT 'low',
    unit sizeUnit NOT NULL DEFAULT 'mm',
    type constructionType NOT NULL,
    premisesPassed INTEGER NOT NULL DEFAULT 0 CHECK (premisesPassed >= 0),
    area areaType NOT NULL DEFAULT 'unclassified',
    jobId VARCHAR,
    permitId VARCHAR,
    plannedStart TIMESTAMP,
    plannedCompletion TIMESTAMP,
    plannedDuration INTEGER NOT NULL DEFAULT 0 CHECK (plannedDuration >= 0),
    plannedUnit durationUnit DEFAULT 'day',
    actualStart TIMESTAMP,
    actualCompletion TIMESTAMP,
    actualDuration INTEGER NOT NULL DEFAULT 0 CHECK (actualDuration >= 0),
    actualUnit durationUnit DEFAULT 'day',
    state trenchState NOT NULL DEFAULT 'free',
    connectsToSiteId VARCHAR,
    connectsToTrenchId VARCHAR,
    connectsToPoleId VARCHAR,
    FOREIGN KEY (trenchId) REFERENCES trench (id)
);
--- Error: Constraint Error: Duplicate key 'tsId: 25' violates primary key constraint. If this is an unexpected constraint violation please double check with the known index limitations section in our documentation (https://duckdb.org/docs/sql/indexes)
---    FOREIGN KEY (trenchId) REFERENCES trench (id),
---    FOREIGN KEY (connectsToSiteId) REFERENCES site (id),
---    FOREIGN KEY (connectsToTrenchId) REFERENCES trench (id),
---    FOREIGN KEY (connectsToPoleId) REFERENCES pole (id)
--- this is due to FOREIGN KEYS can not be NULL

---

CREATE TABLE IF NOT EXISTS _trenchCoordinate (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_trenchCoordinate') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    trenchTsId INTEGER NOT NULL,
    trenchId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    X DECIMAL(9,6) NOT NULL DEFAULT 0 CHECK (X >= -180 AND X <= 180),
    Y DECIMAL(9,6) NOT NULL DEFAULT 0 CHECK (Y >= -90 AND Y <= 90),
    Z DECIMAL(18,2) NOT NULL DEFAULT 0,
    M VARCHAR,
    geoPoint POINT_3D,
    FOREIGN KEY (trenchId) REFERENCES trench (id),
    FOREIGN KEY (trenchTsId) REFERENCES _trench (tsId)
);

---

CREATE TABLE IF NOT EXISTS _duct (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_duct') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    ductId VARCHAR NOT NULL,
    trenchId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    purpose ductPurpose NOT NULL,
    category ductSizeCategory NOT NULL,
    configuration INTEGER NOT NULL DEFAULT 1 CHECK (configuration >= 1 AND configuration <= 48),
    state ductState NOT NULL DEFAULT 'free',
    within VARCHAR,
    placementVertical DECIMAL(6,2) NOT NULL DEFAULT 350 CHECK (placementVertical >= 0),
    placementHorizontal DECIMAL(6,2) NOT NULL DEFAULT 1579 CHECK (placementHorizontal >= 0),
    placementUnit sizeUnit NOT NULL DEFAULT 'mm',
    FOREIGN KEY (ductId) REFERENCES duct (id),
    FOREIGN KEY (trenchId) REFERENCES trench (id),
    FOREIGN KEY (within) REFERENCES duct (id)
);

---

CREATE TABLE IF NOT EXISTS _site (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_site') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    siteId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    reference VARCHAR NOT NULL,
    commissioned TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    decommissioned TIMESTAMP,
    area areaType NOT NULL DEFAULT 'unclassified',
    type siteType NOT NULL DEFAULT 'unclassified',
    onNet BOOLEAN NOT NULL DEFAULT false,
    country countryCode NOT NULL,
    region VARCHAR NOT NULL,
    town VARCHAR NOT NULL,
    district VARCHAR,
    street VARCHAR NOT NULL,
    premisesNameNumber VARCHAR NOT NULL,
    postalCode VARCHAR NOT NULL,
    X DECIMAL(9,6) NOT NULL DEFAULT 0 CHECK (X >= -180 AND X <= 180),
    Y DECIMAL(9,6) NOT NULL DEFAULT 0 CHECK (Y >= -90 AND Y <= 90),
    Z DECIMAL(18,2) NOT NULL DEFAULT 0,
    M VARCHAR,
    geoPoint POINT_3D,
    FOREIGN KEY (siteId) REFERENCES site (id)
);

---

CREATE TABLE IF NOT EXISTS _pole (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_pole') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    poleId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    reference VARCHAR NOT NULL,
    purpose polePurpose NOT NULL,
    height DECIMAL(6,2) NOT NULL DEFAULT 20 CHECK (height >= 0),
    classifier heightClassifier NOT NULL,
    unit sizeUnit NOT NULL DEFAULT 'm',
    premisesPassed INTEGER NOT NULL DEFAULT 0 CHECK (premisesPassed >= 0),
    area areaType NOT NULL DEFAULT 'unclassified',
    jobId VARCHAR,
    permitId VARCHAR,
    plannedStart TIMESTAMP,
    plannedCompletion TIMESTAMP,
    plannedDuration INTEGER NOT NULL DEFAULT 0 CHECK (plannedDuration >= 0),
    plannedUnit durationUnit DEFAULT 'day',
    actualStart TIMESTAMP,
    actualCompletion TIMESTAMP,
    actualDuration INTEGER NOT NULL DEFAULT 0 CHECK (actualDuration >= 0),
    actualUnit durationUnit DEFAULT 'day',
    state poleState NOT NULL DEFAULT 'free',
    connectsToSiteId VARCHAR,
    connectsToTrenchId VARCHAR,
    connectsToPoleId VARCHAR,
    X DECIMAL(9,6) NOT NULL DEFAULT 0 CHECK (X >= -180 AND X <= 180),
    Y DECIMAL(9,6) NOT NULL DEFAULT 0 CHECK (Y >= -90 AND Y <= 90),
    Z DECIMAL(18,2) NOT NULL DEFAULT 0,
    M VARCHAR,
    geoPoint POINT_3D,
    FOREIGN KEY (poleId) REFERENCES pole (id)
);

--- 

CREATE TABLE IF NOT EXISTS _cable (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_cable') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    source source NOT NULL DEFAULT 'historical',
    cableId VARCHAR NOT NULL,
    reference VARCHAR NOT NULL,
    ductId VARCHAR,
    poleId VARCHAR,
    technology cableTechnology NOT NULL,
    state cableState NOT NULL DEFAULT 'free',
    coaxTsId INTEGER,
    copperTsId INTEGER,
    ethernetTsId INTEGER,
    singleFiberTsId INTEGER,
    multiFiberTsId INTEGER,
    FOREIGN KEY (cableId) REFERENCES cable (id)
);

---

CREATE TABLE IF NOT EXISTS _cableCoax (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_cableCoax') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    source source NOT NULL DEFAULT 'historical',
    cableId VARCHAR NOT NULL,
    frequencyLow DECIMAL(6,2) NOT NULL DEFAULT 0.1 CHECK (frequencyLow >= 0.1 AND frequencyLow <= 100000),
    frequencyHigh DECIMAL(6,2) NOT NULL DEFAULT 100000 CHECK (frequencyHigh >= 0.1 AND frequencyHigh <= 100000),
    channels INTEGER DEFAULT 1 CHECK (channels >= 1 AND channels <= 512),
    width DECIMAL(6,2) DEFAULT 1 CHECK (width >= 0.1 AND width <= 100000),
    unit cableCoaxConfigurationFrequency DEFAULT 'GHz',
    FOREIGN KEY (cableId) REFERENCES cable (id)
);

---

CREATE TABLE IF NOT EXISTS _cableEthernet (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_cableEthernet') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    source source NOT NULL DEFAULT 'historical',
    cableId VARCHAR NOT NULL,
    category cableEthernetConfiguration NOT NULL DEFAULT 'Cat6A',
    rate INTEGER NOT NULL DEFAULT 10 CHECK (rate >= 1 AND rate <= 768),
    unit cableEthernetConfigurationRate NOT NULL DEFAULT 'Gbps',
    FOREIGN KEY (cableId) REFERENCES cable (id)
);

---

CREATE TABLE IF NOT EXISTS _cableSingleFiber (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_cableSingleFiber') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    source source NOT NULL DEFAULT 'historical',
    cableId VARCHAR NOT NULL,
    strands INTEGER NOT NULL DEFAULT 1 CHECK (strands >= 1 AND strands <= 48),
    mode cableFiberConfigurationMode NOT NULL,
    channels INTEGER DEFAULT 1 CHECK (channels >= 1 AND channels <= 512),
    width INTEGER DEFAULT 1 CHECK (width >= 1 AND width <= 1000),
    unit cableFiberConfigurationRate DEFAULT 'Gbps',
    FOREIGN KEY (cableId) REFERENCES cable (id)
);


---

CREATE TABLE IF NOT EXISTS _cableMultiFiber (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_cableMultiFiber') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    source source NOT NULL DEFAULT 'historical',
    cableId VARCHAR NOT NULL,
    ribbons INTEGER NOT NULL DEFAULT 1 CHECK (ribbons >= 1 AND ribbons <= 36),
    strands INTEGER NOT NULL DEFAULT 1 CHECK (strands >= 1 AND strands <= 48),
    mode cableFiberConfigurationMode NOT NULL,
    channels INTEGER DEFAULT 1 CHECK (channels >= 1 AND channels <= 512),
    width INTEGER DEFAULT 1 CHECK (width >= 1 AND width <= 1000),
    unit cableFiberConfigurationRate DEFAULT 'Gbps',
    FOREIGN KEY (cableId) REFERENCES cable (id)
);

---

CREATE TABLE IF NOT EXISTS _cableCopper (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_cableCopper') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    source source NOT NULL DEFAULT 'historical',
    cableId VARCHAR NOT NULL,
    twistedPairs INTEGER NOT NULL DEFAULT 4 CHECK (twistedPairs >= 1 AND twistedPairs <= 48),
    FOREIGN KEY (cableId) REFERENCES cable (id)
);

---

CREATE TABLE IF NOT EXISTS _rack (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_rack') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    rackId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    reference VARCHAR NOT NULL,
    commissioned TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    decommissioned TIMESTAMP,
    siteId VARCHAR NOT NULL,
    floor INTEGER,
    floorArea VARCHAR,
    floorRow INTEGER,
    floorColumn INTEGER,
    X DECIMAL(9,6) NOT NULL DEFAULT 0 CHECK (X >= -180 AND X <= 180),
    Y DECIMAL(9,6) NOT NULL DEFAULT 0 CHECK (Y >= -90 AND Y <= 90),
    Z DECIMAL(18,2) NOT NULL DEFAULT 0,
    M VARCHAR,
    geoPoint POINT_3D,
    depth DECIMAL(6,2) NOT NULL DEFAULT 914.4 CHECK (depth >= 0),
    height DECIMAL(6,2) NOT NULL DEFAULT 2000 CHECK (height >= 0),
    width DECIMAL(6,2) NOT NULL DEFAULT 600 CHECK (width >= 0),
    unit sizeUnit NOT NULL DEFAULT 'mm',
    slots INTEGER NOT NULL DEFAULT 42 CHECK (slots >= 1 AND slots <= 59),
    FOREIGN KEY (rackId) REFERENCES rack (id),
    FOREIGN KEY (siteId) REFERENCES site (id)
);

---

CREATE TABLE IF NOT EXISTS _rackSlot (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_rackSlot') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    source source NOT NULL DEFAULT 'historical',
    rackId VARCHAR NOT NULL,
    rackTsId INTEGER NOT NULL,
    slot INTEGER NOT NULL CHECK (slot >= 1 AND slot <= 59), 
    usage slotState DEFAULT 'free',
    neId VARCHAR,
    host VARCHAR,
    FOREIGN KEY (rackId) REFERENCES rack (id),
    FOREIGN KEY (rackTsId) REFERENCES _rack (tsId)
);

---

CREATE TABLE IF NOT EXISTS _ne (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_ne') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    neId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    host VARCHAR NOT NULL CHECK (regexp_full_match(host,'(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])')), 
    mgmtIP VARCHAR NOT NULL CHECK (regexp_full_match(mgmtIP,'((?:(?:\d{1,3}\.){3}(?:\d{1,3}))|(?:(?:::)?(?:[\dA-Fa-f]{1,4}:{1,2}){1,7}(?:[\d\%A-Fa-z\.]+)?(?:::)?)|(?:::[\dA-Fa-f\.]{1,15})|(?:::))')),
    inetHost INET,
    inetMgmtIP INET,
    vendor VARCHAR NOT NULL, 
    model VARCHAR NOT NULL,
    image VARCHAR NOT NULL,
    version VARCHAR NOT NULL,
    commissioned TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    decommissioned TIMESTAMP,
    siteId VARCHAR NOT NULL,
    rackId VARCHAR NOT NULL,
    slotPosition VARCHAR NOT NULL CHECK (regexp_full_match(slotPosition,'([1-9]|[1-4][0-9]|5[0-8])+(,([1-9]|[1-4][0-9]|5[0-8]))?')),
    config VARCHAR USING COMPRESSION zstd, -- CLI, JSON, or XML content
    FOREIGN KEY (neId) REFERENCES ne (id),
    FOREIGN KEY (siteId) REFERENCES site (id),
    FOREIGN KEY (rackId) REFERENCES rack (id)
);

---
CREATE TABLE IF NOT EXISTS _nePort (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_nePort') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    source source NOT NULL DEFAULT 'historical',
    neId VARCHAR NOT NULL,
    neTsId INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    technology portTechnology NOT NULL,
    state portState NOT NULL DEFAULT 'free',
    errorCount INTEGER NOT NULL DEFAULT 0 CHECK (errorCount >= 0),
    FOREIGN KEY (neId) REFERENCES ne (id),
    FOREIGN KEY (neTsId) REFERENCES _ne (tsId)
);

---

CREATE TABLE IF NOT EXISTS _nePortCoax (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_nePortCoax') PRIMARY KEY,
    neTsId INTEGER NOT NULL,
    frequencyLow DECIMAL(6,2) NOT NULL DEFAULT 0.1 CHECK (frequencyLow >= 0.1 AND frequencyLow <= 100000),
    frequencyHigh DECIMAL(6,2) NOT NULL DEFAULT 100000 CHECK (frequencyHigh >= 0.1 AND frequencyHigh <= 100000),
    channels INTEGER DEFAULT 1 CHECK (channels >= 1 AND channels <= 512),
    width DECIMAL(6,2) DEFAULT 1 CHECK (width >= 0.1 AND width <= 100000),
    unit portCoaxConfigurationRate DEFAULT 'GHz',
    FOREIGN KEY (neTsId) REFERENCES _ne (tsId) 
);

---

CREATE TABLE IF NOT EXISTS _nePortEthernet (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_nePortEthernet') PRIMARY KEY,
    neTsId INTEGER NOT NULL,
    category portEthernetConfiguration NOT NULL DEFAULT 'Cat6A',
    rate INTEGER NOT NULL DEFAULT 10 CHECK (rate >= 1 AND rate <= 768),
    unit portEthernetConfigurationRate NOT NULL DEFAULT 'Gbps',
    FOREIGN KEY (neTsId) REFERENCES _ne (tsId) 
);

---

CREATE TABLE IF NOT EXISTS _nePortLoopback (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_nePortLoopback') PRIMARY KEY,
    neTsId INTEGER NOT NULL,
    rate INTEGER NOT NULL DEFAULT 10 CHECK (rate >= 1 AND rate <= 768),
    unit portEthernetConfigurationRate NOT NULL DEFAULT 'Gbps',
    FOREIGN KEY (neTsId) REFERENCES _ne (tsId) 
);

---

CREATE TABLE IF NOT EXISTS _nePortFiber (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_nePortFiber') PRIMARY KEY,
    neTsId INTEGER NOT NULL,
    rate INTEGER NOT NULL DEFAULT 1 CHECK (rate >= 1 AND rate <= 768),
    unit portFiberConfigurationRate NOT NULL DEFAULT 'Gbps',
    mode portFiberConfigurationMode NOT NULL DEFAULT 'SMOF',
    channels INTEGER DEFAULT 1 CHECK (channels >= 1 AND channels <= 512),
    width INTEGER DEFAULT 1 CHECK (width >= 1 AND width <= 1000),
    FOREIGN KEY (neTsId) REFERENCES _ne (tsId) 
);

---

CREATE TABLE IF NOT EXISTS _nePortXdsl (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_nePortXdsl') PRIMARY KEY,
    neTsId INTEGER NOT NULL,
    category portXdslConfiguration NOT NULL DEFAULT 'VDSL2',
    rate INTEGER NOT NULL DEFAULT 10 CHECK (rate >= 1 AND rate <= 100),
    unit portXdslConfigurationRate DEFAULT 'Mbps',
    FOREIGN KEY (neTsId) REFERENCES _ne (tsId) 
);

---

CREATE TABLE IF NOT EXISTS _nePortVirtual (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_nePortVirtual') PRIMARY KEY,
    neTsId INTEGER NOT NULL,
    rate INTEGER NOT NULL DEFAULT 10 CHECK (rate >= 1 AND rate <= 768),
    unit portEthernetConfigurationRate NOT NULL DEFAULT 'Gbps',
    FOREIGN KEY (neTsId) REFERENCES _ne (tsId) 
);

---

CREATE TABLE IF NOT EXISTS _service (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_service') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    serviceId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    reference VARCHAR NOT NULL,
    customerName VARCHAR,
    customerReference VARCHAR,
    commissioned TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    decommissioned TIMESTAMP,
    type serviceType NOT NULL DEFAULT 'unclassified',
    rate INTEGER NOT NULL DEFAULT 0 CHECK (rate >= 0 AND rate <= 768),
    unit portEthernetConfigurationRate NOT NULL DEFAULT 'Gbps',
    lagGroup VARCHAR,
    lagMembers INTEGER DEFAULT 0 CHECK (lagMembers >= 0 AND lagMembers <= 256),
    FOREIGN KEY (serviceId) REFERENCES service (id)
);

---

CREATE TABLE IF NOT EXISTS _serviceIngress (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_serviceIngress') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    source source NOT NULL DEFAULT 'historical',
    serviceId VARCHAR NOT NULL,
    serviceTsId INTEGER NOT NULL,
    neId VARCHAR NOT NULL,
    nePort VARCHAR NOT NULL,
    cVlanId INTEGER NOT NULL DEFAULT 0 CHECK (cVlanId >= 0 AND cVlanId <= 4095),
    sVlanId INTEGER NOT NULL DEFAULT 0 CHECK (sVlanId >= 0 AND sVlanId <= 4095),
    lagMember INTEGER DEFAULT 0 CHECK (lagMember >= 0 AND lagMember <= 256),
    FOREIGN KEY (serviceId) REFERENCES service (id),
    FOREIGN KEY (serviceTsId) REFERENCES _service (tsId),
    FOREIGN KEY (neId) REFERENCES ne (id)
);

---

CREATE TABLE IF NOT EXISTS _serviceEgress (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_serviceEgress') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    source source NOT NULL DEFAULT 'historical',
    serviceId VARCHAR NOT NULL,
    serviceTsId INTEGER NOT NULL,
    neId VARCHAR NOT NULL,
    nePort VARCHAR NOT NULL,
    cVlanId INTEGER NOT NULL DEFAULT 0 CHECK (cVlanId >= 0 AND cVlanId <= 4095),
    sVlanId INTEGER NOT NULL DEFAULT 0 CHECK (sVlanId >= 0 AND sVlanId <= 4095),
    lagMember INTEGER DEFAULT 0 CHECK (lagMember >= 0 AND lagMember <= 256),
    FOREIGN KEY (serviceId) REFERENCES service (id),
    FOREIGN KEY (serviceTsId) REFERENCES _service (tsId),
    FOREIGN KEY (neId) REFERENCES ne (id)
);


---
--- initial data population
---

INSERT INTO adminData (id,historicalDuration,historicalUnit,predictedDuration,predictedUnit) 
    VALUES (uuid(),1,'year',6,'month');

INSERT INTO alert (id,description,function) VALUES ('5c8d258b-94d7-4826-afe0-bfb9a4237332','Trench Utilization 75%','jobAlertTrenchUtil(75);');
INSERT INTO alert (id,description,function) VALUES ('d461d060-f19c-4c4a-956a-07a0997dd9b7','Trench Utilization 90%','jobAlertTrenchUtil(90);');
INSERT INTO alert (id,description,function) VALUES ('447441f9-8360-4dcb-8d30-440ccf113f64','Trench Utilization 100%','jobAlertTrenchUtil(100);');
INSERT INTO alert (id,description,function) VALUES ('6aaeef30-21aa-4bc1-adfd-97013d345816','Duct Utilization 75%','jobAlertDuctUtil(75);');
INSERT INTO alert (id,description,function) VALUES ('0749db4d-bccb-4ecc-b070-dc9f9b115737','Duct Utilization 90%','jobAlertDuctUtil(90);');
INSERT INTO alert (id,description,function) VALUES ('00f3868c-3304-4783-bb7a-904b093339b7','Duct Utilization 100%','jobAlertDuctUtil(100);');
INSERT INTO alert (id,description,function) VALUES ('20e5c10c-f6c5-4d4c-a91d-d7d338207b8f','Cable Utilization 75%','jobAlertCableUtil(75);');
INSERT INTO alert (id,description,function) VALUES ('24a49d2f-eb13-49ab-975c-fbbf678b924f','Cable Utilization 90%','jobAlertCableUtil(90);');
INSERT INTO alert (id,description,function) VALUES ('4e7387e8-f5e8-498f-9593-a2495dd0e630','Cable Utilization 100%','jobAlertCableUtil(100);');
INSERT INTO alert (id,description,function) VALUES ('c45b5854-0322-48c5-95e9-5c468c657bc8','Pole Utilization 75%','jobAlertPoleUtil(75);');
INSERT INTO alert (id,description,function) VALUES ('cc1fab4f-8f79-4e3d-b24d-8829e0fa1dbe','Pole Utilization 90%','jobAlertPoleUtil(90);');
INSERT INTO alert (id,description,function) VALUES ('7a5fb877-9fd0-4475-891a-7fcd7729bdac','Pole Utilization 100%','jobAlertPoleUtil(100);');
INSERT INTO alert (id,description,function) VALUES ('ac67b9b4-35d8-4c4b-94ed-3321aaf1a300','Rack Utilization 75%','jobAlertRackUtil(75);');
INSERT INTO alert (id,description,function) VALUES ('2555a838-2865-47d2-8f49-e191a955ff66','Rack Utilization 90%','jobAlertRackUtil(90);');
INSERT INTO alert (id,description,function) VALUES ('83075e1e-ce6b-4718-9490-cffb54f8d956','Rack Utilization 100%','jobAlertRackUtil(100);');
INSERT INTO alert (id,description,function) VALUES ('db97ee07-84eb-4de9-a7b8-7c6bc2d22500','NE Port Utilization 75%','jobAlertNePortUtil(75);');
INSERT INTO alert (id,description,function) VALUES ('e566960f-12c4-4ce6-bb29-f94d18d5a97c','NE Port Utilization 90%','jobAlertNePortUtil(90);');
INSERT INTO alert (id,description,function) VALUES ('7ec78138-0ce7-4344-96c5-0466b85b270e','NE Port Utilization 100%','jobAlertNePortUtil(100);');
INSERT INTO alert (id,description,function) VALUES ('4626b921-baf4-4457-a6e4-661e62ecdba1','Transmission Utilization 75%','jobAlertTransmissionUtil(75);');
INSERT INTO alert (id,description,function) VALUES ('596040f5-485e-47f5-a86f-578abee86c78','Transmission Utilization 90%','jobAlertTransmissionUtil(90);');
INSERT INTO alert (id,description,function) VALUES ('1a2701e3-6540-47c4-97ed-c24782089d61','Transmission Utilization 100%','jobAlertTransmissionUtil(100);');
INSERT INTO alert (id,description,function) VALUES ('87659ffc-a1a1-45b7-a704-84ef9cf4dd06','Service Bandwidth Utilization 75%','jobAlertServiceBandwidth(75);');
INSERT INTO alert (id,description,function) VALUES ('8626dcca-1a50-4ded-90c3-c918ad5af222','Service Bandwidth Utilization 90%','jobAlertServiceBandwidth(90);');
INSERT INTO alert (id,description,function) VALUES ('582d8c83-b5a9-47bb-8b34-cf1c8e610457','Service Bandwidth Utilization 100%','jobAlertServiceBandwidth(100);');
INSERT INTO alert (id,description,function) VALUES ('eafa41af-4007-44f1-88ee-870e8d60fe0c','NE Error Rates 75%','jobAlertNeErrorRates(75);');
INSERT INTO alert (id,description,function) VALUES ('c7dd4389-aa64-4f0a-83a9-f3c4988e8699','NE Error Rates 90%','jobAlertNeErrorRates(90);');
INSERT INTO alert (id,description,function) VALUES ('9108d9c0-1001-4c6f-b6f7-9d6e4cae0087','NE Error Rates 100%','jobAlertNeErrorRates(100);');
INSERT INTO alert (id,description,function) VALUES ('2e4866c7-14e4-4771-b3c5-cdd23e1ca8c5','NE Classifiers Utilization 75%','jobAlertNeClassifierUtil(75);');
INSERT INTO alert (id,description,function) VALUES ('7aa3a90d-10c1-40b4-8598-662083d6c462','NE Classifiers Utilization 90%','jobAlertNeClassifierUtil(90);');
INSERT INTO alert (id,description,function) VALUES ('e62df531-25e6-4b09-9a6d-9cf44b3eb77f','NE Classifiers Utilization 100%','jobAlertNeClassifierUtil(100);');
INSERT INTO alert (id,description,function) VALUES ('d863bc95-6e1b-4c2c-bea7-b6d55b808e85','NE CVE Scan','jobAlertNeCveScan();');
INSERT INTO alert (id,description,function) VALUES ('b7c0dbac-6871-4c92-a3f8-dfa925553319','Work Planning Efficiency 110%','jobAlertWpEfficiency(110);');
INSERT INTO alert (id,description,function) VALUES ('96ea3707-4d1f-4c7c-92c3-fa4e299135a0','Work Planning Efficiency 130%','jobAlertWpEfficiency(130);');
INSERT INTO alert (id,description,function) VALUES ('942c2393-6990-43bc-9971-4d7d1afa2ac1','Work Planning Efficiency 150%','jobAlertWpEfficiency(150);');
INSERT INTO alert (id,description,function) VALUES ('3ef7ae9e-44a6-447c-9763-b6886748b5d4','Data Quality - geometry alignment','jobAlertDqGeometryAlignment();');
INSERT INTO alert (id,description,function) VALUES ('c7284f1f-6b73-4eec-ab27-49337043679c','Data Quality - missing connectedTo','jobAlertDqMissingConnectedTo();');
INSERT INTO alert (id,description,function) VALUES ('4f726282-3328-421d-bd5c-2d2ba5f23f95','Data Quality - trench','jobAlertDqTrench();');
INSERT INTO alert (id,description,function) VALUES ('e2a65c2b-7b88-4500-bdd7-3d648b42aa94','Data Quality - cable','jobAlertDqCable();');
INSERT INTO alert (id,description,function) VALUES ('ed0cf860-4a8f-4b05-aa70-b4071fca9a40','Data Quality - duct','jobAlertDqDuct();');
INSERT INTO alert (id,description,function) VALUES ('e2a4a205-29fa-417a-a6d0-b3c39ac7877e','Data Quality - pole','jobAlertDqPole();');
INSERT INTO alert (id,description,function) VALUES ('52ae75e2-036d-4a99-813f-de6ba328fce9','Data Quality - NE','jobAlertDqNe();');
INSERT INTO alert (id,description,function) VALUES ('126a7d5a-77af-4e99-9b6e-31b1945d5365','Data Quality - service','jobAlertDqService();');
INSERT INTO alert (id,description,function) VALUES ('c54f88d9-d355-46e0-8fb2-9fa6ccdc4083','Data Quality - site','jobAlertDqSite();');
INSERT INTO alert (id,description,function) VALUES ('b034d9e8-da77-4b8c-8f44-d6eb6b6076a5','Data Quality - offNet Postal Addresses','jobAlertDqOffNetPAF();');

INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('1bcfd0c7-a082-479e-b815-c9d16f3cba1b','Australian dollar','$','AUD',false, 1.7927);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('c34355dd-7a42-4dd2-bb40-14b2b88fc20b','Brunei dollar','B$','BND',false, 1.49);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('1c18fbcc-d9ed-40f7-bbbb-e99201f381fe','Caribbean guilder','Cg','XCG',false, 2.11);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('c46d4309-d1e3-461a-99df-60d95aa4db4d','Central African CFA franc','F.CFA','XAF',false, 655.96);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('2dd7be90-22ae-43e3-a34f-1cd7b6e8c9f8','CFP franc','₣','XPF',false,119.26);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('5ed96e80-9829-4c80-ad2b-1bdcea793b66','Chilean peso','$','CLP',false,1104.88);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('e22fb15d-2d00-49ea-98cc-d20a77061c5c','Danish krone','kr','DKK',false,7.46);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('7e01ca3f-8320-4e50-aaf3-d2cc24ec8e78','Eastern Caribbean dollar','EC$','XCD',false, 3.17);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('578a82ad-a7ce-4f9c-ba5f-fbe27c1886f5','Euro','€','EUR',true,1);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('217b383a-7b9b-40e1-b059-f12651e4e072','Falkland Islands pound','£','FKP',false,0.84);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('bd703d99-ba3f-43ea-984a-f3bad74e380c','Indian rupee','₹','INR',false,100.18);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('9fe00db6-2105-45a0-a95e-ffbf842eb411','New Zealand dollar','$','NZD',false,1.93);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('2a402fcc-ea52-452d-83ea-a3c8fa15f470','Norwegian krone','kr','NOK',false,11.79);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('a70ab726-2d5d-4ad5-8233-a0556b39ac39','Russian ruble','₽','RUB',false,92.20);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('9cc46dc8-56bf-4a96-b072-d08de73e476c','Saint Helena pound','£','SHP',false,0.85);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('1eafc200-d5f7-460b-8012-fbb2dd00fc76','Singapore dollar','S$','SGD',false,1.49);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('2428a44a-0eaf-404a-ad42-1e64c588cade','South African rand','R','ZAR',false,20.97);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('007fa4b5-9776-4e99-a116-095398b5d47a','Sterling','£','GBP',false,0.85);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('9b9e9266-5439-4d55-97e6-af01a023d4ee','Swiss franc','Fr','CHF',false,0.94);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('18b4e171-c453-422f-8b5d-f7e824d59d0b','Turkish lira','₺','TRY',false,46.77);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('300e2d59-e873-4ecc-a3ad-58e44e3f3c03','United States dollar','$','USD',false,1.17);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('c738c6cd-2614-42a2-965b-25fa7a3a8050','West African CFA franc','F.CFA','XOF',false,655.96);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('c5f1a531-d219-4e24-94ed-f19deb1e4be1','Malaysian ringgit','RM','MYR',false,4.96);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('aa170720-91eb-49a0-9739-9667b67feb20','Mexican peso','$','MXN',false,22.13);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('3d9a53ce-3243-45e0-b948-fbb48ec03956','Moroccan dirham','DH','MAD',false,10.60);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('d21b542f-9e27-4b2f-a2b4-0071b74a5dc8','Indonesian rupiah','Rp','IDR',false,19006.00);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('e2a23cba-dcf2-4479-aaed-82259f6fcaef','Israeli new shekel','₪','ILS',false,3.97);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('9cb591c6-abe3-44ff-8058-c261a7730672','Japanese yen','¥','JPY',false,169.33);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('752c827d-16e0-40db-88fa-16f7d9eecf8f','Jordanian dinar','JD','JOD',false,0.83);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('23471b7e-da3b-4b71-b31b-33a139dada9f','Nigerian naira','₦','NGN',false,1811.20);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('873681db-6e23-4c63-baff-70cae4652e73','Qatari riyal','QR','QAR',false,4.28);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('a491e7a4-3b5a-44e9-abb2-7d3cb5810b8e','Swedish krona','kr','SEK',false,11.10);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('be8c6d3f-b44b-44c2-b2b7-9a368efcaa2c','Thai baht','฿','THB',false,38.22);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('d19d6d08-14e7-4bfc-92c9-cf0cd69ea4d8','Ukrainian hryvnia','₴','UAH',false,48.73);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('91e7d26b-4f51-4be5-9063-add3eb996922','Icelandic króna','kr','ISK',false,142.40);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('0cf0e7db-0561-446b-8950-0676153cb2ad','Hong Kong dollar','$','HKD',false,9.20);
INSERT INTO currency (id,name,symbol,isoCode,systemDefault,rateFromDefault) VALUES ('135bf965-b0cc-40b9-9681-a4eb825aabc5','Polish złoty','zł','PLN',false,4.24);

INSERT INTO costCable (technology, unit, costPerUnit) VALUES ('coax','m',1);
INSERT INTO costCable (technology, unit, costPerUnit) VALUES ('copper','m',1);
INSERT INTO costCable (technology, unit, costPerUnit) VALUES ('ethernet','m',1);
INSERT INTO costCable (technology, unit, costPerUnit) VALUES ('singleFiber','m',1);
INSERT INTO costCable (technology, unit, costPerUnit) VALUES ('multiFiber','m',1);

INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('duct',1,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('duct',10,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('duct',12,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('duct',14,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('duct',19,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('duct',2,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('duct',24,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('duct',3,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('duct',48,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('duct',5,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('duct',6,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('duct',7,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('duct',8,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('microduct',1,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('microduct',10,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('microduct',12,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('microduct',14,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('microduct',19,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('microduct',2,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('microduct',24,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('microduct',3,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('microduct',5,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('microduct',6,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('microduct',7,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('microduct',8,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('subduct',1,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('subduct',10,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('subduct',12,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('subduct',14,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('subduct',19,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('subduct',2,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('subduct',24,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('subduct',3,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('subduct',48,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('subduct',5,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('subduct',6,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('subduct',7,'m',1);
INSERT INTO costDuct (category, configuration, unit, costPerUnit) VALUES ('subduct',8,'m',1);

INSERT INTO costNe (vendor,model,costPerUnit) VALUES ('Cisco Systems, Inc.','C8300-1N1S-4T2X',7199.61);
INSERT INTO costNe (vendor,model,costPerUnit) VALUES ('Juniper Networks','MX240',27250.00);

INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('backhaul','commercial',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('backhaul','highways',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('backhaul','rural',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('backhaul','unclassified',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('backhaul','urban',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('link','commercial',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('link','highways',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('link','rural',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('link','unclassified',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('link','urban',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('service/drop','commercial',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('service/drop','highways',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('service/drop','residential',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('service/drop','rural',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('service/drop','unclassified',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('service/drop','urban',1);
INSERT INTO costPole (purpose, classifier, costPerUnit) VALUES ('unclassified','unclassified',1);

INSERT INTO costRack (slots,costPerUnit) VALUES (1,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (2,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (3,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (4,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (5,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (6,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (7,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (8,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (9,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (10,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (11,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (12,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (13,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (14,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (15,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (16,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (17,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (18,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (19,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (20,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (21,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (22,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (23,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (24,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (25,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (26,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (27,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (28,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (29,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (30,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (31,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (32,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (33,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (34,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (35,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (36,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (37,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (38,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (39,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (40,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (41,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (42,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (43,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (44,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (45,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (46,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (47,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (48,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (49,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (50,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (51,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (52,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (53,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (54,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (55,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (56,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (57,1);
INSERT INTO costRack (slots,costPerUnit) VALUES (58,1);

INSERT INTO costService (type,rate,unit,lagMembers,costPerUnit) VALUES ('broadband',67,'Mbps',0,31.23);
INSERT INTO costService (type,rate,unit,lagMembers,costPerUnit) VALUES ('optical',1,'Gbps',0,256.78);
INSERT INTO costService (type,rate,unit,lagMembers,costPerUnit) VALUES ('optical',1,'Gbps',2,512.34);
INSERT INTO costService (type,rate,unit,lagMembers,costPerUnit) VALUES ('sogea',1,'Gbps',0,62.46);
INSERT INTO costService (type,rate,unit,lagMembers,costPerUnit) VALUES ('unclassified',0,'Gbps',0,100.00);

INSERT INTO costSite (area,type,costPerUnit) VALUES ('industrial','colo',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('industrial','dc',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('industrial','exchange',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('industrial','pop',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('industrial','street',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('industrial','unclassified',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('mixed','colo',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('mixed','dc',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('mixed','exchange',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('mixed','pop',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('mixed','street',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('mixed','unclassified',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('psz','colo',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('psz','exchange',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('psz','pop',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('psz','street',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('psz','unclassified',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('residential','street',2);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('residential','unclassified',4);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('rural','colo',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('rural','exchange',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('rural','pop',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('rural','street',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('rural','unclassified',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('unclassified','unclassified',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('urban','colo',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('urban','exchange',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('urban','pop',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('urban','street',1);
INSERT INTO costSite (area,type,costPerUnit) VALUES ('urban','unclassified',1);

INSERT INTO costTrench (purpose,unit,costPerUnit) VALUES ('backhaul','m',10.00);
INSERT INTO costTrench (purpose,unit,costPerUnit) VALUES ('pole','m',6.50);
INSERT INTO costTrench (purpose,unit,costPerUnit) VALUES ('ring','m',8.50);
INSERT INTO costTrench (purpose,unit,costPerUnit) VALUES ('service/drop','m',5.00);
INSERT INTO costTrench (purpose,unit,costPerUnit) VALUES ('tower','m',7.50);
INSERT INTO costTrench (purpose,type,unit,costPerUnit) VALUES ('unclassified','backhoe','m',15.00);
INSERT INTO costTrench (purpose,type,unit,costPerUnit) VALUES ('unclassified','inline','m',20.00);
INSERT INTO costTrench (purpose,type,unit,costPerUnit) VALUES ('unclassified','large','m',30.00);
INSERT INTO costTrench (purpose,type,unit,costPerUnit) VALUES ('unclassified','micro','m',5.00);
INSERT INTO costTrench (purpose,type,unit,costPerUnit) VALUES ('unclassified','narrow','m',10.00);
INSERT INTO costTrench (purpose,type,unit,costPerUnit) VALUES ('unclassified','portable','m',25.00);

--
-- EOF
--
