#!/bin/bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - DNS Server Uninstaller
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
alert "MNI host firewall"

[[ $(id -u) -ne 0 ]] && exit 1
[[ -f "${ENV}" ]] || exit 1

doing "Removing active firewall chains and rules"
iptables -F && \
iptables -X && \
iptables -P INPUT -j ACCEPT && \
iptables -P OUTPUT -j ACCEPT && \
iptables -P FORWARD -j ACCEPT && \
ip6tables -F && \
ip6tables -X && \
ip6tables -P INPUT -j ACCEPT && \
ip6tables -P OUTPUT -j ACCEPT && \
ip6tables -P FORWARD -j ACCEPT
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || info "- fail"

doing "Removing persistent netfilter & iptables"
DEBIAN_FRONTEND=noninteractive apt purge -q -y iptables netfilter-persistent iptables-persistent &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Removing persistent netfilter & iptables configuration"
if [[ -d "/etc/iptables" ]] ; then
 rm -R -f /etc/iptables &>/dev/null
 RETVAL=$?
else
 RETVAL=0
fi
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

# tidy
clean_tmp_files

[[ ${RETVAL} -eq 0 ]] && success "- completed" || info "- fail"

exit ${RETVAL}