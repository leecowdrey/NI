
-- Sites

SET VARIABLE sId = '0a3e6803-8d14-4f97-bc0e-947eb1cbfe74';
SET VARIABLE sTsId = nextval('seq_site');
INSERT INTO site (id,tsPoint,historicalTsId) VALUES (getvariable('sId'),now(),getvariable('sTsId'));
INSERT INTO _site (tsId,siteId,reference,commissioned,area,type,country,region,town,district,street,premisesNameNumber,postalCode,x,y,z) 
 VALUES (getvariable('sTsId'),getvariable('sId'),'gbr-worc-cg1',strptime('20241010','%Y%m%d'),'rural','street','GBR','Worcestershire','Droitwich','Cutnall Green','Kidderminster Road','1','WR9 0P.',52.314812,-2.17511,61);
RESET VARIABLE sTsId;

SET VARIABLE sId = '07ebecfd-5341-4f02-88f8-4f5330398f69';
SET VARIABLE sTsId = nextval('seq_site');
INSERT INTO site (id,tsPoint,historicalTsId) VALUES (getvariable('sId'),now(),getvariable('sTsId'));
INSERT INTO _site (tsId,siteId,reference,commissioned,area,type,country,region,town,street,premisesNameNumber,postalCode,x,y,z) 
 VALUES (getvariable('sTsId'),getvariable('sId'),'bel-zel-m1',strptime('20241010','%Y%m%d'),'urban','street','BEL','Asse','Zellix','Vliegwezenlaan','48','1731',50.889512, 4.271829,56);
RESET VARIABLE sTsId;
RESET VARIABLE sId;

-- Racks

SET VARIABLE sId = '0a3e6803-8d14-4f97-bc0e-947eb1cbfe74';

SET VARIABLE rId = 'c2f7ceba-ed76-441d-8e48-46b3ed3e7e35';
SET VARIABLE rTsId = nextval('seq_rack');
INSERT INTO rack (id,tsPoint,historicalTsId) VALUES (getvariable('rId'),now(),getvariable('rTsId'));
INSERT INTO _rack (tsId,rackId,reference,siteId,floor,floorArea,floorRow,floorColumn,x,y,z,depth,height,width,unit,slotsTotal,slotsFree,slotsUsed,slotsReserved,slotsFaulty) 
 VALUES (getvariable('rTsId'),getvariable('rId'),'gbr-worc-cg1-1',getvariable('sId'),0,'colo',1,1,52.314812,-2.17511,61,600,1370,1200,'mm',24,23,1,0,0);
RESET VARIABLE rId;
RESET VARIABLE rTsId;

SET VARIABLE rId = '441f85e4-ef84-424f-ba7a-a0a856445244';
SET VARIABLE rTsId = nextval('seq_rack');
INSERT INTO rack (id,tsPoint,historicalTsId) VALUES (getvariable('rId'),now(),getvariable('rTsId'));
INSERT INTO _rack (tsId,rackId,reference,siteId,floor,floorArea,floorRow,floorColumn,x,y,z,depth,height,width,unit,slotsTotal,slotsFree,slotsUsed,slotsReserved,slotsFaulty) 
 VALUES (getvariable('rTsId'),getvariable('rId'),'gbr-worc-cg1-2',getvariable('sId'),0,'colo',1,2,52.314812,-2.17511,61,600,1370,1200,'mm',24,0,0,0,0);
RESET VARIABLE rId;
RESET VARIABLE rTsId;

RESET VARIABLE sId;

-- Trench

