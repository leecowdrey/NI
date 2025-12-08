#!/bin/bash
#=====================================================================
# Network Insight (NI) - IAM Installer (keycloak)
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
alert "Identity and Access Management (IAM) Server"

# if existing ni.ini deployed use that
[[ -f "/etc/ni/ni.ini" ]] && ENV="/etc/ni/ni.ini"

# ensure root and have initial tools and config
[[ $(id -u) -ne 0 ]] && exit 1
[[ -f "${ENV}" ]] || exit 1
which curl &> /dev/null || apt install -y curl &>/dev/null
which yq &> /dev/null || apt install -y yq &>/dev/null
which openssl &> /dev/null || apt install -y openssl &>/dev/null
which java &> /dev/null || apt install -y default-jdk-headless &>/dev/null

ADMIN_USERNAME=$(grep -E "^IAM_BOOTSTRAP_ADMIN_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
ADMIN_PASSWORD=$(grep -E "^IAM_BOOTSTRAP_ADMIN_PASSWORD=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
ADDRESS=$(grep -E "^IAM_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
CONFIG_DIRECTORY=$(grep -E "^CONFIG_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
GROUP=$(grep -E "^HOST_SERVICE_GROUP=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
HOST_SERVICE=$(grep -E "^IAM_HOST_SERVICE_SYSTEMD=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
LOG_FILE=$(grep -E "^IAM_HOST_SERVICE_LOG_FILE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
PORT=$(grep -E "^IAM_PORT_HTTPS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_CERT=$(grep -E "^IAM_SSL_CERT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_CSR=$(grep -E "^IAM_SSL_CSR=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_DAYS=$(grep -E "^IAM_SSL_DAYS.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_KEY=$(grep -E "^IAM_SSL_KEY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SSL_SIZE=$(grep -E "^IAM_SSL_SIZE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
USERNAME=$(grep -E "^IAM_HOST_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
WORKING_DIRECTORY=$(grep -E "^IAM_WORKING_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
KEYCLOAK_VERSION=$(grep -E "^IAM_KEYCLOAK_VERSION=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)

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

doing "- KeyCloak installation"
which keycloak &> /dev/null
RETVAL=$?
if [[ ${RETVAL} -ne 0 ]] ; then
  [[ -f "/tmp/keycloak.tar.gz" ]] && rm -f /tmp/keycloak.tar.gz &>/dev/null
  curl --fail --location --progress-bar --output /tmp/keycloak.tar.gz \
     "https://github.com/keycloak/keycloak/releases/download/${KEYCLOAK_VERSION}/keycloak-${KEYCLOAK_VERSION}.tar.gz"
  RETVAL=$?
  if [[ ${RETVAL} -eq 0 ]] ; then
    tar zxf /tmp/keycloak.tar.gz -C ${WORKING_DIRECTORY}/ --strip-components=1 && \
    chown -R ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/* 
    RETVAL=$?
  fi
  [[ -f "/tmp/keycloak.tar.gz" ]] && rm -f /tmp/keycloak.tar.gz &>/dev/null
fi
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

doing "Adding keycloak data directory"
if [[ ! -d "${WORKING_DIRECTORY}/data" ]] ; then
  mkdir -p ${WORKING_DIRECTORY}/data && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/data
  RETVAL=$?
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding keycloak export directory"
if [[ ! -d "${WORKING_DIRECTORY}/export" ]] ; then
  mkdir -p ${WORKING_DIRECTORY}/export && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/export
  RETVAL=$?
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding keycloak certificates directory"
if [[ ! -d "${WORKING_DIRECTORY}/keys/certificates" ]] ; then
  mkdir -p ${WORKING_DIRECTORY}/keys/certificates && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/keys && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/keys/certificates
  RETVAL=$?
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

doing "Copying certificates to keycloak target"
cp -f ${CONFIG_DIRECTORY}/${SSL_KEY} ${WORKING_DIRECTORY}/keys/certificates && \
cp -f ${CONFIG_DIRECTORY}/${SSL_CERT} ${WORKING_DIRECTORY}/keys/certificates && \
chown ${USERNAME}:${PASSWORD} ${WORKING_DIRECTORY}/keys/certificates/${SSL_KEY} && \
chown ${USERNAME}:${PASSWORD} ${WORKING_DIRECTORY}/keys/certificates/${SSL_CERT}
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "- Updating KeyCloak package for target"
DB_PASSWORD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 14; echo)
sed -i -e "s|#db-username=.*|db-username=${USERNAME}|" ${WORKING_DIRECTORY}/conf/keycloak.conf && \
sed -i -e "s|#db-password=.*|db-password=${DB_PASSWORD}|" ${WORKING_DIRECTORY}/conf/keycloak.conf && \
sed -i -e "s|#https-certificate-file=.*|https-certificate-file=${WORKING_DIRECTORY}/keys/certificates/${SSL_CERT}|" ${WORKING_DIRECTORY}/conf/keycloak.conf && \
sed -i -e "s|#https-certificate-key-file=.*|https-certificate-key-file=${WORKING_DIRECTORY}/keys/certificates/${SSL_KEY}|" ${WORKING_DIRECTORY}/conf/keycloak.conf && \
sed -i -e "s|#hostname=.*|hostname=${ADDRESS}\nhttps-port=${PORT}|" ${WORKING_DIRECTORY}/conf/keycloak.conf && \
chown -R ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/conf/keycloak.conf
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "- Updating KeyCloak initial admin credentials"
su --shell /bin/bash - -c "cd ${WORKING_DIRECTORY} && export KC_PASSWORD=\"${ADMIN_PASSWORD}\" && bin/kc.sh bootstrap-admin user --username ${ADMIN_USERNAME} --password:env KC_PASSWORD" ${USERNAME} &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "- Building initial KeyCloak image"
su --shell /bin/bash - -c "cd ${WORKING_DIRECTORY} && bin/kc.sh build" ${USERNAME} &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "- Fetching KeyCloak configuration"
su --shell /bin/bash - -c "cd ${WORKING_DIRECTORY} && bin/kc.sh show-config" ${USERNAME}
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "- Copying NI base realm"
cp -f NI-realm.json ${WORKING_DIRECTORY}/export/ && \
cp -f NI-users-0.json ${WORKING_DIRECTORY}/export/ && \
chown ${USERNAME}:${PASSWORD} ${WORKING_DIRECTORY}/export/NI-realm.json && \
chown ${USERNAME}:${PASSWORD} ${WORKING_DIRECTORY}/export/NI-users-0.json
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "- Importing NI base realm"
# generated previously using `bin/kc.sh export --dir=export/ --realm=NI --optimized`
su --shell /bin/bash - -c "cd ${WORKING_DIRECTORY} && bin/kc.sh import --dir ${WORKING_DIRECTORY}/export --override false" ${USERNAME}
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