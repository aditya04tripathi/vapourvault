# VaporVault 🌫️🔒

> **Anonymous. Ephemeral. Secure.**
> High-performance file storage API with automatic 24-hour self-destruction.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-green.svg)
![Stack](https://img.shields.io/badge/stack-NestJS%20|%20PostgreSQL%20|%20MinIO%20|%20Redis-purple.svg)

VaporVault is a robust, enterprise-grade backend service designed for secure, temporary file sharing. It completely eliminates the friction of user accounts, providing a seamless "drop and share" experience while ensuring digital hygiene through automated data purging.

**[View Formal Software Requirements Specification (SRS)](./SRS.md)** | **[View Deployment Guide](./DEPLOYMENT.md)**

---

## ⚡ Key Features

- **🚫 Zero Friction**: No sign-ups, no logins, no passwords. Purely anonymous.
- **⏱️ Ephemeral by Design**: 24-hour Time-To-Live (TTL). Files vanish automatically.
- **🛡️ Secure Storage**: S3-compatible storage (MinIO) with pre-signed URL access control.
- **🚀 Asynchronous Processing**: BullMQ & Redis powered job queues for non-blocking performance.
- **🐳 Cloud Native**: Fully containerized with Docker for instant deployment.

---

## 🏗️ System Architecture

VaporVault utilizes a modular, microservices-ready architecture to ensure scalability and reliability.

<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="mermaid-svg" width="100%" class="flowchart" style="max-width: 1058.328125px;" viewBox="0 0 1058.328125 404.1748352050781" role="graphics-document document" aria-roledescription="flowchart-v2"><style xmlns="http://www.w3.org/1999/xhtml">@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css");</style><style>#mermaid-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#ccc;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#mermaid-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#mermaid-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#mermaid-svg .error-icon{fill:#a44141;}#mermaid-svg .error-text{fill:#ddd;stroke:#ddd;}#mermaid-svg .edge-thickness-normal{stroke-width:1px;}#mermaid-svg .edge-thickness-thick{stroke-width:3.5px;}#mermaid-svg .edge-pattern-solid{stroke-dasharray:0;}#mermaid-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#mermaid-svg .edge-pattern-dashed{stroke-dasharray:3;}#mermaid-svg .edge-pattern-dotted{stroke-dasharray:2;}#mermaid-svg .marker{fill:lightgrey;stroke:lightgrey;}#mermaid-svg .marker.cross{stroke:lightgrey;}#mermaid-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#mermaid-svg p{margin:0;}#mermaid-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#ccc;}#mermaid-svg .cluster-label text{fill:#F9FFFE;}#mermaid-svg .cluster-label span{color:#F9FFFE;}#mermaid-svg .cluster-label span p{background-color:transparent;}#mermaid-svg .label text,#mermaid-svg span{fill:#ccc;color:#ccc;}#mermaid-svg .node rect,#mermaid-svg .node circle,#mermaid-svg .node ellipse,#mermaid-svg .node polygon,#mermaid-svg .node path{fill:#1f2020;stroke:#ccc;stroke-width:1px;}#mermaid-svg .rough-node .label text,#mermaid-svg .node .label text,#mermaid-svg .image-shape .label,#mermaid-svg .icon-shape .label{text-anchor:middle;}#mermaid-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#mermaid-svg .rough-node .label,#mermaid-svg .node .label,#mermaid-svg .image-shape .label,#mermaid-svg .icon-shape .label{text-align:center;}#mermaid-svg .node.clickable{cursor:pointer;}#mermaid-svg .root .anchor path{fill:lightgrey!important;stroke-width:0;stroke:lightgrey;}#mermaid-svg .arrowheadPath{fill:lightgrey;}#mermaid-svg .edgePath .path{stroke:lightgrey;stroke-width:2.0px;}#mermaid-svg .flowchart-link{stroke:lightgrey;fill:none;}#mermaid-svg .edgeLabel{background-color:hsl(0, 0%, 34.4117647059%);text-align:center;}#mermaid-svg .edgeLabel p{background-color:hsl(0, 0%, 34.4117647059%);}#mermaid-svg .edgeLabel rect{opacity:0.5;background-color:hsl(0, 0%, 34.4117647059%);fill:hsl(0, 0%, 34.4117647059%);}#mermaid-svg .labelBkg{background-color:rgba(87.75, 87.75, 87.75, 0.5);}#mermaid-svg .cluster rect{fill:hsl(180, 1.5873015873%, 28.3529411765%);stroke:rgba(255, 255, 255, 0.25);stroke-width:1px;}#mermaid-svg .cluster text{fill:#F9FFFE;}#mermaid-svg .cluster span{color:#F9FFFE;}#mermaid-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(20, 1.5873015873%, 12.3529411765%);border:1px solid rgba(255, 255, 255, 0.25);border-radius:2px;pointer-events:none;z-index:100;}#mermaid-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#ccc;}#mermaid-svg rect.text{fill:none;stroke-width:0;}#mermaid-svg .icon-shape,#mermaid-svg .image-shape{background-color:hsl(0, 0%, 34.4117647059%);text-align:center;}#mermaid-svg .icon-shape p,#mermaid-svg .image-shape p{background-color:hsl(0, 0%, 34.4117647059%);padding:2px;}#mermaid-svg .icon-shape rect,#mermaid-svg .image-shape rect{opacity:0.5;background-color:hsl(0, 0%, 34.4117647059%);fill:hsl(0, 0%, 34.4117647059%);}#mermaid-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#mermaid-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#mermaid-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="mermaid-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="mermaid-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="mermaid-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="mermaid-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="mermaid-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="mermaid-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"><g class="cluster " id="subGraph0" data-look="classic"><rect style="" x="251.515625" y="136" width="798.8125" height="260.1748275756836"/><g class="cluster-label " transform="translate(575.328125, 136)"><foreignObject width="151.1875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel "><p>Background Services</p></span></div></foreignObject></g></g></g><g class="edgePaths"><path d="M112.258,62L112.258,68.167C112.258,74.333,112.258,86.667,112.258,99C112.258,111.333,112.258,123.667,112.258,133.333C112.258,143,112.258,150,112.258,153.5L112.258,157" id="L_Client_API_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Client_API_0" data-points="W3sieCI6MTEyLjI1NzgxMjUsInkiOjYyfSx7IngiOjExMi4yNTc4MTI1LCJ5Ijo5OX0seyJ4IjoxMTIuMjU3ODEyNSwieSI6MTM2fSx7IngiOjExMi4yNTc4MTI1LCJ5IjoxNjF9XQ==" marker-end="url(#mermaid-svg_flowchart-v2-pointEnd)"/><path d="M207.531,215L229.291,221.167C251.05,227.333,294.57,239.667,320.488,251.617C346.406,263.567,354.721,275.135,358.879,280.919L363.037,286.702" id="L_API_DB_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_API_DB_0" data-points="W3sieCI6MjA3LjUzMDcwMDY4MzU5Mzc1LCJ5IjoyMTV9LHsieCI6MzM4LjA4OTg0Mzc1LCJ5IjoyNTJ9LHsieCI6MzY1LjM3MTk2OTI3NjUwNDUsInkiOjI4OS45NTAwNTExMjA3NTI3M31d" marker-end="url(#mermaid-svg_flowchart-v2-pointEnd)"/><path d="M216.516,202.317L276.816,210.597C337.117,218.878,457.719,235.439,524.057,251.702C590.395,267.966,602.47,283.931,608.508,291.914L614.546,299.897" id="L_API_Storage_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_API_Storage_0" data-points="W3sieCI6MjE2LjUxNTYyNSwieSI6MjAyLjMxNjc0OTM2MzAxNDYyfSx7IngiOjU3OC4zMjAzMTI1LCJ5IjoyNTJ9LHsieCI6NjE2Ljk1ODQzMTg4Nzk5MzcsInkiOjMwMy4wODc0MTM3ODc4NDE4fV0=" marker-end="url(#mermaid-svg_flowchart-v2-pointEnd)"/><path d="M216.516,197.578L315.243,206.649C413.97,215.719,611.424,233.859,716.51,250.923C821.595,267.986,834.312,283.971,840.67,291.964L847.028,299.957" id="L_API_Queue_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_API_Queue_0" data-points="W3sieCI6MjE2LjUxNTYyNSwieSI6MTk3LjU3ODM3Nzc3MjE3MDM0fSx7IngiOjgwOC44Nzg5MDYyNSwieSI6MjUyfSx7IngiOjg0OS41MTgwNjA1OTI3MzkzLCJ5IjozMDMuMDg3NDEzNzg3ODQxOH1d" marker-end="url(#mermaid-svg_flowchart-v2-pointEnd)"/><path d="M921.461,215L921.461,221.167C921.461,227.333,921.461,239.667,916.32,253.788C911.179,267.909,900.898,283.819,895.757,291.773L890.616,299.728" id="L_Worker_Queue_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Worker_Queue_0" data-points="W3sieCI6OTIxLjQ2MDkzNzUsInkiOjIxNX0seyJ4Ijo5MjEuNDYwOTM3NSwieSI6MjUyfSx7IngiOjg4OC40NDUxMzg1NDY3OTYsInkiOjMwMy4wODc0MTM3ODc4NDE4fV0=" marker-end="url(#mermaid-svg_flowchart-v2-pointEnd)"/><path d="M524.596,215L512.951,221.167C501.306,227.333,478.016,239.667,462.103,251.63C446.189,263.593,437.652,275.187,433.383,280.984L429.115,286.78" id="L_Cleaner_DB_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Cleaner_DB_0" data-points="W3sieCI6NTI0LjU5NjEzMDM3MTA5MzgsInkiOjIxNX0seyJ4Ijo0NTQuNzI2NTYyNSwieSI6MjUyfSx7IngiOjQyNi43NDI5NDk0ODUzOTg4LCJ5IjoyOTAuMDAxMzgyMDk4Njg5NjV9XQ==" marker-end="url(#mermaid-svg_flowchart-v2-pointEnd)"/><path d="M627.858,215L639.798,221.167C651.738,227.333,675.617,239.667,681.198,253.826C686.78,267.986,674.063,283.971,667.705,291.964L661.347,299.957" id="L_Cleaner_Storage_0" class=" edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Cleaner_Storage_0" data-points="W3sieCI6NjI3Ljg1ODI3NjM2NzE4NzUsInkiOjIxNX0seyJ4Ijo2OTkuNDk2MDkzNzUsInkiOjI1Mn0seyJ4Ijo2NTguODU2OTM5NDA3MjYwNywieSI6MzAzLjA4NzQxMzc4Nzg0MTh9XQ==" marker-end="url(#mermaid-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel" transform="translate(112.2578125, 99)"><g class="label" data-id="L_Client_API_0" transform="translate(-36.75, -12)"><foreignObject width="73.5" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel "><p>POST File</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(338.08984375, 252)"><g class="label" data-id="L_API_DB_0" transform="translate(-33.359375, -12)"><foreignObject width="66.71875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel "><p>Metadata</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(578.3203125, 252)"><g class="label" data-id="L_API_Storage_0" transform="translate(-41.796875, -12)"><foreignObject width="83.59375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel "><p>Binary Data</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(545.20033, 227.77531)"><g class="label" data-id="L_API_Queue_0" transform="translate(-36.90625, -12)"><foreignObject width="73.8125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel "><p>Async Job</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(921.4609375, 252)"><g class="label" data-id="L_Worker_Queue_0" transform="translate(-44.0234375, -12)"><foreignObject width="88.046875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel "><p>Process Job</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(454.7265625, 252)"><g class="label" data-id="L_Cleaner_DB_0" transform="translate(-61.796875, -12)"><foreignObject width="123.59375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel "><p>Cron: Every Hour</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(692.67748, 248.47828)"><g class="label" data-id="L_Cleaner_Storage_0" transform="translate(-52.4765625, -12)"><foreignObject width="104.953125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel "><p>Delete Expired</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default  " id="flowchart-Client-0" transform="translate(112.2578125, 35)"><rect class="basic label-container" style="" x="-90.03125" y="-27" width="180.0625" height="54"/><g class="label" style="" transform="translate(-60.03125, -12)"><rect/><foreignObject width="120.0625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel "><p>Client App / User</p></span></div></foreignObject></g></g><g class="node default  " id="flowchart-API-1" transform="translate(112.2578125, 188)"><rect class="basic label-container" style="" x="-104.2578125" y="-27" width="208.515625" height="54"/><g class="label" style="" transform="translate(-74.2578125, -12)"><rect/><foreignObject width="148.515625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel "><p>NestJS API Gateway</p></span></div></foreignObject></g></g><g class="node default  " id="flowchart-DB-3" transform="translate(395.66796875, 330.0874137878418)"><path d="M0,14.391608762531162 a84.7890625,14.391608762531162 0,0,0 169.578125,0 a84.7890625,14.391608762531162 0,0,0 -169.578125,0 l0,53.39160876253116 a84.7890625,14.391608762531162 0,0,0 169.578125,0 l0,-53.39160876253116" class="basic label-container" style="" label-offset-y="14.391608762531162" transform="translate(-84.7890625, -41.087413143796745)"/><g class="label" style="" transform="translate(-77.2890625, -2)"><rect/><foreignObject width="154.578125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel "><p>PostgreSQL + Prisma</p></span></div></foreignObject></g></g><g class="node default  " id="flowchart-Storage-5" transform="translate(637.37890625, 330.0874137878418)"><rect class="basic label-container" style="" x="-106.921875" y="-27" width="213.84375" height="54"/><g class="label" style="" transform="translate(-76.921875, -12)"><rect/><foreignObject width="153.84375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel "><p>MinIO Object Storage</p></span></div></foreignObject></g></g><g class="node default  " id="flowchart-Queue-7" transform="translate(870.99609375, 330.0874137878418)"><rect class="basic label-container" style="" x="-76.6953125" y="-27" width="153.390625" height="54"/><g class="label" style="" transform="translate(-46.6953125, -12)"><rect/><foreignObject width="93.390625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel "><p>Redis Queue</p></span></div></foreignObject></g></g><g class="node default  " id="flowchart-Worker-8" transform="translate(921.4609375, 188)"><rect class="basic label-container" style="" x="-93.8671875" y="-27" width="187.734375" height="54"/><g class="label" style="" transform="translate(-63.8671875, -12)"><rect/><foreignObject width="127.734375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel "><p>Worker Processor</p></span></div></foreignObject></g></g><g class="node default  " id="flowchart-Cleaner-10" transform="translate(575.58203125, 188)"><rect class="basic label-container" style="" x="-88.703125" y="-27" width="177.40625" height="54"/><g class="label" style="" transform="translate(-58.703125, -12)"><rect/><foreignObject width="117.40625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel "><p>Cleanup Service</p></span></div></foreignObject></g></g></g></g></g></svg>

### Technology Stack & Decisions

| Component          | Tech                 | Why we chose it                                                                       |
| :----------------- | :------------------- | :------------------------------------------------------------------------------------ |
| **Core**           | **NestJS** (Node.js) | Structured, scalable, and type-safe framework perfect for enterprise APIs.            |
| **Database**       | **PostgreSQL**       | ACID-compliant relational integrity for critical file metadata.                       |
| **ORM**            | **Prisma**           | Modern, type-safe database access with automated migrations.                          |
| **Storage**        | **MinIO**            | High-performance, S3-compatible storage that runs anywhere.                           |
| **Queue**          | **BullMQ / Redis**   | Offloads heavy processing from the main thread to ensure sub-20ms API response times. |
| **Infrastructure** | **Docker**           | "Write once, run anywhere" consistency.                                               |

---

## 💻 Frontend Integration Guide

Integrating VaporVault into your React, Vue, or Next.js app is incredibly simple.

### 1. Uploading a File

Use standard `FormData` to send the file. The server handles the `multipart/form-data` stream efficiently.

```javascript
/**
 * Uploads a file to VaporVault
 * @param {File} file - The file object from <input type="file" />
 * @returns {Promise<string>} - The fileId for retrieval
 */
async function uploadToVault(file) {
	const formData = new FormData();
	formData.append('file', file);

	try {
		const response = await fetch('http://localhost:3000/files/upload', {
			method: 'POST',
			body: formData, // Browser automatically sets Content-Type to multipart/form-data
		});

		if (!response.ok) throw new Error('Upload failed');

		const data = await response.json();
		console.log('🎉 Upload Successful! File ID:', data.fileId);
		return data.fileId;
	} catch (error) {
		console.error('Upload Error:', error);
	}
}
```

### 2. Downloading a File

To download, you first request a secure, temporary download URL.

```javascript
/**
 * Gets a secure download link
 * @param {string} fileId - The ID returned from upload
 */
async function getDownloadLink(fileId) {
	const response = await fetch(`http://localhost:3000/files/${fileId}/download`);
	const data = await response.json();

	// data.url is a pre-signed MinIO URL valid for 1 hour
	window.open(data.url, '_blank');
}
```

### 3. Checking File Status

```javascript
/**
 * Checks the processing status of a file
 * @param {string} fileId - The ID returned from upload
 * @returns {Promise<Object>} - Status JSON { status: 'PENDING' | 'COMPLETED', ... }
 */
async function checkStatus(fileId) {
	const response = await fetch(`http://localhost:3000/files/${fileId}/status`);
	const data = await response.json();

	console.log(`File Status: ${data.status}`);
	return data;
}
```

---

## 🚀 Quick Start (Local Dev)

Get the entire infrastructure running in less than 2 minutes.

### Prerequisites

- Docker & Docker Compose
- Node.js v18+ & pnpm

### Command Line

```bash
# 1. Start Infrastructure (DB, Redis, MinIO)
docker-compose up -d

# 2. Install Dependencies
pnpm install

# 3. Initialize Database Schema
pnpm db:dev:push

# 4. Launch API
pnpm start:dev
```

_API is now live at `http://localhost:3000`_

---

## 🧪 Testing Strategy

We maintain high code quality with a comprehensive test suite.

- **Unit Tests**: `pnpm test` (Uses Jest to mock dependencies)
- **E2E Integration**: `./test_flow.sh` (Full lifecycle test: Upload -> Process -> Download)

---

## 📡 API Documentation

Interactive Swagger documentation is auto-generated and available at:
**[http://localhost:3000/api](http://localhost:3000/api)**

---

_Built with ❤️ by Aditya Tripathi_
