/**
 * Access Application Form Component
 *
 * A form for external users to apply for access to internal team roles.
 * Submits applications to Cosmos DB for admin review.
 */

import React, { useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./AccessApplicationForm.css";

export interface AccessApplication {
  userId: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  company: string;
  currentRole: string;
  requestedRole: string;
  reason: string;
  linkedIn?: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

interface AccessApplicationFormProps {
  requestedRole: string;
  onSubmit: (application: Omit<AccessApplication, "userId" | "email" | "displayName" | "submittedAt" | "status">) => Promise<boolean>;
  onCancel: () => void;
  onBack?: () => void;
}

export function AccessApplicationForm({
  requestedRole,
  onSubmit,
  onCancel,
  onBack,
}: AccessApplicationFormProps): React.ReactElement {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.displayName?.split(" ")[0] || "",
    lastName: user?.displayName?.split(" ").slice(1).join(" ") || "",
    company: "",
    currentRole: "",
    reason: "",
    linkedIn: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.company.trim()) {
      newErrors.company = "Company/Organization is required";
    }
    if (!formData.currentRole.trim()) {
      newErrors.currentRole = "Current role is required";
    }
    if (!formData.reason.trim()) {
      newErrors.reason = "Please explain why you need access";
    } else if (formData.reason.trim().length < 50) {
      newErrors.reason = "Please provide more detail (at least 50 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onSubmit({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        company: formData.company.trim(),
        currentRole: formData.currentRole.trim(),
        requestedRole,
        reason: formData.reason.trim(),
        linkedIn: formData.linkedIn.trim() || undefined,
      });

      if (success) {
        setSubmitSuccess(true);
      } else {
        setSubmitError("Failed to submit application. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      setSubmitError("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success message after submission
  if (submitSuccess) {
    return (
      <div className="access-form-success">
        <div className="access-form-success-icon">✓</div>
        <h3>Application Submitted!</h3>
        <p>
          Thank you for your application. Our team will review your request
          and get back to you within 2-3 business days.
        </p>
        <p className="access-form-success-note">
          You'll receive an email notification at <strong>{user?.email}</strong>{" "}
          once your application has been reviewed.
        </p>
        <button
          type="button"
          className="access-form-btn access-form-btn--primary"
          onClick={onCancel}
        >
          Continue to Documentation
        </button>
      </div>
    );
  }

  return (
    <form className="access-form" onSubmit={handleSubmit}>
      <div className="access-form-header">
        <h3>Apply for {requestedRole} Access</h3>
        <p>
          This role requires verification. Please provide some information
          about yourself so we can review your request.
        </p>
      </div>

      {submitError && (
        <div className="access-form-error-banner">
          {submitError}
        </div>
      )}

      <div className="access-form-fields">
        <div className="access-form-row">
          <div className="access-form-field">
            <label htmlFor="firstName">
              First Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              className={errors.firstName ? "error" : ""}
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <span className="access-form-field-error">{errors.firstName}</span>
            )}
          </div>
          <div className="access-form-field">
            <label htmlFor="lastName">
              Last Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              className={errors.lastName ? "error" : ""}
              disabled={isSubmitting}
            />
            {errors.lastName && (
              <span className="access-form-field-error">{errors.lastName}</span>
            )}
          </div>
        </div>

        <div className="access-form-field">
          <label htmlFor="company">
            Company / Organization <span className="required">*</span>
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Acme Corporation"
            className={errors.company ? "error" : ""}
            disabled={isSubmitting}
          />
          {errors.company && (
            <span className="access-form-field-error">{errors.company}</span>
          )}
        </div>

        <div className="access-form-field">
          <label htmlFor="currentRole">
            Your Current Role <span className="required">*</span>
          </label>
          <input
            type="text"
            id="currentRole"
            name="currentRole"
            value={formData.currentRole}
            onChange={handleChange}
            placeholder="Software Engineer, Product Manager, etc."
            className={errors.currentRole ? "error" : ""}
            disabled={isSubmitting}
          />
          {errors.currentRole && (
            <span className="access-form-field-error">{errors.currentRole}</span>
          )}
        </div>

        <div className="access-form-field">
          <label htmlFor="linkedIn">LinkedIn Profile (Optional)</label>
          <input
            type="url"
            id="linkedIn"
            name="linkedIn"
            value={formData.linkedIn}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/yourprofile"
            disabled={isSubmitting}
          />
        </div>

        <div className="access-form-field">
          <label htmlFor="reason">
            Why do you need access to {requestedRole} documentation?{" "}
            <span className="required">*</span>
          </label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Please explain your interest in Phoenix Rooivalk and why you need access to this documentation..."
            rows={4}
            className={errors.reason ? "error" : ""}
            disabled={isSubmitting}
          />
          {errors.reason && (
            <span className="access-form-field-error">{errors.reason}</span>
          )}
          <span className="access-form-field-hint">
            {formData.reason.length}/50 characters minimum
          </span>
        </div>
      </div>

      <div className="access-form-footer">
        <div className="access-form-footer-left">
          {onBack && (
            <button
              type="button"
              className="access-form-btn access-form-btn--back"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Back
            </button>
          )}
        </div>
        <div className="access-form-footer-right">
          <button
            type="button"
            className="access-form-btn access-form-btn--secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Skip for now
          </button>
          <button
            type="submit"
            className="access-form-btn access-form-btn--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>

      <p className="access-form-note">
        By submitting this application, you agree to our terms of service and
        acknowledge that your information will be reviewed by the Phoenix
        Rooivalk team.
      </p>
    </form>
  );
}

export default AccessApplicationForm;
