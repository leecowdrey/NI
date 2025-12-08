#!/bin/bash
#=====================================================================
# Network Insight (NI) - UI Server Upgrade
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
alert "NI UI Server Upgrade"

# if existing ni.ini deployed use that
[[ -f "/etc/ni/ni.ini" ]] && ENV="/etc/ni/ni.ini"

# ensure root and have initial tools and config
[[ $(id -u) -ne 0 ]] && exit 1
[[ -f "${ENV}" ]] || exit 1
which curl &> /dev/null || exit 1
which openssl &> /dev/null || exit 1
which unzip &> /dev/null || exit 1
which node &> /dev/null || exit 1
which npm &> /dev/null || exit 1

ADDRESS=$(grep -E "^UISERV_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
CONFIG_DIRECTORY=$(grep -E "^CONFIG_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
DIST_DIRECTORY=$(grep -E "^UISERV_DIST_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
HOST=$(grep -E "^DNSSERV_HOST=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
DOMAIN=$(grep -E "^DNSSERV_DOMAIN=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
GROUP=$(grep -E "^HOST_SERVICE_GROUP=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
HOST_SERVICE=$(grep -E "^UISERV_HOST_SERVICE_SYSTEMD=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
LOG_FILE=$(grep -E "^UISERV_HOST_SERVICE_LOG_FILE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
PORT=$(grep -E "^UISERV_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_CERT=$(grep -E "^UISERV_SSL_CERT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_CSR=$(grep -E "^UISERV_SSL_CSR=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_DAYS=$(grep -E "^UISERV_SSL_DAYS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_KEY=$(grep -E "^UISERV_SSL_KEY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_SIZE=$(grep -E "^UISERV_SSL_SIZE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
USERNAME=$(grep -E "^UISERV_HOST_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
WORKING_DIRECTORY=$(grep -E "^UISERV_WORKING_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)

#INSTALL_TMP=$(mktemp -q -p /tmp ni.XXXXXXXX)

doing "Stopping SystemD service"
systemctl is-active ${HOST_SERVICE} &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && (systemctl stop ${HOST_SERVICE} &>/dev/null ; RETVAL=$?)
[[ ${RETVAL} -eq 0 ]] && success "- ok" || info "- fail"

doing "Updating environment"
rm -R -f ${DIST_DIRECTORY}/* &>/dev/null
cp -f ${CLI_PATH}/*.mjs ${WORKING_DIRECTORY}/ && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/*.mjs && chmod 660 ${WORKING_DIRECTORY}/*.mjs && \
cp -f ${CLI_PATH}/package.json ${WORKING_DIRECTORY}/ && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/package.json && chmod 660 ${WORKING_DIRECTORY}/package.json && \
cp -f ${CLI_PATH}/favicon.ico ${WORKING_DIRECTORY}/ && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/favicon.ico && chmod 660 ${WORKING_DIRECTORY}/favicon.ico && \
cp -Rf ${CLI_PATH}/dist/* ${DIST_DIRECTORY}/ && chown -hR ${USERNAME}:${GROUP} ${DIST_DIRECTORY}/* && chmod 770 ${DIST_DIRECTORY} && find ${DIST_DIRECTORY} -type d -exec chmod 550 {} \; &>/dev/null && find ${DIST_DIRECTORY} -type f -exec chmod 440 {} \; &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Updating NodeJS package for target"
sed -i -e "s|/usr/local/ni/ui/uiServer.mjs|${WORKING_DIRECTORY}/uiServer.mjs|" ${WORKING_DIRECTORY}/package.json && \
sed -i -e "s|/etc/ni/ni.ini|${CONFIG_DIRECTORY}/ni.ini|" ${WORKING_DIRECTORY}/package.json
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Updating NodeJS libraries"
su --shell /bin/bash -l - -c "npm update --omit=dev" ${USERNAME} &>/dev/null
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