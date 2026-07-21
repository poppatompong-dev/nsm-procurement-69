---
name: gov-tech-expert
description: Guidelines and tech stack standards for developing government IT systems, including AI integration, full-stack Next.js/React, database optimization, compliance, and UX/UI for public systems.
---

# Government Tech & Enterprise Systems Standard

This skill defines the development guidelines, architecture, and tech stack standards for building secure, scalable, and compliant public sector applications.

## 1. AI Integration & Automation
- **Agentic Workflows:** Implement internal tools for document drafting, query handling, and approval matching.
- **Prompt Engineering:** Enforce structured outputs (e.g., JSON schemas) for legal templates and forms.
- **RAG (Retrieval-Augmented Generation):** Utilize RAG to query internal policy documents, regulations, and database records securely.
- **Privacy First:** Ensure sensitive government data does not leak to external unvetted AI APIs. Use local LLM options (Ollama, LM Studio) or enterprise-tier secure endpoints (e.g. secure Azure OpenAI/Vertex AI).

## 2. Full-Stack Web Architecture
- **Tech Stack:** React (Vite) for lightweight client dashboards, or Next.js (App Router, Server Actions) for enterprise portals.
- **Authentication:** Role-Based Access Control (RBAC) mapped to governmental division structures (e.g., สถิติ, บริหาร, ประชาสัมพันธ์, วิเคราะห์).
- **Real-Time Dashboards:** Sync statuses dynamically using Firebase, Supabase, or WebSockets.

## 3. Database & Optimization
- **Relational Integrity:** Use PostgreSQL as the primary transactional database with proper indexing and performance tuning.
- **Data Pipelines:** Build structured ETL flows for generating government reports and auditing.
- **Compliance:** Enable logging, automated backups, and database replication for high availability.

## 4. Government Standards & Compliance
- **Legal Compliance:** Adhere to Thailand PDPA (Personal Data Protection Act). Keep PII (Personally Identifiable Information) encrypted.
- **Audit Trails:** Implement robust audit logging (who did what, when) for transparency and legal traceability.
- **PDF Automation & Signatures:** Integrate digital signature mechanisms and automated document numbering with QR code verification.

## 5. UI/UX for Government Users
- **Accessibility:** Design clean, simple interfaces tailored for non-technical users and decision-makers.
- **Error Reduction:** Optimize form flows to validate input and reduce user entry errors.
