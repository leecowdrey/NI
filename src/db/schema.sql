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
-- INSTALL inet;
-- LOAD inet;

-- see https://github.com/duckdb/duckdb-spatial/blob/main/docs/example.md
INSTALL spatial;
LOAD spatial;

---
--- custom types (ENUMs to match Open API)
---

CREATE TYPE aggregationUnit AS ENUM ('hour','day','week','month','quarter','half-year','year');
CREATE TYPE areaType AS ENUM ('residential','rural','industrial','mixed','psz','urban','unclassified','utility');
CREATE TYPE alertType AS ENUM ('callback','publish','notify','workflow');
CREATE TYPE restAuthentication AS ENUM ('none','basic','oidc','token');
CREATE TYPE cableCoaxConfigurationFrequency AS ENUM ('MHz','GHz');
CREATE TYPE cableEthernetConfiguration AS ENUM ('Cat3','Cat4','Cat5','Cat5e','Cat6','Cat6A','Cat7','Cat8');
CREATE TYPE cableEthernetConfigurationRate AS ENUM ('Mbps','Gbps','Tbps');
CREATE TYPE cableFiberConfigurationMode AS ENUM ('SMOF','MMOF');
CREATE TYPE cableFiberConfigurationRate AS ENUM ('Gbps','Tbps');
CREATE TYPE cableState AS ENUM ('free','used','reserved','faulty');
CREATE TYPE cableTechnology AS ENUM ('coax','ethernet','copper','singleFiber','multiFiber');
CREATE TYPE constructionType AS ENUM ('micro','narrow','hand-dug','backhoe','inline','portable','large', 'unclassified');
CREATE TYPE countryCode AS ENUM (
  'ABW','AFG','AGO','AIA','ALB','AND','ARE','ARG','ARM','ASM','ATA','ATF','ATG','AUS','AUT','AZE','BDI','BEL','BEN','BES','BFA','BGD','BGR','BHR','BHS','BIH','BLM','BLR','BLZ','BMU','BOL','BRA','BRB','BRN','BTN','BWA','CAF','CAN','CHE','CHL','CHN','CIV','CMR','COD','COG','COK','COL','COM','CPV','CRI','CUB','CUW','CYM','CYP','CZE','DEU','DJI','DMA','DNK','DOM','DZA','ECU','EGY','ERI','ESP','EST','ETH','FIN','FJI','FLK','FRA','FRO','FSM','GAB','GBR','GEO','GGY','GHA','GIB','GIN','GLP','GMB','GNB','GNQ','GRC','GRD','GRL','GTM','GUF','GUM','GUY','HND','HRV','HTI','HUN','IDN','IMN','IND','IRL','IRN','IRQ','ISL','ISR','ITA','JAM','JOR','JPN','KAZ','KEN','KGZ','KHM','KIR','KNA','KOR','KWT','LAO','LBN','LBR','LBY','LCA','LIE','LKA','LSO','LTU','LUX','LVA','MAR','MCO','MDA','MDG','MDV','MEX','MHL','MKD','MLI','MLT','MMR','MNE','MNG','MNP','MOZ','MRT','MSR','MTQ','MUS','MWI','MYS','MYT','NAM','NCL','NER','NGA','NIC','NIU','NLD','NOR','NPL','NRU','NZL','OMN','PAK','PAN','PCN','PER','PHL','PLW','PNG','POL','PRK','PRT','PRY','PSE','PYF','QAT','REU','ROU','RUS','RWA','SAU','SDN','SEN','SGP','SHN','SLB','SLE','SLV','SMR','SOM','SRB','SSD','STP','SUR','SVK','SVN','SWE','SWZ','SYC','SYR','TCA','TCD','TGO','THA','TJK','TKL','TKM','TLS','TON','TTO','TUN','TUR','TUV','TWN','TZA','UGA','UKR','URY','USA','UZB','VAT','VCT','VEN','VGB','VIR','VNM','VUT','WLF','WSM','YEM','ZAF','ZMB','ZWE'
);
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
CREATE TYPE correlationType AS ENUM ('cable','duct','ne','other','pole','rack','service','site','trench','unknown');
CREATE TYPE fetchProtocol AS ENUM ('email','http','mysql','netconf','oracle','snmp','scp','ftp','ssh','telnet','workflow','none');
CREATE TYPE heightClassifier AS ENUM ('residential','rural','commercial','urban','highways','unclassified');
CREATE TYPE ianaMimeType AS ENUM ('*/*','application/1d-interleaved-parityfec','application/3gpdash-qoe-report+xml','application/3gpp-ims+xml','application/3gppHal+json','application/3gppHalForms+json','application/A2L','application/ace-groupcomm+cbor','application/ace-trl+cbor','application/ace+cbor','application/ace+json','application/activemessage','application/activity+json','application/aif+cbor','application/aif+json','application/alto-cdni+json','application/alto-cdnifilter+json','application/alto-costmap+json','application/alto-costmapfilter+json','application/alto-directory+json','application/alto-endpointcost+json','application/alto-endpointcostparams+json','application/alto-endpointprop+json','application/alto-endpointpropparams+json','application/alto-error+json','application/alto-networkmap+json','application/alto-networkmapfilter+json','application/alto-propmap+json','application/alto-propmapparams+json','application/alto-tips+json','application/alto-tipsparams+json','application/alto-updatestreamcontrol+json','application/alto-updatestreamparams+json','application/AML','application/andrew-inset','application/applefile','application/at+jwt','application/ATF','application/ATFX','application/atom+xml','application/atomcat+xml','application/atomdeleted+xml','application/atomicmail','application/atomsvc+xml','application/atsc-dwd+xml','application/atsc-dynamic-event-message','application/atsc-held+xml','application/atsc-rdt+json','application/atsc-rsat+xml','application/ATXML','application/auth-policy+xml','application/automationml-aml+xml','application/automationml-amlx+zip','application/bacnet-xdd+zip','application/batch-SMTP','application/beep+xml','application/bufr','application/c2pa','application/calendar+json','application/calendar+xml','application/call-completion','application/CALS-1840','application/captive+json','application/cbor','application/cbor-seq','application/cccex','application/ccmp+xml','application/ccxml+xml','application/cda+xml','application/CDFX+XML','application/cdmi-capability','application/cdmi-container','application/cdmi-domain','application/cdmi-object','application/cdmi-queue','application/cdni','application/ce+cbor','application/CEA','application/cea-2018+xml','application/cellml+xml','application/cfw','application/cid','application/cid-edhoc+cbor-seq','application/city+json','application/city+json-seq','application/clr','application/clue_info+xml','application/clue+xml','application/cms','application/cnrp+xml','application/coap-eap','application/coap-group+json','application/coap-payload','application/commonground','application/concise-problem-details+cbor','application/conference-info+xml','application/cose','application/cose-key','application/cose-key-set','application/cose-x509','application/cpl+xml','application/csrattrs','application/csta+xml','application/CSTAdata+xml','application/csvm+json','application/cwl','application/cwl+json','application/cwl+yaml','application/cwt','application/cybercash','application/dash-patch+xml','application/dash+xml','application/dashdelta','application/davmount+xml','application/dca-rft','application/DCD','application/dec-dx','application/dialog-info+xml','application/dicom','application/dicom+json','application/dicom+xml','application/did','application/DII','application/DIT','application/dns','application/dns-message','application/dns+json','application/dots+cbor','application/dpop+jwt','application/dskpp+xml','application/dssc+der','application/dssc+xml','application/dvcs','application/eat-bun+cbor','application/eat-bun+json','application/eat-ucs+cbor','application/eat-ucs+json','application/eat+cwt','application/eat+jwt','application/ecmascript','application/edhoc+cbor-seq','application/EDI-consent','application/EDI-X12','application/EDIFACT','application/efi','application/elm+json','application/elm+xml','application/EmergencyCallData.cap+xml','application/EmergencyCallData.Comment+xml','application/EmergencyCallData.Control+xml','application/EmergencyCallData.DeviceInfo+xml','application/EmergencyCallData.eCall.MSD','application/EmergencyCallData.LegacyESN+json','application/EmergencyCallData.ProviderInfo+xml','application/EmergencyCallData.ServiceInfo+xml','application/EmergencyCallData.SubscriberInfo+xml','application/EmergencyCallData.VEDS+xml','application/emma+xml','application/emotionml+xml','application/encaprtp','application/entity-statement+jwt','application/epp+xml','application/epub+zip','application/eshop','application/example','application/exi','application/expect-ct-report+json','application/express','application/fastinfoset','application/fastsoap','application/fdf','application/fdt+xml','application/fhir+json','application/fhir+xml','application/fits','application/flexfec','application/font-sfnt','application/font-tdpfr','application/font-woff','application/framework-attributes+xml','application/geo+json','application/geo+json-seq','application/geopackage+sqlite3','application/geopose+json','application/geoxacml+json','application/geoxacml+xml','application/gltf-buffer','application/gml+xml','application/gnap-binding-jws','application/gnap-binding-jwsd','application/gnap-binding-rotation-jws','application/gnap-binding-rotation-jwsd','application/grib','application/gzip','application/H224','application/held+xml','application/hl7v2+xml','application/http','application/hyperstudio','application/ibe-key-request+xml','application/ibe-pkg-reply+xml','application/ibe-pp-data','application/iges','application/im-iscomposing+xml','application/index','application/index.cmd','application/index.obj','application/index.response','application/index.vnd','application/inkml+xml','application/IOTP','application/ipfix','application/ipp','application/ISUP','application/its+xml','application/java-archive','application/javascript','application/jf2feed+json','application/jose','application/jose+json','application/jrd+json','application/jscalendar+json','application/jscontact+json','application/json','application/json-patch+json','application/json-seq','application/jsonpath','application/jwk-set+json','application/jwk-set+jwt','application/jwk+json','application/jwt','application/kb+jwt','application/kpml-request+xml','application/kpml-response+xml','application/ld+json','application/lgr+xml','application/link-format','application/linkset','application/linkset+json','application/load-control+xml','application/logout+jwt','application/lost+xml','application/lostsync+xml','application/lpf+zip','application/LXF','application/mac-binhex40','application/macwriteii','application/mads+xml','application/manifest+json','application/marc','application/marcxml+xml','application/mathematica','application/mathml-content+xml','application/mathml-presentation+xml','application/mathml+xml','application/mbms-associated-procedure-description+xml','application/mbms-deregister+xml','application/mbms-envelope+xml','application/mbms-msk-response+xml','application/mbms-msk+xml','application/mbms-protection-description+xml','application/mbms-reception-report+xml','application/mbms-register-response+xml','application/mbms-register+xml','application/mbms-schedule+xml','application/mbms-user-service-description+xml','application/mbox','application/media_control+xml','application/media-policy-dataset+xml','application/mediaservercontrol+xml','application/merge-patch+json','application/metalink4+xml','application/mets+xml','application/MF4','application/mikey','application/mipc','application/missing-blocks+cbor-seq','application/mmt-aei+xml','application/mmt-usd+xml','application/mods+xml','application/moss-keys','application/moss-signature','application/mosskey-data','application/mosskey-request','application/mp21','application/mp4','application/mpeg4-generic','application/mpeg4-iod','application/mpeg4-iod-xmt','application/mrb-consumer+xml','application/mrb-publish+xml','application/msc-ivr+xml','application/msc-mixer+xml','application/msword','application/mud+json','application/multipart-core','application/mxf','application/n-quads','application/n-triples','application/nasdata','application/news-checkgroups','application/news-groupinfo','application/news-transmission','application/nlsml+xml','application/node','application/nss','application/oauth-authz-req+jwt','application/oblivious-dns-message','application/ocsp-request','application/ocsp-response','application/octet-stream','application/ODA','application/odm+xml','application/ODX','application/oebps-package+xml','application/ogg','application/ohttp-keys','application/opc-nodeset+xml','application/oscore','application/oxps','application/p21','application/p21+zip','application/p2p-overlay+xml','application/parityfec','application/passport','application/patch-ops-error+xml','application/pdf','application/PDX','application/pem-certificate-chain','application/pgp-encrypted','application/pgp-keys','application/pgp-signature','application/pidf-diff+xml','application/pidf+xml','application/pkcs10','application/pkcs12','application/pkcs7-mime','application/pkcs7-signature','application/pkcs8','application/pkcs8-encrypted','application/pkix-attr-cert','application/pkix-cert','application/pkix-crl','application/pkix-pkipath','application/pkixcmp','application/pls+xml','application/poc-settings+xml','application/postscript','application/ppsp-tracker+json','application/private-token-issuer-directory','application/private-token-request','application/private-token-response','application/problem+json','application/problem+xml','application/provenance+xml','application/provided-claims+jwt','application/prs.alvestrand.titrax-sheet','application/prs.cww','application/prs.cyn','application/prs.hpub+zip','application/prs.implied-document+xml','application/prs.implied-executable','application/prs.implied-object+json','application/prs.implied-object+json-seq','application/prs.implied-object+yaml','application/prs.implied-structure','application/prs.mayfile','application/prs.nprend','application/prs.plucker','application/prs.rdf-xml-crypt','application/prs.vcfbzip2','application/prs.xsf+xml','application/pskc+xml','application/pvd+json','application/QSIG','application/raptorfec','application/rdap+json','application/rdf+xml','application/reginfo+xml','application/relax-ng-compact-syntax','application/remote-printing','application/reputon+json','application/resolve-response+jwt','application/resource-lists-diff+xml','application/resource-lists+xml','application/rfc+xml','application/riscos','application/rlmi+xml','application/rls-services+xml','application/route-apd+xml','application/route-s-tsid+xml','application/route-usd+xml','application/rpki-checklist','application/rpki-ghostbusters','application/rpki-manifest','application/rpki-publication','application/rpki-roa','application/rpki-signed-tal','application/rpki-updown','application/rs-metadata+xml','application/rtf','application/rtploopback','application/rtx','application/samlassertion+xml','application/samlmetadata+xml','application/sarif-external-properties+json','application/sarif+json','application/sbe','application/sbml+xml','application/scaip+xml','application/scim+json','application/scvp-cv-request','application/scvp-cv-response','application/scvp-vp-request','application/scvp-vp-response','application/sd-jwt','application/sd-jwt+json','application/sdf+json','application/sdp','application/secevent+jwt','application/senml-etch+cbor','application/senml-etch+json','application/senml-exi','application/senml+cbor','application/senml+json','application/senml+xml','application/sensml-exi','application/sensml+cbor','application/sensml+json','application/sensml+xml','application/sep-exi','application/sep+xml','application/session-info','application/set-payment','application/set-payment-initiation','application/set-registration','application/set-registration-initiation','application/SGML','application/sgml-open-catalog','application/shf+xml','application/sieve','application/simple-filter+xml','application/simple-message-summary','application/simpleSymbolContainer','application/sipc','application/slate','application/smil','application/smil+xml','application/smpte336m','application/soap+fastinfoset','application/soap+xml','application/sparql-query','application/sparql-results+xml','application/spdx+json','application/spirits-event+xml','application/sql','application/srgs','application/srgs+xml','application/sru+xml','application/sslkeylogfile','application/ssml+xml','application/ST2110-41','application/stix+json','application/stratum','application/suit-envelope+cose','application/swid+cbor','application/swid+xml','application/tamp-apex-update','application/tamp-apex-update-confirm','application/tamp-community-update','application/tamp-community-update-confirm','application/tamp-error','application/tamp-sequence-adjust','application/tamp-sequence-adjust-confirm','application/tamp-status-query','application/tamp-status-response','application/tamp-update','application/tamp-update-confirm','application/taxii+json','application/td+json','application/tei+xml','application/TETRA_ISI','application/texinfo','application/thraud+xml','application/timestamp-query','application/timestamp-reply','application/timestamped-data','application/tlsrpt+gzip','application/tlsrpt+json','application/tm+json','application/tnauthlist','application/toc+cbor','application/token-introspection+jwt','application/toml','application/trickle-ice-sdpfrag','application/trig','application/trust-chain+json','application/trust-mark-delegation+jwt','application/trust-mark+jwt','application/ttml+xml','application/tve-trigger','application/tzif','application/tzif-leap','application/uccs+cbor','application/ujcs+json','application/ulpfec','application/urc-grpsheet+xml','application/urc-ressheet+xml','application/urc-targetdesc+xml','application/urc-uisocketdesc+xml','application/vc','application/vc+cose','application/vc+jwt','application/vcard+json','application/vcard+xml','application/vemmi','application/vnd.1000minds.decision-model+xml','application/vnd.1ob','application/vnd.3gpp-prose-pc3a+xml','application/vnd.3gpp-prose-pc3ach+xml','application/vnd.3gpp-prose-pc3ch+xml','application/vnd.3gpp-prose-pc8+xml','application/vnd.3gpp-prose+xml','application/vnd.3gpp-v2x-local-service-information','application/vnd.3gpp.5gnas','application/vnd.3gpp.5gsa2x','application/vnd.3gpp.5gsa2x-local-service-information','application/vnd.3gpp.5gsv2x','application/vnd.3gpp.5gsv2x-local-service-information','application/vnd.3gpp.access-transfer-events+xml','application/vnd.3gpp.bsf+xml','application/vnd.3gpp.crs+xml','application/vnd.3gpp.current-location-discovery+xml','application/vnd.3gpp.GMOP+xml','application/vnd.3gpp.gtpc','application/vnd.3gpp.interworking-data','application/vnd.3gpp.lpp','application/vnd.3gpp.mc-signalling-ear','application/vnd.3gpp.mcdata-affiliation-command+xml','application/vnd.3gpp.mcdata-info+xml','application/vnd.3gpp.mcdata-msgstore-ctrl-request+xml','application/vnd.3gpp.mcdata-payload','application/vnd.3gpp.mcdata-regroup+xml','application/vnd.3gpp.mcdata-service-config+xml','application/vnd.3gpp.mcdata-signalling','application/vnd.3gpp.mcdata-ue-config+xml','application/vnd.3gpp.mcdata-user-profile+xml','application/vnd.3gpp.mcptt-affiliation-command+xml','application/vnd.3gpp.mcptt-floor-request+xml','application/vnd.3gpp.mcptt-info+xml','application/vnd.3gpp.mcptt-location-info+xml','application/vnd.3gpp.mcptt-mbms-usage-info+xml','application/vnd.3gpp.mcptt-regroup+xml','application/vnd.3gpp.mcptt-service-config+xml','application/vnd.3gpp.mcptt-signed+xml','application/vnd.3gpp.mcptt-ue-config+xml','application/vnd.3gpp.mcptt-ue-init-config+xml','application/vnd.3gpp.mcptt-user-profile+xml','application/vnd.3gpp.mcvideo-affiliation-command+xml','application/vnd.3gpp.mcvideo-affiliation-info+xml','application/vnd.3gpp.mcvideo-info+xml','application/vnd.3gpp.mcvideo-location-info+xml','application/vnd.3gpp.mcvideo-mbms-usage-info+xml','application/vnd.3gpp.mcvideo-regroup+xml','application/vnd.3gpp.mcvideo-service-config+xml','application/vnd.3gpp.mcvideo-transmission-request+xml','application/vnd.3gpp.mcvideo-ue-config+xml','application/vnd.3gpp.mcvideo-user-profile+xml','application/vnd.3gpp.mid-call+xml','application/vnd.3gpp.ngap','application/vnd.3gpp.pfcp','application/vnd.3gpp.pic-bw-large','application/vnd.3gpp.pic-bw-small','application/vnd.3gpp.pic-bw-var','application/vnd.3gpp.pinapp-info+xml','application/vnd.3gpp.s1ap','application/vnd.3gpp.seal-app-comm-requirements-info+xml','application/vnd.3gpp.seal-data-delivery-info+cbor','application/vnd.3gpp.seal-data-delivery-info+xml','application/vnd.3gpp.seal-group-doc+xml','application/vnd.3gpp.seal-info+xml','application/vnd.3gpp.seal-location-info+cbor','application/vnd.3gpp.seal-location-info+xml','application/vnd.3gpp.seal-mbms-usage-info+xml','application/vnd.3gpp.seal-mbs-usage-info+xml','application/vnd.3gpp.seal-network-QoS-management-info+xml','application/vnd.3gpp.seal-network-resource-info+cbor','application/vnd.3gpp.seal-ue-config-info+xml','application/vnd.3gpp.seal-unicast-info+xml','application/vnd.3gpp.seal-user-profile-info+xml','application/vnd.3gpp.sms','application/vnd.3gpp.sms+xml','application/vnd.3gpp.srvcc-ext+xml','application/vnd.3gpp.SRVCC-info+xml','application/vnd.3gpp.state-and-event-info+xml','application/vnd.3gpp.ussd+xml','application/vnd.3gpp.v2x','application/vnd.3gpp.vae-info+xml','application/vnd.3gpp2.bcmcsinfo+xml','application/vnd.3gpp2.sms','application/vnd.3gpp2.tcap','application/vnd.3lightssoftware.imagescal','application/vnd.3M.Post-it-Notes','application/vnd.accpac.simply.aso','application/vnd.accpac.simply.imp','application/vnd.acm.addressxfer+json','application/vnd.acm.chatbot+json','application/vnd.acucobol','application/vnd.acucorp','application/vnd.adobe.flash.movie','application/vnd.adobe.formscentral.fcdt','application/vnd.adobe.fxp','application/vnd.adobe.partial-upload','application/vnd.adobe.xdp+xml','application/vnd.aether.imp','application/vnd.afpc.afplinedata','application/vnd.afpc.afplinedata-pagedef','application/vnd.afpc.cmoca-cmresource','application/vnd.afpc.foca-charset','application/vnd.afpc.foca-codedfont','application/vnd.afpc.foca-codepage','application/vnd.afpc.modca','application/vnd.afpc.modca-cmtable','application/vnd.afpc.modca-formdef','application/vnd.afpc.modca-mediummap','application/vnd.afpc.modca-objectcontainer','application/vnd.afpc.modca-overlay','application/vnd.afpc.modca-pagesegment','application/vnd.age','application/vnd.ah-barcode','application/vnd.ahead.space','application/vnd.airzip.filesecure.azf','application/vnd.airzip.filesecure.azs','application/vnd.amadeus+json','application/vnd.amazon.mobi8-ebook','application/vnd.americandynamics.acc','application/vnd.amiga.ami','application/vnd.amundsen.maze+xml','application/vnd.android.ota','application/vnd.anki','application/vnd.anser-web-certificate-issue-initiation','application/vnd.antix.game-component','application/vnd.apache.arrow.file','application/vnd.apache.arrow.stream','application/vnd.apache.parquet','application/vnd.apache.thrift.binary','application/vnd.apache.thrift.compact','application/vnd.apache.thrift.json','application/vnd.apexlang','application/vnd.api+json','application/vnd.aplextor.warrp+json','application/vnd.apothekende.reservation+json','application/vnd.apple.installer+xml','application/vnd.apple.keynote','application/vnd.apple.mpegurl','application/vnd.apple.numbers','application/vnd.apple.pages','application/vnd.arastra.swi','application/vnd.aristanetworks.swi','application/vnd.artisan+json','application/vnd.artsquare','application/vnd.astraea-software.iota','application/vnd.audiograph','application/vnd.autopackage','application/vnd.avalon+json','application/vnd.avistar+xml','application/vnd.balsamiq.bmml+xml','application/vnd.balsamiq.bmpr','application/vnd.banana-accounting','application/vnd.bbf.usp.error','application/vnd.bbf.usp.msg','application/vnd.bbf.usp.msg+json','application/vnd.bekitzur-stech+json','application/vnd.belightsoft.lhzd+zip','application/vnd.belightsoft.lhzl+zip','application/vnd.bint.med-content','application/vnd.biopax.rdf+xml','application/vnd.blink-idb-value-wrapper','application/vnd.blueice.multipass','application/vnd.bluetooth.ep.oob','application/vnd.bluetooth.le.oob','application/vnd.bmi','application/vnd.bpf','application/vnd.bpf3','application/vnd.businessobjects','application/vnd.byu.uapi+json','application/vnd.bzip3','application/vnd.c3voc.schedule+xml','application/vnd.cab-jscript','application/vnd.canon-cpdl','application/vnd.canon-lips','application/vnd.capasystems-pg+json','application/vnd.cel','application/vnd.cendio.thinlinc.clientconf','application/vnd.century-systems.tcp_stream','application/vnd.chemdraw+xml','application/vnd.chess-pgn','application/vnd.chipnuts.karaoke-mmd','application/vnd.ciedi','application/vnd.cinderella','application/vnd.cirpack.isdn-ext','application/vnd.citationstyles.style+xml','application/vnd.claymore','application/vnd.cloanto.rp9','application/vnd.clonk.c4group','application/vnd.cluetrust.cartomobile-config','application/vnd.cluetrust.cartomobile-config-pkg','application/vnd.cncf.helm.chart.content.v1.tar+gzip','application/vnd.cncf.helm.chart.provenance.v1.prov','application/vnd.cncf.helm.config.v1+json','application/vnd.coffeescript','application/vnd.collabio.xodocuments.document','application/vnd.collabio.xodocuments.document-template','application/vnd.collabio.xodocuments.presentation','application/vnd.collabio.xodocuments.presentation-template','application/vnd.collabio.xodocuments.spreadsheet','application/vnd.collabio.xodocuments.spreadsheet-template','application/vnd.collection.doc+json','application/vnd.collection.next+json','application/vnd.collection+json','application/vnd.comicbook-rar','application/vnd.comicbook+zip','application/vnd.commerce-battelle','application/vnd.commonspace','application/vnd.contact.cmsg','application/vnd.coreos.ignition+json','application/vnd.cosmocaller','application/vnd.crick.clicker','application/vnd.crick.clicker.keyboard','application/vnd.crick.clicker.palette','application/vnd.crick.clicker.template','application/vnd.crick.clicker.wordbank','application/vnd.criticaltools.wbs+xml','application/vnd.cryptii.pipe+json','application/vnd.crypto-shade-file','application/vnd.cryptomator.encrypted','application/vnd.cryptomator.vault','application/vnd.ctc-posml','application/vnd.ctct.ws+xml','application/vnd.cups-pdf','application/vnd.cups-postscript','application/vnd.cups-ppd','application/vnd.cups-raster','application/vnd.cups-raw','application/vnd.curl','application/vnd.cyan.dean.root+xml','application/vnd.cybank','application/vnd.cyclonedx+json','application/vnd.cyclonedx+xml','application/vnd.d2l.coursepackage1p0+zip','application/vnd.d3m-dataset','application/vnd.d3m-problem','application/vnd.dart','application/vnd.data-vision.rdz','application/vnd.datalog','application/vnd.datapackage+json','application/vnd.dataresource+json','application/vnd.dbf','application/vnd.dcmp+xml','application/vnd.debian.binary-package','application/vnd.dece.data','application/vnd.dece.ttml+xml','application/vnd.dece.unspecified','application/vnd.dece.zip','application/vnd.denovo.fcselayout-link','application/vnd.desmume.movie','application/vnd.dir-bi.plate-dl-nosuffix','application/vnd.dm.delegation+xml','application/vnd.dna','application/vnd.document+json','application/vnd.dolby.mobile.1','application/vnd.dolby.mobile.2','application/vnd.doremir.scorecloud-binary-document','application/vnd.dpgraph','application/vnd.dreamfactory','application/vnd.drive+json','application/vnd.dtg.local','application/vnd.dtg.local.flash','application/vnd.dtg.local.html','application/vnd.dvb.ait','application/vnd.dvb.dvbisl+xml','application/vnd.dvb.dvbj','application/vnd.dvb.esgcontainer','application/vnd.dvb.ipdcdftnotifaccess','application/vnd.dvb.ipdcesgaccess','application/vnd.dvb.ipdcesgaccess2','application/vnd.dvb.ipdcesgpdd','application/vnd.dvb.ipdcroaming','application/vnd.dvb.iptv.alfec-base','application/vnd.dvb.iptv.alfec-enhancement','application/vnd.dvb.notif-aggregate-root+xml','application/vnd.dvb.notif-container+xml','application/vnd.dvb.notif-generic+xml','application/vnd.dvb.notif-ia-msglist+xml','application/vnd.dvb.notif-ia-registration-request+xml','application/vnd.dvb.notif-ia-registration-response+xml','application/vnd.dvb.notif-init+xml','application/vnd.dvb.pfr','application/vnd.dvb.service','application/vnd.dxr','application/vnd.dynageo','application/vnd.dzr','application/vnd.easykaraoke.cdgdownload','application/vnd.ecdis-update','application/vnd.ecip.rlp','application/vnd.eclipse.ditto+json','application/vnd.ecowin.chart','application/vnd.ecowin.filerequest','application/vnd.ecowin.fileupdate','application/vnd.ecowin.series','application/vnd.ecowin.seriesrequest','application/vnd.ecowin.seriesupdate','application/vnd.efi.img','application/vnd.efi.iso','application/vnd.eln+zip','application/vnd.emclient.accessrequest+xml','application/vnd.enliven','application/vnd.enphase.envoy','application/vnd.eprints.data+xml','application/vnd.epson.esf','application/vnd.epson.msf','application/vnd.epson.quickanime','application/vnd.epson.salt','application/vnd.epson.ssf','application/vnd.ericsson.quickcall','application/vnd.erofs','application/vnd.espass-espass+zip','application/vnd.eszigno3+xml','application/vnd.etsi.aoc+xml','application/vnd.etsi.asic-e+zip','application/vnd.etsi.asic-s+zip','application/vnd.etsi.cug+xml','application/vnd.etsi.iptvcommand+xml','application/vnd.etsi.iptvdiscovery+xml','application/vnd.etsi.iptvprofile+xml','application/vnd.etsi.iptvsad-bc+xml','application/vnd.etsi.iptvsad-cod+xml','application/vnd.etsi.iptvsad-npvr+xml','application/vnd.etsi.iptvservice+xml','application/vnd.etsi.iptvsync+xml','application/vnd.etsi.iptvueprofile+xml','application/vnd.etsi.mcid+xml','application/vnd.etsi.mheg5','application/vnd.etsi.overload-control-policy-dataset+xml','application/vnd.etsi.pstn+xml','application/vnd.etsi.sci+xml','application/vnd.etsi.simservs+xml','application/vnd.etsi.timestamp-token','application/vnd.etsi.tsl.der','application/vnd.etsi.tsl+xml','application/vnd.eu.kasparian.car+json','application/vnd.eudora.data','application/vnd.evolv.ecig.profile','application/vnd.evolv.ecig.settings','application/vnd.evolv.ecig.theme','application/vnd.exstream-empower+zip','application/vnd.exstream-package','application/vnd.ezpix-album','application/vnd.ezpix-package','application/vnd.f-secure.mobile','application/vnd.familysearch.gedcom+zip','application/vnd.fastcopy-disk-image','application/vnd.fdsn.mseed','application/vnd.fdsn.seed','application/vnd.fdsn.stationxml+xml','application/vnd.ffsns','application/vnd.fgb','application/vnd.ficlab.flb+zip','application/vnd.filmit.zfc','application/vnd.fints','application/vnd.firemonkeys.cloudcell','application/vnd.FloGraphIt','application/vnd.fluxtime.clip','application/vnd.font-fontforge-sfd','application/vnd.framemaker','application/vnd.freelog.comic','application/vnd.frogans.fnc','application/vnd.frogans.ltf','application/vnd.fsc.weblaunch','application/vnd.fujifilm.fb.docuworks','application/vnd.fujifilm.fb.docuworks.binder','application/vnd.fujifilm.fb.docuworks.container','application/vnd.fujifilm.fb.jfi+xml','application/vnd.fujitsu.oasys','application/vnd.fujitsu.oasys2','application/vnd.fujitsu.oasys3','application/vnd.fujitsu.oasysgp','application/vnd.fujitsu.oasysprs','application/vnd.fujixerox.ART-EX','application/vnd.fujixerox.ART4','application/vnd.fujixerox.ddd','application/vnd.fujixerox.docuworks','application/vnd.fujixerox.docuworks.binder','application/vnd.fujixerox.docuworks.container','application/vnd.fujixerox.HBPL','application/vnd.fut-misnet','application/vnd.futoin+cbor','application/vnd.futoin+json','application/vnd.fuzzysheet','application/vnd.ga4gh.passport+jwt','application/vnd.genomatix.tuxedo','application/vnd.genozip','application/vnd.gentics.grd+json','application/vnd.gentoo.catmetadata+xml','application/vnd.gentoo.ebuild','application/vnd.gentoo.eclass','application/vnd.gentoo.gpkg','application/vnd.gentoo.manifest','application/vnd.gentoo.pkgmetadata+xml','application/vnd.gentoo.xpak','application/vnd.geo+json','application/vnd.geocube+xml','application/vnd.geogebra.file','application/vnd.geogebra.pinboard','application/vnd.geogebra.slides','application/vnd.geogebra.tool','application/vnd.geometry-explorer','application/vnd.geonext','application/vnd.geoplan','application/vnd.geospace','application/vnd.gerber','application/vnd.globalplatform.card-content-mgt','application/vnd.globalplatform.card-content-mgt-response','application/vnd.gmx','application/vnd.gnu.taler.exchange+json','application/vnd.gnu.taler.merchant+json','application/vnd.google-earth.kml+xml','application/vnd.google-earth.kmz','application/vnd.gov.sk.e-form+xml','application/vnd.gov.sk.e-form+zip','application/vnd.gov.sk.xmldatacontainer+xml','application/vnd.gpxsee.map+xml','application/vnd.grafeq','application/vnd.gridmp','application/vnd.groove-account','application/vnd.groove-help','application/vnd.groove-identity-message','application/vnd.groove-injector','application/vnd.groove-tool-message','application/vnd.groove-tool-template','application/vnd.groove-vcard','application/vnd.hal+json','application/vnd.hal+xml','application/vnd.HandHeld-Entertainment+xml','application/vnd.hbci','application/vnd.hc+json','application/vnd.hcl-bireports','application/vnd.hdt','application/vnd.heroku+json','application/vnd.hhe.lesson-player','application/vnd.hp-HPGL','application/vnd.hp-hpid','application/vnd.hp-hps','application/vnd.hp-jlyt','application/vnd.hp-PCL','application/vnd.hp-PCLXL','application/vnd.hsl','application/vnd.httphone','application/vnd.hydrostatix.sof-data','application/vnd.hyper-item+json','application/vnd.hyper+json','application/vnd.hyperdrive+json','application/vnd.hzn-3d-crossword','application/vnd.ibm.afplinedata','application/vnd.ibm.electronic-media','application/vnd.ibm.MiniPay','application/vnd.ibm.modcap','application/vnd.ibm.rights-management','application/vnd.ibm.secure-container','application/vnd.iccprofile','application/vnd.ieee.1905','application/vnd.igloader','application/vnd.imagemeter.folder+zip','application/vnd.imagemeter.image+zip','application/vnd.immervision-ivp','application/vnd.immervision-ivu','application/vnd.ims.imsccv1p1','application/vnd.ims.imsccv1p2','application/vnd.ims.imsccv1p3','application/vnd.ims.lis.v2.result+json','application/vnd.ims.lti.v2.toolconsumerprofile+json','application/vnd.ims.lti.v2.toolproxy.id+json','application/vnd.ims.lti.v2.toolproxy+json','application/vnd.ims.lti.v2.toolsettings.simple+json','application/vnd.ims.lti.v2.toolsettings+json','application/vnd.informedcontrol.rms+xml','application/vnd.informix-visionary','application/vnd.infotech.project','application/vnd.infotech.project+xml','application/vnd.innopath.wamp.notification','application/vnd.insors.igm','application/vnd.intercon.formnet','application/vnd.intergeo','application/vnd.intertrust.digibox','application/vnd.intertrust.nncp','application/vnd.intu.qbo','application/vnd.intu.qfx','application/vnd.ipfs.ipns-record','application/vnd.ipld.car','application/vnd.ipld.dag-cbor','application/vnd.ipld.dag-json','application/vnd.ipld.raw','application/vnd.iptc.g2.catalogitem+xml','application/vnd.iptc.g2.conceptitem+xml','application/vnd.iptc.g2.knowledgeitem+xml','application/vnd.iptc.g2.newsitem+xml','application/vnd.iptc.g2.newsmessage+xml','application/vnd.iptc.g2.packageitem+xml','application/vnd.iptc.g2.planningitem+xml','application/vnd.ipunplugged.rcprofile','application/vnd.irepository.package+xml','application/vnd.is-xpr','application/vnd.isac.fcs','application/vnd.iso11783-10+zip','application/vnd.jam','application/vnd.japannet-directory-service','application/vnd.japannet-jpnstore-wakeup','application/vnd.japannet-payment-wakeup','application/vnd.japannet-registration','application/vnd.japannet-registration-wakeup','application/vnd.japannet-setstore-wakeup','application/vnd.japannet-verification','application/vnd.japannet-verification-wakeup','application/vnd.jcp.javame.midlet-rms','application/vnd.jisp','application/vnd.joost.joda-archive','application/vnd.jsk.isdn-ngn','application/vnd.kahootz','application/vnd.kde.karbon','application/vnd.kde.kchart','application/vnd.kde.kformula','application/vnd.kde.kivio','application/vnd.kde.kontour','application/vnd.kde.kpresenter','application/vnd.kde.kspread','application/vnd.kde.kword','application/vnd.kdl','application/vnd.kenameaapp','application/vnd.keyman.kmp+zip','application/vnd.keyman.kmx','application/vnd.kidspiration','application/vnd.Kinar','application/vnd.koan','application/vnd.kodak-descriptor','application/vnd.las','application/vnd.las.las+json','application/vnd.las.las+xml','application/vnd.laszip','application/vnd.ldev.productlicensing','application/vnd.leap+json','application/vnd.liberty-request+xml','application/vnd.llamagraphics.life-balance.desktop','application/vnd.llamagraphics.life-balance.exchange+xml','application/vnd.logipipe.circuit+zip','application/vnd.loom','application/vnd.lotus-1-2-3','application/vnd.lotus-approach','application/vnd.lotus-freelance','application/vnd.lotus-notes','application/vnd.lotus-organizer','application/vnd.lotus-screencam','application/vnd.lotus-wordpro','application/vnd.macports.portpkg','application/vnd.mapbox-vector-tile','application/vnd.marlin.drm.actiontoken+xml','application/vnd.marlin.drm.conftoken+xml','application/vnd.marlin.drm.license+xml','application/vnd.marlin.drm.mdcf','application/vnd.mason+json','application/vnd.maxar.archive.3tz+zip','application/vnd.maxmind.maxmind-db','application/vnd.mcd','application/vnd.mdl','application/vnd.mdl-mbsdf','application/vnd.medcalcdata','application/vnd.mediastation.cdkey','application/vnd.medicalholodeck.recordxr','application/vnd.meridian-slingshot','application/vnd.mermaid','application/vnd.MFER','application/vnd.mfmp','application/vnd.micro+json','application/vnd.micrografx.flo','application/vnd.micrografx.igx','application/vnd.microsoft.portable-executable','application/vnd.microsoft.windows.thumbnail-cache','application/vnd.miele+json','application/vnd.mif','application/vnd.minisoft-hp3000-save','application/vnd.mitsubishi.misty-guard.trustweb','application/vnd.Mobius.DAF','application/vnd.Mobius.DIS','application/vnd.Mobius.MBK','application/vnd.Mobius.MQY','application/vnd.Mobius.MSL','application/vnd.Mobius.PLC','application/vnd.Mobius.TXF','application/vnd.modl','application/vnd.mophun.application','application/vnd.mophun.certificate','application/vnd.motorola.flexsuite','application/vnd.motorola.flexsuite.adsi','application/vnd.motorola.flexsuite.fis','application/vnd.motorola.flexsuite.gotap','application/vnd.motorola.flexsuite.kmr','application/vnd.motorola.flexsuite.ttc','application/vnd.motorola.flexsuite.wem','application/vnd.motorola.iprm','application/vnd.mozilla.xul+xml','application/vnd.ms-3mfdocument','application/vnd.ms-artgalry','application/vnd.ms-asf','application/vnd.ms-cab-compressed','application/vnd.ms-excel','application/vnd.ms-excel.addin.macroEnabled.12','application/vnd.ms-excel.sheet.binary.macroEnabled.12','application/vnd.ms-excel.sheet.macroEnabled.12','application/vnd.ms-excel.template.macroEnabled.12','application/vnd.ms-fontobject','application/vnd.ms-htmlhelp','application/vnd.ms-ims','application/vnd.ms-lrm','application/vnd.ms-office.activeX+xml','application/vnd.ms-officetheme','application/vnd.ms-playready.initiator+xml','application/vnd.ms-powerpoint','application/vnd.ms-powerpoint.addin.macroEnabled.12','application/vnd.ms-powerpoint.presentation.macroEnabled.12','application/vnd.ms-powerpoint.slide.macroEnabled.12','application/vnd.ms-powerpoint.slideshow.macroEnabled.12','application/vnd.ms-powerpoint.template.macroEnabled.12','application/vnd.ms-PrintDeviceCapabilities+xml','application/vnd.ms-PrintSchemaTicket+xml','application/vnd.ms-project','application/vnd.ms-tnef','application/vnd.ms-windows.devicepairing','application/vnd.ms-windows.nwprinting.oob','application/vnd.ms-windows.printerpairing','application/vnd.ms-windows.wsd.oob','application/vnd.ms-wmdrm.lic-chlg-req','application/vnd.ms-wmdrm.lic-resp','application/vnd.ms-wmdrm.meter-chlg-req','application/vnd.ms-wmdrm.meter-resp','application/vnd.ms-word.document.macroEnabled.12','application/vnd.ms-word.template.macroEnabled.12','application/vnd.ms-works','application/vnd.ms-wpl','application/vnd.ms-xpsdocument','application/vnd.msa-disk-image','application/vnd.mseq','application/vnd.msgpack','application/vnd.msign','application/vnd.multiad.creator','application/vnd.multiad.creator.cif','application/vnd.music-niff','application/vnd.musician','application/vnd.muvee.style','application/vnd.mynfc','application/vnd.nacamar.ybrid+json','application/vnd.nato.bindingdataobject+cbor','application/vnd.nato.bindingdataobject+json','application/vnd.nato.bindingdataobject+xml','application/vnd.nato.openxmlformats-package.iepd+zip','application/vnd.ncd.control','application/vnd.ncd.reference','application/vnd.nearst.inv+json','application/vnd.nebumind.line','application/vnd.nervana','application/vnd.netfpx','application/vnd.neurolanguage.nlu','application/vnd.nimn','application/vnd.nintendo.nitro.rom','application/vnd.nintendo.snes.rom','application/vnd.nitf','application/vnd.noblenet-directory','application/vnd.noblenet-sealer','application/vnd.noblenet-web','application/vnd.nokia.catalogs','application/vnd.nokia.conml+wbxml','application/vnd.nokia.conml+xml','application/vnd.nokia.iptv.config+xml','application/vnd.nokia.iSDS-radio-presets','application/vnd.nokia.landmark+wbxml','application/vnd.nokia.landmark+xml','application/vnd.nokia.landmarkcollection+xml','application/vnd.nokia.n-gage.ac+xml','application/vnd.nokia.n-gage.data','application/vnd.nokia.n-gage.symbian.install','application/vnd.nokia.ncd','application/vnd.nokia.pcd+wbxml','application/vnd.nokia.pcd+xml','application/vnd.nokia.radio-preset','application/vnd.nokia.radio-presets','application/vnd.novadigm.EDM','application/vnd.novadigm.EDX','application/vnd.novadigm.EXT','application/vnd.ntt-local.content-share','application/vnd.ntt-local.file-transfer','application/vnd.ntt-local.ogw_remote-access','application/vnd.ntt-local.sip-ta_remote','application/vnd.ntt-local.sip-ta_tcp_stream','application/vnd.oai.workflows','application/vnd.oai.workflows+json','application/vnd.oai.workflows+yaml','application/vnd.oasis.opendocument.base','application/vnd.oasis.opendocument.chart','application/vnd.oasis.opendocument.chart-template','application/vnd.oasis.opendocument.database','application/vnd.oasis.opendocument.formula','application/vnd.oasis.opendocument.formula-template','application/vnd.oasis.opendocument.graphics','application/vnd.oasis.opendocument.graphics-template','application/vnd.oasis.opendocument.image','application/vnd.oasis.opendocument.image-template','application/vnd.oasis.opendocument.presentation','application/vnd.oasis.opendocument.presentation-template','application/vnd.oasis.opendocument.spreadsheet','application/vnd.oasis.opendocument.spreadsheet-template','application/vnd.oasis.opendocument.text','application/vnd.oasis.opendocument.text-master','application/vnd.oasis.opendocument.text-master-template','application/vnd.oasis.opendocument.text-template','application/vnd.oasis.opendocument.text-web','application/vnd.obn','application/vnd.ocf+cbor','application/vnd.oci.image.manifest.v1+json','application/vnd.oftn.l10n+json','application/vnd.oipf.contentaccessdownload+xml','application/vnd.oipf.contentaccessstreaming+xml','application/vnd.oipf.cspg-hexbinary','application/vnd.oipf.dae.svg+xml','application/vnd.oipf.dae.xhtml+xml','application/vnd.oipf.mippvcontrolmessage+xml','application/vnd.oipf.pae.gem','application/vnd.oipf.spdiscovery+xml','application/vnd.oipf.spdlist+xml','application/vnd.oipf.ueprofile+xml','application/vnd.oipf.userprofile+xml','application/vnd.olpc-sugar','application/vnd.oma-scws-config','application/vnd.oma-scws-http-request','application/vnd.oma-scws-http-response','application/vnd.oma.bcast.associated-procedure-parameter+xml','application/vnd.oma.bcast.drm-trigger+xml','application/vnd.oma.bcast.imd+xml','application/vnd.oma.bcast.ltkm','application/vnd.oma.bcast.notification+xml','application/vnd.oma.bcast.provisioningtrigger','application/vnd.oma.bcast.sgboot','application/vnd.oma.bcast.sgdd+xml','application/vnd.oma.bcast.sgdu','application/vnd.oma.bcast.simple-symbol-container','application/vnd.oma.bcast.smartcard-trigger+xml','application/vnd.oma.bcast.sprov+xml','application/vnd.oma.bcast.stkm','application/vnd.oma.cab-address-book+xml','application/vnd.oma.cab-feature-handler+xml','application/vnd.oma.cab-pcc+xml','application/vnd.oma.cab-subs-invite+xml','application/vnd.oma.cab-user-prefs+xml','application/vnd.oma.dcd','application/vnd.oma.dcdc','application/vnd.oma.dd2+xml','application/vnd.oma.drm.risd+xml','application/vnd.oma.group-usage-list+xml','application/vnd.oma.lwm2m+cbor','application/vnd.oma.lwm2m+json','application/vnd.oma.lwm2m+tlv','application/vnd.oma.pal+xml','application/vnd.oma.poc.detailed-progress-report+xml','application/vnd.oma.poc.final-report+xml','application/vnd.oma.poc.groups+xml','application/vnd.oma.poc.invocation-descriptor+xml','application/vnd.oma.poc.optimized-progress-report+xml','application/vnd.oma.push','application/vnd.oma.scidm.messages+xml','application/vnd.oma.xcap-directory+xml','application/vnd.omads-email+xml','application/vnd.omads-file+xml','application/vnd.omads-folder+xml','application/vnd.omaloc-supl-init','application/vnd.oms.cellular-cose-content+cbor','application/vnd.onepager','application/vnd.onepagertamp','application/vnd.onepagertamx','application/vnd.onepagertat','application/vnd.onepagertatp','application/vnd.onepagertatx','application/vnd.onvif.metadata','application/vnd.openblox.game-binary','application/vnd.openblox.game+xml','application/vnd.openeye.oeb','application/vnd.openstreetmap.data+xml','application/vnd.opentimestamps.ots','application/vnd.openvpi.dspx+json','application/vnd.openxmlformats-officedocument.custom-properties+xml','application/vnd.openxmlformats-officedocument.customXmlProperties+xml','application/vnd.openxmlformats-officedocument.drawing+xml','application/vnd.openxmlformats-officedocument.drawingml.chart+xml','application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml','application/vnd.openxmlformats-officedocument.drawingml.diagramColors+xml','application/vnd.openxmlformats-officedocument.drawingml.diagramData+xml','application/vnd.openxmlformats-officedocument.drawingml.diagramLayout+xml','application/vnd.openxmlformats-officedocument.drawingml.diagramStyle+xml','application/vnd.openxmlformats-officedocument.extended-properties+xml','application/vnd.openxmlformats-officedocument.presentationml.commentAuthors+xml','application/vnd.openxmlformats-officedocument.presentationml.comments+xml','application/vnd.openxmlformats-officedocument.presentationml.handoutMaster+xml','application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml','application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml','application/vnd.openxmlformats-officedocument.presentationml.presProps+xml','application/vnd.openxmlformats-officedocument.presentationml.slide','application/vnd.openxmlformats-officedocument.presentationml.slide+xml','application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml','application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml','application/vnd.openxmlformats-officedocument.presentationml.slideshow','application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml','application/vnd.openxmlformats-officedocument.presentationml.slideUpdateInfo+xml','application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml','application/vnd.openxmlformats-officedocument.presentationml.tags+xml','application/vnd.openxmlformats-officedocument.presentationml.template','application/vnd.openxmlformats-officedocument.presentationml.template.main+xml','application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.calcChain+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.externalLink+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheDefinition+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheRecords+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.pivotTable+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.queryTable+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.revisionHeaders+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.revisionLog+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.sheetMetadata+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.tableSingleCells+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.template','application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.userNames+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.volatileDependencies+xml','application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml','application/vnd.openxmlformats-officedocument.theme+xml','application/vnd.openxmlformats-officedocument.themeOverride+xml','application/vnd.openxmlformats-officedocument.vmlDrawing','application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml','application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml','application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml','application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml','application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml','application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml','application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml','application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml','application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml','application/vnd.openxmlformats-officedocument.wordprocessingml.template','application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml','application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml','application/vnd.openxmlformats-package.core-properties+xml','application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml','application/vnd.openxmlformats-package.relationships+xml','application/vnd.oracle.resource+json','application/vnd.orange.indata','application/vnd.osa.netdeploy','application/vnd.osgeo.mapguide.package','application/vnd.osgi.bundle','application/vnd.osgi.dp','application/vnd.osgi.subsystem','application/vnd.otps.ct-kip+xml','application/vnd.oxli.countgraph','application/vnd.pagerduty+json','application/vnd.palm','application/vnd.panoply','application/vnd.paos.xml','application/vnd.patentdive','application/vnd.patientecommsdoc','application/vnd.pawaafile','application/vnd.pcos','application/vnd.pg.format','application/vnd.pg.osasli','application/vnd.piaccess.application-licence','application/vnd.picsel','application/vnd.pmi.widget','application/vnd.pmtiles','application/vnd.poc.group-advertisement+xml','application/vnd.pocketlearn','application/vnd.powerbuilder6','application/vnd.powerbuilder6-s','application/vnd.powerbuilder7','application/vnd.powerbuilder7-s','application/vnd.powerbuilder75','application/vnd.powerbuilder75-s','application/vnd.preminet','application/vnd.previewsystems.box','application/vnd.proteus.magazine','application/vnd.psfs','application/vnd.pt.mundusmundi','application/vnd.publishare-delta-tree','application/vnd.pvi.ptid1','application/vnd.pwg-multiplexed','application/vnd.pwg-xhtml-print+xml','application/vnd.pyon+json','application/vnd.qualcomm.brew-app-res','application/vnd.quarantainenet','application/vnd.Quark.QuarkXPress','application/vnd.quobject-quoxdocument','application/vnd.radisys.moml+xml','application/vnd.radisys.msml-audit-conf+xml','application/vnd.radisys.msml-audit-conn+xml','application/vnd.radisys.msml-audit-dialog+xml','application/vnd.radisys.msml-audit-stream+xml','application/vnd.radisys.msml-audit+xml','application/vnd.radisys.msml-conf+xml','application/vnd.radisys.msml-dialog-base+xml','application/vnd.radisys.msml-dialog-fax-detect+xml','application/vnd.radisys.msml-dialog-fax-sendrecv+xml','application/vnd.radisys.msml-dialog-group+xml','application/vnd.radisys.msml-dialog-speech+xml','application/vnd.radisys.msml-dialog-transform+xml','application/vnd.radisys.msml-dialog+xml','application/vnd.radisys.msml+xml','application/vnd.rainstor.data','application/vnd.rapid','application/vnd.rar','application/vnd.realvnc.bed','application/vnd.recordare.musicxml','application/vnd.recordare.musicxml+xml','application/vnd.relpipe','application/vnd.RenLearn.rlprint','application/vnd.resilient.logic','application/vnd.restful+json','application/vnd.rig.cryptonote','application/vnd.route66.link66+xml','application/vnd.rs-274x','application/vnd.ruckus.download','application/vnd.s3sms','application/vnd.sailingtracker.track','application/vnd.sar','application/vnd.sbm.cid','application/vnd.sbm.mid2','application/vnd.scribus','application/vnd.sealed.3df','application/vnd.sealed.csf','application/vnd.sealed.doc','application/vnd.sealed.eml','application/vnd.sealed.mht','application/vnd.sealed.net','application/vnd.sealed.ppt','application/vnd.sealed.tiff','application/vnd.sealed.xls','application/vnd.sealedmedia.softseal.html','application/vnd.sealedmedia.softseal.pdf','application/vnd.seemail','application/vnd.seis+json','application/vnd.sema','application/vnd.semd','application/vnd.semf','application/vnd.shade-save-file','application/vnd.shana.informed.formdata','application/vnd.shana.informed.formtemplate','application/vnd.shana.informed.interchange','application/vnd.shana.informed.package','application/vnd.shootproof+json','application/vnd.shopkick+json','application/vnd.shp','application/vnd.shx','application/vnd.sigrok.session','application/vnd.SimTech-MindMapper','application/vnd.siren+json','application/vnd.sketchometry','application/vnd.smaf','application/vnd.smart.notebook','application/vnd.smart.teacher','application/vnd.smintio.portals.archive','application/vnd.snesdev-page-table','application/vnd.software602.filler.form-xml-zip','application/vnd.software602.filler.form+xml','application/vnd.solent.sdkm+xml','application/vnd.spotfire.dxp','application/vnd.spotfire.sfs','application/vnd.sqlite3','application/vnd.sss-cod','application/vnd.sss-dtf','application/vnd.sss-ntf','application/vnd.stepmania.package','application/vnd.stepmania.stepchart','application/vnd.street-stream','application/vnd.sun.wadl+xml','application/vnd.superfile.super','application/vnd.sus-calendar','application/vnd.svd','application/vnd.swiftview-ics','application/vnd.sybyl.mol2','application/vnd.sycle+xml','application/vnd.syft+json','application/vnd.syncml.dm.notification','application/vnd.syncml.dm+wbxml','application/vnd.syncml.dm+xml','application/vnd.syncml.dmddf+wbxml','application/vnd.syncml.dmddf+xml','application/vnd.syncml.dmtnds+wbxml','application/vnd.syncml.dmtnds+xml','application/vnd.syncml.ds.notification','application/vnd.syncml+xml','application/vnd.tableschema+json','application/vnd.tao.intent-module-archive','application/vnd.tcpdump.pcap','application/vnd.think-cell.ppttc+json','application/vnd.tmd.mediaflex.api+xml','application/vnd.tml','application/vnd.tmobile-livetv','application/vnd.tri.onesource','application/vnd.trid.tpt','application/vnd.triscape.mxs','application/vnd.trueapp','application/vnd.truedoc','application/vnd.ubisoft.webplayer','application/vnd.ufdl','application/vnd.uic.osdm+json','application/vnd.uiq.theme','application/vnd.umajin','application/vnd.unity','application/vnd.uoml+xml','application/vnd.uplanet.alert','application/vnd.uplanet.alert-wbxml','application/vnd.uplanet.bearer-choice','application/vnd.uplanet.bearer-choice-wbxml','application/vnd.uplanet.cacheop','application/vnd.uplanet.cacheop-wbxml','application/vnd.uplanet.channel','application/vnd.uplanet.channel-wbxml','application/vnd.uplanet.list','application/vnd.uplanet.list-wbxml','application/vnd.uplanet.listcmd','application/vnd.uplanet.listcmd-wbxml','application/vnd.uplanet.signal','application/vnd.uri-map','application/vnd.valve.source.material','application/vnd.vcx','application/vnd.vd-study','application/vnd.vectorworks','application/vnd.vel+json','application/vnd.veraison.tsm-report+cbor','application/vnd.veraison.tsm-report+json','application/vnd.verimatrix.vcas','application/vnd.veritone.aion+json','application/vnd.veryant.thin','application/vnd.ves.encrypted','application/vnd.vidsoft.vidconference','application/vnd.visio','application/vnd.visionary','application/vnd.vividence.scriptfile','application/vnd.vocalshaper.vsp4','application/vnd.vsf','application/vnd.wantverse','application/vnd.wap.sic','application/vnd.wap.slc','application/vnd.wap.wbxml','application/vnd.wap.wmlc','application/vnd.wap.wmlscriptc','application/vnd.wasmflow.wafl','application/vnd.webturbo','application/vnd.wfa.dpp','application/vnd.wfa.p2p','application/vnd.wfa.wsc','application/vnd.windows.devicepairing','application/vnd.wmc','application/vnd.wmf.bootstrap','application/vnd.wolfram.mathematica','application/vnd.wolfram.mathematica.package','application/vnd.wolfram.player','application/vnd.wordlift','application/vnd.wordperfect','application/vnd.wqd','application/vnd.wrq-hp3000-labelled','application/vnd.wt.stf','application/vnd.wv.csp+wbxml','application/vnd.wv.csp+xml','application/vnd.wv.ssp+xml','application/vnd.xacml+json','application/vnd.xara','application/vnd.xarin.cpj','application/vnd.xecrets-encrypted','application/vnd.xfdl','application/vnd.xfdl.webform','application/vnd.xmi+xml','application/vnd.xmpie.cpkg','application/vnd.xmpie.dpkg','application/vnd.xmpie.plan','application/vnd.xmpie.ppkg','application/vnd.xmpie.xlim','application/vnd.yamaha.hv-dic','application/vnd.yamaha.hv-script','application/vnd.yamaha.hv-voice','application/vnd.yamaha.openscoreformat','application/vnd.yamaha.openscoreformat.osfpvg+xml','application/vnd.yamaha.remote-setup','application/vnd.yamaha.smaf-audio','application/vnd.yamaha.smaf-phrase','application/vnd.yamaha.through-ngn','application/vnd.yamaha.tunnel-udpencap','application/vnd.yaoweme','application/vnd.yellowriver-custom-menu','application/vnd.youtube.yt','application/vnd.zul','application/vnd.zzazz.deck+xml','application/voicexml+xml','application/voucher-cms+json','application/voucher-jws+json','application/vp','application/vp+cose','application/vp+jwt','application/vq-rtcpxr','application/wasm','application/watcherinfo+xml','application/webpush-options+json','application/whoispp-query','application/whoispp-response','application/widget','application/wita','application/wordperfect5.1','application/wsdl+xml','application/wspolicy+xml','application/x-pki-message','application/x-www-form-urlencoded','application/x-x509-ca-cert','application/x-x509-ca-ra-cert','application/x-x509-next-ca-cert','application/x400-bp','application/xacml+xml','application/xcap-att+xml','application/xcap-caps+xml','application/xcap-diff+xml','application/xcap-el+xml','application/xcap-error+xml','application/xcap-ns+xml','application/xcon-conference-info-diff+xml','application/xcon-conference-info+xml','application/xenc+xml','application/xfdf','application/xhtml+xml','application/xliff+xml','application/xml','application/xml-dtd','application/xml-external-parsed-entity','application/xml-patch+xml','application/xmpp+xml','application/xop+xml','application/xslt+xml','application/xv+xml','application/yaml','application/yang','application/yang-data+cbor','application/yang-data+json','application/yang-data+xml','application/yang-patch+json','application/yang-patch+xml','application/yang-sid+json','application/yin+xml','application/zip','application/zlib','application/zstd','audio/1d-interleaved-parityfec','audio/32kadpcm','audio/3gpp','audio/3gpp2','audio/aac','audio/ac3','audio/AMR','audio/AMR-WB','audio/amr-wb+','audio/aptx','audio/asc','audio/ATRAC-ADVANCED-LOSSLESS','audio/ATRAC-X','audio/ATRAC3','audio/basic','audio/BV16','audio/BV32','audio/clearmode','audio/CN','audio/DAT12','audio/dls','audio/dsr-es201108','audio/dsr-es202050','audio/dsr-es202211','audio/dsr-es202212','audio/DV','audio/DVI4','audio/eac3','audio/encaprtp','audio/EVRC','audio/EVRC-QCP','audio/EVRC0','audio/EVRC1','audio/EVRCB','audio/EVRCB0','audio/EVRCB1','audio/EVRCNW','audio/EVRCNW0','audio/EVRCNW1','audio/EVRCWB','audio/EVRCWB0','audio/EVRCWB1','audio/EVS','audio/example','audio/flac','audio/flexfec','audio/fwdred','audio/G711-0','audio/G719','audio/G722','audio/G7221','audio/G723','audio/G726-16','audio/G726-24','audio/G726-32','audio/G726-40','audio/G728','audio/G729','audio/G7291','audio/G729D','audio/G729E','audio/GSM','audio/GSM-EFR','audio/GSM-HR-08','audio/iLBC','audio/ip-mr_v2.5','audio/L16','audio/L20','audio/L24','audio/L8','audio/LPC','audio/matroska','audio/MELP','audio/MELP1200','audio/MELP2400','audio/MELP600','audio/mhas','audio/midi-clip','audio/mobile-xmf','audio/mp4','audio/MP4A-LATM','audio/MPA','audio/mpa-robust','audio/mpeg','audio/mpeg4-generic','audio/ogg','audio/opus','audio/parityfec','audio/PCMA','audio/PCMA-WB','audio/PCMU','audio/PCMU-WB','audio/prs.sid','audio/QCELP','audio/raptorfec','audio/RED','audio/rtp-enc-aescm128','audio/rtp-midi','audio/rtploopback','audio/rtx','audio/scip','audio/SMV','audio/SMV-QCP','audio/SMV0','audio/sofa','audio/sp-midi','audio/speex','audio/t140c','audio/t38','audio/telephone-event','audio/TETRA_ACELP','audio/TETRA_ACELP_BB','audio/tone','audio/TSVCIS','audio/UEMCLIP','audio/ulpfec','audio/usac','audio/VDVI','audio/VMR-WB','audio/vnd.3gpp.iufp','audio/vnd.4SB','audio/vnd.audiokoz','audio/vnd.blockfact.facta','audio/vnd.CELP','audio/vnd.cisco.nse','audio/vnd.cmles.radio-events','audio/vnd.cns.anp1','audio/vnd.cns.inf1','audio/vnd.dece.audio','audio/vnd.digital-winds','audio/vnd.dlna.adts','audio/vnd.dolby.heaac.1','audio/vnd.dolby.heaac.2','audio/vnd.dolby.mlp','audio/vnd.dolby.mps','audio/vnd.dolby.pl2','audio/vnd.dolby.pl2x','audio/vnd.dolby.pl2z','audio/vnd.dolby.pulse.1','audio/vnd.dra','audio/vnd.dts','audio/vnd.dts.hd','audio/vnd.dts.uhd','audio/vnd.dvb.file','audio/vnd.everad.plj','audio/vnd.hns.audio','audio/vnd.lucent.voice','audio/vnd.ms-playready.media.pya','audio/vnd.nokia.mobile-xmf','audio/vnd.nortel.vbk','audio/vnd.nuera.ecelp4800','audio/vnd.nuera.ecelp7470','audio/vnd.nuera.ecelp9600','audio/vnd.octel.sbc','audio/vnd.presonus.multitrack','audio/vnd.qcelp','audio/vnd.rhetorex.32kadpcm','audio/vnd.rip','audio/vnd.sealedmedia.softseal.mpeg','audio/vnd.vmx.cvsd','audio/vorbis','audio/vorbis-config','font/collection','font/otf','font/sfnt','font/ttf','font/woff','font/woff2','haptics/hjif','haptics/hmpg','haptics/ivs','image/aces','image/apng','image/avci','image/avcs','image/avif','image/bmp','image/cgm','image/dicom-rle','image/dpx','image/emf','image/example','image/fits','image/g3fax','image/gif','image/heic','image/heic-sequence','image/heif','image/heif-sequence','image/hej2k','image/hsj2','image/ief','image/j2c','image/jaii','image/jais','image/jls','image/jp2','image/jpeg','image/jph','image/jphc','image/jpm','image/jpx','image/jxl','image/jxr','image/jxrA','image/jxrS','image/jxs','image/jxsc','image/jxsi','image/jxss','image/ktx','image/ktx2','image/naplps','image/png','image/prs.btif','image/prs.pti','image/pwg-raster','image/svg+xml','image/t38','image/tiff','image/tiff-fx','image/vnd.adobe.photoshop','image/vnd.airzip.accelerator.azv','image/vnd.blockfact.facti','image/vnd.clip','image/vnd.cns.inf2','image/vnd.dece.graphic','image/vnd.djvu','image/vnd.dvb.subtitle','image/vnd.dwg','image/vnd.dxf','image/vnd.fastbidsheet','image/vnd.fpx','image/vnd.fst','image/vnd.fujixerox.edmics-mmr','image/vnd.fujixerox.edmics-rlc','image/vnd.globalgraphics.pgb','image/vnd.microsoft.icon','image/vnd.mix','image/vnd.mozilla.apng','image/vnd.ms-modi','image/vnd.net-fpx','image/vnd.pco.b16','image/vnd.radiance','image/vnd.sealed.png','image/vnd.sealedmedia.softseal.gif','image/vnd.sealedmedia.softseal.jpg','image/vnd.svf','image/vnd.tencent.tap','image/vnd.valve.source.texture','image/vnd.wap.wbmp','image/vnd.xiff','image/vnd.zbrush.pcx','image/webp','image/wmf','image/x-emf','image/x-wmf','message/bhttp','message/CPIM','message/delivery-status','message/disposition-notification','message/example','message/external-body','message/feedback-report','message/global','message/global-delivery-status','message/global-disposition-notification','message/global-headers','message/http','message/imdn+xml','message/mls','message/news','message/ohttp-req','message/ohttp-res','message/partial','message/rfc822','message/s-http','message/sip','message/sipfrag','message/tracking-status','message/vnd.si.simp','message/vnd.wfa.wsc','model/3mf','model/e57','model/example','model/gltf-binary','model/gltf+json','model/iges','model/JT','model/mesh','model/mtl','model/obj','model/prc','model/step','model/step-xml+zip','model/step+xml','model/step+zip','model/stl','model/u3d','model/vnd.bary','model/vnd.cld','model/vnd.collada+xml','model/vnd.dwf','model/vnd.flatland.3dml','model/vnd.gdl','model/vnd.gs-gdl','model/vnd.gtw','model/vnd.moml+xml','model/vnd.mts','model/vnd.opengex','model/vnd.parasolid.transmit.binary','model/vnd.parasolid.transmit.text','model/vnd.pytha.pyox','model/vnd.rosette.annotated-data-model','model/vnd.sap.vds','model/vnd.usda','model/vnd.usdz+zip','model/vnd.valve.source.compiled-map','model/vnd.vtu','model/vrml','model/x3d-vrml','model/x3d+fastinfoset','model/x3d+xml','text/1d-interleaved-parityfec','text/cache-manifest','text/calendar','text/cql','text/cql-expression','text/cql-identifier','text/css','text/csv','text/csv-schema','text/directory','text/dns','text/ecmascript','text/encaprtp','text/enriched','text/example','text/fhirpath','text/flexfec','text/fwdred','text/gff3','text/grammar-ref-list','text/hl7v2','text/html','text/javascript','text/jcr-cnd','text/markdown','text/mizar','text/n3','text/parameters','text/parityfec','text/plain','text/provenance-notation','text/prs.fallenstein.rst','text/prs.lines.tag','text/prs.prop.logic','text/prs.texi','text/raptorfec','text/RED','text/rfc822-headers','text/richtext','text/rtf','text/rtp-enc-aescm128','text/rtploopback','text/rtx','text/SGML','text/shaclc','text/shex','text/spdx','text/strings','text/t140','text/tab-separated-values','text/troff','text/turtle','text/ulpfec','text/uri-list','text/vcard','text/vnd.a','text/vnd.abc','text/vnd.ascii-art','text/vnd.curl','text/vnd.debian.copyright','text/vnd.DMClientScript','text/vnd.dvb.subtitle','text/vnd.esmertec.theme-descriptor','text/vnd.exchangeable','text/vnd.familysearch.gedcom','text/vnd.ficlab.flt','text/vnd.fly','text/vnd.fmi.flexstor','text/vnd.gml','text/vnd.graphviz','text/vnd.hans','text/vnd.hgl','text/vnd.in3d.3dml','text/vnd.in3d.spot','text/vnd.IPTC.NewsML','text/vnd.IPTC.NITF','text/vnd.latex-z','text/vnd.motorola.reflex','text/vnd.ms-mediapackage','text/vnd.net2phone.commcenter.command','text/vnd.radisys.msml-basic-layout','text/vnd.senx.warpscript','text/vnd.si.uricatalogue','text/vnd.sosi','text/vnd.sun.j2me.app-descriptor','text/vnd.trolltech.linguist','text/vnd.typst','text/vnd.vcf','text/vnd.wap.si','text/vnd.wap.sl','text/vnd.wap.wml','text/vnd.wap.wmlscript','text/vnd.zoo.kcl','text/vtt','text/wgsl','text/xml','text/xml-external-parsed-entity','video/1d-interleaved-parityfec','video/3gpp','video/3gpp-tt','video/3gpp2','video/AV1','video/BMPEG','video/BT656','video/CelB','video/DV','video/encaprtp','video/evc','video/example','video/FFV1','video/flexfec','video/H261','video/H263','video/H263-1998','video/H263-2000','video/H264','video/H264-RCDO','video/H264-SVC','video/H265','video/H266','video/iso.segment','video/JPEG','video/jpeg2000','video/jpeg2000-scl','video/jxsv','video/lottie+json','video/matroska','video/matroska-3d','video/mj2','video/MP1S','video/MP2P','video/MP2T','video/mp4','video/MP4V-ES','video/mpeg','video/mpeg4-generic','video/MPV','video/nv','video/ogg','video/parityfec','video/pointer','video/quicktime','video/raptorfec','video/raw','video/rtp-enc-aescm128','video/rtploopback','video/rtx','video/scip','video/smpte291','video/SMPTE292M','video/ulpfec','video/vc1','video/vc2','video/vnd.blockfact.factv','video/vnd.CCTV','video/vnd.dece.hd','video/vnd.dece.mobile','video/vnd.dece.mp4','video/vnd.dece.pd','video/vnd.dece.sd','video/vnd.dece.video','video/vnd.directv.mpeg','video/vnd.directv.mpeg-tts','video/vnd.dlna.mpeg-tts','video/vnd.dvb.file','video/vnd.fvt','video/vnd.hns.video','video/vnd.iptvforum.1dparityfec-1010','video/vnd.iptvforum.1dparityfec-2005','video/vnd.iptvforum.2dparityfec-1010','video/vnd.iptvforum.2dparityfec-2005','video/vnd.iptvforum.ttsavc','video/vnd.iptvforum.ttsmpeg2','video/vnd.motorola.video','video/vnd.motorola.videop','video/vnd.mpegurl','video/vnd.ms-playready.media.pyv','video/vnd.nokia.interleaved-multimedia','video/vnd.nokia.mp4vr','video/vnd.nokia.videovoip','video/vnd.objectvideo','video/vnd.planar','video/vnd.radgamettools.bink','video/vnd.radgamettools.smacker','video/vnd.sealed.mpeg1','video/vnd.sealed.mpeg4','video/vnd.sealed.swf','video/vnd.sealedmedia.softseal.mov','video/vnd.uvvu.mp4','video/vnd.vivo','video/vnd.youtube.yt','video/VP8','video/VP9');
CREATE TYPE kafkaProducerAcks AS ENUM ('all','leader','none');
CREATE TYPE kafkaProducerAuthentication AS ENUM ('none','basic','digest','plaintext','sasl_ssl','sasl_plain');
CREATE TYPE kafkaProducerCompressionMethod AS ENUM ('none','gzip');
CREATE TYPE languageCode AS ENUM ('aa' ,'ab' ,'ae' ,'af' ,'ak' ,'am' ,'an' ,'ar' ,'as' ,'av' ,'ay' ,'az' ,'ba' ,'be' ,'bg' ,'bh' ,'bi' ,'bm' ,'bn' ,'bo' ,'br' ,'bs' ,'ca' ,'ce' ,'ch' ,'co' ,'cr' ,'cs' ,'cu' ,'cv' ,'cy' ,'da' ,'de' ,'dv' ,'dz' ,'ee' ,'el' ,'en' ,'eo' ,'es' ,'et' ,'eu' ,'fa' ,'ff' ,'fi' ,'fj' ,'fo' ,'fr' ,'fy' ,'ga' ,'gd' ,'gl' ,'gn' ,'gu' ,'gv' ,'ha' ,'he' ,'hi' ,'ho' ,'hr' ,'ht' ,'hu' ,'hy' ,'hz' ,'ia' ,'id' ,'ie' ,'ig' ,'ii' ,'ik' ,'io' ,'is' ,'it' ,'iu' ,'ja' ,'jv' ,'ka' ,'kg' ,'ki' ,'kj' ,'kk' ,'kl' ,'km' ,'kn' ,'ko' ,'kr' ,'ks' ,'ku' ,'kv' ,'kw' ,'ky' ,'la' ,'lb' ,'lg' ,'li' ,'ln' ,'lo' ,'lt' ,'lu' ,'lv' ,'mg' ,'mh' ,'mi' ,'mk' ,'ml' ,'mn' ,'mr' ,'ms' ,'mt' ,'my' ,'na' ,'nb' ,'nd' ,'ne' ,'ng' ,'nl' ,'nn' ,'nr' ,'nv' ,'ny' ,'oc' ,'oj' ,'om' ,'or' ,'os' ,'pa' ,'pi' ,'pl' ,'ps' ,'pt' ,'qu' ,'rm' ,'rn' ,'ro' ,'ru' ,'rw' ,'sa' ,'sc' ,'sd' ,'se' ,'sg' ,'si' ,'sk' ,'sl' ,'sm' ,'sn' ,'so' ,'sq' ,'sr' ,'ss' ,'st' ,'su' ,'sv' ,'sw' ,'ta' ,'te' ,'tg' ,'th' ,'ti' ,'tk' ,'tl' ,'tn' ,'to' ,'tr' ,'ts' ,'tt' ,'tw' ,'ty' ,'ug' ,'uk' ,'ur' ,'uz' ,'ve' ,'vi' ,'vo' ,'wa' ,'wo' ,'xh' ,'yi' ,'yo' ,'za' ,'zh' ,'zu');
CREATE TYPE languageName AS ENUM ('Afar (aar)' ,'Abkhaz (abk)' ,'Avestan (ave)' ,'Afrikaans (afr)' ,'Akan (aka)' ,'Amharic (amh)' ,'Aragonese (arg)' ,'Arabic (ara)' ,'Assamese (asm)' ,'Avaric (ava)' ,'Aymara (aym)' ,'Azerbaijani (aze)' ,'Bashkir (bak)' ,'Belarusian (bel)' ,'Bulgarian (bul)' ,'Bihari (bih)' ,'Bislama (bis)' ,'Bambara (bam)' ,'Bengali (ben)' ,'Tibetan (bod, tib)' ,'Breton (bre)' ,'Bosnian (bos)' ,'Catalan (cat)' ,'Chechen (che)' ,'Chamorro (cha)' ,'Corsican (cos)' ,'Cree (cre)' ,'Czech (ces, cze)' ,'Church Slavonic (chu)' ,'Chuvash (chv)' ,'Welsh (cym, wel)' ,'Danish (dan)' ,'German (deu, ger)' ,'Dhivehi (div)' ,'Dzongkha (dzo)' ,'Ewe (ewe)' ,'Greek (ell, gre)' ,'English (eng)' ,'Esperanto (epo)' ,'Spanish (spa)' ,'Estonian (est)' ,'Basque (eus, baq)' ,'Persian (fas, per)' ,'Fula (ful)' ,'Finnish (fin)' ,'Fijian (fij)' ,'Faroese (fao)' ,'French (fra, fre)' ,'West Frisian (fry)' ,'Irish (gle)' ,'Scottish Gaelic (gla)' ,'Galician (glg)' ,'Guaraní (grn)' ,'Gujarati (guj)' ,'Manx (glv)' ,'Hausa (hau)' ,'Hebrew (heb)' ,'Hindi (hin)' ,'Hiri Motu (hmo)' ,'Croatian (hrv)' ,'Haitian (hat)' ,'Hungarian (hun)' ,'Armenian (hye, arm)' ,'Herero (her)' ,'Interlingua (ina)' ,'Indonesian (ind)' ,'Interlingue (ile)' ,'Igbo (ibo)' ,'Nuosu (iii)' ,'Inupiaq (ipk)' ,'Ido (ido)' ,'Icelandic (isl, ice)' ,'Italian (ita)' ,'Inuktitut (iku)' ,'Japanese (jpn)' ,'Javanese (jav)' ,'Georgian (kat, geo)' ,'Kongo (kon)' ,'Kikuyu (kik)' ,'Kwanyama (kua)' ,'Kazakh (kaz)' ,'Kalaallisut (kal)' ,'Khmer (khm)' ,'Kannada (kan)' ,'Korean (kor)' ,'Kanuri (kau)' ,'Kashmiri (kas)' ,'Kurdish (kur)' ,'Komi (kom)' ,'Cornish (cor)' ,'Kyrgyz (kir)' ,'Latin (lat)' ,'Luxembourgish (ltz)' ,'Ganda (lug)' ,'Limburgish (lim)' ,'Lingala (lin)' ,'Lao (lao)' ,'Lithuanian (lit)' ,'Luba-Katanga (lub)' ,'Latvian (lav)' ,'Malagasy (mlg)' ,'Marshallese (mah)' ,'Māori (mir, mao)' ,'Macedonian (mkd, mac)' ,'Malayalam (mal)' ,'Mongolian (mon)' ,'Marathi (mar)' ,'Malay (msa, may)' ,'Maltese (mlt)' ,'Burmese (may, bur)' ,'Nauru (nau)' ,'Norwegian Bokmål (nob)' ,'Northern Ndebele (nde)' ,'Nepali (nep)' ,'Ndonga (ndo)' ,'Dutch (nld, dut)' ,'Norwegian Nynorsk (nno)' ,'Southern Ndebele (nbl)' ,'Navajo (nav)' ,'Chichewa (nya)' ,'Occitan (oci)' ,'Ojibwe (oji)' ,'Oromo (orm)' ,'Oriya (ori)' ,'Ossetian (oss)' ,'Punjabi (pan)' ,'Pāli (pli)' ,'Polish (pol)' ,'Pashto (pus)' ,'Portuguese (por)' ,'Quechua (que)' ,'Romansh (roh)' ,'Kirundi (run)' ,'Romanian (ron, rum)' ,'Russian (run)' ,'Kinyarwanda (kin)' ,'Sanskrit (san)' ,'Sardinian (srd)' ,'Sindhi (snd)' ,'Northern Sami (sme)' ,'Sango (sag)' ,'Sinhala (sin)' ,'Slovak (slk, slo)' ,'Slovene (slv)' ,'Samoan (smo)' ,'Shona (sna)' ,'Somali (som)' ,'Albanian (sqi, alb)' ,'Serbian (srp)' ,'Swati (ssw)' ,'Southern Sotho (sot)' ,'Sundanese (sun)' ,'Swedish (swe)' ,'Swahili (swa)' ,'Tamil (tam)' ,'Telugu (tel)' ,'Tajik (tgk)' ,'Thai (tha)' ,'Tigrinya (tir)' ,'Turkmen (tuk)' ,'Tagalog (tgl)' ,'Tswana (tsn)' ,'Tongan (ton)' ,'Turkish (tur)' ,'Tsonga (tso)' ,'Tatar (tat)' ,'Twi (twi)' ,'Tahitian (tah)' ,'Uighur (uig)' ,'Ukrainian (ukr)' ,'Urdu (urd)' ,'Uzbek (uzb)' ,'Venda (ven)' ,'Vietnamese (vie)' ,'Volapük (vol)' ,'Walloon (wln)' ,'Wolof (wol)' ,'Xhosa (xho)' ,'Yiddish (yid)' ,'Yoruba (yor)' ,'Zhuang (zha)' ,'Chinese (zho, chi)' ,'Zulu (zul)');
CREATE TYPE mapVendorPlatform AS ENUM ('OpenStreet Map','Google Maps','Microsoft Azure','ERSI');
CREATE TYPE managementProtocol AS ENUM ('http','netconf','snmp','ssh','telnet','none');
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
CREATE TYPE fetchResourceType AS ENUM ('external','lni','ne','pni');
CREATE TYPE predictResourceType AS ENUM ('cable','duct','ne','pole','rack','service','site','trench');
CREATE TYPE predictResourceStateType AS ENUM ('create','delete','update','undelete','read');
CREATE TYPE serviceType AS ENUM ('broadband','circuit','ethernet','sogea','fttx','optical','unclassified','voice');
CREATE TYPE siteType AS ENUM ('adu', 'colo', 'commercial', 'dc', 'exchange', 'mdu', 'pop', 'sdu', 'street', 'unclassified','utility');
CREATE TYPE secretType AS ENUM ('identity','plain','snmp','ssh','ssl','token');
CREATE TYPE snmpVersion AS ENUM ('v1','v2c','v3');
CREATE TYPE snmpAuthorizationProtcol AS ENUM ('MD5','SHA');
CREATE TYPE snmpEncryptionProtocol AS ENUM ('DES','AES-128');
CREATE TYPE sizeUnit AS ENUM ('cm','mm','m','km','Mm','inch','feet');
CREATE TYPE slotState AS ENUM ('free','used','reserved','faulty');
CREATE TYPE source AS ENUM ('historical','planned','predicted');
CREATE TYPE trenchPurpose AS ENUM ('service/drop','ring','backhaul','pole','tower','unclassified');
CREATE TYPE trenchState AS ENUM ('free','used','reserved','faulty');
CREATE TYPE workflowEngineType AS ENUM ('bpmn','elsa');
CREATE TYPE worldGeometryType AS ENUM ('Polygon','MultiPolygon');

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
CREATE SEQUENCE IF NOT EXISTS seq_document;
CREATE SEQUENCE IF NOT EXISTS seq_cvePlatforms;
CREATE SEQUENCE IF NOT EXISTS seq_cveVersions;
CREATE SEQUENCE IF NOT EXISTS seq_dashboard;
CREATE SEQUENCE IF NOT EXISTS seq_duct;
CREATE SEQUENCE IF NOT EXISTS seq_fetchQueue;
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
CREATE SEQUENCE IF NOT EXISTS seq_worldGeoCoordinate;
CREATE SEQUENCE IF NOT EXISTS seq_worldGeoPolygon;

