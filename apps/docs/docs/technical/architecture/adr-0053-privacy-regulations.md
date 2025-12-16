---
id: adr-0053-privacy-regulations
title: "ADR 0053: Privacy Regulations Compliance"
sidebar_label: "ADR 0053: Privacy Compliance"
difficulty: intermediate
estimated_reading_time: 10
points: 40
tags:
  - technical
  - architecture
  - compliance
  - privacy
  - gdpr
  - popia
  - legal
prerequisites:
  - architecture-decision-records
  - adr-0052-data-retention-policies
---

# ADR 0053: Privacy Regulations Compliance

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Operator data, system access logs, and potentially captured
   drone operator information must comply with GDPR, POPIA, and other privacy
   regulations
2. **Decision**: Implement privacy-by-design with consent management, data
   minimization, and jurisdiction-aware processing
3. **Trade-off**: Privacy controls vs. operational efficiency

---

## Context

### Applicable Regulations

| Regulation | Jurisdiction | Key Requirements                                  |
| ---------- | ------------ | ------------------------------------------------- |
| POPIA      | South Africa | Consent, purpose limitation, data subject rights  |
| GDPR       | EU/EEA       | Lawful basis, data minimization, right to erasure |
| CCPA       | California   | Disclosure, opt-out, deletion rights              |
| LGPD       | Brazil       | Similar to GDPR                                   |

### Personal Data in Phoenix Rooivalk

| Data Category       | Examples                           | Source              |
| ------------------- | ---------------------------------- | ------------------- |
| Operator data       | Name, email, login history         | User registration   |
| Access logs         | IP addresses, device info          | System logs         |
| Drone operator info | Potentially PII if drone captured  | Evidence collection |
| Location data       | Operator GPS, deployment locations | Operations          |

---

## Decision

Implement **privacy-by-design** framework:

### Privacy Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Privacy-by-Design Architecture                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  DATA COLLECTION                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Consent    │  │    Data      │  │   Purpose    │          ││
│  │  │   Check      │─▶│  Minimization│─▶│  Limitation  │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  DATA PROCESSING                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │  Lawful      │  │   Access     │  │   Audit      │          ││
│  │  │  Basis Check │─▶│   Control    │─▶│   Logging    │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  DATA SUBJECT RIGHTS                                                │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Access     │  │  Rectification│  │   Erasure   │          ││
│  │  │   Request    │  │   Request    │  │   Request   │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Lawful Basis Framework

### Processing Basis by Data Type

| Data Type        | Lawful Basis        | Justification                  |
| ---------------- | ------------------- | ------------------------------ |
| Operator account | Contract            | Required for service delivery  |
| Access logs      | Legitimate interest | Security monitoring            |
| Evidence data    | Legal obligation    | Regulatory compliance          |
| Analytics        | Consent             | Optional, improvement purposes |

### Basis Validation

```rust
pub enum LawfulBasis {
    Consent { consent_id: String, scope: Vec<String> },
    Contract { contract_ref: String },
    LegalObligation { regulation: String },
    VitalInterests,
    PublicTask,
    LegitimateInterest { assessment_id: String },
}

pub struct ProcessingActivity {
    pub data_type: DataType,
    pub purpose: String,
    pub basis: LawfulBasis,
    pub retention: Duration,
    pub recipients: Vec<String>,
}

impl ProcessingActivity {
    pub fn validate(&self) -> Result<(), PrivacyError> {
        match &self.basis {
            LawfulBasis::Consent { consent_id, scope } => {
                // Verify consent is valid and covers this processing
                self.verify_consent(consent_id, scope)?;
            }
            LawfulBasis::LegitimateInterest { assessment_id } => {
                // Verify LIA was conducted
                self.verify_lia(assessment_id)?;
            }
            _ => {}
        }
        Ok(())
    }
}
```

---

## Consent Management

### Consent Model

