#!/bin/bash

# for a single POLYGON geometry, subsequent rings are holes (interior rings) within the exterior boundary. 
# a MULTIPOLYGON is a collection of separate POLYGON geometries, not an extension of a single polygon's rings. 
# Each of these individual POLYGON features within a MULTIPOLYGON has its own exterior ring, and any subsequent 
# rings in that specific POLYGON are its own holes

polygon() {
local COUNTRY="${1}"
local EXTERIOR=${2}
if [ ${EXTERIOR} -gt 0 ] ; then
 EXTERIOR=$(($EXTERIOR - 1))
 local HOLE="false"
 for (( E=0; E<=$EXTERIOR; E++ )) ; do
   [[ $E -gt 0 ]] && HOLE="true" || HOLE="false"
   local INTERIOR=$(jq --exit-status -r ".features[0].geometry.coordinates[${E}]|length" ${COUNTRY}.geojson)
   if [ ${INTERIOR} -gt 0 ] ; then
      INTERIOR=$(($INTERIOR - 1))
      for (( I=0; I<=$INTERIOR; I++ )) ; do
        local SUB_SET2=$(jq --exit-status -r ".features[0].geometry.coordinates[${E}][${I}]|length" ${COUNTRY}.geojson)
        if [ ${SUB_SET2} -eq 2 ] ; then
              X=$(jq --exit-status -r ".features[0].geometry.coordinates[${E}][${I}][0]" ${COUNTRY}.geojson)
              Y=$(jq --exit-status -r ".features[0].geometry.coordinates[${E}][${I}][1]" ${COUNTRY}.geojson)
              X=$(echo "scale=6; ${X}/1"|bc -l|sed -e 's/^-\./-0./' -e 's/^\./0./')
              Y=$(echo "scale=6; ${Y}/1"|bc -l|sed -e 's/^-\./-0./' -e 's/^\./0./')
              echo "INSERT INTO _worldCoordinate (country,exterior,hole,x,y) VALUES ('${COUNTRY}',${E},${HOLE},${X},${Y});"
        fi
      done
   fi
 done
fi
}

multiPolygon() {
local COUNTRY="${1}"
local MULTIPOLYGONS=${2}
if [ ${MULTIPOLYGONS} -gt 0 ] ; then
 MULTIPOLYGONS=$(($MULTIPOLYGONS - 1))
 for (( M=0; M<=$MULTIPOLYGONS; M++ )) ; do
   local POLYGON=$(jq --exit-status -r ".features[0].geometry.coordinates[${M}]|length" ${COUNTRY}.geojson)
   if [ ${POLYGON} -gt 0 ] ; then
      local HOLE="false"
      POLYGON=$(($POLYGON - 1))
      for (( P=0; P<=$POLYGON; P++ )) ; do
        [[ $P -gt 0 ]] && HOLE="true" || HOLE="false"
        local EXTERIOR=$(jq --exit-status -r ".features[0].geometry.coordinates[${M}][${P}]|length" ${COUNTRY}.geojson)
        if [ ${EXTERIOR} -gt 0 ] ; then
          EXTERIOR=$(($EXTERIOR - 1))
          for (( E=0; E<=$EXTERIOR; E++ )) ; do
              local INTERIOR=$(jq --exit-status -r ".features[0].geometry.coordinates[${M}][${P}][${E}]|length" ${COUNTRY}.geojson)
              if [ ${INTERIOR} -gt 0 ] ; then
                INTERIOR=$(($INTERIOR - 1))
                X=$(jq --exit-status -r ".features[0].geometry.coordinates[${M}][${P}][${E}][0]" ${COUNTRY}.geojson)
                Y=$(jq --exit-status -r ".features[0].geometry.coordinates[${M}][${P}][${E}][1]" ${COUNTRY}.geojson)
                X=$(echo "scale=6; ${X}/1"|bc -l|sed -e 's/^-\./-0./' -e 's/^\./0./')
                Y=$(echo "scale=6; ${Y}/1"|bc -l|sed -e 's/^-\./-0./' -e 's/^\./0./')
                echo "INSERT INTO _worldCoordinate (country,exterior,hole,x,y) VALUES ('${COUNTRY}',${M},${HOLE},${X},${Y});"
              fi
          done
        fi
      done
   fi
 done
fi
}