---
--- parent referential tables
---

CREATE TABLE IF NOT EXISTS secret (
    scope VARCHAR NOT NULL,
    realm VARCHAR NOT NULL,
    type secretType NOT NULL,
    expiration TIMESTAMP,
    identityProviderBase VARCHAR,
    identityProviderAuthorization VARCHAR,
    identityProviderToken VARCHAR,
    identityProviderWellKnown VARCHAR,
    plainUsername VARCHAR,
    plainPassword VARCHAR,
    sshUsername VARCHAR,
    sshKeyPassphrase VARCHAR,
    sshKeyPublic VARCHAR USING COMPRESSION zstd,
    sshKeyPrivate VARCHAR USING COMPRESSION zstd,
    sshHostCA VARCHAR USING COMPRESSION zstd,
    sslPrivate VARCHAR USING COMPRESSION zstd,
    sslCA VARCHAR USING COMPRESSION zstd,
    snmpVersion snmpVersion,
    snmpCommunityRead VARCHAR,
    snmpCommunityWrite VARCHAR,
    snmpCommunityTrap VARCHAR,
    snmpUsername VARCHAR,
    snmpAuthorizationProtocol snmpAuthorizationProtcol,
    snmpAuthorizationPassword VARCHAR,
    snmpEncryptionProtocol snmpEncryptionProtocol,
    snmpEncryptionPassword VARCHAR,
    tokenIdentity VARCHAR,
    tokenKey VARCHAR,
    PRIMARY KEY (scope,realm,type)
);

