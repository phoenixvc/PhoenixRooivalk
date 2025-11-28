/**
 * Support Panel Component
 *
 * Provides support resources, FAQs, and contact options.
 */

import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supportService } from "../../services/supportService";
import "./SupportPanel.css";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is Phoenix Rooivalk?",
    answer:
      "Phoenix Rooivalk is an autonomous kinetic interceptor system designed to detect, track, and neutralize unauthorized drones. It provides comprehensive counter-UAS solutions for both commercial and defense applications.",
    category: "general",
  },
  {
    question: "How does the documentation personalization work?",
    answer:
      "Based on your selected role and interests, our AI-powered system recommends relevant documentation, news articles, and learning paths tailored to your specific needs and expertise level.",
    category: "platform",
  },
  {
    question: "What compliance certifications does Phoenix Rooivalk have?",
    answer:
      "Phoenix Rooivalk is designed with ITAR compliance in mind for defense applications. For specific certification details, please refer to our Legal & Compliance documentation section or contact our compliance team.",
    category: "compliance",
  },
  {
    question: "How can I request a demo or trial?",
    answer:
      "You can request a demo by contacting our sales team through the contact form below or by emailing sales@phoenixrooivalk.com. We offer tailored demonstrations based on your specific use case.",
    category: "sales",
  },
  {
    question: "What technical support options are available?",
    answer:
      "We offer multiple support tiers including documentation access, email support, and dedicated technical support for enterprise customers. Enterprise clients also have access to our priority support hotline.",
    category: "support",
  },
  {
    question: "How do I report a security vulnerability?",
    answer:
      "Security vulnerabilities should be reported confidentially to security@phoenixrooivalk.com. We have a responsible disclosure policy and appreciate reports from the security community.",
    category: "security",
  },
];

const SUPPORT_LINKS = [
  {
    title: "Technical Documentation",
    description: "Comprehensive technical guides and API references",
    href: "/docs/technical",
    icon: "📚",
  },
  {
    title: "Getting Started",
    description: "Quick start guides and tutorials",
    href: "/docs/intro",
    icon: "🚀",
  },
  {
    title: "API Reference",
    description: "Complete API documentation and examples",
    href: "/docs/technical/api",
    icon: "⚙️",
  },
  {
    title: "Community Forum",
    description: "Connect with other users and experts",
    href: "https://community.phoenixrooivalk.com",
    icon: "💬",
    external: true,
  },
];

interface SupportPanelProps {
  showContactForm?: boolean;
}

