/**
 * Project Calendar Page
 *
 * Displays all project dates, deadlines, milestones, and events
 * in a unified timeline view.
 */

import React, { useState, useMemo } from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import { downloadICS, generateICS, type CalendarEvent } from "../components/Calendar";
import BookingWidget from "../components/Calendar/BookingWidget";
import styles from "./calendar.module.css";

// Team member assignments
type TeamMember = "all" | "martyn" | "peter" | "jurie" | "alistair" | "team";

interface CalendarItem {
  date: string;
  title: string;
  description: string;
  category: "opportunity" | "development" | "compliance" | "meeting" | "funding" | "hackathon" | "accelerator";
  priority: "critical" | "high" | "medium" | "low";
  link?: string;
  assignee?: TeamMember;
  completed?: boolean;
  weeklyTarget?: number; // Target percentage progress per week for larger items
}

const teamConfig: Record<TeamMember, { label: string; color: string; initials: string }> = {
  all: { label: "Everyone", color: "#6b7280", initials: "ALL" },
  team: { label: "Core Team", color: "#8b5cf6", initials: "TM" },
  martyn: { label: "Martyn", color: "#ef4444", initials: "MR" },
  peter: { label: "Peter", color: "#3b82f6", initials: "PL" },
  jurie: { label: "Jurie", color: "#22c55e", initials: "JS" },
  alistair: { label: "Alistair", color: "#f59e0b", initials: "AK" },
};

