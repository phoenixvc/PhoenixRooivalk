import React from "react";
import { RevealSection } from "../RevealSection";
import { Button } from "../ui/button";
import { Card } from "../ui/Card";
import styles from "./SocialProofSection.module.css";

export const SocialProofSection: React.FC = () => {
  const testimonials = [
    {
      quote: "Units need RF-silent detection paths in contested environments.",
      author: "Defense Stakeholder",
      title: "Operational Requirements",
      organization: "Exploratory Interview",
      avatar: "👨‍💼",
    },
    {
      quote:
        "Systems must fail gracefully offline; central coordination is a bonus, not a dependency.",
      author: "Technical Advisor",
      title: "System Architecture",
      organization: "Discovery Discussion",
      avatar: "👩‍🔬",
    },
  ];

  const partnerships = [
    {
      name: "SkySnare™ Consumer",
      logo: "🎯",
      type: "Sports & Training Market",
    },
    {
      name: "AeroNet™ Enterprise",
      logo: "🛡️",
      type: "Infrastructure Security",
    },
    { name: "Seeking Investment", logo: "💰", type: "Seed Round: $1.5M" },
  ];

  const certifications = [
    { name: "ITAR Compliance", status: "Planned", icon: "🔒" },
    { name: "ISO 27001", status: "Planned", icon: "📋" },
    { name: "CMMC 2.0 L2", status: "Planned", icon: "🛡️" },
    { name: "MIL-STD-810G", status: "Planned", icon: "🛡️" },
    { name: "Export Control", status: "Planned", icon: "🌍" },
    { name: "GDPR Compliance", status: "Planned", icon: "⚖️" },
  ];

  const developmentStatus = [
    {
      icon: "🔬",
      title: "Year 1: Foundation",
      description: "Prototype, CPSC certification, SkySnare™ launch",
      proof: "Active - FY26",
    },
    {
      icon: "🚀",
      title: "Year 2: AI Demo",
      description: "FAA waiver, first AeroNet™ pilot with AI",
      proof: "Planned - FY27",
    },
    {
      icon: "🛡️",
      title: "Year 3-4: Scale",
      description: "SkySnare™ Pro, 6-15 AeroNet™ sites",
      proof: "Planned - FY28-29",
    },
    {
      icon: "🔒",
      title: "Year 5: Exit Ready",
      description: "75K units, 35 sites, $50M revenue",
      proof: "Planning - FY30",
    },
  ];

  const mediaCoverage = [
    {
      outlet: "Industry Outlook",
      headline: "Autonomous Counter-Drone Systems Show Promise",
      date: "Market Analysis",
    },
    {
      outlet: "Technology Trends",
      headline: "Edge Computing Potential in Air Defense",
      date: "Future Applications",
    },
    {
      outlet: "Defense Innovation",
      headline: "120ms Response Time Target Analysis",
      date: "Technical Feasibility",
    },
    {
      outlet: "Market Research",
      headline: "Counter-UAS Technology Development",
      date: "Industry Assessment",
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.innerContainer}>
          {/* Section Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>Building Trust Through Innovation</h2>
            <p className={styles.subtitle}>
              From consumer training products to enterprise security solutions —
              proven technology that scales with your needs.
            </p>
          </div>

          {/* What We're Hearing */}
          <div className={styles.testimonialSection}>
            <h3 className={styles.sectionTitle}>
              What We&apos;re Hearing (Discovery Notes, Not Endorsements)
            </h3>
            <p className={styles.sectionSubtitle}>
              Paraphrased insights from exploratory interviews with defense
              stakeholders.
            </p>
            <div className={styles.testimonialsGrid}>
              {testimonials.map((testimonial, index) => (
                <div key={index} className={styles.testimonialCard}>
                  <div className={styles.testimonialHeader}>
                    <div className={styles.avatar}>{testimonial.avatar}</div>
                    <div className={styles.testimonialContent}>
                      <p className={styles.quote}>
                        &quot;{testimonial.quote}&quot;
                      </p>
                      <div>
                        <div className={styles.authorName}>
                          {testimonial.author}
                        </div>
                        <div className={styles.authorTitle}>
                          {testimonial.title}
                        </div>
                        <div className={styles.authorOrg}>
                          {testimonial.organization}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partnerships */}
          <div className={styles.partnershipsSection}>
            <h3 className={styles.sectionTitle}>Strategic Partnerships</h3>
            <div className={styles.partnershipsGrid}>
              {partnerships.map((partner, index) => (
                <div key={index} className={styles.partnerCard}>
                  <div className={styles.partnerLogo}>{partner.logo}</div>
                  <div className={styles.partnerName}>{partner.name}</div>
                  <div className={styles.partnerType}>{partner.type}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Development Status & Certifications */}
          <div className={styles.developmentSection}>
            <h3 className={styles.sectionTitle}>
              Development Status & Compliance
            </h3>

            {/* Development Status */}
            <div className={styles.testimonialSection}>
              <h4 className={styles.developmentSubtitle}>
                5-Year Strategic Phases (2025-2030)
              </h4>
              <div className={styles.developmentGrid}>
                {developmentStatus.map((status, index) => (
                  <RevealSection key={index}>
                    <Card
                      icon={status.icon}
                      title={status.title}
                      description={status.description}
                      proof={status.proof}
                    />
                  </RevealSection>
                ))}
              </div>
            </div>

            {/* Compliance Roadmap */}
            <div className={styles.complianceSection}>
              <h4 className={styles.developmentSubtitle}>
                Assurance Roadmap (Targets, Post-Funding)
              </h4>
              <div className={styles.complianceGrid}>
                {certifications.map((cert, index) => (
                  <Card
                    key={index}
                    icon={cert.icon}
                    title={cert.name}
                    description=""
                    proof={cert.status}
                    centered
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Media Coverage */}
          <div className={styles.mediaSection}>
            <h3 className={styles.sectionTitle}>Industry Recognition</h3>
            <div className={styles.mediaGrid}>
              {mediaCoverage.map((article, index) => (
                <Card
                  key={index}
                  icon="📰"
                  title={article.outlet}
                  description={article.headline}
                  proof={article.date}
                />
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className={styles.ctaSection}>
            <h3 className={styles.ctaTitle}>Ready to Get Started?</h3>
            <p className={styles.ctaSubtitle}>
              Join us in building the future of safe, effective drone capture
              technology. From training to enterprise security.
            </p>
            <div className={styles.ctaButtons}>
              <Button
                href="/contact"
                size="lg"
                variant="primary"
                trackingEvent="Pilot Program Request"
                trackingProps={{ location: "social-proof" }}
              >
                Request Pilot Program
              </Button>
              <Button
                href="/compliance"
                variant="secondary"
                size="lg"
                trackingEvent="View Certifications"
                trackingProps={{ location: "social-proof" }}
              >
                View Certifications
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
