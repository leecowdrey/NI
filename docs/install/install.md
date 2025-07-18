---
title: MarlinDT Network Intelligence (MNI) Installation Guide
category: how-to
contacts:
  - support@marlindt.net
creator: Merkator nv/sa
url: https://www.merkator.com/
paginate: true
lang: en-GB
date: 2025-01-01
keywords:
  - merkator
  - marlindt
  - mni
  - pni
  - lni
  - digital-twin
draft: true
---

<h1>MNI Installation Guide</h1>


- [1. Merkator Legal Statements](#1-merkator-legal-statements)
  - [1.1. Export restrictions](#11-export-restrictions)
  - [1.2. Disclaimer](#12-disclaimer)
  - [1.3. Limitation of liability](#13-limitation-of-liability)
  - [1.4. Trademarks](#14-trademarks)
  - [1.5. Patent marking notice](#15-patent-marking-notice)
- [2. Target Audience](#2-target-audience)
- [3. Introduction](#3-introduction)
  - [Functional Architecture](#functional-architecture)
- [4. DNS Resolution](#4-dns-resolution)
- [5. MNI Compute Configuration](#5-mni-compute-configuration)
- [5.1 Configuration File](#51-configuration-file)
- [5. Merkator Technical Services](#5-merkator-technical-services)
  - [5.1. By email](#51-by-email)
  - [5.2. On the web](#52-on-the-web)
  - [5.3. Technical documentation](#53-technical-documentation)
- [6. Corporate Headquarters](#6-corporate-headquarters)

---

# 1. Merkator Legal Statements

MarlinDT Network Intelligence (MNI) © 2024-2025 Merkator nv/sa. All rights reserved.

No part of this content may be reproduced in any form or by any means or used to make any derivative work (such as translation, transformation, or adaptation) without written permission from Merkator nv/sa and/or its affiliates (“Merkator”). Merkator reserves the right to revise or change this content from time to time without obligation on the part of Merkator to provide notification of such revision or change.

## 1.1. Export restrictions

These products and associated technical data (in print or electronic form) may be subject to export control laws of the United States of America. It is your responsibility to determine the applicable regulations and to comply with them. The following notice is applicable for all products or technology subject to export control.
These items are controlled by the U.S. government and authorized for export only to the country of ultimate destination for use by the ultimate consignee or end-user(s) herein identified. They may not be resold, transferred, or otherwise disposed of, to any other country or to any person other than the authorized ultimate consignee or end-user(s), either in their original form or after being incorporated into other items, without first obtaining approval from the U.S. government or as otherwise authorized by U.S. law and regulations.

## 1.2. Disclaimer

THIS CONTENT AND ASSOCIATED PRODUCTS OR SERVICES (“MATERIALS”), ARE PROVIDED “AS IS” AND WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE PURSUANT TO APPLICABLE LAW, Merkator DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON- INFRINGEMENT, FREEDOM FROM COMPUTER VIRUS, AND WARRANTIES ARISING FROM COURSE OF DEALING OR COURSE OF PERFORMANCE. Merkator does not represent or warrant that the functions described or contained in the Materials will be uninterrupted or error-free, that defects will be corrected, or are free of viruses or other harmful components. Merkator does not make any warranties or representations regarding the use of the Materials in terms of their completeness, correctness, accuracy, adequacy, usefulness, timeliness, reliability, or otherwise. As a condition of your use of the Materials, you warrant to Merkator that you will not make use thereof for any purpose that is unlawful or prohibited by their associated terms of use.

## 1.3. Limitation of liability

IN NO EVENT SHALL Merkator, Merkator AFFILIATES, OR THEIR OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, SUPPLIES, LICENSORS, AND THIRD-PARTY PARTNERS, BE LIABLE FOR ANY DIRECT, INDIRECT, SPECIAL, PUNITIVE, INCIDENTAL, EXEMPLARY OR CONSEQUENTIAL DAMAGES, OR ANY DAMAGES WHATSOEVER, EVEN IF Merkator HAS BEEN PREVIOUSLY ADVISED OF THE POSSIBILITY OF SUCH DAMAGES, WHETHER IN AN ACTION UNDER CONTRACT,TORT, OR ANY OTHER THEORY ARISING FROM YOUR ACCESS TO, OR USE OF, THE MATERIALS. Because some jurisdictions do not allow limitations on how long an implied warranty lasts, or the exclusion or limitation of liability for consequential or incidental damages, some of the above limitations may not apply to you.

## 1.4. Trademarks

All trademarks identified by ™ or ® are trademarks or registered trademarks in the US and may be registered in other countries. All product names, trademarks, and registered trademarks are property of their respective owners.

## 1.5. Patent marking notice

For applicable patents, see [www.cs-pat.com](https://www.cs-pat.com). That website is intended to give notice under 35 U.S.C. § 287(a) of articles that are patented or for use under the identified patents. That website identifies the patents associated with each of the patented articles.

---

# 2. Target Audience

It is expected Network Engineering IT/Developer resources will undertake any integrations and such resources are proficient in the following areas:

- RESTful HTTP
- Data Engineering

> **Note:** *Professional Services* are available from Merkator to provide knowledge transfer and/or undertake any such integration.

---

# 3. Introduction

TBD.

## Functional Architecture

Suitable for standalone integration, lab, proof of concepts and low-yield production usage.

*Note*: all Debian hosts shown can be combined into single host, either bare-metal or virtual

![deployment architecture](./mni-architectures-Deployment.svg)

---

# 4. DNS Resolution

MNI makes use of DNS resolution via DNS server (`SRV`) records to locate MNI components. This is used for both horizontal and vertical scaling.

 
``` 
Type	
Domain Record
	Data	TTL
A	apiserver.{hostname}.merkator.com	127.0.0.1	3600
A	predict.{hostname}.merkator.com	127.0.0.1	3600
A	{hostname}.merkator.com	192.168.1.16	3600
SRV	_https._tcp.apiserver.{hostname}.merkator.com	0 10 7443 apiserver.{hostname}.merkator.com	3600
SRV	_https._tcp.predict.{hostname}.merkator.com	0 10 6443 predict.{hostname}.merkator.com	3600
SRV	_https._tcp.gateway.{hostname}.merkator.com	0 10 8443 {hostname}.merkator.com	3600
SRV	_https._tcp.iam.{hostname}.merkator.com	0 10 5443 {hostname}.merkator.com	3600
```	 	 
 
Change {hostname}.merkator.com to whatever the VM reported (or was told) its fully qualified hostname was before defining the DNS records. You can change the time-to-live (TTL) to a one day (86400) when you happy the resolution is working.
 
You can verify via Linux as follows (replace x.x.x.x with DNS server IP or just remove @x.x.x.x)
 
```bash
dig @x.x.x.x +short _https._tcp.apiserver.{hostname}.merkator.com SRV
dig @x.x.x.x +short apiserver.{hostname}.merkator.com A
```

You should get something like this if all working correctly:
```bash
$ dig +short _https._tcp.apiserver.ni.marlindt.net SRV
0 10 7443 apiserver.ni.marlindt.net.
$ dig +short apiserver.ni.marlindt.net A
127.0.0.1
$ dig +short _https._tcp.gateway.ni.marlindt.net SRV
0 10 8443 ni.marlindt.net.
$ dig +short ni.marlindt.net A
89.213.196.18
```

---

# 5. MNI Compute Configuration

Each compute environment hosting MNI components must contain a MNI configuration file. This file can be found at `/etc/mni/mni.ini` and is automatically created if not found during installation.

> *note*: The contents of the configuration file should be manually updated and synchronised between all compute environments as the MNI functional components will read some of the configuration of other components.

# 5.1 Configuration File

The file `/etc/mni/mni.ini` supports the following MNI functional components:
 - Alert Service (`ALERTSRV_*`)
 - API Gateway (`APIGW_*`)
 - API Server (`APISERV_*`)
 - Fetch Service (`FETCHSRV_*`)
 - UI Server (`UISERV_*`)
 - Identity and Access Management (`IAM_*`)
 - Local DNS Server (`DNSSERV_*`)

```bash
#=====================================================================
# MarlinDT Network Intelligence (MNI) - Deployment Environment File
#
# Corporate Headquarters:
# Merkator · Vliegwezenlaan 48 · 1731 Zellik · Belgium · T:+3223092112
# https://www.merkator.com/
#
# © 2024-2025 Merkator nv/sa. All rights reserved.
#=====================================================================
#
# Common
#
CONFIG_DIRECTORY="/etc/mni"
HOST_SERVICE_GROUP="mni"
MNI_NAME="MarlinDT Network Intelligence"
MNI_BUILD="20250228.47"
MNI_VERSION="1.0.0"
#
# apiGateway
#
APIGW_ADDRESS="127.0.0.1"
APIGW_HOST_SERVICE_LOG_FILE="/var/log/mni/apiGateway.log"
APIGW_HOST_SERVICE_SYSTEMD="apiGateway.service"
APIGW_HOST_SERVICE_USERNAME="mniapigw"
APIGW_PORT=8443
APIGW_PROXY_RATE_LIMIT_REQUESTS=32767
APIGW_PROXY_CAPACITY_REQUESTS=32767
APIGW_PROXY_RATE_LIMIT_EVERY="1m"
APIGW_TLS_INSECURE_CONNECTIONS=true
APIGW_SSL_CERT="apiGateway.crt"
APIGW_SSL_CSR="apiGateway.csr"
APIGW_SSL_DAYS=90
APIGW_SSL_KEY="apiGateway.key"
APIGW_SSL_SIZE=4096
APIGW_VERSION="0.0.1"
APIGW_KRAKEND_VERSION="2.9.1"
APIGW_WORKING_DIRECTORY="/usr/local/mni/apiGateway"
#
# alertService
#
ALERTSRV_CVE_SCAN=true
ALERTSRV_CVE_DIRECTORY="/usr/local/mni/cvelistV5"
ALERTSRV_CVE_PULL_CRONTIME="00 20 * * *"
ALERTSRV_DEBUG=true
ALERTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=120000
ALERTSRV_ENDPOINT_RETRY_INTERVAL_MS=5000
ALERTSRV_FX_KEY="e4019019382030ba138a0ebf0f006bce"
ALERTSRV_FX_URL="https://api.exchangeratesapi.io/v1/latest"
ALERTSRV_FX_CRONTIME="0 9 * * 1-5"
ALERTSRV_FX_UPDATE=true
ALERTSRV_HOST_SERVICE_LOG_FILE="/var/log/mni/alertService.log"
ALERTSRV_HOST_SERVICE_SYSTEMD="alertService.service"
ALERTSRV_HOST_SERVICE_USERNAME="mnialert"
ALERTSRV_TIMESTAMP_FORMAT="YYYYMMDD[T]HHmmss"
ALERTSRV_TLS_INSECURE_CONNECTIONS=true
ALERTSRV_WORKING_DIRECTORY="/usr/local/mni/alertService"
#
# apiServer
#
APISERV_ADDRESS="0.0.0.0"
APISERV_API_DIRECTORY="/usr/local/mni/apiServer/api"
APISERV_BACKUP_DIRECTORY="/usr/local/mni/apiServer/backup"
APISERV_DEBUG=true
APISERV_PRUNE_CRONTIME="0 * * * *"
APISERV_DUCKDB_VERSION="v1.2.2"
APISERV_DUCKDB_BACKUP_CRONTIME="0 2 * * *"
APISERV_DUCKDB_BACKUP=true
APISERV_DUCKDB_PRUNE=true
APISERV_DUCKDB_FILE="/Users/lee/mni/mni.duckdb"
APISERV_DUCKDB_MAX_MEMORY="1GB"
APISERV_DUCKDB_THREADS=4
APISERV_HOST_SERVICE_LOG_FILE="/var/log/mni/apiServer.log"
APISERV_HOST_SERVICE_SYSTEMD="apiServer.service"
APISERV_HOST_SERVICE_USERNAME="mniapi"
APISERV_PORT=7443
APISERV_PREMISES_PASSED_BOUNDARY_DISTANCE=50
APISERV_WEBSOCKET_ADDRESS="192.168.1.16"
APISERV_WEBSOCKET_PORT=5443
APISERV_SERVICE_USERNAME="364912b2af3d4da4275ef6b9886380f6caf274b5aacb812e"
APISERV_SERVICE_KEY="kveOtGzA5y75a6I8MhSW97iEKIGVwt2NFZbbqGBJBprG6ndA7kR3xVpZy/mp26MKtTJjb+O86TCYFWkW"
APISERV_SPATIAL_UPDATE_GEOMETRY_CRONTIME="*/5 * * * *"
APISERV_SSL_CERT="apiServer.crt"
APISERV_SSL_CSR="apiServer.csr"
APISERV_SSL_DAYS=90
APISERV_SSL_KEY="apiServer.key"
APISERV_SSL_SIZE=4096
APISERV_TIMESTAMP_FORMAT="YYYYMMDD[T]HHmmss"
APISERV_TIMEOUT_REQUEST=120000
APISERV_TICK_INTERVAL_MS=60000
APISERV_URL_PREFIX="/mni"
APISERV_URL_VERSION="/v1"
APISERV_USE_DNS_SD=false
APISERV_WORKING_DIRECTORY="/usr/local/mni/apiServer"
#
# uiServer
#
UISERV_ADDRESS="127.0.0.1"
UISERV_DEBUG=true
UISERV_DNS_RESOLVE=300000
UISERV_DIST_DIRECTORY="/usr/local/mni/apiServer/dist"
UISERV_HOST_SERVICE_LOG_FILE="/var/log/mni/uiServer.log"
UISERV_HOST_SERVICE_SYSTEMD="uiServer.service"
UISERV_HOST_SERVICE_USERNAME="mniui"
UISERV_PORT=4443
UISERV_SSL_CERT="uiServer.crt"
UISERV_SSL_CSR="uiServer.csr"
UISERV_SSL_DAYS=90
UISERV_SSL_KEY="uiServer.key"
UISERV_SSL_SIZE=4096
UISERV_TIMESTAMP_FORMAT="YYYYMMDD[T]HHmmss"
UISERV_TIMEOUT_REQUEST=120000
UISERV_TICK_INTERVAL_MS=60000
UISERV_URL_PREFIX="/mni"
UISERV_USE_DNS_SD=false
UISERV_WORKING_DIRECTORY="/usr/local/mni/uiServer"
#
# IAM
#
IAM_ADDRESS="127.0.0.1"
IAM_AUTHENTIK_SECRET_KEY="H9MDP6dK64fsYa/dkP4Gi8pUKEP2OuvRxM0XqjXZ23JM9MKOUlTEKztgimamkXMN/ELfyu/stc6aiAse"
IAM_BOOTSTRAP_PASSWORD="akadmin"
IAM_BOOTSTRAP_TOKEN="qlcALCld8UQpNrkiAN1WVg2Qu4ztiDL2kPEN2Sui9ai740UL"
IAM_BOOTSTRAP_EMAIL="admin@marlindt.net"
IAM_DEBUG=true
IAM_EMAIL_FROM="ni@marlindt.net"
IAM_EMAIL_HOST="smtp.fastmail.com"
IAM_EMAIL_PASSWORD="password123&#"
IAM_EMAIL_PORT=465
IAM_EMAIL_TIMEOUT=10
IAM_EMAIL_USE_SSL=true
IAM_EMAIL_USE_TLS=false
IAM_EMAIL_USERNAME="ni@marlindt.net"
IAM_HOST_SERVICE_LOG_FILE="/var/log/mni/iamServer.log"
IAM_HOST_SERVICE_SYSTEMD="iamServer.service"
IAM_HOST_SERVICE_USERNAME="mniiam"
IAM_PG_PASS="DjqKw+yxgShTUKf/qqeRXKxVl1uwdvLNszowO9lToEGLUfvA"
IAM_PORT_HTTP=6000
IAM_PORT_HTTPS=6443
IAM_SSL_CERT="iamServer.crt"
IAM_SSL_CSR="iamServer.csr"
IAM_SSL_DAYS=90
IAM_SSL_KEY="iamServer.key"
IAM_SSL_SIZE=4096
IAM_WORKING_DIRECTORY="/usr/local/mni/iamServer"
#
# predictSrv
#
PREDICTSRV_CRONTIME="0 0 * * *"
PREDICTSRV_DEBUG=true
PREDICTSRV_TLS_INSECURE_CONNECTIONS=true
PREDICTSRV_ENDPOINT_RETRY_INTERVAL_MS=5000
PREDICTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=120000
PREDICTSRV_HOST_SERVICE_LOG_FILE="/var/log/mni/predictSrv.log"
PREDICTSRV_HOST_SERVICE_SYSTEMD="PREDICT.service"
PREDICTSRV_HOST_SERVICE_USERNAME="mnipredict"
PREDICTSRV_TIMESTAMP_FORMAT="YYYYMMDD[T]HHmmss"
PREDICTSRV_WORKING_DIRECTORY="/usr/local/mni/predictSrv"
#
# dnsServer
#
DNSSERV_INSTALL=true
DNSSERV_ADDRESS="127.0.0.1"
DNSSERV_VERSION="2.70"
DNSSERV_HOST_SERVICE_LOG_FILE="/var/log/mni/dnsServer.log"
DNSSERV_HOST_SERVICE_SYSTEMD="dnsServer.service"
DNSSERV_HOST_SERVICE_USERNAME="mnidns"
DNSSERV_PORT=53
DNSSERV_HOST="marlinintegration"
DNSSERV_DOMAIN="merkator.com"
DNSSERV_SYSTEMD_RESOLVE=1
DNSSERV_RESOLVCONF=0
#
```

---

# 5. Merkator Technical Services

For technical support, you can contact Merkator by email, or on the web.

## 5.1. By email

Customer Service Management may be reached at: [support@marlindt.net](mailto:support@marlindt.net).

## 5.2. On the web

Please visit [https://support.marlindt.net/](https://support.marlindt.net/). To obtain access, you must provide your support contracted email address.

## 5.3. Technical documentation

The latest technical documentation for products is now available on the [Customer Service Management](https://support.marlindt.net/).
Make sure you have an account to access the content. 


---

# 6. Corporate Headquarters

Merkator nv/sa · Vliegwezenlaan 48 · 1731 Zellik · Belgium<br>
[+3223092112](tel:+3223092112)<br>
[www.merkator.com](https://www.merkator.com)<br>
**MarlinDT Network Intelligence (MNI) © 2024-2025 Merkator nv/sa**

```text
 __  __           _         _                           __         
|  \/  | ___ _ __| | ____ _| |_ ___  _ __   _ ____   __/ /__  __ _ 
| |\/| |/ _ \ '__| |/ / _` | __/ _ \| '__| | '_ \ \ / / / __|/ _` |
| |  | |  __/ |  |   < (_| | || (_) | |    | | | \ V / /\__ \ (_| |
|_|  |_|\___|_|  |_|\_\__,_|\__\___/|_|    |_| |_|\_/_/ |___/\__,_|

```
