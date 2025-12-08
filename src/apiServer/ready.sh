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

[[ ${RETVAL} -eq 0 ]] && success "- completed" || error "- fail"

exit ${RETVAL}