```rust
pub struct Consent {
    pub id: String,
    pub user_id: String,
    pub granted_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub scope: Vec<ConsentScope>,
    pub jurisdiction: Jurisdiction,
    pub withdrawal_method: WithdrawalMethod,
    pub evidence: ConsentEvidence,
}

pub enum ConsentScope {
    Analytics,
    Marketing,
    ThirdPartySharing,
    LocationTracking,
    BiometricProcessing,
}

pub struct ConsentEvidence {
    pub method: String,  // "checkbox", "explicit_form", etc.
    pub ip_address: String,
    pub user_agent: String,
    pub consent_text_version: String,
}

impl Consent {
    pub fn is_valid(&self) -> bool {
        if let Some(expires) = self.expires_at {
            if Utc::now() > expires {
                return false;
            }
        }
        true
    }

    pub fn covers(&self, scope: &ConsentScope) -> bool {
        self.is_valid() && self.scope.contains(scope)
    }
}
```

### Consent UI Component

```typescript
interface ConsentBannerProps {
  jurisdiction: 'EU' | 'ZA' | 'US' | 'OTHER';
  onAccept: (scopes: ConsentScope[]) => void;
  onDecline: () => void;
}

const ConsentBanner: React.FC<ConsentBannerProps> = ({
  jurisdiction,
  onAccept,
  onDecline,
}) => {
  const [selectedScopes, setSelectedScopes] = useState<ConsentScope[]>([]);

  const requiredText = jurisdiction === 'EU'
    ? 'We use cookies for essential site functionality.'
    : 'We collect data to improve our services.';

  return (
    <div className="consent-banner">
      <h3>Privacy Settings</h3>
      <p>{requiredText}</p>

      <div className="consent-options">
        <label>
          <input
            type="checkbox"
            checked={selectedScopes.includes('analytics')}
            onChange={(e) => toggleScope('analytics', e.target.checked)}
          />
          Analytics (helps us improve the service)
        </label>
        {/* Additional optional scopes */}
      </div>

      <div className="consent-actions">
        <button onClick={() => onAccept(selectedScopes)}>
          Accept Selected
        </button>
        <button onClick={() => onAccept([])}>
          Essential Only
        </button>
        <button onClick={onDecline}>
          Decline All
        </button>
      </div>

      <a href="/privacy-policy">Read our Privacy Policy</a>
    </div>
  );
};
```

---

## Data Subject Rights

### Rights Implementation

```rust
pub struct DataSubjectRightsService {
    user_store: UserStore,
    data_stores: Vec<Box<dyn DataStore>>,
    audit_log: AuditLog,
}

impl DataSubjectRightsService {
    /// Right of Access (GDPR Art. 15, POPIA Sec. 23)
    pub async fn handle_access_request(
        &self,
        request: AccessRequest,
    ) -> Result<DataExport, PrivacyError> {
        // Verify identity
        self.verify_identity(&request.user_id, &request.verification).await?;

        // Collect all personal data
        let mut export = DataExport::new();

        for store in &self.data_stores {
            let data = store.get_user_data(&request.user_id).await?;
            export.add_category(store.category(), data);
        }

        // Log the request
        self.audit_log.log_access_request(&request).await?;

        Ok(export)
    }

    /// Right to Erasure (GDPR Art. 17, POPIA Sec. 24)
    pub async fn handle_erasure_request(
        &self,
        request: ErasureRequest,
    ) -> Result<ErasureReport, PrivacyError> {
        // Verify identity
        self.verify_identity(&request.user_id, &request.verification).await?;

        let mut report = ErasureReport::new();

        for store in &self.data_stores {
            // Check if erasure is blocked (legal hold, etc.)
            if store.is_erasure_blocked(&request.user_id).await? {
                report.add_exception(
                    store.category(),
                    ErasureException::LegalObligation,
                );
                continue;
            }

            // Erase or anonymize
            let result = store.erase_user_data(&request.user_id).await?;
            report.add_result(store.category(), result);
        }

        // Log the request
        self.audit_log.log_erasure_request(&request, &report).await?;

        Ok(report)
    }

    /// Right to Rectification (GDPR Art. 16, POPIA Sec. 24)
    pub async fn handle_rectification_request(
        &self,
        request: RectificationRequest,
    ) -> Result<(), PrivacyError> {
        self.verify_identity(&request.user_id, &request.verification).await?;

        // Update user data
        self.user_store.update(&request.user_id, &request.corrections).await?;

        // Log the request
        self.audit_log.log_rectification(&request).await?;

        Ok(())
    }

    /// Right to Data Portability (GDPR Art. 20)
    pub async fn handle_portability_request(
        &self,
        request: PortabilityRequest,
    ) -> Result<PortableData, PrivacyError> {
        let export = self.handle_access_request(request.into()).await?;

        // Convert to portable format (JSON, CSV)
        let portable = match request.format {
            ExportFormat::Json => export.to_json()?,
            ExportFormat::Csv => export.to_csv()?,
        };

        Ok(portable)
    }
}
```

