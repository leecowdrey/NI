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
--INSTALL inet;
--LOAD inet;
-- see https://duckdb.org/docs/extensions/icu
--INSTALL icu;
--LOAD icu;

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
CREATE TYPE cableTechnology AS ENUM ('coax','ethernet','copper','fiber');
CREATE TYPE constructionType AS ENUM ('micro','narrow','hang-dug','backhoe','inline','portable','large');
CREATE TYPE countryCode AS ENUM ( 'ABW', 'AFG', 'AGO', 'AIA', 'ALA', 'ALB', 'AND', 'ARE', 'ARG', 'ARM', 'ASM', 'ATA', 'ATF', 'ATG', 'AUS', 'AUT', 'AZE', 'BDI', 'BEL', 'BEN', 'BES', 'BFA', 'BGD', 'BGR', 'BHR', 'BHS', 'BIH', 'BLM', 'BLR', 'BLZ', 'BMU', 'BOL', 'BRA', 'BRB', 'BRN', 'BTN', 'BVT', 'BWA', 'CAF', 'CAN', 'CCK', 'CHE', 'CHL', 'CHN', 'CIV', 'CMR', 'COD', 'COG', 'COK', 'COL', 'COM', 'CPV', 'CRI', 'CUB', 'CUW', 'CXR', 'CYM', 'CYP', 'CZE', 'DEU', 'DJI', 'DMA', 'DNK', 'DOM', 'DZA', 'ECU', 'EGY', 'ERI', 'ESH', 'ESP', 'EST', 'ETH', 'FIN', 'FJI', 'FLK', 'FRA', 'FRO', 'FSM', 'GAB', 'GBR', 'GEO', 'GGY', 'GHA', 'GIB', 'GIN', 'GLP', 'GMB', 'GNB', 'GNQ', 'GRC', 'GRD', 'GRL', 'GTM', 'GUF', 'GUM', 'GUY', 'HKG', 'HMD', 'HND', 'HRV', 'HTI', 'HUN', 'IDN', 'IMN', 'IND', 'IOT', 'IRL', 'IRN', 'IRQ', 'ISL', 'ISR', 'ITA', 'JAM', 'JEY', 'JOR', 'JPN', 'KAZ', 'KEN', 'KGZ', 'KHM', 'KIR', 'KNA', 'KOR', 'KWT', 'LAO', 'LBN', 'LBR', 'LBY', 'LCA', 'LIE', 'LKA', 'LSO', 'LTU', 'LUX', 'LVA', 'MAC', 'MAF', 'MAR', 'MCO', 'MDA', 'MDG', 'MDV', 'MEX', 'MHL', 'MKD', 'MLI', 'MLT', 'MMR', 'MNE', 'MNG', 'MNP', 'MOZ', 'MRT', 'MSR', 'MTQ', 'MUS', 'MWI', 'MYS', 'MYT', 'NAM', 'NCL', 'NER', 'NFK', 'NGA', 'NIC', 'NIU', 'NLD', 'NOR', 'NPL', 'NRU', 'NZL', 'OMN', 'PAK', 'PAN', 'PCN', 'PER', 'PHL', 'PLW', 'PNG', 'POL', 'PRI', 'PRK', 'PRT', 'PRY', 'PSE', 'PYF', 'QAT', 'REU', 'ROU', 'RUS', 'RWA', 'SAU', 'SDN', 'SEN', 'SGP', 'SGS', 'SHN', 'SJM', 'SLB', 'SLE', 'SLV', 'SMR', 'SOM', 'SPM', 'SRB', 'SSD', 'STP', 'SUR', 'SVK', 'SVN', 'SWE', 'SWZ', 'SXM', 'SYC', 'SYR', 'TCA', 'TCD', 'TGO', 'THA', 'TJK', 'TKL', 'TKM', 'TLS', 'TON', 'TTO', 'TUN', 'TUR', 'TUV', 'TWN', 'TZA', 'UGA', 'UKR', 'UMI', 'URY', 'USA', 'UZB', 'VAT', 'VCT', 'VEN', 'VGB', 'VIR', 'VNM', 'VUT', 'WLF', 'WSM', 'YEM', 'ZAF', 'ZMB', 'ZWE' );
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
CREATE TYPE siteType AS ENUM ('street','exchange','pop','dc','colo','unclassified');
CREATE TYPE sizeUnit AS ENUM ('cm','mm','m','inch','feet');
CREATE TYPE source AS ENUM ('historical','predicted');
CREATE TYPE trenchPurpose AS ENUM ('service/drop','link','backhaul','unclassified');
CREATE TYPE trenchState AS ENUM ('free','used','reserved','faulty');
CREATE TYPE workflowEngineType AS ENUM ('bpmn','elsa');