CREATE TABLE IF NOT EXISTS document (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    plannedTsId INTEGER,
    predictedTsId INTEGER
);

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
    typeSecret secretType,
);
CREATE TABLE IF NOT EXISTS adminWorkflow (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    name VARCHAR NOT NULL,
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
    authentication restAuthentication NOT NULL DEFAULT 'none',
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
    plannedTsId INTEGER,
    predictedTsId INTEGER
);
CREATE TABLE IF NOT EXISTS duct (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    plannedTsId INTEGER,
    predictedTsId INTEGER
);
CREATE TABLE IF NOT EXISTS site (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    plannedTsId INTEGER,
    predictedTsId INTEGER
);
CREATE TABLE IF NOT EXISTS pole (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    plannedTsId INTEGER,
    predictedTsId INTEGER
);
CREATE TABLE IF NOT EXISTS cable (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    plannedTsId INTEGER,
    predictedTsId INTEGER
);
CREATE TABLE IF NOT EXISTS rack (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    plannedTsId INTEGER,
    predictedTsId INTEGER
);
CREATE TABLE IF NOT EXISTS ne (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    plannedTsId INTEGER,
    predictedTsId INTEGER
);
CREATE TABLE IF NOT EXISTS service (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    delete BOOLEAN NOT NULL DEFAULT false,
    tsPoint TIMESTAMP,
    historicalTsId INTEGER,
    plannedTsId INTEGER,
    predictedTsId INTEGER
);
CREATE TABLE IF NOT EXISTS fetchJob (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    description VARCHAR NOT NULL,
    protocol fetchProtocol NOT NULL,
    cronTime VARCHAR NOT NULL DEFAULT '0 0 * * *' CHECK (regexp_full_match(cronTime,'^(((\d+,)+\d+|((\d+|[*])[/]\d+|((JAN|FEB|APR|MA[RY]|JU[LN]|AUG|SEP|OCT|NOV|DEC)(-(JAN|FEB|APR|MA[RY]|JU[LN]|AUG|SEP|OCT|NOV|DEC))?))|(\d+-\d+)|\d+(-\d+)?[/]\d+(-\d+)?|\d+|[*]|(MON|TUE|WED|THU|FRI|SAT|SUN)(-(MON|TUE|WED|THU|FRI|SAT|SUN))?) ?){5}$')),
    enabled BOOLEAN NOT NULL DEFAULT false,
    neId VARCHAR,
    emailId VARCHAR,
    emailAddress VARCHAR CHECK (regexp_full_match(emailAddress,'[\w-\.]+@([\w-]+\.)+[\w-]{2,4}')),
    emailSubject VARCHAR CHECK (length(emailSubject) >= 1 AND length(emailSubject) <= 998),
    fileUrl VARCHAR,
    httpUrl VARCHAR,
    kafkaId VARCHAR,
    kafkaTopic VARCHAR,
    mysqlHost VARCHAR CHECK (regexp_full_match(mysqlHost,'(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])')),
    mysqlDatabase VARCHAR,
    mysqlSchema VARCHAR,
    mysqlPort INTEGER NOT NULL DEFAULT 3307 CHECK (mysqlPort >= 1 AND mysqlPort <= 65535),
    oracleHost VARCHAR CHECK (regexp_full_match(oracleHost,'(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])')),
    oracleProtocol VARCHAR NOT NULL DEFAULT 'TCP' CHECK (regexp_full_match(oracleProtocol,'(TCP|UDP)')), 
    oracleSid VARCHAR,
    oraclePort INTEGER NOT NULL DEFAULT 1521 CHECK (oraclePort >= 1 AND oraclePort <= 65535),
    oracleSchema VARCHAR,
    snmpReadOid VARCHAR,
    snmpMibDocumentId VARCHAR,
    workflowEngineId VARCHAR,
    workflowRunnerId VARCHAR,
    workflowName VARCHAR,
    retries INTEGER NOT NULL DEFAULT 1 CHECK (retries >= 0 AND retries <= 8),
    currentRetry INTEGER NOT NULL DEFAULT 0 CHECK (currentRetry >= 0 AND currentRetry <= 8),
    retryDelay INTEGER NOT NULL DEFAULT 60 CHECK (retryDelay >=0 AND retryDelay <= 86400), -- seconds
    maxLifeRetries INTEGER NOT NULL DEFAULT 16 CHECK (maxLifeRetries >= 0 AND maxLifeRetries <= 255),
    currentLifeRetries INTEGER NOT NULL DEFAULT 0 CHECK (currentLifeRetries >= 0 AND currentLifeRetries <= 255),
    function VARCHAR NOT NULL DEFAULT 'noop();',
    FOREIGN KEY (neId) REFERENCES ne (id),
    FOREIGN KEY (emailId) REFERENCES adminEmail (id),
    FOREIGN KEY (kafkaId) REFERENCES adminKafka (id),
    FOREIGN KEY (workflowEngineId) REFERENCES adminWorkflow (id),
    FOREIGN KEY (snmpMibDocumentId) REFERENCES document (id)
);
CREATE TABLE IF NOT EXISTS correlate (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    sourceObject VARCHAR NOT NULL,
    sourceReference VARCHAR NOT NULL,
    sourceValue VARCHAR NOT NULL,
    destinationObject VARCHAR NOT NULL,
    destinationReference VARCHAR NOT NULL,
    destinationValue VARCHAR NOT NULL,
    type correlationType NOT NULL,
    fetchJobId VARCHAR NOT NULL,
    FOREIGN KEY (fetchJobId) REFERENCES fetchJob (id)
);
CREATE TABLE IF NOT EXISTS fetchQueue (
    qId INTEGER NOT NULL DEFAULT nextval('seq_fetchQueue') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    delete BOOLEAN NOT NULL DEFAULT false,
    fetchJobId VARCHAR NOT NULL,
    FOREIGN KEY (fetchJobId) REFERENCES fetchJob (id)
);