SET VARIABLE tId = 'dbd487fb-b187-4af2-87e4-76ea53482d7f';
SET VARIABLE tTsId = nextval('seq_trench');
INSERT INTO trench (id,tsPoint,historicalTsId) VALUES (getvariable('tId'),now(),getvariable('tTsId'));
INSERT INTO _trench (tsId,point,trenchId,purpose,type,connectsToPoleId) VALUES (getvariable('tTsId'),strptime('20250228','%Y%m%d'),getvariable('tId'),'service/drop','narrow','360236fb-15b1-48be-babf-6c433c387ed8');
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.314812,-2.175110,61); 
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.314893,-2.176281,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315030,-2.177276,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315036,-2.177328,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316266,-2.176991,61);
RESET VARIABLE tTsId;
SET VARIABLE tTsId = nextval('seq_trench');
INSERT INTO _trench (tsId,point,trenchId,purpose,type) VALUES (getvariable('tTsId'),strptime('20250302','%Y%m%d'),getvariable('tId'),'service/drop','narrow');
UPDATE trench SET historicalTsId = getvariable('tTsId'), tsPoint = now() WHERE id = getvariable('tId');
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.314812,-2.175110,61); 
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.314893,-2.176281,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315030,-2.177276,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315036,-2.177328,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316266,-2.176991,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316480,-2.177585,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316077,-2.177555,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315972,-2.177525,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316567,-2.178172,61);
RESET VARIABLE tTsId;
SET VARIABLE tTsId = nextval('seq_trench');
INSERT INTO _trench (tsId,point,trenchId,purpose,type) VALUES (getvariable('tTsId'),strptime('20250315','%Y%m%d'),getvariable('tId'),'service/drop','narrow');
UPDATE trench SET historicalTsId = getvariable('tTsId'), tsPoint = now() WHERE id = getvariable('tId');
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.314812,-2.175110,61); 
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.314893,-2.176281,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315030,-2.177276,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315036,-2.177328,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316266,-2.176991,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316480,-2.177585,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316077,-2.177555,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315972,-2.177525,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316567,-2.178172,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316563,-2.178792,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316609,-2.179141,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316395,-2.179585,61);
RESET VARIABLE tTsId;
SET VARIABLE tTsId = nextval('seq_trench');
INSERT INTO _trench (tsId,point,trenchId,purpose,type) VALUES (getvariable('tTsId'),strptime('20250401','%Y%m%d'),getvariable('tId'),'service/drop','narrow');
UPDATE trench SET historicalTsId = getvariable('tTsId'), tsPoint = now() WHERE id = getvariable('tId');
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.314812,-2.175110,61); 
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.314893,-2.176281,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315030,-2.177276,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315036,-2.177328,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316266,-2.176991,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316480,-2.177585,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316077,-2.177555,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315972,-2.177525,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316567,-2.178172,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316563,-2.178792,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316609,-2.179141,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.316395,-2.179585,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315979,-2.179574,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315780,-2.179492,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315694,-2.179261,61);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',52.315676,-2.178173,61);
RESET VARIABLE tTsId;
RESET VARIABLE tId;

SET VARIABLE tId = 'b55fcbef-6d4f-4803-8755-0d920835de85';
SET VARIABLE tTsId = nextval('seq_trench');
INSERT INTO trench (id,tsPoint,historicalTsId) VALUES (getvariable('tId'),now(),getvariable('tTsId'));
INSERT INTO _trench (tsId,point,trenchId,purpose,type,connectsToPoleId) VALUES (getvariable('tTsId'),strptime('20250403','%Y%m%d'),getvariable('tId'),'service/drop','narrow','47d7ea0b-1307-477d-b462-73c3fdf0e4c5');
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.888336, 4.267963,47);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.888577, 4.269052,47);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.888878, 4.270193,47);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.888991, 4.270661,48);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.889195, 4.271426,49);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.889453, 4.272551,49);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.889562, 4.272882,50);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.889566, 4.272890,50);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.889675, 4.273320,50);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.889714, 4.273481,50);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.889879, 4.274175,50);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.890055, 4.274900,50);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.890127, 4.275121,50);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.890128, 4.275114,50);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.890430, 4.276452,50);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.890422, 4.276491,51);
RESET VARIABLE tTsId;
RESET VARIABLE tId;

