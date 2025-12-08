  #=====================================================================
# Network Insight (NI) - Common BASH Tools
#
# Corporate Headquarters:
# Cowdrey Consulting · United Kingdom · T:+447442104556 
# https://www.cowdrey.net/
#
# © 2026 Cowdrey Consulting. All rights reserved.
#=====================================================================
CURL_TIMEOUT=20
# Common RegEx patterns
MADDR_REGEX="^([0-9a-f]{2}:){5}[0-9a-f]{2}$"
IPADDR_REGEX="^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$"
SUBNETBITS_REGEX="^[0-9]{1,2}$"

#
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

function clean_tmp_files() {
  # $(mktemp -q -p /tmp ni.XXXXXXXX)
  local RETVAL=0
  rm -f /tmp/ni.???????? &> /dev/null
  return ${RETVAL}
}

