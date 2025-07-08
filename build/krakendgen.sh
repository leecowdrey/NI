#!/bin/bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - KrakenD Config Generator
#
# Corporate Headquarters:
# Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
# https://www.merkator.com/
#
# © 2024-2025 Merkator nv/sa. All rights reserved.
#=====================================================================
#
exit

RETVAL=0
OPENAPI_YAML="${1:-mni.yaml}"
KRAKEND_JSON="${2:-apiGateway.json}"
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
  if [[ $(yq -r ".paths.\"${1}\".${2,,}.parameters[].\"\$ref\"" ${OPENAPI_YAML} 2>/dev/null|wc -l) -gt 0 ]] ; then
    IFS=' ' read -r -a QPARAMS <<< $(yq --exit-status -r ".paths.\"${1}\".${2,,}.parameters[].\"\$ref\"" ${OPENAPI_YAML} 2>/dev/null|sed -e "s|#\/components\/parameters\/||g"|xargs)
  fi
  # fudge for parameter names rather than rescanning YAML for used name rather than component name
  for QI in ${!QPARAMS[@]}; do
   case "${QPARAMS[$QI]}" in
    "datePoint")       QPARAMS[$QI]="point" ;;
    "dateFrom")        QPARAMS[$QI]="from" ;;
    "dateTo")          QPARAMS[$QI]="to" ;;
    "dateBefore")      QPARAMS[$QI]="before" ;;
    "dateAfter")       QPARAMS[$QI]="after" ;;
    "aggregationUnit") QPARAMS[$QI]="aggregate" ;;
   esac
  done
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

function addScopeRBAC() {
  cat >>${KRAKEND_TMP} <<EOF
EOF
#      ,
#      "extra_config": {
#        "auth/validator": {
#          "alg": "HS256",
#          "jwk_url": "https://JWK/jwt",
#          "scopes": [
#            "mni"
#          ],
#          "scopes_matcher": "all",
#          "scopes_key": "data.data2.scopes",
#          "roles": [
#            "admin_read",
#            "admin_write"
#          ],
#          "audience": [
#            "https://localhost:7443/mni/v1"
#          ],
#          "roles_key": "rolesKey",
#          "cookie_key": "cookieName"
#        }
#      }
#}
 :
}

function krakTail() {
  cat >>${KRAKEND_TMP} <<EOF
  ]
}
EOF
}

