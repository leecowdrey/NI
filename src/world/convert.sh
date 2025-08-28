#!/bin/bash
TAG=""
COUNTRY=""
CRS_TYPE=""
GEOMETRY_TYPE=""
GEOMETRY_SETS=""
ID=""

polygon() {
if [ ${GEOMETRY_SETS} -gt 0 ] ; then
 GEOMETRY_SETS=$((GEOMETRY_SETS - 1))
 SETS=0
 for (( C=0; C<=$GEOMETRY_SETS; C++ )) ; do
   SUB_SET1=$(jq -r ".features[0].geometry.coordinates[${C}]|length" ${TAG}.geojson)
   if [ ${SUB_SET1} -gt 0 ] ; then
      SUB_SET1=$(($SUB_SET1 - 1))
      for (( S1=0; S1<=$SUB_SET1; S1++ )) ; do
         SETS=$(($SETS + 1))
        SUB_SET2=$(jq -r ".features[0].geometry.coordinates[${C}][${S1}]|length" ${TAG}.geojson)
        if [ ${SUB_SET2} -eq 2 ] ; then
              X=$(jq -r ".features[0].geometry.coordinates[${C}][${S1}][0]" ${TAG}.geojson)
              Y=$(jq -r ".features[0].geometry.coordinates[${C}][${S1}][1]" ${TAG}.geojson)
              echo "INSERT INTO _worldGeoCoordinate (worldGeoId,geometrySet,x,y) VALUES ('${ID}',${SETS},${X},${Y});"
        fi
      done
   fi
 done
fi
echo ""
}

multiPolygon() {
if [ ${GEOMETRY_SETS} -gt 0 ] ; then
 GEOMETRY_SETS=$((GEOMETRY_SETS - 1))
 SETS=0
 for (( C=0; C<=$GEOMETRY_SETS; C++ )) ; do
   SUB_SET1=$(jq -r ".features[0].geometry.coordinates[${C}]|length" ${TAG}.geojson)
   if [ ${SUB_SET1} -gt 0 ] ; then
      SUB_SET1=$(($SUB_SET1 - 1))
      for (( S1=0; S1<=$SUB_SET1; S1++ )) ; do
         SETS=$(($SETS + 1))
        SUB_SET2=$(jq -r ".features[0].geometry.coordinates[${C}][${S1}]|length" ${TAG}.geojson)
        if [ ${SUB_SET2} -gt 0 ] ; then
          SUB_SET2=$(($SUB_SET2 - 1))
          for (( S2=0; S2<=$SUB_SET2; S2++ )) ; do
            SUB_SET3=$(jq -r ".features[0].geometry.coordinates[${C}][${S1}][${S2}]|length" ${TAG}.geojson)
            if [ ${SUB_SET3} -eq 2 ] ; then
              Y=$(jq -r ".features[0].geometry.coordinates[${C}][${S1}][${S2}][0]" ${TAG}.geojson)
              X=$(jq -r ".features[0].geometry.coordinates[${C}][${S1}][${S2}][1]" ${TAG}.geojson)
              echo "INSERT INTO _worldGeoCoordinate (worldGeoId,geometrySet,x,y) VALUES ('${ID}',${SETS},${X},${Y});"
            fi
          done
        fi
      done
   fi
 done
fi
echo ""
}

cnv() {
echo "Processing ${1}"
if [[ ! -f "${1}.geojson" ]] ; then
 echo "Not found ${1}"
 return 1
fi
TAG="${1}"
#COUNTRY=$(jq -r ".features[0].properties.shapeISO" ${TAG}.geojson)
COUNTRY="${TAG}"
COUNTRY_NAME=$(jq -r ".features[0].properties.shapeName" ${TAG}.geojson)
CRS_TYPE=$(jq -r ".crs.properties.name" ${TAG}.geojson)
GEOMETRY_TYPE=$(jq -r ".features[0].geometry.type" ${TAG}.geojson)
GEOMETRY_SETS=$(jq -r ".features[0].geometry.coordinates|length" ${TAG}.geojson)
ID=$(uuid -v 4)
echo "--- ISO Code: ${COUNTRY}" > ${TAG}.sql
echo "--- Country: ${COUNTRY_NAME}" >> ${TAG}.sql
echo "" >> ${TAG}.sql
echo "INSERT INTO worldGeo (id,country,crs,geometryType) VALUES ('${ID}','${COUNTRY}','${CRS_TYPE}','${GEOMETRY_TYPE}');" >> ${TAG}.sql
if [ "${GEOMETRY_TYPE}" == "Polygon" ] ; then
  polygon >> ${TAG}.sql
elif [ "${GEOMETRY_TYPE}" == "MultiPolygon" ] ; then
  multiPolygon >> ${TAG}.sql
else 
  echo "Unsupported ${GEOMETRY_TYPE}"
fi
echo "" >> ${TAG}.sql
}

