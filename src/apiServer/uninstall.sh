#!/bin/bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - API Server Uninstaller
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
alert "MNI API Server Uninstall"

[[ $(id -u) -ne 0 ]] && exit 1
[[ -f "${ENV}" ]] || exit 1
which npm &> /dev/null || exit 1

BACKUP_DIRECTORY=$(grep -E "^APISERV_BACKUP_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
CONFIG_DIRECTORY=$(grep -E "^CONFIG_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
DB_FILE=$(grep -E "^APISERV_DUCKDB_FILE=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
GROUP=$(grep -E "^HOST_SERVICE_GROUP=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
HOST_SERVICE=$(grep -E "^APISERV_HOST_SERVICE_SYSTEMD=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
LOG_FILE=$(grep -E "^APISERV_HOST_SERVICE_LOG_FILE=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
PORT=$(grep -E "^APISERV_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
USERNAME=$(grep -E "^APISERV_HOST_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)
WORKING_DIRECTORY=$(grep -E "^APISERV_WORKING_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d'"' -f2)

#UNINSTALL_TMP=$(mktemp -q -p /tmp apiServer.XXXXXXXX)

doing "Removing systemD service"
systemctl stop ${HOST_SERVICE} &>/dev/null && \
systemctl disable ${HOST_SERVICE} &>/dev/null && \
rm -f /etc/systemd/system/${HOST_SERVICE} && \
systemctl daemon-reload &>/dev/null && \
[[ -f "${LOG_FILE}" ]] && rm -f ${LOG_FILE} &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || info "- fail"

doing "Removing DuckDB database file"
[[ $(dirname ${DB_FILE}) == "." ]] && DB_FILE="${WORKING_DIRECTORY}/${DB_FILE}"
if [[ -f "${DB_FILE}" ]] ; then
  rm -f ${DB_FILE} &>/dev/null
  RETVAL=$?
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || info "- fail"

doing "Removing DuckDB database file"
which duckdb &> /dev/null
RETVAL=$?
if [[ ${RETVAL} -eq 0 ]] ; then
 rm -f /usr/local/bin/duckdb &>/dev/null
 RETVAL=$?
else
 RETVAL=0
fi
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

# tidy
clean_tmp_files

[[ ${RETVAL} -eq 0 ]] && success "- completed" || info "- fail"

exit ${RETVAL}