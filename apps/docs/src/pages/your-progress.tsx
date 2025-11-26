import Layout from "@theme/Layout";
import React from "react";

import {
  ReadingProgressCard,
  AchievementsPanel,
  DocJourney,
  UserProfile,
} from "../components/Gamification";

import "../css/gamification.css";
import styles from "./your-progress.module.css";

export default function YourProgress(): React.ReactElement {
  return (
    <Layout
      title="Your Progress"
      description="Track your learning progress through Phoenix Rooivalk documentation"
    >
      <main
        className="container margin-vert--xl"
        aria-label="Learning progress dashboard"
      >
        <div className="row">
          <div className="col col--12">
            <header className={styles.hero}>
              <h1 className={styles.heroTitle}>Your Learning Journey</h1>
              <p className={styles.heroDescription}>
                Track your progress, earn achievements, and master the Phoenix
                Rooivalk documentation
              </p>
            </header>
          </div>
        </div>

        {/* Cloud Sync Section */}
        <section className="row margin-bottom--lg" aria-label="User profile">
          <div className="col col--8 col--offset-2">
            <UserProfile />
          </div>
        </section>

        <section className="row" aria-label="Reading progress">
          <div className="col col--12">
            <ReadingProgressCard />
          </div>
        </section>

        <section
          className="row margin-top--lg"
          aria-label="Documentation journey"
        >
          <div className="col col--12">
            <DocJourney />
          </div>
        </section>

        <section
          className="row margin-top--xl"
          aria-label="Achievements overview"
        >
          <div className="col col--12">
            <h2 className={styles.sectionTitle}>Your Achievements</h2>
            <AchievementsPanel />
          </div>
        </section>

        <section className="row margin-top--xl" aria-label="Call to action">
          <div className="col col--12">
            <div className={styles.ctaCard}>
              <h3 className={styles.ctaTitle}>Ready to continue learning?</h3>
              <p className={styles.ctaDescription}>
                Dive into the documentation to unlock more achievements and
                complete your learning paths.
              </p>
              <a
                href="/docs"
                className={`button button--primary button--lg ${styles.ctaButton}`}
                aria-label="Start reading documentation"
              >
                Start Reading
              </a>
              <a
                href="/docs/resources/downloads"
                className="button button--secondary button--lg"
                aria-label="Download documentation as PDF"
              >
                Download PDFs
              </a>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