// All calendar events consolidated from project data
const calendarEvents: CalendarItem[] = [
  // ============================================
  // Q4 2025 - IMMEDIATE DEADLINES
  // ============================================
  {
    date: "2025-12-01",
    title: "Movement M1 Hackathon Starts",
    description: "4-week hackathon, $30K prize pool - Move language for evidence anchoring",
    category: "hackathon",
    priority: "high",
    assignee: "jurie",
    weeklyTarget: 25,
  },
  {
    date: "2025-12-06",
    title: "Encode Club Scoop AI London",
    description: "London event, $10K prizes, AI agent track",
    category: "hackathon",
    priority: "medium",
    assignee: "jurie",
    link: "https://www.encode.club/",
  },
  {
    date: "2025-12-11",
    title: "Strategic Meeting - Alistair Advisory",
    description: "Define partnership terms, accelerator strategy, market pivot to airport defense",
    category: "meeting",
    priority: "critical",
    assignee: "team",
    link: "/docs/executive/meeting-notes/2025-12-11-strategic-resources-action-tracker",
  },
  {
    date: "2025-12-15",
    title: "Canada CUAS Sandbox Application Deadline",
    description: "Submit application via PriviDox by 2:00 PM ET - $1.75M CAD prize pool",
    category: "opportunity",
    priority: "critical",
    assignee: "martyn",
    link: "/docs/business/opportunities/cuas-sandbox-2026",
  },
  {
    date: "2025-12-15",
    title: "Solana Winter Build Challenge",
    description: "4-week sprint, $10K+ prizes, x402 payment protocol integration",
    category: "hackathon",
    priority: "high",
    assignee: "jurie",
    weeklyTarget: 25,
  },
  {
    date: "2025-12-18",
    title: "Receive Alistair's Accelerator List",
    description: "Hardware-focused accelerators and pre-seed investors list (US focus)",
    category: "meeting",
    priority: "high",
    assignee: "alistair",
  },
  {
    date: "2025-12-20",
    title: "Prepare Gazebo Simulator Demo",
    description: "Build simulator demonstration for investor pitches per Alistair recommendation",
    category: "development",
    priority: "high",
    assignee: "peter",
  },
  {
    date: "2025-12-31",
    title: "AWS Kiro Startup Credits Deadline",
    description: "Free Kiro Pro+ access - Apply before year end",
    category: "funding",
    priority: "high",
    assignee: "jurie",
    link: "https://aws.amazon.com/blogs/aws/kiro-ai-powered-ide-for-building-applications-on-aws/",
  },
  {
    date: "2025-12-31",
    title: "Q4 2025 Milestone Review",
    description: "Quarterly review of progress and objectives",
    category: "meeting",
    priority: "high",
    assignee: "team",
  },
  {
    date: "2025-12-31",
    title: "AWS Activate Founders Credits",
    description: "Apply for $1K-$100K AWS credits for cloud, IoT, and ML services",
    category: "funding",
    priority: "high",
    assignee: "jurie",
    link: "/docs/business/opportunities/cloud-credits-programs",
  },

  // ============================================
  // Q1 2026
  // ============================================
  {
    date: "2026-01-01",
    title: "DARPA Lift Challenge Registration Opens",
    description: "Heavy-lift drone challenge, $6.5M total prizes - registration closes May 2026",
    category: "opportunity",
    priority: "high",
    assignee: "peter",
    link: "https://www.darpa.mil/news/2025/lift-challenge",
    weeklyTarget: 10,
  },
  {
    date: "2026-01-05",
    title: "CrowdStrike Cybersecurity Accelerator Begins",
    description: "8-week program with AWS & NVIDIA, runs Jan 5 - Mar 3, 2026",
    category: "accelerator",
    priority: "medium",
    assignee: "jurie",
    link: "https://www.crowdstrike.com/en-us/press-releases/crowdstrike-launches-startup-accelerator/",
  },
  {
    date: "2026-01-06",
    title: "NATO DIANA Accelerator Phase 1 Begins",
    description: "6-month program, €100K funding, access to 200+ test centres across NATO",
    category: "accelerator",
    priority: "critical",
    assignee: "martyn",
    link: "/docs/business/opportunities/nato-diana-accelerator",
  },
  {
    date: "2026-01-06",
    title: "VTT DIANA Finland - Advanced Communications",
    description: "NATO DIANA site focusing on secure networks, RF, quantum encryption",
    category: "accelerator",
    priority: "high",
    assignee: "peter",
    link: "/docs/business/opportunities/nato-diana-accelerator",
  },
  {
    date: "2026-01-10",
    title: "SOSV HAX Accelerator Application",
    description: "Hardware accelerator - $250K funding, 10% equity. Per Alistair recommendation.",
    category: "accelerator",
    priority: "critical",
    assignee: "martyn",
    link: "/docs/business/opportunities/sosv-hax-accelerator",
    weeklyTarget: 25,
  },
  {
    date: "2026-01-15",
    title: "Prototype Validation Target",
    description: "Net launcher prototype manufactured and validated",
    category: "development",
    priority: "critical",
    assignee: "peter",
    link: "/docs/progress/progress-overview",
    weeklyTarget: 20,
  },
  {
    date: "2026-01-15",
    title: "mHUB Chicago Accelerator Application",
    description: "$200K investment, 6.5% equity, access to $6M prototyping labs",
    category: "accelerator",
    priority: "high",
    assignee: "martyn",
    link: "/docs/business/opportunities/mhub-chicago",
  },
  {
    date: "2026-01-20",
    title: "Research Middle East Innovation Hubs",
    description: "UAE, Abu Dhabi tech hubs - per Alistair's contacts recommendation",
    category: "opportunity",
    priority: "medium",
    assignee: "alistair",
  },
  {
    date: "2026-01-31",
    title: "NVIDIA Inception Program Application",
    description: "Apply for $150K+ cloud credits, hardware discounts",
    category: "funding",
    priority: "high",
    assignee: "jurie",
    link: "/docs/business/opportunities/cloud-credits-programs",
  },
  {
    date: "2026-02-04",
    title: "Counter-UAS Homeland Security USA 2026",
    description: "Conference Feb 4-5, United States - networking & demo opportunity",
    category: "opportunity",
    priority: "medium",
    assignee: "martyn",
    link: "https://www.unmannedsystemstechnology.com/events/counter-uas-homeland-security-usa/",
  },
  {
    date: "2026-02-10",
    title: "DIU Defense Tech Accelerator Application",
    description: "4-month program in Renton WA, $15K funding, C-UAS focus area",
    category: "accelerator",
    priority: "high",
    assignee: "martyn",
    link: "https://www.diu.mil/",
  },
  {
    date: "2026-02-15",
    title: "Canada CUAS Selection Notification",
    description: "Expected notification 6-8 weeks after deadline",
    category: "opportunity",
    priority: "high",
    assignee: "martyn",
  },
  {
    date: "2026-02-15",
    title: "Crucible Accelerator (NavalX) Application",
    description: "10-week program, $75K prize, naval tech focus. TRL 4-6 required.",
    category: "accelerator",
    priority: "high",
    assignee: "martyn",
    link: "https://www.navalx.org/crucible",
  },
  {
    date: "2026-02-28",
    title: "Google for Startups AI Accelerator Application",
    description: "10-12 weeks program, $350K cloud credits for AI-first startups",
    category: "funding",
    priority: "high",
    assignee: "jurie",
    link: "/docs/business/opportunities/cloud-credits-programs",
  },
  {
    date: "2026-02-09",
    title: "Y Combinator S26 Application Deadline",
    description: "$500K investment, defense tech now accepted. Delaware entity required.",
    category: "accelerator",
    priority: "critical",
    assignee: "martyn",
    link: "/docs/business/opportunities/y-combinator",
    weeklyTarget: 20,
  },
  {
    date: "2026-03-01",
    title: "First EU Pilot Installation",
    description: "Initial deployment in European market - airport defense focus",
    category: "development",
    priority: "critical",
    assignee: "team",
    weeklyTarget: 15,
  },
  {
    date: "2026-03-01",
    title: "National Congress Counter-UAS Technology 2026",
    description: "4th Annual conference Mar 18-19 - key networking for airport defense market",
    category: "opportunity",
    priority: "medium",
    assignee: "martyn",
    link: "https://www.unmannedsystemstechnology.com/events/",
  },
  {
    date: "2026-03-01",
    title: "EUDIS Defence Hackathon 2026",
    description: "EU-funded hackathon: autonomous systems, cyber defense, aerospace tech",
    category: "hackathon",
    priority: "high",
    assignee: "team",
  },
  {
    date: "2026-03-09",
    title: "Techstars Anywhere Accelerator Begins",
    description: "Remote accelerator program, Demo Day June 4, 2026",
    category: "accelerator",
    priority: "medium",
    assignee: "martyn",
    link: "/docs/business/opportunities/techstars-programs",
  },
  {
    date: "2026-03-16",
    title: "NVIDIA GTC 2026 San Jose",
    description: "AI conference March 16-19, meet Inception startups, pitch opportunities",
    category: "opportunity",
    priority: "high",
    assignee: "jurie",
  },
  {
    date: "2026-03-15",
    title: "DHS C-UAS Grant Program Opens",
    description: "FY2026 state/local grants for C-UAS capabilities - $500M total",
    category: "opportunity",
    priority: "high",
    assignee: "martyn",
    link: "https://www.dhs.gov/science-and-technology/countering-unmanned-aircraft-systems",
  },
  {
    date: "2026-03-31",
    title: "CPSC/ASTM/EN-71 Certification",
    description: "Safety certification for consumer product",
    category: "compliance",
    priority: "critical",
    assignee: "peter",
  },
  {
    date: "2026-03-31",
    title: "Operation Flytrap 5.0",
    description: "Army xTechCounter Strike live competition, $350K winners - Project FlyTrap series",
    category: "opportunity",
    priority: "high",
    assignee: "team",
    link: "https://www.army.mil/article/289184/air_defenders_in_europe_test_new_counter_uas_technologies_during_project_flytrap_4_5",
    weeklyTarget: 15,
  },
  {
    date: "2026-03-31",
    title: "Q1 2026 Milestone Review",
    description: "End of quarter progress review",
    category: "meeting",
    priority: "medium",
    assignee: "team",
  },

  // ============================================
  // Q2 2026
  // ============================================
  {
    date: "2026-04-01",
    title: "Techstars Air Force Accelerator Begins",
    description: "$120K funding + equity, Boston-based program",
    category: "accelerator",
    priority: "high",
    assignee: "team",
    link: "/docs/business/opportunities/techstars-programs",
  },
  {
    date: "2026-04-03",
    title: "ETHGlobal Cannes Hackathon",
    description: "April 3-5, Web3/blockchain hackathon with Pragma summit",
    category: "hackathon",
    priority: "medium",
    assignee: "jurie",
    link: "/docs/business/opportunities/ethglobal-hackathons",
  },
  {
    date: "2026-04-15",
    title: "NSIN Emerge Accelerator Application",
    description: "12-week university-based dual-use program, DoD partnership",
    category: "accelerator",
    priority: "medium",
    assignee: "martyn",
    link: "https://www.nsin.us/emerge/",
  },
  {
    date: "2026-05-08",
    title: "ETHPrague Conference & Hackathon",
    description: "May 8-10, Ethereum conference and hackathon in Prague",
    category: "hackathon",
    priority: "medium",
    assignee: "jurie",
    link: "/docs/business/opportunities/ethglobal-hackathons",
  },
  {
    date: "2026-04-30",
    title: "Phase 1a Prototype Complete",
    description: "Core platform prototype finished",
    category: "development",
    priority: "critical",
    assignee: "peter",
  },
  {
    date: "2026-05-01",
    title: "D2C Website Launch",
    description: "SkySnare consumer direct-to-consumer launch",
    category: "development",
    priority: "high",
  },
  {
    date: "2026-05-01",
    title: "MBDA Swarm Drone Challenge Registration",
    description: "Indoor swarm competition, €50K prizes - German-based",
    category: "opportunity",
    priority: "medium",
    assignee: "peter",
    link: "https://www.mbda-systems.com/",
  },
  {
    date: "2026-05-15",
    title: "UK DASA Cycle Submission",
    description: "Defence and Security Accelerator - up to \u00A3350K per proposal",
    category: "opportunity",
    priority: "high",
    link: "/docs/business/opportunities/opportunities-summary",
  },
  {
    date: "2026-06-01",
    title: "EU Certification Achieved",
    description: "Full EU regulatory certification",
    category: "compliance",
    priority: "critical",
  },
  {
    date: "2026-06-15",
    title: "FAA Part 107 Waiver Submission",
    description: "US regulatory compliance submission for AeroNet",
    category: "compliance",
    priority: "high",
  },
  {
    date: "2026-06-12",
    title: "ETHGlobal New York Hackathon",
    description: "June 12-14, Web3 hackathon: ZK proofs, DeFi, Layer-2, AI+crypto",
    category: "hackathon",
    priority: "high",
    assignee: "jurie",
    link: "/docs/business/opportunities/ethglobal-hackathons",
  },
  {
    date: "2026-06-30",
    title: "NATO Innovation Fund Pitch Target",
    description: "Rolling submissions - up to €15M per company",
    category: "funding",
    priority: "high",
  },
  {
    date: "2026-06-30",
    title: "Q2 2026 Milestone Review",
    description: "End of quarter progress review",
    category: "meeting",
    priority: "medium",
  },

  // ============================================
  // Q3 2026
  // ============================================
  {
    date: "2026-07-18",
    title: "Robotics Factory Accelerate Application Deadline",
    description: "Up to $100K funding, production-grade prototyping space access",
    category: "accelerator",
    priority: "high",
    assignee: "peter",
  },
  {
    date: "2026-07-24",
    title: "ETHGlobal Lisbon Hackathon",
    description: "July 24-26, Web3 hackathon in Lisbon",
    category: "hackathon",
    priority: "medium",
    assignee: "jurie",
    link: "/docs/business/opportunities/ethglobal-hackathons",
  },
  {
    date: "2026-07-01",
    title: "Series A Fundraise",
    description: "Target: R120M (~$6.7M) with proven revenue",
    category: "funding",
    priority: "critical",
    assignee: "martyn",
    link: "/docs/executive/investor-executive-summary",
    weeklyTarget: 10,
  },
  {
    date: "2026-07-01",
    title: "Silent Swarm 2026 Experimentation",
    description: "2-week Navy experimentation (maritime environment), free CRADA",
    category: "opportunity",
    priority: "high",
    assignee: "team",
    link: "https://www.navalx.org/",
  },
  {
    date: "2026-07-22",
    title: "Microsoft for Startups Credits Expire",
    description: "Use remaining credits before expiration",
    category: "funding",
    priority: "high",
  },
  {
    date: "2026-08-01",
    title: "DARPA AIxCC Challenge",
    description: "AI Cyber Challenge at DEF CON, up to $4M prizes",
    category: "hackathon",
    priority: "high",
    assignee: "jurie",
    link: "https://aicyberchallenge.com/",
  },
  {
    date: "2026-08-15",
    title: "DARPA Lift Challenge Event",
    description: "Heavy-lift drone challenge finals",
    category: "opportunity",
    priority: "high",
  },
  {
    date: "2026-09-01",
    title: "Enterprise Pilot MOU Target",
    description: "Signed MOU with enterprise customer",
    category: "development",
    priority: "critical",
  },
  {
    date: "2026-09-14",
    title: "Canada CUAS Sandbox Event Begins",
    description: "CFB Suffield, Alberta - Live demonstration (Sep 14 - Oct 9)",
    category: "opportunity",
    priority: "critical",
    assignee: "team",
    link: "/docs/business/opportunities/cuas-sandbox-2026",
    weeklyTarget: 20,
  },
  {
    date: "2026-09-25",
    title: "ETHGlobal Tokyo Hackathon",
    description: "September 25-27, Web3 hackathon in Tokyo",
    category: "hackathon",
    priority: "medium",
    assignee: "jurie",
    link: "/docs/business/opportunities/ethglobal-hackathons",
  },
  {
    date: "2026-09-30",
    title: "Q3 2026 Milestone Review",
    description: "End of quarter progress review",
    category: "meeting",
    priority: "medium",
  },

  // ============================================
  // Q4 2026
  // ============================================
  {
    date: "2026-10-01",
    title: "AWS Robotics Startup Accelerator Application",
    description: "With MassRobotics, for hardware/software robotics startups <$10M revenue",
    category: "accelerator",
    priority: "high",
    assignee: "peter",
    link: "https://aws.amazon.com/startups/accelerators/robotics/",
  },
  {
    date: "2026-11-01",
    title: "ETHGlobal Mumbai Hackathon",
    description: "Q4 2026, Web3 hackathon in Mumbai (dates TBD)",
    category: "hackathon",
    priority: "medium",
    assignee: "jurie",
    link: "/docs/business/opportunities/ethglobal-hackathons",
  },
  {
    date: "2026-11-15",
    title: "Microsoft for Startups Pegasus Program",
    description: "$250K investment, $350K Azure credits, top-tier advisors",
    category: "accelerator",
    priority: "high",
    assignee: "martyn",
    link: "/docs/business/opportunities/cloud-credits-programs",
  },
  {
    date: "2026-10-01",
    title: "Canada Expansion Begins",
    description: "Manufacturing partnerships established",
    category: "development",
    priority: "high",
  },
  {
    date: "2026-10-09",
    title: "Canada CUAS Sandbox Event Ends",
    description: "Final day of sandbox demonstration",
    category: "opportunity",
    priority: "critical",
    link: "/docs/business/opportunities/cuas-sandbox-2026",
  },
  {
    date: "2026-10-15",
    title: "Proven in Pendleton Counter-UAS Challenge",
    description: "Annual event, $100K+ prizes",
    category: "opportunity",
    priority: "high",
    assignee: "team",
    link: "https://www.pendletonuasrange.com/",
  },
  {
    date: "2026-11-01",
    title: "Australia LAND 156 Subcontracting Review",
    description: "Monitor Leidos Australia for subcontracting opportunities",
    category: "opportunity",
    priority: "medium",
  },
  {
    date: "2026-12-31",
    title: "5,000 Consumer Units Target",
    description: "SkySnare consumer sales milestone",
    category: "development",
    priority: "high",
  },
  {
    date: "2026-12-31",
    title: "Q4 2026 Milestone Review",
    description: "End of year progress review",
    category: "meeting",
    priority: "high",
  },

  // ============================================
  // Q1 2027
  // ============================================
  {
    date: "2027-01-15",
    title: "First AeroNet Enterprise Pilot Deployment",
    description: "Initial customer deployment target",
    category: "development",
    priority: "critical",
  },
  {
    date: "2027-01-31",
    title: "Silicon Valley Robotics Accelerator Application",
    description: "Free accelerator for SVR members, hardware/robotics focus",
    category: "accelerator",
    priority: "medium",
    assignee: "peter",
    link: "https://svrobo.org/",
  },
  {
    date: "2027-02-01",
    title: "South Africa Innovation Fund Application",
    description: "DSTI fund for high-tech SME sector, FY2027 cycle",
    category: "funding",
    priority: "high",
    assignee: "martyn",
  },
  {
    date: "2027-03-01",
    title: "Google for Startups MENA Accelerator",
    description: "10-week program for Middle East/Africa tech startups",
    category: "accelerator",
    priority: "medium",
    assignee: "alistair",
  },

  // ============================================
  // NEW OPPORTUNITIES FROM RESEARCH (Dec 2025)
  // ============================================
  {
    date: "2026-02-02",
    title: "UAV Technology USA Conference",
    description: "Feb 2-3, 2026 - Key networking for commercial drone market",
    category: "opportunity",
    priority: "medium",
    assignee: "martyn",
    link: "https://www.unmannedsystemstechnology.com/events/",
  },
  {
    date: "2026-03-15",
    title: "Drone Defense Hackathon Paris",
    description: "48-hour hackathon at Grand Palais during Adopt AI Summit - 300+ engineers, defense & AI focus",
    category: "hackathon",
    priority: "high",
    assignee: "team",
    link: "https://www.agorize.com/en/challenges/drone-defense-hackathon",
    weeklyTarget: 25,
  },
  {
    date: "2026-06-01",
    title: "NATO SAPIENCE 2026 Final Competition",
    description: "Third and final autonomous drone competition in Netherlands - indoor/outdoor tasks",
    category: "opportunity",
    priority: "high",
    assignee: "team",
    link: "https://www.nato.int/cps/en/natohq/news_237011.htm",
    weeklyTarget: 10,
  },
  {
    date: "2026-09-28",
    title: "Counter-UAS Homeland Security Europe 2026",
    description: "Sep 28-29 London - Counter-UAS strategies, critical infrastructure protection",
    category: "opportunity",
    priority: "medium",
    assignee: "martyn",
    link: "https://www.unmannedsystemstechnology.com/events/counter-uas-homeland-security-europe/",
  },
  {
    date: "2026-10-15",
    title: "Shield Capital Defense Tech Pitch",
    description: "Target pitch to Shield Capital (former military operators turned VCs) - seed to growth stage",
    category: "funding",
    priority: "high",
    assignee: "martyn",
    link: "https://www.openvc.app/investor-lists/defensetech-investors",
  },
  {
    date: "2026-11-01",
    title: "In-Q-Tel Briefing Target",
    description: "CIA venture arm - backs dual-use technologies with national security applications",
    category: "funding",
    priority: "high",
    assignee: "martyn",
    link: "https://www.openvc.app/investor-lists/defensetech-investors",
  },
  {
    date: "2026-06-15",
    title: "Army Best Drone Warfighter Competition",
    description: "Army UAS/counter-UAS experimentation - winning teams advance to 2027 competition",
    category: "opportunity",
    priority: "high",
    assignee: "team",
    link: "https://thedefensepost.com/2025/12/10/us-army-drone-warfighter-competition/",
    weeklyTarget: 15,
  },
  {
    date: "2026-05-15",
    title: "AFWERX SBIR Phase I Application",
    description: "Air Force small business innovation - up to $2M contract potential via Techstars pathway",
    category: "funding",
    priority: "high",
    assignee: "martyn",
    link: "/docs/business/opportunities/techstars-programs",
    weeklyTarget: 10,
  },

  // ============================================
  // ADDITIONAL OPPORTUNITIES (Research Phase 5)
  // ============================================

  // European Programs
  {
    date: "2026-03-01",
    title: "EUDIS Business Accelerator Spring Cohort",
    description: "EU defense accelerator - 300+ hours coaching, 5 bootcamps across Europe. EU/Norway startups only.",
    category: "accelerator",
    priority: "high",
    assignee: "martyn",
    link: "https://www.eudis-business-accelerator.eu/",
    weeklyTarget: 15,
  },
  {
    date: "2026-04-13",
    title: "Military Robotics & Autonomous Systems UK 2026",
    description: "April 13-15 London - Conference on RAS integration into military operations",
    category: "opportunity",
    priority: "medium",
    assignee: "team",
    link: "https://www.smgconferences.com/defence/uk/conference/robotic-autonomous-systems",
  },
  {
    date: "2026-09-01",
    title: "EUDIS Business Accelerator Fall Cohort",
    description: "EU defense accelerator fall intake - 300+ hours coaching, bootcamps across Europe",
    category: "accelerator",
    priority: "high",
    assignee: "martyn",
    link: "https://www.eudis-business-accelerator.eu/",
    weeklyTarget: 15,
  },

  // African & MENA Programs
  {
    date: "2026-03-15",
    title: "Google for Startups MENA 2026 Application",
    description: "10-week accelerator for Middle East & North Africa startups using innovative tech",
    category: "accelerator",
    priority: "medium",
    assignee: "alistair",
    link: "https://startup.google.com/programs/accelerator/",
  },
  {
    date: "2026-05-01",
    title: "Katapult Africa Accelerator Application",
    description: "90-day program with $150K-$500K investment for African impact tech startups",
    category: "accelerator",
    priority: "medium",
    assignee: "martyn",
    link: "https://katapult.vc/africa/accelerator/",
  },
  {
    date: "2026-06-25",
    title: "Africa Technology Expo 2026",
    description: "June 25-26 - Hardware, robotics, drone tech, smart hardware showcase",
    category: "opportunity",
    priority: "medium",
    assignee: "team",
    link: "https://africatechnologyexpo.com/",
  },
  {
    date: "2026-06-30",
    title: "Africa Startup Accelerator (ASA) 2026",
    description: "3-week program at University of Iowa (June 30 - July 25) for African founders",
    category: "accelerator",
    priority: "medium",
    assignee: "martyn",
    link: "https://opportunitiesforeveryone.net/call-for-applications-2026-africa-startup-accelerator-asa-program-in-usa/",
  },
  {
    date: "2026-10-28",
    title: "AI Expo Africa 2026",
    description: "Oct 28-29 Sandton, South Africa - Africa's largest AI and smart tech trade event",
    category: "opportunity",
    priority: "medium",
    assignee: "team",
    link: "https://aiexpoafrica.com/",
  },

  // US Events & Conferences
  {
    date: "2026-07-08",
    title: "Military Robotics & Autonomous Systems USA 2026",
    description: "July 8-9 - Conference on military robotics with 100+ attendees, 25+ speakers",
    category: "opportunity",
    priority: "high",
    assignee: "team",
    link: "https://www.unmannedsystemstechnology.com/events/military-robotics-and-autonomous-systems-usa/",
  },

  // Corporate Venture Targets
  {
    date: "2026-04-01",
    title: "Lockheed Martin Ventures Pitch Preparation",
    description: "Prepare pitch for Lockheed Martin corporate VC - deep pockets, pilot customers, acquisition pathway",
    category: "funding",
    priority: "high",
    assignee: "martyn",
    link: "https://www.openvc.app/investor-lists/defensetech-investors",
  },
  {
    date: "2026-05-01",
    title: "Boeing HorizonX Ventures Outreach",
    description: "Target Boeing's VC arm - focused on autonomous systems, advanced manufacturing",
    category: "funding",
    priority: "medium",
    assignee: "martyn",
    link: "https://www.openvc.app/investor-lists/defensetech-investors",
  },
  {
    date: "2026-06-01",
    title: "RTX Ventures Introduction",
    description: "Connect with RTX (formerly Raytheon) venture arm for defense tech partnership",
    category: "funding",
    priority: "medium",
    assignee: "martyn",
    link: "https://www.openvc.app/investor-lists/defensetech-investors",
  },
];

