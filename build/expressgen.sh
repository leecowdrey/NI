#!/bin/bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - ExpressJS Use Stub Generator
#
# Corporate Headquarters:
# Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
# https://www.merkator.com/
#
# © 2024-2025 Merkator nv/sa. All rights reserved.
#=====================================================================
#
RETVAL=0
OPENAPI_YAML="${1:-mni.yaml}"
EXPRESSJS="${2:-express.js}"
URL_PREFIX="/mni"
URL_VERSION="/v1"
declare -a URL_PATHS=()
TAG=""
ID=""
declare -a QPARAMS=()
declare -a METHODS=()
SCOPE=""

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
if [[ -v $COLUMNS ]] ; then
    COLUMNS="$COLS"
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

# sleep given # of seconds with some progress graph shown
function xsleep()
{
(
set +x
    local ts="${1:-$WAIT_SLEEP_SECONDS}"

    local eta ; local etam; local etah; local etas; local etai; local etax
    local ts ; local st; local cts ; local el
    ((etah=ts / (60*60), etam=ts / 60, etas=ts % 60))
    etai=$(printf "%d:%02d:%02d" $etah $etam $etas)
    if [ ! -t 1 ] ; then
        echo -en "⏲   Waiting for ${CYAN}$etai${NC}..."
        sleep $ts
        #echo "Done"
        return
    fi
    eta=$ts
    echo -en "\033[?25l" # hide cursor
    for ((st=0; st<=ts; st++)) ; do
        echo -ne "\r⏲   Waiting ${GRAY}|${GREEN}"
        cts=$(echo "print(int((60.0/$ts)*$st))" | python3)
        for ((el=0; el<60; el++)) ; do
            if [[ $cts -eq $el ]] ; then
                echo -ne "${GRAY}"
            fi
            echo -ne "━"
        done
        ((etah=eta / (60*60), etam=eta / 60, etas=eta % 60))
        etax=$(printf "%d:%02d:%02d" $etah $etam $etas)
        echo -ne "${GRAY}| ${WHITE}eta ${CYAN}$etax${NC}     \r"
        sleep 1
        ((eta=eta - 1))
    done
    echo -e "\033[0K\033[?25h" # clear to EOL, show cursor
    echo -e "⏲   Waited for ${CYAN}$etai${NC}"
)
}

function getOpenIdScope() {
  SCOPE=""
  if [[ $(yq --exit-status -r ".paths.\"${1}\".${2,,}.security[].openId[]|length" ${OPENAPI_YAML} &>/dev/null) -eq 0 ]] ; then
    SCOPE=$(yq --exit-status -r ".paths.\"${1}\".${2,,}.security[].openId[]" ${OPENAPI_YAML} 2>/dev/null|xargs)
  fi
}

function getParameters() {
  REPACK=0
  QPARAMS=()
  if [[ $(yq --exit-status -r ".paths.\"${1}\".${2,,}.parameters[]|length" ${OPENAPI_YAML} &>/dev/null) -eq 0 ]] ; then
    IFS=' ' read -r -a QPARAMS <<< $(yq --exit-status -r ".paths.\"${1}\".${2,,}.parameters[].\"\$ref\"" ${OPENAPI_YAML} 2>/dev/null|sed -e "s|#\/components\/parameters\/||g"|xargs)
  fi
  # if parameters is part of url, i.e. {...}, then remove as it not query parameter
  # and as final step the array will need to be repacked with null entries removed
  for QPARAM in ${QPARAMS[@]}; do
    if [[ "${1}" == *"\{${QPARAM}\}"* ]] ; then
     REPACK=1
     QPARAMS=( "${QPARAMS[@]/$QPARAM/}" )
    fi
  done
  [[ ${REPACK} -eq 1 ]] && (for I in ${!QPARAMS[@]}; do [[ -z ${QPARAMS[I]} ]] && unset QPARAMS[I]; done)
  #for QPARAM in ${QPARAMS[@]}; do
  #  info " =${QPARAM}"
  #done
}

function getTag() {
  TAG=""
  if [[ $(yq --exit-status -r ".paths.\"${1}\".${2,,}.tags[]|length" ${OPENAPI_YAML} &>/dev/null) -eq 0 ]] ; then
    TAG=$(yq --exit-status -c -r ".paths.\"${1}\".${2,,}.tags[]" ${OPENAPI_YAML} 2>/dev/null|xargs)
  fi
}