---
--- sequences
---
CREATE SEQUENCE IF NOT EXISTS seq_alertQueue;
CREATE SEQUENCE IF NOT EXISTS seq_predictQueue;
CREATE SEQUENCE IF NOT EXISTS seq_trench;
CREATE SEQUENCE IF NOT EXISTS seq_trenchCoordinate;
CREATE SEQUENCE IF NOT EXISTS seq_duct;
CREATE SEQUENCE IF NOT EXISTS seq_site;
CREATE SEQUENCE IF NOT EXISTS seq_pole;
CREATE SEQUENCE IF NOT EXISTS seq_cable;
CREATE SEQUENCE IF NOT EXISTS seq_cableCoax;
CREATE SEQUENCE IF NOT EXISTS seq_cableEthernet;
CREATE SEQUENCE IF NOT EXISTS seq_cableSingleFiber;
CREATE SEQUENCE IF NOT EXISTS seq_cableMultiFiber;
CREATE SEQUENCE IF NOT EXISTS seq_cableCopper;
CREATE SEQUENCE IF NOT EXISTS seq_rack;
CREATE SEQUENCE IF NOT EXISTS seq_ne;
CREATE SEQUENCE IF NOT EXISTS seq_nePort;
CREATE SEQUENCE IF NOT EXISTS seq_nePortCoax;
CREATE SEQUENCE IF NOT EXISTS seq_nePortEthernet;
CREATE SEQUENCE IF NOT EXISTS seq_nePortFiber;
CREATE SEQUENCE IF NOT EXISTS seq_nePortLoopback;
CREATE SEQUENCE IF NOT EXISTS seq_nePortXdsl;
CREATE SEQUENCE IF NOT EXISTS seq_nePortVirtual;
CREATE SEQUENCE IF NOT EXISTS seq_service;
CREATE SEQUENCE IF NOT EXISTS seq_serviceIngress;
CREATE SEQUENCE IF NOT EXISTS seq_serviceEgress;

---
--- parent referential tables
---
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
CREATE TABLE IF NOT EXISTS nePort (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    neId VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    predictedTsId INTEGER,
    FOREIGN KEY (neId) REFERENCES ne (id)
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
    onNet NOT NULL BOOLEAN DEFAULT false,
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
    rate INTEGER NOT NULL DEFAULT 10 CHECK (rate >= 1 AND rate <= 200),
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
    slotsTotal INTEGER NOT NULL DEFAULT 42 CHECK (slotsTotal >= 1 AND slotsTotal <= 50),
    slotsFree INTEGER NOT NULL DEFAULT 42 CHECK (slotsFree >= 0 AND slotsFree <= slotsTotal),
    slotsUsed INTEGER NOT NULL DEFAULT 0 CHECK (slotsUsed >= 0 AND slotsUsed <= slotsTotal),
    slotsReserved INTEGER NOT NULL DEFAULT 0 CHECK (slotsReserved >= 0 AND slotsReserved <= slotsTotal),
    slotsFaulty INTEGER NOT NULL DEFAULT 0 CHECK (slotsFaulty >= 0 AND slotsFaulty <= slotsTotal),
    FOREIGN KEY (rackId) REFERENCES rack (id),
    FOREIGN KEY (siteId) REFERENCES site (id)
);

