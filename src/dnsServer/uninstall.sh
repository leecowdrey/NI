#!/bin/bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - DNS Server Uninstaller
#
# Corporate Headquarters:
# Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
# https://www.merkator.com/
#
# © 2024-2025 Merkator nv/sa. All rights reserved.
#=====================================================================
RETVAL=0
CLI_PATH=$(dirname -- "$( readlink -f -- "$0"; )";)
CLI_NAME="${0##*/}"
ENV="/etc/mni/mni.ini"
COMMON="${CLI_PATH}/common.sh"
source ${COMMON}
alert "MNI DNS Server"

[[ $(id -u) -ne 0 ]] && exit 1
[[ -f "${ENV}" ]] || exit 1

CONFIG_DIRECTORY=$(grep -E "^CONFIG_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
GROUP=$(grep -E "^HOST_SERVICE_GROUP=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
HOST_SERVICE=$(grep -E "^DNSSERV_HOST_SERVICE_SYSTEMD=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
LOG_FILE=$(grep -E "^DNSSERV_HOST_SERVICE_LOG_FILE=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
USERNAME=$(grep -E "^DNSSERV_HOST_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
WORKING_DIRECTORY=$(grep -E "^DNSSERV_WORKING_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SYSTEMD_RESOLVE=$(grep -E "^DNSSERV_SYSTEMD_RESOLVE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
RESOLVCONF=$(grep -E "^DNSSERV_RESOLVCONF=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)

doing "Removing systemD service"
systemctl stop ${HOST_SERVICE} &>/dev/null && \
systemctl disable ${HOST_SERVICE} &>/dev/null && \
rm -f /etc/systemd/system/${HOST_SERVICE} && \
systemctl daemon-reload &>/dev/null && \
[[ -f "${LOG_FILE}" ]] && rm -f ${LOG_FILE} &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || info "- fail"

doing "Restoring DNS resolve"
if [[ "${WORKING_DIRECTORY}/config/resolv.conf" ]] ; then
 if [[ ${SYSTEMD_RESOLVE} -eq 0 ]] ; then
   [[ -f "/etc/resolv.conf" ]] && rm -f /etc/resolv.conf &>/dev/null
   ln -sf /etc/systemd/resolv.conf.d/dns_servers.conf /etc/resolv.conf
   systemctl enable --now systemd-resolved && \
   systemctl start systemd-resolved && \
   cat ${WORKING_DIRECTORY}/config/resolv.conf > /etc/resolv.conf
   RETVAL=$?
 elif [[ ${RESOLVCONF} -eq 0 ]] ; then
   [[ -f "/etc/resolv.conf" ]] && rm -f /etc/resolv.conf &>/dev/null
   cp ${WORKING_DIRECTORY}/config/resolv.conf /etc/resolv.conf && \
   chmod 644 /etc/resolv.conf && \
   chown root:root /etc/resolv.conf
   RETVAL=$?
 fi
else
 RETVAL=0
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Removing working directory"
[[ -d "${WORKING_DIRECTORY}" ]] && rm -R -f ${WORKING_DIRECTORY} &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || info "- fail"

doing "Removing user account"
getent passwd ${USERNAME}|grep -i ${USERNAME} &>/dev/null
RETVAL=$?
if [[ ${RETVAL} -eq 0 ]] ; then
  userdel --remove ${USERNAME} &> /dev/null
  RETVAL=$?
else
  RETVAL=0
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || info "- fail"

# tidy
clean_tmp_files

[[ ${RETVAL} -eq 0 ]] && success "- completed" || info "- fail"

exit ${RETVAL}