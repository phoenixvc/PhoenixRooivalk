import Layout from "@theme/Layout";
import React, { useState } from "react";
import styles from "./contact.module.css";
import { BookingWidget } from "@site/src/components/Calendar";

// Inquiry types with mailto templates
const INQUIRY_TYPES = {
  technical: {
    label: "Technical Demonstration",
    icon: "🎯",
    description: "Live system capabilities and performance validation",
    subject: "Technical Demonstration Request - Phoenix Rooivalk",
    body: `Dear Phoenix Rooivalk Team,

I am interested in scheduling a technical demonstration of the Phoenix Rooivalk counter-UAS system.

Organization: [Your Organization]
Role: [Your Role]
Use Case: [Brief description of your operational requirements]

Specific areas of interest:
- [ ] Detection capabilities
- [ ] Tracking performance
- [ ] Neutralization methods
- [ ] Integration options
- [ ] AI/ML capabilities

Preferred demonstration format:
- [ ] Live on-site demonstration
- [ ] Virtual demonstration
- [ ] Technical briefing

Preferred timeframe: [Date range]

Additional requirements or questions:
[Your questions here]

Best regards,
[Your Name]
[Your Contact Information]`,
  },
  partnership: {
    label: "Partnership Opportunity",
    icon: "🤝",
    description: "Strategic alliances and integration partnerships",
    subject: "Partnership Inquiry - Phoenix Rooivalk",
    body: `Dear Phoenix Rooivalk Partnership Team,

I am reaching out to explore potential partnership opportunities with Phoenix Rooivalk.

Organization: [Your Organization]
Industry: [Defense / Aerospace / Technology / Other]
Website: [Your Website]

Partnership type of interest:
- [ ] Technology integration partner
- [ ] Distribution/reseller partner
- [ ] OEM/component supplier
- [ ] Research & development collaboration
- [ ] Training and support partner

Our capabilities:
[Brief description of your organization's capabilities and how they complement Phoenix Rooivalk]

Target markets/regions:
[Your geographic focus]

Proposed collaboration:
[Your partnership proposal]

Best regards,
[Your Name]
[Title]
[Contact Information]`,
  },
  investment: {
    label: "Investment Inquiry",
    icon: "📈",
    description: "Series A funding and strategic investment opportunities",
    subject: "Investment Inquiry - Phoenix Rooivalk",
    body: `Dear Phoenix Rooivalk Investment Relations,

I am writing to express interest in investment opportunities with Phoenix Rooivalk.

Investor Information:
Name: [Your Name]
Firm/Organization: [Investment Firm Name]
Type: [VC / PE / Family Office / Strategic Investor / Angel]
Website: [Firm Website]

Investment Profile:
- Typical investment size: [Range]
- Investment stage focus: [Seed / Series A / Growth]
- Sector focus: [Defense Tech / Aerospace / AI/ML / Other]

Request:
- [ ] Investor deck and materials
- [ ] Financial overview
- [ ] Meeting with founding team
- [ ] Due diligence documentation

Investment thesis/interest:
[Why you're interested in Phoenix Rooivalk]

Timeline:
[Your investment timeline and process]

Best regards,
[Your Name]
[Title]
[Contact Information]`,
  },
  government: {
    label: "Government & Defense",
    icon: "🏛️",
    description: "DoD procurement and defense contractor partnerships",
    subject: "Government/Defense Inquiry - Phoenix Rooivalk",
    body: `Dear Phoenix Rooivalk Government Relations,

I am contacting you regarding potential government/defense collaboration.

Agency/Organization: [Agency Name]
Department: [Department]
Role: [Your Role]
Clearance Level: [If applicable]

Inquiry Type:
- [ ] Procurement inquiry
- [ ] Request for Information (RFI)
- [ ] Request for Proposal (RFP) response
- [ ] SBIR/STTR collaboration
- [ ] Joint development program
- [ ] Testing and evaluation

Contract Vehicle Interest:
- [ ] GSA Schedule
- [ ] Direct contract
- [ ] Subcontract through prime
- [ ] Other Transaction Authority (OTA)
- [ ] IDIQ

Program/Requirement Details:
[Description of your program or requirement]

Timeline:
[Procurement/program timeline]

CAGE Code Request: [Yes/No]
SAM Registration Status: [Registered/Pending]

Best regards,
[Your Name]
[Title]
[Agency]
[Contact Information]`,
  },
};

type InquiryType = keyof typeof INQUIRY_TYPES;

