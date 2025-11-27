/**
 * Profile Completion Component
 *
 * Collects user profile details after signup:
 * - First name, Last name (required)
 * - LinkedIn, Discord (required)
 * - WhatsApp (optional)
 */

import React, { useState, useCallback } from "react";
import "./ProfileCompletion.css";

export interface UserProfileDetails {
  firstName: string;
  lastName: string;
  linkedIn: string;
  discord: string;
  whatsApp: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  linkedIn?: string;
  discord?: string;
}

interface ProfileCompletionProps {
  onComplete: (details: UserProfileDetails) => void;
  initialData?: Partial<UserProfileDetails>;
}

// LinkedIn URL validation regex
const LINKEDIN_REGEX =
  /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|profile)\/[\w-]+\/?$/i;

// Discord username validation (username#0000 or new username format)
const DISCORD_REGEX = /^.{2,32}(#\d{4})?$/;

export function ProfileCompletion({
  onComplete,
  initialData,
}: ProfileCompletionProps): React.ReactElement {
  const [formData, setFormData] = useState<UserProfileDetails>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    linkedIn: initialData?.linkedIn || "",
    discord: initialData?.discord || "",
    whatsApp: initialData?.whatsApp || "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (field: keyof UserProfileDetails, value: string): string | undefined => {
      switch (field) {
        case "firstName":
          if (!value.trim()) return "First name is required";
          if (value.trim().length < 2)
            return "First name must be at least 2 characters";
          return undefined;

        case "lastName":
          if (!value.trim()) return "Last name is required";
          if (value.trim().length < 2)
            return "Last name must be at least 2 characters";
          return undefined;

        case "linkedIn":
          if (!value.trim()) return "LinkedIn profile is required";
          if (!LINKEDIN_REGEX.test(value.trim()))
            return "Please enter a valid LinkedIn profile URL";
          return undefined;

        case "discord":
          if (!value.trim()) return "Discord username is required";
          if (!DISCORD_REGEX.test(value.trim()))
            return "Please enter a valid Discord username";
          return undefined;

        default:
          return undefined;
      }
    },
    [],
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    const requiredFields: (keyof ValidationErrors)[] = [
      "firstName",
      "lastName",
      "linkedIn",
      "discord",
    ];

    for (const field of requiredFields) {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  const handleChange = (field: keyof UserProfileDetails, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (touched[field] && errors[field as keyof ValidationErrors]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: keyof UserProfileDetails) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      firstName: true,
      lastName: true,
      linkedIn: true,
      discord: true,
      whatsApp: true,
    });

    if (validateForm()) {
      onComplete({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        linkedIn: formData.linkedIn.trim(),
        discord: formData.discord.trim(),
        whatsApp: formData.whatsApp.trim(),
      });
    }
  };

  return (
    <form className="profile-completion" onSubmit={handleSubmit}>
      <div className="profile-completion-header">
        <span className="profile-completion-icon">📝</span>
        <h2 className="profile-completion-title">Complete Your Profile</h2>
        <p className="profile-completion-subtitle">
          Tell us a bit about yourself so we can personalize your experience
        </p>
      </div>

      <div className="profile-completion-fields">
        <div className="profile-completion-row">
          <div className="profile-completion-field">
            <label htmlFor="firstName" className="profile-completion-label">
              First Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              className={`profile-completion-input ${
                touched.firstName && errors.firstName ? "error" : ""
              }`}
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
              placeholder="Your first name"
              autoComplete="given-name"
            />
            {touched.firstName && errors.firstName && (
              <span className="profile-completion-error">
                {errors.firstName}
              </span>
            )}
          </div>

          <div className="profile-completion-field">
            <label htmlFor="lastName" className="profile-completion-label">
              Last Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              className={`profile-completion-input ${
                touched.lastName && errors.lastName ? "error" : ""
              }`}
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              onBlur={() => handleBlur("lastName")}
              placeholder="Your last name"
              autoComplete="family-name"
            />
            {touched.lastName && errors.lastName && (
              <span className="profile-completion-error">
                {errors.lastName}
              </span>
            )}
          </div>
        </div>

        <div className="profile-completion-field">
          <label htmlFor="linkedIn" className="profile-completion-label">
            LinkedIn Profile <span className="required">*</span>
          </label>
          <input
            type="url"
            id="linkedIn"
            className={`profile-completion-input ${
              touched.linkedIn && errors.linkedIn ? "error" : ""
            }`}
            value={formData.linkedIn}
            onChange={(e) => handleChange("linkedIn", e.target.value)}
            onBlur={() => handleBlur("linkedIn")}
            placeholder="https://linkedin.com/in/yourprofile"
            autoComplete="url"
          />
          {touched.linkedIn && errors.linkedIn && (
            <span className="profile-completion-error">{errors.linkedIn}</span>
          )}
          <span className="profile-completion-hint">
            We&apos;ll use this to learn more about your background
          </span>
        </div>

        <div className="profile-completion-field">
          <label htmlFor="discord" className="profile-completion-label">
            Discord Username <span className="required">*</span>
          </label>
          <input
            type="text"
            id="discord"
            className={`profile-completion-input ${
              touched.discord && errors.discord ? "error" : ""
            }`}
            value={formData.discord}
            onChange={(e) => handleChange("discord", e.target.value)}
            onBlur={() => handleBlur("discord")}
            placeholder="yourusername or username#0000"
            autoComplete="nickname"
          />
          {touched.discord && errors.discord && (
            <span className="profile-completion-error">{errors.discord}</span>
          )}
        </div>

        <div className="profile-completion-field">
          <label htmlFor="whatsApp" className="profile-completion-label">
            WhatsApp Number <span className="optional">(optional)</span>
          </label>
          <input
            type="tel"
            id="whatsApp"
            className="profile-completion-input"
            value={formData.whatsApp}
            onChange={(e) => handleChange("whatsApp", e.target.value)}
            placeholder="+27 82 123 4567"
            autoComplete="tel"
          />
          <span className="profile-completion-hint">
            For team communication (optional)
          </span>
        </div>
      </div>

      <button type="submit" className="profile-completion-submit">
        Continue
      </button>
    </form>
  );
}

export default ProfileCompletion;