SET VARIABLE tId = '2b41db28-5db7-4ec1-a1e3-33a8d4d95727';
SET VARIABLE tTsId = nextval('seq_trench');
INSERT INTO trench (id,tsPoint,historicalTsId) VALUES (getvariable('tId'),now(),getvariable('tTsId'));
INSERT INTO _trench (tsId,point,trenchId,purpose,type,connectsToSiteId,connectsToTrenchId) VALUES (getvariable('tTsId'),strptime('20250403','%Y%m%d'),getvariable('tId'),'service/drop','narrow','07ebecfd-5341-4f02-88f8-4f5330398f69','b55fcbef-6d4f-4803-8755-0d920835de85');
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.889512, 4.271829,56);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.889515, 4.271866,56);
INSERT INTO _trenchCoordinate (trenchId,trenchTsId,source,x,y,z) VALUES (getvariable('tId'),getvariable('tTsId'),'historical',50.889319, 4.271987,52);
RESET VARIABLE tTsId;
RESET VARIABLE tId;
RESET VARIABLE sId;


-- Poles

SET VARIABLE p1Id = '360236fb-15b1-48be-babf-6c433c387ed8';
SET VARIABLE p1TsId = nextval('seq_pole');
INSERT INTO pole (id,tsPoint,historicalTsId) VALUES (getvariable('p1Id'),now(),getvariable('p1TsId'));
INSERT INTO _pole (tsId,poleId,source,purpose,height,classifier,unit,premisesPassed,area,state,x,y,z,connectsToTrenchId) VALUES (getvariable('p1TsId'),getvariable('p1Id'),'historical','service/drop',20,'urban','m',1,'rural','used',52.31504,-2.17728,61,'dbd487fb-b187-4af2-87e4-76ea53482d7f');
RESET VARIABLE p1TsId;

SET VARIABLE p2Id = '47d7ea0b-1307-477d-b462-73c3fdf0e4c5';
SET VARIABLE p2TsId = nextval('seq_pole');
INSERT INTO pole (id,tsPoint,historicalTsId) VALUES (getvariable('p2Id'),now(),getvariable('p2TsId'));
INSERT INTO _pole (tsId,poleId,source,purpose,height,classifier,unit,premisesPassed,area,state,x,y,z,connectsToTrenchId) VALUES (getvariable('p2TsId'),getvariable('p2Id'),'historical','backhaul',30,'highways','m',1,'mixed','used',50.888336, 4.267963,61,'b55fcbef-6d4f-4803-8755-0d920835de85');
RESET VARIABLE p2TsId;

-- Duct

SET VARIABLE tId = 'dbd487fb-b187-4af2-87e4-76ea53482d7f';
SET VARIABLE dId = 'b248ec91-27a5-4fb4-906b-2a1d077fb588';
SET VARIABLE dTsId = nextval('seq_duct');
INSERT INTO duct (id,tsPoint,historicalTsId) VALUES (getvariable('dId'),now(),getvariable('dTsId'));
INSERT INTO _duct (tsId,point,ductId,trenchId,source,purpose,category,configuration) VALUES (getvariable('dTsId'),now(),getvariable('dId'),getvariable('tId'),'historical','cable','duct',1);
RESET VARIABLE dTsId;
RESET VARIABLE dId;
RESET VARIABLE tId;

-- Cables

SET VARIABLE cId = '4f58b5fd-81a9-44d8-a653-22733eba4f21';
SET VARIABLE cTsId = nextval('seq_cable');
SET VARIABLE ceTsId = nextval('seq_cableEthernet');
INSERT INTO cable (id,delete,tsPoint,historicalTsId) VALUES (getvariable('cId'),false,now(),getvariable('cTsId'));
INSERT INTO _cable (tsId,source,cableId,technology,state,poleId,ethernetTsId) VALUES (getvariable('cTsId'),'historical',getvariable('cId'),'ethernet','used',getvariable('p1Id'),getvariable('ceTsId'));
INSERT INTO _cableEthernet (tsId,source,cableId,category,rate,unit) VALUES (getvariable('ceTsId'),'historical',getvariable('cId'),'Cat6A',10,'Gbps');
RESET VARIABLE cId;
RESET VARIABLE cTsId;
RESET VARIABLE ceTsId;