export default function Contact(): React.ReactElement {
  const [selectedType, setSelectedType] = useState<InquiryType | null>(null);

  const generateMailtoLink = (type: InquiryType): string => {
    const inquiry = INQUIRY_TYPES[type];
    const email = "info@phoenixrooivalk.com";
    const subject = encodeURIComponent(inquiry.subject);
    const body = encodeURIComponent(inquiry.body);
    return `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <Layout
      title="Contact"
      description="Contact Phoenix Rooivalk for demonstrations, partnerships, investments, or government inquiries"
    >
      <main className={styles.contactMain}>
        <div className={styles.contactContainer}>
          <header className={styles.contactHeader}>
            <h1>Contact Us</h1>
            <p>
              Select your inquiry type below to get started with a pre-filled
              template, or use our general contact form.
            </p>
          </header>

          {/* Inquiry Type Cards */}
          <section className={styles.inquirySection}>
            <h2>Select Inquiry Type</h2>
            <div className={styles.inquiryGrid}>
              {(
                Object.entries(INQUIRY_TYPES) as [
                  InquiryType,
                  (typeof INQUIRY_TYPES)[InquiryType],
                ][]
              ).map(([key, inquiry]) => (
                <button
                  key={key}
                  className={`${styles.inquiryCard} ${selectedType === key ? styles.inquiryCardSelected : ""}`}
                  onClick={() => setSelectedType(key)}
                  type="button"
                >
                  <span className={styles.inquiryIcon}>{inquiry.icon}</span>
                  <h3>{inquiry.label}</h3>
                  <p>{inquiry.description}</p>
                </button>
              ))}
            </div>

            {selectedType && (
              <div className={styles.inquiryAction}>
                <p>
                  Click below to open your email client with a pre-filled
                  template for{" "}
                  <strong>{INQUIRY_TYPES[selectedType].label}</strong>.
                </p>
                <a
                  href={generateMailtoLink(selectedType)}
                  className={styles.mailtoButton}
                >
                  Open Email Template
                </a>
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => setSelectedType(null)}
                >
                  Clear Selection
                </button>
              </div>
            )}
          </section>

          {/* Divider */}
          <div className={styles.divider}>
            <span>or use our contact form</span>
          </div>

          {/* General Contact Form */}
          <section className={styles.formSection}>
            <h2>General Inquiry</h2>
            <form
              name="contact"
              method="POST"
              action="/contact"
              className={styles.contactForm}
            >
              <input type="hidden" name="form-name" value="contact" />
              <p hidden>
                <label>
                  Don't fill this out: <input name="bot-field" />
                </label>
              </p>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="Jane Doe"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="jane@example.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="organization">Organization</label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    placeholder="Acme Defense"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="inquiry-type">Inquiry Type</label>
                  <select id="inquiry-type" name="inquiry-type">
                    <option value="">Select type...</option>
                    <option value="technical">Technical Demonstration</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="investment">Investment Inquiry</option>
                    <option value="government">Government & Defense</option>
                    <option value="general">General Question</option>
                    <option value="support">Support Request</option>
                  </select>
                </div>

                <div className={styles.formGroupFull}>
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    placeholder="Tell us about your requirements..."
                  />
                </div>

                <div className={styles.formActions}>
                  <button type="submit" className={styles.submitButton}>
                    Send Message
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Schedule a Meeting */}
          <section className={styles.bookingSection}>
            <h2>Schedule a Meeting</h2>
            <p className={styles.bookingSectionDescription}>
              Book time directly with our team for demos, consultations, or
              investor discussions.
            </p>
            <BookingWidget
              calUsername="phoenixrooivalk"
              title="Book a Meeting"
              subtitle="Select a meeting type below to schedule"
              bookingTypes={[
                {
                  id: "demo",
                  name: "Product Demo",
                  duration: 30,
                  description:
                    "See Phoenix Rooivalk in action - live system demonstration",
                  slug: "demo",
                },
                {
                  id: "consultation",
                  name: "Technical Consultation",
                  duration: 45,
                  description:
                    "Discuss your counter-UAS requirements with our engineering team",
                  slug: "consultation",
                },
                {
                  id: "investor",
                  name: "Investor Meeting",
                  duration: 60,
                  description:
                    "Investment opportunity discussion with founding team",
                  slug: "investor-meeting",
                },
                {
                  id: "partnership",
                  name: "Partnership Discussion",
                  duration: 45,
                  description: "Explore strategic partnership opportunities",
                  slug: "partnership",
                },
              ]}
            />
          </section>

          {/* Direct Contact Info */}
          <section className={styles.directContact}>
            <h2>Direct Contact</h2>
            <div className={styles.contactCards}>
              <div className={styles.contactCard}>
                <span className={styles.contactCardIcon}>📧</span>
                <h3>Email</h3>
                <a href="mailto:info@phoenixrooivalk.com">
                  info@phoenixrooivalk.com
                </a>
              </div>
              <div className={styles.contactCard}>
                <span className={styles.contactCardIcon}>🔗</span>
                <h3>LinkedIn</h3>
                <a
                  href="https://linkedin.com/company/phoenix-rooivalk"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Connect with us
                </a>
              </div>
              <div className={styles.contactCard}>
                <span className={styles.contactCardIcon}>💻</span>
                <h3>GitHub</h3>
                <a
                  href="https://github.com/JustAGhosT/PhoenixRooivalk"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View our code
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
}
