#!/bin/bash
#=====================================================================
# Network Insight (NI) - iptables install
#
# Corporate Headquarters:
# Cowdrey Consulting · United Kingdom · T:+447442104556 
# https://www.cowdrey.net/
#
# © 2026 Cowdrey Consulting. All rights reserved.
#=====================================================================
set +H
shopt -s expand_aliases
RETVAL=0
CLI_PATH=$(dirname -- "$( readlink -f -- "$0"; )";)
CLI_NAME="${0##*/}"
ENV="${CLI_PATH}/ni.ini"
source ${CLI_PATH}/common.sh
alert "NI host firewall"

# if existing ni.ini deployed use that
[[ -f "/etc/ni/ni.ini" ]] && ENV="/etc/ni/ni.ini"

# ensure root and have initial tools and config
[[ $(id -u) -ne 0 ]] && exit 1
[[ -f "${ENV}" ]] || exit 1

GOOGLE_DNS_PORT="53"       # standard UDP or TCP
GOOGLE_DNS_DOT_PORT="853"  # DNS-over-TLS (DoT), TCP only
GOOGLE_DNS_DOH_PORT="443"  # DNS-over-HTTPS (DoH), TCP only

SSH_PORT=""
DEFAULT_NIC=""
DNSV4_ADDRESS_1="8.8.8.8"
DNSV4_ADDRESS_2="8.8.4.4"
DNSV6_ADDRESS_1="2001:4860:4860::8888"
DNSV6_ADDRESS_2="2001:4860:4860::8844"
DNSSERV_ADDRESS=$(grep -E "^DNSSERV_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
DNSSERV_PORT="${GOOGLE_DNS_PORT}"
APIGW_ADDRESS=$(grep -E "^APIGW_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APIGW_PORT=$(grep -E "^APIGW_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APISERV_ADDRESS=$(grep -E "^APISERV_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
APISERV_PORT=$(grep -E "^APISERV_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
IAM_ADDRESS=$(grep -E "^IAM_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
IAM_PORT_HTTPS=$(grep -E "^IAM_PORT_HTTPS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
UISERV_ADDRESS=$(grep -E "^UISERV_ADDRESS=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)
UISERV_PORT=$(grep -E "^UISERV_PORT=.*" ${ENV}|cut -d '=' -f2-|cut -d '"' -f2)

# APISERV & PREDICTSRV should be limited to loopback (127.0.0.1)

#INSTALL_TMP=$(mktemp -q -p /tmp ni.XXXXXXXX)

doing "Finding default route interface"
DEFAULT_NIC=$(ip route show 0.0.0.0/0 |grep -oP '(?<=dev ).*(?= onlink)')
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Finding default SSH port"
SSH_PORT=$(grep -oP '(?<=^Port ).*(?=\s*$)' /etc/ssh/sshd_config)
[[ -z "${SSH_PORT}" ]] && SSH_PORT="22"
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Installing persistent netfilter & iptables"
DEBIAN_FRONTEND=noninteractive apt install -q -y iptables netfilter-persistent iptables-persistent &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Adding IPv4 and IPv6 chains and rules"
iptables -F && \
iptables -X && \
iptables -P INPUT -j ACCEPT && \
iptables -P OUTPUT -j ACCEPT && \
iptables -P FORWARD -j ACCEPT && \
iptables -A INPUT -i lo -j ACCEPT && \
iptables -A INPUT -i ${DEFAULT_NIC} -m state --state ESTABLISHED,RELATED -j ACCEPT && \
iptables -A INPUT -p tcp -m tcp -m multiport --dports ${APIGW_PORT},${IAM_PORT_HTTPS},${APIGW_PORT} -m conntrack --ctstate NEW,RELATED,ESTABLISHED -j ACCEPT && \
iptables -A INPUT -p tcp -m tcp --dport ${SSH_PORT} -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT && \
iptables -A INPUT -p icmp --icmp-type 8 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT && \
iptables -A INPUT -p icmp --icmp-type 0 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT && \
iptables -A INPUT -s ${DNSV4_ADDRESS_1}/32 -p udp -m udp --sport ${DNSSERV_PORT} -m state --state ESTABLISHED -j ACCEPT && \
iptables -A INPUT -s ${DNSV4_ADDRESS_2}/32 -p udp -m udp --sport ${DNSSERV_PORT} -m state --state ESTABLISHED -j ACCEPT && \
iptables -A INPUT -i ${DEFAULT_NIC} -j DROP && \
iptables -A FORWARD -j ACCEPT && \
iptables -A OUTPUT -o lo -j ACCEPT && \
iptables -A OUTPUT -p icmp --icmp-type 8 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT && \
iptables -A OUTPUT -p icmp --icmp-type 0 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT && \
iptables -A OUTPUT -d ${DNSV4_ADDRESS_1}/32 -p udp -m udp --dport ${DNSSERV_PORT} -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT && \
iptables -A OUTPUT -d ${DNSV4_ADDRESS_2}/32 -p udp -m udp --dport ${DNSSERV_PORT} -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT && \
iptables -A OUTPUT -o ${DEFAULT_NIC} -j ACCEPT && \
iptables -A OUTPUT -j ACCEPT && \
ip6tables -F && \
ip6tables -X && \
ip6tables -P INPUT -j ACCEPT && \
ip6tables -P OUTPUT -j ACCEPT && \
ip6tables -P FORWARD -j ACCEPT && \
ip6tables -A INPUT -i lo -j ACCEPT && \
ip6tables -A INPUT -i ${DEFAULT_NIC} -m state --state ESTABLISHED,RELATED -j ACCEPT && \
ip6tables -A INPUT -p tcp -m tcp -m multiport --dports ${APIGW_PORT},${IAM_PORT_HTTPS},${APIGW_PORT} -m conntrack --ctstate NEW,RELATED,ESTABLISHED -j ACCEPT && \
ip6tables -A INPUT -p tcp -m tcp --dport ${SSH_PORT} -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT && \
ip6tables -A INPUT -p icmp --icmp-type 8 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT && \
ip6tables -A INPUT -p icmp --icmp-type 0 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT && \
ip6tables -A INPUT -s ${DNSV6_ADDRESS_1}/128 -p udp -m udp --sport ${DNSSERV_PORT} -m state --state ESTABLISHED -j ACCEPT && \
ip6tables -A INPUT -s ${DNSV6_ADDRESS_2}/128 -p udp -m udp --sport ${DNSSERV_PORT} -m state --state ESTABLISHED -j ACCEPT && \
ip6tables -A INPUT -i ${DEFAULT_NIC} -j DROP && \
ip6tables -A FORWARD -j ACCEPT && \
ip6tables -A OUTPUT -o lo -j ACCEPT && \
ip6tables -A OUTPUT -p icmp --icmp-type 8 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT && \
ip6tables -A OUTPUT -p icmp --icmp-type 0 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT && \
ip6tables -A OUTPUT -d ${DNSV6_ADDRESS_1}/128 -p udp -m udp --dport ${DNSSERV_PORT} -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT && \
ip6tables -A OUTPUT -d ${DNSV6_ADDRESS_2}/128 -p udp -m udp --dport ${DNSSERV_PORT} -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT && \
ip6tables -A OUTPUT -o ${DEFAULT_NIC} -j ACCEPT && \
ip6tables -A OUTPUT -j ACCEPT
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

doing "Saving rules"
netfilter-persistent save &>/dev/null
RETVAL=$?
[[ ${RETVAL} -eq 0 ]] && success "- ok" || error "- fail"

# tidy
clean_tmp_files

[[ ${RETVAL} -eq 0 ]] && success "- completed" || error "- fail"

exit ${RETVAL}