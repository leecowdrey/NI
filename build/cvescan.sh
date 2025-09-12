#!/bin/bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - CVE Scanner-Sonatype OSS Index 
#
# Corporate Headquarters:
# Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
# https://www.merkator.com/
#
# © 2024-2025 Merkator nv/sa. All rights reserved.
#=====================================================================
RETVAL=0
CVE_FOUND=0
declare -a CVEs=()
DN=$(dirname -- "$( readlink -f -- "$0"; )";)
pushd ${DN}/.. &>/dev/null

if [ -t 1 ] ; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    LTGREEN='\033[01;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    LTBLUE='\033[1;34m'
    GRAY='\033[1;30m'
    LTGRAY='\033[0;37m'
    CYAN='\033[0;36m'
    NC='\033[0m' # No Color
    COLS=$(tput cols)
    USING_COLOURS=true
    IS_TERMINAL=true
else
    RED=""
    GREEN=""
    LTGREEN=""
    YELLOW=""
    BLUE=""
    LTBLUE=""
    GRAY=""
    LTGRAY=""
    CYAN=""
    NC=""
    COLS=80
    USING_COLOURS=false
    IS_TERMINAL=false
fi
COLOURS_SET="1"

function msg_show()
{
(set +x
    local symbol="$1"
    local col="$2"
    local msg="$3"
    local nl=0
    local t; local tlen; local msglen; local spaces
    if [[ -z "$symbol" ]] ; then
        symbol="  "
    fi
    t=$(date +'%H:%M:%S')
    tlen="${#t}"
    msglen="${#msg}"

    ((len=COLS - tlen - 3))
    ((msglen=msglen + 4))
    # if not using terminal or msg length exceeds our threshold we show timestamp on new line
    if [[ -z "$GRAY" || ${msglen} -gt $len ]] ; then
        nl=1
    fi
    echo -e "${symbol}  ${col}${msg}${NC}"
    if [[ $nl -eq 0 ]] ; then
        echo -en "\033[1A\033[${len}C" # eg go up one line and move right $len spaces
    else
        spaces=$(printf "%*s" $len "")
        echo -n "$spaces"
    fi
    echo -e "${GRAY}[$t]${NC}"
)
}

# Show error message and possible workaround message but not exit
function error()
{
(
set +x
    local err="$1"
    local workaround="$2"
    msg_show "❌" "${RED}" "${err}!"
    if [ -n "$workaround" ] ; then
        echo -e "🔎  ${LTGREEN}${workaround}${NC}"
    fi
)
    exit 255
}

# Show warning message and possible workaround message
function warning()
{
(
set +x
    local msg="$1"
    local workaround="$2"
	local DEBUGGING=1
	[[ $- == *e* ]] && (DEBUGGING=0 ; set +x)
    msg_show "🔥" "${YELLOW}" "${msg}"
    if [ -n "$workaround" ] ; then
        echo -e "🔎  ${LTGREEN}${workaround}${NC}"
    fi
)
}

# Proceed to do something
function doing()
{
(
set +x
    local msg="$1"
	local DEBUGGING=1
	[[ $- == *e* ]] && (DEBUGGING=0 ; set +x)
    msg_show "▶️ " "${GREEN}" "$msg"
)
}

# Proceed to do something a tad drastic
function alert()
{
(
set +x
    local msg="$1"
    local workaround="$2"
	local DEBUGGING=1
	[[ $- == *e* ]] && (DEBUGGING=0 ; set +x)
    msg_show "✋" "${YELLOW}" "$msg"
    if [ -n "$workaround" ] ; then
        echo -e "🔎  ${LTGREEN}${workaround}${NC}"
    fi
)
}

# Successfully completed a task or script
function info()
{
(
set +x
	[[ $- == *e* ]] && (DEBUGGING=0 ; set +x)
    local msg="$1"
    msg_show "ℹ" "${LTGRAY}" "$msg"
)
}

# Successfully completed a task or script
function success()
{
(
set +x
    local msg="$1"
    msg_show "✅" "${GREEN}" "$msg"
)
}

## Test routines

## NodeJS servers
function nodejs_scan() {
  local RETVAL=0
  #export NODE_NO_WARNINGS=1
  push src/${1} &>/dev/null
  [[ -d "node_modules" ]] && rm -R -f node_modules &>/dev/null
  [[ -f "package-lock.json" ]] && rm -f package-lock.json &>/dev/null
  [[ -f "cve.json" ]] && rm -f cve.json &>/dev/null
  local OSSI_CLI_PARAM="--quiet --json"
  if [[ -f "./cveignore.json" ]] ; then
    CVEs=()
    IFS=' ' read -r -a CVEs <<< $(cat ./cveignore.json |jq -r ".ignore[].id"|xargs)
    for CVE in ${CVEs[@]}; do
      warning "- ignoring ${CVE}"
    done
    OSSI_CLI_PARAM="--whitelist ./cveignore.json ${OSSI_CLI_PARAM}"
  fi
  npm -y install --silent --omit=dev &>/dev/null
  npx -y auditjs@latest ossi ${OSSI_CLI_PARAM} &> cve.json && \
  git diff --quiet cve.json &>/dev/null || git add -f cve.json 
  RETVAL=$?
  [[ -d "node_modules" ]] && rm -R -f node_modules &>/dev/null
  [[ -f "package-lock.json" ]] && rm -f package-lock.json &>/dev/null
  popd &>/dev/null
  return ${RETVAL}
}

## ensure root and have initial tools and config
# check on linux environments but not darwin, cygwin, msys, win32 nor freebsd
[[ "${OSTYPE}" == "linux-gnu"* && $(id -u) -ne 0 ]] && exit 1

## check for external dependencies
doing "Checking for JSON Query (jq)"
which jq &> /dev/null || apt install -y jq &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Checking for NodeJS"
which node &> /dev/null || (curl -fsSL https://deb.nodesource.com/setup_24.x -o nodesource_setup.sh && bash nodesource_setup.sh && apt update && apt install -y nodejs)
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
which npm &> /dev/null || exit 1

## run the scanners
doing "Scanning: apiServer (NodeJS)"
nodejs_scan "apiServer"
RETVAL=$?
if [[ ${RETVAL} -eq 0 ]] ; then
  success "- ok"
else
  CVE_FOUND=1
  CVEs=()
  IFS=' ' read -r -a CVEs <<< $(cat src/apiServer/cve.json |jq -r ".[].vulnerabilities[].id"|xargs)
  for CVE in ${CVEs[@]}; do
    alert "- found ${CVE}"
  done
fi

doing "Scanning: uiServer (NodeJS)"
nodejs_scan "uiServer"
RETVAL=$?
if [[ ${RETVAL} -eq 0 ]] ; then
  success "- ok"
else
  CVE_FOUND=1
  CVEs=()
  IFS=' ' read -r -a CVEs <<< $(cat src/uiServer/cve.json |jq -r ".[].vulnerabilities[].id"|xargs)
  for CVE in ${CVEs[@]}; do
    alert "- found ${CVE}"
  done
fi

doing "Scanning: predictService (NodeJS)"
nodejs_scan "predictService"
RETVAL=$?
if [[ ${RETVAL} -eq 0 ]] ; then
  success "- ok"
else
  CVE_FOUND=1
  CVEs=()
  IFS=' ' read -r -a CVEs <<< $(cat src/predictService/cve.json |jq -r ".[].vulnerabilities[].id"|xargs)
  for CVE in ${CVEs[@]}; do
    alert "- found ${CVE}"
  done
fi

doing "Scanning: alertService (NodeJS)"
nodejs_scan "alertService"
RETVAL=$?
if [[ ${RETVAL} -eq 0 ]] ; then
  success "- ok"
else
  CVE_FOUND=1
  CVEs=()
  IFS=' ' read -r -a CVEs <<< $(cat src/alertService/cve.json |jq -r ".[].vulnerabilities[].id"|xargs)
  for CVE in ${CVEs[@]}; do
    alert "- found ${CVE}"
  done
fi

doing "Scanning: fetchService (NodeJS)"
nodejs_scan "fetchService"
RETVAL=$?
if [[ ${RETVAL} -eq 0 ]] ; then
  success "- ok"
else
  CVE_FOUND=1
  CVEs=()
  IFS=' ' read -r -a CVEs <<< $(cat src/fetchService/cve.json |jq -r ".[].vulnerabilities[].id"|xargs)
  for CVE in ${CVEs[@]}; do
    alert "- found ${CVE}"
  done
fi

doing "Scanning: licenseGen (NodeJS)"
nodejs_scan "licenseGen"
RETVAL=$?
if [[ ${RETVAL} -eq 0 ]] ; then
  success "- ok"
else
  CVE_FOUND=1
  CVEs=()
  IFS=' ' read -r -a CVEs <<< $(cat src/licenseGen/cve.json |jq -r ".[].vulnerabilities[].id"|xargs)
  for CVE in ${CVEs[@]}; do
    alert "- found ${CVE}"
  done
fi

#
unset CVEs
popd &>/dev/null
exit ${CVE_FOUND}