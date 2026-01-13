"use client";
import Link from "next/link";
import * as React from "react";
import { useState, useEffect } from "react";
import { Footer } from "../../components/Footer";
import { Navigation } from "../../components/Navigation";
import { InteractiveMesh } from "../../components/ui/InteractiveMesh";
import { API_BASE_URL } from "../../config/constants";
import styles from "./contact.module.css";

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_team_member: boolean;
  linkedin_url: string | null;
  discord_handle: string | null;
}

export default function ContactPage(): React.ReactElement {
  // Obfuscate email at render time to prevent scraping
  const [email] = useState(() => {
    const user = "contact";
    const domain = "phoenixrooivalk.com";
    return `${user}@${domain}`;
  });

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [applicationError, setApplicationError] = useState("");
  const [position, setPosition] = useState("");
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const sessionId =
      typeof window !== "undefined" ? localStorage.getItem("session_id") : null;
    const storedUser =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;

    if (sessionId && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
      } catch (err) {
        console.error("Failed to parse user:", err);
      }
    }
    setLoadingUser(false);
  }, []);

  const handleEmailClick = (subject?: string, body?: string) => {
    if (!email) return;
    const params = new URLSearchParams();
    if (subject) params.append("subject", subject);
    if (body) params.append("body", body);
    const queryString = params.toString();
    window.location.href = `mailto:${email}${queryString ? "?" + queryString : ""}`;
  };

  const handleCareerApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      // Redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return;
    }

    if (user.is_team_member) {
      setApplicationError("Team members cannot apply for positions");
      return;
    }

    const sessionId =
      typeof window !== "undefined" ? localStorage.getItem("session_id") : null;

    if (!sessionId) {
      setApplicationError("Session expired. Please log in again.");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return;
    }

    setApplicationStatus("submitting");
    setApplicationError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/career/apply?session_id=${encodeURIComponent(sessionId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            position,
            cover_letter: coverLetter || null,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Application failed");
      }

      setApplicationStatus("success");
      setPosition("");
      setCoverLetter("");
    } catch (err) {
      setApplicationStatus("error");
      setApplicationError(
        err instanceof Error ? err.message : "Application failed",
      );
    }
  };

  const getUserDisplayName = () => {
    if (!user) return "";
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    return user.email;
  };

  return (
    <main className={styles.pageContainer}>
      {/* Background mesh effect */}
      <InteractiveMesh
        gridSize={50}
        color="rgba(234, 124, 28, 0.1)"
        bendStrength={20}
        bendRadius={100}
      />

      {/* Navigation */}
      <Navigation />

      {/* Header */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.headerContainer}>
            <h1 className={styles.pageTitle}>Contact Phoenix Rooivalk</h1>
            <p className={styles.pageSubtitle}>
              Interested in the Phoenix Rooivalk concept? Get in touch for
              partnership opportunities, investment discussions, and design
              collaboration.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Get in Touch</h2>
              <div className={styles.contentGroup}>
                <div>
                  <h3 className={styles.subsectionTitle}>Email Us</h3>
                  <p className={styles.subsectionText}>
                    <button
                      onClick={() => handleEmailClick()}
                      className={styles.emailButton}
                      disabled={!email}
                    >
                      {email || "Loading..."}
                    </button>
                  </p>
                </div>
                <div>
                  <h3 className={styles.subsectionTitle}>Concept Discussion</h3>
                  <p className={styles.subsectionText}>
                    Discuss the Phoenix Rooivalk concept, technical
                    architecture, and potential applications in your operational
                    environment.
                  </p>
                  <button
                    onClick={() =>
                      handleEmailClick(
                        "Phoenix Rooivalk Concept Discussion",
                        "I would like to discuss the Phoenix Rooivalk concept and explore potential collaboration opportunities.",
                      )
                    }
                    className={styles.primaryButton}
                    disabled={!email}
                  >
                    Request Intro Call
                  </button>
                </div>
                <div>
                  <h3 className={styles.subsectionTitle}>
                    Investment & Funding
                  </h3>
                  <p className={styles.subsectionText}>
                    Interested in funding opportunities, SBIR collaboration, or
                    early-stage investment? Contact us to discuss partnership
                    and funding opportunities.
                  </p>
                  <button
                    onClick={() =>
                      handleEmailClick("Phoenix Rooivalk Investment Inquiry")
                    }
                    className={styles.secondaryButton}
                    disabled={!email}
                  >
                    Investment Inquiry
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Market Exploration</h2>
              <div className={styles.contentGroup}>
                <div>
                  <h3 className={styles.subsectionTitle}>
                    Alternative Applications Under Exploration
                  </h3>
                  <div className={styles.applicationsGrid}>
                    <div className={styles.applicationCategory}>
                      <div className={styles.listItem}>
                        <div className={styles.listItemTitle}>
                          Civilian Applications
                        </div>
                        <ul>
                          <li>Airport security & perimeter protection</li>
                          <li>Critical infrastructure monitoring</li>
                          <li>Event security & crowd safety</li>
                          <li>Border security applications</li>
                        </ul>
                      </div>
                      <div className={styles.listItem}>
                        <div className={styles.listItemTitle}>
                          Commercial Security
                        </div>
                        <ul>
                          <li>Corporate campus protection</li>
                          <li>Data center security</li>
                          <li>Port & shipping terminal security</li>
                          <li>VIP protection services</li>
                        </ul>
                      </div>
                    </div>
                    <div className={styles.applicationCategory}>
                      <div className={styles.listItem} id="partnerships">
                        <div className={styles.listItemTitle}>
                          Research Partnerships
                        </div>
                        <ul>
                          <li>University research collaboration</li>
                          <li>Government laboratory partnerships</li>
                          <li>International cooperation (NATO)</li>
                          <li>Technology transfer programs</li>
                        </ul>
                      </div>
                      <div className={styles.listItem}>
                        <div className={styles.listItemTitle}>
                          Technology Licensing
                        </div>
                        <ul>
                          <li>Sensor fusion algorithms</li>
                          <li>Edge processing capabilities</li>
                          <li>Blockchain evidence systems</li>
                          <li>Countermeasure technologies</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className={styles.warningBox}>
                    <p className={styles.warningText}>
                      💡 These are potential applications under exploration.
                      Actual deployment would require regulatory approval,
                      market validation, and technology adaptation for specific
                      use cases.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Access Requirements</h2>
              <div className={styles.contentGroup}>
                <div>
                  <h3 className={styles.subsectionTitle}>
                    Restricted Partner Access
                  </h3>
                  <p className={styles.listItem}>
                    This repository and associated artifacts are intended for
                    approved defense partners only. Redistribution or public
                    disclosure is prohibited without written authorization.
                  </p>
                </div>
                <div>
                  <h3 className={styles.subsectionTitle}>Who Can Apply</h3>
                  <ul className={styles.listItem}>
                    <li>Government agencies with lawful mandates</li>
                    <li>Defense integrators and contractors</li>
                    <li>Vetted industrial partners</li>
                    <li>Critical infrastructure operators</li>
                  </ul>
                </div>
                <div>
                  <h3 className={styles.subsectionTitle}>
                    Required Information
                  </h3>
                  <ul className={styles.listItem}>
                    <li>Organization name and jurisdiction</li>
                    <li>Intended evaluation scope and end use</li>
                    <li>Points of contact and security lead</li>
                    <li>Export control considerations</li>
                  </ul>
                </div>
                <div className={styles.complianceBox}>
                  <p className={styles.complianceText}>
                    <strong>Compliance Notice:</strong> All activities must
                    comply with applicable laws, export controls, and end-user
                    restrictions. ITAR compliance required for defense
                    applications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className={styles.quickLinksSection}>
        <div className={styles.container}>
          <h2 className={styles.quickLinksTitle}>Explore Phoenix Rooivalk</h2>
          <div className={styles.quickLinksGrid}>
            <Link href="/technical" className={styles.quickLinkCard}>
              <h3 className={styles.quickLinkTitle}>
                Technical Specifications
              </h3>
              <p className={styles.quickLinkText}>
                Multi-sensor detection, neutralization modules, and deployment
                configurations.
              </p>
            </Link>
            <Link href="/financial" className={styles.quickLinkCard}>
              <h3 className={styles.quickLinkTitle}>Financial Projections</h3>
              <p className={styles.quickLinkText}>
                Revenue forecasts, break-even analysis, and investment
                allocation details.
              </p>
            </Link>
            <Link href="/compliance" className={styles.quickLinkCard}>
              <h3 className={styles.quickLinkTitle}>Compliance & Security</h3>
              <p className={styles.quickLinkText}>
                ITAR compliance, ISO certifications, and blockchain security
                framework.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Careers Section */}
      <section id="careers" className={styles.careersSection}>
        <div className={styles.container}>
          <h2 className={styles.careersTitle}>Career Opportunities</h2>

          {!loadingUser && user && user.is_team_member && (
            <div className={styles.teamMemberNotice}>
              <p>
                <strong>Welcome back, {getUserDisplayName()}!</strong>
                <br />
                You are already a team member. If you have any questions about
                your role or the team, please contact Jurie directly.
              </p>
            </div>
          )}

          {!loadingUser && !user && (
            <div className={styles.loginNotice}>
              <p>
                <strong>Please sign in to apply for positions</strong>
              </p>
              <Link href="/login" className={styles.loginLink}>
                Sign In / Create Account
              </Link>
            </div>
          )}

          <div className={styles.careersGrid}>
            <div className={styles.careerCard}>
              <h3 className={styles.careerCardTitle}>Current Openings</h3>
              <div className={styles.contentGroup}>
                <div>
                  <h4 className={styles.jobTitle}>Senior Software Engineer</h4>
                  <p className={styles.jobDescription}>
                    Lead development of counter-drone defense algorithms and
                    blockchain evidence systems.
                  </p>
                  <div className={styles.tagContainer}>
                    <span className={styles.tag}>TypeScript</span>
                    <span className={styles.tag}>Rust</span>
                    <span className={styles.tag}>Blockchain</span>
                  </div>
                </div>
                <div>
                  <h4 className={styles.jobTitle}>Defense Systems Engineer</h4>
                  <p className={styles.jobDescription}>
                    Design and implement RF jamming and GPS spoofing
                    countermeasures.
                  </p>
                  <div className={styles.tagContainer}>
                    <span className={styles.tag}>RF Engineering</span>
                    <span className={styles.tag}>Signal Processing</span>
                    <span className={styles.tag}>Military Systems</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.careerCard}>
              <h3 className={styles.careerCardTitle}>Application Process</h3>
              <div className={styles.contentGroup}>
                <div>
                  <h4 className={styles.jobTitle}>Requirements</h4>
                  <ul className={styles.listItem}>
                    <li>Security clearance eligibility</li>
                    <li>Relevant technical background</li>
                    <li>Defense industry experience preferred</li>
                    <li>Strong problem-solving skills</li>
                  </ul>
                </div>

                {!loadingUser && user && !user.is_team_member && (
                  <div>
                    <h4 className={styles.jobTitle}>Submit Your Application</h4>
                    <p className={styles.jobDescription}>
                      Welcome, {getUserDisplayName()}! Complete the form below
                      to apply.
                    </p>
                    <form
                      onSubmit={handleCareerApplication}
                      className={styles.applicationForm}
                    >
                      <div className={styles.formGroup}>
                        <label htmlFor="position" className={styles.formLabel}>
                          Position
                        </label>
                        <select
                          id="position"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          className={styles.formSelect}
                          required
                          disabled={applicationStatus === "submitting"}
                        >
                          <option value="">Select a position</option>
                          <option value="Senior Software Engineer">
                            Senior Software Engineer
                          </option>
                          <option value="Defense Systems Engineer">
                            Defense Systems Engineer
                          </option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label
                          htmlFor="coverLetter"
                          className={styles.formLabel}
                        >
                          Cover Letter (Optional)
                        </label>
                        <textarea
                          id="coverLetter"
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          className={styles.formTextarea}
                          rows={5}
                          placeholder="Tell us about your relevant experience and why you're interested in this position..."
                          disabled={applicationStatus === "submitting"}
                        />
                      </div>

                      {applicationError && (
                        <div className={styles.errorMessage} role="alert">
                          {applicationError}
                        </div>
                      )}

                      {applicationStatus === "success" && (
                        <div className={styles.successMessage} role="status">
                          Application submitted successfully! We&apos;ll be in
                          touch soon.
                        </div>
                      )}

                      <button
                        type="submit"
                        className={styles.applyButton}
                        disabled={applicationStatus === "submitting"}
                      >
                        {applicationStatus === "submitting"
                          ? "Submitting..."
                          : "Submit Application"}
                      </button>
                    </form>
                  </div>
                )}

                {!loadingUser && !user && (
                  <div>
                    <h4 className={styles.jobTitle}>Next Steps</h4>
                    <p className={styles.jobDescription}>
                      Sign in to submit your application. We&apos;ll
                      auto-populate your details from your email.
                    </p>
                    <Link href="/login" className={styles.applyButton}>
                      Sign In to Apply
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