export function SupportPanel({
  showContactForm = true,
}: SupportPanelProps): React.ReactElement {
  const { user } = useAuth();
  const toast = useToast();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [contactForm, setContactForm] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    subject: "",
    message: "",
    category: "general",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categories = [
    "all",
    ...new Set(FAQ_ITEMS.map((item) => item.category)),
  ];

  const filteredFAQs =
    selectedCategory === "all"
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === selectedCategory);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage(null);

    try {
      const response = await supportService.submitContactForm({
        name: contactForm.name,
        email: contactForm.email,
        subject: contactForm.subject,
        message: contactForm.message,
        category: contactForm.category as "general" | "technical" | "sales" | "partnership" | "feedback",
      });

      setTicketNumber(response.ticketNumber);
      setSubmitStatus("success");
      toast.success(`Message sent! Ticket #${response.ticketNumber}`);
      setContactForm({
        name: user?.displayName || "",
        email: user?.email || "",
        subject: "",
        message: "",
        category: "general",
      });
    } catch (error) {
      console.error("Failed to submit contact form:", error);
      const message = error instanceof Error
        ? error.message
        : "Failed to submit. Please try again or email us directly.";
      setErrorMessage(message);
      setSubmitStatus("error");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="support-panel">
      <div className="support-header">
        <h1 className="support-title">
          <span className="support-icon">🛟</span>
          Support Center
        </h1>
        <p className="support-subtitle">
          Find answers, get help, and connect with our team
        </p>
      </div>

      {/* Quick Links */}
      <section className="support-section">
        <h2 className="support-section-title">Quick Access</h2>
        <div className="support-links-grid">
          {SUPPORT_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="support-link-card"
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
            >
              <span className="support-link-icon">{link.icon}</span>
              <div className="support-link-content">
                <h3 className="support-link-title">
                  {link.title}
                  {link.external && <span className="external-icon">↗</span>}
                </h3>
                <p className="support-link-description">{link.description}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="support-section">
        <h2 className="support-section-title">Frequently Asked Questions</h2>

        <div className="faq-filters">
          {categories.map((category) => (
            <button
              key={category}
              className={`faq-filter-btn ${selectedCategory === category ? "active" : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === "all" ? "All" : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <div className="faq-list" role="list">
          {filteredFAQs.map((item, index) => (
            <details
              key={index}
              className="faq-item"
              open={expandedFAQ === index}
              onToggle={(e) => {
                const isOpen = (e.target as HTMLDetailsElement).open;
                setExpandedFAQ(isOpen ? index : null);
              }}
            >
              <summary className="faq-question">
                <span className="faq-question-text">{item.question}</span>
                <span className="faq-toggle" aria-hidden="true">
                  {expandedFAQ === index ? "−" : "+"}
                </span>
              </summary>
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      {showContactForm && (
        <section className="support-section">
          <h2 className="support-section-title">Contact Us</h2>

          {submitStatus === "success" ? (
            <div className="contact-success">
              <span className="contact-success-icon">✓</span>
              <h3>Message Sent!</h3>
              {ticketNumber && (
                <p className="contact-ticket-number">
                  Your ticket number: <strong>{ticketNumber}</strong>
                </p>
              )}
              <p>
                Thank you for reaching out. Our team will respond within 1-2
                business days.
              </p>
              <button
                className="contact-reset-btn"
                onClick={() => {
                  setSubmitStatus("idle");
                  setTicketNumber(null);
                }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleContactSubmit}>
              <div className="contact-form-row">
                <div className="contact-form-group">
                  <label htmlFor="contact-name">Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, name: e.target.value })
                    }
                    required
                    placeholder="Your name"
                  />
                </div>
                <div className="contact-form-group">
                  <label htmlFor="contact-email">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    required
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="contact-form-row">
                <div className="contact-form-group">
                  <label htmlFor="contact-category">Category</label>
                  <select
                    id="contact-category"
                    value={contactForm.category}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        category: e.target.value,
                      })
                    }
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="sales">Sales & Pricing</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>
                <div className="contact-form-group">
                  <label htmlFor="contact-subject">Subject</label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        subject: e.target.value,
                      })
                    }
                    required
                    placeholder="Brief subject"
                  />
                </div>
              </div>

              <div className="contact-form-group">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                  required
                  placeholder="How can we help you?"
                  rows={5}
                />
              </div>

              {submitStatus === "error" && (
                <div className="contact-error">
                  {errorMessage || "Something went wrong. Please try again or email us directly."}
                </div>
              )}

              <button
                type="submit"
                className="contact-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </section>
      )}

      {/* Additional Support Options */}
      <section className="support-section">
        <h2 className="support-section-title">Other Ways to Reach Us</h2>
        <div className="support-contacts">
          <div className="support-contact-card">
            <span className="support-contact-icon">📧</span>
            <h3>Email Support</h3>
            <p>For general inquiries and technical support</p>
            <a href="mailto:support@phoenixrooivalk.com">
              support@phoenixrooivalk.com
            </a>
          </div>
          <div className="support-contact-card">
            <span className="support-contact-icon">💼</span>
            <h3>Enterprise Sales</h3>
            <p>For enterprise licensing and custom solutions</p>
            <a href="mailto:sales@phoenixrooivalk.com">
              sales@phoenixrooivalk.com
            </a>
          </div>
          <div className="support-contact-card">
            <span className="support-contact-icon">🔒</span>
            <h3>Security</h3>
            <p>Report security vulnerabilities confidentially</p>
            <a href="mailto:security@phoenixrooivalk.com">
              security@phoenixrooivalk.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SupportPanel;
