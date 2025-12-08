#!/bin/bash
#=====================================================================
# Network Insight (NI) - UI Server Installer
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
alert "NI UI Server Install"

# if existing ni.ini deployed use that
[[ -f "/etc/ni/ni.ini" ]] && ENV="/etc/ni/ni.ini"

# ensure root and have initial tools and config
[[ $(id -u) -ne 0 ]] && exit 1
[[ -f "${ENV}" ]] || exit 1
which curl &> /dev/null || apt install -y curl &>/dev/null
which openssl &> /dev/null || apt install -y openssl &>/dev/null
which unzip &> /dev/null || apt install -y unzip &>/dev/null
which node &> /dev/null || (curl -fsSL https://deb.nodesource.com/setup_24.x -o nodesource_setup.sh && bash nodesource_setup.sh && apt update && apt install -y nodejs)
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

doing "Adding NI group"
getent group ${GROUP}|grep -i ${GROUP} &>/dev/null
RETVAL=$?
if [[ ${RETVAL} -ne 0 ]] ; then
  groupadd ${GROUP} &>/dev/null
  RETVAL=$?
else
  RETVAL=0
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding user account"
useradd --home-dir ${WORKING_DIRECTORY} --shell /usr/sbin/nologin -g ${GROUP} ${USERNAME} &>/dev/null && \
echo "${USERNAME}:${USERNAME}"|chpasswd &>/dev/null && \
usermod -L ${USERNAME} &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding config directory"
[[ -d "${CONFIG_DIRECTORY}" ]] || (mkdir -p ${CONFIG_DIRECTORY})
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding log directory"
NI_LOG_DIRECTORY=$(dirname ${LOG_FILE})
[[ -d "${NI_LOG_DIRECTORY}" ]] || (mkdir -p ${NI_LOG_DIRECTORY})
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding working directory"
[[ -d "${WORKING_DIRECTORY}" ]] || (mkdir -p ${WORKING_DIRECTORY})
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding working dist directory"
[[ -d "${DIST_DIRECTORY}" ]] || (mkdir -p ${DIST_DIRECTORY})
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding Config to config directory"
if [[ -d "${CONFIG_DIRECTORY}" ]] ; then
  if [[ ! -f "${CONFIG_DIRECTORY}/ni.ini" ]] ; then
    cp -f ${ENV} ${CONFIG_DIRECTORY}/ni.ini
  else
    RETVAL=0
  fi
  RETVAL=$?
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Setting directory permissions"
chown root:${GROUP} ${CONFIG_DIRECTORY} && chmod 770 ${CONFIG_DIRECTORY} && \
chown root:${GROUP} ${CONFIG_DIRECTORY}/ni.ini && chmod 660 ${CONFIG_DIRECTORY}/ni.ini && \
chown root:${GROUP} $(dirname ${WORKING_DIRECTORY}) && chmod 770 $(dirname ${WORKING_DIRECTORY}) && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY} && chmod 770 ${WORKING_DIRECTORY} && \
chown ${USERNAME}:${GROUP} ${DIST_DIRECTORY} && chmod 770 ${DIST_DIRECTORY} && \
chown root:${GROUP} ${NI_LOG_DIRECTORY} && chmod 770 ${NI_LOG_DIRECTORY} && \
chown root:${GROUP} ${CONFIG_DIRECTORY} && chmod 770 ${CONFIG_DIRECTORY}
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Preparing environment"
cp -f ${CLI_PATH}/*.mjs ${WORKING_DIRECTORY}/ && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/*.mjs && chmod 660 ${WORKING_DIRECTORY}/*.mjs && \
cp -f ${CLI_PATH}/package.json ${WORKING_DIRECTORY}/ && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/package.json && chmod 660 ${WORKING_DIRECTORY}/package.json && \
cp -f ${CLI_PATH}/favicon.ico ${WORKING_DIRECTORY}/ && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/favicon.ico && chmod 660 ${WORKING_DIRECTORY}/favicon.ico && \
cp -Rf ${CLI_PATH}/dist/* ${DIST_DIRECTORY}/ && chown -hR ${USERNAME}:${GROUP} ${DIST_DIRECTORY}/* && chmod 770 ${DIST_DIRECTORY} && find ${DIST_DIRECTORY} -type d -exec chmod 550 {} \; &>/dev/null && find ${DIST_DIRECTORY} -type f -exec chmod 440 {} \; &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Checking/Updating for valid address binding (uiServer)"
if [[ -z "${ADDRESS}" ]] ; then
  ADDRESS=$(ip route get $(ip route show 0.0.0.0/0 | grep -oP 'via \K\S+') | grep -oP 'src \K\S+')
  sed -i -e "s|UISERV_ADDRESS=.*|UISERV_ADDRESS=\"${ADDRESS}\"|" ${CONFIG_DIRECTORY}/ni.ini 
  RETVAL=$?
else
  RETVAL=0
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Creating (if not exists) SSL certificate"
if [[ -f "${CONFIG_DIRECTORY}/${SSL_KEY}" && -f "${CONFIG_DIRECTORY}/${SSL_CERT}" ]] ; then
 RETVAL=0
else
  openssl req -newkey rsa:${SSL_SIZE} \
            -new -nodes \
            -subj "/CN=${ADDRESS}/emailAddress=help@cowdrey.net/C=BE/ST=/L=/O=Merkator/OU=" \
            -keyout ${CONFIG_DIRECTORY}/${SSL_KEY} \
            -out ${CONFIG_DIRECTORY}/${SSL_CSR} &>/dev/null && \
  openssl x509 -req \
            -days ${SSL_DAYS} \
            -in ${CONFIG_DIRECTORY}/${SSL_CSR} \
            -signkey ${CONFIG_DIRECTORY}/${SSL_KEY} \
            -out ${CONFIG_DIRECTORY}/${SSL_CERT} &>/dev/null && \
  chown ${USERNAME}:${GROUP} ${CONFIG_DIRECTORY}/${SSL_KEY} && \
  chown ${USERNAME}:${GROUP} ${CONFIG_DIRECTORY}/${SSL_CSR} && \
  chown ${USERNAME}:${GROUP} ${CONFIG_DIRECTORY}/${SSL_CERT} && \
  chmod 660 ${CONFIG_DIRECTORY}/${SSL_KEY} && \
  chmod 660 ${CONFIG_DIRECTORY}/${SSL_CSR} && \
  chmod 660 ${CONFIG_DIRECTORY}/${SSL_CERT}
  RETVAL=$?
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Updating NodeJS package for target"
sed -i -e "s|/usr/local/ni/ui/uiServer.mjs|${WORKING_DIRECTORY}/uiServer.mjs|" ${WORKING_DIRECTORY}/package.json && \
sed -i -e "s|/etc/ni/ni.ini|${CONFIG_DIRECTORY}/ni.ini|" ${WORKING_DIRECTORY}/package.json
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding NodeJS libraries"
su --shell /bin/bash -l - -c "npm install --omit=dev" ${USERNAME} &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding service log file"
touch ${LOG_FILE} && chown ${USERNAME}:${GROUP} ${LOG_FILE} && chmod 660 ${LOG_FILE}
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding SystemD service"
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