### Request API Endpoints

```typescript
// POST /api/privacy/access-request
// POST /api/privacy/erasure-request
// POST /api/privacy/rectification-request
// POST /api/privacy/portability-request

interface PrivacyRequest {
  userId: string;
  verification: {
    method: "email" | "id_document" | "video_call";
    token: string;
  };
  requestType: "access" | "erasure" | "rectification" | "portability";
  details?: Record<string, unknown>;
}
```

---

## Data Minimization

### Collection Rules

```rust
pub struct DataMinimizer {
    rules: Vec<MinimizationRule>,
}

pub struct MinimizationRule {
    pub data_type: DataType,
    pub required_fields: Vec<String>,
    pub optional_fields: Vec<String>,
    pub auto_redact: Vec<String>,
}

impl DataMinimizer {
    pub fn minimize(&self, data: &mut DataRecord) {
        if let Some(rule) = self.rules.iter().find(|r| r.data_type == data.data_type) {
            // Remove fields not in required or optional
            data.fields.retain(|k, _| {
                rule.required_fields.contains(k) || rule.optional_fields.contains(k)
            });

            // Auto-redact sensitive fields
            for field in &rule.auto_redact {
                if let Some(value) = data.fields.get_mut(field) {
                    *value = self.redact(value);
                }
            }
        }
    }

    fn redact(&self, value: &Value) -> Value {
        match value {
            Value::String(s) => Value::String(format!("***{}", &s[s.len()-4..])),
            _ => Value::Null,
        }
    }
}
```

---

## Cross-Border Transfers

### Transfer Rules

| From | To  | Mechanism                     |
| ---- | --- | ----------------------------- |
| SA   | EU  | Adequate (mutual)             |
| EU   | US  | SCCs + supplementary measures |
| SA   | US  | Contract + consent            |
| Any  | SA  | No restrictions               |

### Transfer Validation

```rust
pub fn validate_transfer(
    source: Jurisdiction,
    destination: Jurisdiction,
    data_type: DataType,
) -> Result<TransferMechanism, PrivacyError> {
    match (source, destination) {
        (Jurisdiction::SA, Jurisdiction::EU) => {
            // SA has adequate protection
            Ok(TransferMechanism::Adequacy)
        }
        (Jurisdiction::EU, Jurisdiction::US) => {
            // Requires SCCs
            Ok(TransferMechanism::SCCs {
                version: "2021/914".to_string(),
                supplementary_measures: vec![
                    "Encryption in transit and at rest".to_string(),
                    "Access controls".to_string(),
                ],
            })
        }
        _ => {
            // Default: require explicit consent
            Ok(TransferMechanism::Consent)
        }
    }
}
```

---

## Consequences

### Positive

- **Compliance**: Meets GDPR, POPIA, CCPA requirements
- **Trust**: Transparent data practices
- **Risk reduction**: Avoid regulatory fines
- **Data quality**: Minimization improves relevance

### Negative

- **Complexity**: Multiple jurisdiction rules
- **UX friction**: Consent flows add steps
- **Operational limits**: Some analytics restricted

---

## Related ADRs

- [ADR 0052: Data Retention Policies](./adr-0052-data-retention-policies)
- [ADR 0054: Audit Trail Requirements](./adr-0054-audit-trail-requirements)
- [ADR 0029: Secrets Management](./adr-0029-secrets-management)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
