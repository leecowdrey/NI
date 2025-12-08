#!/bin/bash
#=====================================================================
# Network Insight (NI) - Dependency README Generator
#
# Corporate Headquarters:
# Cowdrey Consulting · United Kingdom · T:+447442104556 
# https://www.cowdrey.net/
#
# © 2026 Cowdrey Consulting. All rights reserved.
#=====================================================================
RETVAL=0
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
function nodejs_dep_scan() {
  local RETVAL=0
  export NODE_NO_WARNINGS=1
  pushd src/${1} &>/dev/null
  if [[ -f "package.json" ]] ; then
   echo -e "\n### \`${1}\` \n" >> ../../docs/nodejs-dependencies.md
   echo "| Third-Party Package | Used Version | License |" >> ../../docs/nodejs-dependencies.md
   echo "| ------------------- | ------------ | ------- |" >> ../../docs/nodejs-dependencies.md
   jq -r ".dependencies|keys" package.json > dependencies.json
   local DEPS=$(jq -r ".|length" dependencies.json)
   if [ "${DEPS:-0}" -gt 0 ] ; then
     npm install --omit=dev &>/dev/null
     for ((d=1;d<${DEPS};d++)) ; do
       local DEP=$(jq -r ".[${d}]" dependencies.json)
       local DEPVER=$(jq -r ".dependencies.\"${DEP}\"" package.json)
       local DEPLIC="Proprietary"
       if [[ -f "node_modules/${DEP}/package.json" ]] ; then
         DEPLIC=$(jq -r ".license" "node_modules/${DEP}/package.json")
       fi
       echo "| \`${DEP}\` | ${DEPVER} | ${DEPLIC} |" >> ../../docs/nodejs-dependencies.md
     done
     [[ -d "node_modules" ]] && rm -R -f node_modules &>/dev/null
     for ((d=1;d<${DEPS};d++)) ; do
       local DEP=$(jq -r ".[${d}]" dependencies.json)
       echo -e "\n#### \`${DEP}\`\n\n" >> ../../docs/nodejs-dependencies.md
       echo "\`\`\`npm" >> ../../docs/nodejs-dependencies.md
       npm view ${DEP} >> ../../docs/nodejs-dependencies.md
       echo -e "\n\`\`\`" >> ../../docs/nodejs-dependencies.md
     done
   fi
   [[ -f "dependencies.json" ]] && rm -f dependencies.json &>/dev/null
   RETVAL=0
  else 
   RETVAL=1
  fi
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

doing "Checking for release version"
NI_VERSION=$(grep -E "^NI_VERSION=.*" src/ni.ini|cut -d '=' -f2-|cut -d '"' -f2) && \
NI_BUILD=$(grep -E "^NI_BUILD=.*" src/ni.ini|cut -d '=' -f2-|cut -d '"' -f2)
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

## Add YAML Front Matter to markdown document
echo "---" > docs/nodejs-dependencies.md
echo "author: Cowdrey Consulting <support@cowdrey.net>" >> docs/nodejs-dependencies.md
echo "url: https://www.cowdrey.net/" >> docs/nodejs-dependencies.md
echo "footer: © 2026 Cowdrey Consulting. All rights reserved." >> docs/nodejs-dependencies.md
echo "title: Network Insight (NI)" >> docs/nodejs-dependencies.md
echo "paginate: false" >> docs/nodejs-dependencies.md
echo "version: ${NI_VERSION}.${NI_BUILD}" >> docs/nodejs-dependencies.md
echo "---" >> docs/nodejs-dependencies.md

## Generate title for markdown document
echo -e "\n# Network Insight\n\n" >> docs/nodejs-dependencies.md
echo -e "\n>Version: ${NI_VERSION}.${NI_BUILD}\n\n" >> docs/nodejs-dependencies.md
echo -e "\n[TOC]\n\n" >> docs/nodejs-dependencies.md
echo -e "\n## Node.JS/JavaScript Dependencies\n\n" >> docs/nodejs-dependencies.md

## run the scanners
doing "Documenting: apiServer (NodeJS)"
nodejs_dep_scan "apiServer"
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Documenting: uiServer (NodeJS)"
nodejs_dep_scan "uiServer"
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Documenting: predictService (NodeJS)"
nodejs_dep_scan "predictService"
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Documenting: alertService (NodeJS)"
nodejs_dep_scan "alertService"
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Documenting: fetchService (NodeJS)"
nodejs_dep_scan "fetchService"
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Documenting: licenseGen (NodeJS)"
nodejs_dep_scan "licenseGen"
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

popd &>/dev/null
exit ${RETVAL}