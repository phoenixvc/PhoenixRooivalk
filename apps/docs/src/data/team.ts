/**
 * Team Information
 *
 * Single source of truth for team member details and company structure.
 */

/** Co-Founders */
export const founders = {
  cto: {
    name: "Jurie (Hans Jurgens) Smit",
    title: "Co-Founder & CTO",
    current: {
      role: "Senior Developer",
      company: "Sygnia Asset Management",
    },
    experience: "15+ years",
    expertise: [
      "System Architecture",
      "AI/ML",
      "Blockchain",
      "Cognitive Sovereignty research",
      "Legacy system refactoring",
      "Human-AI collaboration frameworks",
      "High-scale citizen platforms",
    ],
    education: [
      {
        degree: "B.Eng Industrial-Electronic",
        institution: "Stellenbosch University",
      },
      {
        degree: "B.Com Quantitative Management",
        institution: "UNISA",
      },
    ],
    contact: {
      email: "jurie@phoenixvc.tech",
      phone: "+27 (069) 140-6835",
    },
  },

  ceo: {
    name: "Martyn Redelinghuys",
    title: "Co-Founder & CEO",
    current: {
      role: "Consultant Executive Project Manager",
      company: "Sasol",
      portfolioSize: "R500M+",
    },
    experience: "20+ years",
    expertise: [
      "Executive Project Management",
      "Energy management",
      "Project optimization",
      "Multi-disciplinary capital projects",
      "Mining & defense sectors",
    ],
    education: [
      {
        degree: "B.Eng Electrical & Electronic",
        institution: "Stellenbosch University",
      },
      {
        degree: "MBA",
        institution: "GIBS",
      },
    ],
    certifications: [
      "Certified Energy Manager (CEM)",
      "Certified Measurement and Verification Professional (CMVP)",
    ],
  },
};

/** Team Summary */
export const teamSummary = {
  combinedExperience: "35+ years",
  domains: ["Aerospace", "Defense", "Blockchain", "AI/ML", "Energy", "Mining"],
  keyStrengths: [
    "Military-grade systems development",
    "Cryptographic protocols",
    "Large-scale project management",
    "Defense industry relationships",
  ],
};

/** Team Expansion Plans */
export const hiringPlan = {
  priority: [
    {
      role: "AI/ML Engineers",
      focus: "Computer vision and autonomous systems",
      status: "Seeking",
    },
    {
      role: "Blockchain Developers",
      focus: "Deep Solana and distributed systems experience",
      status: "Seeking",
    },
    {
      role: "Defense Integration",
      focus: "Former Denel, Paramount, and CSIR professionals",
      status: "Seeking",
    },
    {
      role: "Systems Architects",
      focus: "Senior engineers with defense technology background",
      status: "Seeking",
    },
  ],
};

/** Advisory Board (Planned) */
export const advisoryBoard = {
  status: "In development",
  targetAreas: [
    {
      area: "Defense Strategy",
      target: "Former SANDF generals and defense ministry officials",
    },
    {
      area: "Technology",
      target: "Leading AI researchers and blockchain experts",
    },
    {
      area: "International Markets",
      target: "Former ambassadors and trade officials",
    },
    {
      area: "Manufacturing",
      target: "Aerospace and defense production specialists",
    },
  ],
};

/** Strategic Partnerships */
export const partnerships = {
  current: [
    {
      partner: "CSIR",
      type: "Research collaboration",
      focus: "Technology transfer",
    },
  ],
  planned: [
    {
      partner: "Paramount Group",
      type: "Manufacturing",
      focus: "Production scaling and international market access",
    },
    {
      partner: "University Partners",
      names: ["Wits", "UCT", "Stellenbosch"],
      type: "Research",
      focus: "Research programs",
    },
    {
      partner: "BRICS Partners",
      type: "International",
      focus: "Defense technology cooperation",
    },
  ],
};

/** Company Structure */
export const companyStructure = {
  primary: {
    type: "Delaware C-Corp",
    status: "In progress",
    purpose: "US/ITAR market access",
  },
  secondary: {
    type: "South African Entity",
    status: "Planned Q2 2026",
    purpose: "Global non-ITAR market access",
  },
  advantage: "Dual entity structure for global market access",
  itarStatus: {
    current: "Pathway in development",
    target: "DoD contractor eligibility",
  },
};

/** Contact Information */
export const contact = {
  general: {
    email: "contact@phoenixvc.tech",
    phone: "+27 (0) 10 880 0000",
    website: process.env.MARKETING_URL || "",
    linkedin: "Phoenix Rooivalk Defense Systems",
  },
  inquiries: {
    investment: "investors@phoenixvc.tech",
    technical: "technical@phoenixvc.tech",
    partnerships: "partnerships@phoenixvc.tech",
  },
};