CREATE TABLE IF NOT EXISTS worldGeo (
    id VARCHAR NOT NULL DEFAULT uuid() PRIMARY KEY,
    country countryCode NOT NULL,
    crs VARCHAR NOT NULL,
    geometryType worldGeometryType NOT NULL,
    geoCollection GEOMETRY
);

CREATE TABLE IF NOT EXISTS _worldGeoPolygon (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_worldGeoPolygon') PRIMARY KEY,
    worldGeoId VARCHAR NOT NULL,
    geometrySet INTEGER NOT NULL CHECK (geometrySet > 0),
    geoPolygon GEOMETRY,
    FOREIGN KEY (worldGeoId) REFERENCES worldGeo (id)
);

CREATE TABLE IF NOT EXISTS _worldGeoCoordinate (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_worldGeoCoordinate') PRIMARY KEY,
    worldGeoId VARCHAR NOT NULL,
    geometrySet INTEGER NOT NULL CHECK (geometrySet > 0),
    X DECIMAL(9,6) NOT NULL DEFAULT 0 CHECK (X >= -180 AND X <= 180),
    Y DECIMAL(9,6) NOT NULL DEFAULT 0 CHECK (Y >= -90 AND Y <= 90),
    geoPoint GEOMETRY,
    FOREIGN KEY (worldGeoId) REFERENCES worldGeo (id)
);

