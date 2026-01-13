import * as React from "react";
import Image from "next/image";
import styles from "./CaseStudiesSection.module.css";
import { caseStudiesData } from "./data/caseStudiesData";

export const CaseStudiesSection: React.FC = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Case Studies</h2>
          <p className={styles.subtitle}>
            Explore how Phoenix Rooivalk&apos;s technology is being applied in
            real-world scenarios.
          </p>
        </div>
        <div className={styles.disclaimer}>
          <p>
            Please note: The following case studies are fictional and are
            intended for illustrative purposes only.
          </p>
        </div>
        <div className={styles.grid}>
          {caseStudiesData.map((study, index) => (
            <div key={index} className={styles.card}>
              <Image
                src={study.imageUrl}
                alt={study.title}
                width={500}
                height={300}
                className={styles.image}
              />
              <div className={styles.content}>
                <h3 className={styles.studyTitle}>{study.title}</h3>
                <p className={styles.summary}>{study.summary}</p>
                <div className={styles.metricsGrid}>
                  {study.metrics.map((metric, metricIndex) => (
                    <div key={metricIndex} className={styles.metricBox}>
                      <div className={styles.metricValue}>{metric.value}</div>
                      <div className={styles.metricLabel}>{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
