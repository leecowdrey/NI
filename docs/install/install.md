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
  - [3.1. Functional Architecture](#31-functional-architecture)
- [4. DNS Resolution](#4-dns-resolution)
- [5. MNI Compute Configuration](#5-mni-compute-configuration)
  - [5.1. MNI Wildcard SSL Certificates](#51-mni-wildcard-ssl-certificates)
  - [5.2. - 1. Merkator Legal Statements](#52---1-merkator-legal-statements)
- [6. Merkator Technical Services](#6-merkator-technical-services)
  - [6.1. By email](#61-by-email)
  - [6.2. On the web](#62-on-the-web)
  - [6.3. Technical documentation](#63-technical-documentation)
- [7. Corporate Headquarters](#7-corporate-headquarters)

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

## 3.1. Functional Architecture

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

## 5.1. MNI Wildcard SSL Certificates

MNI requires either a wildcard SSL certificate, other a suitable SSL certificate for every compute environment hosting the following MNI components:

 - API Gateway (`APIGW_*`)
 - API Server (`APISERV_*`)
 - UI Server (`UISERV_*`)
 - Identity and Access Management (`IAM_*`)


## 5.2. - [1. Merkator Legal Statements](#1-merkator-legal-statements)
- [1. Merkator Legal Statements](#1-merkator-legal-statements)
  - [1.1. Export restrictions](#11-export-restrictions)
  - [1.2. Disclaimer](#12-disclaimer)
  - [1.3. Limitation of liability](#13-limitation-of-liability)
  - [1.4. Trademarks](#14-trademarks)
  - [1.5. Patent marking notice](#15-patent-marking-notice)
- [2. Target Audience](#2-target-audience)
- [3. Introduction](#3-introduction)
  - [3.1. Functional Architecture](#31-functional-architecture)
- [4. DNS Resolution](#4-dns-resolution)
- [5. MNI Compute Configuration](#5-mni-compute-configuration)
  - [5.1. MNI Wildcard SSL Certificates](#51-mni-wildcard-ssl-certificates)
  - [5.2. - 1. Merkator Legal Statements](#52---1-merkator-legal-statements)
- [6. Merkator Technical Services](#6-merkator-technical-services)
  - [6.1. By email](#61-by-email)
  - [6.2. On the web](#62-on-the-web)
  - [6.3. Technical documentation](#63-technical-documentation)
- [7. Corporate Headquarters](#7-corporate-headquarters)

The file `/etc/mni/mni.ini` supports the following MNI functional components:

 - Alert Service (`ALERTSRV_*`)
 - API Gateway (`APIGW_*`)
 - API Server (`APISERV_*`)
 - Fetch Service (`FETCHSRV_*`)
 - UI Server (`UISERV_*`)
 - Identity and Access Management (`IAM_*`)
 - Local DNS Server (`DNSSERV_*`)

> *note*: Some of the configuration items are automatically determined during installation, these include hostname/address and service credentials.

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
MNI_BUILD="1752853637"
MNI_VERSION="1.0.0"
#
# alertService
#
ALERTSRV_DEBUG=true
ALERTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=120000
ALERTSRV_ENDPOINT_RETRY_INTERVAL_MS=5000
ALERTSRV_HOST_SERVICE_LOG_FILE="/var/log/mni/alert.log"
ALERTSRV_HOST_SERVICE_SYSTEMD="mnialert.service"
ALERTSRV_HOST_SERVICE_USERNAME="mnialert"
ALERTSRV_SERVICE_KEY=""
ALERTSRV_SERVICE_USERNAME=""
ALERTSRV_TLS_INSECURE_CONNECTIONS=true
ALERTSRV_WORKING_DIRECTORY="/usr/local/mni/alertService"
#
# apiGateway
#
APIGW_ADDRESS=
APIGW_HOST_SERVICE_LOG_FILE="/var/log/mni/apigw.log"
APIGW_HOST_SERVICE_SYSTEMD="mniapigw.service"
APIGW_HOST_SERVICE_USERNAME="mniapigw"
APIGW_IGNORE_AUTH_VALIDATOR=true
APIGW_PORT=8443
APIGW_PROXY_RATE_LIMIT_REQUESTS=32767
APIGW_PROXY_CAPACITY_REQUESTS=32767
APIGW_PROXY_RATE_LIMIT_EVERY="1m"
APIGW_TLS_INSECURE_CONNECTIONS=true
APIGW_SSL_CERT="apigw.crt"
APIGW_SSL_CSR="apigw.csr"
APIGW_SSL_DAYS=90
APIGW_SSL_KEY="apigw.key"
APIGW_SSL_SIZE=4096
APIGW_VERSION="0.0.1"
APIGW_KRAKEND_VERSION="2.9.1"
APIGW_WORKING_DIRECTORY="/usr/local/mni/apigw"
#
# apiServer
#
APISERV_ADDRESS="127.0.0.1"
APISERV_API_DIRECTORY="/usr/local/mni/api/openapi"
APISERV_BACKUP_DIRECTORY="/usr/local/mni/api/backup"
APISERV_DEBUG=true
APISERV_DUCKDB_BACKUP_CRONTIME="0 2 * * *"
APISERV_DUCKDB_BACKUP=true
APISERV_DUCKDB_FILE="/usr/local/mni/api/mni.duckdb"
APISERV_DUCKDB_MAX_MEMORY="1GB"
APISERV_DUCKDB_PRUNE=true
APISERV_DUCKDB_THREADS=4
APISERV_DUCKDB_VERSION="v1.2.2"
APISERV_ENCRYPTION_KEY=""
APISERV_ENCRYPTION_IV=""
APISERV_KEEPALIVE=true
APISERV_HOST_SERVICE_LOG_FILE="/var/log/mni/api.log"
APISERV_HOST_SERVICE_SYSTEMD="mniapi.service"
APISERV_HOST_SERVICE_USERNAME="mniapi"
APISERV_PORT=7443
APISERV_PREMISES_PASSED_BOUNDARY_DISTANCE=25
APISERV_SERVICE_KEY=""
APISERV_SERVICE_USERNAME=""
APISERV_SPATIAL_UPDATE_GEOMETRY_CRONTIME="*/5 * * * *"
APISERV_SSL_CERT="api.crt"
APISERV_SSL_CSR="api.csr"
APISERV_SSL_DAYS=90
APISERV_SSL_KEY="api.key"
APISERV_SSL_SIZE=4096
APISERV_TICK_INTERVAL_MS=60000
APISERV_TIMEOUT_KEEPALIVE=5000
APISERV_TIMEOUT_REQUEST=300000
APISERV_DOCUMENT_DIRECTORY="/usr/local/mni/api/document"
APISERV_UPLOAD_DIRECTORY="/usr/local/mni/api/upload"
APISERV_URL_PREFIX="/mni"
APISERV_URL_VERSION="/v1"
APISERV_USE_DNS_SD=false
APISERV_WORKING_DIRECTORY="/usr/local/mni/api"
#
# fetchService
#
FETCHSRV_SERVICE_KEY=""
FETCHSRV_SERVICE_USERNAME=""
FETCHSRV_CVE_SCAN=true
FETCHSRV_CVE_DIRECTORY="/usr/local/mni/cvelistV5"
FETCHSRV_CVE_PULL_CRONTIME="00 20 * * *"
FETCHSRV_CVE_BUILD_CRONTIME="30 20 * * *"
FETCHSRV_DEBUG=true
FETCHSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=120000
FETCHSRV_ENDPOINT_RETRY_INTERVAL_MS=5000
FETCHSRV_FX_URL="https://api.exchangeratesapi.io/v1/latest"
FETCHSRV_FX_CRONTIME="0 9 * * 1-5"
FETCHSRV_FX_UPDATE=true
FETCHSRV_HOST_SERVICE_LOG_FILE="/var/log/mni/fetch.log"
FETCHSRV_HOST_SERVICE_SYSTEMD="mnifetch.service"
FETCHSRV_HOST_SERVICE_USERNAME="mnifetch"
FETCHSRV_SERVICE_KEY=""
FETCHSRV_SERVICE_USERNAME=""
FETCHSRV_TLS_INSECURE_CONNECTIONS=true
FETCHSRV_WORKING_DIRECTORY="/usr/local/mni/fetch"
#
# uiServer
#
UISERV_ADDRESS=""
UISERV_DIST_DIRECTORY="/usr/local/mni/ui/dist"
UISERV_DEBUG=true
UISERV_DNS_RESOLVE=300000
UISERV_HOST_SERVICE_LOG_FILE="/var/log/mni/ui.log"
UISERV_HOST_SERVICE_SYSTEMD="mniui.service"
UISERV_HOST_SERVICE_USERNAME="mniui"
UISERV_PORT=4443
UISERV_SSL_CERT="ui.crt"
UISERV_SSL_CSR="ui.csr"
UISERV_SSL_DAYS=90
UISERV_SSL_KEY="ui.key"
UISERV_SSL_SIZE=4096
UISERV_TIMEOUT_REQUEST=120000
UISERV_TICK_INTERVAL_MS=60000
UISERV_URL_PREFIX="/mni"
UISERV_USE_DNS_SD=false
UISERV_WORKING_DIRECTORY="/usr/local/mni/ui"
#
# IAM
#
IAM_ADDRESS="127.0.0.1"
IAM_AUTHENTIK_SECRET_KEY=
IAM_BOOTSTRAP_EMAIL="admin@marlindt.net"
IAM_BOOTSTRAP_PASSWORD="akadmin"
IAM_BOOTSTRAP_TOKEN=""
IAM_DEBUG=true
IAM_EMAIL_FROM="ni@marlindt.net"
IAM_EMAIL_HOST="smtp.fastmail.com"
IAM_EMAIL_PASSWORD="password123&#"
IAM_EMAIL_PORT=465
IAM_EMAIL_TIMEOUT=10
IAM_EMAIL_USE_SSL=true
IAM_EMAIL_USE_TLS=false
IAM_EMAIL_USERNAME="ni@marlindt.net"
IAM_HOST_SERVICE_LOG_FILE="/var/log/mni/iam.log"
IAM_HOST_SERVICE_SYSTEMD="mniiam.service"
IAM_HOST_SERVICE_USERNAME="mniiam"
IAM_PG_PASS=
IAM_PORT_HTTP=6000
IAM_PORT_HTTPS=6443
IAM_SSL_CERT="iam.crt"
IAM_SSL_CSR="iam.csr"
IAM_SSL_DAYS=90
IAM_SSL_KEY="iam.key"
IAM_SSL_SIZE=4096
IAM_URL_SUFFIX="/application/o/marlin/.well-known/openid-configuration"
#https://authentik.merkator.com/application/saml/marlin-blazor/sso/binding/init/
IAM_WORKING_DIRECTORY="/usr/local/mni/iam"
#
# predictService
#
PREDICTSRV_CRONTIME="0 0 * * *"
PREDICTSRV_DEBUG=true
PREDICTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=120000
PREDICTSRV_ENDPOINT_RETRY_INTERVAL_MS=5000
PREDICTSRV_HOST_SERVICE_LOG_FILE="/var/log/mni/predict.log"
PREDICTSRV_HOST_SERVICE_SYSTEMD="mnipredict.service"
PREDICTSRV_HOST_SERVICE_USERNAME="mnipredict"
PREDICTSRV_SERVICE_KEY=""
PREDICTSRV_SERVICE_USERNAME=""
PREDICTSRV_TLS_INSECURE_CONNECTIONS=true
PREDICTSRV_WORKING_DIRECTORY="/usr/local/mni/predict"
#
# dnsServer
#
DNSSERV_ADDRESS=
DNSSERV_DOMAIN="merkator.local"
DNSSERV_HOST_SERVICE_LOG_FILE="/var/log/mni/dns.log"
DNSSERV_HOST_SERVICE_SYSTEMD="mnidns.service"
DNSSERV_HOST_SERVICE_USERNAME="mnidns"
DNSSERV_HOST="mni"
DNSSERV_INSTALL=false
DNSSERV_PORT=53
DNSSERV_RESOLVCONF=1
DNSSERV_SYSTEMD_RESOLVE=1
DNSSERV_VERSION="2.70"
DNSSERV_WORKING_DIRECTORY="/usr/local/mni/dns"
#
```

---

# 6. Merkator Technical Services

For technical support, you can contact Merkator by email, or on the web.

## 6.1. By email

Customer Service Management may be reached at: [support@marlindt.net](mailto:support@marlindt.net).

## 6.2. On the web

Please visit [https://support.marlindt.net/](https://support.marlindt.net/). To obtain access, you must provide your support contracted email address.

## 6.3. Technical documentation

The latest technical documentation for products is now available on the [Customer Service Management](https://support.marlindt.net/).
Make sure you have an account to access the content. 


---

# 7. Corporate Headquarters

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