-- Network Equipment

SET VARIABLE nId = '7a1a6b0c-01ec-41f2-8459-75784228f30d';
SET VARIABLE nTsId = nextval('seq_ne');
INSERT INTO ne (id,delete,tsPoint,historicalTsId) VALUES (getvariable('nId'),false,now(),getvariable('nTsId'));
INSERT INTO _ne (tsId,source,neId,host,mgmtIP,vendor,model,image,version,commissioned,siteId,rackId,slotPosition) VALUES (getvariable('nTsId'),'historical',getvariable('nId'),'gbr-worc-cg1-01','10.23.72.1','Juniper','MX240','JUNOS Base OS Boot','12.3R6.6',strptime('20250508','%Y%m%d'),'0a3e6803-8d14-4f97-bc0e-947eb1cbfe74','c2f7ceba-ed76-441d-8e48-46b3ed3e7e35',1);

SET VARIABLE npTsId = nextval('seq_nePort');
INSERT INTO _nePort (tsId,neTsId,name,technology,state) VALUES (getvariable('npTsId'),getvariable('nTsId'),'at-0/0/0','xdsl','free');
INSERT INTO _nePortXdsl (nePortTsId,category,rate,unit) VALUES (getvariable('npTsId'),'VDSL2',100,'Mbps');
SET VARIABLE npTsId = nextval('seq_nePort');
INSERT INTO _nePort (tsId,neTsId,name,technology,state) VALUES (getvariable('npTsId'),getvariable('nTsId'),'at-0/0/1','xdsl','free');
INSERT INTO _nePortXdsl (nePortTsId,category,rate,unit) VALUES (getvariable('npTsId'),'VDSL2',100,'Mbps');
SET VARIABLE npTsId = nextval('seq_nePort');
INSERT INTO _nePort (tsId,neTsId,name,technology,state) VALUES (getvariable('npTsId'),getvariable('nTsId'),'at-0/0/2','xdsl','free');
INSERT INTO _nePortXdsl (nePortTsId,category,rate,unit) VALUES (getvariable('npTsId'),'VDSL2',100,'Mbps');
SET VARIABLE npTsId = nextval('seq_nePort');
INSERT INTO _nePort (tsId,neTsId,name,technology,state) VALUES (getvariable('npTsId'),getvariable('nTsId'),'at-0/0/3','xdsl','free');
INSERT INTO _nePortXdsl (nePortTsId,category,rate,unit) VALUES (getvariable('npTsId'),'VDSL2',100,'Mbps');
SET VARIABLE npTsId = nextval('seq_nePort');
INSERT INTO _nePort (tsId,neTsId,name,technology,state) VALUES (getvariable('npTsId'),getvariable('nTsId'),'xe-1/0/0','fiber','free');
INSERT INTO _nePortFiber (nePortTsId,rate,unit,mode) VALUES (getvariable('npTsId'),10,'Gbps','SMOF');
SET VARIABLE npTsId = nextval('seq_nePort');
INSERT INTO _nePort (tsId,neTsId,name,technology,state) VALUES (getvariable('npTsId'),getvariable('nTsId'),'xe-1/0/1','fiber','free');
INSERT INTO _nePortFiber (nePortTsId,rate,unit,mode) VALUES (getvariable('npTsId'),10,'Gbps','SMOF');
RESET VARIABLE npTsId;
RESET VARIABLE nTsId;
RESET VARIABLE nId;