---
--- shadow time-series tables
---

CREATE TABLE IF NOT EXISTS _document (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_document') PRIMARY KEY,
    source source NOT NULL DEFAULT 'historical',
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    probability DECIMAL(3,2) NOT NULL DEFAULT 1 CHECK (probability >= 0 AND probability <= 1),
    documentId VARCHAR NOT NULL,
    mimeType ianaMimeTYPE NOT NULL,
    path VARCHAR NOT NULL, 
    name VARCHAR NOT NULL,
    sizeBytes INTEGER NOT NULL DEFAULT 0,
    md5Hash VARCHAR,
    FOREIGN KEY (documentId) REFERENCES document (id)
);

CREATE TABLE IF NOT EXISTS _trench (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_trench') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    trenchId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    probability DECIMAL(3,2) NOT NULL DEFAULT 1 CHECK (probability >= 0 AND probability <= 1),
    country countryCode NOT NULL,
    reference VARCHAR NOT NULL,
    purpose trenchPurpose NOT NULL,
    depth DECIMAL(6,2) NOT NULL DEFAULT 914.4 CHECK (depth >= 0),
    classifier depthClassifier NOT NULL DEFAULT 'low',
    unit sizeUnit NOT NULL DEFAULT 'mm',
    type constructionType NOT NULL,
    premisesPassed INTEGER NOT NULL DEFAULT 0 CHECK (premisesPassed >= 0),
    area areaType NOT NULL DEFAULT 'unclassified',
    hasDocument BOOLEAN DEFAULT false,
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
    documentId VARCHAR,
    wkt VARCHAR USING COMPRESSION zstd,
    FOREIGN KEY (trenchId) REFERENCES trench (id),
    FOREIGN KEY (documentId) REFERENCES document (id),
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
    probability DECIMAL(3,2) NOT NULL DEFAULT 1 CHECK (probability >= 0 AND probability <= 1),
    country countryCode NOT NULL,
    purpose ductPurpose NOT NULL,
    category ductSizeCategory NOT NULL,
    hasDocument BOOLEAN DEFAULT false,
    configuration INTEGER NOT NULL DEFAULT 1 CHECK (configuration >= 1 AND configuration <= 48),
    state ductState NOT NULL DEFAULT 'free',
    within VARCHAR,
    placementVertical DECIMAL(6,2) NOT NULL DEFAULT 350 CHECK (placementVertical >= 0),
    placementHorizontal DECIMAL(6,2) NOT NULL DEFAULT 1579 CHECK (placementHorizontal >= 0),
    placementUnit sizeUnit NOT NULL DEFAULT 'mm',
    documentId VARCHAR,
    FOREIGN KEY (ductId) REFERENCES duct (id),
    FOREIGN KEY (trenchId) REFERENCES trench (id),
    FOREIGN KEY (within) REFERENCES duct (id),
    FOREIGN KEY (documentId) REFERENCES document (id)
);