cnv "ABW"
cnv "AFG"
cnv "AGO"
cnv "AIA"
cnv "ALB"
cnv "AND"
cnv "ARE"
cnv "ARG"
cnv "ARM"
cnv "ASM"
cnv "ATA"
cnv "ATG"
cnv "AUS"
cnv "AUT"
cnv "AZE"
cnv "BDI"
cnv "BEL"
cnv "BEN"
cnv "BES"
cnv "BFA"
cnv "BGD"
cnv "BGR"
cnv "BHR"
cnv "BHS"
cnv "BIH"
cnv "BLM"
cnv "BLR"
cnv "BLZ"
cnv "BMU"
cnv "BOL"
cnv "BRA"
cnv "BRB"
cnv "BRN"
cnv "BTN"
cnv "BWA"
cnv "CAF"
cnv "CAN"
cnv "CHE"
cnv "CHL"
cnv "CHN"
cnv "CIV"
cnv "CMR"
cnv "COD"
cnv "COG"
cnv "COK"
cnv "COL"
cnv "COM"
cnv "CPV"
cnv "CRI"
cnv "CUB"
cnv "CUW"
cnv "CYM"
cnv "CYP"
cnv "CZE"
cnv "DEU"
cnv "DJI"
cnv "DMA"
cnv "DNK"
cnv "DOM"
cnv "DZA"
cnv "ECU"
cnv "EGY"
cnv "ERI"
cnv "ESP"
cnv "EST"
cnv "ETH"
cnv "FIN"
cnv "FJI"
cnv "FLK"
cnv "FRA"
cnv "FRO"
cnv "FSM"
cnv "GAB"
cnv "GBR"
cnv "GEO"
cnv "GGY"
cnv "GHA"
cnv "GIB"
cnv "GIN"
cnv "GLP"
cnv "GMB"
cnv "GNB"
cnv "GNQ"
cnv "GRC"
cnv "GRD"
cnv "GRL"
cnv "GTM"
cnv "GUF"
cnv "GUM"
cnv "GUY"
cnv "HND"
cnv "HRV"
cnv "HTI"
cnv "HUN"
cnv "IDN"
cnv "IMN"
cnv "IND"
cnv "IRL"
cnv "IRN"
cnv "IRQ"
cnv "ISL"
cnv "ISR"
cnv "ITA"
cnv "JAM"
cnv "JOR"
cnv "JPN"
cnv "KAZ"
cnv "KEN"
cnv "KGZ"
cnv "KHM"
cnv "KIR"
cnv "KNA"
cnv "KOR"
cnv "KWT"
cnv "LAO"
cnv "LBN"
cnv "LBR"
cnv "LBY"
cnv "LCA"
cnv "LIE"
cnv "LKA"
cnv "LSO"
cnv "LTU"
cnv "LUX"
cnv "LVA"
cnv "MAR"
cnv "MCO"
cnv "MDA"
cnv "MDG"
cnv "MDV"
cnv "MEX"
cnv "MHL"
cnv "MKD"
cnv "MLI"
cnv "MLT"
cnv "MMR"
cnv "MNE"
cnv "MNG"
cnv "MNP"
cnv "MOZ"
cnv "MRT"
cnv "MSR"
cnv "MTQ"
cnv "MUS"
cnv "MWI"
cnv "MYS"
cnv "MYT"
cnv "NAM"
cnv "NCL"
cnv "NER"
cnv "NGA"
cnv "NIC"
cnv "NIU"
cnv "NLD"
cnv "NOR"
cnv "NPL"
cnv "NRU"
cnv "NZL"
cnv "OMN"
cnv "PAK"
cnv "PAN"
cnv "PCN"
cnv "PER"
cnv "PHL"
cnv "PLW"
cnv "PNG"
cnv "POL"
cnv "PRK"
cnv "PRT"
cnv "PRY"
cnv "PSE"
cnv "PYF"
cnv "QAT"
cnv "REU"
cnv "ROU"
cnv "RUS"
cnv "RWA"
cnv "SAU"
cnv "SDN"
cnv "SEN"
cnv "SGP"
cnv "SHN"
cnv "SLB"
cnv "SLE"
cnv "SLV"
cnv "SMR"
cnv "SOM"
cnv "SRB"
cnv "SSD"
cnv "STP"
cnv "SUR"
cnv "SVK"
cnv "SVN"
cnv "SWE"
cnv "SWZ"
cnv "SYC"
cnv "SYR"
cnv "TCA"
cnv "TCD"
cnv "TGO"
cnv "THA"
cnv "TJK"
cnv "TKL"
cnv "TKM"
cnv "TLS"
cnv "TON"
cnv "TTO"
cnv "TUN"
cnv "TUR"
cnv "TUV"
cnv "TWN"
cnv "TZA"
cnv "UGA"
cnv "UKR"
cnv "URY"
cnv "USA"
cnv "UZB"
cnv "VAT"
cnv "VCT"
cnv "VEN"
cnv "VGB"
cnv "VIR"
cnv "VNM"
cnv "VUT"
cnv "WLF"
cnv "WSM"
cnv "YEM"
cnv "ZAF"
cnv "ZMB"
cnv "ZWE"