SET VARIABLE nId = 'ecd9b5ff-b9b8-47d2-a7bf-18dd25e710fc';
SET VARIABLE nTsId = nextval('seq_ne');
INSERT INTO ne (id,delete,tsPoint,historicalTsId) VALUES (getvariable('nId'),false,now(),getvariable('nTsId'));
INSERT INTO _ne (tsId,source,neId,host,mgmtIP,vendor,model,image,version,commissioned,siteId,rackId,slotPosition) VALUES (getvariable('nTsId'),'historical',getvariable('nId'),'gbr-worc-cg1-02','10.23.72.2','Cisco','C8300-1N1S-4T2X','IOS-XE SD-WAN','17.7.1a',strptime('20250508','%Y%m%d'),'0a3e6803-8d14-4f97-bc0e-947eb1cbfe74','c2f7ceba-ed76-441d-8e48-46b3ed3e7e35',2);
SET VARIABLE npTsId = nextval('seq_nePort');
INSERT INTO _nePort (tsId,neTsId,name,technology,state) VALUES (getvariable('npTsId'),getvariable('nTsId'),'VDSL 0/0/0','xdsl','free');
INSERT INTO _nePortXdsl (nePortTsId,category,rate,unit) VALUES (getvariable('npTsId'),'VDSL2',100,'Mbps');
SET VARIABLE npTsId = nextval('seq_nePort');
INSERT INTO _nePort (tsId,neTsId,name,technology,state) VALUES (getvariable('npTsId'),getvariable('nTsId'),'VDSL 0/0/1','xdsl','free');
INSERT INTO _nePortXdsl (nePortTsId,category,rate,unit) VALUES (getvariable('npTsId'),'VDSL2',100,'Mbps');
SET VARIABLE npTsId = nextval('seq_nePort');
INSERT INTO _nePort (tsId,neTsId,name,technology,state) VALUES (getvariable('npTsId'),getvariable('nTsId'),'VDSL 0/0/2','xdsl','free');
INSERT INTO _nePortXdsl (nePortTsId,category,rate,unit) VALUES (getvariable('npTsId'),'VDSL2',100,'Mbps');
SET VARIABLE npTsId = nextval('seq_nePort');
INSERT INTO _nePort (tsId,neTsId,name,technology,state) VALUES (getvariable('npTsId'),getvariable('nTsId'),'VDSL 0/0/3','xdsl','free');
INSERT INTO _nePortXdsl (nePortTsId,category,rate,unit) VALUES (getvariable('npTsId'),'VDSL2',100,'Mbps');
SET VARIABLE npTsId = nextval('seq_nePort');
INSERT INTO _nePort (tsId,neTsId,name,technology,state) VALUES (getvariable('npTsId'),getvariable('nTsId'),'GigabitEthernet0/0/0','fiber','free');
INSERT INTO _nePortFiber (nePortTsId,rate,unit,mode) VALUES (getvariable('npTsId'),10,'Gbps','SMOF');
SET VARIABLE npTsId = nextval('seq_nePort');
INSERT INTO _nePort (tsId,neTsId,name,technology,state) VALUES (getvariable('npTsId'),getvariable('nTsId'),'GigabitEthernet0/0/1','fiber','free');
INSERT INTO _nePortFiber (nePortTsId,rate,unit,mode) VALUES (getvariable('npTsId'),10,'Gbps','SMOF');
RESET VARIABLE npTsId;
RESET VARIABLE nTsId;
RESET VARIABLE nId;

-- Services