const categoryConfig = {
  opportunity: { label: "Opportunity", color: "#ef4444", icon: "🎯" },
  development: { label: "Development", color: "#3b82f6", icon: "🔧" },
  compliance: { label: "Compliance", color: "#f59e0b", icon: "📋" },
  meeting: { label: "Meeting", color: "#22c55e", icon: "👥" },
  funding: { label: "Funding", color: "#a855f7", icon: "💰" },
  hackathon: { label: "Hackathon", color: "#06b6d4", icon: "💻" },
  accelerator: { label: "Accelerator", color: "#ec4899", icon: "🚀" },
};

const priorityConfig = {
  critical: { label: "Critical", badge: "🔴" },
  high: { label: "High", badge: "🟡" },
  medium: { label: "Medium", badge: "🟢" },
  low: { label: "Low", badge: "⚪" },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getTimeLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `In ${days} days`;
  if (days <= 30) return `In ${Math.ceil(days / 7)} weeks`;
  if (days <= 365) return `In ${Math.ceil(days / 30)} months`;
  return `In ${Math.ceil(days / 365)} years`;
}

// Custom event stored in localStorage
interface CustomEvent extends CalendarItem {
  id: string;
  isCustom: true;
}

const CUSTOM_EVENTS_KEY = "phoenix-calendar-custom-events";
const COMPLETED_EVENTS_KEY = "phoenix-calendar-completed";