---

CREATE TABLE IF NOT EXISTS _site (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_site') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    siteId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    probability DECIMAL(3,2) NOT NULL DEFAULT 1 CHECK (probability >= 0 AND probability <= 1),
    reference VARCHAR NOT NULL,
    commissioned TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    decommissioned TIMESTAMP,
    area areaType NOT NULL DEFAULT 'unclassified',
    type siteType NOT NULL DEFAULT 'unclassified',
    onNet BOOLEAN NOT NULL DEFAULT false,
    hasDocument BOOLEAN DEFAULT false,
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
    documentId VARCHAR,
    wkt VARCHAR USING COMPRESSION zstd,
    geoPoint POINT_3D,
    FOREIGN KEY (siteId) REFERENCES site (id),
    FOREIGN KEY (documentId) REFERENCES document (id)
);

---

CREATE TABLE IF NOT EXISTS _pole (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_pole') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    poleId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    probability DECIMAL(3,2) NOT NULL DEFAULT 1 CHECK (probability >= 0 AND probability <= 1),
    country countryCode NOT NULL,
    reference VARCHAR NOT NULL,
    purpose polePurpose NOT NULL,
    height DECIMAL(6,2) NOT NULL DEFAULT 20 CHECK (height >= 0),
    classifier heightClassifier NOT NULL,
    unit sizeUnit NOT NULL DEFAULT 'm',
    premisesPassed INTEGER NOT NULL DEFAULT 0 CHECK (premisesPassed >= 0),
    area areaType NOT NULL DEFAULT 'unclassified',
    hasDocument BOOLEAN DEFAULT false,
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
    documentId VARCHAR,
    geoPoint POINT_3D,
    FOREIGN KEY (poleId) REFERENCES pole (id),
    FOREIGN KEY (documentId) REFERENCES document (id)
);

