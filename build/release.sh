#!/bin/bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - CI/CD Pipeline
#
# Corporate Headquarters:
# Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
# https://www.merkator.com/
#
# © 2024-2025 Merkator nv/sa. All rights reserved.
#=====================================================================
RETVAL=0
DN=$(dirname -- "$( readlink -f -- "$0"; )";)
pushd ${DN}/../release &>/dev/null


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

## NodeJS/BrowserJS Obfuscation
# 1 - src folder suffix
# 2 - extension (ejs,mjs,js)
# 3 - target (node,browser)
# 4 - preset (low,medium,high)
function js_obfuscate() {
  local RETVAL=0
  local LOCK_START_DATE="2025-01-01"
  local LOCK_END_DATE="2049-12-31"
  export NODE_NO_WARNINGS=1
  if [[ "${OSTYPE}" == "linux-gnu"* ]] ; then
    LOCK_START_DATE=$(date +"%Y-%m-%d") 
    LOCK_END_DATE=$(date -d "15 month" +'%Y-%m-%d')
  elif [[ "${OSTYPE}" ==  "darwin"* ]] ; then
    LOCK_START_DATE=$(date +'%Y-%m-%d')
    LOCK_END_DATE=$(date -v +15m +'%Y-%m-%d')
  fi
  local JS_TMP=$(mktemp -q -p ./ mniXXXXXXXX)
  [[ -f "${JS_TMP}" ]] && mv -f ${JS_TMP} ${JS_TMP}.js &>/dev/null
  JS_TMP="${JS_TMP}.js"
  for JS in $(find ../src/${1} -type f -maxdepth 1 -name "*.${2}") ; do
    local JS_FILE=$(basename ${JS})
    if [[ "${JS_FILE}" != "oasConstants.mjs" ]] ; then
      cat > ${JS_TMP} <<EOF
const JSConfuser = require("js-confuser");
const { readFileSync, writeFileSync } = require("fs");

// Read input code
const sourceCode = readFileSync("../src/${1}/${JS_FILE}", "utf8");
const options = {
  target: "${3}",
  preset: "low",
  calculator: false,
  variableMasking: false,
  renameVariables: false,
  renameGlobals: false,
  hexadecimalNumbers: true,
  compact: true,
  minify: false,
  stringCompression: true,
  stringConcealing: true,
  stringEncoding: true,
  stringSplitting: false,
  objectExtraction: false,
  renameLabels: false,
  movedDeclarations: false,
  duplicateLiteralsRemoval: false,
  globalConcealing: false,
  preserveFunctionLength: true,
  shuffle: false,
  pack: false,
  flatten: false,
  rgf: false,
  controlFlowFlattening: false,
  dispatcher: false,
  opaquePredicates: false,
  deadCode: false,
  astScrambler: false,
  lock: {
    selfDefending: false,
    customLocks: false,
    integrity: false,
    antiDebug: false,
    tamperProtection: false,
  },
};

JSConfuser.obfuscate(sourceCode, options)
  .then((result) => {
    // Write output code
    writeFileSync("${1}/${JS_FILE}", result.code);
  })
  .catch((err) => {
    // Error occurred
    console.error(err);
    process.exit(1);
  });
EOF
    node ${JS_TMP}
    RETVAL=$?
    [[ ${RETVAL} -ne 0 ]] && break
    [[ -f "${JS_TMP}" ]] && rm -f ${JS_TMP} &>/dev/null
    fi
  done
  return ${RETVAL}
}

## ensure root and have initial tools and config
# check on linux environments but not darwin, cygwin, msys, win32 nor freebsd
[[ "${OSTYPE}" == "linux-gnu"* && $(id -u) -ne 0 ]] && exit 1

MNI_VERSION=$(grep -E "^MNI_VERSION=.*" ../src/mni.ini|cut -d '=' -f2-|cut -d '"' -f2)
MNI_BUILD=$(grep -E "^MNI_BUILD=.*" ../src/mni.ini|cut -d '=' -f2-|cut -d '"' -f2)

## prepare
doing "Preparing environment"
[[ -d "node_modules" ]] && rm -R -f node_modules &>/dev/null
[[ -f "package.json" ]] && rm -f package.json &>/dev/null
[[ -f "package-lock.json" ]] && rm -f package-lock.json &>/dev/null
[[ -d "db" ]] && rm -R -f db &>/dev/null
[[ -d "alertService" ]] && rm -R -f alertService &>/dev/null
[[ -d "apiGateway" ]] && rm -R -f apiGateway &>/dev/null
[[ -d "apiServer" ]] && rm -R -f apiServer &>/dev/null
[[ -d "dnsServer" ]] && rm -R -f dnsServer &>/dev/null
[[ -d "fetchService" ]] && rm -R -f fetchService &>/dev/null
[[ -d "iamServer" ]] && rm -R -f iamServer &>/dev/null
[[ -d "predictService" ]] && rm -R -f predictService &>/dev/null
[[ -d "ui" ]] && rm -R -f ui &>/dev/null
[[ -d "uiServer" ]] && rm -R -f uiServer &>/dev/null
mkdir -p db &>/dev/null && \
mkdir -p alertService &>/dev/null && \
mkdir -p apiGateway &>/dev/null && \
mkdir -p apiServer &>/dev/null && \
mkdir -p dnsServer &>/dev/null && \
mkdir -p fetchService &>/dev/null && \
mkdir -p iamServer &>/dev/null && \
mkdir -p predictService &>/dev/null && \
mkdir -p ui/dist &>/dev/null && \
mkdir -p uiServer &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

