#!/bin/bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - API Server Sample Data
#
# Corporate Headquarters:
# Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
# https://www.merkator.com/
#
# © 2024-2025 Merkator nv/sa. All rights reserved.
#=====================================================================
set +H
shopt -s expand_aliases
RETVAL=0
CLI_PATH=$(dirname -- "$( readlink -f -- "$0"; )";)
CLI_NAME="${0##*/}"
ENV="${CLI_PATH}/mni.ini"
source ${CLI_PATH}/common.sh
alert "MNI API Server Sample Data Load"

# if existing mni.ini deployed use that
[[ -f "/etc/mni/mni.ini" ]] && ENV="/etc/mni/mni.ini"

# ensure have initial tools and config
[[ -f "${ENV}" ]] || exit 1
which curl --silent &> /dev/null || apt install -y curl --silent &>/dev/null

ADDRESS=$(grep -E "^APISERV_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
PORT=$(grep -E "^APISERV_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SERVICE_USERNAME=$(grep -E "^APISERV_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SERVICE_KEY=$(grep -E "^APISERV_SERVICE_KEY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APISERV_URL_PREFIX=$(grep -E "^APISERV_URL_PREFIX=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APISERV_URL_VERSION=$(grep -E "^APISERV_URL_VERSION=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)

# country specific for sample datasets
COUNTRY="GBR" # GBR, BEL, ESP etc. see schema.sql countryCode for list
if [[ -n "${1}" ]] ; then
  COUNTRY="${1^^}"
fi
info "Using country code ${COUNTRY}"

#INSTALL_TMP=$(mktemp -q -p /tmp mni.XXXXXXXX)

doing "Checking for API Readiness"
READY=$(curl --silent --write-out "%{http_code}" --output /dev/null --insecure --connect-timeout 5 \
     -X GET "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/api/readiness" \
     -H "Accept: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}")
RETVAL=$?
if [[ ${RETVAL} -eq 0 ]] ; then
  if [[ "${READY}" == "200" ]] ; then
    REVTAL=0
  else
    REVTAL=1
  fi
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

for SECRET in sample/secret-*.json ; do
  SECRET_NAME=${SECRET#"sample/secret-"}
  SECRET_NAME=${SECRET_NAME%".json"}
  doing "Adding secret - ${SECRET_NAME}"
  curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/secret" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @${SECRET} &>/dev/null
  RETVAL=$?
  [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
done

doing "Adding bulk email providers"
curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/admin/email" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/admin_email.json &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding bulk kafka providers"
curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/admin/kafka" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/admin_kafka.json &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding bulk map providers"
curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/admin/map" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/admin_map.json &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding bulk workflow engines"
curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/admin/workflow" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/admin_workflow.json &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

for CVE in sample/CVE-*.json ; do
  CVE_NAME=${CVE#"sample/CVE-"}
  CVE_NAME=${CVE_NAME%".json"}
  doing "Adding CVE - ${CVE_NAME}"
  curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/cve" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @${CVE} &>/dev/null
  RETVAL=$?
  [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
done

doing "Adding bulk sites"
curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/sites" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/site-${COUNTRY}.json &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding bulk racks"
curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/racks" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/rack-${COUNTRY}.json &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding bulk trenches"
curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/trenches" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/trench-${COUNTRY}.json &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding bulk poles"
curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/poles" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/pole-${COUNTRY}.json &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding bulk ducts"
curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/ducts" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/duct-${COUNTRY}.json &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding bulk cables"
curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/cables" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/cable-${COUNTRY}.json &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding bulk network equipment"
curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/nes" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/ne-${COUNTRY}.json &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding bulk services"
curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/services" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -d @sample/service-${COUNTRY}.json &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding document - favicon.ico"
curl --silent --insecure --connect-timeout 5 \
     -X POST "https://${ADDRESS}:${PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}/document" \
     -H "Accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -u "${SERVICE_USERNAME}:${SERVICE_KEY}" \
     -F "document=@sample/favicon.ico" &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

# tidy
clean_tmp_files

[[ ${RETVAL} -eq 0 ]] && success "- completed" || error "- fail"

exit ${RETVAL}