function loadCustomEvents(): CustomEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CUSTOM_EVENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomEvents(events: CustomEvent[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_EVENTS_KEY, JSON.stringify(events));
}

// Completion tracking - stored as event title hash -> boolean
function loadCompletedEvents(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(COMPLETED_EVENTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveCompletedEvents(completed: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPLETED_EVENTS_KEY, JSON.stringify(completed));
}

function getEventKey(event: CalendarItem): string {
  return `${event.date}-${event.title}`.replace(/\s+/g, "-").toLowerCase();
}

// Time range options
type TimeRange = "all" | "week" | "month" | "quarter" | "30days" | "60days" | "90days";

const timeRangeConfig: Record<TimeRange, { label: string; days: number | null }> = {
  all: { label: "All Time", days: null },
  week: { label: "This Week", days: 7 },
  month: { label: "This Month", days: 30 },
  quarter: { label: "This Quarter", days: 90 },
  "30days": { label: "Next 30 Days", days: 30 },
  "60days": { label: "Next 60 Days", days: 60 },
  "90days": { label: "Next 90 Days", days: 90 },
};

export default function CalendarPage(): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("all");
  const [selectedCompletion, setSelectedCompletion] = useState<string>("all"); // all, incomplete, completed
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showPast, setShowPast] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [completedEvents, setCompletedEvents] = useState<Record<string, boolean>>({});
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    category: "meeting" as CalendarItem["category"],
    priority: "medium" as CalendarItem["priority"],
    assignee: "all" as TeamMember,
    weeklyTarget: undefined as number | undefined,
  });

  // Load custom events and completed status from localStorage on mount
  React.useEffect(() => {
    setCustomEvents(loadCustomEvents());
    setCompletedEvents(loadCompletedEvents());
  }, []);

  // Toggle event completion
  const handleToggleComplete = (event: CalendarItem) => {
    const key = getEventKey(event);
    const updated = { ...completedEvents, [key]: !completedEvents[key] };
    setCompletedEvents(updated);
    saveCompletedEvents(updated);
  };

  // Check if event is completed
  const isEventCompleted = (event: CalendarItem) => {
    return completedEvents[getEventKey(event)] || false;
  };

  const allEvents = useMemo(() => {
    return [...calendarEvents, ...customEvents];
  }, [customEvents]);

  const filteredEvents = useMemo(() => {
    let events = [...allEvents];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      events = events.filter((e) =>
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      events = events.filter((e) => e.category === selectedCategory);
    }

    // Filter by priority
    if (selectedPriority !== "all") {
      events = events.filter((e) => e.priority === selectedPriority);
    }

    // Filter by assignee
    if (selectedAssignee !== "all") {
      events = events.filter((e) =>
        e.assignee === selectedAssignee ||
        e.assignee === "all" ||
        e.assignee === "team" ||
        !e.assignee
      );
    }

    // Filter by time range
    if (selectedTimeRange !== "all") {
      const maxDays = timeRangeConfig[selectedTimeRange].days;
      if (maxDays !== null) {
        events = events.filter((e) => {
          const days = getDaysUntil(e.date);
          return days >= 0 && days <= maxDays;
        });
      }
    }

    // Filter by completion status
    if (selectedCompletion !== "all") {
      events = events.filter((e) => {
        const isCompleted = completedEvents[getEventKey(e)] || false;
        return selectedCompletion === "completed" ? isCompleted : !isCompleted;
      });
    }

    // Filter past events
    if (!showPast) {
      events = events.filter((e) => getDaysUntil(e.date) >= 0);
    }

    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return events;
  }, [selectedCategory, selectedAssignee, selectedPriority, selectedTimeRange, selectedCompletion, searchQuery, showPast, allEvents, completedEvents]);

  // Personal stats for selected assignee
  const personalStats = useMemo(() => {
    const assigneeEvents = selectedAssignee !== "all"
      ? allEvents.filter((e) =>
          e.assignee === selectedAssignee ||
          e.assignee === "all" ||
          e.assignee === "team" ||
          !e.assignee
        )
      : allEvents;

    const upcoming = assigneeEvents.filter((e) => getDaysUntil(e.date) >= 0);
    const thisWeek = upcoming.filter((e) => getDaysUntil(e.date) <= 7);
    const thisMonth = upcoming.filter((e) => getDaysUntil(e.date) <= 30);
    const critical = upcoming.filter((e) => e.priority === "critical");
    const high = upcoming.filter((e) => e.priority === "high");
    const overdue = assigneeEvents.filter((e) => getDaysUntil(e.date) < 0);

    // Completion stats
    const completedCount = assigneeEvents.filter((e) => isEventCompleted(e)).length;
    const completedThisMonth = thisMonth.filter((e) => isEventCompleted(e)).length;
    const completionRate = thisMonth.length > 0
      ? Math.round((completedThisMonth / thisMonth.length) * 100)
      : 0;

    // Breakdown by category
    const byCategory = Object.keys(categoryConfig).reduce((acc, cat) => {
      acc[cat] = upcoming.filter((e) => e.category === cat).length;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: upcoming.length,
      thisWeek: thisWeek.length,
      thisMonth: thisMonth.length,
      critical: critical.length,
      high: high.length,
      overdue: overdue.length,
      completed: completedCount,
      completedThisMonth,
      completionRate,
      byCategory,
    };
  }, [selectedAssignee, allEvents, completedEvents]);

  // Export personal calendar (only assigned events)
  const handleExportPersonal = () => {
    const personalEvents = selectedAssignee !== "all"
      ? filteredEvents
      : allEvents.filter((e) => getDaysUntil(e.date) >= 0);

    const events: CalendarEvent[] = personalEvents.map((item) => ({
      title: item.title,
      description: item.description,
      startDate: new Date(item.date),
      allDay: true,
      category: item.category,
    }));

    const filename = selectedAssignee !== "all"
      ? `phoenix-calendar-${selectedAssignee}.ics`
      : "phoenix-rooivalk-calendar.ics";

    downloadICS(events, filename);
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      alert("Please fill in the title and date");
      return;
    }
    const event: CustomEvent = {
      ...newEvent,
      id: Date.now().toString(),
      isCustom: true,
    };
    const updated = [...customEvents, event];
    setCustomEvents(updated);
    saveCustomEvents(updated);
    setNewEvent({
      title: "",
      description: "",
      date: "",
      category: "meeting",
      priority: "medium",
      assignee: "all",
      weeklyTarget: undefined,
    });
    setShowAddModal(false);
  };

  const handleDeleteCustomEvent = (id: string) => {
    const updated = customEvents.filter((e) => e.id !== id);
    setCustomEvents(updated);
    saveCustomEvents(updated);
  };

  const handleExportAll = () => {
    const events: CalendarEvent[] = filteredEvents.map((item) => ({
      title: item.title,
      description: item.description,
      startDate: new Date(item.date),
      allDay: true,
      category: item.category,
    }));
    downloadICS(events, "phoenix-rooivalk-calendar.ics");
  };

  const upcomingCritical = filteredEvents.filter(
    (e) => e.priority === "critical" && getDaysUntil(e.date) >= 0 && getDaysUntil(e.date) <= 90
  );

  // Generate ICS content for subscription (includes custom events)
  const allEventsForExport: CalendarEvent[] = allEvents.map((item) => ({
    title: item.title,
    description: item.description,
    startDate: new Date(item.date),
    allDay: true,
    category: item.category,
  }));

  const handleCopyICS = async () => {
    const icsContent = generateICS(allEventsForExport);
    try {
      await navigator.clipboard.writeText(icsContent);
      alert("Calendar data copied! Paste into a .ics file to import.");
    } catch {
      // Fallback - download instead
      downloadICS(allEventsForExport, "phoenix-rooivalk-calendar.ics");
    }
  };

  const handleSubscribeGoogle = () => {
    // Google Calendar subscribe URL (would need hosted ICS file in production)
    window.open(
      "https://calendar.google.com/calendar/r?cid=webcal://docs.phoenixrooivalk.com/calendar.ics",
      "_blank"
    );
  };

  const handleSubscribeOutlook = () => {
    // Outlook subscribe URL
    window.open(
      "https://outlook.live.com/calendar/0/addfromweb?url=webcal://docs.phoenixrooivalk.com/calendar.ics",
      "_blank"
    );
  };

  return (
    <Layout
      title="Project Calendar"
      description="Phoenix Rooivalk project deadlines, milestones, and events"
    >
      <main className={styles.calendarPage}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>
              <span className={styles.headerIcon}>📅</span> Project Calendar
            </h1>
            <p>
              Track all deadlines, milestones, opportunities, and events in one place.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.exportButton} onClick={() => setShowAddModal(true)}>
              + Add Event
            </button>
            <button className={styles.exportButton} onClick={handleExportAll} style={{ background: "var(--ifm-color-emphasis-200)", color: "var(--ifm-color-content)" }}>
              📥 Export
            </button>
            <Link
              to="/docs/operations/calendar/project-calendar"
              className={styles.detailsLink}
            >
              View Full Details →
            </Link>
          </div>
        </div>

        {/* Action Cards - Book Meeting & Subscribe */}
        <div className={styles.actionCards}>
          {/* Book a Meeting */}
          <div className={styles.actionCard}>
            <div className={styles.actionCardHeader}>
              <span className={styles.actionCardIcon}>📅</span>
              <h2>Book a Meeting</h2>
            </div>
            <p className={styles.actionCardDescription}>
              Schedule time with our team to discuss your counter-UAS requirements,
              see a product demo, or explore investment opportunities.
            </p>
            <BookingWidget
              calUsername="phoenixrooivalk"
              title=""
              subtitle=""
              embed={false}
            />
          </div>

          {/* Calendar Integration */}
          <div className={styles.actionCard}>
            <div className={styles.actionCardHeader}>
              <span className={styles.actionCardIcon}>🔗</span>
              <h2>Sync to Your Calendar</h2>
            </div>
            <p className={styles.actionCardDescription}>
              Stay updated with all Phoenix Rooivalk deadlines and milestones
              by adding our calendar to your favorite app.
            </p>
            <div className={styles.integrationOptions}>
              <button
                className={styles.integrationButton}
                onClick={handleSubscribeGoogle}
              >
                <span className={styles.integrationIcon}>G</span>
                <span className={styles.integrationLabel}>
                  <span className={styles.integrationTitle}>Google Calendar</span>
                  <span className={styles.integrationDesc}>Subscribe & auto-sync</span>
                </span>
              </button>
              <button
                className={styles.integrationButton}
                onClick={handleSubscribeOutlook}
              >
                <span className={styles.integrationIcon}>O</span>
                <span className={styles.integrationLabel}>
                  <span className={styles.integrationTitle}>Outlook Calendar</span>
                  <span className={styles.integrationDesc}>Subscribe & auto-sync</span>
                </span>
              </button>
              <button
                className={styles.integrationButton}
                onClick={handleExportAll}
              >
                <span className={styles.integrationIcon}>📥</span>
                <span className={styles.integrationLabel}>
                  <span className={styles.integrationTitle}>Download .ics File</span>
                  <span className={styles.integrationDesc}>Apple Calendar & others</span>
                </span>
              </button>
              <button
                className={styles.integrationButton}
                onClick={handleCopyICS}
              >
                <span className={styles.integrationIcon}>📋</span>
                <span className={styles.integrationLabel}>
                  <span className={styles.integrationTitle}>Copy Calendar Data</span>
                  <span className={styles.integrationDesc}>For manual import</span>
                </span>
              </button>
            </div>
            <div className={styles.subscribeHint}>
              <strong>Pro tip:</strong> Subscribing keeps your calendar automatically
              updated when new events are added.
            </div>
          </div>
        </div>

        {/* Quick Overview - Always Visible */}
        {selectedAssignee === "all" && (
          <div className={styles.quickOverview}>
            <div className={styles.overviewHeader}>
              <h3>Quick Overview</h3>
              <div className={styles.overviewStats}>
                <span className={styles.overviewStat}>
                  <strong>{filteredEvents.filter((e) => getDaysUntil(e.date) >= 0 && getDaysUntil(e.date) <= 7).length}</strong> this week
                </span>
                <span className={styles.overviewStat}>
                  <strong>{filteredEvents.filter((e) => getDaysUntil(e.date) >= 0 && getDaysUntil(e.date) <= 30).length}</strong> this month
                </span>
                <span className={styles.overviewStat}>
                  <strong>{filteredEvents.filter((e) => isEventCompleted(e)).length}</strong> completed
                </span>
              </div>
            </div>
            <div className={styles.roadmapTimeline}>
              <div className={styles.roadmapSection}>
                <div className={styles.roadmapPeriod}>This Week</div>
                <div className={styles.roadmapItems}>
                  {filteredEvents
                    .filter((e) => getDaysUntil(e.date) >= 0 && getDaysUntil(e.date) <= 7)
                    .slice(0, 4)
                    .map((e, i) => (
                      <div
                        key={i}
                        className={`${styles.roadmapItem} ${isEventCompleted(e) ? styles.roadmapCompleted : ""}`}
                      >
                        <button
                          className={styles.roadmapCheckbox}
                          onClick={() => handleToggleComplete(e)}
                        >
                          {isEventCompleted(e) ? "✓" : "○"}
                        </button>
                        <span className={styles.roadmapTitle}>{e.title}</span>
                        <span className={styles.roadmapPriority}>{priorityConfig[e.priority].badge}</span>
                      </div>
                    ))}
                  {filteredEvents.filter((e) => getDaysUntil(e.date) >= 0 && getDaysUntil(e.date) <= 7).length === 0 && (
                    <div className={styles.roadmapEmpty}>No items this week</div>
                  )}
                </div>
              </div>
              <div className={styles.roadmapSection}>
                <div className={styles.roadmapPeriod}>Next 2 Weeks</div>
                <div className={styles.roadmapItems}>
                  {filteredEvents
                    .filter((e) => getDaysUntil(e.date) > 7 && getDaysUntil(e.date) <= 14)
                    .slice(0, 4)
                    .map((e, i) => (
                      <div
                        key={i}
                        className={`${styles.roadmapItem} ${isEventCompleted(e) ? styles.roadmapCompleted : ""}`}
                      >
                        <button
                          className={styles.roadmapCheckbox}
                          onClick={() => handleToggleComplete(e)}
                        >
                          {isEventCompleted(e) ? "✓" : "○"}
                        </button>
                        <span className={styles.roadmapTitle}>{e.title}</span>
                        <span className={styles.roadmapPriority}>{priorityConfig[e.priority].badge}</span>
                      </div>
                    ))}
                  {filteredEvents.filter((e) => getDaysUntil(e.date) > 7 && getDaysUntil(e.date) <= 14).length === 0 && (
                    <div className={styles.roadmapEmpty}>No items next 2 weeks</div>
                  )}
                </div>
              </div>
              <div className={styles.roadmapSection}>
                <div className={styles.roadmapPeriod}>This Month</div>
                <div className={styles.roadmapItems}>
                  {filteredEvents
                    .filter((e) => getDaysUntil(e.date) > 14 && getDaysUntil(e.date) <= 30)
                    .slice(0, 4)
                    .map((e, i) => (
                      <div
                        key={i}
                        className={`${styles.roadmapItem} ${isEventCompleted(e) ? styles.roadmapCompleted : ""}`}
                      >
                        <button
                          className={styles.roadmapCheckbox}
                          onClick={() => handleToggleComplete(e)}
                        >
                          {isEventCompleted(e) ? "✓" : "○"}
                        </button>
                        <span className={styles.roadmapTitle}>{e.title}</span>
                        <span className={styles.roadmapPriority}>{priorityConfig[e.priority].badge}</span>
                      </div>
                    ))}
                  {filteredEvents.filter((e) => getDaysUntil(e.date) > 14 && getDaysUntil(e.date) <= 30).length === 0 && (
                    <div className={styles.roadmapEmpty}>No items later this month</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personal Stats Dashboard */}
        {selectedAssignee !== "all" && (
          <div className={styles.statsDashboard}>
            <div className={styles.statsHeader}>
              <h3>
                <span
                  className={styles.statsAvatar}
                  style={{ backgroundColor: teamConfig[selectedAssignee as TeamMember]?.color }}
                >
                  {teamConfig[selectedAssignee as TeamMember]?.initials}
                </span>
                {teamConfig[selectedAssignee as TeamMember]?.label}'s Dashboard
              </h3>
              <button className={styles.exportPersonalBtn} onClick={handleExportPersonal}>
                📥 Export My Calendar
              </button>
            </div>
            <div className={styles.statsGrid}>
              <div className={`${styles.statCard} ${styles.statCompletion}`}>
                <span className={styles.statNumber}>{personalStats.completionRate}%</span>
                <span className={styles.statLabel}>Monthly Progress</span>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${personalStats.completionRate}%` }}
                  />
                </div>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>{personalStats.completedThisMonth}/{personalStats.thisMonth}</span>
                <span className={styles.statLabel}>Done This Month</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>{personalStats.thisWeek}</span>
                <span className={styles.statLabel}>This Week</span>
              </div>
              <div className={`${styles.statCard} ${styles.statCritical}`}>
                <span className={styles.statNumber}>{personalStats.critical}</span>
                <span className={styles.statLabel}>🔴 Critical</span>
              </div>
              <div className={`${styles.statCard} ${styles.statHigh}`}>
                <span className={styles.statNumber}>{personalStats.high}</span>
                <span className={styles.statLabel}>🟡 High Priority</span>
              </div>
              {personalStats.overdue > 0 && (
                <div className={`${styles.statCard} ${styles.statOverdue}`}>
                  <span className={styles.statNumber}>{personalStats.overdue}</span>
                  <span className={styles.statLabel}>⚠️ Overdue</span>
                </div>
              )}
            </div>

            {/* Roadmap Overview */}
            <div className={styles.roadmapOverview}>
              <h4>Quick Roadmap</h4>
              <div className={styles.roadmapTimeline}>
                <div className={styles.roadmapSection}>
                  <div className={styles.roadmapPeriod}>This Week</div>
                  <div className={styles.roadmapItems}>
                    {filteredEvents
                      .filter((e) => getDaysUntil(e.date) >= 0 && getDaysUntil(e.date) <= 7)
                      .slice(0, 3)
                      .map((e, i) => (
                        <div
                          key={i}
                          className={`${styles.roadmapItem} ${isEventCompleted(e) ? styles.roadmapCompleted : ""}`}
                        >
                          <button
                            className={styles.roadmapCheckbox}
                            onClick={() => handleToggleComplete(e)}
                          >
                            {isEventCompleted(e) ? "✓" : "○"}
                          </button>
                          <span className={styles.roadmapTitle}>{e.title}</span>
                          <span className={styles.roadmapPriority}>{priorityConfig[e.priority].badge}</span>
                        </div>
                      ))}
                    {filteredEvents.filter((e) => getDaysUntil(e.date) >= 0 && getDaysUntil(e.date) <= 7).length === 0 && (
                      <div className={styles.roadmapEmpty}>No items this week</div>
                    )}
                  </div>
                </div>
                <div className={styles.roadmapSection}>
                  <div className={styles.roadmapPeriod}>Next 2 Weeks</div>
                  <div className={styles.roadmapItems}>
                    {filteredEvents
                      .filter((e) => getDaysUntil(e.date) > 7 && getDaysUntil(e.date) <= 14)
                      .slice(0, 3)
                      .map((e, i) => (
                        <div
                          key={i}
                          className={`${styles.roadmapItem} ${isEventCompleted(e) ? styles.roadmapCompleted : ""}`}
                        >
                          <button
                            className={styles.roadmapCheckbox}
                            onClick={() => handleToggleComplete(e)}
                          >
                            {isEventCompleted(e) ? "✓" : "○"}
                          </button>
                          <span className={styles.roadmapTitle}>{e.title}</span>
                          <span className={styles.roadmapPriority}>{priorityConfig[e.priority].badge}</span>
                        </div>
                      ))}
                    {filteredEvents.filter((e) => getDaysUntil(e.date) > 7 && getDaysUntil(e.date) <= 14).length === 0 && (
                      <div className={styles.roadmapEmpty}>No items next 2 weeks</div>
                    )}
                  </div>
                </div>
                <div className={styles.roadmapSection}>
                  <div className={styles.roadmapPeriod}>This Month</div>
                  <div className={styles.roadmapItems}>
                    {filteredEvents
                      .filter((e) => getDaysUntil(e.date) > 14 && getDaysUntil(e.date) <= 30)
                      .slice(0, 3)
                      .map((e, i) => (
                        <div
                          key={i}
                          className={`${styles.roadmapItem} ${isEventCompleted(e) ? styles.roadmapCompleted : ""}`}
                        >
                          <button
                            className={styles.roadmapCheckbox}
                            onClick={() => handleToggleComplete(e)}
                          >
                            {isEventCompleted(e) ? "✓" : "○"}
                          </button>
                          <span className={styles.roadmapTitle}>{e.title}</span>
                          <span className={styles.roadmapPriority}>{priorityConfig[e.priority].badge}</span>
                        </div>
                      ))}
                    {filteredEvents.filter((e) => getDaysUntil(e.date) > 14 && getDaysUntil(e.date) <= 30).length === 0 && (
                      <div className={styles.roadmapEmpty}>No items later this month</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Critical Deadlines Alert */}
        {upcomingCritical.length > 0 && (
          <div className={styles.criticalAlert}>
            <h3>🔴 Critical Deadlines (Next 90 Days)</h3>
            <div className={styles.criticalList}>
              {upcomingCritical.map((event, idx) => (
                <div key={idx} className={styles.criticalItem}>
                  <span className={styles.criticalDate}>
                    {formatDate(event.date)}
                  </span>
                  <span className={styles.criticalTitle}>{event.title}</span>
                  <span className={styles.criticalCountdown}>
                    {getTimeLabel(getDaysUntil(event.date))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className={styles.searchAndFilters}>
          {/* Search Bar */}
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                className={styles.clearSearch}
                onClick={() => setSearchQuery("")}
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Row */}
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Time Range:</label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as TimeRange)}
                className={styles.filterSelect}
              >
                {Object.entries(timeRangeConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Priority:</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Priorities</option>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.badge} {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Assigned to:</label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Everyone</option>
                {Object.entries(teamConfig).filter(([key]) => key !== "all").map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.initials} - {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Status:</label>
              <select
                value={selectedCompletion}
                onChange={(e) => setSelectedCompletion(e.target.value)}
                className={styles.filterSelect}
                aria-label="Filter by completion status"
              >
                <option value="all">All Items</option>
                <option value="incomplete">Incomplete</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <label className={styles.showPastToggle}>
              <input
                type="checkbox"
                checked={showPast}
                onChange={(e) => setShowPast(e.target.checked)}
              />
              Show past
            </label>
          </div>
        </div>

        {/* Category Filters */}
        <div className={styles.filters}>
          <div className={styles.categoryFilters}>
            <button
              className={`${styles.filterButton} ${selectedCategory === "all" ? styles.active : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              All
            </button>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <button
                key={key}
                className={`${styles.filterButton} ${selectedCategory === key ? styles.active : ""}`}
                onClick={() => setSelectedCategory(key)}
                style={{ "--category-color": config.color } as React.CSSProperties}
              >
                {config.icon} {config.label}
              </button>
            ))}
          </div>
          <div className={styles.resultsCount}>
            Showing {filteredEvents.length} events
          </div>
        </div>

        {/* Timeline */}
        <div className={styles.timeline}>
          {filteredEvents.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No events found for the selected filters.</p>
            </div>
          ) : (
            filteredEvents.map((event, idx) => {
              const days = getDaysUntil(event.date);
              const isPast = days < 0;
              const isToday = days === 0;
              const isSoon = days > 0 && days <= 7;
              const config = categoryConfig[event.category];

              const completed = isEventCompleted(event);

              return (
                <div
                  key={idx}
                  className={`${styles.timelineItem} ${isPast ? styles.past : ""} ${isToday ? styles.today : ""} ${isSoon ? styles.soon : ""} ${completed ? styles.completed : ""}`}
                  style={{ "--category-color": config.color } as React.CSSProperties}
                >
                  <div className={styles.timelineDate}>
                    <span className={styles.dateLabel}>{formatDate(event.date)}</span>
                    <span className={styles.countdown}>{getTimeLabel(days)}</span>
                  </div>
                  <div className={styles.timelineMarker}>
                    <button
                      className={`${styles.completionCheckbox} ${completed ? styles.checked : ""}`}
                      onClick={() => handleToggleComplete(event)}
                      title={completed ? "Mark as incomplete" : "Mark as complete"}
                    >
                      {completed ? "✓" : priorityConfig[event.priority].badge}
                    </button>
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.eventHeader}>
                      <span className={styles.categoryBadge}>
                        {config.icon} {config.label}
                      </span>
                      {event.assignee && event.assignee !== "all" && (
                        <span
                          className={styles.assigneeBadge}
                          style={{ "--assignee-color": teamConfig[event.assignee]?.color || "#6b7280" } as React.CSSProperties}
                        >
                          {teamConfig[event.assignee]?.initials || "?"}
                        </span>
                      )}
                      {event.weeklyTarget && (
                        <span className={styles.weeklyTargetBadge}>
                          {event.weeklyTarget}%/wk target
                        </span>
                      )}
                    </div>
                    <h3 className={`${styles.eventTitle} ${completed ? styles.titleCompleted : ""}`}>
                      {event.link ? (
                        event.link.startsWith("http") ? (
                          <a href={event.link} target="_blank" rel="noopener noreferrer">{event.title}</a>
                        ) : (
                          <Link to={event.link}>{event.title}</Link>
                        )
                      ) : (
                        event.title
                      )}
                      {completed && <span className={styles.completedBadge}>Done</span>}
                      {"isCustom" in event && (
                        <button
                          className={styles.deleteEventButton}
                          onClick={() => handleDeleteCustomEvent((event as CustomEvent).id)}
                          title="Delete custom event"
                        >
                          ×
                        </button>
                      )}
                    </h3>
                    <p className={styles.eventDescription}>
                      {event.description}
                      {"isCustom" in event && (
                        <span className={styles.customBadge}>Custom</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <h4>Legend</h4>
          <div className={styles.legendItems}>
            <div className={styles.legendSection}>
              <span className={styles.legendLabel}>Priority:</span>
              {Object.entries(priorityConfig).map(([key, config]) => (
                <span key={key} className={styles.legendItem}>
                  {config.badge} {config.label}
                </span>
              ))}
            </div>
            <div className={styles.legendSection}>
              <span className={styles.legendLabel}>Category:</span>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <span
                  key={key}
                  className={styles.legendItem}
                  style={{ color: config.color }}
                >
                  {config.icon} {config.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Add Event Modal */}
        {showAddModal && (
          <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Add Custom Event</h2>
                <button
                  className={styles.modalClose}
                  onClick={() => setShowAddModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalContent}>
                <div className={styles.formGroup}>
                  <label>Title *</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Event title"
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Date *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Event description"
                    className={styles.formInput}
                    rows={3}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Category</label>
                    <select
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as CalendarItem["category"] })}
                      className={styles.formInput}
                    >
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.icon} {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Priority</label>
                    <select
                      value={newEvent.priority}
                      onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value as CalendarItem["priority"] })}
                      className={styles.formInput}
                    >
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.badge} {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Assign To</label>
                  <select
                    value={newEvent.assignee}
                    onChange={(e) => setNewEvent({ ...newEvent, assignee: e.target.value as TeamMember })}
                    className={styles.formInput}
                  >
                    {Object.entries(teamConfig).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.initials} - {config.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Weekly Target (% progress/week)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newEvent.weeklyTarget || ""}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      weeklyTarget: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="e.g., 25 for 25%/week"
                    className={styles.formInput}
                  />
                  <span className={styles.formHint}>
                    Optional - Set a weekly progress target for longer-term items
                  </span>
                </div>
                <div className={styles.modalActions}>
                  <button
                    className={styles.modalCancel}
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.modalSubmit}
                    onClick={handleAddEvent}
                  >
                    Add Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
