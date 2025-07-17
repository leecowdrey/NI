#!/bin/bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - API Server Installer
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
alert "MNI API Server Install"

# if existing mni.ini deployed use that
[[ -f "/etc/mni/mni.ini" ]] && ENV="/etc/mni/mni.ini"

# ensure root and have initial tools and config
[[ $(id -u) -ne 0 ]] && exit 1
[[ -f "${ENV}" ]] || exit 1
which curl &> /dev/null || apt install -y curl &>/dev/null
which openssl &> /dev/null || apt install -y openssl &>/dev/null
which unzip &> /dev/null || apt install -y unzip &>/dev/null
which git &> /dev/null || apt install -y git &>/dev/null
which node &> /dev/null || (curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh && bash nodesource_setup.sh && apt update && apt install -y nodejs)
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
ENCRYPTION_KEY=$(grep -E "^APISERV_ENCRYPTION_KEY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
ENCRYPTION_IV==$(grep -E "^APISERV_ENCRYPTION_IV=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_CERT=$(grep -E "^APISERV_SSL_CERT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_CSR=$(grep -E "^APISERV_SSL_CSR=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_DAYS=$(grep -E "^APISERV_SSL_DAYS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_KEY=$(grep -E "^APISERV_SSL_KEY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_SIZE=$(grep -E "^APISERV_SSL_SIZE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
USERNAME=$(grep -E "^APISERV_HOST_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
WORKING_DIRECTORY=$(grep -E "^APISERV_WORKING_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
DOCUMENT_DIRECTORY==$(grep -E "^APISERV_DOCUMENT_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
UPLOAD_DIRECTORY=$(grep -E "^APISERV_UPLOAD_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APISERV_URL_PREFIX=$(grep -E "^APISERV_URL_PREFIX=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APISERV_URL_VERSION=$(grep -E "^APISERV_URL_VERSION=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)

#INSTALL_TMP=$(mktemp -q -p /tmp mni.XXXXXXXX)

doing "DuckDB installation"
which duckdb &> /dev/null
RETVAL=$?
if [[ ${RETVAL} -ne 0 ]] ; then
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
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding MNI group"
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
MNI_LOG_DIRECTORY=$(dirname ${LOG_FILE})
[[ -d "${MNI_LOG_DIRECTORY}" ]] || (mkdir -p ${MNI_LOG_DIRECTORY})
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding working directory"
[[ -d "${WORKING_DIRECTORY}" ]] || (mkdir -p ${WORKING_DIRECTORY})
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding working API directory"
[[ -d "${API_DIRECTORY}" ]] || (mkdir -p ${API_DIRECTORY})
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding working backup directory"
[[ -d "${BACKUP_DIRECTORY}" ]] || (mkdir -p ${BACKUP_DIRECTORY})
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding document directory"
[[ -d "${DOCUMENT_DIRECTORY}" ]] || (mkdir -p ${DOCUMENT_DIRECTORY})
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding upload directory"
[[ -d "${UPLOAD_DIRECTORY}" ]] || (mkdir -p ${UPLOAD_DIRECTORY})
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Cleaning upload directory"
if [[ -d "${UPLOAD_DIRECTORY}" ]] ; then
  if [[ -f  "${UPLOAD_DIRECTORY}/*" ]] ; then
    rm -R -f "${UPLOAD_DIRECTORY}/*" &>/dev/null
    RETVAL=$?
  else
   RETVAL=0
  fi
 else
  RETVAL=0
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding Config to config directory"
if [[ -d "${CONFIG_DIRECTORY}" ]] ; then
  if [[ ! -f "${CONFIG_DIRECTORY}/mni.ini" ]] ; then
    cp -f ${ENV} ${CONFIG_DIRECTORY}/mni.ini
  else
    RETVAL=0
  fi
  RETVAL=$?
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Setting directory permissions"
chown root:${GROUP} ${CONFIG_DIRECTORY} && chmod 770 ${CONFIG_DIRECTORY} && \
chown root:${GROUP} ${CONFIG_DIRECTORY}/mni.ini && chmod 660 ${CONFIG_DIRECTORY}/mni.ini && \
chown root:${GROUP} $(dirname ${WORKING_DIRECTORY}) && chmod 770 $(dirname ${WORKING_DIRECTORY}) && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY} && chmod 770 ${WORKING_DIRECTORY} && \
chown ${USERNAME}:${GROUP} ${API_DIRECTORY} && chmod 770 ${API_DIRECTORY} && \
chown ${USERNAME}:${GROUP} ${BACKUP_DIRECTORY} && chmod 770 ${BACKUP_DIRECTORY} && \
chown ${USERNAME}:${GROUP} ${DOCUMENT_DIRECTORY} && chmod 770 ${DOCUMENT_DIRECTORY} && \
chown ${USERNAME}:${GROUP} ${UPLOAD_DIRECTORY} && chmod 770 ${UPLOAD_DIRECTORY} && \
chown root:${GROUP} ${MNI_LOG_DIRECTORY} && chmod 770 ${MNI_LOG_DIRECTORY} && \
chown root:${GROUP} ${CONFIG_DIRECTORY} && chmod 770 ${CONFIG_DIRECTORY}
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Preparing environment"
cp -f ${CLI_PATH}/*.mjs ${WORKING_DIRECTORY}/ && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/*.mjs && chmod 660 ${WORKING_DIRECTORY}/*.mjs && \
cp -f ${CLI_PATH}/package.json ${WORKING_DIRECTORY}/ && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/package.json && chmod 660 ${WORKING_DIRECTORY}/package.json && \
cp -f ${CLI_PATH}/mni.yaml ${WORKING_DIRECTORY}/api/ && chown ${USERNAME}:${GROUP} ${API_DIRECTORY}/mni.yaml && chmod 660 ${API_DIRECTORY}/mni.yaml
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Checking/Updating for valid address binding (apiServer)"
if [[ -z "${ADDRESS}" ]] ; then
  ADDRESS=$(ip route get $(ip route show 0.0.0.0/0 | grep -oP 'via \K\S+') | grep -oP 'src \K\S+')
  sed -i -e "s|APISERV_ADDRESS=.*|APISERV_ADDRESS=\"${ADDRESS}\"|" ${CONFIG_DIRECTORY}/mni.ini 
  RETVAL=$?
else
  RETVAL=0
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Checking/Updating for valid address binding (apiGateway)"
if [[ -z "${APIGW_ADDRESS}" ]] ; then
  APIGW_ADDRESS=$(ip route get $(ip route show 0.0.0.0/0 | grep -oP 'via \K\S+') | grep -oP 'src \K\S+')
  sed -i -e "s|APIGW_ADDRESS=.*|APIGW_ADDRESS=\"${APIGW_ADDRESS}\"|" ${CONFIG_DIRECTORY}/mni.ini 
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
            -subj "/CN=${ADDRESS}/emailAddress=help@marlindt.net/C=BE/ST=/L=/O=Merkator/OU=" \
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

doing "Adding DuckDB database"
[[ $(dirname ${DB_FILE}) == "." ]] && DB_FILE="${WORKING_DIRECTORY}/${DB_FILE}"
if [[ ! -f "${DB_FILE}" ]] ; then
  [[ -f "schema.log" ]] && rm -f schema.log &>/dev/null
  duckdb ${DB_FILE} < schema.sql > schema.log 2>&1
  RETVAL=$?
  #if [[ -f "devData.sql" ]] ; then
  #  duckdb ${DB_FILE} < devData.sql >> schema.log 2>&1
  #fi
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Setting DuckDB database ownership/permissions"
if [[ -f "${DB_FILE}" ]] ; then
  chown ${USERNAME}:${GROUP} ${DB_FILE} && \
  chmod 660 ${DB_FILE}
  RETVAL=$?
else
  RETVAL=1
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Updating NodeJS package for target"
sed -i -e "s|/usr/local/mni/apiServer.mjs|${WORKING_DIRECTORY}/apiServer.mjs|" ${WORKING_DIRECTORY}/package.json && \
sed -i -e "s|/etc/mni/mni.ini|${CONFIG_DIRECTORY}/mni.ini|" ${WORKING_DIRECTORY}/package.json
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding NodeJS libraries"
su --shell /bin/bash -l - -c "npm install --omit=dev" ${USERNAME} &>/dev/null
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

doing "Adding service log file"
touch ${LOG_FILE} && chown ${USERNAME}:${GROUP} ${LOG_FILE} && chmod 660 ${LOG_FILE}
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

if [[ -z "${SERVICE_USERNAME}" ]] ; then
  doing "Generating service credential - username"
  SERVICE_USERNAME=$(openssl rand -hex 24 | tr -d '\n'| tr -d '"' | tr -d '|') && \
  sed -i -e "s|APISERV_SERVICE_USERNAME=.*|APISERV_SERVICE_USERNAME=\"${SERVICE_USERNAME}\"|" ${CONFIG_DIRECTORY}/mni.ini
  RETVAL=$?
  [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
fi

if [[ -z "${SERVICE_KEY}" ]] ; then
  doing "Generating service credential - key"
  SERVICE_KEY=$(openssl rand -base64 60 | tr -d '\n' | tr -d '"' | tr -d '|') && \
  sed -i -e "s|APISERV_SERVICE_KEY=.*|APISERV_SERVICE_KEY=\"${SERVICE_KEY}\"|" ${CONFIG_DIRECTORY}/mni.ini
  RETVAL=$?
  [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
fi

if [[ -z "${ENCRYPTION_KEY}" ]] ; then
  doing "Generating encryption - key"
  ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d '\n' | tr -d '"' | tr -d '|') && \
  sed -i -e "s|APISERV_ENCRYPTION_KEY=.*|APISERV_ENCRYPTION_KEY=\"${ENCRYPTION_KEY}\"|" ${CONFIG_DIRECTORY}/mni.ini
  RETVAL=$?
  [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
fi

if [[ -z "${ENCRYPTION_IV}" ]] ; then
  doing "Generating encryption - initialization vector"
  ENCRYPTION_IV=$(openssl rand -base64 16 | tr -d '\n' | tr -d '"' | tr -d '|') && \
  sed -i -e "s|APISERV_ENCRYPTION_IV=.*|APISERV_ENCRYPTION_IV=\"${ENCRYPTION_IV}\"|" ${CONFIG_DIRECTORY}/mni.ini
  RETVAL=$?
  [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
fi

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