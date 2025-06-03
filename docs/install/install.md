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
- [4. Merkator Technical Services](#4-merkator-technical-services)
  - [4.1. By email](#41-by-email)
  - [4.2. On the web](#42-on-the-web)
  - [4.3. Technical documentation](#43-technical-documentation)
- [5. Corporate Headquarters](#5-corporate-headquarters)

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

I will also need some DNS entries added to merkator.com (I believe that it what the server/VM was listed under):
 
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

# 4. Merkator Technical Services

For technical support, you can contact Merkator by email, or on the web.

## 4.1. By email

Customer Service Management may be reached at: [support@marlindt.net](mailto:support@marlindt.net).

## 4.2. On the web

Please visit [https://support.marlindt.net/](https://support.marlindt.net/). To obtain access, you must provide your support contracted email address.

## 4.3. Technical documentation

The latest technical documentation for products is now available on the [Customer Service Management](https://support.marlindt.net/).
Make sure you have an account to access the content. 


---

# 5. Corporate Headquarters

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
