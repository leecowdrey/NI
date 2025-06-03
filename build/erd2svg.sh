#!/bin/bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - ERD to SVG Generate
#
# Corporate Headquarters:
# Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
# https://www.merkator.com/
#
# © 2024-2025 Merkator nv/sa. All rights reserved.
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

doing "Checking for NodeJS"
which node &> /dev/null || (curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh && bash nodesource_setup.sh && apt update && apt install -y nodejs)
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"
which npm &> /dev/null || exit 1

doing "Mermaid ERD to SVG"
npx -y -p @mermaid-js/mermaid-cli mmdc -i docs/data-model/er-diagram.mermaid -o docs/data-model/mni-model.svg -e svg &>/dev/null && \
git diff --quiet docs/data-model/mni-model.svg &>/dev/null || git add -f docs/data-model/mni-model.svg
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

popd &>/dev/null
exit ${RETVAL}