--- 

CREATE TABLE IF NOT EXISTS _cable (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_cable') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    source source NOT NULL DEFAULT 'historical',
    probability DECIMAL(3,2) NOT NULL DEFAULT 1 CHECK (probability >= 0 AND probability <= 1),
    cableId VARCHAR NOT NULL,
    reference VARCHAR NOT NULL,
    country countryCode NOT NULL,
    ductId VARCHAR,
    poleId VARCHAR,
    technology cableTechnology NOT NULL,
    hasDocument BOOLEAN DEFAULT false,
    state cableState NOT NULL DEFAULT 'free',
    coaxTsId INTEGER,
    copperTsId INTEGER,
    ethernetTsId INTEGER,
    singleFiberTsId INTEGER,
    multiFiberTsId INTEGER,
    documentId VARCHAR,
    FOREIGN KEY (cableId) REFERENCES cable (id),
    FOREIGN KEY (documentId) REFERENCES document (id)
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
    probability DECIMAL(3,2) NOT NULL DEFAULT 1 CHECK (probability >= 0 AND probability <= 1),
    reference VARCHAR NOT NULL,
    country countryCode NOT NULL,
    commissioned TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    decommissioned TIMESTAMP,
    siteId VARCHAR NOT NULL,
    floor INTEGER,
    floorArea VARCHAR,
    floorRow INTEGER,
    floorColumn INTEGER,
    hasDocument BOOLEAN DEFAULT false,
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
    documentId VARCHAR,
    FOREIGN KEY (rackId) REFERENCES rack (id),
    FOREIGN KEY (siteId) REFERENCES site (id),
    FOREIGN KEY (documentId) REFERENCES document (id)
);