## check for external dependencies
doing "Checking for NodeJS"
which node &> /dev/null || (curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh && bash nodesource_setup.sh && apt update && apt install -y nodejs)
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
which npm &> /dev/null || exit 1
npm -y install --silent --save-dev js-confuser &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

## copy release
doing "Copying source"
cp -f ../src/mni.ini . && \
cp -f ../src/oasConstants.mjs . && \
cp -f ../src/common.sh . && \
cp -f ../src/db/schema.sql db/ && \
cp -R -f ../src/alertService/* alertService/ && \
cp -R -f ../src/apiGateway/* apiGateway/ && \
cp -R -f ../src/apiServer/* apiServer/ && \
cp -R -f ../src/dnsServer/* dnsServer/ && \
cp -R -f ../src/fetchService/* fetchService/ && \
cp -R -f ../src/iamServer/* iamServer/ && \
cp -R -f ../src/predictService/* predictService/ && \
cp -R -f ../src/ui/dist/* ui/dist/ && \
cp -R -f ../src/uiServer/* uiServer/
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

## run the Obfuscation
doing "Obfuscating JavaScript"
js_obfuscate "alertService" "mjs" "node" "low" && \
js_obfuscate "apiServer" "mjs" "node" "low" && \
js_obfuscate "fetchService" "mjs" "node" "low" && \
js_obfuscate "predictService" "mjs" "node" "low"  && \
js_obfuscate "uiServer" "mjs" "node" "low" 
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

## create distribution archive
doing "Creating distribution archive"
TAR_OPTIONS="--exclude .git* --exclude cveignore.json --dereference -zcf"
tar ${TAR_OPTIONS} mni_alertService_${MNI_VERSION}.tar.gz alertService/* && \
tar ${TAR_OPTIONS} mni_apiGateway_${MNI_VERSION}.tar.gz apiGateway/* && \
tar ${TAR_OPTIONS} mni_apiServer_${MNI_VERSION}.tar.gz apiServer/* && \
tar ${TAR_OPTIONS} mni_dnsServer_${MNI_VERSION}.tar.gz dnsServer/* && \
tar ${TAR_OPTIONS} mni_fetchService_${MNI_VERSION}.tar.gz fetchService/* && \
tar ${TAR_OPTIONS} mni_iamServer_${MNI_VERSION}.tar.gz iamServer/* && \
tar ${TAR_OPTIONS} mni_predictService_${MNI_VERSION}.tar.gz predictService/* && \
tar ${TAR_OPTIONS} mni_uiServer_${MNI_VERSION}.tar.gz uiServer/* && \
tar ${TAR_OPTIONS} mni_${MNI_VERSION}.tar.gz mni_*_${MNI_VERSION}.tar.gz && \
md5 -b mni_alertService_${MNI_VERSION}.tar.gz > mni_alertService_${MNI_VERSION}.md5 && \
md5 -b mni_apiGateway_${MNI_VERSION}.tar.gz > mni_apiGateway_${MNI_VERSION}.md5 && \
md5 -b mni_apiServer_${MNI_VERSION}.tar.gz > mni_apiServer_${MNI_VERSION}.md5 && \
md5 -b mni_dnsServer_${MNI_VERSION}.tar.gz > mni_dnsServer_${MNI_VERSION}.md5 && \
md5 -b mni_fetchService_${MNI_VERSION}.tar.gz > mni_fetchService_${MNI_VERSION}.md5 && \
md5 -b mni_iamServer_${MNI_VERSION}.tar.gz > mni_iamServer_${MNI_VERSION}.md5 && \
md5 -b mni_predictService_${MNI_VERSION}.tar.gz > mni_predictService_${MNI_VERSION}.md5 && \
md5 -b mni_uiServer_${MNI_VERSION}.tar.gz > mni_uiServer_${MNI_VERSION}.md5 && \
md5 -b mni_${MNI_VERSION}.tar.gz > mni_${MNI_VERSION}.md5 && \
rm -f mni_alertService_${MNI_VERSION}.* \
      mni_apiGateway_${MNI_VERSION}.* \
      mni_apiServer_${MNI_VERSION}.* \
      mni_dnsServer_${MNI_VERSION}.* \
      mni_fetchService_${MNI_VERSION}.* \
      mni_iamServer_${MNI_VERSION}.* \
      mni_predictService_${MNI_VERSION}.* \
      mni_uiServer_${MNI_VERSION}.* &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

## clean up
[[ -d "node_modules" ]] && rm -R -f node_modules &>/dev/null
[[ -f "package.json" ]] && rm -f package.json &>/dev/null
[[ -f "package-lock.json" ]] && rm -f package-lock.json &>/dev/null
[[ -d "db" ]] && rm -R -f db &>/dev/null
[[ -d "alertService" ]] && rm -R -f alertService &>/dev/null
[[ -d "apiGateway" ]] && rm -R -f apiGateway &>/dev/null
[[ -d "apiServer" ]] && rm -R -f apiServer &>/dev/null
[[ -d "dnsServer" ]] && rm -R -f dnsServer &>/dev/null
[[ -d "fetchService" ]] && rm -R -f fetchService &>/dev/null
[[ -d "iamServer" ]] && rm -R -f iamServer &>/dev/null
[[ -d "predictService" ]] && rm -R -f predictService &>/dev/null
[[ -d "ui" ]] && rm -R -f ui &>/dev/null
[[ -d "uiServer" ]] && rm -R -f uiServer &>/dev/null
[[ -f "oasConstants.mjs" ]] && rm -f oasConstants.mjs && \
[[ -f "common.sh" ]] && rm -f common.sh && \
[[ -f "mni.ini" ]] && rm -f mni.ini && \

popd &>/dev/null
exit ${RETVAL}
