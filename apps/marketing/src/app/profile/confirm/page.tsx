"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "../../../config/constants";
import styles from "./confirm.module.css";

interface ProfileData {
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

export default function ProfileConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileData, setProfileData] = useState<ProfileData>({
    email: "",
    firstName: "",
    lastName: "",
    profilePicture: "",
  });

  useEffect(() => {
    // Get data from OAuth callback (stored in URL params or localStorage)
    const email = searchParams?.get("email") || "";
    const firstName = searchParams?.get("firstName") || "";
    const lastName = searchParams?.get("lastName") || "";
    const picture = searchParams?.get("picture") || "";

    // Alternatively, check sessionStorage for OAuth data (more secure)
    if (typeof window !== "undefined") {
      const oauthData = sessionStorage.getItem("oauth_profile");
      if (oauthData) {
        try {
          const data = JSON.parse(oauthData);
          setProfileData({
            email: data.email || email,
            firstName: data.given_name || firstName,
            lastName: data.family_name || lastName,
            profilePicture: data.picture || picture,
          });
          // Clear OAuth data from sessionStorage
          sessionStorage.removeItem("oauth_profile");
        } catch (err) {
          console.error("Failed to parse OAuth data:", err);
        }
      } else {
        setProfileData({
          email,
          firstName,
          lastName,
          profilePicture: picture,
        });
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const sessionId = localStorage.getItem("session_id");
      if (!sessionId) {
        throw new Error("No active session. Please log in again.");
      }

      // Update user profile - API expects session_id as query parameter
      const response = await fetch(
        `${API_BASE_URL}/auth/profile?session_id=${encodeURIComponent(sessionId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            // Note: email is read-only from OAuth provider
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();

      // Update local storage with confirmed profile
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("profile_confirmed", "true");
      }

      // Redirect to intended destination
      const redirect = searchParams?.get("redirect") || "/contact#careers";
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Mark as skipped but allow access
    if (typeof window !== "undefined") {
      localStorage.setItem("profile_confirmed", "skipped");
    }

    const redirect = searchParams?.get("redirect") || "/contact#careers";
    router.push(redirect);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Confirm Your Profile</h1>
          <p className={styles.subtitle}>
            Please verify your information from Google
          </p>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {profileData.profilePicture && (
            <div className={styles.pictureContainer}>
              <img
                src={profileData.profilePicture}
                alt="Profile"
                className={styles.picture}
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
              <span className={styles.readOnly}>(from Google)</span>
            </label>
            <input
              id="email"
              type="email"
              value={profileData.email}
              className={`${styles.input} ${styles.readOnlyInput}`}
              readOnly
              disabled
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="firstName" className={styles.label}>
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={profileData.firstName}
              onChange={(e) =>
                setProfileData({ ...profileData, firstName: e.target.value })
              }
              className={styles.input}
              placeholder="John"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="lastName" className={styles.label}>
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={profileData.lastName}
              onChange={(e) =>
                setProfileData({ ...profileData, lastName: e.target.value })
              }
              className={styles.input}
              placeholder="Doe"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={styles.confirmButton}
              disabled={loading}
            >
              {loading ? "Confirming..." : "Confirm Profile"}
            </button>

            <button
              type="button"
              className={styles.skipButton}
              onClick={handleSkip}
              disabled={loading}
            >
              Skip for Now
            </button>
          </div>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            You can update your profile information later in your account
            settings.
          </p>
        </div>
      </div>
    </div>
  );
}
