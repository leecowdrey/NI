#!/bin/bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - Alert Server Uninstaller
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
alert "MNI Fetch Server Uninstall"

[[ $(id -u) -ne 0 ]] && exit 1
[[ -f "${ENV}" ]] || exit 1
which npm &> /dev/null || exit 1

CONFIG_DIRECTORY=$(grep -E "^CONFIG_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
GROUP=$(grep -E "^HOST_SERVICE_GROUP=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
HOST_SERVICE=$(grep -E "^FETCHSRV_HOST_SERVICE_SYSTEMD=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
LOG_FILE=$(grep -E "^FETCHSRV_HOST_SERVICE_LOG_FILE=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
USERNAME=$(grep -E "^FETCHSRV_HOST_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
WORKING_DIRECTORY=$(grep -E "^FETCHSRV_WORKING_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
CVE_DIRECTORY=$(grep -E "^FETCHSRV_CVE_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)

#UNINSTALL_TMP=$(mktemp -q -p /tmp mni.XXXXXXXX)

doing "Removing systemD service"
systemctl stop ${HOST_SERVICE} &>/dev/null && \
systemctl disable ${HOST_SERVICE} &>/dev/null && \
rm -f /etc/systemd/system/${HOST_SERVICE} && \
systemctl daemon-reload &>/dev/null && \
[[ -f "${LOG_FILE}" ]] && rm -f ${LOG_FILE} &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || info "- fail"

doing "Removing NodeJS libraries"
su --shell /bin/bash -l - -c "cd ${WORKING_DIRECTORY} && npm uninstall \$(ls -1 node_modules | tr '/\n' ' ')" ${USERNAME} &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || info "- fail"

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

if [[ -d "${CVE_DIRECTORY}" ]] ; then
 doing "Remoing CVE List V5 repository"
 rm -R -f ${CVE_DIRECTORY} &>/dev/null
 RETVAL=$?
 [[ ${RETVAL} -eq 0 ]] && success "- ok" || info "- fail"
fi

# tidy
clean_tmp_files

[[ ${RETVAL} -eq 0 ]] && success "- completed" || info "- fail"

exit ${RETVAL}