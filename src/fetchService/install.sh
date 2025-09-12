#!/bin/bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - Alert Server Installer
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
alert "MNI Fetch Server Install"

# if existing mni.ini deployed use that
[[ -f "/etc/mni/mni.ini" ]] && ENV="/etc/mni/mni.ini"

# ensure root and have initial tools and config
[[ $(id -u) -ne 0 ]] && exit 1
[[ -f "${ENV}" ]] || exit 1
which curl &> /dev/null || apt install -y curl &>/dev/null
which node &> /dev/null || (curl -fsSL https://deb.nodesource.com/setup_24.x -o nodesource_setup.sh && bash nodesource_setup.sh && apt update && apt install -y nodejs)
which npm &> /dev/null || exit 1

CONFIG_DIRECTORY=$(grep -E "^CONFIG_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
GROUP=$(grep -E "^HOST_SERVICE_GROUP=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
HOST_SERVICE=$(grep -E "^FETCHSRV_HOST_SERVICE_SYSTEMD=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
LOG_FILE=$(grep -E "^FETCHSRV_HOST_SERVICE_LOG_FILE=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
USERNAME=$(grep -E "^FETCHSRV_HOST_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
WORKING_DIRECTORY=$(grep -E "^FETCHSRV_WORKING_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
CVE_SCAN=$(grep -E "^FETCHSRV_CVE_SCAN=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
CVE_DIRECTORY=$(grep -E "^FETCHSRV_CVE_DIRECTORY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SERVICE_USERNAME=$(grep -E "^FETCHSRV_SERVICE_USERNAME=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
SERVICE_KEY=$(grep -E "^FETCHSRV_SERVICE_KEY=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)

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

if [[ -z "${SERVICE_USERNAME}" ]] ; then
  doing "Generating service credential - username"
  SERVICE_USERNAME=$(openssl rand -hex 24 | tr -d '\n'| tr -d '"' | tr -d '|') && \
  sed -i -e "s|FETCHSRV_SERVICE_USERNAME=.*|FETCHSRV_SERVICE_USERNAME=\"${SERVICE_USERNAME}\"|" ${CONFIG_DIRECTORY}/mni.ini
  RETVAL=$?
  [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
fi

if [[ -z "${SERVICE_KEY}" ]] ; then
  doing "Generating service credential - key"
  SERVICE_KEY=$(openssl rand -base64 60 | tr -d '\n' | tr -d '"' | tr -d '|') && \
  sed -i -e "s|FETCHSRV_SERVICE_KEY=.*|FETCHSRV_SERVICE_KEY=\"${SERVICE_KEY}\"|" ${CONFIG_DIRECTORY}/mni.ini
  RETVAL=$?
  [[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
fi

doing "Setting directory permissions"
chown root:${GROUP} ${CONFIG_DIRECTORY} && chmod 770 ${CONFIG_DIRECTORY} && \
chown root:${GROUP} ${CONFIG_DIRECTORY}/mni.ini && chmod 660 ${CONFIG_DIRECTORY}/mni.ini && \
chown root:${GROUP} $(dirname ${WORKING_DIRECTORY}) && chmod 770 $(dirname ${WORKING_DIRECTORY}) && \
chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY} && chmod 770 ${WORKING_DIRECTORY} && \
chown root:${GROUP} ${MNI_LOG_DIRECTORY} && chmod 770 ${MNI_LOG_DIRECTORY} && \
chown root:${GROUP} ${CONFIG_DIRECTORY} && chmod 770 ${CONFIG_DIRECTORY}
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Preparing environment"
cp -f ${CLI_PATH}/*.mjs ${WORKING_DIRECTORY}/ && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/*.mjs && chmod 660 ${WORKING_DIRECTORY}/*.mjs && \
cp -f ${CLI_PATH}/package.json ${WORKING_DIRECTORY}/ && chown ${USERNAME}:${GROUP} ${WORKING_DIRECTORY}/package.json && chmod 660 ${WORKING_DIRECTORY}/package.json
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Updating NodeJS package for target"
sed -i -e "s|/usr/local/mni/fetch/fetchService.mjs|${WORKING_DIRECTORY}/fetchService.mjs|" ${WORKING_DIRECTORY}/package.json && \
sed -i -e "s|/etc/mni/mni.ini|${CONFIG_DIRECTORY}/mni.ini|" ${WORKING_DIRECTORY}/package.json
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

if [[ "${CVE_SCAN,,}" == "true" ]] ; then
  doing "Cloning CVE List V5 repository"
  mkdir -p ${CVE_DIRECTORY} && chown ${USERNAME}:${GROUP} ${CVE_DIRECTORY} && chmod 770 ${CVE_DIRECTORY}
  CVE_TMP=$(mktemp -q -p /tmp mni.XXXXXXXX)
  cat > ${CVE_TMP} <<EOF
#!/bin/bash
pushd ${CVE_DIRECTORY} &>/dev/null && \
cd .. && \
git clone --filter=blob:none --no-checkout https://github.com/CVEProject/cvelistV5.git && \
cd ${CVE_DIRECTORY} && \
git config pull.rebase true && \
git sparse-checkout init --cone && \
git checkout main && \
git sparse-checkout set --no-cone '/*' '!cves/1999' '!cves/2000' '!cves/2001' '!cves/2002' '!cves/2003' '!cves/2004' '!cves/2005' '!cves/2006' '!cves/2007' '!cves/2008' '!cves/2009' '!cves/2010' '!cves/2011' '!cves/2012' '!cves/2013' '!cves/2014' '!cves/2015' '!cves/2016' '!cves/2017' '!cves/2018' '!cves/2019' '!cves/2020' '!cves/2021' '!cves/2022' '!cves/2023' '!cves/2024'
RETVAL=\$?
popd &>/dev/null
exit \${RETVAL}
EOF
  chown ${USERNAME}:${GROUP} ${CVE_TMP} &>/dev/null
  chmod +x ${CVE_TMP} &>/dev/null
  su --shell=/bin/bash --login -c ${CVE_TMP} - ${USERNAME} > cvelistv5.log 2>&1
  RETVAL=$?
  [[ -f "${CVE_TMP}" ]] && rm -f ${CVE_TMP} &>/dev/null
fi
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