function getOperationId() {
  ID=""
  if [[ $(yq --exit-status -r ".paths.\"${1}\".${2,,}.operationId" ${OPENAPI_YAML} &>/dev/null) -eq 0 ]] ; then
    ID=$(yq --exit-status -c -r ".paths.\"${1}\".${2,,}.operationId" ${OPENAPI_YAML} 2>/dev/null|xargs)
  fi
}

function getMethods() {
  METHODS=()
  if [[ $(yq --exit-status -r ".paths.\"$1\"|keys|length" ${OPENAPI_YAML} &>/dev/null) -eq 0 ]] ; then
    IFS=',' read -r -a METHODS <<< $(yq --exit-status -c -r ".paths.\"$1\"|keys" ${OPENAPI_YAML} 2>/dev/null|sed -e "s/^\[//"|sed -e "s/\]\$//g"|sed -e "s/\"//g"|xargs)
  fi
}

function getPaths() {
  URL_PATHS=()
  if [[ $(yq --exit-status -r ".paths|keys|length" ${OPENAPI_YAML} &>/dev/null) -eq 0 ]] ; then
    IFS=',' read -r -a URL_PATHS <<< $(yq --exit-status -c -r ".paths|keys" ${OPENAPI_YAML} 2>/dev/null|sed -e "s/^\[//"|sed -e "s/\]\$//g"|sed -e "s/\"//g"|xargs)
  fi
}

function expressScope() {
  if [[ -n "${SCOPE}" ]] ; then
   echo "    // security(\"${SCOPE}\")," >>${EXPRESSJS_TMP}
  fi
}

function expressParameters() {
  for QPARAM in ${QPARAMS[@]}; do
   case "${QPARAM}" in
    "pageSize") echo "    query(\"pageSize\").optional().isInt({ min: 1, max: 128 })," >>${EXPRESSJS_TMP}
    ;;
    "pageNumber") echo "    query(\"pageNumber\").optional().isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })," >>${EXPRESSJS_TMP}
    ;;
    "channel") echo "    query(\"channel\").isInt({ min: 1, max: 512 })," >>${EXPRESSJS_TMP}
    ;;
    "ribbon") echo "    query(\"ribbon\").isInt({ min: 1, max: 36 })," >>${EXPRESSJS_TMP}
    ;;
    "strand") echo "    query(\"ribbon\").isInt({ min: 1, max: 48 })," >>${EXPRESSJS_TMP}
    ;;
    "dateTime")   echo "    query(\"dateTime\").optional().matches(\"\\d{8}T\d{6}(([-,+]\\d{4})|Z)?\")," >>${EXPRESSJS_TMP}
    ;;
    "datePoint")   echo "    query(\"point\").optional().matches(\"\\d{8}\")," >>${EXPRESSJS_TMP}
    ;;
    "dateFrom")   echo "    query(\"from}\").optional().matches(\"\\d{8}\")," >>${EXPRESSJS_TMP}
    ;;
    "dateTo")   echo "    query(\"to\").optional().matches(\"\\d{8}\")," >>${EXPRESSJS_TMP}
    ;;
    "dateBefore")   echo "    query(\"before\").optional().matches(\"\\d{8}\")," >>${EXPRESSJS_TMP}
    ;;
    "dateAfter")   echo "    query(\"after\").optional().matches(\"\\d{8}\")," >>${EXPRESSJS_TMP}
    ;;
    "aggregationUnit")   echo "    query(\"aggregate\").optional().isString().trim()," >>${EXPRESSJS_TMP}
    ;;
    "subscriptionId"|"notificationId"|"workflowRunnerId"|"publicationId") echo "    query(\"${QPARAM}\").matches(\"(()?([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})+(,[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})?())?\")," >>${EXPRESSJS_TMP}
    ;;
    "alertId") echo "    param(\"alertId\").isUUID(4)," >>${EXPRESSJS_TMP}
    ;;
    "cableId") echo "    param(\"cableId\").isUUID(4)," >>${EXPRESSJS_TMP}
    ;;
    "ductId") echo "    param(\"ductId\").isUUID(4)," >>${EXPRESSJS_TMP}
    ;;
    "emailProviderId"|"mapProviderId"|"siteId"|"serviceId"|"poleId"|"neId"|"rackId"|"trenchId"|"kafakProducerId"|"requestorId"|"workflowEngineId") echo "    param(\"${QPARAM}\").isUUID(4)," >>${EXPRESSJS_TMP}
    ;;
    *)
    echo "    // query(\"${QPARAM}\").is####," >>${EXPRESSJS_TMP}
    ;;
  esac
  done
}

