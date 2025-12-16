---
id: cuas-sandbox-missing-documents
title: CUAS Sandbox 2026 - Missing Documents Checklist
sidebar_label: Missing Documents
difficulty: intermediate
estimated_reading_time: 5
points: 10
phase: ["seed"]
tags:
  - business
  - counter-uas
  - applications
prerequisites:
  - cuas-sandbox-2026
---

# CUAS Sandbox 2026 - Missing Documents

:::danger Action Required - Upload Soonest

PriviDox has confirmed receipt of the **CUAS 2026 Application Form**. However,
the following required documents are still missing and must be uploaded as soon
as possible to complete the application.

:::

---

## Missing Documents Status

| # | Document | Status | Priority | Assigned |
|---|----------|--------|----------|----------|
| 1 | Company and Technology Overview "One-Pager" | Missing | Critical | Martyn |
| 2 | Test Plan Template | Missing | Critical | Alistair |
| 3 | Radio Frequency Spectrum (DND 552) | Missing (if applicable) | High | Jurie |
| 4 | 3-Minute Demonstration Video | Missing | Critical | Team |

---

## Document Requirements

### 1. Company and Technology Overview "One-Pager"

A concise single-page document summarizing Phoenix Rooivalk and our CUAS
technology.

**Required Content:**
- [ ] Company overview (founding, mission, team)
- [ ] Technology description (detection + defeat capabilities)
- [ ] Key differentiators vs. existing solutions
- [ ] Current TRL/CRL status
- [ ] Contact information

**Format:** PDF, single page, professional layout

**Template Location:** Create in `/docs/business/applications/one-pager.md`

---

### 2. Test Plan Template

The official DND/IDEaS Test Plan template must be completed to demonstrate
competency in building a viable test plan.

**Required Sections:**
- [ ] Test objectives and success criteria
- [ ] Equipment and resources required
- [ ] Safety considerations
- [ ] Proposed test scenarios (mapped to operational scenarios)
- [ ] Data collection methodology
- [ ] Expected outcomes and metrics

**Official Template:** [Download from IDEaS](https://www.canada.ca/en/department-national-defence/programs/defence-ideas/element/sandboxes/challenge/counter-uncrewed-aerial-systems-sandbox-2026/2026-counter-uncrewed-aerial-systems-sandbox-test-plan-template.html)

:::warning Pass/Fail Criterion

The Test Plan is a **mandatory PASS/FAIL criterion**. Applications without a
properly completed test plan will be disqualified.

:::

---

### 3. Radio Frequency Spectrum - DND 552

**Applicability:** Required ONLY if your solution uses RF transmission for:
- RF jamming/spoofing
- RF detection
- RF-based communication with interceptors
- Any other RF emission

**Phoenix Rooivalk Assessment:**

| Component | RF Usage | DND 552 Required |
|-----------|----------|------------------|
| RF Detection Sensor | Passive receive only | No |
| Mesh Communications | Active transmission | **Yes** |
| Backup C2C Link | Active transmission | **Yes** |
| Interceptor Control | Active transmission | **Yes** |

:::info DND 552 Required

Based on our system architecture, we **do require** DND 552 spectrum
authorization for:
- Drone-to-drone mesh communications
- Ground station to interceptor C2 links

:::

**Action Required:**
- [ ] Document all RF frequencies used
- [ ] List transmission power levels
- [ ] Specify bandwidth requirements
- [ ] Complete DND 552 form

---

### 4. Three-Minute Demonstration Video

An **untouched/unedited** video demonstrating the CUAS system capabilities.

**Requirements:**
- [ ] Maximum 3 minutes duration
- [ ] Unedited/raw footage (no post-processing)
- [ ] Must show actual system operation
- [ ] Real drone detection and/or defeat demonstration
- [ ] Clear visibility of key components

**Suggested Content Structure:**

| Segment | Duration | Content |
|---------|----------|---------|
| Introduction | 20 sec | System overview, components shown |
| Detection Demo | 60 sec | Drone detection sequence |
| Tracking Demo | 40 sec | Target tracking capability |
| Defeat Demo | 60 sec | Intercept/neutralization |
| Summary | 20 sec | Key metrics, results |

**Technical Specs:**
- Resolution: 1080p minimum
- Format: MP4, MOV, or AVI
- File size: Check PriviDox limits
- Audio: Optional but recommended for narration

:::tip Video Recording Checklist

Before recording:
- [ ] Weather conditions suitable
- [ ] All system components charged/ready
- [ ] Test drone targets prepared
- [ ] Camera/recording equipment tested
- [ ] Safety protocols in place
- [ ] Recording location cleared

:::

---

## Upload Instructions

1. Log into **PriviDox** platform
2. Navigate to your CUAS 2026 application
3. Upload each document to the appropriate section
4. Verify upload success
5. Screenshot confirmation for records

---

## Timeline

| Milestone | Date | Status |
|-----------|------|--------|
| Application Form Submitted | Completed | Done |
| Missing Documents Identified | Dec 16, 2025 | Current |
| One-Pager Draft | Dec 18, 2025 | Pending |
| Test Plan Draft | Dec 20, 2025 | Pending |
| DND 552 Completion | Dec 22, 2025 | Pending |
| Video Recording | Dec 28, 2025 | Pending |
| All Documents Uploaded | Jan 5, 2026 | Pending |
| **Application Deadline** | **Dec 15, 2025, 2:00 PM ET** | - |

:::danger Deadline Alert

The application deadline was **December 15, 2025**. If your application form
was submitted before this deadline but documents are still missing, contact
IDEaS immediately to confirm your application status.

:::

---

## Document Templates

### One-Pager Template

See [Company One-Pager Template](./one-pager-template)

### Test Plan Template

See [Test Plan Guide](./test-plan-guide)

---

## Related Documents

- [CUAS Sandbox 2026 Overview](../opportunities/cuas-sandbox-2026)
- [CUAS Readiness Levels](../opportunities/cuas-readiness-levels)
- [Eligibility Assessment](./cuas-sandbox-eligibility-assessment)

---

_Document tracking for Phoenix Rooivalk CUAS Sandbox 2026 application.
© 2025 Phoenix Rooivalk. All rights reserved._