---

CREATE TABLE IF NOT EXISTS _ne (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_ne') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    neId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    host VARCHAR NOT NULL CHECK (regexp_full_match(host,'(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])')), 
    mgmtIP VARCHAR NOT NULL CHECK (regexp_full_match(mgmtIP,'((?:(?:\d{1,3}\.){3}(?:\d{1,3}))|(?:(?:::)?(?:[\dA-Fa-f]{1,4}:{1,2}){1,7}(?:[\d\%A-Fa-z\.]+)?(?:::)?)|(?:::[\dA-Fa-f\.]{1,15})|(?:::))')),
    vendor VARCHAR NOT NULL, 
    model VARCHAR NOT NULL,
    image VARCHAR NOT NULL,
    version VARCHAR NOT NULL,
    commissioned TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    decommissioned TIMESTAMP,
    siteId VARCHAR NOT NULL,
    rackId VARCHAR NOT NULL,
    slotPosition INTEGER NOT NULL CHECK (slotPosition >= 1 AND slotPosition <= 50),
    FOREIGN KEY (neId) REFERENCES ne (id),
    FOREIGN KEY (siteId) REFERENCES site (id),
    FOREIGN KEY (rackId) REFERENCES rack (id)
);

---

CREATE TABLE IF NOT EXISTS _nePort (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_nePort') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    nePortId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    neId VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    technology portTechnology NOT NULL,
    state portState NOT NULL DEFAULT 'free',
    FOREIGN KEY (nePortId) REFERENCES nePort (id),
    FOREIGN KEY (neId) REFERENCES ne (id)
);

---

CREATE TABLE IF NOT EXISTS _nePortCoax (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_nePortCoax') PRIMARY KEY,
    nePortTsId INTEGER NOT NULL,
    frequencyLow DECIMAL(6,2) NOT NULL DEFAULT 0.1 CHECK (frequencyLow >= 0.1 AND frequencyLow <= 100000),
    frequencyHigh DECIMAL(6,2) NOT NULL DEFAULT 100000 CHECK (frequencyHigh >= 0.1 AND frequencyHigh <= 100000),
    channels INTEGER DEFAULT 1 CHECK (channels >= 1 AND channels <= 512),
    width DECIMAL(6,2) DEFAULT 1 CHECK (width >= 0.1 AND width <= 100000),
    unit portCoaxConfigurationRate DEFAULT 'GHz',
    FOREIGN KEY (nePortTsId) REFERENCES _nePort (tsId) 
);

---

CREATE TABLE IF NOT EXISTS _nePortEthernet (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_nePortEthernet') PRIMARY KEY,
    nePortTsId INTEGER NOT NULL,
    category portEthernetConfiguration NOT NULL DEFAULT 'Cat6A',
    rate INTEGER NOT NULL DEFAULT 10 CHECK (rate >= 1 AND rate <= 200),
    unit portEthernetConfigurationRate NOT NULL DEFAULT 'Gbps',
    FOREIGN KEY (nePortTsId) REFERENCES _nePort (tsId) 
);

---

CREATE TABLE IF NOT EXISTS _nePortLoopback (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_nePortLoopback') PRIMARY KEY,
    nePortTsId INTEGER NOT NULL,
    rate INTEGER NOT NULL DEFAULT 10 CHECK (rate >= 1 AND rate <= 200),
    unit portEthernetConfigurationRate NOT NULL DEFAULT 'Gbps',
    FOREIGN KEY (nePortTsId) REFERENCES _nePort (tsId) 
);

---