function expressGetRoute() {
  EXPRESSJS_PATH=$(echo -n "${1}"|sed -e "s|\/{|\/:|g"|sed -e "s|}||g")
  cat >>${EXPRESSJS_TMP} <<EOF
  /*
     Tag:           ${TAG}
     operationId:   ${ID}
     exposed Route: ${URL_PREFIX}${URL_VERSION}${EXPRESSJS_PATH}
     HTTP method:   ${2^^}
     OpenID Scope:  ${SCOPE}
  */
  app.${2,,}(serveUrlPrefix + serveUrlVersion + "${EXPRESSJS_PATH}",
EOF
  expressScope
  expressParameters
  cat >>${EXPRESSJS_TMP} <<EOF
    async (req, res, next) => {
      let result = validationResult(req);
      try {
        if (result.isEmpty()) {
          let data = matchedData(req);
          let resJson = {};
          res.contentType("application/json").status(200).json(resJson);
        } else {
          res
            .contentType("application/json")
            .status(400)
            .json({ errors: result.array() });
        }
      } catch (e) {
        return next(e);
      }
    }
  );
EOF
}

function expressPutRoute() {
  EXPRESSJS_PATH=$(echo -n "${1}"|sed -e "s|\/{|\/:|g"|sed -e "s|}||g")
  cat >>${EXPRESSJS_TMP} <<EOF
  /*
     Tag:           ${TAG}
     operationId:   ${ID}
     exposed Route: ${URL_PREFIX}${URL_VERSION}${EXPRESSJS_PATH}
     HTTP method:   ${2^^}
     OpenID Scope:  ${SCOPE}
  */
  app.${2,,}(serveUrlPrefix + serveUrlVersion + "${EXPRESSJS_PATH}",
EOF
  expressScope
  expressParameters
  cat >>${EXPRESSJS_TMP} <<EOF
    async (req, res, next) => {
      let result = validationResult(req);
      try {
        if (result.isEmpty()) {
          let data = matchedData(req);
          let resJson = {};
          res.contentType("application/json").status(204).json(resJson);
        } else {
          res
            .contentType("application/json")
            .status(400)
            .json({ errors: result.array() });
        }
      } catch (e) {
        return next(e);
      }
    }
  );
EOF
}

function expressPostRoute() {
  EXPRESSJS_PATH=$(echo -n "${1}"|sed -e "s|\/{|\/:|g"|sed -e "s|}||g")
  cat >>${EXPRESSJS_TMP} <<EOF
  /*
     Tag:           ${TAG}
     operationId:   ${ID}
     exposed Route: ${URL_PREFIX}${URL_VERSION}${EXPRESSJS_PATH}
     HTTP method:   ${2^^}
     OpenID Scope:  ${SCOPE}
  */
  app.${2,,}(serveUrlPrefix + serveUrlVersion + "${EXPRESSJS_PATH}",
EOF
  expressScope
  expressParameters
  cat >>${EXPRESSJS_TMP} <<EOF
    async (req, res, next) => {
      let result = validationResult(req);
      try {
        if (result.isEmpty()) {
          let data = matchedData(req);
          let resJson = {};
          res.contentType("application/json").status(204).json(resJson);
        } else {
          res
            .contentType("application/json")
            .status(400)
            .json({ errors: result.array() });
        }
      } catch (e) {
        return next(e);
      }
    }
  );
EOF
}

function expressPatchRoute() {
  EXPRESSJS_PATH=$(echo -n "${1}"|sed -e "s|\/{|\/:|g"|sed -e "s|}||g")
  cat >>${EXPRESSJS_TMP} <<EOF
  /*
     Tag:           ${TAG}
     operationId:   ${ID}
     exposed Route: ${URL_PREFIX}${URL_VERSION}${EXPRESSJS_PATH}
     HTTP method:   ${2^^}
     OpenID Scope:  ${SCOPE}
  */
  app.${2,,}(serveUrlPrefix + serveUrlVersion + "${EXPRESSJS_PATH}",
EOF
  expressScope
  expressParameters
  cat >>${EXPRESSJS_TMP} <<EOF
    async (req, res, next) => {
      let result = validationResult(req);
      try {
        if (result.isEmpty()) {
          let data = matchedData(req);
          let resJson = {};
          res.contentType("application/json").status(204).json(resJson);
        } else {
          res
            .contentType("application/json")
            .status(400)
            .json({ errors: result.array() });
        }
      } catch (e) {
        return next(e);
      }
    }
  );
EOF
}