SET VARIABLE sId = '784d5d3d-44cf-41a2-8ef0-24a376b0b296';
SET VARIABLE sTsId = nextval('seq_service');
SET VARIABLE sNeId = 'ecd9b5ff-b9b8-47d2-a7bf-18dd25e710fc';
SET VARIABLE sNeIngressP1 = 'VDSL 0/0/0';
SET VARIABLE sNeIngressP2 = 'VDSL 0/0/1';
SET VARIABLE sNeEgressP1 = 'GigabitEthernet0/0/0';
SET VARIABLE sNeEgressP2 = 'GigabitEthernet0/0/1';
SET VARIABLE sNeIngressP1Id = (SELECT tsId FROM _nePort WHERE neTsId = (SELECT historicalTsId FROM ne WHERE id = getvariable('sNeId') AND delete = false) AND name = getvariable('sNeIngressP1'));
SET VARIABLE sNeIngressP2Id = (SELECT tsId FROM _nePort WHERE neTsId = (SELECT historicalTsId FROM ne WHERE id = getvariable('sNeId') AND delete = false) AND name = getvariable('sNeIngressP1'));
SET VARIABLE sNeEgressP1Id = (SELECT tsId FROM _nePort WHERE neTsId = (SELECT historicalTsId FROM ne WHERE id = getvariable('sNeId') AND delete = false) AND name = getvariable('sNeEgressP1'));
SET VARIABLE sNeEgressP2Id = (SELECT tsId FROM _nePort WHERE neTsId = (SELECT historicalTsId FROM ne WHERE id = getvariable('sNeId') AND delete = false) AND name = getvariable('sNeEgressP2'));
INSERT INTO service (id,delete,tsPoint,historicalTsId) VALUES (getvariable('sId'),false,now(),getvariable('sTsId'));
INSERT INTO _service (tsId,point,serviceId,commissioned,reference,customerName,customerReference,lagGroup,lagMembers) VALUES (getvariable('sTsId'),now(),getvariable('sId'),strptime('20250509','%Y%m%d'),'gbr-worc-cg1-merk-sample-0001','Merkator','sample','LAG1',2);
INSERT INTO _serviceIngress (serviceId,serviceTsId,neId,nePortTsId,cVlanId,sVlanId,lagMember)
  VALUES (getvariable('sid'),getvariable('sTsId'),getvariable('sNeId'),getvariable('sNeIngressP1Id'),101,0,1);
INSERT INTO _serviceIngress (serviceId,serviceTsId,neId,nePortTsId,cVlanId,sVlanId,lagMember)
  VALUES (getvariable('sid'),getvariable('sTsId'),getvariable('sNeId'),getvariable('sNeIngressP2Id'),101,0,2);
INSERT INTO _serviceEgress (serviceId,serviceTsId,neId,nePortTsId,cVlanId,sVlanId,lagMember)
  VALUES (getvariable('sid'),getvariable('sTsId'),getvariable('sNeId'),getvariable('sNeEgressP1Id'),0,202,1);
INSERT INTO _serviceEgress (serviceId,serviceTsId,neId,nePortTsId,cVlanId,sVlanId,lagMember)
  VALUES (getvariable('sid'),getvariable('sTsId'),getvariable('sNeId'),getvariable('sNeEgressP2Id'),0,202,1);

UPDATE _nePort SET state = 'used' WHERE neTsId = getvariable('sNeIngressP1Id') AND tsId = (SELECT historicalTsId FROM ne WHERE id = getvariable('sNeId'));
UPDATE _nePort SET state = 'used' WHERE neTsId = getvariable('sNeIngressP2Id') AND tsId = (SELECT historicalTsId FROM ne WHERE id = getvariable('sNeId'));
UPDATE _nePort SET state = 'used' WHERE neTsId = getvariable('sNeEgressP1Id') AND tsId = (SELECT historicalTsId FROM ne WHERE id = getvariable('sNeId'));
UPDATE _nePort SET state = 'used' WHERE neTsId = getvariable('sNeEgressP2Id') AND tsId = (SELECT historicalTsId FROM ne WHERE id = getvariable('sNeId'));

RESET VARIABLE sNeEgressP2Id;
RESET VARIABLE sNeEgressP1Id;
RESET VARIABLE sNeIngressP2Id;
RESET VARIABLE sNeIngressP1Id;
RESET VARIABLE sNeEgressP2;
RESET VARIABLE sNeEgressP1;
RESET VARIABLE sNeIngressP2;
RESET VARIABLE sNeIngressP1;
RESET VARIABLE sNeId;
RESET VARIABLE sTsId;
RESET VARIABLE sId;

