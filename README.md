---
title: MarlinDT Network Intelligence (MNI) Guide
category: how-to
contacts:
  - support@marlindt.net
creator: Merkator nv/sa
url: https://www.merkator.com/
paginate: true
lang: en-GB
date: 2025-11-30
keywords:
  - merkator
  - marlindt
  - mni
  - pni
  - lni
  - digital-twin
draft: true
---

<h1>MNI Guide</h1>

- [1. Merkator Legal Statements](#1-merkator-legal-statements)
  - [1.1. Export restrictions](#11-export-restrictions)
  - [1.2. Disclaimer](#12-disclaimer)
  - [1.3. Limitation of liability](#13-limitation-of-liability)
  - [1.4. Trademarks](#14-trademarks)
  - [1.5. Patent marking notice](#15-patent-marking-notice)
- [2. Target Audience](#2-target-audience)
- [3. Introduction](#3-introduction)
  - [3.1. What does Merkator do?](#31-what-does-merkator-do)
  - [3.2. What is the problem?](#32-what-is-the-problem)
  - [3.3. How is Merkator MarlinDT Network Intelligence (MNI) different?](#33-how-is-merkator-marlindt-network-intelligence-mni-different)
  - [3.4. Why should your business care?](#34-why-should-your-business-care)
- [4. API-First](#4-api-first)
- [5. Predictions](#5-predictions)
  - [5.1. Simple](#51-simple)
  - [5.2. Complex](#52-complex)
- [6. Alerts](#6-alerts)
- [7. Resources](#7-resources)
- [8. Time-Series](#8-time-series)
  - [8.1. Concept](#81-concept)
  - [8.2. Behind the Scenes](#82-behind-the-scenes)
  - [8.3. Shadow Time-Series Tables](#83-shadow-time-series-tables)
    - [8.3.1. Bulk Create (Import)](#831-bulk-create-import)
  - [8.4. Bulk Read (Export)](#84-bulk-read-export)
    - [8.4.1. Create](#841-create)
    - [8.4.2. Read](#842-read)
    - [8.4.3. Update](#843-update)
    - [8.4.4. Delete](#844-delete)
- [9. Database Schema](#9-database-schema)
- [10. Architectures](#10-architectures)
    - [10.0.1. Application](#1001-application)
    - [10.0.2. DevOps CI/CD Pipeline](#1002-devops-cicd-pipeline)
    - [10.0.3. Functional](#1003-functional)
    - [10.0.4. Integration](#1004-integration)
    - [10.0.5. Logical (Cloud)](#1005-logical-cloud)
    - [10.0.6. Logical (On-Premise)](#1006-logical-on-premise)
    - [10.0.7. Cluster Replication](#1007-cluster-replication)
    - [10.0.8. Security](#1008-security)
      - [10.0.8.1. Through the API Gateway](#10081-through-the-api-gateway)
    - [10.0.9. Internally](#1009-internally)
      - [10.0.9.1. API Server Encrypted Storage](#10091-api-server-encrypted-storage)
      - [10.0.9.2. Role-Based Access Control (RBAC)](#10092-role-based-access-control-rbac)
    - [10.0.10. Deployment](#10010-deployment)
- [11. DNS Resolution](#11-dns-resolution)
- [12. MNI Compute Configuration](#12-mni-compute-configuration)
  - [12.1. MNI Wildcard SSL Certificates](#121-mni-wildcard-ssl-certificates)
  - [12.2. MNI Environment File](#122-mni-environment-file)
    - [12.2.1. Common](#1221-common)
    - [12.2.2. OAuth2.0 / OpenID Connect](#1222-oauth20--openid-connect)
    - [12.2.3. Alert Service](#1223-alert-service)
    - [12.2.4. API Gateway](#1224-api-gateway)
    - [12.2.5. API Server](#1225-api-server)
    - [12.2.6. Fetch Service](#1226-fetch-service)
    - [12.2.7. User Interface (UI) Server](#1227-user-interface-ui-server)
    - [12.2.8. Identity and Access Management (IAM) Server](#1228-identity-and-access-management-iam-server)
    - [12.2.9. Predict Service](#1229-predict-service)
    - [12.2.10. DNS Server](#12210-dns-server)
    - [12.2.11. Non-Unique per Component](#12211-non-unique-per-component)
    - [12.2.12. SSL Certificates](#12212-ssl-certificates)
    - [12.2.13. Example](#12213-example)
- [13. Hosting Specifications](#13-hosting-specifications)
  - [13.1. Standalone](#131-standalone)
    - [13.1.1. Combined Single Host](#1311-combined-single-host)
    - [13.1.2. Individual Hosts](#1312-individual-hosts)
  - [13.2. Cluster](#132-cluster)
    - [13.2.1. Per API Server Host](#1321-per-api-server-host)
    - [13.2.2. Other](#1322-other)
  - [13.3. Operating Systems](#133-operating-systems)
  - [13.4. Host Firewalls](#134-host-firewalls)
- [14. License Generator](#14-license-generator)
- [15. Building the release](#15-building-the-release)
  - [15.1. Individual Build Scripts](#151-individual-build-scripts)
  - [15.2. Release artifacts](#152-release-artifacts)
- [16. Deploying the release](#16-deploying-the-release)
  - [16.1. Example Component Installation](#161-example-component-installation)
  - [16.2. Example Component Update](#162-example-component-update)
  - [16.3. Example Component Upgrade](#163-example-component-upgrade)
  - [16.4. Example Component Removal](#164-example-component-removal)
- [17. Integration Lab](#17-integration-lab)
  - [17.1. Host](#171-host)
    - [17.1.1. DNS Records](#1711-dns-records)
  - [17.2. User Interface](#172-user-interface)
  - [17.3. API Server](#173-api-server)
  - [17.4. API Gateway](#174-api-gateway)
  - [17.5. Alert Service](#175-alert-service)
  - [17.6. Fetch Service](#176-fetch-service)
  - [17.7. Predict Service](#177-predict-service)
- [18. Third-Party](#18-third-party)
  - [18.1. Map Rendering](#181-map-rendering)
  - [18.2. Foreign Exchange Rates](#182-foreign-exchange-rates)
  - [18.3. Common Vulnerabilities and Exposures (CVE) Repository](#183-common-vulnerabilities-and-exposures-cve-repository)
  - [18.4. Sample Data](#184-sample-data)
  - [18.5. World Boundaries](#185-world-boundaries)
  - [18.6. Code Scanning](#186-code-scanning)
  - [18.7. Third-Party Elements \& Libraries](#187-third-party-elements--libraries)
    - [18.7.1. API Gateway](#1871-api-gateway)
    - [18.7.2. API Server](#1872-api-server)
    - [18.7.3. DNS Server](#1873-dns-server)
    - [18.7.4. UI Server](#1874-ui-server)
    - [18.7.5. Predict Service](#1875-predict-service)
    - [18.7.6. Alert Service](#1876-alert-service)
    - [18.7.7. Fetch Service](#1877-fetch-service)
    - [18.7.8. License Generator](#1878-license-generator)
- [19. MNI OpenAPIs](#19-mni-openapis)
- [20. MNI User Interface (UI)](#20-mni-user-interface-ui)
  - [20.1. Login](#201-login)
  - [20.2. Readiness](#202-readiness)
  - [20.3. Dashboard](#203-dashboard)
  - [20.4. Cables](#204-cables)
  - [20.5. Ducts](#205-ducts)
  - [20.6. Poles](#206-poles)
  - [20.7. Network Eqiupment](#207-network-eqiupment)
  - [20.8. Racks](#208-racks)
  - [20.9. Sites](#209-sites)
  - [20.10. Services](#2010-services)
  - [20.11. Trenches](#2011-trenches)
    - [20.11.1. Detail](#20111-detail)
    - [20.11.2. Lifetime](#20112-lifetime)
    - [20.11.3. Per Country](#20113-per-country)
  - [20.12. Quote-to-Cash (Q2C)](#2012-quote-to-cash-q2c)
  - [20.13. Providers](#2013-providers)
    - [20.13.1. Email](#20131-email)
    - [20.13.2. Map](#20132-map)
    - [20.13.3. Kafka](#20133-kafka)
    - [20.13.4. Workflow Engines](#20134-workflow-engines)
  - [20.14. Alerts](#2014-alerts)
    - [20.14.1. Callback](#20141-callback)
    - [20.14.2. Publish (Kafka)](#20142-publish-kafka)
    - [20.14.3. Email](#20143-email)
    - [20.14.4. Workflow](#20144-workflow)
  - [20.15. Settings](#2015-settings)
  - [20.16. OpenAPIs](#2016-openapis)
  - [20.17. Help/About](#2017-helpabout)
  - [20.18. Quit (Logout)](#2018-quit-logout)
- [21. Merkator Technical Services](#21-merkator-technical-services)
  - [21.1. By email](#211-by-email)
  - [21.2. On the web](#212-on-the-web)
  - [21.3. Technical documentation](#213-technical-documentation)
- [22. Corporate Headquarters](#22-corporate-headquarters)

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

## 3.1. What does Merkator do?

Merkator Group is an absolute market leader and trusted player in the field of geospatial solutions with global deployments of our physical and logical network inventory products

## 3.2. What is the problem?

Every business is constantly faced with finding current accurate information but also attempting to plan, coping with the ever changing “What if ?” questions from their own employees in addition to shareholders, customers and external market influences

## 3.3. How is Merkator MarlinDT Network Intelligence (MNI) different?

MNI takes historical and actual data and applies Machine Learning predictions providing insight from the past and foresight for the future by envisioning possibilities, from network intelligence delivering business intelligence

## 3.4. Why should your business care?

MNI serves to help you make decisions or, at the very least, streamline a company's decision-making processes by collecting, visualising, and communicating data associated with the telecommunications infrastructure and the services it offers

**Every location and every network resource has a story, with MNI we bring it to life !**

**MarlinDT Network Intelligence** provides analytical and prediction insights for telecommunications infrastructure and services.

```text
from hindsight to insight, delivering network intelligence foresight...
Hindsight: the ability to learn from the past by looking back at what has already happened. 
Insight: the ability to interpret and respond to the present by developing self-awareness and honest perception. 
Foresight: the ability to predict and prepare for the future by envisioning possibilities. 
When combined, hindsight, insight, and foresight can be a foundation for better decision-making and outcomes.
```

---

# 4. API-First

MNI does not replace the fine-grain capabilities of either MarlinDT PNI or LNI, but serves to help you make decisions or, at the very least, streamline a company's decision-making processes by collecting, visualising, and communicating data associated with the telecommunications infrastructure and services it offers API-first Business Support System (BSS)

MNI is API-first meaning it’s built from the ground up to support integration with existing eco-systems – any product that controls the data and does not act as barrier to the data has deployment longevity
 - All Open API definitions published externally for machine-to-machine (M2M)
 - All Open API definitions & tooling included within UI for interactive queries
 - All MNI components use the same APIs – there are no hidden routes (microservices)
 - 230 APIs are defined, documented and adhere to same security mechanisms

Refer to section MNI [MNI OpenAPIs](#19-mni-openapis) for further details.

---

# 5. Predictions

Due to the MNI Time-Series architecture, predictions are treated as updates to historical resource data with calculated/determined values being applied as modifictions with a future date/time associated. 

## 5.1. Simple

Inspecting the historical changes of a single resource, example a rack, and calculating the likelihood of the rack slot usage change and what actual slot changed, i.e. free to used

## 5.2. Complex

Involve combining historical changes of multiple resources and potentially updated external data, example post address, and calculating the need for a resource to change to meet the external data conditions, example the need to extend an existing trench to cover new premises, or provide bandwidth to a new cell tower, data center etc. (yellow dash)

---

# 6. Alerts

MNI aims to provide notification alerts via numerous mechanisms:

- NE Common Vulnerability (CVE) Passive Scan (requested previously by Accenture, implemented, CVE list fetched daily)
- Trench Utilization 75% / 90% / 100%
- Duct Utilization 75% / 90% / 100%
- Cable Utilization 75% / 90% / 100%
- Pole Utilization 75% / 90% / 100%
- Rack Utilization 75% / 90% / 100%
- NE Port Utilization 75% / 90% / 100%
- Transmission Utilization 75% / 90% / 100%
- Service Bandwidth Utilization 75% / 90% / 100%
- NE Error Rates 75% / 90% / 100%
- NE Classifiers Utilization 75% / 90% / 100%
- Work Planning Efficiency 110% / 130% / 150%
- Data Quality - geometry alignment / missing connected To / trench / cable / duct / pole / NE / service / site / offNet Postal Addresses

Providers can be defined via the MNI UI and API Server for:

- Low-Code/No-Code workflow
  - Camunda BPMN (pending)
  - ELSA (pending)
- Webhook
  - RESTful async callback (pending)
- Stream
  - Kafka Bus (pending)
- Email
  - SMTP (implemented)
  - Microsoft Exchange (pending)
- MNI UI (pending)

---

# 7. Resources

MNI resources include:

- Cable: coax, copper, ethernet, single/multi fiber, placement against a pole, duct, trench or to a piece of network equipment
- Duct: placement (within trench), gas, power, cable, water, configuration (x-way), type (duct or sub-duct)
- Pole: Height/Type
- Network Equipment & Ports: Vendor agnostic & Coax, ethernet, loopback, xDSL, Fiber, virtual
- Rack: size, slots
- Service: broadband, circuit, ethernet, FTTx, optical, SoGEA, unclassified, voice
- Site: ADU, COLO, commercial, exchange, MDU, SDU, street, unclassified
- Trench: depth/width, build job

For full details of what is possible to hold against a specific resource, refer to the published API Server APIs

> **Note:** 
> - Demographics on all resources when appropriate (residential, rural, commercial, urban, highways, unclassified)
> - Each resource, if supplied with coordinates, has its country of existence checked and if necessary updated after creation.
> - All resources, once when the resource is created, either on a volume basis i.e. distance, a unit basis per piece of equipment, have a cost calculated and applied.
> - Cost rates can be managed separately through the published API Server APIs

---

# 8. Time-Series

## 8.1. Concept

Every MNI resource has possibility of multiple diverging states including deleted but remains as the same originally defined resource Historical & predicted relationships remain between resources, for example a duct in a trench, such scenarios include:
 - Trench is extended
 - Trench has additional ducting installed
 - Ducting has cables added, removed
 - Cable is moved to different port, fiber splice is connected, disconnected etc.
 - Network Equipment has additional cables connected, removed etc.
 - Rack has equipment installed, removed etc.
 - Rack slot becomes unusable, reserved etc.
 - Service is moved between endpoints etc.
 - New premises and sites appear etc.

As data is either collected by MNI (fetch) or received by MNI the historical data is updated, the resource container remains as is, not duplicated, nor replaced All relationships between resources are preserved during changes
 - No need to reform relationships, for example, changes to rack such as equipment being installed are to the same physical rack, not a different incarnation of the rack
 - Adding a service through two endpoints, automatically updates the referenced equipment ports – no need for separate update to mark equipment ports as used etc.

Entire record from external source can be supplied again without external processing needs – MNI works it out
 - No need to supply the incremental/delta difference
 - No need to delete MNI data before supplying data again

As time passes (now), older predicted data that is earlier than the last historical data is removed
and new predictions performed. Boundaries for earliest preserved historical data and latest predicted data are configurable ensuring quantifiable storage requirements (days, months, quarters or years)

## 8.2. Behind the Scenes

The data required for MNI must be expanded overtime during normal operations as MNI requires a historical dataset in order to predict the future changes, this requires certain adjustments to normal Create-Read-Update-Delete (CRUD) concepts in addition to all non-administrative datasets including metadata fields:

1. `point` a timestamp (specific point in time)
2. `source` to indicate if either supplied as actual (`historical`), supplied as proposed (`planned`), or generated (`predicted`) internally via machine learning predictive algorithms
3. `delete` to indicate if marked for deletion

All records, regardless of type, are subject to the administrative data pruning mechanisms when the historical retention period ( HTTP GET `/mni/v1/admin/data/historical/duration`) of the record has been exceeded 

## 8.3. Shadow Time-Series Tables

Each data (parent) table has a corresponding shadow (child) table prefixed by _, for example Alerts are held in the database table alert and its shadow table is _alert.

The parent table only consists of two fields:

- Unique Identifier (UUIDv4) as the primary key
- delete

The child table consist of at least three fields before the real fields are included:

- `tsId` an auto-populated integer based sequential Identifier (sequence) as the primary key
- `point` to hold the timestamp
- `source`
- Additional identifier (UUIDv4) as the referential key(s) value to link back to the parent table(s) primary key

In entity relationship terms, this looks like:

![](docs/crud-concepts//ts-shadow-tables.svg)
Time-Series Shadow Tables


Any other table that requires to have referential integrity will include the necessary identifier in the child table but referencing the parent table. This allows all held data to be held as time-based versions which reflects the creation, modification and deleting that occurs over normal operation time. In entity relationship terms, this looks like:


![](docs/crud-concepts/ts_pk_fk_relations.svg)
Primary and Foreign Relationships


### 8.3.1. Bulk Create (Import)

- dataset presented via API will include point values
- dataset presented via API will optionally include internal identifiers (UUID)
- dataset (JSON array) will be unpackaged into individual records
- each bulk (JSON array) import will have a maximum size of 1000 records

> **Note:** it is the responsibility of the client to control the quantity of records sent and the API Server will return HTTP status code 413 if the internal queues are currently full or the entire request payload will be discarded if it exceeds the maximum size

- If the request is invalid, HTTP status code 400 will be returned
- For non-administrative datasets:
  - When record is stored, the metadata fields are automatically populated with:
    - `point` - extracted from supplied dataset record
    - `source` - extracted from supplied dataset record
    - `delete` - extracted from supplied dataset record
- For all datasets:
  - the internal identifiers (UUID), created if not supplied or used if supplied
- HTTP status code 202 will be returned

> **Note:** during bulk imports MNI Alert, Fetch and Predict services are effectively suspended until the API Server queues are empty

## 8.4. Bulk Read (Export)

- if no such record(s) exists, HTTP status code 404 will be returned
- If the request is invalid, HTTP status code 400 will be returned
- All held records value will be packaged as dataset (JSON array) including all internally held identifiers (UUID) and for non-administrative datasets the metadata fields will be included:
  - point field value (date format in compressed ISO-8601. YYYYMMDDThhmmss)
  - source field value (string enum)
  - delete field value (boolean)
- HTTP status code 200 will be returned

### 8.4.1. Create

- record presented via API will NOT include point value
- If the request is invalid, HTTP status code 400 will be returned
- When record is stored, two metadata fields are automatically populated with:
  - `point` = current system date/time
  - `source` = historical
  - `delete` = false
- the internal identifier (UUID) will be returned along with HTTP status code 200

### 8.4.2. Read

- if no such record(s) exists, HTTP status code 404 will be returned
- If the request is invalid, HTTP status code 400 will be returned
- if no point value or range is requested via API query parameters then the latest historical record(s) (i.e. state = historical) will be returned with HTTP status code 200
- If point value or is requested via API query parameter that extends into the future, record(s) with either a source of historical or predicted and not marked for deletion (i.e.delete = false) will be returned with HTTP status code 200

### 8.4.3. Update

- If specified record does not exist then HTTP status code 404 will be returned
- If specified record exists but is marked for deletion (delete = true) then HTTP status code 404 will be returned
- If the request is invalid, HTTP status code 400 will be returned
- The existing record is **NOT** updated or altered in any fashion
- If a partial update (HTTP PATCH) then:
  - the existing record is read, the update applied but the resulting record stored as a new record with the metadata fields automatically populated with:
    - `point` = current system date/time
    - `source` = historical
    - `delete` = false
  - HTTP status code 204 will be returned
- If a full update (HTTP PUT) then:
  - the supplied record stored as a new record with the metadata fields automatically populated as:
    - `point` = current system date/time
    - `source` = historical
    - `delete` = false
  - HTTP status code 204 will be returned

### 8.4.4. Delete

- If specified record does not exist then HTTP status code 404 will be returned
- If the request is invalid, HTTP status code 400 will be returned
- The existing record is **NOT** deleted but the existing record is read, but the resulting record stored as a new record with the two metadata fields automatically populated with:
  - `point` = current system date/time
  - `source` - as per existing record value
  - `delete` =  true
- HTTP status code 204 will be returned

---

# 9. Database Schema

As part of the CI/CD process, the MNI database schema is automatically documented as a Entity Relationship Diagram (ERD) and the latest version is shown below

![](docs/data-model/mni-model.svg)
Schema Model

---

# 10. Architectures

![](docs/architecture/mni-architectures-Simple.svg)

Simplified

### 10.0.1. Application

![](docs/architecture/mni-architectures-Application.svg)

Application

### 10.0.2. DevOps CI/CD Pipeline

![](docs/architecture/mni-architectures-DevOps.svg)
DevOps

### 10.0.3. Functional

![](docs/architecture/mni-architectures-Functional.svg)

Functional

### 10.0.4. Integration

![](docs/architecture/mni-architectures-Integration.svg)

Integration

### 10.0.5. Logical (Cloud)

![](docs/architecture/mni-architectures-Logical-Cloud.svg)

Logical Cloud

### 10.0.6. Logical (On-Premise)

![](docs/architecture/mni-architectures-Logical-OnPrem.svg)

Logical On-Premise/Self Hosted

### 10.0.7. Cluster Replication

![](docs/architecture/mni-architectures-Replication.svg)

API Server Clustering

- API Server embeds DuckDB. Due to horizontal scaling limitations of DuckDB, backend database replication needs to be implemented
- MNI already tracks internal changes for prediction purposes (Prediction Service)
- Resource changes pulled from master API Server by slave API Server(s) and updated locally
- API Gateway, through existing DNS Service Discovery, sends writes to master and reads to slave(s) with failover back to master for scaling purposes
- Replication communication still occurs through API Gateway
- UI Server, API Gateway, Predictive Service, Fetch Service and Alerting Service are already horizontal scaling capable

### 10.0.8. Security

![](docs/architecture/mni-architectures-Security.svg)

Authentication and Authorization 

#### 10.0.8.1. Through the API Gateway

Browser clients and machine-to-machine clients operate through the API Gateway and are required to use OAuth2.0/OpenID Connect authentication, between the API Gateway and the API Server a different authentication scheme is used.

```text
+---------+               +-------------+           +------------+
| Clients |--[OAuth2.0]-->| API Gateway |--[auth]-->| API Server |
+---------+               +-------------+           +------------+
```

The API Gateway has the responsibility of undertaking both authentication and authorization (fine-grain) for Role-Based Access Control (RBAC).

> **Note**:
> - MNI contains the ability to disable and ignore RBAC based authorization, however authentication can not be disabled.
> - To ignore authorization change `APIGW_IGNORE_AUTH_VALIDATOR` to `true` prior to installation of the API Gateway.
> - Authorization can be re-enabled by changing `APIGW_IGNORE_AUTH_VALIDATOR` to `false` and performing an update or upgrade of the API Gateway

### 10.0.9. Internally

MNI Alert Service, Fetch Service and Predict Service, as well as the API Gateway use service authentication.

```text
+---------------+           +------------+
| MNI Component |--[auth]-->| API Server |
+---------------+           +------------+
```

> **Note**: 
> - MNI Alert Service, Fetch Service and Predict Service can be configured to route through the API Gateway, but will need to authenticate with the same IAM
> - The service authentication credentials are generated during installation of the API Server and are specific to that installation.
> - When deploying API Server for cluster operations, the service authentication credentials **MUST** match across all environment configuration files (`/etc/mni/mni.ini`), specifically `MNI_SERVICE_USERNAME` and `MNI_SERVICE_KEY`.

#### 10.0.9.1. API Server Encrypted Storage

MNI API Server makes use of AES encryption, key size 256 bits for storing credentials within its secret store.

> **Note**: 
> - The AES encryptions credentials are generated during installation of the API Server and are specific to that installation.
> - When deploying API Server for cluster operations, the AES encryptions credentials **DO NOT NEED** to match across all environment configuration files (`/etc/mni/mni.ini`), specifically `APISERV_ENCRYPTION_KEY` and `APISERV_ENCRYPTION_IV`.

#### 10.0.9.2. Role-Based Access Control (RBAC)

The MNI OpenAPIs already includes the fine-grain RBAC markers against each and every API, they are:

- `read:mni_admin`
- `read:mni_alert`
- `read:mni_cable`
- `read:mni_duct`
- `read:mni_fetch`
- `read:mni_ne`
- `read:mni_pole`
- `read:mni_predict`
- `read:mni_rack`
- `read:mni_service`
- `read:mni_site`
- `read:mni_trench`
- `read:mni_ui`
- `write:mni_admin`
- `write:mni_alert`
- `write:mni_cable`
- `write:mni_duct`
- `write:mni_fetch`
- `write:mni_ne`
- `write:mni_pole`
- `write:mni_predict`
- `write:mni_rack`
- `write:mni_service`
- `write:mni_site`
- `write:mni_trench`
- `write:mni_ui`

MNI OpenAPIs include the use of multiple roles, but the client is only expected to require one - this allows multiple job or function roles (planning/design, procurement etc., API integration) to be supported.

> **Note:** 
> - The mapping of job or function roles and roles to user credentials is handled by the Identity and Access Management (IAM) and is beyond the scope of this document.
> - `mni_alert`, `mni_fetch`, `mni_predict` roles are for MNI itself and **MUST NOT** be assigned to any external clients

### 10.0.10. Deployment

![](docs/install/mni-architectures-Deployment.svg)

Suitable for standalone integration, lab, proof of concepts and low-yield production usage or clustered deployments.

> **Note:** all Debian hosts shown can be combined into single host, either bare-metal or virtual

---

# 11. DNS Resolution

MNI makes use of service discovery via DNS server (`SRV`) records to locate MNI components, this more commonly referred to as `SD-DNS`. This is used for both horizontal and vertical scaling and by the API Gateway for backend routing.
 
```text
Type	
Domain Record
    Data	TTL
A	apiserver.{hostname}.{domain}	127.0.0.1	3600
A	{hostname}.{domain}	192.168.1.16	3600
SRV	_https._tcp.apiserver.{hostname}.{domain}	0 10 7443 apiserver.{hostname}.{domain}	3600
SRV	_https._tcp.gateway.{hostname}.{domain}	0 10 8443 {hostname}.{domain}	3600
```	 	 

Change {hostname}.{domain} to whatever the host reported (or was told) its fully qualified hostname was before defining the DNS records. You can change the time-to-live (TTL) to a one day (86400) when you are happy DNS resolution is working.
 
You can verify via as follows:

```bash
$ dig +short _https._tcp.apiserver.{hostname}.{domain} SRV
$ dig +short apiserver.{hostname}.{domain} A
$ dig +short _https._tcp.gateway.{hostname}.{domain} SRV
$ dig +short gateway.{hostname}.{domain} A
```
> **Note:** The utility `dig` is part of the `bind9-dnsutils` package on Debian hosts.
 
Depending on the deployment architecture, single host vs. multiple hosts, the hostname may vary. For example, you should get something like this if all working correctly on a combined single host:

```bash
# hostname
marlinintegration.merkator.com
# cat /etc/hosts
127.0.0.1       localhost
127.0.1.1       MarlinMigration

# The following lines are desirable for IPv6 capable hosts
::1     localhost ip6-localhost ip6-loopback
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters

$ dig +short _https._tcp.apiserver.marlinintegration.merkator.com SRV
0 10 7443 apiserver.marlinintegration.merkator.com.
$ dig +short apiserver.marlinintegration.merkator.com A
127.0.0.1
$ dig +short _https._tcp.gateway.marlinintegration.merkator.com SRV
0 10 8443 marlinintegration.merkator.com.
$ dig +short marlinintegration.merkator.com A
192.168.1.16
```

For Round-Robin DNS, the DNS Server would need something similar to the zone extract shown below:

```text
marlinintegration IN A 192.168.1.16
                  IN A 192.168.1.17
                  IN A 192.168.1.18
```

> **Note:**
> - When using Round-Robin DNS, the DNS `SRV` records do not need any changes as the contained `A` host record itself for `marlinintegration.merkator.com` will resolve to the listed IP addresses
> - Most modern Web Browsers automatically support Round-Robin DNS, however any applications operating as machine-to-machine may require additional configuration or customisation
> - It is outside the scope of this document for configuration of DNS Servers

---

# 12. MNI Compute Configuration

Each compute environment hosting MNI components must contain a MNI configuration environment file. This file can be found at `/etc/mni/mni.ini` and is automatically created if not found during installation.

> **Note:** The contents of the configuration environment file should be manually updated and synchronised between all hosts that form MNI as MNI internal components will read some of the configuration of the other components.

## 12.1. MNI Wildcard SSL Certificates

MNI requires either a wildcard SSL certificate, or suitable SSL certificate per host as below:

 - API Gateway (`APIGW_*`)
 - API Server (`APISERV_*`)
 - UI Server (`UISERV_*`)
 - Identity and Access Management (`IAM_*`)

## 12.2. MNI Environment File

The file `/etc/mni/mni.ini` deployment environment file supports the following MNI functional components:

 - Alert Service (`ALERTSRV_*`)
 - API Gateway (`APIGW_*`)
 - API Server (`APISERV_*`)
 - Fetch Service (`FETCHSRV_*`)
 - UI Server (`UISERV_*`)
 - Identity and Access Management (`IAM_*`)
 - Local DNS Server (`DNSSERV_*`)

> **Note:** 
> - Some of the configuration items are automatically determined during installation, these include hostname/address and service credentials.
> - Some items are automaticaly set during the CI/CD build process
> - This deployment environment file must be manually synchronised if using more than one host

### 12.2.1. Common

```bash
#
# Common
#
CONFIG_DIRECTORY="/etc/mni"
HOST_SERVICE_GROUP="mni"
MNI_NAME="MarlinDT Network Intelligence"
MNI_BUILD="1763499309"
MNI_VERSION="1.0.0"
MNI_LICENSE_PRIVATE_KEY=""
MNI_LICENSE_PUBLIC_KEY=""
MNI_DEFAULT_COUNTRY_CODE="BEL"
MNI_SERVICE_USERNAME=""
MNI_SERVICE_KEY=""
```

 - `CONFIG_DIRECTORY` value should be left as is
 - `HOST_SERVICE_GROUP` can be changed
 - `MNI_NAME` can be changed
 - `MNI_BUILD` is automatically populated during CI/CD build process
 - `MNI_VERSION` is automatically populalted during CI/CD build process
 - `MNI_LICENSE_PRIVATE_KEY` value should be generated via the MNI License Generator tool and the resulting value included here for the API Server - no other component requires this
 - `MNI_LICENSE_PUBLIC_KEY` is automatically populalted during CI/CD build process and should **not** be changed
 - `MNI_DEFAULT_COUNTRY_CODE` can be changed to one of the following values: `ABW`, `AFG`, `AGO`, `AIA`, `ALB`, `AND`, `ARE`, `ARG`, `ARM`, `ASM`, `ATA`, `ATF`, `ATG`, `AUS`, `AUT`, `AZE`, `BDI`, `BEL`, `BEN`, `BES`, `BFA`, `BGD`, `BGR`, `BHR`, `BHS`, `BIH`, `BLM`, `BLR`, `BLZ`, `BMU`, `BOL`, `BRA`, `BRB`, `BRN`, `BTN`, `BWA`, `CAF`, `CAN`, `CHE`, `CHL`, `CHN`, `CIV`, `CMR`, `COD`, `COG`, `COK`, `COL`, `COM`, `CPV`, `CRI`, `CUB`, `CUW`, `CYM`, `CYP`, `CZE`, `DEU`, `DJI`, `DMA`, `DNK`, `DOM`, `DZA`, `ECU`, `EGY`, `ERI`, `ESP`, `EST`, `ETH`, `FIN`, `FJI`, `FLK`, `FRA`, `FRO`, `FSM`, `GAB`, `GBR`, `GEO`, `GGY`, `GHA`, `GIB`, `GIN`, `GLP`, `GMB`, `GNB`, `GNQ`, `GRC`, `GRD`, `GRL`, `GTM`, `GUF`, `GUM`, `GUY`, `HND`, `HRV`, `HTI`, `HUN`, `IDN`, `IMN`, `IND`, `IRL`, `IRN`, `IRQ`, `ISL`, `ISR`, `ITA`, `JAM`, `JOR`, `JPN`, `KAZ`, `KEN`, `KGZ`, `KHM`, `KIR`, `KNA`, `KOR`, `KWT`, `LAO`, `LBN`, `LBR`, `LBY`, `LCA`, `LIE`, `LKA`, `LSO`, `LTU`, `LUX`, `LVA`, `MAR`, `MCO`, `MDA`, `MDG`, `MDV`, `MEX`, `MHL`, `MKD`, `MLI`, `MLT`, `MMR`, `MNE`, `MNG`, `MNP`, `MOZ`, `MRT`, `MSR`, `MTQ`, `MUS`, `MWI`, `MYS`, `MYT`, `NAM`, `NCL`, `NER`, `NGA`, `NIC`, `NIU`, `NLD`, `NOR`, `NPL`, `NRU`, `NZL`, `OMN`, `PAK`, `PAN`, `PCN`, `PER`, `PHL`, `PLW`, `PNG`, `POL`, `PRK`, `PRT`, `PRY`, `PSE`, `PYF`, `QAT`, `REU`, `ROU`, `RUS`, `RWA`, `SAU`, `SDN`, `SEN`, `SGP`, `SHN`, `SLB`, `SLE`, `SLV`, `SMR`, `SOM`, `SRB`, `SSD`, `STP`, `SUR`, `SVK`, `SVN`, `SWE`, `SWZ`, `SYC`, `SYR`, `TCA`, `TCD`, `TGO`, `THA`, `TJK`, `TKL`, `TKM`, `TLS`, `TON`, `TTO`, `TUN`, `TUR`, `TUV`, `TWN`, `TZA`, `UGA`, `UKR`, `URY`, `USA`, `UZB`, `VAT`, `VCT`, `VEN`, `VGB`, `VIR`, `VNM`, `VUT`, `WLF`, `WSM`, `YEM`, `ZAF`, `ZMB`, `ZWE`
 - `MNI_SERVICE_USERNAME` is automatically set during the installation of the API Server - other components do require this
 - `MNI_SERVICE_KEY` is automatically set during the installation of the API Server - other components do require this

### 12.2.2. OAuth2.0 / OpenID Connect

```bash
#
# OAuth2.0 / OpenID Connect
#
OAUTH=true
OAUTH_CLIENT_ID="MNI"
OAUTH_CLIENT_SECRET="mQGulEEcowdREynXpDqBbt1Xe4yziKN"
OAUTH_DISCOVERY_URL="https://mni.merkator.local:6443/realms/MNI/.well-known/openid-configuration"
```

 - `OAUTH` is required to have a value of `true`
 - `OAUTH_CLIENT_ID` default value matches that used by the included IAM Server
 - `OAUTH_CLIENT_SECRET` default value matches that used by the included IAM Server
 - `OAUTH_DISCOVERY_URL` default value should be automatically changed during installation, but it is recommended this value is manually verified

If you were to use Microsoft Azure Active Directory for authentication, then the values would be something similar to:

```bash
OAUTH=true
OAUTH_CLIENT_ID="MNf3ce2c1d-abcd-4lee-cowd-reydd5489d741I"
OAUTH_CLIENT_SECRET="Mni8Q~RWkJ3xDeadLuckOC5a6kl1G_CUfoqJGdn."
OAUTH_DISCOVERY_URL="https://login.microsoftonline.com/a17ec843-b999-4lee-cowd-rey03a903e14/v2.0/.well-known/openid-configuration"
```

> **Note:** You would need to change the Microsoft tenant id `a17ec843-b999-4lee-cowd-rey03a903e14` and potentially Discovery URL to match your Azure account.

### 12.2.3. Alert Service

```bash
#
# alertService
#
ALERTSRV_CRONTIME="0 0 * * *"
ALERTSRV_DEBUG=true
ALERTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=120000
ALERTSRV_ENDPOINT_RETRY_INTERVAL_MS=15000
ALERTSRV_HOST_SERVICE_LOG_FILE="/var/log/mni/alert.log"
ALERTSRV_HOST_SERVICE_SYSTEMD="mnialert.service"
ALERTSRV_HOST_SERVICE_USERNAME="mnialert"
ALERTSRV_TLS_INSECURE_CONNECTIONS=true
ALERTSRV_WORKING_DIRECTORY="/usr/local/mni/alert"
```

 - `ALERTSRV_CRONTIME` can be changed, adhere to rules of Linux CronTab for specifying the execution time
 - `ALERTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS` can be changed if required
 - `ALERTSRV_ENDPOINT_RETRY_INTERVAL_MS` can be changed if required

### 12.2.4. API Gateway 

```bash
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
APIGW_KRAKEND_VERSION="2.12.0"
APIGW_WORKING_DIRECTORY="/usr/local/mni/apigw"
```

 - `APIGW_ADDRESS` is automamtically set to the Linux network interface providing the default route
 - `APIGW_IGNORE_AUTH_VALIDATOR` is set to `true` the Role Based Access Controls (RBAC) used for authorization are disabled and only authentication is used instead
 - `APIGW_PORT` if changed, ensure DNS records match
 - `APIGW_PROXY_RATE_LIMIT_REQUESTS` for large installations, adjust accordingly - refer to KrakenD documentation
 - `APIGW_PROXY_CAPACITY_REQUESTS` for large installations, adjust accordingly - refer to KrakenD documentation
 - `APIGW_PROXY_RATE_LIMIT_EVERY` for large installations, adjust accordingly - refert to KrakenD documentation
 - `APIGW_KRAKEND_VERSION` which version of KrakenD to download and use - this should not be changed

### 12.2.5. API Server

```bash
#
# apiServer
#
APISERV_ADDRESS="0.0.0.0"
APISERV_API_DIRECTORY="/usr/local/mni/api/openapi"
APISERV_BACKUP_DIRECTORY="/usr/local/mni/api/backup"
APISERV_DEBUG=true
APISERV_DUCKDB_VERSION="v1.4.1"
APISERV_DUCKDB_BACKUP_CRONTIME="0 2 * * *"
APISERV_DUCKDB_BACKUP=true
APISERV_DUCKDB_FILE="/usr/local/mni/api/mni.duckdb"
APISERV_DUCKDB_MAX_MEMORY="20GB"
APISERV_DUCKDB_THREADS=4
APISERV_ENCRYPTION_KEY="qBU4K9XBw2JtYx7puSGiSig8LbxxDpSaprK7+u+EJI8="
APISERV_ENCRYPTION_IV="U5uKpGIE3cIXh5kuhFZXuQ=="
APISERV_KEEPALIVE=true
APISERV_HOST_SERVICE_LOG_FILE="/var/log/mni/api.log"
APISERV_HOST_SERVICE_SYSTEMD="mniapi.service"
APISERV_HOST_SERVICE_USERNAME="mniapi"
APISERV_MULTICAST_ADDRESS="230.185.184.183"
APISERV_MULTICAST_PORT=54321
APISERV_PORT=7443
APISERV_PREMISES_PASSED_BOUNDARY_DISTANCE=35
APISERV_ROLE="standalone"
APISERV_SPATIAL_UPDATE_GEOMETRY_CRONTIME="*/5 * * * *"
APISERV_SSL_CERT="api.crt"
APISERV_SSL_CSR="api.csr"
APISERV_SSL_DAYS=90
APISERV_SSL_KEY="api.key"
APISERV_SSL_SIZE=4096
APISERV_TIMEOUT_KEEPALIVE=5000
APISERV_TIMEOUT_REQUEST=300000
APISERV_DOCUMENT_DIRECTORY="/usr/local/mni/api/document"
APISERV_UPLOAD_DIRECTORY="/usr/local/mni/api/upload"
APISERV_URL_PREFIX="/mni"
APISERV_URL_VERSION="/v1"
APISERV_USE_DNS_SD=false
APISERV_WORKING_DIRECTORY="/usr/local/mni/api"
```

 - `APISERV_ADDRESS` if using single host, this should be loopback address `127.0.0.1`, otherwise use the IP address which is reachable from the API Gateway and other MNI components
 - `APISERV_API_DIRECTORY` the directory on the host to hold the OpenAPI definition
 - `APISERV_BACKUP_DIRECTORY` the directory to hold the database backup files
 - `APISERV_DUCKDB_VERSION` which of DuckDB to download and use - this should not be changed
 - `APISERV_DUCKDB_BACKUP_CRONTIME` can be changed, adhere to rules of Linux CronTab for specifying the execution time
 - `APISERV_DUCKDB_BACKUP` toggle performing backups
 - `APISERV_DUCKDB_FILE` database file representing the DuckDB database
 - `APISERV_DUCKDB_MAX_MEMORY` maximum memory to use for caching
 - `APISERV_DUCKDB_THREADS` maximum number threads to use
 - `APISERV_ENCRYPTION_KEY` is automatically set during the installation of the API Server - no other component requires this
 - `APISERV_ENCRYPTION_IV` is automatically set during the installation of the API Server - no other component requires this
 - `APISERV_KEEPALIVE` use HTTP keep-alive for connections, either `true` or `false`
 - `APISERV_MULTICAST_ADDRESS` multicast address to use replication for clustering of API Server
 - `APISERV_MULTICAST_PORT` multicast port to use replication for clustering of API Server
 - `APISERV_PORT` if changed, ensure DNS records match
 - `APISERV_PREMISES_PASSED_BOUNDARY_DISTANCE` distance in metres between pairs of latitude (X), longitude (Y) coordinates to determine if counted towards nearest match
 - `APISERV_ROLE` used to enable replication for the clusterng of API Server, possible values are below. All replication occurs through encrypted multicast streams which notify other members of a change, which then request the change and process the change as if they were the master itself. For DNS purposes, the master should be the host which receives create, update or delete requests, and the slaves should handle majority of the read requests.
   - `standalone` single host with no replication, or
   - `master` primary lead host within an API Server cluster, **Note:** only one deployed host should be `master`
   - `slave` multiple hosts within an API Server cluster
 - `APISERV_SPATIAL_UPDATE_GEOMETRY_CRONTIME` can be changed, adhere to rules of Linux CronTab for specifying the execution time
 - `APISERV_TIMEOUT_KEEPALIVE` timeout in milliseconds for the HTTP keep-alive connections
 - `APISERV_TIMEOUT_REQUEST` request lifetime in milliseconds for the HTTP keep-alive connections
 - `APISERV_DOCUMENT_DIRECTORY` the directory to hold the previously uploaded documents - this can be an external network share or another filesystem as dependant on expected storage requirements
 - `APISERV_UPLOAD_DIRECTORY` the directory to hold an uploaded document before it is moved to the document directory
 - `APISERV_URL_PREFIX` the API Server endpoint URL path prefix - this should not be changed
 - `APISERV_URL_VERSION` the API server endpoint URL path version prefix - this should not be changed
 - `APISERV_USE_DNS_SD` toggle API Server using DNS Service Discovery to determine which host/port to expose its endpoint against - this should not be changed unless DNS `SRV`records have been previously verified (i.e. from API Gateway)

### 12.2.6. Fetch Service

```bash
#
# fetchService
#
FETCHSRV_CVE_SCAN=true
FETCHSRV_CVE_DIRECTORY="/usr/local/mni/cvelistV5"
FETCHSRV_DEBUG=true
FETCHSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=120000
FETCHSRV_ENDPOINT_RETRY_INTERVAL_MS=15000
FETCHSRV_FX_UPDATE=true
FETCHSRV_HOST_SERVICE_LOG_FILE="/var/log/mni/fetch.log"
FETCHSRV_HOST_SERVICE_SYSTEMD="mnifetch.service"
FETCHSRV_HOST_SERVICE_USERNAME="mnifetch"
FETCHSRV_TLS_INSECURE_CONNECTIONS=true
FETCHSRV_WORKING_DIRECTORY="/usr/local/mni/fetch"
```

 - `FETCHSRV_CVE_SCAN` toggle fetching on CVE repository from the Internet
 - `FETCHSRV_CVE_DIRECTORY` if used, where to cache the CVE repository - this can be an external network share or another filesystem as dependant on expected storage requirements
 - `FETCHSRV_FX_UPDATE` toggle updating foreign currency exchange rates from the Internet - if disabled FX rates can be updated through API Server APIs

### 12.2.7. User Interface (UI) Server

```bash
#
# uiServer
#
UISERV_ADDRESS="192.168.1.16"
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
UISERV_TLS_INSECURE_CONNECTIONS=true
UISERV_URL_PREFIX="/mni"
UISERV_USE_DNS_SD=false
UISERV_WORKING_DIRECTORY="/usr/local/mni/ui"
```

 - `UISERV_ADDRESS` is automamtically set to the Linux network interface providing the default route
 - `UISERV_DIST_DIRECTORY` this should not be changed
 - `UISERV_DNS_RESOLVE` timeout in milliseconds for DNS lookups
 - `UISERV_PORT` if changed, ensure DNS records match
 - `UISERV_TICK_INTERVAL_MS` obsolete
 - `UISERV_URL_PREFIX` this should match the API Server endpoint URL path prefix - this should not be changed
 - `UISERV_USE_DNS_SD` toggle UI Server using DNS Service Discovery to determine which host/port to expose its endpoint against and this should not be changed unless DNS `SRV`records have been previously verified

### 12.2.8. Identity and Access Management (IAM) Server

```bash
#
# IAM
#
IAM_ADDRESS="192.168.1.16"
IAM_BOOTSTRAP_ADMIN_USERNAME="admin"
IAM_BOOTSTRAP_ADMIN_PASSWORD="admin"
IAM_HOST_SERVICE_LOG_FILE="/var/log/mni/iam.log"
IAM_HOST_SERVICE_SYSTEMD="mniiam.service"
IAM_HOST_SERVICE_USERNAME="mniiam"
IAM_KEYCLOAK_VERSION="26.4.4"
IAM_PORT_HTTPS=6443
IAM_SSL_CERT="iam.crt"
IAM_SSL_CSR="iam.csr"
IAM_SSL_DAYS=90
IAM_SSL_KEY="iam.key"
IAM_SSL_SIZE=4096
IAM_WORKING_DIRECTORY="/usr/local/mni/iam"
```

 - `IAM_ADDRESS` is automamtically set to the Linux network interface providing the default route
 - `IAM_BOOTSTRAP_ADMIN_USERNAME` the default username of the administrative account used in KeyCloak
 - `IAM_BOOTSTRAP_ADMIN_PASSWORD` the default password of the administrative account used in KeyCloak - this password should be changed after installation via the KeyCloak Management console (https://{IAM_ADDRESS}:{IAM_PORT}/)
 - `IAM_KEYCLOAK_VERSION` version of KeyCloak to use - this should not be changed
 - `IAM_PORT_HTTPS` if changed, ensure DNS records match

### 12.2.9. Predict Service

```bash
#
# predictService
#
PREDICTSRV_CRONTIME="0 0 * * *"
PREDICTSRV_DEBUG=true
PREDICTSRV_ENDPOINT_RETRY_INTERVAL_MS=15000
PREDICTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=60000
PREDICTSRV_HOST_SERVICE_LOG_FILE="/var/log/mni/predict.log"
PREDICTSRV_HOST_SERVICE_SYSTEMD="mnipredict.service"
PREDICTSRV_HOST_SERVICE_USERNAME="mnipredict"
PREDICTSRV_TLS_INSECURE_CONNECTIONS=true
PREDICTSRV_WORKING_DIRECTORY="/usr/local/mni/predict"
```

 - `PREDICTSRV_CRONTIME` can be changed, adhere to rules of Linux CronTab for specifying the execution time

### 12.2.10. DNS Server

> **Note:** while some deployments will NOT include the embedded DNS Server (dnsmasq), this configuration is still required for the `HOST` and `DOMAIN NAME` configuration

```bash
#
# dnsServer
#
DNSSERV_INSTALL=false
DNSSERV_ADDRESS=
DNSSERV_VERSION="2.70"
DNSSERV_HOST_SERVICE_LOG_FILE="/var/log/mni/dns.log"
DNSSERV_HOST_SERVICE_SYSTEMD="mnidns.service"
DNSSERV_HOST_SERVICE_USERNAME="mnidns"
DNSSERV_PORT=53
DNSSERV_HOST="marlinintegration"
DNSSERV_DOMAIN="merkator.com"
DNSSERV_WORKING_DIRECTORY="/usr/local/mni/dns"
DNSSERV_SYSTEMD_RESOLVE=1
DNSSERV_RESOLVCONF=1
```

  - `DNSSERV_ADDRESS` is automamtically set to the Linux network interface providing the default route
  - `DNSSERV_VERSION` the version of DNSMASQ to download and use - this should not be changed
  - `DNSSERV_PORT` the TCP/UDP port to use DNS services against - this should not be changed
  - `DNSSERV_HOST` the hostname using during installation of many components
  - `DNSSERV_DOMAIN` the domain name used during installation of many components
  - `DNSSERV_SYSTEMD_RESOLVE` records if systemD Resolve was deployed - this should not be changed and is set during installation
  - `DNSSERV_RESOLVCONF` records if resolve-conf was deployed - his should not be changed and is set during installation

### 12.2.11. Non-Unique per Component

The following are defined per component and are treated in the same manner:

 - `{MNI_COMPONENT}_DEBUG` can be either `false` or `true` to toggle addition verbose logging
 - `{MNI_COMPONENT}_TLS_INSECURE_CONNECTIONS` if struggling with SSL certificates, set this to `true` for the respective component
 - `{MNI_COMPONENT}_HOST_SERVICE_LOG_FILE` can be changed but recommended any changes are consistently applied
 - `{MNI_COMPONENT}_HOST_SERVICE_SYSTEMD` value should be left as is
 - `{MNI_COMPONENT}_HOST_SERVICE_USERNAME` can be changed and is used as the dedicated component username
 - `{MNI_COMPONENT}_WORKING_DIRECTORY` can be changed and it used as the home directory for the dedicted component user
 - `{MNI_COMPONENT}_ENDPOINT_RETRY_INTERVAL_MS` used by service components and can be changed
 - `{MNI_COMPONENT}_ENDPOINT_KEEPALIVE_INTERVAL_MS` used by service components and can be changed

### 12.2.12. SSL Certificates

MNI will unless configured otherwise generate and use Self-Signed SSL certificates, if using signed certificates then the number of days and key size values can be ignored. If using same wildcard domain SSL certificate all components can use the same certificate chain, otherwise one certificate per Server component is suitable.

 - `{MNI_COMPONENT}_SSL_CERT` - `PEM` formatted certificate including any authority certificates
 - `{MNI_COMPONENT}_SSL_CSR` - Self-Signed request filename
 - `{MNI_COMPONENT}_SSL_DAYS` - Self-Signed certificate lifetime in days
 - `{MNI_COMPONENT}_SSL_KEY` - `PEM` formatted key certificate filename
 - `{MNI_COMPONENT}_SSL_SIZE` - Self-Signed certificate key size

### 12.2.13. Example

> **Note:** It is recommended that the deployment environment file be configured for the deployment before installation is started.

A fully populated deployment environment file would be similar to:

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
MNI_BUILD="1745876813"
MNI_VERSION="1.0.0"
MNI_LICENSE_PRIVATE_KEY="PT09PUJFR0lOIExJQ0VOU0UgS0VZPT09PQpLSFhrZ3JtRFcxYTkvUy8zL3ZhUVB1TmpQTTRQSUdsVnV3bEtLZEdkVlhUWlZIWEltdjh0UGNMNlpmYXZHanpObEw5ZzJvTmdrazhyR2pJT1cyS05lelN5MWl3cjRER1hBYkV5TWdUNjBjWXhQd3ZsS3BMOTZ1RUpqR01SRXByNmpwdUVUVUUxNFcyQ3ZSdmlTeFNDcFJKT2lHeEV5TmxVMWhmZDJrLzJ3RVlKc1FTRlFWcS9MZ0hIeWhUTFg3d0wwUjZkeXJJd0pDbk5zUGwvYy9YU1hramdKU0hWdTUxL0YxM1NvdFMxMlplYXM0ajFTaDZpRDF1RjMvK053U0dvWnJZZzkxYTNIUjdnUm1KMmdKRTE2ekl6Q0RDdy92WDhIOFFSb1poNVdaWXBRQ2Z5cG9JUC9kcTFqTGxkYWhwaHduZmNXYnVtc2JUSWhWZ3dLcldxb1JsNGVFL2VJMXZPbDNEL2lxVkRaaklZNThqcXVSQXJCd3VJcVE0UFJJL3FOZ0phSGtzVGxCYytzeFNBemUrQkZTY3FTamtTSzlvdnFra0l6SStRVkF6RlRrajZ6N2xISVlhZEZqNGZKaTBWL25KZWtiZ1BvdktYTzBDQmVITUZkT2pKMHh6b3BscHFGejBnbEhuTUJ4SmlpblZPSkwrMWJVbGY5R1l1V2E2NHU2K3M1OWY3TU5OaEFOSnZ3bkdyK01QaXVrMWd1K21PRWp4alVTR3lzczFzUng0U1JQdm04NkpsZllvS05CYXMzQU5rc3pzUDBmcmhvL1V4YVlobjVhcmlvbGZoUk1VbGtKN1c0NVIvTkpacHEzcCt6Zi9ZRTlhSVpnOFlWVG5UOHdZVVIwczQ5a2lrL3FiaVAwTUtjc3hzYmtXeWxIT1AzWW82a0NybFhRcz18fFUyRnNkR1ZrWDEvRitINLeecowDrey1NEFsQkRKZEVEUTF0d3BPTGUwTHp0UW12bTBDUUcydEJmU055dkVXdVhGZlFrUG5tRXR1RU11a1g0L0Y3TDc3YnUxVSt0cXBpQ0Z1Qm9QdmxNWGpBbjQ0ZHZSR1MrbmR0b3VXYmFVbXVzRHplejhDNHQyMWx2Q282WFRsenpvcUlNZnlXZ0JIYjROTnpKZ01CSGZYSVBWTFZ4aTBuSUdpa3o5SjNjZ2RCZgpXN2VGYWVMWTVjQmwvUlZzSE9kN1lqZGJrVThXKzVldjVuY1UwYTVWY3FjdlhTYUtNZ3FpTGtrS3JDMGszWnZ4VER2QW13Sk15bjFtZ1YwY1VtN3F3b3o1QzFFRzV3aElyTm1Rb3dXdFY5M0pnL0dGSWpTUWpyaThMSy8wZUVtYTZrYmZ6Y1ZZYjlHYURnZStQL3N3ZEdRaUxydmhlT2FQSGxVMkFKMW9ack9nbk0rZktZVUVOaW1rUEphclh0S1Fqd0NiWlY4RVhVWng5cjdKaGVTdEVDeGJRb0l4ZmwxTncyZlQ0alJsbjZHenk4UnpHNWpsS3lzck9ibUd3NE1abzJQVjdzVi84N3lIQjMwYmgvRW4rUWNqOUwrdFlYZ24yWUhUQWQ4ZnFsaU0rUkFtbFdsSkVKZHhxMS80dXFPTWs1SzVmaFFFejNwS2NkQmZOZlVvNC9leEkyUFpJV1k5ZCtLQUZseHFKVk5jN3lBYTc5SVNaT0FNUU16K0M1WWFyNGNIRElsYWFXQXI2Q1ptTm10TlpOalh6aUhLcFRDNXRIaU5ycm81blVqYnlwTjBsQjh0RWFDWkdFV0ZkTWMrVm9rQ09DZW1FN3pGMC8xQ0w3UUVTQytBeTNScXBkNkNPUFRVYUxtUTlQZnNLR3I4bkRwZFZwVldCbXpCaHFzZXJMZUxDY2tETC9pY2VRbmFpcmJhQ3NBYjB2RGhObitFM05hYTZKN28yRlhDd0tzUC96T3IxQTlWZm9xV1pYdkFmK1poWFNOenRYL1RFbnlobitaRTBnWHNRQ0cvaG55YkRPN1QzcWFoa01XVGh0eUUxVWJhZjZ1VHBrYm12R2hlWENKZ1U2S2RlaEhqTjVyK0M2eXZtVE43L3V4a0JpS3p5NW9GYnYraFBJaz0KPT09PUVORCBMSUNFTlNFIEtFWT09PT0"
MNI_LICENSE_PUBLIC_KEY="LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQ0lqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FnOEFNSUlDQ2dLQ0FnRUFwc2Q4eW9KN2FpMHFWeU8rWDNwYwphNXIxVFhBSUE5MFVjVVJERCtsdmM4OU1VakdkcUd2OU9LZWZXcGxLaHM1Wnd6WjZsK09va1llL2JjOGpYOUpLCmVmZHQzYkVHWWE0cnYrVEpyZWRlS1VqTDkrR21JQU81eFppeUd2WTlkR1NtajRaN2JaNXdobDlTLzhmSERPR2MKNFZITmozV0FlT3NEOVUrMmxoMnozNHRVT2w1OG1ncDYyQkUvR0YrZmJkWHR6T2Vtc3Q3K0k4ZTRkUFgveGFnbQpNeENHRVhEK2UreUJreTlJcmYzeVVTY2RNdHRSVVNhbVBIeGt5bFFidnVCSy9sd1NsY0lteGEvWjVMYTcwRHZBCkZpSGJBTW1TYVIwQXoyMGh4cFpncytwWU5NMCtPeVQ0TXU5bUZrRC9keEgzRllZS0pjcTNnTTJOM296ZzdiTXcKTEhHNmxYbkpteVVhS3dUT0pDZzlmM2tBOVl0SXhydC9VZGphYkNOY3huLeecowDreyStNcHFCc0RFRlc5TW5DSgpNWHU4eVc0eUN2Uks3TEhjVm15WDl5Sk9DTlhrTTZKeWo4Q2R2S2VnYkhSNWNiNlQ1NjVKVXZJNi9oNFVmOGcrCmU0Z0luM0VTRndhdzdTNGdUdkNOc3poZ09tQ0xsN2dKWDd0cmV4dTFWK3NvamFYSFc1WG5oSXc2TzFaaDNyQmEKU1YweVFoa3pNajhJQXUzNWJZWHR3UzJUNDRQeERLUWtGYzZsZFhoK0ZscWdzYjJxK0NJbnJJNzVKaVlIQ3dpQgpONTdWT3FRUnRyS1VLYXU5MHpNa2JkTHNYNWtCM0pxTHBldW1pOGhITmJRZHExNFBEMFVWbGtpTG5TV1prOWdPCi9jMERrZ3AwK0ZoRnl2VXJ4VDlkSmFzQ0F3RUFBUT09Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQo="
MNI_DEFAULT_COUNTRY_CODE="GBR"
MNI_SERVICE_USERNAME="af06f2fe515b91efbLeeCowdreyb937343cdb54849c148c2"
MNI_SERVICE_KEY="BFmZLMn2VPc+l2OekJL0c+Sx6IF9uLeeCowdreyMGyhQ/ssshlz0X1uCYKTqJjzUM1iAw9OHX++MI6CPvB"
#
# OAuth2.0 / OpenID Connect
#
# local iamServer (KeyCloak)
OAUTH=true
OAUTH_CLIENT_ID="MNI"
OAUTH_CLIENT_SECRET="mQGulEEcowdREynXpDqBbt1Xe4yziKNs"
OAUTH_DISCOVERY_URL="https://marlinintegration.merkator.com:6443/realms/MNI/.well-known/openid-configuration"
# remote Microsoft Azure Active Directory (EntraID)
#OAUTH_CLIENT_ID="MNf3ce2c1d-b03c-4lee-4cowd-reydd5489d741I"
#OAUTH_CLIENT_SECRET="Nok8Q~RWkLeeCowdreykl1G_CUfoqJGdn."
#OAUTH_DISCOVERY_URL="https://login.microsoftonline.com/a17ec843-alee-4cowd-reyc-3e803a903e14/v2.0/.well-known/openid-configuration"
#
# alertService
#
ALERTSRV_CRONTIME="0 0 * * *"
ALERTSRV_DEBUG=true
ALERTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=120000
ALERTSRV_ENDPOINT_RETRY_INTERVAL_MS=15000
ALERTSRV_HOST_SERVICE_LOG_FILE="/var/log/mni/alert.log"
ALERTSRV_HOST_SERVICE_SYSTEMD="mnialert.service"
ALERTSRV_HOST_SERVICE_USERNAME="mnialert"
ALERTSRV_TLS_INSECURE_CONNECTIONS=true
ALERTSRV_WORKING_DIRECTORY="/usr/local/mni/alert"
#
# apiGateway
#
APIGW_ADDRESS="192.168.1.16"
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
APIGW_KRAKEND_VERSION="2.12.0"
APIGW_WORKING_DIRECTORY="/usr/local/mni/apigw"
#
# apiServer
#
APISERV_ADDRESS="0.0.0.0"
APISERV_API_DIRECTORY="/usr/local/mni/api/openapi"
APISERV_BACKUP_DIRECTORY="/usr/local/mni/api/backup"
APISERV_DEBUG=true
APISERV_DUCKDB_VERSION="v1.4.1"
APISERV_DUCKDB_BACKUP_CRONTIME="0 2 * * *"
APISERV_DUCKDB_BACKUP=true
APISERV_DUCKDB_FILE="/usr/local/mni/api/mni.duckdb"
APISERV_DUCKDB_MAX_MEMORY="20GB"
APISERV_DUCKDB_THREADS=4
APISERV_ENCRYPTION_KEY="qBU4K9XBw2JtYx7puSGiSig8LbxxDpSaprK7+u+EJI8="
APISERV_ENCRYPTION_IV="U5uKpGIE3cIXh5kuhFZXuQ=="
APISERV_KEEPALIVE=true
APISERV_HOST_SERVICE_LOG_FILE="/var/log/mni/api.log"
APISERV_HOST_SERVICE_SYSTEMD="mniapi.service"
APISERV_HOST_SERVICE_USERNAME="mniapi"
APISERV_MULTICAST_ADDRESS="230.185.184.183"
APISERV_MULTICAST_PORT=54321
APISERV_PORT=7443
APISERV_PREMISES_PASSED_BOUNDARY_DISTANCE=35
APISERV_ROLE="standalone"
APISERV_SPATIAL_UPDATE_GEOMETRY_CRONTIME="*/5 * * * *"
APISERV_SSL_CERT="api.crt"
APISERV_SSL_CSR="api.csr"
APISERV_SSL_DAYS=90
APISERV_SSL_KEY="api.key"
APISERV_SSL_SIZE=4096
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
FETCHSRV_CVE_SCAN=true
FETCHSRV_CVE_DIRECTORY="/usr/local/mni/cvelistV5"
FETCHSRV_DEBUG=true
FETCHSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=120000
FETCHSRV_ENDPOINT_RETRY_INTERVAL_MS=15000
FETCHSRV_FX_UPDATE=true
FETCHSRV_HOST_SERVICE_LOG_FILE="/var/log/mni/fetch.log"
FETCHSRV_HOST_SERVICE_SYSTEMD="mnifetch.service"
FETCHSRV_HOST_SERVICE_USERNAME="mnifetch"
FETCHSRV_TLS_INSECURE_CONNECTIONS=true
FETCHSRV_WORKING_DIRECTORY="/usr/local/mni/fetch"
#
# uiServer
#
UISERV_ADDRESS="192.168.1.16"
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
UISERV_TLS_INSECURE_CONNECTIONS=true
UISERV_URL_PREFIX="/mni"
UISERV_USE_DNS_SD=false
UISERV_WORKING_DIRECTORY="/usr/local/mni/ui"
#
# IAM
#
IAM_ADDRESS="192.168.1.16"
IAM_BOOTSTRAP_ADMIN_USERNAME="admin"
IAM_BOOTSTRAP_ADMIN_PASSWORD="admin"
IAM_HOST_SERVICE_LOG_FILE="/var/log/mni/iam.log"
IAM_HOST_SERVICE_SYSTEMD="mniiam.service"
IAM_HOST_SERVICE_USERNAME="mniiam"
IAM_KEYCLOAK_VERSION="26.4.4"
IAM_PORT_HTTPS=6443
IAM_SSL_CERT="iam.crt"
IAM_SSL_CSR="iam.csr"
IAM_SSL_DAYS=90
IAM_SSL_KEY="iam.key"
IAM_SSL_SIZE=4096
IAM_WORKING_DIRECTORY="/usr/local/mni/iam"
#
# predictService
#
PREDICTSRV_CRONTIME="0 0 * * *"
PREDICTSRV_DEBUG=true
PREDICTSRV_ENDPOINT_RETRY_INTERVAL_MS=15000
PREDICTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=60000
PREDICTSRV_HOST_SERVICE_LOG_FILE="/var/log/mni/predict.log"
PREDICTSRV_HOST_SERVICE_SYSTEMD="mnipredict.service"
PREDICTSRV_HOST_SERVICE_USERNAME="mnipredict"
PREDICTSRV_TLS_INSECURE_CONNECTIONS=true
PREDICTSRV_WORKING_DIRECTORY="/usr/local/mni/predict"
#
# dnsServer
#
DNSSERV_INSTALL=false
DNSSERV_ADDRESS=
DNSSERV_VERSION="2.70"
DNSSERV_HOST_SERVICE_LOG_FILE="/var/log/mni/dns.log"
DNSSERV_HOST_SERVICE_SYSTEMD="mnidns.service"
DNSSERV_HOST_SERVICE_USERNAME="mnidns"
DNSSERV_PORT=53
DNSSERV_HOST="marlinintegration"
DNSSERV_DOMAIN="merkator.com"
DNSSERV_WORKING_DIRECTORY="/usr/local/mni/dns"
DNSSERV_SYSTEMD_RESOLVE=1
DNSSERV_RESOLVCONF=1
#
```

---

# 13. Hosting Specifications

## 13.1. Standalone

### 13.1.1. Combined Single Host

| Component       | CPU | RAM  | Disk |
| --------------- | --- | ---- | ---- |
| All Combined    | 4   | 16GB | 64GB |
| API Server      | 2   | 10GB | 8GB  |
| Alert Service   | 1   | 1GB  | 1GB  |
| API Gateway     | 1   | 1GB  | 1GB  |
| Fetch Service   | 1   | 1GB  | 4GB  |
| Predict Service | 1   | 1GB  | 1GB  |
| UI Server       | 1   | 1GB  | 1GB  |

### 13.1.2. Individual Hosts

| Component       | CPU | RAM  | Disk |
| --------------- | --- | ---- | ---- |
| All Combined    | 4   | 16GB | 64GB |
| API Server      | 2   | 10GB | 8GB  |
| Alert Service   | 1   | 1GB  | 1GB  |
| API Gateway     | 1   | 1GB  | 1GB  |
| Fetch Service   | 1   | 1GB  | 4GB  |
| Predict Service | 1   | 1GB  | 1GB  |
| UI Server       | 1   | 1GB  | 1GB  |

## 13.2. Cluster

### 13.2.1. Per API Server Host

| Component  | CPU | RAM  | Disk |
| ---------- | --- | ---- | ---- |
| API Server | 2   | 10GB | 8GB  |

### 13.2.2. Other

| Component       | CPU | RAM | Disk |
| --------------- | --- | --- | ---- |
| Alert Service   | 1   | 1GB | 1GB  |
| API Gateway     | 1   | 1GB | 1GB  |
| Fetch Service   | 1   | 1GB | 4GB  |
| Predict Service | 1   | 1GB | 1GB  |
| UI Server       | 1   | 1GB | 1GB  |

> **Note:** 
> - Both the API Gateway and UI Server can be deployed on to multiple hosts without additional configuration. The DNS A records used by MNI will need to be modified to support multiple resolved hosts/IP addresses (DNS round-robin)

## 13.3. Operating Systems

MNI is developed and supported on Debian based operating systems, this includes Ubuntu and other similar variants. The minimum supported version of Debian is version 12.

> **Note:** RedHat Enterprise Linux (RHEL) and its variants are not supported but compatible and installation scripts will require adjustment to support the RHEL package manager. For demonstration systems any host supporting DuckDB, NodeJS 22.x can be used.

## 13.4. Host Firewalls

A generic example for iptables/netfilter with MNI deployed on a single host supporting IPv4 is shown below:

```text
*filter
:INPUT ACCEPT [0:0]
:FORWARD ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
-A INPUT -i lo -j ACCEPT
-A INPUT -i eth0 -m state --state ESTABLISHED,RELATED -j ACCEPT
-A INPUT -p tcp -m tcp -m multiport --dports 4443,6443,7443,8443 -m conntrack --ctstate NEW,RELATED,ESTABLISHED -j ACCEPT
-A INPUT -p tcp -m tcp --dport 22 -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT
-A INPUT -p icmp --icmp-type 8 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
-A INPUT -p icmp --icmp-type 0 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
-A INPUT -s 8.8.8.8/32 -p udp -m udp --sport 53 -m state --state ESTABLISHED -j ACCEPT
-A INPUT -s 8.8.4.4/32 -p udp -m udp --sport 53 -m state --state ESTABLISHED -j ACCEPT
-A INPUT -i eth0 -j DROP
-A FORWARD -j ACCEPT
-A OUTPUT -o lo -j ACCEPT
-A OUTPUT -p icmp --icmp-type 8 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
-A OUTPUT -p icmp --icmp-type 0 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
-A OUTPUT -d 8.8.8.8/32 -p udp -m udp --dport 53 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
-A OUTPUT -d 8.8.4.4/32 -p udp -m udp --dport 53 -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
-A OUTPUT -o eth0 -j ACCEPT
-A OUTPUT -j ACCEPT
COMMIT
```

> **Note:** 
> - port numbers `4443`,`6443`,`7443` and `8443` should be updated to reflect deployment 
> - port number `22` is used for SSH connections on the host
> - port number `53` is used for DNS operations and should be configured to reflect deployment
> - IP addresses `8.8.8.8` and `8.8.4.4` are used for upstream DNS resolution and should be changed to reflect deployment

---

# 14. License Generator

MNI requires a valid license to be included within the environment deployment file and this license must be generated specifically for the host or hosts operating the MNI API Server.

> **Note:**
> - if deploying API Server to a container environment, such as Kubernetes, MNI automatically detects this and is less stringent on the hostname matching on the license but will still enforce the licensed domain name.
> - The MNI License Generator is NOT included into the release archive and should **NOT** be provided to customers nor partners.
> - The MNI License Generator includes cryptographic private and public keys, the public key is also embedded within `oasConstants.mjs` and the default `mni.ini`, all of these must use the **same** cryptographic keys

Within the `licensegen` source folder, deploy the required NodeJS libraries:

```bash
$ cd mni/src/licensegen
$ npm install --omit=dev

added 20 packages, and audited 21 packages in 590ms

7 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

Test execution of `licensegen`:

```bash
$ node licenseGen.mjs 
20251120T114910 error missing CLI options/parameters
20251120T114910 usage:

	node licenseGen.mjs \
	--generate				create a new encrypted key for inclusion within mni.ini
		[--out=mni.key]		      	filename to save encrypted key to
		[--start=YYYYMMDD[T]HHmmss]
		[--duration=13]			      positive integer, no validation against unit is performed
		[--unit=month]	      		second,minute,hour,day,week,month,quarter or year
		[--role=standalone		
    [--host=mni]	        		the hostname executing API Server
		[--domain=merkator.local]	the domain name executing API Server

	--verify				verify encrypted key contents
		[--in=mni.key]	      		filename to read encrypted key from

20251120T114910 example:

	node licenseGen.mjs --generate --start=20250801T000000 --duration=1 --unit=month --role=standalone --host=mdt --domain=marlindt.net --out=mdt.pem
```

To generate a standalone single host license key:

```bash
$ node licenseGen.mjs --generate --start=20250801T000000 --duration=1 --unit=month --role=standalone --host=mni --domain=customer.com --out=customer.pem
20251120T115423 info {
  out: 'customer.pem',
  role: 'standalone',
  host: 'mni',
  domain: 'customer.com',
  start: '20250801T000000',
  expiry: '20250831T235959'
}
$ cat customer.pem
PT09PUJFR0lOIExJQ0VOU0UgS0VZPT09PQpBUEx4Vk5hQ2Y2OGd3ZEpmMmRZbHhFMTU1V21pZEtwSzNTcjZJVXR1T1FMT05aaW0rOVJlWDh2RlQyNWgrQTRwWE1pRTYvdVludzZEYjBtY054T053L3pUM3ZiOHAwVm53TnJMbTd0MXIrSWV2S2FTanY2alUydVpLVUk5THRsWFJ6NjVadXFIbTNHZlhVNU41cmJPdVFXdHFvUDVSVS85T1hSdmxDL2ZscDhNNVZMR2NaMHBLNDJFVFJrUkNNVll0Ti9DWnZlWGc1RzZoRXBXaDUzODdvK2RCQ3J3UjdldnhnMHZvOVVNN2FrSit5VTZ5RWFNdFU5eGZia2FUOHJPWktCMEYzVWlhWXFJbHVrazQ3SmFxUS95NE5VY09RRytsWFhWTGJQK0hxZFQwdG94bnFwMUlvQ0MwOFRMQ2ladkkwaVdIRC9NaVNpSGZZUlZ2dFZ2Y2N3Ym9qWVJUY0Y3bVljaGpJM1R6amo3WHpQdkZRVVV6aWVjOHdlTHptQ2NEcEFrNHpZWUhSYWdSVVR1Zm9QK3VMYWR5V2JuMnRUUHVWOUt1UzNXS28vdWEwb0R0Nmx0R3lhZ2JyMHN4NG9kdytyaUFUOEFnMEhtcnA2ZEY4Ky9jREVaQWV5c2liTzAzUERiYnF2dDJ5NDhKK1FuZ2ZVR29oM0R2a2YxT3hMTFlzNHoxUE1nYW1RY0xrZDhNVU9iYmVSNjNFWWJyTU9oRlhiSjN2VEtNdm5td0tuZHJvU1AxOGdQSE92dnpUeXhqMENrT2V3Yk1qZnh4UXRmVG1hSkhHRld5azA5dUh4S3F1bHBXSjBqTDV2bW9IU3BVSXRraDY4Z012V2pYYVVXR3cvdXBZNE01NG1xVDNka1ZkSmhCU214amMyZDR2ZU9nNENsWUpIR2lCWT18fFUyRnNkR1ZrWDE5RCtrVG1MQlRsTkx6SmUzV2tocTNjcjBONERtajAzVUNIZzJrc3FVajRLY0NJN3RiK3ZIR3VOa3o0U2JvWlZTeCtyWDFNN0lnQ3RTUGR6U3FYT3ZvZFFWNkRydVpWOGRUZTQxN2FJMVdIV2h0aVNaTWV4U3dTNk5aSXFpdFliOTdlQWdaZk5uVHM5YU8xNTZQTUlMTVE4bmJXV0xCSnJwaz0KV1lRVFpjbUdSdlIxL05zR3JRaHVJcVh4NHNPNU5zc3lqR2VNQk42QVhMbWdNalBPMFc3RWpoL0hUYmtHY0N1UDAwNEdQcjFxc0M5Q2RNVG5uS1NvNDRBMHkvZGs0MndaSVp6ZlVaK0FGZ29vZUR0MVE1bngyaHMvZ1BHbXhuRjZITEhUSk1LazJJQWQrQkZxYWljZEFKNFIvQlFOOXBlemdEbGRzQjFQODVhTjZiYWRIR3hFTW9OSSs4Vm0yUVMwVzFaTTlNYURFb3ZvM3kwcUtBY2JabUFEQXlqbDJOMnZ5MkRlVXpvQjVvYkl1UkU1MHNXSlErWjgzQUowZzlmRG5vaFM5RUlPdEx6Zno3SXhOMEpTRHRaL1VtbFRYbmdDYW9BU29VelVkWFluWEFwVWJ2NVUrUm4wRzdvNHUxRUZYTHJyMGIzVjdXZ0ZLYkRnOHUrMmVnTVlWejBhMkJieStKZWpodTBpZVQ1N1ZxT1c2V05zQlhPTWRLT1NKSWhrZUtVWFpmaDZvcml0UjFua3NwTkxKb3JhNVd6L01MNkVOMFIxazIvV3RBVzF5MHh3UzB6dXZUcGt4MXEySWNkbzdxWGRZWVVXYjlnbnFYUWVoMS90dWNVMzVoQVFIdlBsVTlwVjhVWDlFMms2S2p6cDkxV1k1TVZ0YXZueFh3R2YydGNkTDlzV3FaSllJdVFrcFhPMHVEZm5HdkM2R2tGV1RvUnkya3d1R3owVDUxZTRhbU55MGZSWGt5UGw2ejlyb3pIUGhhenpHTWt1cy9kTTZKZ28vUmFiQ0N2UVhXUDh2aXNtQWNqZkFJQk1zeE53NXFiaU9uU3ROc1pkUW9kak9xZzJKV3RaS2pBUkc2MWVYR0E1TmxKUENFZjloY25VeGxoNlJtOHYxams9Cj09PT1FTkQgTElDRU5TRSBLRVk9PT09
```

The contents of the generated license key file, in this example `customer.pem` should be placed within the respective `mni.ini` variable `MNI_LICENSE_PRIVATE_KEY` prior to deployment, for example:

```bash
#
# Common
#
...
MNI_LICENSE_PRIVATE_KEY="PT09PUJFR0lOIExJQ0VOU0UgS0VZPT09PQpBUEx4Vk5hQ2Y2OGd3ZEpmMmRZbHhFMTU1V21pZEtwSzNTcjZJVXR1T1FMT05aaW0rOVJlWDh2RlQyNWgrQTRwWE1pRTYvdVludzZEYjBtY054T053L3pUM3ZiOHAwVm53TnJMbTd0MXIrSWV2S2FTanY2alUydVpLVUk5THRsWFJ6NjVadXFIbTNHZlhVNU41cmJPdVFXdHFvUDVSVS85T1hSdmxDL2ZscDhNNVZMR2NaMHBLNDJFVFJrUkNNVll0Ti9DWnZlWGc1RzZoRXBXaDUzODdvK2RCQ3J3UjdldnhnMHZvOVVNN2FrSit5VTZ5RWFNdFU5eGZia2FUOHJPWktCMEYzVWlhWXFJbHVrazQ3SmFxUS95NE5VY09RRytsWFhWTGJQK0hxZFQwdG94bnFwMUlvQ0MwOFRMQ2ladkkwaVdIRC9NaVNpSGZZUlZ2dFZ2Y2N3Ym9qWVJUY0Y3bVljaGpJM1R6amo3WHpQdkZRVVV6aWVjOHdlTHptQ2NEcEFrNHpZWUhSYWdSVVR1Zm9QK3VMYWR5V2JuMnRUUHVWOUt1UzNXS28vdWEwb0R0Nmx0R3lhZ2JyMHN4NG9kdytyaUFUOEFnMEhtcnA2ZEY4Ky9jREVaQWV5c2liTzAzUERiYnF2dDJ5NDhKK1FuZ2ZVR29oM0R2a2YxT3hMTFlzNHoxUE1nYW1RY0xrZDhNVU9iYmVSNjNFWWJyTU9oRlhiSjN2VEtNdm5td0tuZHJvU1AxOGdQSE92dnpUeXhqMENrT2V3Yk1qZnh4UXRmVG1hSkhHRld5azA5dUh4S3F1bHBXSjBqTDV2bW9IU3BVSXRraDY4Z012V2pYYVVXR3cvdXBZNE01NG1xVDNka1ZkSmhCU214amMyZDR2ZU9nNENsWUpIR2lCWT18fFUyRnNkR1ZrWDE5RCtrVG1MQlRsTkx6SmUzV2tocTNjcjBONERtajAzVUNIZzJrc3FVajRLY0NJN3RiK3ZIR3VOa3o0U2JvWlZTeCtyWDFNN0lnQ3RTUGR6U3FYT3ZvZFFWNkRydVpWOGRUZTQxN2FJMVdIV2h0aVNaTWV4U3dTNk5aSXFpdFliOTdlQWdaZk5uVHM5YU8xNTZQTUlMTVE4bmJXV0xCSnJwaz0KV1lRVFpjbUdSdlIxL05zR3JRaHVJcVh4NHNPNU5zc3lqR2VNQk42QVhMbWdNalBPMFc3RWpoL0hUYmtHY0N1UDAwNEdQcjFxc0M5Q2RNVG5uS1NvNDRBMHkvZGs0MndaSVp6ZlVaK0FGZ29vZUR0MVE1bngyaHMvZ1BHbXhuRjZITEhUSk1LazJJQWQrQkZxYWljZEFKNFIvQlFOOXBlemdEbGRzQjFQODVhTjZiYWRIR3hFTW9OSSs4Vm0yUVMwVzFaTTlNYURFb3ZvM3kwcUtBY2JabUFEQXlqbDJOMnZ5MkRlVXpvQjVvYkl1UkU1MHNXSlErWjgzQUowZzlmRG5vaFM5RUlPdEx6Zno3SXhOMEpTRHRaL1VtbFRYbmdDYW9BU29VelVkWFluWEFwVWJ2NVUrUm4wRzdvNHUxRUZYTHJyMGIzVjdXZ0ZLYkRnOHUrMmVnTVlWejBhMkJieStKZWpodTBpZVQ1N1ZxT1c2V05zQlhPTWRLT1NKSWhrZUtVWFpmaDZvcml0UjFua3NwTkxKb3JhNVd6L01MNkVOMFIxazIvV3RBVzF5MHh3UzB6dXZUcGt4MXEySWNkbzdxWGRZWVVXYjlnbnFYUWVoMS90dWNVMzVoQVFIdlBsVTlwVjhVWDlFMms2S2p6cDkxV1k1TVZ0YXZueFh3R2YydGNkTDlzV3FaSllJdVFrcFhPMHVEZm5HdkM2R2tGV1RvUnkya3d1R3owVDUxZTRhbU55MGZSWGt5UGw2ejlyb3pIUGhhenpHTWt1cy9kTTZKZ28vUmFiQ0N2UVhXUDh2aXNtQWNqZkFJQk1zeE53NXFiaU9uU3ROc1pkUW9kak9xZzJKV3RaS2pBUkc2MWVYR0E1TmxKUENFZjloY25VeGxoNlJtOHYxams9Cj09PT1FTkQgTElDRU5TRSBLRVk9PT09"
...
```

> **Note:** For clustering, use `--role=master` and `--role=slave` respectively.

--

# 15. Building the release

The MNI CI/CD pipeline can be kickstarted manually by executing the pipeline script. This will perform the required steps to produce a version release archive and commit any changes back to the [MNI repository](https://dev.azure.com/MerkatorNV/_git/MNI) hosted within Microsoft Azure DevOps.

```bash
$ ../build/pipeline.sh 
▶️   Pipeline build 1763643251                                              [12:54:11]
▶️   Checking for YAML Query (yq)                                           [12:54:11]
✅  - ok                                                                    [12:54:11]
▶️   Checking for release version                                           [12:54:11]
✅  - ok                                                                    [12:54:11]
▶️   Updating build tag                                                     [12:54:11]
✅  - ok                                                                    [12:54:11]
▶️   Checking for JSON Query (jq)                                           [12:54:11]
✅  - ok                                                                    [12:54:11]
▶️   Checking for NodeJS                                                    [12:54:11]
✅  - ok                                                                    [12:54:11]
▶️   Scanning: apiServer (NodeJS)                                           [12:54:11]
✅  - ok                                                                    [12:54:12]
▶️   Scanning: uiServer (NodeJS)                                            [12:54:12]
✅  - ok                                                                    [12:54:13]
▶️   Scanning: predictService (NodeJS)                                      [12:54:13]
✅  - ok                                                                    [12:54:13]
▶️   Scanning: alertService (NodeJS)                                        [12:54:13]
✅  - ok                                                                    [12:54:14]
▶️   Scanning: fetchService (NodeJS)                                        [12:54:14]
✅  - ok                                                                    [12:54:14]
▶️   Scanning: licenseGen (NodeJS)                                          [12:54:14]
✅  - ok                                                                    [12:54:15]
▶️   Checking for JSON Query (jq)                                           [12:54:15]
✅  - ok                                                                    [12:54:15]
▶️   Checking for NodeJS                                                    [12:54:15]
✅  - ok                                                                    [12:54:15]
▶️   Checking for release version                                           [12:54:15]
✅  - ok                                                                    [12:54:15]
▶️   Documenting: apiServer (NodeJS)                                        [12:54:15]
✅  - ok                                                                    [12:54:22]
▶️   Documenting: uiServer (NodeJS)                                         [12:54:22]
✅  - ok                                                                    [12:54:26]
▶️   Documenting: predictService (NodeJS)                                   [12:54:26]
✅  - ok                                                                    [12:54:28]
▶️   Documenting: alertService (NodeJS)                                     [12:54:28]
✅  - ok                                                                    [12:54:30]
▶️   Documenting: fetchService (NodeJS)                                     [12:54:30]
✅  - ok                                                                    [12:54:33]
▶️   Documenting: licenseGen (NodeJS)                                       [12:54:33]
✅  - ok                                                                    [12:54:35]
▶️   Checking for YQ                                                        [12:54:35]
✅  - ok                                                                    [12:54:35]
▶️   Checking for release version                                           [12:54:35]
✅  - ok                                                                    [12:54:35]
▶️   Updating OpenAPI version and build tag                                 [12:54:35]
✅  - ok                                                                    [12:54:35]
▶️   OpenAPI Generate JSON                                                  [12:54:35]
✅  - ok                                                                    [12:54:36]
▶️   OpenAPI Generate HTML                                                  [12:54:36]
✅  - ok                                                                    [12:54:39]
▶️   Checking for NodeJS                                                    [12:54:39]
✅  - ok                                                                    [12:54:39]
▶️   Mermaid ERD to SVG                                                     [12:54:39]
✅  - ok                                                                    [12:54:41]
▶️   Checking for NodeJS                                                    [12:54:41]
✅  - ok                                                                    [12:54:41]
▶️   Packing UI                                                             [12:54:41]
✅  - ok                                                                    [12:54:43]
▶️   Preparing environment                                                  [12:54:43]
✅  - ok                                                                    [12:54:44]
▶️   Checking for NodeJS                                                    [12:54:44]
✅  - ok                                                                    [12:54:44]
✅  - ok                                                                    [12:54:44]
▶️   Copying source                                                         [12:54:44]
✅  - ok                                                                    [12:54:45]
▶️   Updating license public key                                            [12:54:45]
✅  - ok                                                                    [12:54:45]
▶️   Obfuscating JavaScript                                                 [12:54:45]
✅  - ok                                                                    [12:54:51]
▶️   Creating distribution archive                                          [12:54:51]
✅  - ok                                                                    [12:54:54]
✅  - ok                                                                    [12:54:54]
▶️   Updating upstream repository                                           [12:54:54]
✅  - ok                                                                    [12:54:56]
```

The build steps contained within the pipeline script are executed sequently in the following order:
1. `buildtag.sh`
2. `cvescan.sh`
3. `builddepjs.sh`
4. `openapi.sh`
5. `erd2svg.sh`
6. `buildui.sh`
7. `release.sh`

## 15.1. Individual Build Scripts
If required, the individual build scripts can be executed in isolation - examine contents of [build](build/) folder for further details but these include:
 - `builddepjs.sh` generate `nodejs-dependencies.md` in the documentation folder
 - `buildtag.sh` update the MNI version specific details in OpenAPI definitions and other areas
 - `buildui.sh` webpack the MNI UI to perform obfuscation
 - `cvescan.sh` perform CVE analysis on MNI JavaScript source code files
 - `erd2svg.sh` produced SVG diagram from the Entity Relationship Diagram definition extracted from the database schema
 - `openapi.sh` generate JSON/YAML definitions for the OpenAPI which are embedded within the API Server
 - `pipeline.sh` wrapper script to run all build steps
 - `release.sh` wrapper script to produce bundle of compressed TAR files containing each MNI component and MD5 verification file

## 15.2. Release artifacts

Within the `release` folder two files will be generated:

1. `mni_{version}.md5` this contains the MD5 hash signature of the main compressed TAR file
2. `mni_{version}.tar.gz` the version specific release of MNI

for example:

```bash
$ ls -1
mni_1.0.0.md5
mni_1.0.0.tar.gz
```

The version specific release archive can be verified as not corrupted or altered since the checksum was originally generated:

```bash
$ md5sum -c mni_1.0.0.md5
mni_1.0.0.tar.gz: OK
```

Unpacking the specific release of MNI, the contents include:

```bash
$ tar -zxf mni_1.0.0.tar.gz 
$ ls -1
mni_1.0.0.md5
mni_1.0.0.tar.gz
mni_alertService_1.0.0.md5
mni_alertService_1.0.0.tar.gz
mni_apiGateway_1.0.0.md5
mni_apiGateway_1.0.0.tar.gz
mni_apiServer_1.0.0.md5
mni_apiServer_1.0.0.tar.gz
mni_dnsServer_1.0.0.md5
mni_dnsServer_1.0.0.tar.gz
mni_fetchService_1.0.0.md5
mni_fetchService_1.0.0.tar.gz
mni_iamServer_1.0.0.md5
mni_iamServer_1.0.0.tar.gz
mni_predictService_1.0.0.md5
mni_predictService_1.0.0.tar.gz
mni_uiServer_1.0.0.md5
mni_uiServer_1.0.0.tar.gz
```

The component archives can also be verified as not corrupted or altered since the checksum was originally generated:

```bash
$ find . -type f -name "mni_*_?.?.?.md5" -exec md5sum -c {} \; && md5sum -c mni_?.?.?.md5
mni_fetchService_1.0.0.tar.gz: OK
mni_uiServer_1.0.0.tar.gz: OK
mni_alertService_1.0.0.tar.gz: OK
mni_dnsServer_1.0.0.tar.gz: OK
mni_iamServer_1.0.0.tar.gz: OK
mni_apiGateway_1.0.0.tar.gz: OK
mni_apiServer_1.0.0.tar.gz: OK
mni_predictService_1.0.0.tar.gz: OK
mni_1.0.0.tar.gz: OK
```

---

# 16. Deploying the release

Each MNI component archive can be unpacked for installation purposes.

The structure of all unpacked archives will be similar to:

```text
    ├── alertService
    ├── apiGateway
    ├── apiServer
    │   ├── sample
    │   └── world
    ├── dnsServer
    ├── fetchService
    ├── iamServer
    ├── predictService
    └── uiServer
        └── dist
            ├── css
            ├── fonts
            ├── img
            └── js
                └── vendor
                    └── chartjs
```

Each component folder will contain its own `mni.ini` - if using a single host, update the copy witin the API Server folder `apiServer` first, install the API Server, and all other components will defer to the installed environment configuration file.

Each component contains the following scripts:

- `mni.ini` this is a shared file that is duplicated into the release archive
- `common.sh` this is a shared file that is duplicated into the release archive
- `install.sh` this script is used for undertaking a new installation and is specific to the component
- `uninstall.sh` this script is used for uninstalling an previous installation and is specific to the component
- `update.sh` this script is used for updating an existing installation, typically this is just updating MNI itself but is specific to the component
- `upgrade.sh` this script is used for updating an existing installation, both any third-party and MNI itself will be upgrading but is specific to the component


## 16.1. Example Component Installation

```bash
# ./install.sh 
✋  MNI UI Server Install                                                              [17:56:30]
▶️   Adding MNI group                                                                  [17:56:30]
✅  - ok                                                                               [17:56:30]
▶️   Adding user account                                                               [17:56:30]
✅  - ok                                                                               [17:56:30]
▶️   Adding config directory                                                           [17:56:30]
✅  - ok                                                                               [17:56:30]
▶️   Adding log directory                                                              [17:56:30]
✅  - ok                                                                               [17:56:30]
▶️   Adding working directory                                                          [17:56:30]
✅  - ok                                                                               [17:56:30]
▶️   Adding working dist directory                                                     [17:56:30]
✅  - ok                                                                               [17:56:30]
▶️   Adding Config to config directory                                                 [17:56:30]
✅  - ok                                                                               [17:56:30]
▶️   Setting directory permissions                                                     [17:56:30]
✅  - ok                                                                               [17:56:30]
▶️   Preparing environment                                                             [17:56:30]
✅  - ok                                                                               [17:56:31]
▶️   Checking/Updating for valid address binding (uiServer)                            [17:56:31]
✅  - ok                                                                               [17:56:31]
▶️   Creating (if not exists) SSL certificate                                          [17:56:31]
✅  - ok                                                                               [17:56:31]
▶️   Updating NodeJS package for target                                                [17:56:31]
✅  - ok                                                                               [17:56:31]
▶️   Adding NodeJS libraries                                                           [17:56:31]
✅  - ok                                                                               [17:56:47]
▶️   Adding service log file                                                           [17:56:47]
✅  - ok                                                                               [17:56:47]
▶️   Adding SystemD service                                                            [17:56:47]
✅  - ok                                                                               [17:56:48]
✅  - completed                                                                        [17:56:48]
# cat /var/log/mni/ui.log 
 __  __           _         _                           __         
|  \/  | ___ _ __| | ____ _| |_ ___  _ __   _ ____   __/ /__  __ _ 
| |\/| |/ _ \ '__| |/ / _` | __/ _ \| '__| | '_ \ \ / / / __|/ _` |
| |  | |  __/ |  |   < (_| | || (_) | |    | | | \ V / /\__ \ (_| |
|_|  |_|\___|_|  |_|\_\__,_|\__\___/|_|    |_| |_|\_/_/ |___/\__,_|

20251120T175648 info {
  event: 'starting',
  mni: {
    name: 'MarlinDT Network Intelligence',
    version: '1.0.0',
    build: '1745876813'
  },
  endpoint: {
    host: 'marlinintegration',
    domain: 'merkator.com',
    fqdn: 'marlinintegration.merkator.com',
    address: '192.168.1.16',
    port: 4443,
    urlPrefix: '/mni',
    urlVersion: '/v1'
  },
  environment: {
    configDirectory: '/etc/mni',
    country: 'GBR',
    distDirectory: '/usr/local/mni/ui/dist',
    tickInterval: 60000,
    timestamp: 'YYYYMMDD[T]HHmmss',
    ignoreTlsSsl: true
  },
  apiGateway: {
    dns: 'https://marlinintegration.merkator.com:8443/mni/v1',
    ip: 'https://192.168.1.16:8443/mni/v1'
  },
  ouath: {
    enabled: true,
    discovery: 'https://marlinintegration.merkator.com:6443/realms/MNI/.well-known/openid-configuration',
    credentials: { id: '***', secret: '********************************' }
  },
  ssl: { key: 'ui.key', cert: 'ui.crt' },
  timeouts: { request: 120000 }
}
(node:11788) Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' makes TLS connections and HTTPS requests insecure by disabling certificate verification.
(Use `node --trace-warnings ...` to show where the warning was created)
20251120T175649 debug oauthDiscovery {
  authorize: 'https://192.168.1.16:6443/realms/MNI/protocol/openid-connect/auth',
  logout: 'https://192.168.1.16:6443/realms/MNI/protocol/openid-connect/logout',
  token: 'https://192.168.1.16:6443/realms/MNI/protocol/openid-connect/token'
}
20251120T175649 debug dynamicPaths { urlPath: '/mni', osPath: '/usr/local/mni/ui/dist' }
20251120T175649 debug dynamicPaths { urlPath: '/mni/css', osPath: '/usr/local/mni/ui/dist/css' }
20251120T175649 debug dynamicPaths { urlPath: '/mni/fonts', osPath: '/usr/local/mni/ui/dist/fonts' }
20251120T175649 debug dynamicPaths { urlPath: '/mni/img', osPath: '/usr/local/mni/ui/dist/img' }
20251120T175649 debug dynamicPaths { urlPath: '/mni/js', osPath: '/usr/local/mni/ui/dist/js' }
20251120T175649 debug dynamicPaths {
  urlPath: '/mni/js/vendor',
  osPath: '/usr/local/mni/ui/dist/js/vendor'
}
20251120T175649 debug dynamicPaths {
  urlPath: '/mni/js/vendor/chartjs',
  osPath: '/usr/local/mni/ui/dist/js/vendor/chartjs'
}
```

> **Note:** this will use any existing deployed `/etc/mni/mni.ini` environment configuration file, otherwise the existing copy within the component release will be deployed

## 16.2. Example Component Update

```bash
# ./update.sh 
✋  MNI UI Server Upgrade                                                              [18:02:05]
▶️   Stopping SystemD service                                                          [18:02:05]
✅  - ok                                                                               [18:02:05]
▶️   Updating environment                                                              [18:02:05]
✅  - ok                                                                               [18:02:05]
▶️   Restarting SystemD service[                                                       [18:02:05]
✅  - ok                                                                               [18:02:06]
✅  - completed                                                                        [18:02:06]
```

> **Note:** this expects to use the existing deployed `/etc/mni/mni.ini` environment configuration file

## 16.3. Example Component Upgrade

```bash
# ./upgrade.sh 
✋  MNI UI Server Upgrade                                                              [17:59:24]
▶️   Stopping SystemD service                                                          [17:59:24]
✅  - ok                                                                               [17:59:24]
▶️   Updating environment                                                              [17:59:24]
✅  - ok                                                                               [17:59:24]
▶️   Updating NodeJS package for target                                                [17:59:24]
✅  - ok                                                                               [17:59:24]
▶️   Updating NodeJS libraries                                                         [17:59:24]
✅  - ok                                                                               [17:59:25]
▶️   Updating & Restarting SystemD service                                             [17:59:25]
✅  - ok                                                                               [17:59:26]
✅  - completed                                                                        [17:59:26]
```

> **Note:** 
> - this expects to use the existing deployed `/etc/mni/mni.ini` environment configuration file

To upgrade third-party components adjust `APIGW_KRAKEND_VERSION`, `APISERV_DUCKDB_VERSION`, `IAM_KEYCLOAK_VERSION` with the required version number within the deployed environment configuration file (`/etc/mni/mni.ini`):

```bash
APIGW_KRAKEND_VERSION="2.12.0"
APISERV_DUCKDB_VERSION="v1.4.2"
IAM_KEYCLOAK_VERSION="26.4.4"
```

## 16.4. Example Component Removal

```bash
# ./uninstall.sh 
✋  MNI UI Server Uninstall                                                            [17:55:18]
▶️   Removing systemD service                                                          [17:55:18]
✅  - ok                                                                               [17:55:19]
▶️   Removing NodeJS libraries                                                         [17:55:19]
✅  - ok                                                                               [17:55:19]
▶️   Removing working directory                                                        [17:55:19]
✅  - ok                                                                               [17:55:20]
▶️   Removing user account                                                             [17:55:20]
✅  - ok                                                                               [17:55:20]
✅  - completed
```

> **Note:** this expects to use the existing deployed `/etc/mni/mni.ini` environment configuration file


---

# 17. Integration Lab

![](docs/architecture/mni-architectures-Integration%20Lab.svg)

Integration Lab
> ssh admin@192.168.1.16

> **Note:** all MNI created host accounts are automatically created, secured and have shell access disabled, use `systemctl` to control the running service from a privileged, i.e. `root`, account

## 17.1. Host

- IP: `192.168.1.16`
- Host name: `marlinintegration`
- Domain name: `merkator.com`
- username: `admin`
- password: available from IT Support
- root username: `root`
- root password: available from IT Support

### 17.1.1. DNS Records

| Component   | DNS Type | DNS Record Name                               | DNS Record Value                                                  |
| ----------- | -------- | --------------------------------------------- | ----------------------------------------------------------------- |
| API Server  | `SRV`    | `_https._tcp.apisrrver.marlinintegration.com` | `0 10 7443 _https._tcp.apiserver.marlinintegration.merkator.com.` |
| API Server  | `A`      | `apiserver.marlinintegration.merkator.com`    | `127.0.0.1`                                                       |
| API Gateway | `SRV`    | `_https._tcp.gateway.marlinintegration.com`   | `0 10 8443 _https._tcp.gateway.marlinintegration.merkator.com`    |
| API Gateway | `A`      | `marlinintegration.merkator.com`              | `192.168.1.16`                                                    |

The following are neither defined and/or not used within this environment:

| Component   | DNS Type | DNS Record Name                         | DNS Record Value                                           |
| ----------- | -------- | --------------------------------------- | ---------------------------------------------------------- |
| IAM Server  | `SRV`    | `_https._tcp.iam.marlinintegration.com` | `0 10 5443 _https._tcp.iam.marlinintegration.merkator.com` |
| IAM Server  | `A`      | `marlinintegration.merkator.com`        | `192.168.1.16`                                             |
| UI Server   | `SRV`    | `_https._tcp.ui.marlinintegration.com`  | `0 10 4443 _https._tcp.ui.marlinintegration.merkator.com`  |
| API Gateway | `A`      | `marlinintegration.merkator.com`        | `192.168.1.16`                                             |

> **Note:** DNS records for this host are hosted externally from the lab environment, please contact IT Support for further details

## 17.2. User Interface

- Browser URL: [[URL](https://marlinintegration.merkator.com:4443/)](https://marlinintegration.merkator.com:4443/)
- username: `lee.cowdrey@merkator.com`
- password: `merkator`
- OS username: `mniui`
- OS group: `mni`
- OS deployed location: `/usr/local/mni/ui`
- OS log location: `/var/log/mni/ui.log`

## 17.3. API Server

- Endpoint Prefix: [https://marlinintegration.merkator.com:7443/mni/v1](https://marlinintegration.merkator.com:7443/mni/v1)
- service username: `af06f2fe515b91efb5f9a6ceddcb937343cdb54849c148c2`
- service key: `BFmZLMn2VPc+l2OekJL0c+Sx6IF9uhM2nAp34TMGyhQ/shhlz0X1uCYKTqJjzUM1iAw9OHX++MI6CPvB`
- OS username: `mniapi`
- OS group: `mni`
- OS deployed location: `/usr/local/mni/api`
- OS log location: `/var/log/mni/api.log`

## 17.4. API Gateway

- Endpoint Prefix: [https://marlinintegration.merkator.com:8443/mni/v1](https://marlinintegration.merkator.com:8443/mni/v1)
- OS username: `mniapigw`
- OS group: `mni`
- OS deployed location: `/usr/local/mni/apigw`
- OS log location: `/var/log/mni/apigw.log`

## 17.5. Alert Service

- OS username: `mnialert`
- OS group: `mni`
- OS deployed location: `/usr/local/mni/alert`
- OS log location: `/var/log/mni/alert.log`

## 17.6. Fetch Service

- OS username: `mnifetch`
- OS group: `mni`
- OS deployed location: `/usr/local/mni/fetch`
- OS log location: `/var/log/mni/api.log`

## 17.7. Predict Service

- OS username: `mnipredict`
- OS group: `mni`
- OS deployed location: `/usr/local/mni/predict`
- OS log location: `/var/log/mni/predict.log`

---

# 18. Third-Party 

MNI is based on open source software and does not any embedded commercial components.

## 18.1. Map Rendering

By default MNI User Interface makes use of Google Maps and as such requires a Google Maps API key - the credentials can be configured via the MNI Secrets API or the default changed in the API Server database schema definition prior to installation. Without this key the MNI User Interface will **NOT** visualise poles, sites or trenches over topological terrain - cables, ducts, network equipment are not impacted by this.

## 18.2. Foreign Exchange Rates

If enabled in MNI Fetch makes use of a free service from [exchangeratesapi.io](https://exchangeratesapi.io/) which is limited to 100 requests per calendar month. The credentials can be configured via the MNI Secrets API or the default changed in the API Server database schema definition prior to installation.

> **Note:**
> - MNI uses the same free credentials, therefore multiple installations may cause limits imposed by [exchangeratesapi.io](https://exchangeratesapi.io/) to be reached
> - For each deployment, it is recommended that the customer obtains their own free credentials from [exchangeratesapi.io](https://manage.exchangeratesapi.io/signup/free) to avoid hitting any limits.

## 18.3. Common Vulnerabilities and Exposures (CVE) Repository

If enabled, there are no commercial requirements for caching the CVE repository. Any further questions or concerns should be directed to [cve.org](https://www.cve.org/)

## 18.4. Sample Data

The API Server includes sample data covering cables, ducts, utility poles, network equipment, racks, sites, services and trenches for the mutiple countries.

This data can be added by executing the `sample.sh` script contained within the API Server installation folder once the API Server has finished installation.

## 18.5. World Boundaries

The API Server includes the world geometry boundaries of 230 countries, allowing longitude (X) and latitude (Y) coordinates to be matched to a single geographic country - this data is loaded once during installation, summarised within the API Server and the raw data subsequently removed.

This data is sourced from [geoBoundaries - an open database of political administrative boundaries](https://www.geoboundaries.org).

## 18.6. Code Scanning

As part of the CI/CD process, MNI is scanned for vulnerabilities that may exist either in the MNI source code. This is undertaken via.

| Third-Party Package | Used Version | License    |
| ------------------- | ------------ | ---------- |
| `auditjs`           | 4.0.47       | Apache 2.0 |

Please refer to [auditjs](https://github.com/sonatype-nexus-community/auditjs) for further details.

## 18.7. Third-Party Elements & Libraries

MNI makes use of third-party JavaScript libraries, all referenced libraries are currently open source.

A highly detailed list is automatically generated through the CI/CD process and is available [dependencies](docs/nodejs-dependencies.md), summary shown below for reference.

### 18.7.1. API Gateway 

| Third-Party Package | Used Version | License    |
| ------------------- | ------------ | ---------- |
| `krakenD`           | 2.12.0       | Apache 2.0 |

### 18.7.2. API Server 

| Third-Party Package    | Used Version | License      |
| ---------------------- | ------------ | ------------ |
| `basic-auth-connect`   | 1.1.0        | MIT          |
| `compare-versions`     | 6.1.1        | MIT          |
| `compression`          | 1.8.1        | MIT          |
| `duckdb`               | 1.4.1        | MIT          |
| `dayjs`                | 1.11.18      | MIT          |
| `dotenv`               | 17.2.3       | BSD-2-Clause |
| `express`              | 5.1.0        | MIT          |
| `express-fileupload`   | 1.5.2        | MIT          |
| `express-validator`    | 7.2.1        | MIT          |
| `js-base64`            | 3.7.8        | BSD-3-Clause |
| `morgan`               | 1.10.1       | MIT          |
| `nocache`              | 4.0.0        | MIT          |
| `node-cron`            | 4.2.1        | ISC          |
| `segfault-handler`     | 1.3.0        | BSD-3-Clause |
| `serve-favicon`        | 2.5.1        | MIT          |
| `software-license-key` | 1.0.2        | MIT          |
| `uuid`                 | 13.0.0       | MIT          |

### 18.7.3. DNS Server 

| Third-Party Package | Used Version | License |
| ------------------- | ------------ | ------- |
| `dnsmasq`           | 2.7.0        | GPL     |

### 18.7.4. UI Server

| Third-Party Package        | Used Version | License      |
| -------------------------- | ------------ | ------------ |
| `dayjs`                    | 1.11.18      | MIT          |
| `dotenv`                   | 17.2.3       | BSD-2-Clause |
| `ejs`                      | 3.1.10       | Apache-2.0   |
| `express`                  | 5.1.0        | MIT          |
| `express-cache-controller` | 1.1.0        | MIT          |
| `morgan`                   | 1.10.1       | MIT          |
| `segfault-handler`         | 1.3.0        | BSD-3-Clause |
| `serve-favicon`            | 2.5.1        | MIT          |
| `uuid`                     | 13.0.0       | MIT          |


### 18.7.5. Predict Service

| Third-Party Package | Used Version | License      |
| ------------------- | ------------ | ------------ |
| `dotenv`            | 17.2.3       | BSD-2-Clause |
| `segfault-handler`  | 1.3.0        | BSD-3-Clause |
| `uuid`              | 13.0.0       | MIT          |


### 18.7.6. Alert Service

| Third-Party Package | Used Version | License      |
| ------------------- | ------------ | ------------ |
| `dotenv`            | 17.2.3       | BSD-2-Clause |
| `kafkajs`           | 2.2.4        | MIT          |
| `node-cron`         | 4.2.1        | ISC          |
| `nodemailer`        | 7.0.9        | MIT-0        |
| `segfault-handler`  | 1.3.0        | BSD-3-Clause |
| `uuid`              | 11.0.5       | MIT          |

### 18.7.7. Fetch Service

| Third-Party Package | Used Version | License                 |
| ------------------- | ------------ | ----------------------- |
| `dotenv`            | 17.2.3       | BSD-2-Clause            |
| `glob`              | 11.0.3       | ISC                     |
| `mysql2`            | 3.15.3       | MIT                     |
| `node-cron`         | 4.2.1        | ISC                     |
| `oracledb`          | 6.10.0       | (Apache-2.0 OR UPL-1.0) |
| `segfault-handler`  | 1.3.0        | BSD-3-Clause            |
| `uuid`              | 13.0.0       | MIT                     |


### 18.7.8. License Generator

| Third-Party Package    | Used Version | License      |
| ---------------------- | ------------ | ------------ |
| `dotenv`               | 17.2.3       | BSD-2-Clause |
| `js-base64`            | 3.7.8        | BSD-3-Clause |
| `software-license-key` | 1.0.2        | MIT          |
| `yargs`                | 18.0.0       | MIT          |

---

# 19. MNI OpenAPIs

Are automatically included into the API Server release and made available both via API (`/mni/v1/api`) and also the MNI User Interface (`https://marlinintegration.merkator.com:4443/mni/openapi`).

The MNI User Interface includes additional swagger tooling to allow the APIs to be executed directly against the running instance of MNI.

> **Note:** 
> - due to SSL Certificates issues within the Integration Lab, most clients will have to previouslsy accepted and trust the certificates used by Merkator.
> - Perform a [HTTP GET /api/readiness](https://192.168.1.16:8443/mni/v1/api/readiness) in a separate browser tab and explicitly accept the certificates prior to proceeding to continue
> - At this point you should receive a JSON response with a timestamp indicating that MNI API Server is accepting connections
> ```json
> {"point":"20251121T152211"}
> ```

The MNI OpenAPIs are available in multple formats including:
- [HTML](docs/api/mni.html)
- [JSON](api/mni.json)
- [YAML](api/mni.yaml)

> **Note:** During deployment of MNI API Server, the YAML definitions are updated to reflect the host and domain names hosting it, before a JSON variant is produced and also stored.

---

# 20. MNI User Interface (UI)

The MNI UI is loosely based on a tab design and includes:

## 20.1. Login

A typical login page is shown, with the exception of a OpenID Connect logo. If the logo is displayed then MNI has been configured for OAuth2.0/OpenID Connect.

Login credentias are validated through the MNI API Server (`/mni/v1/login`) and if successful, the client is redirected to the readiness page.

The MNI API Server makes uses of the included Identity and Access Management (IAM) server, powered by KeyCloak, to perform authentication.

## 20.2. Readiness

The readiness page is a transition page, where by the client itself performs a MNI API Readiness check through the API Gateway before automatically moving to the Dashboard

> **Note**: if after 10 attempts, the client is not able to verify readiness, the client is redirected back to the login page.

## 20.3. Dashboard

The resource dashboard reflects the quantity of data available within MNI. The shown stacked chart represents the total number of a specific resource but split into active (green) and inactive (orange) as a percentage. It also provides business summary of the resource assets:

```text
                                   Premises Passed: 78 | Trench Coverage: 2Mm | Cable Coverage: 0m
Costs: (Euro)  Cables €40,382 | Ducts €57,950 | Poles €1,170 | NE €34,449.61 | Racks €21,996 | Services €0 | Sites €158,000 | Trenches €101,187,243.55
```

The MNI API Server is installed with a default country/locale and this default is used during presentation:

```text
                                 Premises Passed: 13 | Trench Coverage: 742.55m | Cable Coverage: 0m
 Costs: (Sterling)  Cables £132 | Ducts £300 | Poles £270 | NE £34,449.61 | Racks £1,476 | Services £0 | Sites £123,000 | Trenches £37,127.50
```

## 20.4. Cables

## 20.5. Ducts

## 20.6. Poles

## 20.7. Network Eqiupment

## 20.8. Racks

## 20.9. Sites

## 20.10. Services

## 20.11. Trenches

### 20.11.1. Detail

### 20.11.2. Lifetime

### 20.11.3. Per Country

## 20.12. Quote-to-Cash (Q2C)

## 20.13. Providers

### 20.13.1. Email

### 20.13.2. Map

### 20.13.3. Kafka

### 20.13.4. Workflow Engines

## 20.14. Alerts

### 20.14.1. Callback

### 20.14.2. Publish (Kafka)

### 20.14.3. Email

### 20.14.4. Workflow

## 20.15. Settings

## 20.16. OpenAPIs

## 20.17. Help/About

## 20.18. Quit (Logout)

While there is not an actual page for this, the client performs a logout through the MNI API Server (`/mni/v1/logout`) and any cached authentication data is removed.

The client is then redirected to the login page.

---

# 21. Merkator Technical Services

For technical support, you can contact Merkator by email, or on the web.

## 21.1. By email

Customer Service Management may be reached at: [support@marlindt.net](mailto:support@marlindt.net).

## 21.2. On the web

Please visit [support.marlindt.net](https://support.marlindt.net/). To obtain access, you must provide your support contracted email address.

## 21.3. Technical documentation

The latest technical documentation for products is now available on the [Customer Service Management](https://support.marlindt.net/).
Make sure you have an account to access the content. 


---

# 22. Corporate Headquarters

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