function expressDeleteRoute() {
  EXPRESSJS_PATH=$(echo -n "${1}"|sed -e "s|\/{|\/:|g"|sed -e "s|}||g")
  cat >>${EXPRESSJS_TMP} <<EOF
  /*
     Tag:           ${TAG}
     operationId:   ${ID}
     exposed Route: ${URL_PREFIX}${URL_VERSION}${EXPRESSJS_PATH}
     HTTP method:   ${2^^}
     OpenID Scope:  ${SCOPE}
  */
  app.${2,,}(serveUrlPrefix + serveUrlVersion + "${EXPRESSJS_PATH}",
EOF
  expressScope
  expressParameters
  cat >>${EXPRESSJS_TMP} <<EOF
    async (req, res, next) => {
      let result = validationResult(req);
      try {
        if (result.isEmpty()) {
          res.sendStatus(204);
        } else {
          res
            .contentType("application/json")
            .status(400)
            .json({ errors: result.array() });
        }
      } catch (e) {
        return next(e);
      }
    }
  );
EOF
}

function quit() {
  unset URL_PATHS
  unset PARAMS
  unset METHODS
  rm -f /tmp/expressjs.???????? &>/dev/null
  exit ${RETVAL}
}

# main
alert "MNI ExpressJS Use Stub Generator"

trap quit INT

## check for external dependencies
doing "- Checking for JSON Query (jq)"
which jq &> /dev/null || sudo apt install -y jq &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "- Checking for YAML Query (yq)"
which yq &> /dev/null
RETVAL=$?
if [[ ${RETVAL} -eq 0 ]] ; then
  file $(which yq)|grep -i "python" &>/dev/null
  RETVAL=$?
  [[ ${RETVAL} -eq 0 ]] || error "- fail, wrong version of YQ is already installed, use 'pip install yq'"
else
  #https://kislyuk.github.io/yq/#installation
  # if on mac use `brew install python-yq`
  sudo pip -q install yq &>/dev/null
  RETVAL=$?
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "- Checking for MNI OpenAPI definition"
if [[ -f "${OPENAPI_YAML}" ]] ; then
  RETVAL=0
else
  RETVAL=1
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

EXPRESSJS_TMP=$(mktemp -q -p /tmp expressjs.XXXXXXXX)

doing "- Parsing OpenAPI definition"
getPaths
URL_PATHS_LENGTH=${#URL_PATHS[@]}
URL_PATHS_IDX=0
for URL_PATH in ${URL_PATHS[@]}; do
 ((URL_PATHS_IDX+=1))
 getMethods "${URL_PATH}"
 METHODS_LENGTH=${#METHODS[@]}
 METHODS_IDX=0
 for METHOD in ${METHODS[@]}; do
  ((METHODS_IDX+=1))
  doing "- ${METHOD^^} ${URL_PATH}"
  getParameters "${URL_PATH}" "${METHOD}"
  getTag "${URL_PATH}" "${METHOD}"
  getOperationId "${URL_PATH}" "${METHOD}"
  getOpenIdScope "${URL_PATH}" "${METHOD}"
  case "${METHOD^^}" in
   GET) 
        expressGetRoute "${URL_PATH}" "${METHOD}"
        ;;
   PUT) 
        expressPutRoute "${URL_PATH}" "${METHOD}"
        ;;
   POST)
        expressPostRoute "${URL_PATH}" "${METHOD}"
        ;;
   PATCH) 
        expressPatchRoute "${URL_PATH}" "${METHOD}"
        ;;
   DELETE)
        expressDeleteRoute "${URL_PATH}" "${METHOD}"
        ;;
   *)   warning "Unsupported method ${METHOD^^}"
        ;;
  esac
  [[ ${METHODS_IDX} -lt ${METHODS_LENGTH} ]] && echo "" >>${EXPRESSJS_TMP}
 done
 [[ ${URL_PATHS_IDX} -lt ${URL_PATHS_LENGTH} ]] && echo "" >>${EXPRESSJS_TMP}
done
RETVAL=0
[[ ${RETVAL} -eq 0 ]] && echo "- ok" || echo "- fail"

doing "- Creating JS snippet file"
cat "${EXPRESSJS_TMP}" > "${EXPRESSJS}"
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && echo "- ok" || echo "- fail"

quit