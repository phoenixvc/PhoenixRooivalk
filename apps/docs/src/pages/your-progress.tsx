import React from "react";
import Layout from "@theme/Layout";
import {
  ReadingProgressCard,
  AchievementsPanel,
  DocJourney,
} from "../components/Gamification";

import "../css/gamification.css";

export default function YourProgress(): React.ReactElement {
  return (
    <Layout
      title="Your Progress"
      description="Track your learning progress through Phoenix Rooivalk documentation"
    >
      <main className="container margin-vert--xl">
        <div className="row">
          <div className="col col--12">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <h1
                style={{
                  fontSize: "3rem",
                  fontWeight: 800,
                  background:
                    "linear-gradient(135deg, rgb(249, 115, 22), rgb(251, 191, 36))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: "1rem",
                  borderBottom: "none",
                }}
              >
                Your Learning Journey
              </h1>
              <p
                style={{
                  fontSize: "1.25rem",
                  color: "rgb(148, 163, 184)",
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                Track your progress, earn achievements, and master the Phoenix
                Rooivalk documentation
              </p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col col--12">
            <ReadingProgressCard />
          </div>
        </div>

        <div className="row margin-top--lg">
          <div className="col col--12">
            <DocJourney />
          </div>
        </div>

        <div className="row margin-top--xl">
          <div className="col col--12">
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "rgb(242, 244, 246)",
                marginBottom: "1.5rem",
                textAlign: "center",
                borderBottom: "none",
              }}
            >
              Your Achievements
            </h2>
            <AchievementsPanel />
          </div>
        </div>

        <div className="row margin-top--xl">
          <div className="col col--12">
            <div
              style={{
                background: "rgba(30, 41, 59, 0.8)",
                border: "1px solid rgb(51, 65, 85)",
                borderRadius: "16px",
                padding: "2rem",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  color: "rgb(242, 244, 246)",
                  marginBottom: "1rem",
                  borderBottom: "none",
                }}
              >
                Ready to continue learning?
              </h3>
              <p style={{ color: "rgb(148, 163, 184)", marginBottom: "1.5rem" }}>
                Dive into the documentation to unlock more achievements and
                complete your learning paths.
              </p>
              <a
                href="/docs"
                className="button button--primary button--lg"
                style={{ marginRight: "1rem" }}
              >
                Start Reading
              </a>
              <a
                href="/docs/resources/downloads"
                className="button button--secondary button--lg"
              >
                Download PDFs
              </a>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
