#!/bin/bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - API Server Upgrade
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
alert "MNI API Server Upgrade"

# if existing mni.ini deployed use that
[[ -f "/etc/mni/mni.ini" ]] && ENV="/etc/mni/mni.ini"

# ensure root and have initial tools and config
[[ $(id -u) -ne 0 ]] && exit 1
[[ -f "${ENV}" ]] || exit 1
which curl &> /dev/null || exit 1
which openssl &> /dev/null || exit 1
which unzip &> /dev/null || exit 1
which node &> /dev/null || exit 1
which npm &> /dev/null || exit 1

ADDRESS=$(grep -E "^APISERV_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APIGW_ADDRESS=$(grep -E "^APIGW_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APIGW_PORT=$(grep -E "^APIGW_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
API_DIRECTORY=$(grep -E "^APISERV_API_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
BACKUP_DIRECTORY=$(grep -E "^APISERV_BACKUP_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
CONFIG_DIRECTORY=$(grep -E "^CONFIG_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
DUCKDB_VERSION=$(grep -E "^APISERV_DUCKDB_VERSION=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
DB_FILE=$(grep -E "^APISERV_DUCKDB_FILE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
HOST=$(grep -E "^DNSSERV_HOST=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
DOMAIN=$(grep -E "^DNSSERV_DOMAIN=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
GROUP=$(grep -E "^HOST_SERVICE_GROUP=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
HOST_SERVICE=$(grep -E "^APISERV_HOST_SERVICE_SYSTEMD=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
LOG_FILE=$(grep -E "^APISERV_HOST_SERVICE_LOG_FILE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
PORT=$(grep -E "^APISERV_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SERVICE_USERNAME=$(grep -E "^APISERV_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SERVICE_KEY=$(grep -E "^APISERV_SERVICE_KEY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_CERT=$(grep -E "^APISERV_SSL_CERT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_CSR=$(grep -E "^APISERV_SSL_CSR=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_DAYS=$(grep -E "^APISERV_SSL_DAYS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_KEY=$(grep -E "^APISERV_SSL_KEY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_SIZE=$(grep -E "^APISERV_SSL_SIZE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
USERNAME=$(grep -E "^APISERV_HOST_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
WORKING_DIRECTORY=$(grep -E "^APISERV_WORKING_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APISERV_URL_PREFIX=$(grep -E "^APISERV_URL_PREFIX=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APISERV_URL_VERSION=$(grep -E "^APISERV_URL_VERSION=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)

#INSTALL_TMP=$(mktemp -q -p /tmp mni.XXXXXXXX)

doing "Stopping SystemD service"
systemctl is-active ${HOST_SERVICE} &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && (systemctl stop ${HOST_SERVICE} &>/dev/null ; RETVAL=$?)
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Updating environment"
cp -f ${CLI_PATH}/*.mjs ${WORKING_DIRECTORY}/ && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/*.mjs && chmod 660 ${WORKING_DIRECTORY}/*.mjs && \
cp -f ${CLI_PATH}/package.json ${WORKING_DIRECTORY}/ && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/package.json && chmod 660 ${WORKING_DIRECTORY}/package.json && \
cp -f ${CLI_PATH}/mni.yaml ${WORKING_DIRECTORY}/api/ && chown ${USERNAME}:${GROUP} ${API_DIRECTORY}/mni.yaml && chmod 660 ${API_DIRECTORY}/mni.yaml
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Updating (if necessary) DuckDB installation"
which duckdb &> /dev/null
RETVAL=$?
if [[ ${RETVAL} -ne 0 ]] ; then
  DDB_VERSION=$(duckdb --version|cut -d" " -f1)
  RETVAL=$?
  if [[ "${DDB_VERSION}" != "${DUCKDB_VERSION}" ]] ; then
    [[ ! -f "/tmp/duckdb_cli-linux-amd64.zip" ]] && rm -f /tmp/duckdb_cli-linux-amd64.zip &>/dev/null
    curl --fail --location --output /tmp/duckdb_cli-linux-amd64.zip \
       "https://github.com/duckdb/duckdb/releases/download/${DUCKDB_VERSION}/duckdb_cli-linux-amd64.zip" &>/dev/null
    RETVAL=$?
    if [[ ${RETVAL} -eq 0 ]] ; then
      unzip -d /usr/local/bin /tmp/duckdb_cli-linux-amd64.zip &>/dev/null && \
      chmod 755 /usr/local/bin/duckdb 
      RETVAL=$?
    fi
    [[ ! -f "/tmp/duckdb_cli-linux-amd64.zip" ]] && rm -f /tmp/duckdb_cli-linux-amd64.zip &>/dev/null
  fi
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Updating NodeJS package for target"
sed -i -e "s|/usr/local/mni/apiServer.mjs|${WORKING_DIRECTORY}/apiServer.mjs|" ${WORKING_DIRECTORY}/package.json && \
sed -i -e "s|/etc/mni/mni.ini|${CONFIG_DIRECTORY}/mni.ini|" ${WORKING_DIRECTORY}/package.json
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Updating NodeJS libraries"
su --shell /bin/bash -l - -c "npm update --omit=dev" ${USERNAME} &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Updating OpenAPI definitions for target"
if [ "${API_DIRECTORY}/mni.yaml" ] ; then
 curl --silent -L --output yq "https://github.com/mikefarah/yq/releases/download/v4.45.1/yq_linux_amd64" && \
 chmod 700 ./yq && \
 ./yq --exit-status -i ".servers[].url = \"https://${APIGW_ADDRESS}:${APIGW_PORT}${APISERV_URL_PREFIX}${APISERV_URL_VERSION}\"" ${WORKING_DIRECTORY}/api/mni.yaml &>/dev/null && \
 ./yq --exit-status "." -o=json ${API_DIRECTORY}/mni.yaml > ${API_DIRECTORY}/mni.json && \
 chown ${USERNAME}:${GROUP} ${API_DIRECTORY}/mni.json && chmod 660 ${API_DIRECTORY}/mni.json && \
 chown ${USERNAME}:${GROUP} ${API_DIRECTORY}/mni.yaml && chmod 660 ${API_DIRECTORY}/mni.yaml && \
 rm -f ./yq &>/dev/null
fi
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Updating & Restarting SystemD service"
cp -f ${CLI_PATH}/${HOST_SERVICE} /etc/systemd/system/${HOST_SERVICE} && \
sed -i -e "s/User=.*/User=${USERNAME}/" /etc/systemd/system/${HOST_SERVICE} && \
sed -i -e "s/Group=.*/Group=${GROUP}/" /etc/systemd/system/${HOST_SERVICE} && \
sed -i -e "s|WorkingDirectory=.*|WorkingDirectory=${WORKING_DIRECTORY}|" /etc/systemd/system/${HOST_SERVICE} && \
sed -i -e "s|WorkingDirectory=.*|WorkingDirectory=${WORKING_DIRECTORY}|" /etc/systemd/system/${HOST_SERVICE} && \
systemctl daemon-reload &>/dev/null && \
systemctl enable ${HOST_SERVICE} &>/dev/null && \
systemctl start ${HOST_SERVICE} &>/dev/null && \
systemctl is-active ${HOST_SERVICE} &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

# tidy
clean_tmp_files

[[ ${RETVAL} -eq 0 ]] && success "- completed" || error "- fail"

exit ${RETVAL}