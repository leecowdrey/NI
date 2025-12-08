#!/bin/bash
#=====================================================================
# Network Insight (NI) - API Server Sample Data
#
# Corporate Headquarters:
# Cowdrey Consulting · United Kingdom · T:+447442104556 
# https://www.cowdrey.net/
#
# © 2026 Cowdrey Consulting. All rights reserved.
#=====================================================================
set +H
shopt -s expand_aliases
RETVAL=0
CLI_PATH=$(dirname -- "$( readlink -f -- "$0"; )";)
CLI_NAME="${0##*/}"
ENV="${CLI_PATH}/ni.ini"
source ${CLI_PATH}/common.sh
alert "NI API Server Sample Data Load"

# if existing ni.ini deployed use that
[[ -f "/etc/ni/ni.ini" ]] && ENV="/etc/ni/ni.ini"

# ensure have initial tools and config
[[ -f "${ENV}" ]] || exit 1
which curl --silent &> /dev/null || apt install -y curl --silent &>/dev/null
which dig &>/dev/null || apt install -y dnsutils --silent &>/dev/null

DNSSD_HOST=$(grep -E "^DNSSERV_HOST=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
DNSSD_DOMAIN=$(grep -E "^DNSSERV_DOMAIN=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
#ADDRESS=$(grep -E "^APISERV_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
#PORT=$(grep -E "^APISERV_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SERVICE_USERNAME=$(grep -E "^NI_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SERVICE_KEY=$(grep -E "^NI_SERVICE_KEY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APISERV_URL_PREFIX=$(grep -E "^APISERV_URL_PREFIX=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APISERV_URL_VERSION=$(grep -E "^APISERV_URL_VERSION=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)

#INSTALL_TMP=$(mktemp -q -p /tmp ni.XXXXXXXX)

doing "DNS service discovery"
DNSD_HOST=$(dig +short _https._tcp.apiserver.${DNSSD_HOST,,}.${DNSSD_DOMAIN,,} SRV|cut -d" " -f4)
PORT=$(dig +short _https._tcp.apiserver.${DNSSD_HOST,,}.${DNSSD_DOMAIN,,} SRV|cut -d" " -f3)
ADDRESS=$(dig +short ${DNSD_HOST} A)
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

function a2s() {
 let RETVAL=0
 if [[ -f "${2}" ]] ; then
    let OBJS=$(jq -r ".|length" ${2})
    if [[ "${OBJS}" -gt 0 ]] ; then
        let REC=0
        for (( O=0; O<${OBJS}; O++ )) ; do
            REC=$(($REC + 1))
            JSON_TMP=$(mktemp -q -p /tmp ni.XXXXXXXX)
            jq --exit-status -r ".[${O}]" ${2} > ${JSON_TMP}
            if [[ $? -eq 0 ]] ; then
              let RESULT=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure --connect-timeout 15 \
                   -X POST "${1}" \
                   -H "Accept: application/json" \
                   -H "Content-Type: application/json" \
                   -d @${JSON_TMP} \
                   -u "${SERVICE_USERNAME}:${SERVICE_KEY}")
               RETVAL=$?
               [[ -f "${JSON_TMP}" ]] && rm -f ${JSON_TMP} &>/dev/null
               info "${REC}/${OBJS}: ${RESULT}"
               if [[ ${RESULT} -eq 0 ]] ; then
                    if [[ "${RESULT:0:1}" == "2" ]] ; then
                         RETVAL=0
                    else
                         RETVAL=1
                       break
                    fi
               fi
            fi
        done
    fi
 fi
 return ${RETVAL}
}

doing "Checking for API Readiness"
READY_ATTEMPTS=3
READY_ATTEMPT=0
while [[ ${READY_ATTEMPT} -lt ${READY_ATTEMPTS} ]] ; do
     READY=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure --connect-timeout 15 \
          -X GET "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/api/readiness" \
          -H "Accept: application/json" \
          -u "${SERVICE_USERNAME}:${SERVICE_KEY}")
     RETVAL=$?
     if [[ ${RETVAL} -eq 0 ]] ; then
          if [[ "${READY:0:1}" == "2" ]] ; then
               RETVAL=0
               break
          else
               RETVAL=1
          fi
     fi
done
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