-- Email providers

SET VARIABLE requestorId = 'cea193e4-0048-11f0-8448-ebe15cd54ed5';
SET VARIABLE eId = 'c154c1b3-c0a6-47c3-856d-fed40e9acf19';
SET VARIABLE esId = 'd393d6ea-5855-4a0b-842b-3dfae4806d2c';
INSERT INTO adminEmail (id,vendor,address,name) VALUES (getvariable('eId'),'FastMail','ni@cowdrey.net','Network Insight');
INSERT INTO adminEmailSend (id,adminEmailId,username,password,host,port,protocol,authentication,encryptionEnabled,encryptionStartTls) 
  VALUES (getvariable('esId'),getvariable('eId'),'ni@cowdrey.net','password123&#','smtp.fastmail.com',465,'smtp','PLAIN',true,false);
RESET VARIABLE esId;

-- Alerts

SET VARIABLE nId = 'e8ec649a-0048-11f0-8661-43d553ccde93';
SET VARIABLE anId = 'ef06c05a-0048-11f0-8635-a35ae5a2bfda';
SET VARIABLE aId = 'b7c0dbac-6871-4c92-a3f8-dfa925553319';
INSERT INTO alertNotify (id,alertId,requestorId,emailProviderId,notificationId,subject) 
  VALUES (getvariable('anId'),getvariable('aId'),getvariable('requestorId'),getvariable('eId'),getvariable('nId'),'dummy 1');
INSERT INTO alertNotifyRecipient (id,alertNotifyId,notificationId,recipient) 
  VALUES (uuid(),getvariable('anId'),getvariable('nId'),'dummy@example.com');
RESET VARIABLE anId;
RESET VARIABLE nId;
RESET VARIABLE eId;
RESET VARIABLE requestorId;

--- Kafka providers

SET VARIABLE kId = '19a20852-35ed-4498-a4a0-fa16bf79ba37';
INSERT INTO adminKafka (id,name,clientId,username,password,host,port,retryDelay,retries,acks,linger,batchSize,bufferMemory,maxInFlightRequestsPerConnection,compressionMethod,authentication) VALUES (getvariable('kId'),'west','NI','ni@cowdrey.net','password123&#','10.72.34.16',9092,10000,2,'leader',0,16,32,5,'none','none');
RESET VARIABLE kId;

--- Map providers

INSERT INTO adminMap (id,vendor,systemDefault,renderUrl,credentialsIdentity,credentialsKey) 
VALUES ('7993cdd4-395b-456c-9005-4cc7a62715b2','Google Maps',true,'https://maps.googleapis.com/maps/api/js','NI','AIzaSyD4TcrXO9v4qSNYtQD3AQqdDyhecJ_j9lw');

SET VARIABLE mId = '4b26fb00-8b79-45f2-8acf-7fc7f691ca9e';
INSERT INTO adminMap (id,vendor,systemDefault,renderUrl,identityProviderBase,identityProviderAuthorization,identityProviderToken,identityProviderWellKnown) 
VALUES (getvariable('mId'),'OpenStreet Map',false,'https://www.openstreetmap.org/render','https://www.openstreetmap.org','/oauth2/authorize','/oauth2/token','/.well-known/oauth-authorization-server');
RESET VARIABLE mId;

--- Workflow Engines

SET VARIABLE wId = 'efac48be-cdee-4022-8d8c-bd170079f5e4';
INSERT INTO adminWorkflow (id,name,engineUsername,enginePassword,engineUrl,engineType) VALUES (getvariable('wId'),'camunda8','internal','service','https://127.0.0.1:443/camunda','bpmn');
RESET VARIABLE wId;

---