cnv() {
echo "Processing ${1}"
if [[ ! -f "${1}.geojson" ]] ; then
 echo "Not found ${1}"
 return 1
fi
local COUNTRY="${1}"
local COUNTRY_NAME=$(jq --exit-status -r ".features[0].properties.shapeName" ${COUNTRY}.geojson)
local CRS_TYPE=$(jq --exit-status -r ".crs.properties.name" ${COUNTRY}.geojson)
local GEOMETRY_TYPE=$(jq --exit-status -r ".features[0].geometry.type" ${COUNTRY}.geojson)
local RINGS=$(jq --exit-status -r ".features[0].geometry.coordinates|length" ${COUNTRY}.geojson)
echo "" > ${COUNTRY}.sql
echo "--- ISO Code: ${COUNTRY}" >> ${COUNTRY}.sql
echo "--- Country: ${COUNTRY_NAME}" >> ${COUNTRY}.sql
echo "" >> ${COUNTRY}.sql
echo "BEGIN TRANSACTION;" >> ${COUNTRY}.sql
echo "INSERT INTO worldGeo (country,crs,geometryType) VALUES ('${COUNTRY}','${CRS_TYPE}','${GEOMETRY_TYPE}');" >> ${COUNTRY}.sql
if [ "${GEOMETRY_TYPE}" == "Polygon" ] ; then
  polygon "${COUNTRY}" ${RINGS} >> ${COUNTRY}.sql
  echo -e "COMMIT;\n" >> ${COUNTRY}.sql
elif [ "${GEOMETRY_TYPE}" == "MultiPolygon" ] ; then
  multiPolygon "${COUNTRY}" ${RINGS}>> ${COUNTRY}.sql
  echo -e "COMMIT;\n" >> ${COUNTRY}.sql
else 
  echo "Unsupported ${GEOMETRY_TYPE}"
fi
}

# Polygons
cnv "AFG" &
cnv "ALB" &
cnv "AND" &
cnv "ATA" &
cnv "BDI" &
cnv "BEN" &
cnv "BFA" &
cnv "BGR" &
cnv "BLR" &
cnv "BRB" &
cnv "BTN" &
cnv "BWA" &
cnv "CAF" &
cnv "CHE" &
cnv "CMR" &
cnv "COG" &
cnv "COL" &
cnv "CZE" &
cnv "DJI" &
cnv "DMA" &
cnv "DZA" &
cnv "ETH" &
cnv "GAB" &
cnv "GEO" &
cnv "GHA" &
cnv "GIB" &
cnv "GTM" &
cnv "HUN" &
cnv "IRQ" &
cnv "ISR" &
cnv "JOR" &
cnv "LAO" &
cnv "LBN" &
cnv "LBR" &
cnv "LBY" &
cnv "LIE" &
cnv "LSO" &
cnv "LUX" &
cnv "LVA" &
cnv "MAR" &
cnv "MCO" &
cnv "MDA" &
cnv "MKD" &
cnv "MLI" &
cnv "MNE" &
cnv "MNG" &
cnv "MRT" &
cnv "MSR" &
cnv "NAM" &
cnv "NER" &
cnv "NGA" &
cnv "NIU" &
cnv "NPL" &
cnv "NRU" &
cnv "PCN" &
cnv "PRY" &
cnv "SDN" &
cnv "SLV" &
cnv "SMR" &
cnv "SRB" &
cnv "SSD" &
cnv "SUR" &
cnv "SVK" &
cnv "SVN" &
cnv "SWZ" &
cnv "SYR" &
cnv "TCD" &
cnv "TGO" &
cnv "TKM" &
cnv "UKR" &
cnv "URY" &
cnv "VAT" &
cnv "ZMB" &
cnv "ZWE" &

