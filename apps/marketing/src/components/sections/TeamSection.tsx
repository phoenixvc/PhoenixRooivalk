import React from "react";
import { RevealSection } from "../RevealSection";
import styles from "./TeamSection.module.css";

export const TeamSection: React.FC = () => {
  const team = [
    {
      name: "Jurie Smit",
      role: "Founder/CEO/CIO",
      title: "Founder, Chief Executive Officer & Chief Information Officer",
      description: "Technology strategy and information systems",
      linkedin: "https://www.linkedin.com/in/juriesmit/",
      icon: "💻",
      eliminated: false,
    },
    {
      name: "Chanelle Fellinger",
      role: "CMO",
      title: "Chief Marketing Officer",
      description: "Brand strategy and market positioning",
      linkedin: "https://www.linkedin.com/in/chanelle-fellinger/",
      icon: "📢",
      eliminated: false,
    },
    {
      name: "Martyn",
      role: "COO",
      title: "Chief Operating Officer",
      description: "Operations and business execution",
      linkedin: null,
      icon: "⚙️",
      eliminated: true,
    },
    {
      name: "Pieter",
      role: "CTO",
      title: "Chief Technology Officer",
      description: "Product development and engineering",
      linkedin: null,
      icon: "🔧",
      eliminated: false,
    },
    {
      name: "Eben",
      role: "CFO",
      title: "Chief Financial Officer",
      description: "Financial strategy and planning",
      linkedin: null,
      icon: "💰",
      eliminated: false,
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <RevealSection className={styles.header}>
          <h2 className={styles.title}>Leadership Team</h2>
          <p className={styles.subtitle}>
            Experienced team driving PhoenixRooivalk&apos;s dual-brand strategy
            from consumer validation to enterprise leadership.
          </p>
        </RevealSection>

        <div className={styles.teamGrid}>
          {team.map((member, index) => (
            <RevealSection key={index}>
              <div className={`${styles.memberCard} ${member.eliminated ? styles.eliminatedCard : ''}`}>
                {member.eliminated && (
                  <div className={styles.eliminatedOverlay}>
                    <div className={styles.crossLine1}></div>
                    <div className={styles.crossLine2}></div>
                    <div className={styles.eliminatedText}>ELIMINATED</div>
                    <div className={styles.eliminatedSubtext}>hy is 'n poes</div>
                  </div>
                )}
                <div className={styles.memberIcon}>{member.icon}</div>
                <div className={styles.memberInfo}>
                  <h3 className={styles.memberName}>{member.name}</h3>
                  <div className={styles.memberRole}>{member.role}</div>
                  <div className={styles.memberTitle}>{member.title}</div>
                  <p className={styles.memberDescription}>
                    {member.description}
                  </p>
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkedinLink}
                      aria-label={`View ${member.name}'s LinkedIn profile`}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
};