CREATE TABLE IF NOT EXISTS _nePortFiber (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_nePortFiber') PRIMARY KEY,
    nePortTsId INTEGER NOT NULL,
    rate INTEGER NOT NULL DEFAULT 1 CHECK (rate >= 1 AND rate <= 200),
    unit portFiberConfigurationRate NOT NULL DEFAULT 'Gbps',
    mode portFiberConfigurationMode NOT NULL DEFAULT 'SMOF',
    channels INTEGER DEFAULT 1 CHECK (channels >= 1 AND channels <= 512),
    width INTEGER DEFAULT 1 CHECK (width >= 1 AND width <= 1000),
    FOREIGN KEY (nePortTsId) REFERENCES _nePort (tsId) 
);

---

CREATE TABLE IF NOT EXISTS _nePortXdsl (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_nePortXdsl') PRIMARY KEY,
    nePortTsId INTEGER NOT NULL,
    category portXdslConfiguration NOT NULL DEFAULT 'VDSL2',
    rate INTEGER NOT NULL DEFAULT 10 CHECK (rate >= 1 AND rate <= 100),
    unit portXdslConfigurationRate DEFAULT 'Mbps',
    FOREIGN KEY (nePortTsId) REFERENCES _nePort (tsId) 
);

---

CREATE TABLE IF NOT EXISTS _nePortVirtual (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_nePortVirtual') PRIMARY KEY,
    nePortTsId INTEGER NOT NULL,
    rate INTEGER NOT NULL DEFAULT 10 CHECK (rate >= 1 AND rate <= 200),
    unit portEthernetConfigurationRate NOT NULL DEFAULT 'Gbps',
    FOREIGN KEY (nePortTsId) REFERENCES _nePort (tsId) 
);

---

CREATE TABLE IF NOT EXISTS _service (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_service') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    serviceId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    reference VARCHAR,
    customerName VARCHAR,
    customerReference VARCHAR,
    commissioned TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    decommissioned TIMESTAMP,
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
    nePortId VARCHAR NOT NULL,
    cVlanId INTEGER NOT NULL DEFAULT 0 CHECK (cVlanId >= 0 AND cVlanId <= 4095),
    sVlanId INTEGER NOT NULL DEFAULT 0 CHECK (sVlanId >= 0 AND sVlanId <= 4095),
    lagMember INTEGER DEFAULT 0 CHECK (lagMember >= 0 AND lagMember <= 256),
    FOREIGN KEY (serviceId) REFERENCES service (id),
    FOREIGN KEY (serviceTsId) REFERENCES _service (tsId),
    FOREIGN KEY (neId) REFERENCES ne (id),
    FOREIGN KEY (nePortId) REFERENCES nePort (id)
);

---

CREATE TABLE IF NOT EXISTS _serviceEgress (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_serviceEgress') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    source source NOT NULL DEFAULT 'historical',
    serviceId VARCHAR NOT NULL,
    serviceTsId INTEGER NOT NULL,
    neId VARCHAR NOT NULL,
    nePortId VARCHAR NOT NULL,
    cVlanId INTEGER NOT NULL DEFAULT 0 CHECK (cVlanId >= 0 AND cVlanId <= 4095),
    sVlanId INTEGER NOT NULL DEFAULT 0 CHECK (sVlanId >= 0 AND sVlanId <= 4095),
    lagMember INTEGER DEFAULT 0 CHECK (lagMember >= 0 AND lagMember <= 256),
    FOREIGN KEY (serviceId) REFERENCES service (id),
    FOREIGN KEY (serviceTsId) REFERENCES _service (tsId),
    FOREIGN KEY (neId) REFERENCES ne (id),
    FOREIGN KEY (nePortId) REFERENCES nePort (id)
);


---
--- initial data population
---

INSERT INTO adminData (id,historicalDuration,historicalUnit,predictedDuration,predictedUnit) 
    VALUES (uuid(),6,'month',1,'month');

