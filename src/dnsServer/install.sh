#!/bin/bash
#=====================================================================
# Network Insight (NI) - DNS Server Installer
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
alert "NI DNS Server"

# if existing ni.ini deployed use that
[[ -f "/etc/ni/ni.ini" ]] && ENV="/etc/ni/ni.ini"

# ensure root and have initial tools and config
[[ $(id -u) -ne 0 ]] && exit 1
[[ -f "${ENV}" ]] || exit 1
which curl &>/dev/null || apt install -y curl &>/dev/null
which make &>/dev/null || apt install -y make &>/dev/null
which cc &>/dev/null || apt install -y gcc &>/dev/null
which dig &>/dev/null || apt install -y dnsutils &>/dev/null

INSTALL=$(grep -E "^DNSSERV_INSTALL=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
[[ "${INSTALL,,}" == "true" ]] || exit 0
 
DNSSERV_VERSION=$(grep -E "^DNSSERV_VERSION=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
ADDRESS=$(grep -E "^DNSSERV_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
USERNAME=$(grep -E "^DNSSERV_HOST_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
GROUP=$(grep -E "^HOST_SERVICE_GROUP=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
HOST=$(grep -E "^DNSSERV_HOST=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
DOMAIN=$(grep -E "^DNSSERV_DOMAIN=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
CONFIG_DIRECTORY=$(grep -E "^CONFIG_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
WORKING_DIRECTORY=$(grep -E "^DNSSERV_WORKING_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
PORT=$(grep -E "^DNSSERV_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
LOG_FILE=$(grep -E "^DNSSERV_HOST_SERVICE_LOG_FILE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
HOST_SERVICE=$(grep -E "^DNSSERV_HOST_SERVICE_SYSTEMD=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
CONFIG_DIRECTORY=$(grep -E "^CONFIG_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SERVICE_USERNAME=$(grep -E "^APISERV_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SERVICE_KEY=$(grep -E "^APISERV_SERVICE_KEY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APIGW_ADDRESS=$(grep -E "^APIGW_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APIGW_PORT=$(grep -E "^APIGW_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APISERV_ADDRESS=$(grep -E "^APISERV_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APISERV_PORT=$(grep -E "^APISERV_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
IAM_ADDRESS=$(grep -E "^IAM_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
IAM_PORT_HTTPS=$(grep -E "^IAM_PORT_HTTPS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)

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

doing "Adding DNS binary directory"
[[ -d "${WORKING_DIRECTORY}/bin" ]] || (mkdir -p ${WORKING_DIRECTORY}/bin)
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding DNS config directory"
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

doing "Checking/Updating for valid address binding - DNS Server"
if [[ -z "${ADDRESS}" ]] ; then
  ADDRESS=$(ip route get $(ip route show 0.0.0.0/0 | grep -oP 'via \K\S+') | grep -oP 'src \K\S+')
  sed -i -e "s|DNSSERV_ADDRESS=.*|DNSSERV_ADDRESS=\"${ADDRESS}\"|" ${CONFIG_DIRECTORY}/ni.ini 
  RETVAL=$?
else
  [[ "${ADDRESS,,}" == "localhost" ]] && ADDRESS="127.0.0.1"
  RETVAL=0
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Checking/Updating for valid address binding - API Gateway"
if [[ -z "${APIGW_ADDRESS}" || "${APIGW_ADDRESS}" == "0.0.0.0" ]] ; then
  APIGW_ADDRESS=$(ip route get $(ip route show 0.0.0.0/0 | grep -oP 'via \K\S+') | grep -oP 'src \K\S+')
  sed -i -e "s|APIGW_ADDRESS=.*|APIGW_ADDRESS=\"${APIGW_ADDRESS}\"|" ${CONFIG_DIRECTORY}/ni.ini 
  RETVAL=$?
else
  [[ "${APIGW_ADDRESS,,}" == "localhost" ]] && APIGW_ADDRESS="127.0.0.1"
  RETVAL=0
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Checking/Updating for valid address binding - API Server"
if [[ -z "${IAM_ADDRESS}" || "${IAM_ADDRESS}" == "0.0.0.0" ]] ; then
  IAM_ADDRESS=$(ip route get $(ip route show 0.0.0.0/0 | grep -oP 'via \K\S+') | grep -oP 'src \K\S+')
  sed -i -e "s|IAM_ADDRESS=.*|IAM_ADDRESS=\"${IAM_ADDRESS}\"|" ${CONFIG_DIRECTORY}/ni.ini 
  RETVAL=$?
else
  [[ "${IAM_ADDRESS,,}" == "localhost" ]] && IAM_ADDRESS="127.0.0.1"
  RETVAL=0
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Checking/Updating for valid address binding - Identity and Access Management"
if [[ -z "${APISERV_ADDRESS}" || "${APISERV_ADDRESS}" == "0.0.0.0" ]] ; then
  APISERV_ADDRESS=$(ip route get $(ip route show 0.0.0.0/0 | grep -oP 'via \K\S+') | grep -oP 'src \K\S+')
  sed -i -e "s|APISERV_ADDRESS=.*|APISERV_ADDRESS=\"${APISERV_ADDRESS}\"|" ${CONFIG_DIRECTORY}/ni.ini 
  RETVAL=$?
else
  [[ "${APISERV_ADDRESS,,}" == "localhost" ]] && APISERV_ADDRESS="127.0.0.1"
  RETVAL=0
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Checking/Updating for valid hostname"
if [[ -z "${HOST}" ]] ; then
  HOST=$(hostname --short)
  sed -i -e "s|DNSSERV_HOST=.*|DNSSERV_HOST=\"${HOST}\"|" ${CONFIG_DIRECTORY}/ni.ini 
  RETVAL=$?
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "dnsServe (dnsmasq) installation"
# disable existing dnsmasq if deployed
which dnsmasq &>/dev/null
RETVAL=$?
if [[ ${RETVAL} -eq 0 ]] ; then
  systemctl stop dnsmasq &>/dev/null
  systemctl disable dnsmasq &>/dev/null
  systemctl daemon-reload &>/dev/null
fi
[[ -f "/tmp/dnsmasq.tar.gz" ]] && rm -f /tmp/dnsmasq.tar.gz &>/dev/null
curl --fail --location --output /tmp/dnsmasq.tar.gz \
    "https://thekelleys.org.uk/dnsmasq/dnsmasq-${DNSSERV_VERSION}.tar.gz" &>/dev/null
RETVAL=$?
if [[ ${RETVAL} -eq 0 ]] ; then
  [[ -d "/tmp/dnsmasq" ]] && rm -R -f /tmp/dnsmasq &>/dev/null
  mkdir -p /tmp/dnsmasq &>/dev/null
  tar --strip-components=1 -C /tmp/dnsmasq -zxvf /tmp/dnsmasq.tar.gz &>/dev/null && \
  pushd /tmp/dnsmasq &>/dev/null && \
  make &>/dev/null && \
  cp src/dnsmasq ${WORKING_DIRECTORY}/bin/dnsserv && \
  chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/bin/dnsserv && \
  chmod 770 ${WORKING_DIRECTORY}/bin/dnsserv && \
  RETVAL=$?
  popd &>/dev/null
  [[ -d "/tmp/dnsmasq" ]] && rm -R -f /tmp/dnsmasq &>/dev/null
fi
[[ -f "/tmp/dnsmasq.tar.gz" ]] && rm -f /tmp/dnsmasq.tar.gz &>/dev/null
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Update existing host DNS resolve"
cp -f /etc/resolv.conf ${WORKING_DIRECTORY}/config/resolv.conf &>/dev/null
if [[ "/etc/resolv.conf" ]] ; then
 systemctl is-enabled systemd-resolved &>/dev/null
 SYSTEMD_RESOLVE=$?
 which resolvconf &>/dev/null
 RESOLVCONF=$?
 sed -i -e "s|DNSSERV_SYSTEMD_RESOLVE=.*|DNSSERV_SYSTEMD_RESOLVE=${SYSTEMD_RESOLVE}|" ${CONFIG_DIRECTORY}/ni.ini 
 sed -i -e "s|DNSSERV_RESOLVCONF=.*|DNSSERV_RESOLVCONF=${RESOLVCONF}|" ${CONFIG_DIRECTORY}/ni.ini 
 if [[ ${SYSTEMD_RESOLVE} -eq 0 ]] ; then
  systemctl disable --now systemd-resolved && \
  systemctl stop systemd-resolved && \
  unlink /etc/resolv.conf
  RETVAL=$?
 fi
 if [[ ${RETVAL} -eq 0 ]] ; then
  cat > /etc/resolv.conf <<EOF
# generated by NI
nameserver 127.0.0.1
EOF
  chmod 644 /etc/resolv.conf && \
  chown root:root /etc/resolv.conf
  RETVAL=$?
 fi
else
 RETVAL=0
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Copying DNS Server config"
cp -f ${CLI_PATH}/dnsServer.conf ${WORKING_DIRECTORY}/config/ && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/config/dnsServer.conf && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/config/dnsServer.conf && \
chmod 660 ${WORKING_DIRECTORY}/config/dnsServer.conf
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Updating DNS Server deployed config"
sed -i -e "s|user=dnssrv|user=${USERNAME}|g" ${WORKING_DIRECTORY}/config/dnsServer.conf && \
sed -i -e "s|group=NI|group=${GROUP}|g" ${WORKING_DIRECTORY}/config/dnsServer.conf && \
sed -i -e "s|port=53|port=${PORT}|g" ${WORKING_DIRECTORY}/config/dnsServer.conf && \
sed -i -e "s|listen-address=0.0.0.0|listen-address=${ADDRESS}|g" ${WORKING_DIRECTORY}/config/dnsServer.conf && \
sed -i -e "s|address=/gateway.ni.cowdrey.local/0.0.0.0|address=/gateway.ni.cowdrey.local/${APIGW_ADDRESS}|g" ${WORKING_DIRECTORY}/config/dnsServer.conf && \
sed -i -e "s|srv-host=_https._tcp.gateway.ni.cowdrey.local,gateway.ni.cowdrey.local,8443,1|srv-host=_https._tcp.gateway.ni.cowdrey.local,gateway.ni.cowdrey.local,${APIGW_PORT},1|g" ${WORKING_DIRECTORY}/config/dnsServer.conf && \
sed -i -e "s|address=/apiserver.ni.cowdrey.local/0.0.0.0|address=/apiserver.ni.cowdrey.local/${APISERV_ADDRESS}|g" ${WORKING_DIRECTORY}/config/dnsServer.conf && \
sed -i -e "s|srv-host=_https._tcp.apiserver.ni.cowdrey.local,apiserver.ni.cowdrey.local,7443,1|srv-host=_https._tcp.apiserver.ni.cowdrey.local,apiserver.ni.cowdrey.local,${APISERV_PORT},1|g" ${WORKING_DIRECTORY}/config/dnsServer.conf && \
sed -i -e "s|address=/iam.ni.cowdrey.local/0.0.0.0|address=/iam.ni.cowdrey.local/${IAM_ADDRESS}|g" ${WORKING_DIRECTORY}/config/dnsServer.conf && \
sed -i -e "s|srv-host=_https._tcp.iam.ni.cowdrey.local,iam.ni.cowdrey.local,6443,1|srv-host=_https._tcp.iam.ni.cowdrey.local,iam.ni.cowdrey.local,${IAM_PORT},1|g" ${WORKING_DIRECTORY}/config/dnsServer.conf && \
sed -i -e "s|NI.cowdrey.local|${HOST,,}.${DOMAIN,,}|g" ${WORKING_DIRECTORY}/config/dnsServer.conf && \
grep -E "^nameserver" ${WORKING_DIRECTORY}/config/resolv.conf|sed -e "s|nameserver |server=|g" >> ${WORKING_DIRECTORY}/config/dnsServer.conf

RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Validating DNS Server deployed config"
${WORKING_DIRECTORY}/bin/dnsserv --test --conf-file=${WORKING_DIRECTORY}/config/dnsServer.conf &>/dev/null
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

doing "Verify DNS resolve"
dig @127.0.0.1 +short _https._tcp.apiserver.${HOST,,}.${DOMAIN,,} SRV &>/dev/null && \
dig @127.0.0.1 +short apiserver.${HOST,,}.${DOMAIN,,} A &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

# tidy
clean_tmp_files

[[ ${RETVAL} -eq 0 ]] && success "- completed" || error "- fail"

exit ${RETVAL}