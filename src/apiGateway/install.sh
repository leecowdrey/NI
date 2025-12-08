#!/bin/bash
#=====================================================================
# Network Insight (NI) - API Gateway Installer
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
alert "NI API Gateway"

# if existing ni.ini deployed use that
[[ -f "/etc/ni/ni.ini" ]] && ENV="/etc/ni/ni.ini"

# ensure root and have initial tools and config
[[ $(id -u) -ne 0 ]] && exit 1
[[ -f "${ENV}" ]] || exit 1
which curl &> /dev/null || apt install -y curl &>/dev/null
which openssl &> /dev/null || apt install -y openssl &>/dev/null
which base64 &> /dev/null || apt install -y base64 &>/dev/null
which node &> /dev/null || (curl -fsSL https://deb.nodesource.com/setup_24.x -o nodesource_setup.sh && bash nodesource_setup.sh && apt update && apt install -y nodejs)
which npm &> /dev/null || exit 1
which yq &> /dev/null || apt install -y yq &>/dev/null

ADDRESS=$(grep -E "^APIGW_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
USERNAME=$(grep -E "^APIGW_HOST_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
GROUP=$(grep -E "^HOST_SERVICE_GROUP=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
CONFIG_DIRECTORY=$(grep -E "^CONFIG_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
WORKING_DIRECTORY=$(grep -E "^APIGW_WORKING_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
PORT=$(grep -E "^APIGW_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
HOST=$(grep -E "^DNSSERV_HOST=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
DOMAIN=$(grep -E "^DNSSERV_DOMAIN=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
NI_PORT=$(grep -E "^APISERV_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
NI_ADDRESS=$(grep -E "^APISERV_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
NI_URL_PREFIX=$(grep -E "^APISERV_URL_PREFIX=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
NI_URL_VERSION=$(grep -E "^APISERV_URL_VERSION=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
LOG_FILE=$(grep -E "^APIGW_HOST_SERVICE_LOG_FILE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
HOST_SERVICE=$(grep -E "^APIGW_HOST_SERVICE_SYSTEMD=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
CONFIG_DIRECTORY=$(grep -E "^CONFIG_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
RATE_LIMIT_REQUESTS=$(grep -E "^APIGW_PROXY_RATE_LIMIT_REQUESTS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
CAPACITY_REQUESTS=$(grep -E "^APIGW_PROXY_CAPACITY_REQUESTS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
RATE_LIMIT_EVERY=$(grep -E "^APIGW_PROXY_RATE_LIMIT_EVERY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
QOS_HTTP_CACHE=$(grep -E "^APIGW_QOS_HTTP_CACHE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
TLS_INSECURE_CONNECTIONS=$(grep -E "^APIGW_TLS_INSECURE_CONNECTIONS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_KEY=$(grep -E "^APIGW_SSL_KEY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_CSR=$(grep -E "^APIGW_SSL_CSR=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_CERT=$(grep -E "^APIGW_SSL_CERT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_DAYS=$(grep -E "^APIGW_SSL_DAYS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_SIZE=$(grep -E "^APIGW_SSL_SIZE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SERVICE_USERNAME=$(grep -E "^NI_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SERVICE_KEY=$(grep -E "^NI_SERVICE_KEY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
KRAKEND_VERSION=$(grep -E "^APIGW_KRAKEND_VERSION=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
KRAKEND_IGNORE_AUTH_VALIDATOR=$(grep -E "^APIGW_IGNORE_AUTH_VALIDATOR=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
IAM_ADDRESS=$(grep -E "^IAM_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
IAM_PORT_HTTPS=$(grep -E "^IAM_PORT_HTTPS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
IAM_URL_SUFFIX=$(grep -E "^IAM_URL_SUFFIX=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
OAUTH=$(grep -E "^OAUTH=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)

#INSTALL_TMP=$(mktemp -q -p /tmp ni.XXXXXXXX)

doing "Checking for API Server service credentials"
if [[ -z "${SERVICE_USERNAME}" || -z "${SERVICE_KEY}" ]] ; then
  error "- Install NI Api Server first or update ${CONFIG_DIRECTORY}/ni.ini accordingly"
  RETVAL=1
else
  SERVICE_DIGEST=$(echo -n "${SERVICE_USERNAME}:${SERVICE_KEY}"|base64 -w 0)
  RETVAL=0
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

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
[[ -d "${CONFIG_DIRECTORY}" ]] || (mkdir -p ${CONFIG_DIRECTORY} )
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding log directory"
NI_LOG_DIRECTORY=$(dirname ${LOG_FILE})
[[ -d "${NI_LOG_DIRECTORY}" ]] || (mkdir -p ${NI_LOG_DIRECTORY} )
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding working directory"
[[ -d "${WORKING_DIRECTORY}" ]] || (mkdir -p ${WORKING_DIRECTORY} )
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding KrakenD binary directory"
[[ -d "${WORKING_DIRECTORY}/bin" ]] || (mkdir -p ${WORKING_DIRECTORY}/bin)
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding KrakenD config directory"
[[ -d "${WORKING_DIRECTORY}/config" ]] || (mkdir -p ${WORKING_DIRECTORY}/config)
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
chown root:${GROUP} ${NI_LOG_DIRECTORY} && chmod 770 ${NI_LOG_DIRECTORY} && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/bin && chmod 770 ${WORKING_DIRECTORY}/bin && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/config && chmod 770 ${WORKING_DIRECTORY}/config
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Checking/Updating for valid address binding"
if [[ -z "${ADDRESS}" ]] ; then
  ADDRESS=$(ip route get $(ip route show 0.0.0.0/0 | grep -oP 'via \K\S+') | grep -oP 'src \K\S+')
  sed -i -e "s|APIGW_ADDRESS=.*|APIGW_ADDRESS=\"${ADDRESS}\"|" ${CONFIG_DIRECTORY}/ni.ini 
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

doing "API Gateway (KrakenD) installation"
[[ ! -f "/tmp/krakend-linux-amd64.tar.gz" ]] && rm -f /tmp/krakend-linux-amd64.tar.gz &>/dev/null
curl --fail --location --progress-bar --output /tmp/krakend-linux-amd64.tar.gz \
    "https://repo.krakend.io/bin/krakend_${KRAKEND_VERSION}_amd64_generic-linux.tar.gz" &>/dev/null
RETVAL=$?
if [[ ${RETVAL} -eq 0 ]] ; then
  tar --strip-components=3 -C ${WORKING_DIRECTORY}/bin -zxvf /tmp/krakend-linux-amd64.tar.gz ./usr/bin/krakend &>/dev/null && \
  chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/bin/krakend && \
  chmod 770 ${WORKING_DIRECTORY}/bin/krakend && \
  mv -f ${WORKING_DIRECTORY}/bin/krakend ${WORKING_DIRECTORY}/bin/apigw
  RETVAL=$?
fi
[[ -f "/tmp/krakend-linux-amd64.tar.gz" ]] && rm -f /tmp/krakend-linux-amd64.tar.gz &>/dev/null
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Copying API Gateway config"
cp -f ${CLI_PATH}/apiGateway.json ${WORKING_DIRECTORY}/config/ && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/config/apiGateway.json && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/config/apiGateway.json && \
chmod 660 ${WORKING_DIRECTORY}/config/apiGateway.json
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Validating API Gateway shipping config"
${WORKING_DIRECTORY}/bin/apigw audit -s CRITICAL -c ${WORKING_DIRECTORY}/config/apiGateway.json &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Updating API Gateway deployed config"
sed -i -e "s|ni.cowdrey.local|${HOST,,}.${DOMAIN,,}|g" ${WORKING_DIRECTORY}/config/apiGateway.json && \
sed -i -e "s|https://localhost:7443|https://${NI_ADDRESS}:${NI_PORT}|g" ${WORKING_DIRECTORY}/config/apiGateway.json && \
sed -i -e "s|/etc/ni/apiGateway.crt|${CONFIG_DIRECTORY}/${SSL_CERT}|g" ${WORKING_DIRECTORY}/config/apiGateway.json && \
sed -i -e "s|/etc/ni/apiGateway.key|${CONFIG_DIRECTORY}/${SSL_KEY}|g" ${WORKING_DIRECTORY}/config/apiGateway.json && \
sed -i -e "s|/ni/v1|${NI_URL_PREFIX}${NI_URL_VERSION}|g" ${WORKING_DIRECTORY}/config/apiGateway.json && \
sed -i -e "s|/ni|${NI_URL_PREFIX}|g" ${WORKING_DIRECTORY}/config/apiGateway.json && \
sed -i -e "s|8443|${PORT}|g" ${WORKING_DIRECTORY}/config/apiGateway.json && \
sed -i -e "s|0.0.0.0|${ADDRESS}|g" ${WORKING_DIRECTORY}/config/apiGateway.json && \
sed -i -e "s|\"max_rate\": 32767|\"max_rate\": ${RATE_LIMIT_REQUESTS}|g" ${WORKING_DIRECTORY}/config/apiGateway.json && \
sed -i -e "s|\"capacity\": 32767|\"capacity\": ${CAPACITY_REQUESTS}|g" ${WORKING_DIRECTORY}/config/apiGateway.json && \
sed -i -e "s|\"every\": \"1m\"|\"every\": \"${RATE_LIMIT_EVERY}\"|g" ${WORKING_DIRECTORY}/config/apiGateway.json && \
sed -i -e "s|\"allow_insecure_connections\": false|\"allow_insecure_connections\": ${TLS_INSECURE_CONNECTIONS,,}|g" ${WORKING_DIRECTORY}/config/apiGateway.json
sed -i -e "s|\"Basic #\"|\"Basic ${SERVICE_DIGEST}\"|g" ${WORKING_DIRECTORY}/config/apiGateway.json && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/config/apiGateway.json && \
chmod 660 ${WORKING_DIRECTORY}/config/apiGateway.json
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

if [[  "${OAUTH,,}" == "true" ]] ; then
  doing "Enabling OpenID auth/validation in API Gateway deployed config"
  sed -i -e "s|\"https://iam.ni.cowdrey.local:6443|\"https://${IAM_ADDRESS}:${IAM_PORT_HTTPS}|g" ${WORKING_DIRECTORY}/config/apiGateway.json && \
  chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/config/apiGateway.json && \
  chmod 660 ${WORKING_DIRECTORY}/config/apiGateway.json
  RETVAL=$?
  [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
fi

if [[ "${KRAKEND_IGNORE_AUTH_VALIDATOR,,}" == "true" || "${OAUTH,,}" == "false" ]] ; then
  doing "Removing OpenID auth/validation from API Gateway deployed config"
  CONFIG_TMP=$(mktemp -q -p /tmp ni.XXXXXXXX)
  cat ${WORKING_DIRECTORY}/config/apiGateway.json | jq 'del(.endpoints[].extra_config."auth/validator")' > ${CONFIG_TMP} && \
  cp -f ${CONFIG_TMP} ${WORKING_DIRECTORY}/config/apiGateway.json && \
  chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/config/apiGateway.json && \
  chmod 660 ${WORKING_DIRECTORY}/config/apiGateway.json && \
  rm -f ${CONFIG_TMP} &>/dev/null
  RETVAL=$?
  [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
fi

doing "Validating API Gateway deployed config"
${WORKING_DIRECTORY}/bin/apigw audit -s CRITICAL -c ${WORKING_DIRECTORY}/config/apiGateway.json &>/dev/null
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