---
title: Network Insight (NI) Guide/FAQ/How-To
category: how-to
contacts:
  - support@cowdrey.net
creator: Cowdrey Consulting
url: https://www.cowdrey.net/
paginate: false
lang: en-GB
date: 2026-01-01
keywords:
  - ccuk
  - ni
  - pni
  - lni
draft: true
---

![](docs/insight-logo.png)
<h1>Network Insight</h1>

- [1. Introduction](#1-introduction)
  - [1.1. What is the problem?](#11-what-is-the-problem)
  - [1.2. How is Network Insight (NI) different?](#12-how-is-network-insight-ni-different)
  - [1.3. Why should your business care?](#13-why-should-your-business-care)
- [2. API-First](#2-api-first)
- [3. Predictions](#3-predictions)
    - [3.0.1. Simple](#301-simple)
    - [3.0.2. Complex](#302-complex)
  - [3.1. What does “prediction” mean in this context?](#31-what-does-prediction-mean-in-this-context)
- [4. Alerts](#4-alerts)
- [5. Resources](#5-resources)
- [6. Time-Series](#6-time-series)
  - [6.1. Concept](#61-concept)
  - [6.2. Behind the Scenes](#62-behind-the-scenes)
  - [6.3. Shadow Time-Series Tables](#63-shadow-time-series-tables)
    - [6.3.1. Bulk Create (Import)](#631-bulk-create-import)
  - [6.4. Bulk Read (Export)](#64-bulk-read-export)
    - [6.4.1. Create](#641-create)
    - [6.4.2. Read](#642-read)
    - [6.4.3. Update](#643-update)
    - [6.4.4. Delete](#644-delete)
- [7. Resource Related Dependencies](#7-resource-related-dependencies)
  - [7.1. Data Relationships](#71-data-relationships)
- [8. Database Schema](#8-database-schema)
- [9. Architectures](#9-architectures)
    - [9.0.1. Application](#901-application)
    - [9.0.2. DevOps CI/CD Pipeline](#902-devops-cicd-pipeline)
    - [9.0.3. Functional](#903-functional)
    - [9.0.4. Integration](#904-integration)
    - [9.0.5. Logical (Cloud)](#905-logical-cloud)
    - [9.0.6. Logical (On-Premise)](#906-logical-on-premise)
    - [9.0.7. Cluster Replication](#907-cluster-replication)
    - [9.0.8. Security](#908-security)
      - [9.0.8.1. Through the API Gateway](#9081-through-the-api-gateway)
    - [9.0.9. Internally](#909-internally)
      - [9.0.9.1. API Server Encrypted Storage](#9091-api-server-encrypted-storage)
      - [9.0.9.2. Role-Based Access Control (RBAC)](#9092-role-based-access-control-rbac)
    - [9.0.10. Deployment](#9010-deployment)
- [10. DNS Resolution](#10-dns-resolution)
- [11. NI Host Configuration](#11-ni-host-configuration)
  - [11.1. NI Wildcard SSL Certificates](#111-ni-wildcard-ssl-certificates)
  - [11.2. NI Environment File](#112-ni-environment-file)
    - [11.2.1. Common](#1121-common)
    - [11.2.2. OAuth2.0 / OpenID Connect](#1122-oauth20--openid-connect)
    - [11.2.3. Alert Service](#1123-alert-service)
    - [11.2.4. API Gateway](#1124-api-gateway)
    - [11.2.5. API Server](#1125-api-server)
    - [11.2.6. Fetch Service](#1126-fetch-service)
    - [11.2.7. User Interface (UI) Server](#1127-user-interface-ui-server)
    - [11.2.8. Identity and Access Management (IAM) Server](#1128-identity-and-access-management-iam-server)
    - [11.2.9. Predict Service](#1129-predict-service)
    - [11.2.10. DNS Server](#11210-dns-server)
    - [11.2.11. Non-Unique per Component](#11211-non-unique-per-component)
    - [11.2.12. SSL Certificates](#11212-ssl-certificates)
    - [11.2.13. Example](#11213-example)
- [12. Hosting Specifications](#12-hosting-specifications)
  - [12.1. Standalone](#121-standalone)
    - [12.1.1. Combined Single Host](#1211-combined-single-host)
    - [12.1.2. Individual Hosts](#1212-individual-hosts)
  - [12.2. Cluster](#122-cluster)
    - [12.2.1. Per API Server Host](#1221-per-api-server-host)
    - [12.2.2. Other](#1222-other)
  - [12.3. Operating Systems](#123-operating-systems)
  - [12.4. Host Firewalls](#124-host-firewalls)
- [13. License Generator](#13-license-generator)
- [14. Building the release](#14-building-the-release)
  - [14.1. JavaScript Code Scanning](#141-javascript-code-scanning)
  - [14.2. Individual Build Scripts](#142-individual-build-scripts)
  - [14.3. Release artifacts](#143-release-artifacts)
- [15. Deploying the release](#15-deploying-the-release)
  - [15.1. Example Component Installation](#151-example-component-installation)
  - [15.2. Example Component Update](#152-example-component-update)
  - [15.3. Example Component Upgrade](#153-example-component-upgrade)
  - [15.4. Example Component Removal](#154-example-component-removal)
- [16. Integration Lab](#16-integration-lab)
  - [16.1. Host](#161-host)
    - [16.1.1. DNS Records](#1611-dns-records)
  - [16.2. User Interface](#162-user-interface)
  - [16.3. API Server](#163-api-server)
  - [16.4. API Gateway](#164-api-gateway)
  - [16.5. Alert Service](#165-alert-service)
  - [16.6. Fetch Service](#166-fetch-service)
  - [16.7. Predict Service](#167-predict-service)
- [17. Architecture / Technology Choices / Third-Party](#17-architecture--technology-choices--third-party)
  - [17.1. Map Rendering](#171-map-rendering)
  - [17.2. Foreign Exchange Rates](#172-foreign-exchange-rates)
  - [17.3. Common Vulnerabilities and Exposures (CVE) Repository](#173-common-vulnerabilities-and-exposures-cve-repository)
  - [17.4. Sample Data](#174-sample-data)
  - [17.5. World Boundaries](#175-world-boundaries)
  - [17.6. Third-Party Elements \& Libraries](#176-third-party-elements--libraries)
    - [17.6.1. API Gateway](#1761-api-gateway)
    - [17.6.2. API Server](#1762-api-server)
    - [17.6.3. DNS Server](#1763-dns-server)
    - [17.6.4. UI Server](#1764-ui-server)
    - [17.6.5. Predict Service](#1765-predict-service)
    - [17.6.6. Alert Service](#1766-alert-service)
    - [17.6.7. Fetch Service](#1767-fetch-service)
    - [17.6.8. License Generator](#1768-license-generator)
  - [17.7. Development Tooling - EchoAPI](#177-development-tooling---echoapi)
- [18. NI OpenAPIs](#18-ni-openapis)
- [19. NI User Interface (UI)](#19-ni-user-interface-ui)
  - [19.1. Login](#191-login)
  - [19.2. Readiness](#192-readiness)
  - [19.3. Country Selector](#193-country-selector)
  - [19.4. Dashboard](#194-dashboard)
  - [19.5. Cables](#195-cables)
    - [19.5.1. Common](#1951-common)
    - [19.5.2. Coax](#1952-coax)
    - [19.5.3. Copper](#1953-copper)
    - [19.5.4. Ethernet](#1954-ethernet)
    - [19.5.5. Fiber](#1955-fiber)
      - [19.5.5.1. Single-Fiber](#19551-single-fiber)
      - [19.5.5.2. Multi-Fiber](#19552-multi-fiber)
  - [19.6. Ducts](#196-ducts)
  - [19.7. Poles](#197-poles)
  - [19.8. Network Eqiupment](#198-network-eqiupment)
  - [19.9. Racks](#199-racks)
  - [19.10. Sites](#1910-sites)
  - [19.11. Services](#1911-services)
  - [19.12. Trenches](#1912-trenches)
    - [19.12.1. Detail](#19121-detail)
    - [19.12.2. Lifetime](#19122-lifetime)
    - [19.12.3. Per Country](#19123-per-country)
  - [19.13. Quote-to-Cash (Q2C)](#1913-quote-to-cash-q2c)
  - [19.14. Providers](#1914-providers)
    - [19.14.1. Email](#19141-email)
    - [19.14.2. Map](#19142-map)
    - [19.14.3. Kafka](#19143-kafka)
    - [19.14.4. Workflow Engines](#19144-workflow-engines)
  - [19.15. Alerts](#1915-alerts)
  - [19.16. Settings](#1916-settings)
  - [19.17. OpenAPIs](#1917-openapis)
  - [19.18. Help/About](#1918-helpabout)
  - [19.19. Quit (Logout)](#1919-quit-logout)
- [20. NI API Server Internals](#20-ni-api-server-internals)
  - [20.1. Database](#201-database)
  - [20.2. Geometry](#202-geometry)
  - [20.3. Data Longevity](#203-data-longevity)
  - [20.4. Database Backup](#204-database-backup)
  - [20.5. Tracking Changes](#205-tracking-changes)
  - [20.6. NI Fetch](#206-ni-fetch)
  - [20.7. Alert Service](#207-alert-service)
- [21. NI Alert Internals](#21-ni-alert-internals)
- [22. NI Fetch Internals](#22-ni-fetch-internals)
- [23. NI Predict Internals](#23-ni-predict-internals)
  - [23.1. Duplication](#231-duplication)
  - [23.2. Simple Prediction](#232-simple-prediction)
  - [23.3. Complex Prediction](#233-complex-prediction)
    - [23.3.1. Advantages for Time Series Prediction](#2331-advantages-for-time-series-prediction)
- [24. NI User Interface Internals](#24-ni-user-interface-internals)
  - [24.1. Distribution Directories](#241-distribution-directories)
  - [24.2. Metadata](#242-metadata)
- [25. CCUK Technical Services](#25-ccuk-technical-services)
  - [25.1. By email](#251-by-email)
  - [25.2. On the web](#252-on-the-web)
  - [25.3. Technical documentation](#253-technical-documentation)
- [26. Corporate Headquarters](#26-corporate-headquarters)

---

# 1. Introduction

## 1.1. What is the problem?

Every business is constantly faced with finding current accurate information but also attempting to plan, coping with the ever changing “What if ?” questions from their own employees in addition to shareholders, customers and external market influences

## 1.2. How is Network Insight (NI) different?

NI takes historical and actual data and applies Machine Learning predictions providing insight from the past and foresight for the future by envisioning possibilities, from Network Insight delivering business intelligence

## 1.3. Why should your business care?

NI serves to help you make decisions or, at the very least, streamline a company's decision-making processes by collecting, visualising, and communicating data associated with the telecommunications infrastructure and the services it offers

**Every location and every network resource has a story, with NI we bring it to life !**

**Network Insight** provides analytical and prediction insights for telecommunications infrastructure and services.

```text
from hindsight to insight, delivering network foresight...
Hindsight: the ability to learn from the past by looking back at what has already happened. 
Insight: the ability to interpret and respond to the present by developing self-awareness and honest perception. 
Foresight: the ability to predict and prepare for the future by envisioning possibilities. 
When combined, hindsight, insight, and foresight can be a foundation for better decision-making and outcomes.
```

NI is a Business Support System (BSS), and not a fine-grain single domain focused Operational Support Systems (OSS).

NI is few levels higher up in the solution space and that means it does not hold/process data at the same fine-grain level as traditional PNI or LNI - THIS IS BY INTENT as intelligence and insights are from multiple sources of data which is correlated, aggregated and summarised to give a broader perspective. For example, Marlin knows about select physical items and it knows them very well but above and beyond that scope it knows nothing - this is referred to as fine-grain.

![](docs/concept/stackknowledge.png)
> [1] OSS Physical (PNI)
> [2] OSS Logical (LNI)
> [3] BSS Insight (NI)


NI’s purpose was to provide analytical insight into both physical and logical data associated with service infrastructure  and assist providers with the challenges that may be faced: “Any modern telecommunication business is constantly faced with finding current accurate information but also attempting to plan, coping with the ever changing “What if ?” questions from their own employees in addition to both customers and external market influences”

> Network Insight uses time-series data powering rich real-time visualizations and an interactive dashboard including the reporting of analytical trends and predictions.

The published APIs include the exposed features, the UI itself just attempts to visualise some of them. NI is broken up into components, the API Server does the storage and related items, Alert undertakes things like capacity analysis and the despatches notifications, Fetch interacts with external systems, Predict undertakes the predictive actions

---

# 2. API-First

NI does not replace the fine-grain capabilities of any physical (PNI) or logical (LNI) network inventory, but serves to help you make decisions or, at the very least, streamline a company's decision-making processes by collecting, visualising, and communicating data associated with the telecommunications infrastructure and services it offers API-first Business Support System (BSS)

NI is API-first meaning it’s built from the ground up to support integration with existing eco-systems – any product that controls the data and does not act as barrier to the data has deployment longevity
 - All Open API definitions published externally for machine-to-machine (M2M)
 - All Open API definitions & tooling included within UI for interactive queries
 - All NI components use the same APIs – there are no hidden routes (microservices)
 - 230 APIs are defined, documented and adhere to same security mechanisms

Refer to section NI [NI OpenAPIs](#19-ni-openapis) for further details.

---

# 3. Predictions

Due to the NI Time-Series architecture, predictions are treated as updates to historical resource data with calculated/determined values being applied as modifictions with a future date/time associated. 

### 3.0.1. Simple

Inspecting the historical changes of a single resource, example a rack, and calculating the likelihood of the rack slot usage change and what slot usage would change to, i.e. free to used

### 3.0.2. Complex

Involve combining historical changes of multiple resources and potentially updated external data, example post address, and calculating the need for a resource to change to meet the external data conditions, or the need to extend an existing trench to cover new premises, or provide bandwidth to a new cell tower, data center etc. 

## 3.1. What does “prediction” mean in this context?

Where NI holds the lifetime of a resource (past and current), it also attempts to guess (given a predict is literally an educated guess) what it will be at some point in the future.

Taking our simple rack, and the rack slots, if we see from the past a free rack slot is consumed every month, then if the rack had originally 24 slots then in 2 years the rack will be full. Life is not that simple of course, even for the simple rack. Slots can be consumed, equipment then removed and the slot becomes free only for a bigger piece of network equipment to be put in to the rack and double the number of slots consumed. 

Taking a piece of network equipment, which has 24 ports, customer services are connected, backhaul connected, customer service disconnected etc. etc.

NI Predict handles these scenarios currently and they are referred to as simple predictions. This is documented in the readme, but NI Predict examines, say checks every slot on a rack, looks at its history and mathematically calculates what it could be. It then sends the change back to the NI API Server literally like a normal update but now it contains a prediction marker with a timestamp of the future rather than the historical marker. The NI UI (and APIs) understand these markers and visualise the results differently, below is the UI showing the usage of a historical fiber strands from a single fiber cable:

![](docs/concept/slot-non-predict.png)

If we had selected the predicted version, the colour scheme would show the predicted changes, after prediction (yellow indicates predictive) note changes to strands 18, 28, 38, 42,43,48 etc:

![](docs/concept/slot-predict.png)

The more changes NI has been made aware of, the higher the accuracy of the prediction. When it comes to resources like sites, the predictive capabilities are limited, as a site does not typically (in NI terms) change, but this is where the next type of prediction comes in.

**Complex** predictive capabilities are associated across multiple resources, so if a trench runs from point A to point B and NI has been made aware that a new housing/business estate is being built (made aware by looking at off-net site data, either passed to NI directly or NI Fetch collecting from say BelMaps), then we can see our trench runs geographically close to the new estate and could predict the trench will need to be extended to reach the new estate. Here is an example of that via the UI, the yellow dashed line represents a predicted trench extension and the red and orange lines represent that the expansion (build out) of a given trench over its lifetime.

![](docs/concept/trench-predict.png)

Right now only **simple** predictions are implemented for cables, racks, network equipment ports, as never received the previously requested access to BelMaps in order to load in more off-net data to start working on the complex scenarios.

Every resource in NI (cable, duct, pole, NE, rack, service, site and trench) has the lifetime capability, the predictive use cases require CCUK Marlin and NetworkMining teams coming together bringing their respective domain knowledge gathered from studying the patterns in the data. Collectively CCUK could identity many *what-if* questions that would form some of the complex predictions.

NI Alert needs further development to complete this but is simply taking a collective of a resource, adding up what is used and subtracting that from what the maximum is. All the functions in NI Alert exist in stub form but this was suspended in favour of the predictive aspects of NI (and lack of resources).

---

# 4. Alerts

NI aims to provide notification alerts via numerous mechanisms:

- NE Common Vulnerability (CVE) Passive Scan (requested previously by Accenture)
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

Providers can be defined via the NI UI and API Server for:

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
- NI UI (pending)

---

# 5. Resources

NI resources include:

- Cable: coax, copper, ethernet, single/multi fiber, placement against a pole, duct, trench or to a piece of network equipment
- Duct: placement (within trench), gas, power, cable, water, configuration (x-way), type (duct or sub-duct)
- Pole: Height/Type
- Network Equipment & Ports: Vendor agnostic & Coax, ethernet, loopback, xDSL, Fiber, virtual
- Rack: size, slots
- Service: broadband, circuit, ethernet, FTTx, optical, SoGEA, unclassified, voice
- Site: ADU, COLO, commercial, exchange, MDU, SDU, street, unclassified
- Trench: depth/width, build job

For full details of what is possible to hold against a specific resource, refer to the published NI OpenAPIs.

> **Note:** 
> - Demographics on all resources when appropriate (residential, rural, commercial, urban, highways, unclassified)
> - Each resource, if supplied with coordinates, has its country of existence checked and if necessary updated after creation.
> - All resources, once when the resource is created, either on a volume basis i.e. distance, a unit basis per piece of equipment, have a cost calculated and applied.
> - Cost rates can be managed separately through the published NI API Server APIs or the included defaults changed prior to installation.

---

# 6. Time-Series

## 6.1. Concept

Every NI resource has possibility of multiple diverging states including deleted but remains as the same originally defined resource Historical & predicted relationships remain between resources, for example a duct in a trench, such scenarios include:
 - Trench is extended
 - Trench has additional ducting installed
 - Ducting has cables added, removed
 - Cable is moved to different port, fiber splice is connected, disconnected etc.
 - Network Equipment has additional cables connected, removed etc.
 - Rack has equipment installed, removed etc.
 - Rack slot becomes unusable, reserved etc.
 - Service is moved between endpoints etc.
 - New premises and sites appear etc.

As data is either collected by NI (fetch) or received by NI the historical data is updated, the resource container remains as is, not duplicated, nor replaced All relationships between resources are preserved during changes
 - No need to reform relationships, for example, changes to rack such as equipment being installed are to the same physical rack, not a different incarnation of the rack
 - Adding a service through two endpoints, automatically updates the referenced equipment ports – no need for separate update to mark equipment ports as used etc.

Entire record from external source can be supplied again without external processing needs – NI works it out
 - No need to supply the incremental/delta difference
 - No need to delete NI data before supplying data again

As time passes (now), older predicted data that is earlier than the last historical data is removed
and new predictions performed. Boundaries for earliest preserved historical data and latest predicted data are configurable ensuring quantifiable storage requirements (days, months, quarters or years)

## 6.2. Behind the Scenes

The data required for NI must be expanded overtime during normal operations as NI requires a historical dataset in order to predict the future changes, this requires certain adjustments to normal Create-Read-Update-Delete (CRUD) concepts in addition to all non-administrative datasets including metadata fields:

1. `point` a timestamp (specific point in time)
2. `source` to indicate if either supplied as actual (`historical`), supplied as proposed (`planned`), or generated (`predicted`) internally via machine learning predictive algorithms
3. `delete` to indicate if marked for deletion

All records, regardless of type, are subject to the administrative data pruning mechanisms when the historical retention period ( HTTP GET `/ni/v1/admin/data/historical/duration`) of the record has been exceeded 

## 6.3. Shadow Time-Series Tables

Each data (parent) table has a corresponding shadow (child) table prefixed by _, for example Alerts are held in the database table alert and its shadow table is _alert.

The parent table only consists of two fields:

- Unique Identifier (`UUIDv4`) as the primary key
- delete

The child table consist of at least three fields before the real fields are included:

- `tsId` an auto-populated integer based sequential Identifier (sequence) as the primary key
- `point` to hold the timestamp
- `source`
- Additional identifier (`UUIDv4`) as the referential key(s) value to link back to the parent table(s) primary key

In entity relationship terms, this looks like:

![](docs/crud-concepts//ts-shadow-tables.svg)
Time-Series Shadow Tables


Any other table that requires to have referential integrity will include the necessary identifier in the child table but referencing the parent table. This allows all held data to be held as time-based versions which reflects the creation, modification and deleting that occurs over normal operation time. In entity relationship terms, this looks like:


![](docs/crud-concepts/ts_pk_fk_relations.svg)

> Primary and Foreign Relationships


### 6.3.1. Bulk Create (Import)

- dataset presented via API will include point values
- dataset presented via API will optionally include internal identifiers (`UUIDv4`)
- dataset (JSON array) will be unpackaged into individual records
- each bulk (JSON array) import will have a maximum size of 1000 records

> **Note:**
> - it is the responsibility of the client to control the quantity of records sent
> - NI API Server will return HTTP status code 413 if the internal queues are currently full or the entire request payload will be discarded if it exceeds the maximum size

- If the request is invalid, HTTP status code 400 will be returned
- For non-administrative datasets:
  - When record is stored, the metadata fields are automatically populated with:
    - `point` - extracted from supplied dataset record
    - `source` - extracted from supplied dataset record
    - `delete` - extracted from supplied dataset record
- For all datasets:
  - the internal identifiers (`UUIDv4`), created if not supplied or used if supplied
- HTTP status code 202 will be returned

> **Note:** 
> - during bulk imports NI Alert, Fetch and Predict services are effectively suspended until the API Server queues are empty

## 6.4. Bulk Read (Export)

- if no such record(s) exists, HTTP status code 404 will be returned
- If the request is invalid, HTTP status code 400 will be returned
- All held records value will be packaged as dataset (JSON array) including all internally held identifiers (`UUIDv4`) and for non-administrative datasets the metadata fields will be included:
  - point field value (date format in compressed ISO-8601. YYYYMMDDThhmmss)
  - source field value (string enum)
  - delete field value (boolean)
- HTTP status code 200 will be returned

### 6.4.1. Create

- record presented via API will NOT include point value
- If the request is invalid, HTTP status code 400 will be returned
- When record is stored, two metadata fields are automatically populated with:
  - `point` = current system date/time
  - `source` = historical
  - `delete` = false
- the internal identifier (`UUIDv4`) will be returned along with HTTP status code 200

### 6.4.2. Read

- if no such record(s) exists, HTTP status code 404 will be returned
- If the request is invalid, HTTP status code 400 will be returned
- if no point value or range is requested via API query parameters then the latest historical record(s) (i.e. state = historical) will be returned with HTTP status code 200
- If point value or is requested via API query parameter that extends into the future, record(s) with either a source of historical or predicted and not marked for deletion (i.e.delete = false) will be returned with HTTP status code 200

### 6.4.3. Update

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

### 6.4.4. Delete

- If specified record does not exist then HTTP status code 404 will be returned
- If the request is invalid, HTTP status code 400 will be returned
- The existing record is **NOT** deleted but the existing record is read, but the resulting record stored as a new record with the two metadata fields automatically populated with:
  - `point` = current system date/time
  - `source` - as per existing record value
  - `delete` =  true
- HTTP status code 204 will be returned

---

# 7. Resource Related Dependencies

```text
+------+   +--------+   +------+   +-------+
|      |<--|        |<--| Duct |<--|       |
|      |   | Trench |   +------+   |       |
|      |   |        |   +------+   | Cable |
|      |   |        |<--|      |<--|       |
|      |   +--------+   | Pole |   |       |
| Site |<---------------|      |   +-------+
|      |                +------+
|      |   +------+              +----+              +---------+
|      |   |      |              |    |<--[ingress]--|         | 
|      |<--| Rack |<---[slot]----| NE |              | Service |
|      |   |      |              |    |<--[egress]---|         |
+------+   +------+              +----+              +---------+
```

## 7.1. Data Relationships

> How does NI store relationships such as: 

 See above areas of this document, but summary answers below for completeness    

- network connectivity
- infrastructure connectivity
- associations between objects?

NI’s APIs and data model are built around domain knowledge, e.g. a cable could be slung between utility poles, or running in a duct, which could be in a trench, or running around a rack
  
When you add a resource, like a rack, you have the option to not only give the rack a geometry location (X,Y,Z), row and/or column for a data centre floor BUT to also assign it to something else. In the case of a rack you can assign it to a site. A site can be anything/anywhere from a cabinet on the street, a box on top of public lighting, cell site and everything else including traditional buildings

So every NI resource can have association for/to another resource but it is not mandatory - with NI "the more you put in the the more value you can get out"


---

# 8. Database Schema

As part of the CI/CD process, the NI database schema is automatically documented as a Entity Relationship Diagram (ERD) and the latest version is shown below

![](docs/data-model/ni-model.svg)

> Schema Model

---

# 9. Architectures

![](docs/architecture/ni-architectures-Simple.svg)

> Simplified

### 9.0.1. Application

![](docs/architecture/ni-architectures-Application.svg)

> Application

### 9.0.2. DevOps CI/CD Pipeline

![](docs/architecture/ni-architectures-DevOps.svg)

> DevOps

### 9.0.3. Functional

![](docs/architecture/ni-architectures-Functional.svg)

> Functional

### 9.0.4. Integration

![](docs/architecture/ni-architectures-Integration.svg)

> Integration

### 9.0.5. Logical (Cloud)

![](docs/architecture/ni-architectures-Logical-Cloud.svg)

> Logical Cloud

### 9.0.6. Logical (On-Premise)

![](docs/architecture/ni-architectures-Logical-OnPrem.svg)

> Logical On-Premise/Self Hosted

### 9.0.7. Cluster Replication

![](docs/architecture/ni-architectures-Replication.svg)

> API Server Clustering

- API Server embeds DuckDB. Due to horizontal scaling limitations of DuckDB, backend database replication needs is used
- NI already tracks internal changes for prediction purposes (Predict Service)
- Resource changes pulled from master API Server by slave API Server(s) and updated locally
- API Gateway, through existing DNS Service Discovery, sends writes to master and reads to slave(s) with failover back to master for scaling purposes
- Replication communication via the encrypted multicast stream **does not** occur through the API Gateway
- UI Server, API Gateway, Predictive Service, Fetch Service and Alerting Service are already fully capable of horizontal and verticaal scaling

### 9.0.8. Security

![](docs/architecture/ni-architectures-Security.svg)

> Authentication and Authorization 

#### 9.0.8.1. Through the API Gateway

Browser clients and machine-to-machine (M2M) clients operate through the API Gateway and are required to use OAuth2.0/OpenID Connect authentication, between the API Gateway and the API Server a different authentication scheme is used.

```text
+---------+               +-------------+           +------------+
| Clients |--[OAuth2.0]-->| API Gateway |--[auth]-->| API Server |
+---------+               +-------------+           +------------+
```

The API Gateway has the responsibility of undertaking both authentication and authorization (fine-grain) for Role-Based Access Control (RBAC).

> **Note**:
> - NI contains the ability to disable and ignore RBAC based authorization, however authentication can not be disabled.
> - To ignore authorization change `APIGW_IGNORE_AUTH_VALIDATOR` to `true` prior to installation of the API Gateway.
> - Authorization can be re-enabled by changing `APIGW_IGNORE_AUTH_VALIDATOR` to `false` and performing an update or upgrade of the API Gateway

### 9.0.9. Internally

NI Alert Service, Fetch Service and Predict Service, as well as the API Gateway use service authentication.

```text
+--------------+           +------------+
| NI Component |--[auth]-->| API Server |
+--------------+           +------------+
```

> **Note**: 
> - NI Alert Service, Fetch Service and Predict Service can be configured to route through the API Gateway, but will need to authenticate with the same IAM
> - The service authentication credentials are generated during installation of the API Server and are specific to that installation.
> - When deploying API Server for cluster operations, the service authentication credentials **MUST** match across all environment configuration files (`/etc/ni/ni.ini`), specifically `NI_SERVICE_USERNAME` and `NI_SERVICE_KEY`.

#### 9.0.9.1. API Server Encrypted Storage

NI API Server makes use of AES encryption, key size 256 bits for storing credentials within its secret store.

> **Note**: 
> - The AES encryptions credentials are generated during installation of the API Server and are specific to that installation.
> - When deploying API Server for cluster operations, the AES encryptions credentials **DO NOT NEED** to match across all environment configuration files (`/etc/ni/ni.ini`), specifically `APISERV_ENCRYPTION_KEY` and `APISERV_ENCRYPTION_IV`.

#### 9.0.9.2. Role-Based Access Control (RBAC)

The NI OpenAPIs already includes the fine-grain RBAC markers against each and every API, they are:

- `read:ni_admin`
- `read:ni_cable`
- `read:ni_duct`
- `read:ni_ne`
- `read:ni_pole`
- `read:ni_rack`
- `read:ni_service`
- `read:ni_site`
- `read:ni_trench`
- `read:ni_ui`
- `write:ni_admin`
- `write:ni_cable`
- `write:ni_duct`
- `write:ni_ne`
- `write:ni_pole`
- `write:ni_rack`
- `write:ni_service`
- `write:ni_site`
- `write:ni_trench`
- `write:ni_ui`

NI OpenAPIs include the use of multiple roles, but the client is only expected to require one - this allows multiple job or function roles (planning/design, procurement etc., API integration) to be supported.

> **Note:** 
> - The mapping of job or function roles and roles to user credentials is handled by the Identity and Access Management (IAM) and is beyond the scope of this document.


The following roles are reserved for internal use by NI Alert Service, Fetch Service and Predict Service if they are required to operate through the API Gateway:

- `read:ni_alert`
- `read:ni_fetch`
- `read:ni_predict`
- `write:ni_alert`
- `write:ni_fetch`
- `write:ni_predict`

> **Note:** 
> - `ni_alert`, `ni_fetch`, `ni_predict` roles are for NI itself and **MUST NOT** be assigned to any external clients

### 9.0.10. Deployment

![](docs/install/ni-architectures-Deployment.svg)

> Suitable for standalone integration, lab, proof of concepts and low-yield production usage or clustered deployments.

> **Note:** 
> - all Debian hosts shown can be combined into single host, either bare-metal or virtual

---

# 10. DNS Resolution

NI makes use of service discovery via DNS server (`SRV`) records to locate NI components, this is more commonly referred to as `SD-DNS`. This is used for both horizontal and vertical scaling and by the API Gateway for backend routing.

```text
Type	
Domain Record
    Data	TTL
A	apiserver.{hostname}.{domain}	127.0.0.1	3600
A	{hostname}.{domain}	192.168.111.6	3600
SRV	_https._tcp.apiserver.{hostname}.{domain}	0 10 7443 apiserver.{hostname}.{domain}	3600
SRV	_https._tcp.gateway.{hostname}.{domain}	0 10 8443 {hostname}.{domain}	3600
```

Change `{hostname}.{domain}` to whatever the host reported (or was told) its fully qualified hostname was before defining the DNS records. You can change the time-to-live (`TTL`) to a one day (`86400`) when you are happy DNS resolution is working.

You can verify via as follows:

```bash
$ dig +short _https._tcp.apiserver.{hostname}.{domain} SRV
$ dig +short apiserver.{hostname}.{domain} A
$ dig +short _https._tcp.gateway.{hostname}.{domain} SRV
$ dig +short gateway.{hostname}.{domain} A
```
> **Note:**
> - The utility `dig` is part of the `bind9-dnsutils` package on Debian hosts.

Depending on the deployment architecture, single host vs. multiple hosts, the hostname may vary. For example, you should get something like this if all working correctly on a combined single host:

```bash
# hostname
t310.cowdrey.net
# cat /etc/hosts
127.0.0.1       localhost
127.0.1.1       MarlinMigration

# The following lines are desirable for IPv6 capable hosts
::1     localhost ip6-localhost ip6-loopback
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters

$ dig +short _https._tcp.apiserver.t310.cowdrey.net SRV
0 10 7443 apiserver.t310.cowdrey.net.
$ dig +short apiserver.t310.cowdrey.net A
127.0.0.1
$ dig +short _https._tcp.gateway.t310.cowdrey.net SRV
0 10 8443 t310.cowdrey.net.
$ dig +short t310.cowdrey.net A
192.168.111.6
```

For Round-Robin DNS, the DNS Server would need something similar to the zone extract shown below:

```text
t310 IN A 192.168.111.6
                  IN A 192.168.1.17
                  IN A 192.168.1.18
```

> **Note:**
> - When using Round-Robin DNS, the DNS `SRV` records do not need any changes as the contained `A` host record itself for `t310.cowdrey.net` will resolve to the listed IP addresses
> - Most modern Web Browsers support Round-Robin DNS, however any applications operating in a machine-to-machine fashion may require additional configuration or customisation
> - It is outside the scope of this document for configuration of DNS Servers

---

# 11. NI Host Configuration

Each host environment hosting NI components must contain a NI configuration environment file. This file can be found at `/etc/ni/ni.ini` and is automatically created if not found during installation.

> **Note:**
> - The contents of the configuration environment file should be manually updated and synchronised between all hosts that form NI as NI internal components will read some of the configuration of the other components.

## 11.1. NI Wildcard SSL Certificates

NI requires either a wildcard SSL certificate, or suitable SSL certificate per host as below:

 - API Gateway (`APIGW_*`)
 - API Server (`APISERV_*`)
 - UI Server (`UISERV_*`)
 - Identity and Access Management (`IAM_*`)

## 11.2. NI Environment File

The file `/etc/ni/ni.ini` deployment environment file supports the following NI functional components:

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

### 11.2.1. Common

```bash
#
# Common
#
CONFIG_DIRECTORY="/etc/ni"
HOST_SERVICE_GROUP="NI"
NI_NAME="Network Insight"
NI_BUILD="1763499309"
NI_VERSION="1.0.0"
NI_LICENSE_PRIVATE_KEY=""
NI_LICENSE_PUBLIC_KEY=""
NI_DEFAULT_COUNTRY_CODE="GBR"
NI_DEFAULT_CURRENCY_ISOCODE="GBP"
NI_DEFAULT_CURRENCY_NAME="Sterling"
NI_DEFAULT_CURRENCY_SYMBOL="£"
NI_SERVICE_USERNAME=""
NI_SERVICE_KEY=""
```

 - `CONFIG_DIRECTORY` value should be left as is
 - `HOST_SERVICE_GROUP` can be changed
 - `NI_NAME` can be changed
 - `NI_BUILD` is automatically populated during CI/CD build process
 - `NI_VERSION` is automatically populalted during CI/CD build process
 - `NI_LICENSE_PRIVATE_KEY` value should be generated via the NI License Generator tool and the resulting value included here for the API Server - no other component requires this
 - `NI_LICENSE_PUBLIC_KEY` is automatically populalted during CI/CD build process and should **not** be changed
 - `NI_DEFAULT_COUNTRY_CODE` can be changed to one of the following values: `ABW`, `AFG`, `AGO`, `AIA`, `ALB`, `AND`, `ARE`, `ARG`, `ARM`, `ASM`, `ATA`, `ATF`, `ATG`, `AUS`, `AUT`, `AZE`, `BDI`, `BEL`, `BEN`, `BES`, `BFA`, `BGD`, `BGR`, `BHR`, `BHS`, `BIH`, `BLM`, `BLR`, `BLZ`, `BMU`, `BOL`, `BRA`, `BRB`, `BRN`, `BTN`, `BWA`, `CAF`, `CAN`, `CHE`, `CHL`, `CHN`, `CIV`, `CMR`, `COD`, `COG`, `COK`, `COL`, `COM`, `CPV`, `CRI`, `CUB`, `CUW`, `CYM`, `CYP`, `CZE`, `DEU`, `DJI`, `DMA`, `DNK`, `DOM`, `DZA`, `ECU`, `EGY`, `ERI`, `ESP`, `EST`, `ETH`, `FIN`, `FJI`, `FLK`, `FRA`, `FRO`, `FSM`, `GAB`, `GBR`, `GEO`, `GGY`, `GHA`, `GIB`, `GIN`, `GLP`, `GMB`, `GNB`, `GNQ`, `GRC`, `GRD`, `GRL`, `GTM`, `GUF`, `GUM`, `GUY`, `HND`, `HRV`, `HTI`, `HUN`, `IDN`, `IMN`, `IND`, `IRL`, `IRN`, `IRQ`, `ISL`, `ISR`, `ITA`, `JAM`, `JOR`, `JPN`, `KAZ`, `KEN`, `KGZ`, `KHM`, `KIR`, `KNA`, `KOR`, `KWT`, `LAO`, `LBN`, `LBR`, `LBY`, `LCA`, `LIE`, `LKA`, `LSO`, `LTU`, `LUX`, `LVA`, `MAR`, `MCO`, `MDA`, `MDG`, `MDV`, `MEX`, `MHL`, `MKD`, `MLI`, `MLT`, `MMR`, `MNE`, `MNG`, `MNP`, `MOZ`, `MRT`, `MSR`, `MTQ`, `MUS`, `MWI`, `MYS`, `MYT`, `NAM`, `NCL`, `NER`, `NGA`, `NIC`, `NIU`, `NLD`, `NOR`, `NPL`, `NRU`, `NZL`, `OMN`, `PAK`, `PAN`, `PCN`, `PER`, `PHL`, `PLW`, `PNG`, `POL`, `PRK`, `PRT`, `PRY`, `PSE`, `PYF`, `QAT`, `REU`, `ROU`, `RUS`, `RWA`, `SAU`, `SDN`, `SEN`, `SGP`, `SHN`, `SLB`, `SLE`, `SLV`, `SMR`, `SOM`, `SRB`, `SSD`, `STP`, `SUR`, `SVK`, `SVN`, `SWE`, `SWZ`, `SYC`, `SYR`, `TCA`, `TCD`, `TGO`, `THA`, `TJK`, `TKL`, `TKM`, `TLS`, `TON`, `TTO`, `TUN`, `TUR`, `TUV`, `TWN`, `TZA`, `UGA`, `UKR`, `URY`, `USA`, `UZB`, `VAT`, `VCT`, `VEN`, `VGB`, `VIR`, `VNM`, `VUT`, `WLF`, `WSM`, `YEM`, `ZAF`, `ZMB`, `ZWE`
 - `NI_SERVICE_USERNAME` is automatically set during the installation of the API Server - other components do require this
 - `NI_SERVICE_KEY` is automatically set during the installation of the API Server - other components do require this

### 11.2.2. OAuth2.0 / OpenID Connect

```bash
#
# OAuth2.0 / OpenID Connect
#
OAUTH=true
OAUTH_CLIENT_ID="NI"
OAUTH_CLIENT_SECRET="mQGulEEcowdREynXpDqBbt1Xe4yziKN"
OAUTH_DISCOVERY_URL="https://ni.cowdrey.local:6443/realms/ni/.well-known/openid-configuration"
```

 - `OAUTH` is required to have a value of `true`
 - `OAUTH_CLIENT_ID` default value matches that used by the included IAM Server
 - `OAUTH_CLIENT_SECRET` default value matches that used by the included IAM Server
 - `OAUTH_DISCOVERY_URL` default value should be automatically changed during installation, but it is recommended this value is manually verified

If you were to use Microsoft Azure Active Directory for authentication, then the values would be something similar to:

```bash
OAUTH=true
OAUTH_CLIENT_ID="MNf3ce2c1d-abcd-4lee-cowd-reydd5489d741I"
OAUTH_CLIENT_SECRET="Ni8Q~RWkJ3xDeadLuckOC5a6kl1G_CUfoqJGdn."
OAUTH_DISCOVERY_URL="https://login.microsoftonline.com/a17ec843-b999-4lee-cowd-rey03a903e14/v2.0/.well-known/openid-configuration"
```

> **Note:** 
> - You would need to change the Microsoft tenant id `a17ec843-b999-4lee-cowd-rey03a903e14` and potentially Discovery URL to match your Azure account.

### 11.2.3. Alert Service

```bash
#
# alertService
#
ALERTSRV_CRONTIME="0 0 * * *"
ALERTSRV_DEBUG=true
ALERTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=120000
ALERTSRV_ENDPOINT_RETRY_INTERVAL_MS=15000
ALERTSRV_HOST_SERVICE_LOG_FILE="/var/log/ni/alert.log"
ALERTSRV_HOST_SERVICE_SYSTEMD="nialert.service"
ALERTSRV_HOST_SERVICE_USERNAME="nialert"
ALERTSRV_TLS_INSECURE_CONNECTIONS=true
ALERTSRV_WORKING_DIRECTORY="/usr/local/ni/alert"
```

 - `ALERTSRV_CRONTIME` can be changed, adhere to rules of Linux CronTab for specifying the execution time
 - `ALERTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS` can be changed if required
 - `ALERTSRV_ENDPOINT_RETRY_INTERVAL_MS` can be changed if required

### 11.2.4. API Gateway 

```bash
#
# apiGateway
#
APIGW_ADDRESS=
APIGW_HOST_SERVICE_LOG_FILE="/var/log/ni/apigw.log"
APIGW_HOST_SERVICE_SYSTEMD="niapigw.service"
APIGW_HOST_SERVICE_USERNAME="niapigw"
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
APIGW_WORKING_DIRECTORY="/usr/local/ni/apigw"
```

 - `APIGW_ADDRESS` is automamtically set to the Linux network interface providing the default route
 - `APIGW_IGNORE_AUTH_VALIDATOR` is set to `true` the Role Based Access Controls (RBAC) used for authorization are disabled and only authentication is used instead
 - `APIGW_PORT` if changed, ensure DNS records match
 - `APIGW_PROXY_RATE_LIMIT_REQUESTS` for large installations, adjust accordingly - refer to KrakenD documentation
 - `APIGW_PROXY_CAPACITY_REQUESTS` for large installations, adjust accordingly - refer to KrakenD documentation
 - `APIGW_PROXY_RATE_LIMIT_EVERY` for large installations, adjust accordingly - refert to KrakenD documentation
 - `APIGW_KRAKEND_VERSION` which version of KrakenD to download and use - this should not be changed

### 11.2.5. API Server

```bash
#
# apiServer
#
APISERV_ADDRESS="0.0.0.0"
APISERV_API_DIRECTORY="/usr/local/ni/api/openapi"
APISERV_BACKUP_DIRECTORY="/usr/local/ni/api/backup"
APISERV_DEBUG=true
APISERV_DUCKDB_VERSION="v1.4.1"
APISERV_DUCKDB_BACKUP_CRONTIME="0 2 * * *"
APISERV_DUCKDB_BACKUP=true
APISERV_DUCKDB_FILE="/usr/local/ni/api/ni.duckdb"
APISERV_DUCKDB_MAX_MEMORY="20GB"
APISERV_DUCKDB_THREADS=4
APISERV_ENCRYPTION_KEY="qBU4K9XBw2JtYx7puSGiSig8LbxxDpSaprK7+u+EJI8="
APISERV_ENCRYPTION_IV="U5uKpGIE3cIXh5kuhFZXuQ=="
APISERV_KEEPALIVE=true
APISERV_HOST_SERVICE_LOG_FILE="/var/log/ni/api.log"
APISERV_HOST_SERVICE_SYSTEMD="niapi.service"
APISERV_HOST_SERVICE_USERNAME="niapi"
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
APISERV_DOCUMENT_DIRECTORY="/usr/local/ni/api/document"
APISERV_UPLOAD_DIRECTORY="/usr/local/ni/api/upload"
APISERV_URL_PREFIX="/ni"
APISERV_URL_VERSION="/v1"
APISERV_USE_DNS_SD=false
APISERV_WORKING_DIRECTORY="/usr/local/ni/api"
```

 - `APISERV_ADDRESS` if using single host, this should be loopback address `127.0.0.1`, otherwise use the IP address which is reachable from the API Gateway and other NI components
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

### 11.2.6. Fetch Service

```bash
#
# fetchService
#
FETCHSRV_CVE_SCAN=true
FETCHSRV_CVE_DIRECTORY="/usr/local/ni/cvelistV5"
FETCHSRV_DEBUG=true
FETCHSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=120000
FETCHSRV_ENDPOINT_RETRY_INTERVAL_MS=15000
FETCHSRV_FX_UPDATE=true
FETCHSRV_HOST_SERVICE_LOG_FILE="/var/log/ni/fetch.log"
FETCHSRV_HOST_SERVICE_SYSTEMD="nifetch.service"
FETCHSRV_HOST_SERVICE_USERNAME="nifetch"
FETCHSRV_TLS_INSECURE_CONNECTIONS=true
FETCHSRV_WORKING_DIRECTORY="/usr/local/ni/fetch"
```

 - `FETCHSRV_CVE_SCAN` toggle fetching on CVE repository from the Internet
 - `FETCHSRV_CVE_DIRECTORY` if used, where to cache the CVE repository - this can be an external network share or another filesystem as dependant on expected storage requirements
 - `FETCHSRV_FX_UPDATE` toggle updating foreign currency exchange rates from the Internet - if disabled FX rates can be updated through API Server APIs

### 11.2.7. User Interface (UI) Server

```bash
#
# uiServer
#
UISERV_ADDRESS="192.168.111.6"
UISERV_DIST_DIRECTORY="/usr/local/ni/ui/dist"
UISERV_DEBUG=true
UISERV_DNS_RESOLVE=300000
UISERV_HOST_SERVICE_LOG_FILE="/var/log/ni/ui.log"
UISERV_HOST_SERVICE_SYSTEMD="niui.service"
UISERV_HOST_SERVICE_USERNAME="niui"
UISERV_PORT=4443
UISERV_SSL_CERT="ui.crt"
UISERV_SSL_CSR="ui.csr"
UISERV_SSL_DAYS=90
UISERV_SSL_KEY="ui.key"
UISERV_SSL_SIZE=4096
UISERV_TIMEOUT_REQUEST=120000
UISERV_TICK_INTERVAL_MS=60000
UISERV_TLS_INSECURE_CONNECTIONS=true
UISERV_URL_PREFIX="/ni"
UISERV_USE_DNS_SD=false
UISERV_WORKING_DIRECTORY="/usr/local/ni/ui"
```

 - `UISERV_ADDRESS` is automamtically set to the Linux network interface providing the default route
 - `UISERV_DIST_DIRECTORY` this should not be changed
 - `UISERV_DNS_RESOLVE` timeout in milliseconds for DNS lookups
 - `UISERV_PORT` if changed, ensure DNS records match
 - `UISERV_TICK_INTERVAL_MS` obsolete
 - `UISERV_URL_PREFIX` this should match the API Server endpoint URL path prefix - this should not be changed
 - `UISERV_USE_DNS_SD` toggle UI Server using DNS Service Discovery to determine which host/port to expose its endpoint against and this should not be changed unless DNS `SRV`records have been previously verified

### 11.2.8. Identity and Access Management (IAM) Server

```bash
#
# IAM
#
IAM_ADDRESS="192.168.111.6"
IAM_BOOTSTRAP_ADMIN_USERNAME="admin"
IAM_BOOTSTRAP_ADMIN_PASSWORD="admin"
IAM_HOST_SERVICE_LOG_FILE="/var/log/ni/iam.log"
IAM_HOST_SERVICE_SYSTEMD="niiam.service"
IAM_HOST_SERVICE_USERNAME="niiam"
IAM_KEYCLOAK_VERSION="26.4.4"
IAM_PORT_HTTPS=6443
IAM_SSL_CERT="iam.crt"
IAM_SSL_CSR="iam.csr"
IAM_SSL_DAYS=90
IAM_SSL_KEY="iam.key"
IAM_SSL_SIZE=4096
IAM_WORKING_DIRECTORY="/usr/local/ni/iam"
```

 - `IAM_ADDRESS` is automamtically set to the Linux network interface providing the default route
 - `IAM_BOOTSTRAP_ADMIN_USERNAME` the default username of the administrative account used in KeyCloak
 - `IAM_BOOTSTRAP_ADMIN_PASSWORD` the default password of the administrative account used in KeyCloak - this password should be changed after installation via the KeyCloak Management console (`https://{IAM_ADDRESS}:{IAM_PORT}/`)
 - `IAM_KEYCLOAK_VERSION` version of KeyCloak to use - this should not be changed
 - `IAM_PORT_HTTPS` if changed, ensure DNS records match

### 11.2.9. Predict Service

```bash
#
# predictService
#
PREDICTSRV_CRONTIME="0 0 * * *"
PREDICTSRV_DEBUG=true
PREDICTSRV_ENDPOINT_RETRY_INTERVAL_MS=15000
PREDICTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=60000
PREDICTSRV_HOST_SERVICE_LOG_FILE="/var/log/ni/predict.log"
PREDICTSRV_HOST_SERVICE_SYSTEMD="nipredict.service"
PREDICTSRV_HOST_SERVICE_USERNAME="nipredict"
PREDICTSRV_TLS_INSECURE_CONNECTIONS=true
PREDICTSRV_WORKING_DIRECTORY="/usr/local/ni/predict"
```

 - `PREDICTSRV_CRONTIME` can be changed, adhere to rules of Linux CronTab for specifying the execution time

### 11.2.10. DNS Server

> **Note:**
> - while some deployments will NOT include the embedded DNS Server (dnsmasq), this configuration is still required for the `HOST` and `DOMAIN NAME` configuration

```bash
#
# dnsServer
#
DNSSERV_INSTALL=false
DNSSERV_ADDRESS=
DNSSERV_VERSION="2.70"
DNSSERV_HOST_SERVICE_LOG_FILE="/var/log/ni/dns.log"
DNSSERV_HOST_SERVICE_SYSTEMD="nidns.service"
DNSSERV_HOST_SERVICE_USERNAME="nidns"
DNSSERV_PORT=53
DNSSERV_HOST="t310"
DNSSERV_DOMAIN="cowdrey.net"
DNSSERV_WORKING_DIRECTORY="/usr/local/ni/dns"
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

### 11.2.11. Non-Unique per Component

The following are defined per component and are treated in the same manner:

 - `{NI_COMPONENT}_DEBUG` can be either `false` or `true` to toggle addition verbose logging
 - `{NI_COMPONENT}_TLS_INSECURE_CONNECTIONS` if struggling with SSL certificates, set this to `true` for the respective component
 - `{NI_COMPONENT}_HOST_SERVICE_LOG_FILE` can be changed but recommended any changes are consistently applied
 - `{NI_COMPONENT}_HOST_SERVICE_SYSTEMD` value should be left as is
 - `{NI_COMPONENT}_HOST_SERVICE_USERNAME` can be changed and is used as the dedicated component username
 - `{NI_COMPONENT}_WORKING_DIRECTORY` can be changed and it used as the home directory for the dedicted component user
 - `{NI_COMPONENT}_ENDPOINT_RETRY_INTERVAL_MS` used by service components and can be changed
 - `{NI_COMPONENT}_ENDPOINT_KEEPALIVE_INTERVAL_MS` used by service components and can be changed

### 11.2.12. SSL Certificates

NI will unless configured otherwise generate and use Self-Signed SSL certificates, if using signed certificates then the number of days and key size values can be ignored. If using same wildcard domain SSL certificate all components can use the same certificate chain, otherwise one certificate per Server component is suitable.

 - `{NI_COMPONENT}_SSL_CERT` - `PEM` formatted certificate including any authority certificates
 - `{NI_COMPONENT}_SSL_CSR` - Self-Signed certificate request filename
 - `{NI_COMPONENT}_SSL_DAYS` - Self-Signed certificate lifetime in days
 - `{NI_COMPONENT}_SSL_KEY` - `PEM` formatted key certificate filename
 - `{NI_COMPONENT}_SSL_SIZE` - Self-Signed certificate key size

### 11.2.13. Example

> **Note:**
> - It is recommended that the deployment environment file be configured for the deployment before installation is started.

A fully populated deployment environment file would be similar to:

```bash
#=====================================================================
# Network Insight (NI) - Deployment Environment File
#
# Corporate Headquarters:
# Cowdrey Consulting · United Kingdom · T:+447773281821 
# https://www.cowdrey.net/
#
# © 2026 Cowdrey Consulting. All rights reserved.
#=====================================================================
#
# Common
#
CONFIG_DIRECTORY="/etc/ni"
HOST_SERVICE_GROUP="NI"
NI_NAME="Network Insight"
NI_BUILD="1745876813"
NI_VERSION="1.0.0"
NI_LICENSE_PRIVATE_KEY="PT09PUJFR0lOIExJQ0VOU0UgS0VZPT09PQpLSFhrZ3JtRFcxYTkvUy8zL3ZhUVB1TmpQTTRQSUdsVnV3bEtLZEdkVlhUWlZIWEltdjh0UGNMNlpmYXZHanpObEw5ZzJvTmdrazhyR2pJT1cyS05lelN5MWl3cjRER1hBYkV5TWdUNjBjWXhQd3ZsS3BMOTZ1RUpqR01SRXByNmpwdUVUVUUxNFcyQ3ZSdmlTeFNDcFJKT2lHeEV5TmxVMWhmZDJrLzJ3RVlKc1FTRlFWcS9MZ0hIeWhUTFg3d0wwUjZkeXJJd0pDbk5zUGwvYy9YU1hramdKU0hWdTUxL0YxM1NvdFMxMlplYXM0ajFTaDZpRDF1RjMvK053U0dvWnJZZzkxYTNIUjdnUm1KMmdKRTE2ekl6Q0RDdy92WDhIOFFSb1poNVdaWXBRQ2Z5cG9JUC9kcTFqTGxkYWhwaHduZmNXYnVtc2JUSWhWZ3dLcldxb1JsNGVFL2VJMXZPbDNEL2lxVkRaaklZNThqcXVSQXJCd3VJcVE0UFJJL3FOZ0phSGtzVGxCYytzeFNBemUrQkZTY3FTamtTSzlvdnFra0l6SStRVkF6RlRrajZ6N2xISVlhZEZqNGZKaTBWL25KZWtiZ1BvdktYTzBDQmVITUZkT2pKMHh6b3BscHFGejBnbEhuTUJ4SmlpblZPSkwrMWJVbGY5R1l1V2E2NHU2K3M1OWY3TU5OaEFOSnZ3bkdyK01QaXVrMWd1K21PRWp4alVTR3lzczFzUng0U1JQdm04NkpsZllvS05CYXMzQU5rc3pzUDBmcmhvL1V4YVlobjVhcmlvbGZoUk1VbGtKN1c0NVIvTkpacHEzcCt6Zi9ZRTlhSVpnOFlWVG5UOHdZVVIwczQ5a2lrL3FiaVAwTUtjc3hzYmtXeWxIT1AzWW82a0NybFhRcz18fFUyRnNkR1ZrWDEvRitINLeecowDrey1NEFsQkRKZEVEUTF0d3BPTGUwTHp0UW12bTBDUUcydEJmU055dkVXdVhGZlFrUG5tRXR1RU11a1g0L0Y3TDc3YnUxVSt0cXBpQ0Z1Qm9QdmxNWGpBbjQ0ZHZSR1MrbmR0b3VXYmFVbXVzRHplejhDNHQyMWx2Q282WFRsenpvcUlNZnlXZ0JIYjROTnpKZ01CSGZYSVBWTFZ4aTBuSUdpa3o5SjNjZ2RCZgpXN2VGYWVMWTVjQmwvUlZzSE9kN1lqZGJrVThXKzVldjVuY1UwYTVWY3FjdlhTYUtNZ3FpTGtrS3JDMGszWnZ4VER2QW13Sk15bjFtZ1YwY1VtN3F3b3o1QzFFRzV3aElyTm1Rb3dXdFY5M0pnL0dGSWpTUWpyaThMSy8wZUVtYTZrYmZ6Y1ZZYjlHYURnZStQL3N3ZEdRaUxydmhlT2FQSGxVMkFKMW9ack9nbk0rZktZVUVOaW1rUEphclh0S1Fqd0NiWlY4RVhVWng5cjdKaGVTdEVDeGJRb0l4ZmwxTncyZlQ0alJsbjZHenk4UnpHNWpsS3lzck9ibUd3NE1abzJQVjdzVi84N3lIQjMwYmgvRW4rUWNqOUwrdFlYZ24yWUhUQWQ4ZnFsaU0rUkFtbFdsSkVKZHhxMS80dXFPTWs1SzVmaFFFejNwS2NkQmZOZlVvNC9leEkyUFpJV1k5ZCtLQUZseHFKVk5jN3lBYTc5SVNaT0FNUU16K0M1WWFyNGNIRElsYWFXQXI2Q1ptTm10TlpOalh6aUhLcFRDNXRIaU5ycm81blVqYnlwTjBsQjh0RWFDWkdFV0ZkTWMrVm9rQ09DZW1FN3pGMC8xQ0w3UUVTQytBeTNScXBkNkNPUFRVYUxtUTlQZnNLR3I4bkRwZFZwVldCbXpCaHFzZXJMZUxDY2tETC9pY2VRbmFpcmJhQ3NBYjB2RGhObitFM05hYTZKN28yRlhDd0tzUC96T3IxQTlWZm9xV1pYdkFmK1poWFNOenRYL1RFbnlobitaRTBnWHNRQ0cvaG55YkRPN1QzcWFoa01XVGh0eUUxVWJhZjZ1VHBrYm12R2hlWENKZ1U2S2RlaEhqTjVyK0M2eXZtVE43L3V4a0JpS3p5NW9GYnYraFBJaz0KPT09PUVORCBMSUNFTlNFIEtFWT09PT0"
NI_LICENSE_PUBLIC_KEY="LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQ0lqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FnOEFNSUlDQ2dLQ0FnRUFwc2Q4eW9KN2FpMHFWeU8rWDNwYwphNXIxVFhBSUE5MFVjVVJERCtsdmM4OU1VakdkcUd2OU9LZWZXcGxLaHM1Wnd6WjZsK09va1llL2JjOGpYOUpLCmVmZHQzYkVHWWE0cnYrVEpyZWRlS1VqTDkrR21JQU81eFppeUd2WTlkR1NtajRaN2JaNXdobDlTLzhmSERPR2MKNFZITmozV0FlT3NEOVUrMmxoMnozNHRVT2w1OG1ncDYyQkUvR0YrZmJkWHR6T2Vtc3Q3K0k4ZTRkUFgveGFnbQpNeENHRVhEK2UreUJreTlJcmYzeVVTY2RNdHRSVVNhbVBIeGt5bFFidnVCSy9sd1NsY0lteGEvWjVMYTcwRHZBCkZpSGJBTW1TYVIwQXoyMGh4cFpncytwWU5NMCtPeVQ0TXU5bUZrRC9keEgzRllZS0pjcTNnTTJOM296ZzdiTXcKTEhHNmxYbkpteVVhS3dUT0pDZzlmM2tBOVl0SXhydC9VZGphYkNOY3huLeecowDreyStNcHFCc0RFRlc5TW5DSgpNWHU4eVc0eUN2Uks3TEhjVm15WDl5Sk9DTlhrTTZKeWo4Q2R2S2VnYkhSNWNiNlQ1NjVKVXZJNi9oNFVmOGcrCmU0Z0luM0VTRndhdzdTNGdUdkNOc3poZ09tQ0xsN2dKWDd0cmV4dTFWK3NvamFYSFc1WG5oSXc2TzFaaDNyQmEKU1YweVFoa3pNajhJQXUzNWJZWHR3UzJUNDRQeERLUWtGYzZsZFhoK0ZscWdzYjJxK0NJbnJJNzVKaVlIQ3dpQgpONTdWT3FRUnRyS1VLYXU5MHpNa2JkTHNYNWtCM0pxTHBldW1pOGhITmJRZHExNFBEMFVWbGtpTG5TV1prOWdPCi9jMERrZ3AwK0ZoRnl2VXJ4VDlkSmFzQ0F3RUFBUT09Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQo="
NI_DEFAULT_COUNTRY_CODE="GBR"
NI_DEFAULT_CURRENCY_ISOCODE="GBP"
NI_DEFAULT_CURRENCY_NAME="Sterling"
NI_DEFAULT_CURRENCY_SYMBOL="£"
NI_SERVICE_USERNAME="af06f2fe515b91efbLeeCowdreyb937343cdb54849c148c2"
NI_SERVICE_KEY="BFmZLMn2VPc+l2OekJL0c+Sx6IF9uLeeCowdreyMGyhQ/ssshlz0X1uCYKTqJjzUM1iAw9OHX++MI6CPvB"
#
# OAuth2.0 / OpenID Connect
#
# local iamServer (KeyCloak)
OAUTH=true
OAUTH_CLIENT_ID="NI"
OAUTH_CLIENT_SECRET="mQGulEEcowdREynXpDqBbt1Xe4yziKNs"
OAUTH_DISCOVERY_URL="https://t310.cowdrey.net:6443/realms/ni/.well-known/openid-configuration"
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
ALERTSRV_HOST_SERVICE_LOG_FILE="/var/log/ni/alert.log"
ALERTSRV_HOST_SERVICE_SYSTEMD="nialert.service"
ALERTSRV_HOST_SERVICE_USERNAME="nialert"
ALERTSRV_TLS_INSECURE_CONNECTIONS=true
ALERTSRV_WORKING_DIRECTORY="/usr/local/ni/alert"
#
# apiGateway
#
APIGW_ADDRESS="192.168.111.6"
APIGW_HOST_SERVICE_LOG_FILE="/var/log/ni/apigw.log"
APIGW_HOST_SERVICE_SYSTEMD="niapigw.service"
APIGW_HOST_SERVICE_USERNAME="niapigw"
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
APIGW_WORKING_DIRECTORY="/usr/local/ni/apigw"
#
# apiServer
#
APISERV_ADDRESS="0.0.0.0"
APISERV_API_DIRECTORY="/usr/local/ni/api/openapi"
APISERV_BACKUP_DIRECTORY="/usr/local/ni/api/backup"
APISERV_DEBUG=true
APISERV_DUCKDB_VERSION="v1.4.1"
APISERV_DUCKDB_BACKUP_CRONTIME="0 2 * * *"
APISERV_DUCKDB_BACKUP=true
APISERV_DUCKDB_FILE="/usr/local/ni/api/ni.duckdb"
APISERV_DUCKDB_MAX_MEMORY="20GB"
APISERV_DUCKDB_THREADS=4
APISERV_ENCRYPTION_KEY="qBU4K9XBw2JtYx7puSGiSig8LbxxDpSaprK7+u+EJI8="
APISERV_ENCRYPTION_IV="U5uKpGIE3cIXh5kuhFZXuQ=="
APISERV_KEEPALIVE=true
APISERV_HOST_SERVICE_LOG_FILE="/var/log/ni/api.log"
APISERV_HOST_SERVICE_SYSTEMD="niapi.service"
APISERV_HOST_SERVICE_USERNAME="niapi"
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
APISERV_DOCUMENT_DIRECTORY="/usr/local/ni/api/document"
APISERV_UPLOAD_DIRECTORY="/usr/local/ni/api/upload"
APISERV_URL_PREFIX="/ni"
APISERV_URL_VERSION="/v1"
APISERV_USE_DNS_SD=false
APISERV_WORKING_DIRECTORY="/usr/local/ni/api"
#
# fetchService
#
FETCHSRV_CVE_SCAN=true
FETCHSRV_CVE_DIRECTORY="/usr/local/ni/cvelistV5"
FETCHSRV_DEBUG=true
FETCHSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=120000
FETCHSRV_ENDPOINT_RETRY_INTERVAL_MS=15000
FETCHSRV_FX_UPDATE=true
FETCHSRV_HOST_SERVICE_LOG_FILE="/var/log/ni/fetch.log"
FETCHSRV_HOST_SERVICE_SYSTEMD="nifetch.service"
FETCHSRV_HOST_SERVICE_USERNAME="nifetch"
FETCHSRV_TLS_INSECURE_CONNECTIONS=true
FETCHSRV_WORKING_DIRECTORY="/usr/local/ni/fetch"
#
# uiServer
#
UISERV_ADDRESS="192.168.111.6"
UISERV_DIST_DIRECTORY="/usr/local/ni/ui/dist"
UISERV_DEBUG=true
UISERV_DNS_RESOLVE=300000
UISERV_HOST_SERVICE_LOG_FILE="/var/log/ni/ui.log"
UISERV_HOST_SERVICE_SYSTEMD="niui.service"
UISERV_HOST_SERVICE_USERNAME="niui"
UISERV_PORT=4443
UISERV_SSL_CERT="ui.crt"
UISERV_SSL_CSR="ui.csr"
UISERV_SSL_DAYS=90
UISERV_SSL_KEY="ui.key"
UISERV_SSL_SIZE=4096
UISERV_TIMEOUT_REQUEST=120000
UISERV_TICK_INTERVAL_MS=60000
UISERV_TLS_INSECURE_CONNECTIONS=true
UISERV_URL_PREFIX="/ni"
UISERV_USE_DNS_SD=false
UISERV_WORKING_DIRECTORY="/usr/local/ni/ui"
#
# IAM
#
IAM_ADDRESS="192.168.111.6"
IAM_BOOTSTRAP_ADMIN_USERNAME="admin"
IAM_BOOTSTRAP_ADMIN_PASSWORD="admin"
IAM_HOST_SERVICE_LOG_FILE="/var/log/ni/iam.log"
IAM_HOST_SERVICE_SYSTEMD="niiam.service"
IAM_HOST_SERVICE_USERNAME="niiam"
IAM_KEYCLOAK_VERSION="26.4.4"
IAM_PORT_HTTPS=6443
IAM_SSL_CERT="iam.crt"
IAM_SSL_CSR="iam.csr"
IAM_SSL_DAYS=90
IAM_SSL_KEY="iam.key"
IAM_SSL_SIZE=4096
IAM_WORKING_DIRECTORY="/usr/local/ni/iam"
#
# predictService
#
PREDICTSRV_CRONTIME="0 0 * * *"
PREDICTSRV_DEBUG=true
PREDICTSRV_ENDPOINT_RETRY_INTERVAL_MS=15000
PREDICTSRV_ENDPOINT_KEEPALIVE_INTERVAL_MS=60000
PREDICTSRV_HOST_SERVICE_LOG_FILE="/var/log/ni/predict.log"
PREDICTSRV_HOST_SERVICE_SYSTEMD="nipredict.service"
PREDICTSRV_HOST_SERVICE_USERNAME="nipredict"
PREDICTSRV_TLS_INSECURE_CONNECTIONS=true
PREDICTSRV_WORKING_DIRECTORY="/usr/local/ni/predict"
#
# dnsServer
#
DNSSERV_INSTALL=false
DNSSERV_ADDRESS=
DNSSERV_VERSION="2.70"
DNSSERV_HOST_SERVICE_LOG_FILE="/var/log/ni/dns.log"
DNSSERV_HOST_SERVICE_SYSTEMD="nidns.service"
DNSSERV_HOST_SERVICE_USERNAME="nidns"
DNSSERV_PORT=53
DNSSERV_HOST="t310"
DNSSERV_DOMAIN="cowdrey.net"
DNSSERV_WORKING_DIRECTORY="/usr/local/ni/dns"
DNSSERV_SYSTEMD_RESOLVE=1
DNSSERV_RESOLVCONF=1
#
```

---

# 12. Hosting Specifications

## 12.1. Standalone

### 12.1.1. Combined Single Host

| Component       | CPU | RAM  | Disk |
| --------------- | --- | ---- | ---- |
| All Combined    | 4   | 16GB | 64GB |
| API Server      | 2   | 10GB | 8GB  |
| Alert Service   | 1   | 1GB  | 1GB  |
| API Gateway     | 1   | 1GB  | 1GB  |
| Fetch Service   | 1   | 1GB  | 4GB  |
| Predict Service | 1   | 1GB  | 1GB  |
| UI Server       | 1   | 1GB  | 1GB  |

### 12.1.2. Individual Hosts

| Component       | CPU | RAM  | Disk |
| --------------- | --- | ---- | ---- |
| All Combined    | 4   | 16GB | 64GB |
| API Server      | 2   | 10GB | 8GB  |
| Alert Service   | 1   | 1GB  | 1GB  |
| API Gateway     | 1   | 1GB  | 1GB  |
| Fetch Service   | 1   | 1GB  | 4GB  |
| Predict Service | 1   | 1GB  | 1GB  |
| UI Server       | 1   | 1GB  | 1GB  |

## 12.2. Cluster

### 12.2.1. Per API Server Host

| Component  | CPU | RAM  | Disk |
| ---------- | --- | ---- | ---- |
| API Server | 2   | 10GB | 8GB  |

### 12.2.2. Other

| Component       | CPU | RAM | Disk |
| --------------- | --- | --- | ---- |
| Alert Service   | 1   | 1GB | 1GB  |
| API Gateway     | 1   | 1GB | 1GB  |
| Fetch Service   | 1   | 1GB | 4GB  |
| Predict Service | 1   | 1GB | 1GB  |
| UI Server       | 1   | 1GB | 1GB  |

> **Note:** 
> - Both the API Gateway and UI Server can be deployed on to multiple hosts without additional configuration. The DNS A records used by NI will need to be modified to support multiple resolved hosts/IP addresses (DNS Round-Robin)

## 12.3. Operating Systems

NI is developed and supported on Debian based operating systems, this includes Ubuntu and other similar variants. The minimum supported version of Debian is version 12.

> **Note:**
> - RedHat Enterprise Linux (RHEL) and its variants are not supported but compatible and installation scripts will require adjustment to support the RHEL package manager. For demonstration systems any host supporting DuckDB, NodeJS 22.x can be used.

## 12.4. Host Firewalls

A generic example for an IPv4 `iptables`/`netfilter` host based firewall with NI deployed on a single host supporting IPv4 is shown below:

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

# 13. License Generator

NI requires a valid license to be included within the environment deployment file and this license must be generated specifically for the host or hosts operating the NI API Server.

> **Note:**
> - if deploying API Server to a container environment, such as Kubernetes, NI automatically detects this and is less stringent on the hostname matching on the license but will still enforce the licensed domain name.
> - The NI License Generator is NOT included into the release archive and should **NOT** be provided to customers nor partners.
> - The NI License Generator includes cryptographic private and public keys, the public key is also embedded within `oasConstants.mjs` and the default `ni.ini`, all of these must use the **same** cryptographic keys

Within the `licensegen` source directory, deploy the required NodeJS libraries:

```bash
$ cd ni/src/licensegen
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
	--generate				create a new encrypted key for inclusion within ni.ini
		[--out=ni.key]		      	filename to save encrypted key to
		[--start=YYYYMMDD[T]HHmmss]
		[--duration=13]			      positive integer, no validation against unit is performed
		[--unit=month]	      		second,minute,hour,day,week,month,quarter or year
		[--role=standalone]		    role of the API server, standalone, master or slave
    [--host=ni]	        		the hostname executing API Server
		[--domain=cowdrey.local]	the domain name executing API Server

	--verify				verify encrypted key contents
		[--in=ni.key]	      		filename to read encrypted key from

20251120T114910 example:

	node licenseGen.mjs --generate --start=20250801T000000 --duration=1 --unit=month --role=standalone --host=mdt --domain=cowdrey.net --out=mdt.pem
```

To generate a standalone single host license key:

```bash
$ node licenseGen.mjs --generate --start=20250801T000000 --duration=1 --unit=month --role=standalone --host=NI --domain=customer.com --out=customer.pem
20251120T115423 info {
  out: 'customer.pem',
  role: 'standalone',
  host: 'ni',
  domain: 'customer.com',
  start: '20250801T000000',
  expiry: '20250831T235959'
}
$ cat customer.pem
PT09PUJFR0lOIExJQ0VOU0UgS0VZPT09PQpBUEx4Vk5hQ2Y2OGd3ZEpmMmRZbHhFMTU1V21pZEtwSzNTcjZJVXR1T1FMT05aaW0rOVJlWDh2RlQyNWgrQTRwWE1pRTYvdVludzZEYjBtY054T053L3pUM3ZiOHAwVm53TnJMbTd0MXIrSWV2S2FTanY2alUydVpLVUk5THRsWFJ6NjVadXFIbTNHZlhVNU41cmJPdVFXdHFvUDVSVS85T1hSdmxDL2ZscDhNNVZMR2NaMHBLNDJFVFJrUkNNVll0Ti9DWnZlWGc1RzZoRXBXaDUzODdvK2RCQ3J3UjdldnhnMHZvOVVNN2FrSit5VTZ5RWFNdFU5eGZia2FUOHJPWktCMEYzVWlhWXFJbHVrazQ3SmFxUS95NE5VY09RRytsWFhWTGJQK0hxZFQwdG94bnFwMUlvQ0MwOFRMQ2ladkkwaVdIRC9NaVNpSGZZUlZ2dFZ2Y2N3Ym9qWVJUY0Y3bVljaGpJM1R6amo3WHpQdkZRVVV6aWVjOHdlTHptQ2NEcEFrNHpZWUhSYWdSVVR1Zm9QK3VMYWR5V2JuMnRUUHVWOUt1UzNXS28vdWEwb0R0Nmx0R3lhZ2JyMHN4NG9kdytyaUFUOEFnMEhtcnA2ZEY4Ky9jREVaQWV5c2liTzAzUERiYnF2dDJ5NDhKK1FuZ2ZVR29oM0R2a2YxT3hMTFlzNHoxUE1nYW1RY0xrZDhNVU9iYmVSNjNFWWJyTU9oRlhiSjN2VEtNdm5td0tuZHJvU1AxOGdQSE92dnpUeXhqMENrT2V3Yk1qZnh4UXRmVG1hSkhHRld5azA5dUh4S3F1bHBXSjBqTDV2bW9IU3BVSXRraDY4Z012V2pYYVVXR3cvdXBZNE01NG1xVDNka1ZkSmhCU214amMyZDR2ZU9nNENsWUpIR2lCWT18fFUyRnNkR1ZrWDE5RCtrVG1MQlRsTkx6SmUzV2tocTNjcjBONERtajAzVUNIZzJrc3FVajRLY0NJN3RiK3ZIR3VOa3o0U2JvWlZTeCtyWDFNN0lnQ3RTUGR6U3FYT3ZvZFFWNkRydVpWOGRUZTQxN2FJMVdIV2h0aVNaTWV4U3dTNk5aSXFpdFliOTdlQWdaZk5uVHM5YU8xNTZQTUlMTVE4bmJXV0xCSnJwaz0KV1lRVFpjbUdSdlIxL05zR3JRaHVJcVh4NHNPNU5zc3lqR2VNQk42QVhMbWdNalBPMFc3RWpoL0hUYmtHY0N1UDAwNEdQcjFxc0M5Q2RNVG5uS1NvNDRBMHkvZGs0MndaSVp6ZlVaK0FGZ29vZUR0MVE1bngyaHMvZ1BHbXhuRjZITEhUSk1LazJJQWQrQkZxYWljZEFKNFIvQlFOOXBlemdEbGRzQjFQODVhTjZiYWRIR3hFTW9OSSs4Vm0yUVMwVzFaTTlNYURFb3ZvM3kwcUtBY2JabUFEQXlqbDJOMnZ5MkRlVXpvQjVvYkl1UkU1MHNXSlErWjgzQUowZzlmRG5vaFM5RUlPdEx6Zno3SXhOMEpTRHRaL1VtbFRYbmdDYW9BU29VelVkWFluWEFwVWJ2NVUrUm4wRzdvNHUxRUZYTHJyMGIzVjdXZ0ZLYkRnOHUrMmVnTVlWejBhMkJieStKZWpodTBpZVQ1N1ZxT1c2V05zQlhPTWRLT1NKSWhrZUtVWFpmaDZvcml0UjFua3NwTkxKb3JhNVd6L01MNkVOMFIxazIvV3RBVzF5MHh3UzB6dXZUcGt4MXEySWNkbzdxWGRZWVVXYjlnbnFYUWVoMS90dWNVMzVoQVFIdlBsVTlwVjhVWDlFMms2S2p6cDkxV1k1TVZ0YXZueFh3R2YydGNkTDlzV3FaSllJdVFrcFhPMHVEZm5HdkM2R2tGV1RvUnkya3d1R3owVDUxZTRhbU55MGZSWGt5UGw2ejlyb3pIUGhhenpHTWt1cy9kTTZKZ28vUmFiQ0N2UVhXUDh2aXNtQWNqZkFJQk1zeE53NXFiaU9uU3ROc1pkUW9kak9xZzJKV3RaS2pBUkc2MWVYR0E1TmxKUENFZjloY25VeGxoNlJtOHYxams9Cj09PT1FTkQgTElDRU5TRSBLRVk9PT09
```

The contents of the generated license key file, in this example `customer.pem` should be placed within the respective `ni.ini` variable `NI_LICENSE_PRIVATE_KEY` prior to deployment, for example:

```bash
#
# Common
#
...
NI_LICENSE_PRIVATE_KEY="PT09PUJFR0lOIExJQ0VOU0UgS0VZPT09PQpBUEx4Vk5hQ2Y2OGd3ZEpmMmRZbHhFMTU1V21pZEtwSzNTcjZJVXR1T1FMT05aaW0rOVJlWDh2RlQyNWgrQTRwWE1pRTYvdVludzZEYjBtY054T053L3pUM3ZiOHAwVm53TnJMbTd0MXIrSWV2S2FTanY2alUydVpLVUk5THRsWFJ6NjVadXFIbTNHZlhVNU41cmJPdVFXdHFvUDVSVS85T1hSdmxDL2ZscDhNNVZMR2NaMHBLNDJFVFJrUkNNVll0Ti9DWnZlWGc1RzZoRXBXaDUzODdvK2RCQ3J3UjdldnhnMHZvOVVNN2FrSit5VTZ5RWFNdFU5eGZia2FUOHJPWktCMEYzVWlhWXFJbHVrazQ3SmFxUS95NE5VY09RRytsWFhWTGJQK0hxZFQwdG94bnFwMUlvQ0MwOFRMQ2ladkkwaVdIRC9NaVNpSGZZUlZ2dFZ2Y2N3Ym9qWVJUY0Y3bVljaGpJM1R6amo3WHpQdkZRVVV6aWVjOHdlTHptQ2NEcEFrNHpZWUhSYWdSVVR1Zm9QK3VMYWR5V2JuMnRUUHVWOUt1UzNXS28vdWEwb0R0Nmx0R3lhZ2JyMHN4NG9kdytyaUFUOEFnMEhtcnA2ZEY4Ky9jREVaQWV5c2liTzAzUERiYnF2dDJ5NDhKK1FuZ2ZVR29oM0R2a2YxT3hMTFlzNHoxUE1nYW1RY0xrZDhNVU9iYmVSNjNFWWJyTU9oRlhiSjN2VEtNdm5td0tuZHJvU1AxOGdQSE92dnpUeXhqMENrT2V3Yk1qZnh4UXRmVG1hSkhHRld5azA5dUh4S3F1bHBXSjBqTDV2bW9IU3BVSXRraDY4Z012V2pYYVVXR3cvdXBZNE01NG1xVDNka1ZkSmhCU214amMyZDR2ZU9nNENsWUpIR2lCWT18fFUyRnNkR1ZrWDE5RCtrVG1MQlRsTkx6SmUzV2tocTNjcjBONERtajAzVUNIZzJrc3FVajRLY0NJN3RiK3ZIR3VOa3o0U2JvWlZTeCtyWDFNN0lnQ3RTUGR6U3FYT3ZvZFFWNkRydVpWOGRUZTQxN2FJMVdIV2h0aVNaTWV4U3dTNk5aSXFpdFliOTdlQWdaZk5uVHM5YU8xNTZQTUlMTVE4bmJXV0xCSnJwaz0KV1lRVFpjbUdSdlIxL05zR3JRaHVJcVh4NHNPNU5zc3lqR2VNQk42QVhMbWdNalBPMFc3RWpoL0hUYmtHY0N1UDAwNEdQcjFxc0M5Q2RNVG5uS1NvNDRBMHkvZGs0MndaSVp6ZlVaK0FGZ29vZUR0MVE1bngyaHMvZ1BHbXhuRjZITEhUSk1LazJJQWQrQkZxYWljZEFKNFIvQlFOOXBlemdEbGRzQjFQODVhTjZiYWRIR3hFTW9OSSs4Vm0yUVMwVzFaTTlNYURFb3ZvM3kwcUtBY2JabUFEQXlqbDJOMnZ5MkRlVXpvQjVvYkl1UkU1MHNXSlErWjgzQUowZzlmRG5vaFM5RUlPdEx6Zno3SXhOMEpTRHRaL1VtbFRYbmdDYW9BU29VelVkWFluWEFwVWJ2NVUrUm4wRzdvNHUxRUZYTHJyMGIzVjdXZ0ZLYkRnOHUrMmVnTVlWejBhMkJieStKZWpodTBpZVQ1N1ZxT1c2V05zQlhPTWRLT1NKSWhrZUtVWFpmaDZvcml0UjFua3NwTkxKb3JhNVd6L01MNkVOMFIxazIvV3RBVzF5MHh3UzB6dXZUcGt4MXEySWNkbzdxWGRZWVVXYjlnbnFYUWVoMS90dWNVMzVoQVFIdlBsVTlwVjhVWDlFMms2S2p6cDkxV1k1TVZ0YXZueFh3R2YydGNkTDlzV3FaSllJdVFrcFhPMHVEZm5HdkM2R2tGV1RvUnkya3d1R3owVDUxZTRhbU55MGZSWGt5UGw2ejlyb3pIUGhhenpHTWt1cy9kTTZKZ28vUmFiQ0N2UVhXUDh2aXNtQWNqZkFJQk1zeE53NXFiaU9uU3ROc1pkUW9kak9xZzJKV3RaS2pBUkc2MWVYR0E1TmxKUENFZjloY25VeGxoNlJtOHYxams9Cj09PT1FTkQgTElDRU5TRSBLRVk9PT09"
...
```

> **Note:**
> - For clustering, use `--role=master` and `--role=slave` respectively and generate multiple license keys for each NI API Server host

--

# 14. Building the release

The NI CI/CD pipeline can be kickstarted manually by executing the pipeline script. This will perform the required steps to produce a version release archive and commit any changes back to the [NI repository](https://github.com/leecowdrey/NI) hosted within GitHub.

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


## 14.1. JavaScript Code Scanning

As part of the CI/CD process, NI is scanned for vulnerabilities that may exist in the NI source code. This is undertaken via.

| Third-Party Package | Used Version | License    |
| ------------------- | ------------ | ---------- |
| `auditjs`           | 4.0.47       | Apache 2.0 |

> **Note:**
> - Please refer to [auditjs](https://github.com/sonatype-nexus-community/auditjs) for further details.

## 14.2. Individual Build Scripts
If required, the individual build scripts can be executed in isolation - examine contents of [build](build/) directory for further details but these include:
 - `builddepjs.sh` generate `nodejs-dependencies.md` in the documentation directory
 - `buildtag.sh` update the NI version specific details in OpenAPI definitions and other areas
 - `buildui.sh` webpack the NI UI to perform obfuscation
 - `cvescan.sh` perform CVE analysis on NI JavaScript source code files
 - `erd2svg.sh` produced SVG diagram from the Entity Relationship Diagram definition extracted from the database schema
 - `openapi.sh` generate JSON/YAML definitions for the OpenAPI which are embedded within the API Server
 - `pipeline.sh` wrapper script to run all build steps
 - `release.sh` wrapper script to produce bundle of compressed TAR files containing each NI component and MD5 verification file

## 14.3. Release artifacts

Within the `release` directory two files will be generated:

1. `ni_{version}.md5` this contains the MD5 hash signature of the main compressed TAR file
2. `ni_{version}.tar.gz` the version specific release of NI

for example:

```bash
$ ls -1
ni_1.0.0.md5
ni_1.0.0.tar.gz
```

The version specific release archive can be verified as not corrupted or altered since the checksum was originally generated:

```bash
$ md5sum -c ni_1.0.0.md5
ni_1.0.0.tar.gz: OK
```

Unpacking the specific release of NI, the contents include:

```bash
$ tar -zxf ni_1.0.0.tar.gz 
$ ls -1
ni_1.0.0.md5
ni_1.0.0.tar.gz
ni_alertService_1.0.0.md5
ni_alertService_1.0.0.tar.gz
ni_apiGateway_1.0.0.md5
ni_apiGateway_1.0.0.tar.gz
ni_apiServer_1.0.0.md5
ni_apiServer_1.0.0.tar.gz
ni_dnsServer_1.0.0.md5
ni_dnsServer_1.0.0.tar.gz
ni_fetchService_1.0.0.md5
ni_fetchService_1.0.0.tar.gz
ni_iamServer_1.0.0.md5
ni_iamServer_1.0.0.tar.gz
ni_predictService_1.0.0.md5
ni_predictService_1.0.0.tar.gz
ni_uiServer_1.0.0.md5
ni_uiServer_1.0.0.tar.gz
```

The component archives can also be verified as not corrupted or altered since the checksum was originally generated:

```bash
$ find . -type f -name "ni_*_?.?.?.md5" -exec md5sum -c {} \; && md5sum -c ni_?.?.?.md5
ni_fetchService_1.0.0.tar.gz: OK
ni_uiServer_1.0.0.tar.gz: OK
ni_alertService_1.0.0.tar.gz: OK
ni_dnsServer_1.0.0.tar.gz: OK
ni_iamServer_1.0.0.tar.gz: OK
ni_apiGateway_1.0.0.tar.gz: OK
ni_apiServer_1.0.0.tar.gz: OK
ni_predictService_1.0.0.tar.gz: OK
ni_1.0.0.tar.gz: OK
```

---

# 15. Deploying the release

Each NI component archive can be unpacked for installation purposes.

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

Each component directory will contain its own `ni.ini` - if using a single host, update the copy witin the API Server directory `apiServer` first, install the API Server, and all other components will defer to the installed environment configuration file.

Each component contains the following scripts:

- `ni.ini` this is a shared file that is duplicated into the release archive
- `common.sh` this is a shared file that is duplicated into the release archive
- `install.sh` this script is used for undertaking a new installation and is specific to the component
- `uninstall.sh` this script is used for uninstalling an previous installation and is specific to the component
- `update.sh` this script is used for updating an existing installation, typically this is just updating NI itself but is specific to the component
- `upgrade.sh` this script is used for updating an existing installation, both any third-party and NI itself will be upgrading but is specific to the component


## 15.1. Example Component Installation

```bash
# ./install.sh 
✋  NI UI Server Install                                                              [17:56:30]
▶️   Adding NI group                                                                  [17:56:30]
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
# cat /var/log/ni/ui.log 
20251120T175648 info {
  event: 'starting',
  ni: {
    name: 'Network Insight',
    version: '1.0.0',
    build: '1745876813'
  },
  endpoint: {
    host: 't310',
    domain: 'cowdrey.net',
    fqdn: 't310.cowdrey.net',
    address: '192.168.111.6',
    port: 4443,
    urlPrefix: '/ni',
    urlVersion: '/v1'
  },
  environment: {
    configDirectory: '/etc/ni',
    country: 'GBR',
    distDirectory: '/usr/local/ni/ui/dist',
    tickInterval: 60000,
    timestamp: 'YYYYMMDD[T]HHmmss',
    ignoreTlsSsl: true
  },
  apiGateway: {
    dns: 'https://t310.cowdrey.net:8443/ni/v1',
    ip: 'https://192.168.111.6:8443/ni/v1'
  },
  ouath: {
    enabled: true,
    discovery: 'https://t310.cowdrey.net:6443/realms/ni/.well-known/openid-configuration',
    credentials: { id: '***', secret: '********************************' }
  },
  ssl: { key: 'ui.key', cert: 'ui.crt' },
  timeouts: { request: 120000 }
}
(node:11788) Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' makes TLS connections and HTTPS requests insecure by disabling certificate verification.
(Use `node --trace-warnings ...` to show where the warning was created)
20251120T175649 debug oauthDiscovery {
  authorize: 'https://192.168.111.6:6443/realms/ni/protocol/openid-connect/auth',
  logout: 'https://192.168.111.6:6443/realms/ni/protocol/openid-connect/logout',
  token: 'https://192.168.111.6:6443/realms/ni/protocol/openid-connect/token'
}
20251120T175649 debug dynamicPaths { urlPath: '/ni', osPath: '/usr/local/ni/ui/dist' }
20251120T175649 debug dynamicPaths { urlPath: '/ni/css', osPath: '/usr/local/ni/ui/dist/css' }
20251120T175649 debug dynamicPaths { urlPath: '/ni/fonts', osPath: '/usr/local/ni/ui/dist/fonts' }
20251120T175649 debug dynamicPaths { urlPath: '/ni/img', osPath: '/usr/local/ni/ui/dist/img' }
20251120T175649 debug dynamicPaths { urlPath: '/ni/js', osPath: '/usr/local/ni/ui/dist/js' }
20251120T175649 debug dynamicPaths {
  urlPath: '/ni/js/vendor',
  osPath: '/usr/local/ni/ui/dist/js/vendor'
}
20251120T175649 debug dynamicPaths {
  urlPath: '/ni/js/vendor/chartjs',
  osPath: '/usr/local/ni/ui/dist/js/vendor/chartjs'
}
```

> **Note:**
> - this will use any existing deployed `/etc/ni/ni.ini` environment configuration file, otherwise the existing copy within the component release will be deployed

## 15.2. Example Component Update

```bash
# ./update.sh 
✋  NI UI Server Upgrade                                                              [18:02:05]
▶️   Stopping SystemD service                                                          [18:02:05]
✅  - ok                                                                               [18:02:05]
▶️   Updating environment                                                              [18:02:05]
✅  - ok                                                                               [18:02:05]
▶️   Restarting SystemD service[                                                       [18:02:05]
✅  - ok                                                                               [18:02:06]
✅  - completed                                                                        [18:02:06]
```

> **Note:**
> - this expects to use the existing deployed `/etc/ni/ni.ini` environment configuration file

## 15.3. Example Component Upgrade

```bash
# ./upgrade.sh 
✋  NI UI Server Upgrade                                                              [17:59:24]
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
> - this expects to use the existing deployed `/etc/ni/ni.ini` environment configuration file

To upgrade third-party component adjust the respective `APIGW_KRAKEND_VERSION`, `APISERV_DUCKDB_VERSION`, `IAM_KEYCLOAK_VERSION` variable with the required version number within the deployed environment configuration file (`/etc/ni/ni.ini`) prior to executing the upgrade script:

```bash
APIGW_KRAKEND_VERSION="2.12.0"
APISERV_DUCKDB_VERSION="v1.4.2"
IAM_KEYCLOAK_VERSION="26.4.4"
```

## 15.4. Example Component Removal

```bash
# ./uninstall.sh 
✋  NI UI Server Uninstall                                                            [17:55:18]
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

> **Note:**
> - This expects to use the existing deployed `/etc/ni/ni.ini` environment configuration file
> - Any deployed SSL certificates and the environment configuration file `/etc/ni/ni.ini` are not automatically removed as may be required for a later installation.

The following directories should be manually removed if NI is no longer to exist upon a host

- `/etc/ni`
- `/var/log/ni`
- `/usr/local/ni`

---

# 16. Integration Lab

![](docs/architecture/ni-architectures-Integration%20Lab.svg)

Integration Lab
> ssh admin@192.168.111.6

> **Note:** 
> - all NI created host accounts are automatically created, secured and by default have shell access disabled, use `systemctl` to control the running service from a privileged, i.e. `root`, account

## 16.1. Host

- IP: `192.168.111.6`
- Host name: `t310`
- Domain name: `cowdrey.net`
- username: `admin`
- password: available from IT Support
- root username: `root`
- root password: available from IT Support

### 16.1.1. DNS Records

| Component   | DNS Type | DNS Record Name                               | DNS Record Value                                                  |
| ----------- | -------- | --------------------------------------------- | ----------------------------------------------------------------- |
| API Server  | `SRV`    | `_https._tcp.apisrrver.t310.com` | `0 10 7443 _https._tcp.apiserver.t310.cowdrey.net.` |
| API Server  | `A`      | `apiserver.t310.cowdrey.net`    | `127.0.0.1`                                                       |
| API Gateway | `SRV`    | `_https._tcp.gateway.t310.com`   | `0 10 8443 _https._tcp.gateway.t310.cowdrey.net`    |
| API Gateway | `A`      | `t310.cowdrey.net`              | `192.168.111.6`                                                    |

The following are neither defined and/or not used within this environment:

| Component   | DNS Type | DNS Record Name                         | DNS Record Value                                           |
| ----------- | -------- | --------------------------------------- | ---------------------------------------------------------- |
| IAM Server  | `SRV`    | `_https._tcp.iam.t310.com` | `0 10 5443 _https._tcp.iam.t310.cowdrey.net` |
| IAM Server  | `A`      | `t310.cowdrey.net`        | `192.168.111.6`                                             |
| UI Server   | `SRV`    | `_https._tcp.ui.t310.com`  | `0 10 4443 _https._tcp.ui.t310.cowdrey.net`  |
| API Gateway | `A`      | `t310.cowdrey.net`        | `192.168.111.6`                                             |

> **Note:** 
> - DNS records for this host are hosted externally from the lab environment, please contact IT Support for further details

## 16.2. User Interface

- Browser URL: [[URL](https://t310.cowdrey.net:4443/)](https://t310.cowdrey.net:4443/)
- username: `ni@cowdrey.net`
- password: `insight`
- OS username: `niui`
- OS group: `ni`
- OS deployed location: `/usr/local/ni/ui`
- OS log location: `/var/log/ni/ui.log`

## 16.3. API Server

- Endpoint Prefix: [https://t310.cowdrey.net:7443/ni/v1](https://t310.cowdrey.net:7443/ni/v1)
- service username: `af06f2fe515b91efb5f9a6ceddcb937343cdb54849c148c2`
- service key: `BFmZLMn2VPc+l2OekJL0c+Sx6IF9uhM2nAp34TMGyhQ/shhlz0X1uCYKTqJjzUM1iAw9OHX++MI6CPvB`
- OS username: `niapi`
- OS group: `ni`
- OS deployed location: `/usr/local/ni/api`
- OS log location: `/var/log/ni/api.log`

## 16.4. API Gateway

- Endpoint Prefix: [https://t310.cowdrey.net:8443/ni/v1](https://t310.cowdrey.net:8443/ni/v1)
- OS username: `niapigw`
- OS group: `ni`
- OS deployed location: `/usr/local/ni/apigw`
- OS log location: `/var/log/ni/apigw.log`

## 16.5. Alert Service

- OS username: `nialert`
- OS group: `ni`
- OS deployed location: `/usr/local/ni/alert`
- OS log location: `/var/log/ni/alert.log`

## 16.6. Fetch Service

- OS username: `nifetch`
- OS group: `ni`
- OS deployed location: `/usr/local/ni/fetch`
- OS log location: `/var/log/ni/api.log`

## 16.7. Predict Service

- OS username: `nipredict`
- OS group: `ni`
- OS deployed location: `/usr/local/ni/predict`
- OS log location: `/var/log/ni/predict.log`

---

# 17. Architecture / Technology Choices / Third-Party 

NI is based on open source software and does not included any embedded commercial components that require separate commercial agreements.

> Could the functionality currently provided by NI have been achieved more simply using a time-series database (TSDB)?

No.
An off the shelf TSDB requires larger infrastructure, commercial licenses (something NI does not require for any of the technology it uses), requires vast preprocessing, forces times intervals across all data and to common time periods (hourly, daily), creates vast amounts of data it then has to store through complex data compression.

The database NI uses is NOT a TSDB, the NI API Server adds and maintains all the time-series data. Many reasons but it makes it lean, efficient and more importantly it separates the logic from the storage. So NI could change the backend database technology to another database product **without** breaking anything else or forcing users or other applications to have to change - this is known as a loosely-coupled architecture and is core to a micro services/cloud-native architecture.

NI data changes when the provider makes a change, extends or adds a trench, runs a new cable, connects a port. If nothing has happened to the resource it **does not** just duplicate it against a time period (i.e. a day), as it’s the same resource incarnation, nothing has changed, so nothing is stored. 

If your data was changing frequently, for example weather conditions, you can take a sample every second, or minute or hour or day and this is where a TSDB comes in to play - conversely NI data is not constantly changing. This is where you hear the phrase *Data Lake*, vast amount data which very quickly turns in to a *Data Swamp* as the data value degrades due to the cost/time of processing it and more importantly its meaning in a relationship.

## 17.1. Map Rendering

By default NI User Interface makes use of Google Maps and as such requires a Google Maps API key - the credentials can be configured via the NI Secrets API or the default changed in the API Server database schema definition prior to installation. Without this key the NI User Interface will **NOT** visualise poles, sites or trenches over topological terrain - cables, ducts, network equipment are not impacted by this.

## 17.2. Foreign Exchange Rates

If enabled, in NI Fetch makes use of a free service from [exchangeratesapi.io](https://exchangeratesapi.io/) which is limited to 100 requests per calendar month. The credentials can be configured via the NI Secrets API or the default changed in the API Server database schema definition prior to installation.

> **Note:**
> - This can be enabled or disabled by setting the environment configuration file variable `FETCHSRV_FX_UPDATE` to `true` or `false` regardless of what NI Fetch job tasks may exist
> - NI uses the same free credentials, therefore multiple installations may cause limits imposed by [exchangeratesapi.io](https://exchangeratesapi.io/) to be reached
> - For each deployment, it is recommended that the customer obtains their own free credentials from [exchangeratesapi.io](https://manage.exchangeratesapi.io/signup/free) to avoid hitting any limits.

## 17.3. Common Vulnerabilities and Exposures (CVE) Repository

If enabled, there are no commercial restrictions for caching the CVE repository. Any further questions or concerns should be directed to [cve.org](https://www.cve.org/).

> **Note:**
> - Refer to the environment configuration file variable `FETCHSRV_CVE_DIRECTORY` for the cache location.

## 17.4. Sample Data

The API Server includes sample data covering cables, ducts, utility poles, network equipment, racks, sites, services and trenches for the mutiple countries.

This data can be added by executing the `sample.sh` script from **within** the API Server installation directory once the API Server has finished installation.

```bash
# cd ni/apiServer/
# ./sample.sh
✋  NI API Server Sample Data Load                                    [17:35:16]
▶️   DNS service discovery                                             [17:35:17]
✅  - ok                                                               [17:35:17]
▶️   Checking for API Readiness                                        [17:35:17]
✅  - ok                                                               [17:35:17]
▶️   Adding secret - fx                                                [17:35:17]
✅  - ok                                                               [17:35:17]
▶️   Adding bulk email providers                                       [17:35:17]
✅  - ok                                                               [17:35:17]
▶️   Adding bulk kafka providers                                       [17:35:17]
✅  - ok                                                               [17:35:17]
▶️   Adding bulk map providers                                         [17:35:17]
✅  - ok                                                               [17:35:17]
▶️   Adding bulk workflow engines                                      [17:35:17]
✅  - ok                                                               [17:35:17]
▶️   Adding CVEs                                                       [17:35:17]
ℹ  Loading CVE 2025-21601                                              [17:35:17]
✅  - ok                                                               [17:35:18]
ℹ  Loading CVE 2025-30649                                              [17:35:18]
✅  - ok                                                               [17:35:18]
▶️   Adding bulk sites                                                 [17:35:18]
ℹ  Loading bulk sites for GBR                                          [17:35:18]
✅  - ok                                                               [17:35:18]
▶️   Adding bulk racks                                                 [17:35:18]
ℹ  Loading bulk racks for GBR                                          [17:35:18]
✅  - ok                                                               [17:35:18]
▶️   Adding bulk trenches                                              [17:35:18]
ℹ  Loading bulk trenches for GBR                                       [17:35:18]
✅  - ok                                                               [17:35:18]
▶️   Adding bulk poles                                                 [17:35:18]
ℹ  Loading bulk poles for GBR                                          [17:35:18]
✅  - ok                                                               [17:35:18]
▶️   Adding bulk ducts                                                 [17:35:18]
ℹ  Loading bulk ducts for GBR                                          [17:35:18]
✅  - ok                                                               [17:35:18]
▶️   Adding bulk cables                                                [17:35:18]
ℹ  Loading bulk cables for GBR-1                                       [17:35:18]
✅  - ok                                                               [17:35:18]
▶️   Adding bulk network equipment                                     [17:35:18]
ℹ  Loading bulk nes for GBR                                            [17:35:18]
✅  - ok                                                               [17:35:18]
▶️   Adding bulk services                                              [17:35:18]
ℹ  Loading bulk services for GBR                                       [17:35:18]
✅  - ok                                                               [17:35:18]
▶️   Adding document - favicon.ico                                     [17:35:18]
✅  - ok                                                               [17:35:18]
✅  - completed                                                        [17:35:18]
```

> **Note:**
> - the `sample.sh` script makes use of `SD-DNS` to locate the NI API Server
> - the `sample.sh` script uses the deployed environment configuration file to retrieve the API Server service credentials
> - sample data per country is identified by the filename containing the country identifier, i.e. `cable-GBR-1.json` containing `GBR`
> - Any resource dependencies, i.e. a rack requires a site to already exist, should be taken into consideration when loading sample data.
> - any large JSON files should be limited to 100 records of the respective resource per file, this is to allow the data to be bulk loaded to the NI API Server queues without data loss
> - the following files are **not** country specific and should **removed** aftet the first execution of the sample script:
>   - `CVE-2025-21601.json`
>   - `CVE-2025-30649.json`
>   - `admin_data.json`
>   - `admin_email.json`
>   - `admin_kafka.json`
>   - `admin_map.json`
>   - `admin_workflow.json`
>   - `favicon.ico`
>   - `secret-fx.json`


## 17.5. World Boundaries

The API Server includes the world geometry boundaries of 230 countries, allowing longitude (`X`) and latitude (`Y`) coordinates to be matched to a single geographic country - this data is loaded during installation, summarised within the API Server and the raw data subsequently removed.

This data is sourced from [geoBoundaries - an open database of political administrative boundaries](https://www.geoboundaries.org).

## 17.6. Third-Party Elements & Libraries

NI makes use of third-party JavaScript libraries, all referenced libraries and elements are currently open source.

> **Note:** Some of the third-party elements are available under separate commercial terms if additional Enterprise functionality or support is required for a specific deployment.

A highly detailed list is automatically generated through the CI/CD process and is available at [dependencies](docs/nodejs-dependencies.md), a summary shown below for reference.

### 17.6.1. API Gateway 

| Third-Party Package | Used Version | License    |
| ------------------- | ------------ | ---------- |
| `krakenD`           | 2.12.0       | Apache 2.0 |

### 17.6.2. API Server 

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
| `serve-favicon`        | 2.5.1        | MIT          |
| `software-license-key` | 1.0.2        | MIT          |
| `uuid`                 | 13.0.0       | MIT          |

### 17.6.3. DNS Server 

| Third-Party Package | Used Version | License |
| ------------------- | ------------ | ------- |
| `dnsmasq`           | 2.7.0        | GPL     |

### 17.6.4. UI Server

| Third-Party Package        | Used Version | License      |
| -------------------------- | ------------ | ------------ |
| `dayjs`                    | 1.11.18      | MIT          |
| `dotenv`                   | 17.2.3       | BSD-2-Clause |
| `ejs`                      | 3.1.10       | Apache-2.0   |
| `express`                  | 5.1.0        | MIT          |
| `express-cache-controller` | 1.1.0        | MIT          |
| `morgan`                   | 1.10.1       | MIT          |
| `serve-favicon`            | 2.5.1        | MIT          |
| `uuid`                     | 13.0.0       | MIT          |


### 17.6.5. Predict Service

| Third-Party Package | Used Version | License      |
| ------------------- | ------------ | ------------ |
| `dotenv`            | 17.2.3       | BSD-2-Clause |
| `uuid`              | 13.0.0       | MIT          |


### 17.6.6. Alert Service

| Third-Party Package | Used Version | License      |
| ------------------- | ------------ | ------------ |
| `dotenv`            | 17.2.3       | BSD-2-Clause |
| `kafkajs`           | 2.2.4        | MIT          |
| `node-cron`         | 4.2.1        | ISC          |
| `nodemailer`        | 7.0.9        | MIT-0        |
| `uuid`              | 11.0.5       | MIT          |

### 17.6.7. Fetch Service

| Third-Party Package | Used Version | License                 |
| ------------------- | ------------ | ----------------------- |
| `dotenv`            | 17.2.3       | BSD-2-Clause            |
| `glob`              | 11.0.3       | ISC                     |
| `mysql2`            | 3.15.3       | MIT                     |
| `node-cron`         | 4.2.1        | ISC                     |
| `oracledb`          | 6.10.0       | Apache-2.0 OR UPL-1.0   |
| `uuid`              | 13.0.0       | MIT                     |


### 17.6.8. License Generator

| Third-Party Package    | Used Version | License      |
| ---------------------- | ------------ | ------------ |
| `dotenv`               | 17.2.3       | BSD-2-Clause |
| `js-base64`            | 3.7.8        | BSD-3-Clause |
| `software-license-key` | 1.0.2        | MIT          |
| `yargs`                | 18.0.0       | MIT          |

## 17.7. Development Tooling - EchoAPI

EchoAPI, much like PostMan and others, is a suite of API development tools with features for API design, debugging, testing, and documentation generation, available as a standalone application and extensions for platforms like VS Code, IntelliJ IDEA, and a Chrome extension.

NI itself does not require nor use EchoAPI, but a collection of NI OpenAPIs has been provided, and the [export](docs/EchoApi/ni.json) can be imported and used.

> **Note:**
> - Online help is available on the EchoAPI [product help pages](https://www.echoapi.com/wiki/docs/introduction)

---

# 18. NI OpenAPIs

Are automatically included into the API Server release and made available both via API (`/ni/v1/api`) and also the NI User Interface (`https://{host}.{domain}:4443/ni/openapi`).

The NI OpenAPIs are available in multple formats including:
- [HTML](docs/api/ni.html)
- [JSON](api/ni.json)
- [YAML](api/ni.yaml)

> **Note:** During deployment of NI API Server, the YAML definitions are updated to reflect the host and domain names hosting it, before a JSON variant is produced and also stored.

---

# 19. NI User Interface (UI)

The NI UI is loosely based on a tab design and includes:

## 19.1. Login

A typical login page is shown.

Login credentias are validated through the NI API Server (`/ni/v1/login`) to the Identity and Access Management (IAM) server and if successful, the client is redirected to the readiness page.

The NI API Server makes uses of the included Identity and Access Management (IAM) server, powered by KeyCloak, to perform authentication.

> **Note:** 
- KeyCloak can be swapped for any other OAuth2.0/OpenID Connect platform and NI configured through the environment configuration file, specifically `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET` and `OAUTH_DISCOVERY_URL`.
- If the Login page displays the OpenID Connect logo, then NI has been configured for OAuth2.0/OpenID Connect; if not then authentication for users has been effectively **disabled**

## 19.2. Readiness

The readiness page is a transition page, where by the client itself performs a NI API Readiness check through the API Gateway before automatically moving to the Dashboard

> **Note**:
> - if after 10 attempts, the client is not able to verify readiness, the client is redirected back to the login page.

## 19.3. Country Selector

Most pages contain the ability to filter resources by a specificed country.

> **Note:**
> - the default country code (e.g. `GBR`) can be changed to another during installation or through the NI OpenAPIs
> - the displayed list of country codes depends on what resources exist, for example if a resource existed in `ESP` then both `GBR`, the default, and `ESP` would be in the drop down list


## 19.4. Dashboard

The resource dashboard reflects the quantity of data available within NI. The shown stacked chart represents the total number of a specific resource but split into active (green) and inactive (orange) as a percentage. It also provides business summary of the resource assets presented in the default country/locale, for example:

`BEL` Belgium
```text
Premises Passed: 78 | Trench Coverage: 2Mm | Cable Coverage: 0m
Costs: (Euro)  Cables €40,382 | Ducts €57,950 | Poles €1,170 | NE €34,449.61 | Racks €21,996 | Services €0 | Sites €158,000 | Trenches €101,187,243.55
```

`GBR` United Kingdom
```text
Premises Passed: 13 | Trench Coverage: 742.55m | Cable Coverage: 0m
 Costs: (Sterling)  Cables £132 | Ducts £300 | Poles £270 | NE £34,449.61 | Racks £1,476 | Services £0 | Sites £123,000 | Trenches £37,127.50
```

> **Note:**
> - the dashboard when displayed within the browser, automatically refreshes every 5 minutes

## 19.5. Cables

Attempts to provide a graphical representation of any selected cable incarnation. Supported cable types include:

- Copper
- Coax
- Ethernet
- Fiber
  - Single (multiple strands)
  - Multi (multiple ribbons, each containing multiple strands)

### 19.5.1. Common

- Reference and identifier
- Source:
  - `historical`
  - `predicted`
- Location of cable (duct, pole etc.) all of which can be navigated
- Usage summary:
  - Number of marked as `faulty`
  - Number of marked as `reserved`
  - Number of marked as `used`
  - Number of marked as `free`

> **Note:**
> - in the case of fiber, each ribbon and strand is visualised with its usage shown
> - when the incarnation of the resource is `predicted`, the outer border of the resource will be `yellow` in color

### 19.5.2. Coax

- Includes the frequency range of the coax cable and the number of channels that may be operated over it

### 19.5.3. Copper

- Includes the number of twisted pairs that make up the copper cable

### 19.5.4. Ethernet

`ethernet`, while actually a copper cable, is treated as its own cable type due to have fixed use and fixed number of twisted pairs within

- Includes the category supported by the cable:
  - `Cat3`
  - `Cat4`
  - `Cat5`
  - `Cat5e`
  - `Cat6`
  - `Cat6A`
  - `Cat7`
  - `Cat8`
- If originally supplied, includes the maximum supported transmission speed of the cable

### 19.5.5. Fiber

- Includes the supported optical mode of the cable, either single-mode `SMOF` or multi-mode `MMOF`

#### 19.5.5.1. Single-Fiber

- Includes the number strands

#### 19.5.5.2. Multi-Fiber

- Includes the number of ribbons
- Includes the number of strands *per* ribbon

## 19.6. Ducts

Attempts to provide a graphical representation of any selected cable incarnation. Supported duct types include:

- `duct`
- `sub-duct`

- Reference and identifier
- Source:
  - `historical`
  - `predicted`
- Purpose of the duct:
  - `gas`
  - `power`
  - `cable`
  - `water`
- Location of duct (duct or trench), all of which can be navigated
- Configuration of duct 1/2/3/5/6/7/8/10/12/14/19/24-way up to 48-way
- List of the contained cables within the duct, all of which can be navigated
- Usage summary:
  - Number of marked as `faulty`
  - Number of marked as `reserved`
  - Number of marked as `used`
  - Number of marked as `free`

> **Note:**
> - in the case of fiber, each strand is visualised with its own usage shown
> - when the incarnation of the resource is `predicted`, the outer border of the resource will be `yellow` in color

## 19.7. Poles

Attempts to provide a graphical representation of selected utility pole over a geographic terrain.

If supplied or derieved, the height and area type classifier of the pole will be shown. The classifier would be one of:

- `residential`
- `rural`
- `industrial`
- `mixed` - combination of residential/industrial/commercial.
- `psz` - Public Safety Zone
- `urban` 
- `unclassified` - not recorded or known
- `utility` - public service building, i.e. hospital, school

> **Note:**
> - Selected pole identifier appears as tooltip
> - Zoom In/Out via mouse-wheel, scroll by dragging terrain map
> - Right-clicking on the shown pole icon would display list of any connected trenches (navigatable)
> - Left-clicking on the shown pole icon would display list of any connected sites (navigatabe)

## 19.8. Network Eqiupment

Attempts to provide a graphical representation of any selected network equipment in a friendly vendor-agnostic fashion.

> **Note:** 
> - network equipment types are constrained by the supplied data
> - if costing is to be applied, a cost should added via the NI API Server to match the vendor and model of the equipment:
>   - Vendor `Cisco Systems, Inc.`
>   - Model `C8300-1N1S-4T2X`
>   - Cost  `7199.61`
> - The cost does not include a currency as it will default to the system configurated default locale.

- Graphic representation of each data port contained within this network equipment, each box will show:
  - port number (tooltip for interface name)
  - port status:
    - Number of marked as `faulty`
    - Number of marked as `reserved`
    - Number of marked as `used`
    - Number of marked as `free`
  - port transmission speed (tooltip)
  - error count of the port (tooltip)
  - error indicator:
    - `tick`: 0 errors
    - `exclamation`: between 1 and 99 errors
    - `cross`: 100 or more errors
- Reference and identifier
- Source:
  - `historical`
  - `predicted`
- When it was commissioned
- Optionally, when it was decomissioned
- Management IP Address
- Vendor
- Model
- Running software (firmware) image
- Version of running software (firmware) image
- Location based on a sepecified site, rack and rack slot(s)
- Common vulnerabilities and Exposures (CVE) summary:
  - Number of CVEs that would **impact** this vendor model equipment running the known software (firmware) image
  - Number of CVEs that are known against this vendor model equipment running the known software (firmware) image
- Usage summary:
  - Number of ports marked as `faulty`
  - Number of ports marked as `reserved`
  - Number of ports marked as `used`
  - Number of ports marked as `free`
  - Total number of errors reported against this network equipment
> **Note:**
> - Out-of-band and other connectivity ports not used for data are not included
> - CVE information will only be matched and displayed if enabled through NI Fetch Service
> - when the incarnation of the resource is `predicted`, the outer border of the resource will be `yellow` in color
> - Like a Configuration Management Database (CMDB), NI includes the ability and hold and store the network equipment configuration (any textual format) for the specific incarnation of the network equipment 

## 19.9. Racks

Attempts to provide a graphical representation of any selected role in a agnostic fashion.

> **Note:** 
> - network equipment types are constrained by the supplied data
> - if costing is to be applied, a cost should added via the NI API Server to match the number of slots:
>   - Slots: `12`
>   - Cost:  `120`
> - The cost does not include a currency as it will default to the system configurated default locale.

- Graphic representation of each slot contained within this rack, each slot will be shown:
  - Usage status:
    - Number of marked as `faulty`
    - Number of marked as `reserved`
    - Number of marked as `used`
    - Number of marked as `free`
  - If any network equipment is defined against this slot, it will be listed and navigatable
- Reference and identifier
- Source:
  - `historical`
  - `predicted`
- When it was commissioned
- Optionally, when it was decomissioned
- Dimensions (in units originally specified i.e. `cm`,`mm`,`m`,`km`,`Mm`,`inch`,`feet`)
  - Height
  - Weight
  - Depth
- Location based on a sepecified site, floor, row and coordinates
> **Note:**
> - when the incarnation of the resource is `predicted`, the outer border of the resource will be `yellow` in color

## 19.10. Sites

Attempts to provide a graphical representation of selected site over a geographic terrain.

> **Note:**
> - NI supports `on-net` and `off-net` sites
> - a toggle is included to change what sites are available to be visualised

If supplied or derieved, the site area and type classifiers will be shown. The area classifier would be one of:
- `residential`
- `rural`
- `industrial`
- `mixed` - combination of residential/industrial/commercial.
- `psz` - Public Safety Zone
- `urban` 
- `unclassified` - not recorded or known
- `utility` - public service building, i.e. hospital, school

The site type classifier would be one of:
- `adu` - accessory dwelling units 
- `colo` - colocation
- `commercial` - place of work, retail unit etc.
- `dc` - data center
- `exchange` - district/town exchange building etc.
- `mdu` - multi-dwelling unit
- `pop` - point of presence
- `sdu` - single dwelling unit
- `street` - various street furniture options
- `unclassified` - not recorded or known

> **Note:**
> - Selected site identifier appears as tooltip
> - Zoom In/Out via mouse-wheel, scroll by dragging terrain map
> - Right-clicking on the shown pole icon would display list of any connected trenches (navigatable)
> - Left-clicking on the shown pole icon would display list of any connected poles (navigatabe)
> - Additional `off-net` sites can be loading during installation, added via NI OpenAPIs or NI Fetch used to retrieve from a third-party
>   - Using additional site data allows further complex predictions to occur

## 19.11. Services

Attempts to provide a graphical representation of selected service, including ingress/egress ports on which network equipment.

> **Note:** incomplete

## 19.12. Trenches


### 19.12.1. Detail

Attempts to provide a graphical representation of selected trench over a geographic terrain.

If supplied or derieved, the total length, number of premises passed (calculated) will be shown.

> **Note:**
> - Selected trench identifier appears as tooltip
> - Zoom In/Out via mouse-wheel, scroll by dragging terrain map
> - Right-clicking on the shown pole icon would display list of any connected ducts (navigatable)
> - Left-clicking on the shown pole icon would display list of any connected poles (navigatabe)

### 19.12.2. Lifetime

Attempts to provide a graphical representation of selected trench over a geographic terrain for its entire lifetime

If supplied or derieved, the total length, number of premises passed (calculated) will be shown.

> **Note:**
> - Selected trench identifier appears as tooltip
> - Zoom In/Out via mouse-wheel, scroll by dragging terrain map
> - When the incarnation of the resource is `predicted`, the predicted parts of the trench will be shown as a yellow dashed line
> - Not implemented: Right-clicking on the shown pole icon would display list of any connected ducts (navigatable)
> - Not fully implemented: Left-clicking on the shown pole icon would display list of any connected poles (navigatabe)

### 19.12.3. Per Country

Attempts to provide a graphical representation of all trenches defined against a specific country over a geographic terrain.

If supplied or derieved, the total length, number of premises passed (calculated) will be shown.

> **Note:**
> - Selected trench identifier appears as tooltip
> - Zoom In/Out via mouse-wheel, scroll by dragging terrain map
> - Right-clicking on the shown pole icon would display list of any connected ducts (navigatable)
> - Left-clicking on the shown pole icon would display list of any connected poles (navigatabe)

## 19.13. Quote-to-Cash (Q2C)

Attempts to provide a graphical canvas that allows a new trench path to drawn. Select existing trench to navigate to intended build area.

Costs exist to provide high level cost quotes for different trenches uses, these include:
- `service/drop` to support typical cabing for site/endpoint connection
- `ring` to support typical cabling used in metro rings
- `backhaul` to support typical cabling used in backhaul purposes
- `pole` to suport typical cabling required for a utility pole
- `tower` to support typical cabling required for a cell tower
- `unclassified`

> **Note:**
> - The selected currency can be changed at any time, click on the calculator icon if you change the selected currency
> - The intended purpose of the trench can be changed at any time, click on the calcultor if you change the intended purpose
> - The trash can icon can clear any previously drawn trench
> - The save icon will only appear once the calculation has been performed but currently does nothing else
> - The Forward icon will only appear once the calculation has been performed and will export the drawn trench and additional NI attributes to the client browser, the export will be:
>   - `KML` formatted
>   - Have a filename of `ni-{new trench UUIDv4}.kml`
>   - Can be verified by importing into Google Earth:
>     - Open the Google Earth app on your computer or browser [Google Earth](https://earth.google.com)
>     - For a new: and click Open Local KML file > Import file to project.
>     - For an existing project: Go to the home screen, click the project you want to import to, and then click File > Import file to {Project name}.
>     - Choose the NI exported file and Click Upload from device to select a file from your computer
>     - Select the KML file you want to import. It will automatically be displayed 
> - Right-clicking will removed the last added point from the trench path
> - Left-clicking will add each the selected point as the trench path
> - Zoom In/Out via mouse-wheel, scroll by dragging terrain map

## 19.14. Providers

The provider dashboard reflects the number and type of providers available within NI.

The provider dashboard sub icon bar will now make available further detailed provider pages for:
- Email
- Map
- Publish (Kafka)
- Workflow Engines

### 19.14.1. Email

Allows providers to be added, modified and deleted and only supports SMTP gateways.

### 19.14.2. Map

Allows providers to be added, modified and deleted.

### 19.14.3. Kafka

Allows Kafka buses to be added, modified and deleted.

### 19.14.4. Workflow Engines

Allows workflow engines to be added, modified and deleted and only suppots Camunda (BPMN) and ELSA endpoints.

## 19.15. Alerts

The alerts dashboard reflects the number and type of defined alert capabilities available within NI.

The alerts dashboard sub icon bar will now make available further detailed pages showing active alerts for:
- Callback
- Publish (Kafa)
- Email
- Workflow

> **Note:** UI aspects have not been implemented

## 19.16. Settings

The settings page allows the `historical` and `predicted` durations to be managed, refer to [21.2. Data Longevity](#212-data-longevity) for further details.

## 19.17. OpenAPIs

The embedded Swagger Editor, from the vendor [Smartbear](https://swagger.io/tools/swagger-editor/) allows users and developers to interactively make use of the included NI Open APIs. The Open API definition is loaded from the NI API Server and once any authenication has occured makes all APIs available.

> **Note:** 
> - due to SSL Certificates issues within the Integration Lab, most clients will have to had previously accepted (trusted) the certificates used by CCUK.
> - Perform a [HTTP GET /api/readiness](https://192.168.111.6:8443/ni/v1/api/readiness) in a separate browser tab and explicitly accept the certificates prior to proceeding to continue
> - At this point you should receive a JSON response with a timestamp indicating that NI API Server is accepting connections
> ```json
> {"point":"20251121T152211"}
> ```

## 19.18. Help/About

Currently lists the included third-party JavaScript libraries.

## 19.19. Quit (Logout)

While there is not an actual page for this, the client performs a logout through the NI API Server (`/ni/v1/logout`) and any cached authentication data is removed.

The client is then redirected to the login page.

---

# 20. NI API Server Internals

## 20.1. Database

NI API Server does not include a traditional time-series database (`TSDB`) and instead implements a time-series layer over an generic high performance analytical database engine, **DuckDB**.

- Versioning, Deltas & Time Management

So you are referring to the time-series data, again this is in the readme and been covered many times including the fact we do not use on-the-shelf time-series database here

> How are deltas detected between time slices?

There are no time slices, no forced snapshots, no duplication of data to force a time perspective, there is just time and when a resource is created, updated and even deleted (but never removed) that is recorded by means of literally creating a new incarnation of it - in the readme file you will see this listed as “Shadow Time-Series Tables”. The resource identifier is separate from the resource detail, for example a trench, the trench id is what everything else interacts with, but the shadow table holds the detail of what/where (etc.) the trench is

> How does NI store snapshots of moments in time?

There are no snapshots, no moments in time, think of it the other way around, there is the resource and something happens to it over its lifetime, when something happens, and importantly, NI is informed or fetches the change, then something is updated.

> Does each time slice contain a complete record, or are only deltas stored?

The changed resource detail is held as new incarnation, the resource identifier is still the same single thing. For example, if you extended an existing trench, the trench resource detail include the new incarnations, the extra bit of trench and the existing trench, which are timestamped.  For performance reasons the new incarnation is complete. When you just update a resource, e.g. network equipment port is used, you literally send in the network equipment identifier with port identifier and its new usage state (i.e. used), NI itself takes the entire latest incarnation is knows, applies the change as a difference and then stores the result. This helps for performance and other logic

> How does NI handle the very large data volumes if regular snapshots (e.g., daily) of the full network are taken?

The system in the integration lab contains data from about 12 countries, 2 mega metres of trenches , costs and other stuff. The database is currently standing at 100Megabytes (yes Mb not Gb nor Tb). The NI APIs were designed to hold just the data that is required and this answers the next part of this question NI does not like Wyre Snowflake (and others?) literally extract and store **all** data every 24 hours to get fake a time-series but it just stores data WHEN it changes. So if a site is defined and nothing happens to it then it only ever exists once in time, **not** duplicated once per 24 hours etc. See below on more comments on the TSDB

A typical TSDB, like SnowFlake, extracts everything on a reoccurring basis and stores it. It then tries to work out what changed but generally just uses it to determine statistics, i.e. number of connections made in last 7 days. With NI if you want to know about something call the API (or use the API), the API will return the last known change regardless of when and when there are multiple changes over the resource lifetime then you can specify the “point” in time to get the previous, current or predict incarnation of the resource. Take a rack, when its installed on a site, it starts empty, over time the rack slots are filled, when the rack eventually becomes full (no spare slots), it is either replaced with a new different bigger rack or additional racks are added. NI allows you to literally scroll through the lifetime of that specific rack usage changes, it is stored once and only ever once as it is the same physical rack, the changes (so the detail) is what is extended (or duplicated if that is easier to understand) over time. Where something refers to the rack, it refers to the single rack and not the rack detail.

The design rationale behind this was to allow the used database technology to be replaced at a later date or to meet specific deployment requirements without requiring any other architectural or API changes - this is referred to as **loosely-coupled** APIs.

> **Note:**
> - See [Why DuckDB](https://duckdb.org/why_duckdb) for details
> - Any potential alternative database technology **must** include support for NodeJS/JavaScrpt
> - NI API Server also makes use of the following DuckDB extensions:
>   - [Spatial Extension](https://github.com/duckdb/duckdb-spatial/blob/main/docs/example.md)

## 20.2. Geometry

NI API Server geometries are represented using geometric constructs defined as lists of one or more two-dimensional `XY`, or three-dimensional `XYZ` points, rather than other GIS Well-Known Text (`WKT`) geometric point systems. Support for two or three dimensional geometries is dependant on the specific need of each of the NI OpenAPIs:

- `X` (longitude) typically a float value, is measured along east-west axis with a range of `-180` to `+180` with scale `3` and precision `6`
- `Y` (latitude) typically a float value, is measured along north-south axis with a range of `-90` to `+90` with scale `2` and precision `6`
- `Z` (altitude) typically a float value,is measured height or elevation, scale `8` and precision `2`
- `M` typically a string value, is extra axis of information not associated with the cartesian x/y/z space

> **Note:**
> - as long as the use of these values is consistent, NI does not itself impose further restrictions or conditions but care should be taken with any implemented Map provider.

Some of the NI OpenAPIs include the option to supply `WKT` geometries instead, if supplied these are converted to the above system during processing

> **Note:** 
> - NI API Server can convert WKT points from such objects containing `LINESTRING`, `POINT`, `MULTIPOINT`
> - Supports EPSG4326 (PNI) to EPSG3857
> - GIS WKT support should be considered experimental, see `ESP` sample trench data

## 20.3. Data Longevity 

NI API Server automatically prunes data outside of a defined rolling window. This window range can be defined through the NI UI and APIs.

It covers `historical` and `predicted` data separately and be defined as a specific quantity of time:
- Number of
- Unit of duration being:
  - `second`
  - `minute`
  - `hour`
  - `day`
  - `week`
  - `month`
  - `quarter`
  - `year`

By default the rolling window is constructed from the current date and time with +/- of:
- `historical` 1 `year`
- `predicted` 6 `month`

> **Note:** 
> - any `historical` data older than the start of the rolling window is removed
> - any `predicted` data newer then the end of the rolling window is removed
> - any `predicted` data earlier than the last piece of `historical` data is removed
> - any and all `planned` data is left untouched
> - data removal occurs on a configurable but frequent basis
> - a sensible unit of duration should be applied, nothing smaller a week is advised

## 20.4. Database Backup

Scheduled via the NI environment configuration file, the API Server will export the internal database to the local filesystem hosting the NI API Server. Any encrypted data, in the secret store or elsewhere is maintained as encrypted even in the export.

> **Note:** 
> - see `APISERV_BACKUP_DIRECTORY` or the API Server log file for directory selected
> - see `APISERV_DUCKDB_BACKUP_CRONTIME` for the scheduled backup time
> - see `APISERV_DUCKDB_BACKUP` for toggling backup operations
> - Above the manual import procedures provided by DuckDB itself, NI does not itself include the ability to recover from a previously generated backup

## 20.5. Tracking Changes
NI components make use of queues maintained and/or provided through the API Server. This allows for distribution of activities as well as coordination.

All write-related data operations handled by NI API Server are tracked through two queues:

1. `predictQueue`
2. `replicationQueue`

The queues record on a temporary basis, the resource type, resource identifier and the related state (CRUD). Once the respective NI components has retrieved a queue entry and processed it **successfully**, the NI component calls back through the Open API to mark the entry as complete (`delete`=`true`).

For NI Predict Service, it reads the queue through the Open APIs and examines each resource for the purpose of prediction; this can be simple duplication for such resources that only have a single incarnation (i.e. a site), simple for those with sequently incarnations (i.e. a rack slot usage) and complex for those wwith sequently incarnations across multiple intersects.

If cluster replication is enabled, any slave NI API Servers will subscribe to an encrypted multicast stream that the master NI API Servers publishes into to determine what resources have changed. 

> **Note:** while the multicast streams and role handling (`master` vs. `slave`) are implemented, the additional logic to request the change has not yet been implemented.

## 20.6. NI Fetch

In a similar fashion to tracking changes, NI Fetch Service jobs are also maintained by the API Server. The NI Fetch Service requests the list of jobs on startup and executes them on a scheduled basis. See `schema.sql` `INSERT INTO fetchJob...` for details.

The fetch job definitions include:
 - CVE Pull
 - CVE Impact List
 - Foreign Currency (FX) Currency Update
 - Importing from PNI (not implemented)
 - Importing from LNI (not implemented)

> **Note:** 
> - all fetch job tasks must exit in the NI Fetch Service prior to being supported. NI Fetch also include a no operation function (`noop`) as a default.
> - the fetch job definition can includes dynamic parameters which allows reusability.
> - any required secrets/credentials from the NI API Server secret store

## 20.7. Alert Service

In a similar fashion to tracking changes, NI Alert Service jobs are also maintained by the API Server. The NI Alert Service requests the list of jobs on startup and executes them on a scheduled basis. See `schema.sql` `INSERT INTO alert...` for details.

The purpose of NI Alert Service is to perform analysis on resources and if action is required to generate a notification than can be subsequently despatched through one or more multiple channels to the intended receipient.

> **Note:** 
> - all alert job tasks must exit in the NI Alert Service prior to being supported - this should at least be a *stub* function.
> - NI Alert also include a no operation function (`noop`) as a default.
> - the alert job definition can include dynamic parameters which allows reusability.
> - any required secrets/credentials from the NI API Server secret store

---

# 21. NI Alert Internals

NI Alert retrieves its list of jobs from the NI API Server using the `/alert` APIs.

> **Note:** 
> - NI Alert is therefore data driven

# 22. NI Fetch Internals

NI Fetch retrieves its list of jobs from the NI API Server using the `/fetch` APIs.

> **Note:** 
> - NI Fetch is therefore data driven

# 23. NI Predict Internals

## 23.1. Duplication

Where resources only exist with a single incarnation, NI simply produces a duplicate of the resource with the predicted marker and passes it back to NI API Server for storage, as NI can not predict any changes without external influence.

## 23.2. Simple Prediction

Where resources exist with multiple incarnations, such as rack slots, cables, network equipment ports, ducts, the resource is treated with simple prediction with regards to usage.

The historical state/usage of the resource is taken into consideration for what the predictive change will be:

```mermaid
stateDiagram-v2
    [*] --> free
    faulty --> used
    faulty --> free
    free --> used
    free --> reserved
    free --> faulty
    used --> free
    used --> faulty
    reserved --> free
    reserved --> used
```

For example, the probability a `faulty` state would transition to `reserved` without first transisting to `free` is low in comparison to the other possibilities.

For the mathematical prediction to occur, the state/usage is converted to a numeric value between 0 and 1 to allow for Machine Learning (ML) practices to be followed and once the predicted value has been determined, transformed back to the original format representing the state/usage.

## 23.3. Complex Prediction

It expected to build upon the simple prediction by means of utilising Long Short-Term Memory (LSTM) networks.

LSTM networks are a powerful type of recurrent neural network (RNN) specifically designed for time series prediction because they can learn and remember patterns over long sequences of data. This ability helps them overcome the vanishing gradient problem that traditional RNNs face, allowing them to capture complex, non-linear dependencies in historical data. 

An LSTM network's core is the memory cell, which acts as a long-term storage unit for information, and several "gates" that regulate what information is stored, updated, or output at each time step. 
- Forget Gate: Decides which information from the previous cell state is no longer relevant and should be discarded. A value close to 0 means "forget completely," while a value near 1 means "keep entirely".
- Input Gate: Determines which new information from the current input is important and should be added to the cell state. This helps the network decide what new data points are significant enough to be remembered.
- Output Gate: Controls which parts of the current cell state are exposed as the output (or hidden state) at the current time step. This filtered information is used to make predictions and passed to the next unit.
- Cell State: The "memory" that runs through the entire sequence, selectively updated by the gates at each step to carry relevant information forward across potentially long time intervals. 

![](docs/concept/LSTM_Cell.svg)

### 23.3.1. Advantages for Time Series Prediction

- Captures Long-Term Dependencies: LSTMs are effective in scenarios where events in the distant past influence future outcomes, a key challenge for traditional models like ARIMA.
- Handles Non-Linearity: They can model complex, non-linear relationships and patterns often found in real-world time series data (e.g., financial markets, weather data).
- Learns from Raw Data: LSTMs automatically extract relevant features from raw sequential data, reducing the need for manual feature engineering and data stationarity requirements (as is needed with ARIMA models).
- Robustness: They are relatively robust to noise and irregularities in data due to their gating mechanisms which help filter out irrelevant information. 

# 24. NI User Interface Internals

## 24.1. Distribution Directories

NI UI will dynamically detect and expose contained directories within the UI content

## 24.2. Metadata

Via the UI Server `/metadata` URL, additional metadata is passed to the client for caching. This includes:

- build: NI build number
- country: NI default country
- currency ISO Code: NI default country currency code
- currency Name: NI default country currency name
- currency Symbol: NI defualt country currency symbol
- gateway URL: NI API Gateway URL
- icon: NI User Interface favourite icon filename
- name: NI application name
- notificaton Icon: NI User Interface notification icon filename
- readiness Attempts: NI configured number of attempts for readiness checks
- refresh Ms: NI configured refresh delay in milliseconds
- retry Ms: NI configured general client refresh delay in milliseconds
- root URL: NI User Interface root URL
- short Name: NI short application name
- version: NI version number

> **Note:** 
> - the above allows for dynamic rebranding of the NI UI to happen if required

---

# 25. CCUK Technical Services

For technical support, you can contact CCUK by email, or on the web.

## 25.1. By email

Customer Service Management may be reached at: [support@cowdrey.net](mailto:support@cowdrey.net).

## 25.2. On the web

Please visit [support.cowdrey.net](https://support.cowdrey.net/). To obtain access, you must provide your support contracted email address.

## 25.3. Technical documentation

The latest technical documentation for products is now available on the [Customer Service Management](https://support.cowdrey.net/).
Make sure you have an account to access the content. 


---

# 26. Corporate Headquarters

Cowdrey Consulting · United Kingdom<br>
[+447773281821 ](tel:+447773281821 )<br>
[www.cowdrey.net](https://www.cowdrey.net)<br>
**Network Insight (NI) © 2026 Cowdrey Consulting**

```text
    _   __     __                      __      ____           _       __    __ 
   / | / /__  / /__      ______  _____/ /__   /  _/___  _____(_)___ _/ /_  / /_
  /  |/ / _ \/ __/ | /| / / __ \/ ___/ //_/   / // __ \/ ___/ / __ `/ __ \/ __/
 / /|  /  __/ /_ | |/ |/ / /_/ / /  / ,<    _/ // / / (__  ) / /_/ / / / / /_  
/_/ |_/\___/\__/ |__/|__/\____/_/  /_/|_|  /___/_/ /_/____/_/\__, /_/ /_/\__/  
                                                            /____/             
```