---

CREATE TABLE IF NOT EXISTS _rackSlot (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_rackSlot') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    source source NOT NULL DEFAULT 'historical',
    probability DECIMAL(3,2) NOT NULL DEFAULT 1 CHECK (probability >= 0 AND probability <= 1),
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

---    inetHost INET,
---    inetMgmtIP INET,

CREATE TABLE IF NOT EXISTS _ne (
    tsId INTEGER NOT NULL DEFAULT nextval('seq_ne') PRIMARY KEY,
    point TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    neId VARCHAR NOT NULL,
    source source NOT NULL DEFAULT 'historical',
    probability DECIMAL(3,2) NOT NULL DEFAULT 1 CHECK (probability >= 0 AND probability <= 1),
    country countryCode NOT NULL,
    host VARCHAR NOT NULL CHECK (regexp_full_match(host,'(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])')), 
    mgmtIP VARCHAR NOT NULL CHECK (regexp_full_match(mgmtIP,'((?:(?:\d{1,3}\.){3}(?:\d{1,3}))|(?:(?:::)?(?:[\dA-Fa-f]{1,4}:{1,2}){1,7}(?:[\d\%A-Fa-z\.]+)?(?:::)?)|(?:::[\dA-Fa-f\.]{1,15})|(?:::))')),
    protocol managementProtocol DEFAULT 'none',
    port INTEGER NOT NULL DEFAULT 22 CHECK (port >= 1 AND port <= 65535),
    typeSecret secretType,
    vendor VARCHAR NOT NULL, 
    model VARCHAR NOT NULL,
    image VARCHAR NOT NULL,
    version VARCHAR NOT NULL,
    commissioned TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    decommissioned TIMESTAMP,
    hasDocument BOOLEAN DEFAULT false,
    siteId VARCHAR NOT NULL,
    rackId VARCHAR NOT NULL,
    slotPosition VARCHAR NOT NULL CHECK (regexp_full_match(slotPosition,'([1-9]|[1-4][0-9]|5[0-8])+(,([1-9]|[1-4][0-9]|5[0-8]))?')),
    config VARCHAR USING COMPRESSION zstd, -- CLI, JSON, or XML content
    documentId VARCHAR,
    FOREIGN KEY (neId) REFERENCES ne (id),
    FOREIGN KEY (siteId) REFERENCES site (id),
    FOREIGN KEY (rackId) REFERENCES rack (id),
    FOREIGN KEY (documentId) REFERENCES document (id)
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
    macAddress VARCHAR CHECK (regexp_full_match(macAddress,'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$')),
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
    probability DECIMAL(3,2) NOT NULL DEFAULT 1 CHECK (probability >= 0 AND probability <= 1),
    reference VARCHAR NOT NULL,
    country countryCode NOT NULL,
    customerName VARCHAR,
    customerReference VARCHAR,
    commissioned TIMESTAMP NOT NULL DEFAULT now()::timestamp,
    decommissioned TIMESTAMP,
    type serviceType NOT NULL DEFAULT 'unclassified',
    hasDocument BOOLEAN DEFAULT false,
    rate INTEGER NOT NULL DEFAULT 0 CHECK (rate >= 0 AND rate <= 768),
    unit portEthernetConfigurationRate NOT NULL DEFAULT 'Gbps',
    lagGroup VARCHAR,
    lagMembers INTEGER DEFAULT 0 CHECK (lagMembers >= 0 AND lagMembers <= 256),
    documentId VARCHAR,
    FOREIGN KEY (serviceId) REFERENCES service (id),
    FOREIGN KEY (documentId) REFERENCES document (id)
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

INSERT INTO fetchJob (id,description,enabled,protocol,cronTime,function) VALUES ('cbb3b421-d6fc-4bfa-9661-b7854654138b','No Fetch Operation',true,'none','0 0 * * *','noop();');

INSERT INTO fetchJob (id,description,enabled,protocol,mysqlHost,mysqlDatabase,mysqlPort,mysqlSchema,cronTime,function) VALUES ('747ded39-4273-423b-8550-d2009f2d6575','Merkator NetworkMining LNI',false,'mysql','192.168.20.10','NM',3306,'gnd','0 0 * * *','noop();');
INSERT INTO fetchJob (id,description,enabled,protocol,oracleHost,oracleSid,oraclePort,oracleSchema,cronTime,function) VALUES ('4810b82c-961f-4949-92f7-550ceaff594b','Merkator Marlin PNI',false,'oracle','192.168.20.20','MARLIN',1521,'MARLIN','0 0 * * *','noop();');

INSERT INTO fetchJob (id,description,enabled,protocol,crontime,function) VALUES ('86c954a9-efb6-4a8b-85bb-13de5504c97a','CVE Pull',true,'none','00 18 * * *','jobCveRepoPull({cveDirectory});');
INSERT INTO fetchJob (id,description,enabled,protocol,crontime,function) VALUES ('24c449a6-f838-4e12-9427-bc484191f92e','CVE Build',true,'none','30 18 * * *','jobCveListBuild({cveDirectory});');

INSERT INTO fetchJob (id,description,enabled,protocol,httpUrl,crontime,function) VALUES ('2bbe3d5b-6975-45f4-a6ed-f1b67f990240','FX Currency Update',true,'http','https://api.exchangeratesapi.io/v1/latest','0 9,19 * * 1-5','jobFxRateUpdate({url});');

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
