#!/bin/bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - IAM Installer (authentik)
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
alert "Identity and Access Management (IAM) Server"

# if existing mni.ini deployed use that
[[ -f "/etc/mni/mni.ini" ]] && ENV="/etc/mni/mni.ini"

# ensure root and have initial tools and config
[[ $(id -u) -ne 0 ]] && exit 1
[[ -f "${ENV}" ]] || exit 1
which curl &> /dev/null || apt install -y curl &>/dev/null
which yq &> /dev/null || apt install -y yq &>/dev/null
which docker --version > /dev/null || apt install -y docker &>/dev/null
which docker-compose &> /dev/null || apt install -y docker-compose &>/dev/null

ADDRESS=$(grep -E "^IAM_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
BOOTSTRAP_PASSWORD=$(grep -E "^IAM_BOOTSTRAP_PASSWORD=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
BOOTSTRAP_TOKEN=$(grep -E "^IAM_BOOTSTRAP_TOKEN=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
BOOTSTRAP_EMAIL=$(grep -E "^IAM_BOOTSTRAP_EMAIL=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
CONFIG_DIRECTORY=$(grep -E "^CONFIG_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
EMAIL_FROM=$(grep -E "^IAM_EMAIL_FROM=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
EMAIL_HOST=$(grep -E "^IAM_EMAIL_HOST=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
EMAIL_PASSWORD=$(grep -E "^IAM_EMAIL_PASSWORD=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
EMAIL_PORT=$(grep -E "^IAM_EMAIL_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
EMAIL_TIMEOUT=$(grep -E "^IAM_EMAIL_TIMEOUT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
EMAIL_USE_SSL=$(grep -E "^IAM_EMAIL_USE_SSL=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
EMAIL_USE_TLS=$(grep -E "^IAM_EMAIL_USE_TLS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
EMAIL_USERNAME=$(grep -E "^IAM_EMAIL_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
HOST=$(grep -E "^DNSSERV_HOST=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
DOMAIN=$(grep -E "^DNSSERV_DOMAIN=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
GROUP=$(grep -E "^HOST_SERVICE_GROUP=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
HOST_SERVICE=$(grep -E "^IAM_HOST_SERVICE_SYSTEMD=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
LOG_FILE=$(grep -E "^IAM_HOST_SERVICE_LOG_FILE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
PORT_HTTP=$(grep -E "^IAM_PORT_HTTP=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
PORT_HTTPS=$(grep -E "^IAM_PORT_HTTPS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_CERT=$(grep -E "^IAM_SSL_CERT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_CSR=$(grep -E "^IAM_SSL_CSR=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_DAYS=$(grep -E "^IAM_SSL_DAYS.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_KEY=$(grep -E "^IAM_SSL_KEY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_SIZE=$(grep -E "^IAM_SSL_SIZE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
USERNAME=$(grep -E "^IAM_HOST_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
WORKING_DIRECTORY=$(grep -E "^IAM_WORKING_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)

#INSTALL_TMP=$(mktemp -q -p /tmp mni.XXXXXXXX)

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

doing "Adding user account (granting docker group access)"
useradd --home-dir ${WORKING_DIRECTORY} --shell /usr/sbin/nologin -g ${GROUP} ${USERNAME} &>/dev/null && \
usermod -aG docker ${USERNAME} &>/dev/null && \
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

doing "Adding Authentik additional directories for volume mapping"
[[ -d "${WORKING_DIRECTORY}/certs" ]] || (mkdir -p ${WORKING_DIRECTORY}/certs)
[[ -d "${WORKING_DIRECTORY}/media" ]] || (mkdir -p ${WORKING_DIRECTORY}/media)
[[ -d "${WORKING_DIRECTORY}/media/public" ]] || (mkdir -p ${WORKING_DIRECTORY}/media/public)
[[ -d "${WORKING_DIRECTORY}/custom-templates" ]] || (mkdir -p ${WORKING_DIRECTORY}/custom-templates)
[[ -d "${WORKING_DIRECTORY}/postgresql" ]] || (mkdir -p ${WORKING_DIRECTORY}/postgresql)
[[ -d "${WORKING_DIRECTORY}/redis" ]] || (mkdir -p ${WORKING_DIRECTORY}/redis)
RETVAL=$?
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
chown root:${GROUP} ${MNI_LOG_DIRECTORY} && chmod 770 ${MNI_LOG_DIRECTORY} && \
chown root:${GROUP} ${CONFIG_DIRECTORY} && chmod 770 ${CONFIG_DIRECTORY} && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/certs && chmod 770 ${WORKING_DIRECTORY}/certs && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/media && chmod 770 ${WORKING_DIRECTORY}/media && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/media/public && chmod 770 ${WORKING_DIRECTORY}/media/public && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/postgresql && chmod 770 ${WORKING_DIRECTORY}/postgresql && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/redis && chmod 770 ${WORKING_DIRECTORY}/redis && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/custom-templates && chmod 770 ${WORKING_DIRECTORY}/custom-templates
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Checking/Updating for valid address binding"
if [[ -z "${ADDRESS}" ]] ; then
  ADDRESS=$(ip route get $(ip route show 0.0.0.0/0 | grep -oP 'via \K\S+') | grep -oP 'src \K\S+')
  sed -i -e "s|IAM_ADDRESS=.*|IAM_ADDRESS=\"${ADDRESS}\"|" ${CONFIG_DIRECTORY}/mni.ini 
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

doing "Linking SSL certificate to deployment"
[[ -f "${CONFIG_DIRECTORY}/${SSL_KEY}" ]] && ln -s ${CONFIG_DIRECTORY}/${SSL_KEY} ${WORKING_DIRECTORY}/certs/${SSL_KEY} &>/dev/null
[[ -f "${CONFIG_DIRECTORY}/${SSL_CSR}" ]] && ln -s ${CONFIG_DIRECTORY}/${SSL_CSR} ${WORKING_DIRECTORY}/certs/${SSL_CSR} &>/dev/null
[[ -f "${CONFIG_DIRECTORY}/${SSL_CERT}" ]] && ln -s ${CONFIG_DIRECTORY}/${SSL_CERT} ${WORKING_DIRECTORY}/certs/${SSL_CERT} &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Generating Authentik .env"
[[ -f "${WORKING_DIRECTORY}/.env" ]] && rm -f ${WORKING_DIRECTORY}/.env &>/dev/null
PG_PASS=$(openssl rand -base64 36 | tr -d '\n') && \
AUTHENTIK_SECRET_KEY=$(openssl rand -base64 60 | tr -d '\n') && \
sed -i -e "s|IAM_PG_PASS=.*|IAM_PG_PASS=\"${PG_PASS}\"|" ${CONFIG_DIRECTORY}/mni.ini && \
sed -i -e "s|IAM_AUTHENTIK_SECRET_KEY=.*|IAM_AUTHENTIK_SECRET_KEY=\"${AUTHENTIK_SECRET_KEY}\"|" ${CONFIG_DIRECTORY}/mni.ini && \
echo "COMPOSE_PORT_HTTP=${PORT_HTTP}" >> ${WORKING_DIRECTORY}/.env && \
echo "COMPOSE_PORT_HTTPS=${PORT_HTTPS}" >> ${WORKING_DIRECTORY}/.env && \
#echo "EMAIL_HOST=${EMAIL_HOST,,}" >> ${WORKING_DIRECTORY}/.env && \
#echo "EMAIL_PORT=${EMAIL_PORT}" >> ${WORKING_DIRECTORY}/.env && \
#echo "EMAIL_USERNAME=${EMAIL_USERNAME}" >> ${WORKING_DIRECTORY}/.env && \
#echo "EMAIL_PASSWORD=${EMAIL_PASSWORD}" >> ${WORKING_DIRECTORY}/.env && \
#echo "EMAIL_USE_TLS=${EMAIL_USE_TLS,,}" >> ${WORKING_DIRECTORY}/.env && \
#echo "EMAIL_USE_SSL=${EMAIL_USE_SSL,,}" >> ${WORKING_DIRECTORY}/.env && \
#echo "EMAIL_TIMEOUT=${EMAIL_TIMEOUT}" >> ${WORKING_DIRECTORY}/.env && \
#echo "EMAIL_FROM=${EMAIL_FROM}" >> ${WORKING_DIRECTORY}/.env && \
##echo "PG_USER=merkator" >> ${WORKING_DIRECTORY}/.env && \
echo "PG_PASS=${PG_PASS}" >> ${WORKING_DIRECTORY}/.env && \
echo "AUTHENTIK_SECRET_KEY=${AUTHENTIK_SECRET_KEY}" >> ${WORKING_DIRECTORY}/.env && \
echo "AUTHENTIK_DISABLE_STARTUP_ANALYTICS=true" >> ${WORKING_DIRECTORY}/.env && \
echo "AUTHENTIK_DISABLE_UPDATE_CHECK=true" >> ${WORKING_DIRECTORY}/.env && \
echo "AUTHENTIK_ERROR_REPORTING__ENABLED=false" >> ${WORKING_DIRECTORY}/.env && \
#echo "AUTHENTIK_TAG=2025.2.1" >> ${WORKING_DIRECTORY}/.env && \
echo "AUTHENTIK_IMAGE=ghcr.io/goauthentik/server" >> ${WORKING_DIRECTORY}/.env && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/.env && \
chmod 660 ${WORKING_DIRECTORY}/.env
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

#doing "Updating Authentik .env for bootstrap"
#BOOTSTRAP_TOKEN=$(openssl rand -base64 36 | tr -d '\n') && \
#sed -i -e "s|IAM_BOOTSTRAP_TOKEN=.*|IAM_BOOTSTRAP_TOKEN=\"${BOOTSTRAP_TOKEN}\"|" ${CONFIG_DIRECTORY}/mni.ini && \
#echo "AUTHENTIK_BOOTSTRAP_PASSWORD=${BOOTSTRAP_PASSWORD}" >> ${WORKING_DIRECTORY}/.env && \
#echo "AUTHENTIK_BOOTSTRAP_TOKEN=${BOOTSTRAP_TOKEN}" >> ${WORKING_DIRECTORY}/.env && \
#echo "AUTHENTIK_BOOTSTRAP_EMAIL=${BOOTSTRAP_EMAIL}" >> ${WORKING_DIRECTORY}/.env && \
#chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/.env && \
#chmod 660 ${WORKING_DIRECTORY}/.env
#RETVAL=$?
#[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Retrieving Authentik compose file"
[[ -f "${WORKING_DIRECTORY}/docker-compose.yml" ]] && rm -f ${WORKING_DIRECTORY}/docker-compose.yml &>/dev/null
  curl --fail --location --output ${WORKING_DIRECTORY}/docker-compose.yml \
     "https://goauthentik.io/docker-compose.yml" &>/dev/null
  RETVAL=$?
  if [[ ${RETVAL} -eq 0 ]] ; then
    chown -R ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/docker-compose.yml
    RETVAL=$?
  fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Updating Authentik docker compose definition"
if [[ -f "${WORKING_DIRECTORY}/docker-compose.yml" ]] ; then
  USER_ID=$(id -u ${USERNAME})
  GROUP_ID=$(id -g ${USERNAME})
  yq --exit-status -i -y ".services.postgresql.user += \"${USER_ID}:${GROUP_ID}\"" ${WORKING_DIRECTORY}/docker-compose.yml && \
  yq --exit-status -i -y ".services.redis.user += \"${USER_ID}:${GROUP_ID}\"" ${WORKING_DIRECTORY}/docker-compose.yml && \
  yq --exit-status -i -y ".services.server.user += \"${USER_ID}:${GROUP_ID}\"" ${WORKING_DIRECTORY}/docker-compose.yml && \
 # yq --exit-status -i -y "del(.services.worker.user)" ${WORKING_DIRECTORY}/docker-compose.yml && \
  yq --exit-status -i -y ".services.worker.user = \"${USER_ID}:${GROUP_ID}\"" ${WORKING_DIRECTORY}/docker-compose.yml && \
  yq --exit-status -i -y ".services.postgresql.healthcheck.interval = \"60s\"" ${WORKING_DIRECTORY}/docker-compose.yml && \
  yq --exit-status -i -y ".services.postgresql.healthcheck.timeout = \"30s\"" ${WORKING_DIRECTORY}/docker-compose.yml && \
  yq --exit-status -i -y ".services.redis.healthcheck.interval = \"60s\"" ${WORKING_DIRECTORY}/docker-compose.yml && \
  yq --exit-status -i -y ".services.redis.healthcheck.timeout = \"30s\"" ${WORKING_DIRECTORY}/docker-compose.yml && \
  yq --exit-status -i -y "del(.volumes)" ${WORKING_DIRECTORY}/docker-compose.yml && \
  sed -i -e "s|- database:|- ${WORKING_DIRECTORY}/postgresql:|" ${WORKING_DIRECTORY}/docker-compose.yml && \
  sed -i -e "s|- redis:|- ${WORKING_DIRECTORY}/redis:|" ${WORKING_DIRECTORY}/docker-compose.yml && \
  sed -i -e "s|- ./certs:|- ${WORKING_DIRECTORY}/certs:|" ${WORKING_DIRECTORY}/docker-compose.yml && \
  sed -i -e "s|- ./media:|- ${WORKING_DIRECTORY}/media:|" ${WORKING_DIRECTORY}/docker-compose.yml && \
  sed -i -e "s|- ./custom-templates:|- ${WORKING_DIRECTORY}/custom-templates:|" ${WORKING_DIRECTORY}/docker-compose.yml 
  RETVAL=$?
else
  RETVAL=0
fi
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Pulling Authentik Docker images"
su --shell /bin/bash - -c "cd ${WORKING_DIRECTORY} && docker-compose pull" ${USERNAME}
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Composing Authentik Docker images"
su --shell /bin/bash - -c "cd ${WORKING_DIRECTORY} && docker-compose up --detach" ${USERNAME}
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

#docker logs --tail 50 --follow --timestamps iamserver_postgresql_1
#docker logs --tail 50 --follow --timestamps iamserver_redis_1
#docker logs --tail 50 --follow --timestamps iamserver_server_1
#docker logs --tail 50 --follow --timestamps iamserver_worker_1

# tidy
clean_tmp_files

[[ ${RETVAL} -eq 0 ]] && success "- completed" || error "- fail"

exit ${RETVAL}