wait < <(jobs -p)

# multipolygons
cnv "ABW" &
cnv "AGO" &
cnv "AIA" &
cnv "ARE" &
cnv "ARG" &
cnv "ARM" &
cnv "ASM" &
cnv "ATG" &
cnv "AUS" &
cnv "AUT" &
cnv "AZE" &
cnv "BEL" &
cnv "BES" &
cnv "BGD" &
cnv "BHR" &
cnv "BHS" &
cnv "BIH" &
cnv "BLM" &
cnv "BLZ" &
cnv "BMU" &
cnv "BOL" &
cnv "BRA" &
cnv "BRN" &
cnv "CAN" &
cnv "CHL" &
cnv "CHN" &
cnv "CIV" &
cnv "COD" &
cnv "COK" &
cnv "COM" &
cnv "CPV" &
cnv "CRI" &
cnv "CUB" &
cnv "CUW" &
cnv "CYM" &
cnv "CYP" &
cnv "DEU" &
cnv "DNK" &
cnv "DOM" &
cnv "ECU" &
cnv "EGY" &
cnv "ERI" &
cnv "ESP" &
cnv "EST" &
cnv "FIN" &
cnv "FJI" &
cnv "FLK" &
cnv "FRA" &
cnv "FRO" &
cnv "FSM" &
cnv "GBR" &
cnv "GGY" &
cnv "GIN" &
cnv "GLP" &
cnv "GMB" &
cnv "GNB" &
cnv "GNQ" &
cnv "GRC" &
cnv "GRD" &
cnv "GRL" &
cnv "GUF" &
cnv "GUM" &
cnv "GUY" &
cnv "HND" &
cnv "HRV" &
cnv "HTI" &
cnv "IDN" &
cnv "IMN" &
cnv "IND" &
cnv "IRL" &
cnv "IRN" &
cnv "ISL" &
cnv "ITA" &
cnv "JAM" &
cnv "JPN" &
cnv "KAZ" &
cnv "KEN" &
cnv "KGZ" &
cnv "KHM" &
cnv "KIR" &
cnv "KNA" &
cnv "KOR" &
cnv "KWT" &
cnv "LCA" &
cnv "LKA" &
cnv "LTU" &
cnv "MDG" &
cnv "MDV" &
cnv "MEX" &
cnv "MHL" &
cnv "MLT" &
cnv "MMR" &
cnv "MNP" &
cnv "MOZ" &
cnv "MTQ" &
cnv "MUS" &
cnv "MWI" &
cnv "MYS" &
cnv "MYT" &
cnv "NCL" &
cnv "NIC" &
cnv "NLD" &
cnv "NOR" &
cnv "NZL" &
cnv "OMN" &
cnv "PAK" &
cnv "PAN" &
cnv "PER" &
cnv "PHL" &
cnv "PLW" &
cnv "PNG" &
cnv "POL" &
cnv "PRK" &
cnv "PRT" &
cnv "PSE" &
cnv "PYF" &
cnv "QAT" &
cnv "REU" &
cnv "ROU" &
cnv "RUS" &
cnv "RWA" &
cnv "SAU" &
cnv "SEN" &
cnv "SGP" &
cnv "SHN" &
cnv "SLB" &
cnv "SLE" &
cnv "SOM" &
cnv "STP" &
cnv "SWE" &
cnv "SYC" &
cnv "TCA" &
cnv "THA" &
cnv "TJK" &
cnv "TKL" &
cnv "TLS" &
cnv "TON" &
cnv "TTO" &
cnv "TUN" &
cnv "TUR" &
cnv "TUV" &
cnv "TWN" &
cnv "TZA" &
cnv "UGA" &
cnv "USA" &
cnv "UZB" &
cnv "VCT" &
cnv "VEN" &
cnv "VGB" &
cnv "VIR" &
cnv "VNM" &
cnv "VUT" &
cnv "WLF" &
cnv "WSM" &
cnv "YEM" &
cnv "ZAF" &

wait < <(jobs -p)