function krakGetEndPoint() {
  QUERY_STRINGS=""
  QUERY_LENGTH=${#QPARAMS[@]}
  if [[ ${QUERY_LENGTH} -gt 0 ]] ; then
    LAST_QUERY_STRING="${QPARAMS[-1]}"
    for QPARAM in ${QPARAMS[@]}; do
      QUERY_STRINGS+="\"${QPARAM}\""
      [[ "${QPARAM}" == "${LAST_QUERY_STRING}" ]] || QUERY_STRINGS+=","
    done
  fi
  cat >>${KRAKEND_TMP} <<EOF
    {
      "endpoint": "${URL_PREFIX}${URL_VERSION}${1}",
      "@comment": "${ID}",
      "output_encoding": "no-op",
      "input_headers": ["Accept"],
      "input_query_strings": [${QUERY_STRINGS}],
      "backend": [
        {
          "url_pattern": "${URL_PREFIX}${URL_VERSION}${1}",
          "encoding": "no-op",
          "sd": "dns",
          "sd_scheme": "https",
          "host": ["_https._tcp.apiserver.mni.merkator.local"],
          "disable_host_sanitize": true,
          "extra_config": {
            "modifier/martian": {
              "header.Modifier": {
                "scope": ["request"],
                "name": "Authorization",
                "value": "Basic #"
              }
            },
            "qos/ratelimit/proxy": {
              "max_rate": 32767,
              "capacity": 32767,
              "every": "1m"
            }
          }
        }
      ],
      "method": "GET"
EOF
  addScopeRBAC
  cat >>${KRAKEND_TMP} <<EOF
    }
EOF
}

function krakPutEndPoint() {
  QUERY_STRINGS=""
  QUERY_LENGTH=${#QPARAMS[@]}
  if [[ ${QUERY_LENGTH} -gt 0 ]] ; then
    LAST_QUERY_STRING="${QPARAMS[-1]}"
    for QPARAM in ${QPARAMS[@]}; do
      QUERY_STRINGS+="\"${QPARAM}\""
      [[ "${QPARAM}" == "${LAST_QUERY_STRING}" ]] || QUERY_STRINGS+=","
    done
  fi
  cat >>${KRAKEND_TMP} <<EOF
    {
      "endpoint": "${URL_PREFIX}${URL_VERSION}${1}",
      "@comment": "${ID}",
      "output_encoding": "no-op",
      "input_headers": ["Content-Type", "Accept"],
      "input_query_strings": [${QUERY_STRINGS}],
      "backend": [
        {
          "url_pattern": "${URL_PREFIX}${URL_VERSION}${1}",
          "encoding": "no-op",
          "sd": "dns",
          "sd_scheme": "https",
          "host": ["_https._tcp.apiserver.mni.merkator.local"],
          "disable_host_sanitize": true,
          "extra_config": {
            "modifier/martian": {
              "header.Modifier": {
                "scope": ["request"],
                "name": "Authorization",
                "value": "Basic #"
              }
            },
            "qos/ratelimit/proxy": {
              "max_rate": 32767,
              "capacity": 32767,
              "every": "1m"
            }
          }
        }
      ],
      "method": "PUT"
EOF
  addScopeRBAC
  cat >>${KRAKEND_TMP} <<EOF
    }
EOF
}

function krakPostEndPoint() {
  QUERY_STRINGS=""
  QUERY_LENGTH=${#QPARAMS[@]}
  if [[ ${QUERY_LENGTH} -gt 0 ]] ; then
    LAST_QUERY_STRING="${QPARAMS[-1]}"
    for QPARAM in ${QPARAMS[@]}; do
      QUERY_STRINGS+="\"${QPARAM}\""
      [[ "${QPARAM}" == "${LAST_QUERY_STRING}" ]] || QUERY_STRINGS+=","
    done
  fi
  cat >>${KRAKEND_TMP} <<EOF
    {
      "endpoint": "${URL_PREFIX}${URL_VERSION}${1}",
      "@comment": "${ID}",
      "output_encoding": "no-op",
      "input_headers": ["Content-Type", "Accept"],
      "input_query_strings": [${QUERY_STRINGS}],
      "backend": [
        {
          "url_pattern": "${URL_PREFIX}${URL_VERSION}${1}",
          "encoding": "no-op",
          "sd": "dns",
          "sd_scheme": "https",
          "host": ["_https._tcp.apiserver.mni.merkator.local"],
          "disable_host_sanitize": true,
          "extra_config": {
            "modifier/martian": {
              "header.Modifier": {
                "scope": ["request"],
                "name": "Authorization",
                "value": "Basic #"
              }
            },
            "qos/ratelimit/proxy": {
              "max_rate": 32767,
              "capacity": 32767,
              "every": "1m"
            }
          }
        }
      ],
      "method": "POST"
EOF
  addScopeRBAC
  cat >>${KRAKEND_TMP} <<EOF
    }
EOF
}

function krakPatchEndPoint() {
  QUERY_STRINGS=""
  QUERY_LENGTH=${#QPARAMS[@]}
  if [[ ${QUERY_LENGTH} -gt 0 ]] ; then
    LAST_QUERY_STRING="${QPARAMS[-1]}"
    for QPARAM in ${QPARAMS[@]}; do
      QUERY_STRINGS+="\"${QPARAM}\""
      [[ "${QPARAM}" == "${LAST_QUERY_STRING}" ]] || QUERY_STRINGS+=","
    done
  fi
  cat >>${KRAKEND_TMP} <<EOF
    {
      "endpoint": "${URL_PREFIX}${URL_VERSION}${1}",
      "@comment": "${ID}",
      "output_encoding": "no-op",
      "input_headers": ["Content-Type", "Accept"],
      "input_query_strings": [${QUERY_STRINGS}],
      "backend": [
        {
          "url_pattern": "${URL_PREFIX}${URL_VERSION}${1}",
          "encoding": "no-op",
          "sd": "dns",
          "sd_scheme": "https",
          "host": ["_https._tcp.apiserver.mni.merkator.local"],
          "disable_host_sanitize": true,
          "extra_config": {
            "modifier/martian": {
              "header.Modifier": {
                "scope": ["request"],
                "name": "Authorization",
                "value": "Basic #"
              }
            },
            "qos/ratelimit/proxy": {
              "max_rate": 32767,
              "capacity": 32767,
              "every": "1m"
            }
          }
        }
      ],
      "method": "PATCH"
EOF
  addScopeRBAC
  cat >>${KRAKEND_TMP} <<EOF
    }
EOF
}

function krakDeleteEndPoint() {
  QUERY_STRINGS=""
  QUERY_LENGTH=${#QPARAMS[@]}
  if [[ ${QUERY_LENGTH} -gt 0 ]] ; then
    LAST_QUERY_STRING="${QPARAMS[-1]}"
    for QPARAM in ${QPARAMS[@]}; do
      QUERY_STRINGS+="\"${QPARAM}\""
      [[ "${QPARAM}" == "${LAST_QUERY_STRING}" ]] || QUERY_STRINGS+=","
    done
  fi
  cat >>${KRAKEND_TMP} <<EOF
    {
      "endpoint": "${URL_PREFIX}${URL_VERSION}${1}",
      "@comment": "${ID}",
      "output_encoding": "no-op",
      "input_headers": [],
      "input_query_strings": [${QUERY_STRINGS}],
      "backend": [
        {
          "url_pattern": "${URL_PREFIX}${URL_VERSION}${1}",
          "encoding": "no-op",
          "sd": "dns",
          "sd_scheme": "https",
          "host": ["_https._tcp.apiserver.mni.merkator.local"],
          "disable_host_sanitize": true,
          "extra_config": {
            "modifier/martian": {
              "header.Modifier": {
                "scope": ["request"],
                "name": "Authorization",
                "value": "Basic #"
              }
            },
            "qos/ratelimit/proxy": {
              "max_rate": 32767,
              "capacity": 32767,
              "every": "1m"
            }
          }
        }
      ],
      "method": "DELETE"
EOF
  addScopeRBAC
  cat >>${KRAKEND_TMP} <<EOF
    }
EOF
}

function krakHead() {
  cat >>${KRAKEND_TMP} <<EOF
{
  "\$schema": "https://www.krakend.io/schema/krakend.json",
  "version": 3,
  "name": "MNI",
  "client_tls": {
    "@comment": "Skip SSL verification when connecting to backends",
    "allow_insecure_connections": false
  },
  "extra_config": {
    "security/cors": {
      "allow_origins": ["*"],
      "expose_headers": ["Content-Length", "Content-Type"],
      "max_age": "12h",
      "allow_methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
      "allow_headers": ["Accept", "Content-Type"]
    },
    "telemetry/logging": {
      "level": "WARNING",
      "prefix": "[KRAKEND]",
      "syslog": false,
      "stdout": true,
      "format": "default",
      "syslog_facility": "local3"
    },
    "security/http": {
      "allowed_hosts": [],
      "ssl_proxy_headers": {},
      "sts_seconds": "31536000"
    },
    "security/cors": {
      "allow_origins": ["*"],
      "allow_methods": ["POST", "GET", "DELETE", "PATCH", "PUT"],
      "allow_headers": ["Origin", "Authorization", "Accept", "Content-Type"],
      "expose_headers": ["Content-Length"],
      "max_age": "12h"
    }
  },
  "timeout": "3000ms",
  "cache_ttl": "300s",
  "output_encoding": "json",
  "port": 8443,
  "listen_ip": "0.0.0.0",
  "tls": {
    "public_key": "/etc/mni/apiGateway.crt",
    "private_key": "/etc/mni/apiGateway.key"
  },
  "endpoints": [
EOF
}

function quit() {
  unset URL_PATHS
  unset PARAMS
  unset METHODS
  rm -f /tmp/krakend.???????? &>/dev/null
  exit ${RETVAL}
}

# main
alert "MNI API Gateway (KrakenD) Config Generation"

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

KRAKEND_TMP=$(mktemp -q -p /tmp krakend.XXXXXXXX)

doing "- Parsing OpenAPI definition"
krakHead
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
        krakGetEndPoint "${URL_PATH}"
        ;;
   PUT) 
        krakPutEndPoint "${URL_PATH}"
        ;;
   POST)
        krakPostEndPoint "${URL_PATH}"
        ;;
   PATCH) 
        krakPatchEndPoint "${URL_PATH}"
        ;;
   DELETE)
        krakDeleteEndPoint "${URL_PATH}"
        ;;
   *)   warning "Unsupported method ${METHOD^^}"
        ;;
  esac
  [[ ${METHODS_IDX} -lt ${METHODS_LENGTH} ]] && echo "," >>${KRAKEND_TMP}
 done
 [[ ${URL_PATHS_IDX} -lt ${URL_PATHS_LENGTH} ]] && echo "," >>${KRAKEND_TMP}
done
krakTail
RETVAL=0
[[ ${RETVAL} -eq 0 ]] && echo "- ok" || echo "- fail"

doing "- Creating KrakenD JSON configuration file"
cat "${KRAKEND_TMP}" | jq -e > "${KRAKEND_JSON}"
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && echo "- ok" || echo "- fail"

quit