INSERT INTO alert (id,description) VALUES ('5c8d258b-94d7-4826-afe0-bfb9a4237332','Trench Utilization 75%','jobAlertTrenchUtil(75);');
INSERT INTO alert (id,description) VALUES ('d461d060-f19c-4c4a-956a-07a0997dd9b7','Trench Utilization 90%','jobAlertTrenchUtil(90);');
INSERT INTO alert (id,description) VALUES ('447441f9-8360-4dcb-8d30-440ccf113f64','Trench Utilization 100%','jobAlertTrenchUtil(100);');
INSERT INTO alert (id,description) VALUES ('6aaeef30-21aa-4bc1-adfd-97013d345816','Duct Utilization 75%','jobAlertDuctUtil(75);');
INSERT INTO alert (id,description) VALUES ('0749db4d-bccb-4ecc-b070-dc9f9b115737','Duct Utilization 90%','jobAlertDuctUtil(90);');
INSERT INTO alert (id,description) VALUES ('00f3868c-3304-4783-bb7a-904b093339b7','Duct Utilization 100%','jobAlertDuctUtil(100);');
INSERT INTO alert (id,description) VALUES ('20e5c10c-f6c5-4d4c-a91d-d7d338207b8f','Cable Utilization 75%','jobAlertCableUtil(75);');
INSERT INTO alert (id,description) VALUES ('24a49d2f-eb13-49ab-975c-fbbf678b924f','Cable Utilization 90%','jobAlertCableUtil(90);');
INSERT INTO alert (id,description) VALUES ('4e7387e8-f5e8-498f-9593-a2495dd0e630','Cable Utilization 100%','jobAlertCableUtil(100);');
INSERT INTO alert (id,description) VALUES ('c45b5854-0322-48c5-95e9-5c468c657bc8','Pole Utilization 75%','jobAlertPoleUtil(75);');
INSERT INTO alert (id,description) VALUES ('cc1fab4f-8f79-4e3d-b24d-8829e0fa1dbe','Pole Utilization 90%','jobAlertPoleUtil(90);');
INSERT INTO alert (id,description) VALUES ('7a5fb877-9fd0-4475-891a-7fcd7729bdac','Pole Utilization 100%','jobAlertPoleUtil(100);');
INSERT INTO alert (id,description) VALUES ('ac67b9b4-35d8-4c4b-94ed-3321aaf1a300','Rack Utilization 75%','jobAlertRackUtil(75);');
INSERT INTO alert (id,description) VALUES ('2555a838-2865-47d2-8f49-e191a955ff66','Rack Utilization 90%','jobAlertRackUtil(90);');
INSERT INTO alert (id,description) VALUES ('83075e1e-ce6b-4718-9490-cffb54f8d956','Rack Utilization 100%','jobAlertRackUtil(100);');
INSERT INTO alert (id,description) VALUES ('db97ee07-84eb-4de9-a7b8-7c6bc2d22500','NE Port Utilization 75%','jobAlertNePortUtil(75);');
INSERT INTO alert (id,description) VALUES ('e566960f-12c4-4ce6-bb29-f94d18d5a97c','NE Port Utilization 90%','jobAlertNePortUtil(90);');
INSERT INTO alert (id,description) VALUES ('7ec78138-0ce7-4344-96c5-0466b85b270e','NE Port Utilization 100%','jobAlertNePortUtil(100);');
INSERT INTO alert (id,description) VALUES ('4626b921-baf4-4457-a6e4-661e62ecdba1','Transmission Utilization 75%','jobAlertTransmissionUtil(75);');
INSERT INTO alert (id,description) VALUES ('596040f5-485e-47f5-a86f-578abee86c78','Transmission Utilization 90%','jobAlertTransmissionUtil(90);');
INSERT INTO alert (id,description) VALUES ('1a2701e3-6540-47c4-97ed-c24782089d61','Transmission Utilization 100%','jobAlertTransmissionUtil(100);');
INSERT INTO alert (id,description) VALUES ('87659ffc-a1a1-45b7-a704-84ef9cf4dd06','Service Bandwidth Utilization 75%','jobAlertServiceBandwidth(75);');
INSERT INTO alert (id,description) VALUES ('8626dcca-1a50-4ded-90c3-c918ad5af222','Service Bandwidth Utilization 90%','jobAlertServiceBandwidth(90);');
INSERT INTO alert (id,description) VALUES ('582d8c83-b5a9-47bb-8b34-cf1c8e610457','Service Bandwidth Utilization 100%','jobAlertServiceBandwidth(100);');
INSERT INTO alert (id,description) VALUES ('eafa41af-4007-44f1-88ee-870e8d60fe0c','NE Error Rates 75%','jobAlertNeErrorRates(75);');
INSERT INTO alert (id,description) VALUES ('c7dd4389-aa64-4f0a-83a9-f3c4988e8699','NE Error Rates 90%','jobAlertNeErrorRates(90);');
INSERT INTO alert (id,description) VALUES ('9108d9c0-1001-4c6f-b6f7-9d6e4cae0087','NE Error Rates 100%','jobAlertNeErrorRates(100);');
INSERT INTO alert (id,description) VALUES ('2e4866c7-14e4-4771-b3c5-cdd23e1ca8c5','NE Classifiers Utilization 75%','jobAlertNeClassifierUtil(75);');
INSERT INTO alert (id,description) VALUES ('7aa3a90d-10c1-40b4-8598-662083d6c462','NE Classifiers Utilization 90%','jobAlertNeClassifierUtil(90);');
INSERT INTO alert (id,description) VALUES ('e62df531-25e6-4b09-9a6d-9cf44b3eb77f','NE Classifiers Utilization 100%','jobAlertNeClassifierUtil(100);');
INSERT INTO alert (id,description) VALUES ('b7c0dbac-6871-4c92-a3f8-dfa925553319','Work Planning Efficiency 110%','jobAlertWpEfficiency(110);');
INSERT INTO alert (id,description) VALUES ('96ea3707-4d1f-4c7c-92c3-fa4e299135a0','Work Planning Efficiency 130%','jobAlertWpEfficiency(130);');
INSERT INTO alert (id,description) VALUES ('942c2393-6990-43bc-9971-4d7d1afa2ac1','Work Planning Efficiency 150%','jobAlertWpEfficiency(150);');
INSERT INTO alert (id,description) VALUES ('3ef7ae9e-44a6-447c-9763-b6886748b5d4','Data Quality - geometry alignment','jobAlertDqGeometryAlignment();');
INSERT INTO alert (id,description) VALUES ('c7284f1f-6b73-4eec-ab27-49337043679c','Data Quality - missing connectedTo','jobAlertDqMissingConnectedTo();');
INSERT INTO alert (id,description) VALUES ('4f726282-3328-421d-bd5c-2d2ba5f23f95','Data Quality - trench','jobAlertDqTrench();');
INSERT INTO alert (id,description) VALUES ('e2a65c2b-7b88-4500-bdd7-3d648b42aa94','Data Quality - cable','jobAlertDqCable();');
INSERT INTO alert (id,description) VALUES ('ed0cf860-4a8f-4b05-aa70-b4071fca9a40','Data Quality - duct','jobAlertDqDuct();');
INSERT INTO alert (id,description) VALUES ('e2a4a205-29fa-417a-a6d0-b3c39ac7877e','Data Quality - pole','jobAlertDqPole();');
INSERT INTO alert (id,description) VALUES ('52ae75e2-036d-4a99-813f-de6ba328fce9','Data Quality - NE','jobAlertDqNe();');
INSERT INTO alert (id,description) VALUES ('126a7d5a-77af-4e99-9b6e-31b1945d5365','Data Quality - service','jobAlertDqService();');
INSERT INTO alert (id,description) VALUES ('c54f88d9-d355-46e0-8fb2-9fa6ccdc4083','Data Quality - site','jobAlertDqSite();');
INSERT INTO alert (id,description) VALUES ('b034d9e8-da77-4b8c-8f44-d6eb6b6076a5','Data Quality - offNet Postal Addresses','jobAlertDqOffNetPAF();');

--
-- EOF
--