for SECRET in sample/secret-*.json ; do
  SECRET=${SECRET#"sample/secret-"}
  SECRET=${SECRET%".json"}
  doing "Adding secret - ${SECRET}"
  POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/secret" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/secret-${SECRET}.json)
     if [[ ${RETVAL} -eq 0 ]] ; then
          if [[ "${POST:0:1}" == "2" || "${POST}" == "409" ]] ; then
          RETVAL=0
          else
          RETVAL=1
          fi
     fi
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
done

doing "Adding bulk email providers"
  POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/admin/email" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/admin_email.json )
     if [[ ${RETVAL} -eq 0 ]] ; then
          if [[ "${POST:0:1}" == "2" ]] ; then
          RETVAL=0
          else
          RETVAL=1
          fi
     fi
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding bulk kafka providers"
  POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/admin/kafka" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/admin_kafka.json)
     if [[ ${RETVAL} -eq 0 ]] ; then
          if [[ "${POST:0:1}" == "2" ]] ; then
          RETVAL=0
          else
          RETVAL=1
          fi
     fi
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding bulk map providers"
  POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/admin/map" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/admin_map.json)
     if [[ ${RETVAL} -eq 0 ]] ; then
          if [[ "${POST:0:1}" == "2" ]] ; then
          RETVAL=0
          else
          RETVAL=1
          fi
     fi
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding bulk workflow engines"
  POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/admin/workflow" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/admin_workflow.json)
     if [[ ${RETVAL} -eq 0 ]] ; then
          if [[ "${POST:0:1}" == "2" ]] ; then
          RETVAL=0
          else
          RETVAL=1
          fi
     fi
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding CVEs"
for CVE in sample/CVE-*.json ; do
  CVE=${CVE#"sample/CVE-"}
  CVE=${CVE%".json"}
  info "Loading CVE ${CVE}"
  POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/cve" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/CVE-${CVE}.json)
     if [[ ${RETVAL} -eq 0 ]] ; then
          if [[ "${POST:0:1}" == "2" || "${POST}" == "409" ]] ; then
          RETVAL=0
          else
          RETVAL=1
          fi
     fi
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
done

doing "Adding bulk sites"
  for GEO_SITE in sample/site-*.json ; do
    GEO_SITE=${GEO_SITE#"sample/site-"}
    GEO_SITE=${GEO_SITE%".json"}
    info "Loading bulk sites for ${GEO_SITE}"
    RETRY=1
    until [ ${RETRY} = 0 ] ; do
     POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
               -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/sites" \
               -H "Accept: application/json" \
               -H "Content-Type: application/json" \
               -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
               -d @sample/site-${GEO_SITE}.json)
          if [[ ${RETVAL} -eq 0 ]] ; then
               if [[ "${POST:0:1}" == "2" ]] ; then
                    RETVAL=0
                    RETRY=0
               elif [[ "${POST}" == "413" ]] ; then
                    info "- waiting for existing queue to empty"
                    sleep 30s
                    RETRY=1
               else
                    RETVAL=1
                    RETRY=0
               fi
          fi
     done
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
  done

doing "Adding bulk racks"
  for GEO_RACK in sample/rack-*.json ; do
    GEO_RACK=${GEO_RACK#"sample/rack-"}
    GEO_RACK=${GEO_RACK%".json"}
    info "Loading bulk racks for ${GEO_RACK}"
    RETRY=1
    until [ ${RETRY} = 0 ] ; do
     POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
               -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/racks" \
               -H "Accept: application/json" \
               -H "Content-Type: application/json" \
               -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
               -d @sample/rack-${GEO_RACK}.json)
          if [[ ${RETVAL} -eq 0 ]] ; then
               if [[ "${POST:0:1}" == "2" ]] ; then
                    RETVAL=0
                    RETRY=0
               elif [[ "${POST}" == "413" ]] ; then
                    info "- waiting for existing queue to empty"
                    sleep 30s
                    RETRY=1
               else
                    RETVAL=1
                    RETRY=0
               fi
          fi
     done
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
  done

doing "Adding bulk trenches"
  for GEO_TRENCH in sample/trench-*.json ; do
    GEO_TRENCH=${GEO_TRENCH#"sample/trench-"}
    GEO_TRENCH=${GEO_TRENCH%".json"}
    info "Loading bulk trenches for ${GEO_TRENCH}"
    RETRY=1
    until [ ${RETRY} = 0 ] ; do
     POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
               -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/trenches" \
               -H "Accept: application/json" \
               -H "Content-Type: application/json" \
               -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
               -d @sample/trench-${GEO_TRENCH}.json)
          if [[ ${RETVAL} -eq 0 ]] ; then
               if [[ "${POST:0:1}" == "2" ]] ; then
                    RETVAL=0
                    RETRY=0
               elif [[ "${POST}" == "413" ]] ; then
                    info "- waiting for existing queue to empty"
                    sleep 30s
                    RETRY=1
               else
                    RETVAL=1
                    RETRY=0
               fi
          fi
     done
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
  done

doing "Adding bulk poles"
  for GEO_POLE in sample/pole-*.json ; do
    GEO_POLE=${GEO_POLE#"sample/pole-"}
    GEO_POLE=${GEO_POLE%".json"}
    info "Loading bulk poles for ${GEO_POLE}"
    RETRY=1
    until [ ${RETRY} = 0 ] ; do
     POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
               -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/poles" \
               -H "Accept: application/json" \
               -H "Content-Type: application/json" \
               -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
               -d @sample/pole-${GEO_POLE}.json)
          if [[ ${RETVAL} -eq 0 ]] ; then
               if [[ "${POST:0:1}" == "2" ]] ; then
                    RETVAL=0
                    RETRY=0
               elif [[ "${POST}" == "413" ]] ; then
                    info "- waiting for existing queue to empty"
                    sleep 30s
                    RETRY=1
               else
                    RETVAL=1
                    RETRY=0
               fi
          fi
     done
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
  done

doing "Adding bulk ducts"
  for GEO_DUCT in sample/duct-*.json ; do
    GEO_DUCT=${GEO_DUCT#"sample/duct-"}
    GEO_DUCT=${GEO_DUCT%".json"}
    info "Loading bulk ducts for ${GEO_DUCT}"
    RETRY=1
    until [ ${RETRY} = 0 ] ; do
     POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
               -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/ducts" \
               -H "Accept: application/json" \
               -H "Content-Type: application/json" \
               -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
               -d @sample/duct-${GEO_DUCT}.json)
          if [[ ${RETVAL} -eq 0 ]] ; then
               if [[ "${POST:0:1}" == "2" ]] ; then
                    RETVAL=0
                    RETRY=0
               elif [[ "${POST}" == "413" ]] ; then
                    info "- waiting for existing queue to empty"
                    sleep 30s
                    RETRY=1
               else
                    RETVAL=1
                    RETRY=0
               fi
          fi
     done
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
  done

doing "Adding bulk cables"
  for GEO_CABLE in sample/cable-*.json ; do
    GEO_CABLE=${GEO_CABLE#"sample/cable-"}
    GEO_CABLE=${GEO_CABLE%".json"}
    info "Loading bulk cables for ${GEO_CABLE}"
    RETRY=1
    until [ ${RETRY} = 0 ] ; do
     POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
               -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/cables" \
               -H "Accept: application/json" \
               -H "Content-Type: application/json" \
               -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
               -d @sample/cable-${GEO_CABLE}.json)
          if [[ ${RETVAL} -eq 0 ]] ; then
               if [[ "${POST:0:1}" == "2" ]] ; then
                    RETVAL=0
                    RETRY=0
               elif [[ "${POST}" == "413" ]] ; then
                    info "- waiting for existing queue to empty"
                    sleep 30s
                    RETRY=1
               else
                    RETVAL=1
                    RETRY=0
               fi
          fi
     done
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
  done

doing "Adding bulk network equipment"
  for GEO_NE in sample/ne-*.json ; do
    GEO_NE=${GEO_NE#"sample/ne-"}
    GEO_NE=${GEO_NE%".json"}
    info "Loading bulk nes for ${GEO_NE}"
    RETRY=1
    until [ ${RETRY} = 0 ] ; do
     POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
               -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/nes" \
               -H "Accept: application/json" \
               -H "Content-Type: application/json" \
               -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
               -d @sample/ne-${GEO_NE}.json)
          if [[ ${RETVAL} -eq 0 ]] ; then
               if [[ "${POST:0:1}" == "2" ]] ; then
                    RETVAL=0
                    RETRY=0
               elif [[ "${POST}" == "413" ]] ; then
                    info "- waiting for existing queue to empty"
                    sleep 30s
                    RETRY=1
               else
                    RETVAL=1
                    RETRY=0
               fi
          fi
     done
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
  done

doing "Adding bulk services"
  for GEO_SERVICE in sample/service-*.json ; do
    GEO_SERVICE=${GEO_SERVICE#"sample/service-"}
    GEO_SERVICE=${GEO_SERVICE%".json"}
    info "Loading bulk services for ${GEO_SERVICE}"
    RETRY=1
    until [ ${RETRY} = 0 ] ; do
     POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
               -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/services" \
               -H "Accept: application/json" \
               -H "Content-Type: application/json" \
               -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
               -d @sample/service-${GEO_SERVICE}.json)
          if [[ ${RETVAL} -eq 0 ]] ; then
               if [[ "${POST:0:1}" == "2" ]] ; then
                    RETVAL=0
                    RETRY=0
               elif [[ "${POST}" == "413" ]] ; then
                    info "- waiting for existing queue to empty"
                    sleep 30s
                    RETRY=1
               else
                    RETVAL=1
                    RETRY=0
               fi
          fi
     done
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
  done

doing "Adding document - favicon.ico"
     POST=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure \
          -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/document" \
          -H "Accept: application/json" \
          -H "Content-Type: multipart/form-data" \
          -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
          -F "document=@sample/favicon.ico")
     if [[ ${RETVAL} -eq 0 ]] ; then
          if [[ "${POST:0:1}" == "2" ]] ; then
          RETVAL=0
          else
          RETVAL=1
          fi
     fi
     [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

# tidy
clean_tmp_files

[[ ${RETVAL} -eq 0 ]] && success "- completed" || error "- fail"

exit ${RETVAL}