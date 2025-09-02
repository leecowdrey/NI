
--- ISO Code: VAT
--- Country: Vatican City

BEGIN TRANSACTION;
INSERT INTO worldGeo (country,crs,geometryType) VALUES ('VAT','urn:ogc:def:crs:OGC:1.3:CRS84','Polygon');
INSERT INTO _worldCoordinate (country,exterior,vertice,x,y) VALUES ('VAT',1,1,12.455497,41.907462);
INSERT INTO _worldCoordinate (country,exterior,vertice,x,y) VALUES ('VAT',1,2,12.450408,41.906450);
INSERT INTO _worldCoordinate (country,exterior,vertice,x,y) VALUES ('VAT',1,3,12.445739,41.901859);
INSERT INTO _worldCoordinate (country,exterior,vertice,x,y) VALUES ('VAT',1,4,12.451602,41.900365);
INSERT INTO _worldCoordinate (country,exterior,vertice,x,y) VALUES ('VAT',1,5,12.457995,41.901215);
INSERT INTO _worldCoordinate (country,exterior,vertice,x,y) VALUES ('VAT',1,6,12.457705,41.905828);
INSERT INTO _worldCoordinate (country,exterior,vertice,x,y) VALUES ('VAT',1,7,12.455497,41.907462);
COMMIT;

