/**
 * News Prompt Templates
 *
 * Centralized prompts for news-related AI operations.
 * Uses dynamic configuration from config/news.ts.
 */

import { PromptTemplate } from "./types";
import {
  getCategoriesForPrompt,
  getRolesForPrompt,
  getInterestsForPrompt,
} from "../config";

/**
 * News categorization prompt
 */
export const NEWS_CATEGORIZATION_PROMPT: PromptTemplate = {
  metadata: {
    id: "news-categorization",
    name: "News Categorization",
    description: "Categorize and tag incoming news articles",
    category: "research",
    version: "1.0.0",
    recommendedModel: "chatFast",
    maxTokens: 500,
    temperature: 0.1,
    tags: ["news", "categorization", "tagging"],
  },
  system: {
    base: `You categorize news articles for a counter-drone defense technology company.

Categories:
${getCategoriesForPrompt()}

Target Roles (who should see this):
${getRolesForPrompt()}

Target Interests (relevant topics):
${getInterestsForPrompt()}`,
  },
  user: {
    template: `Categorize this article:

Title: {{title}}
Content: {{content}}

Respond with JSON:
{
  "category": "one category from the list",
  "targetRoles": ["relevant roles"],
  "targetInterests": ["relevant interests"],
  "keywords": ["5-10 keywords"],
  "isGeneral": true/false (true if relevant to all users),
  "sentiment": "positive/neutral/negative"
}`,
    requiredVariables: ["title", "content"],
  },
  outputFormat: "json",
};

/**
 * News personalization prompt
 */
export const NEWS_PERSONALIZATION_PROMPT: PromptTemplate = {
  metadata: {
    id: "news-personalization",
    name: "News Personalization",
    description: "Match news articles to user profile interests",
    category: "research",
    version: "1.0.0",
    recommendedModel: "chat",
    maxTokens: 300,
    temperature: 0.2,
    tags: ["news", "personalization", "user-profile"],
  },
  system: {
    base: `You are a personalization engine for a defense technology documentation platform.

Your role is to match news articles to user profiles based on:
1. User roles (e.g., Technical, Business, Executive, Legal)
2. User interests (e.g., counter-uas, hardware, software, ai, compliance)
3. User focus areas (e.g., executive, technical, operations)
4. Experience level (beginner, intermediate, advanced)

Score each article's relevance from 0 to 1, where:
- 1.0 = Highly relevant, directly matches user's primary interests and roles
- 0.7-0.9 = Very relevant, matches multiple user attributes
- 0.4-0.6 = Moderately relevant, matches some user attributes
- 0.1-0.3 = Slightly relevant, tangentially related
- 0.0 = Not relevant

Be generous but accurate - err on the side of including relevant content.`,
  },
  user: {
    template: `Match the following news article to the user profile:

**Article:**
Title: {{articleTitle}}
Summary: {{articleSummary}}
Category: {{articleCategory}}
Keywords: {{articleKeywords}}
Target Roles: {{articleTargetRoles}}
Target Interests: {{articleTargetInterests}}

**User Profile:**
Roles: {{userRoles}}
Interests: {{userInterests}}
Focus Areas: {{userFocusAreas}}
Experience Level: {{userExperienceLevel}}

Provide a relevance assessment as JSON:
{
  "score": <0-1>,
  "matchedRoles": ["list of matched roles"],
  "matchedInterests": ["list of matched interests"],
  "matchedFocusAreas": ["list of matched focus areas"],
  "reason": "Brief explanation of relevance",
  "isSpecialized": <true if article is specifically relevant to this user's profile>
}`,
    requiredVariables: [
      "articleTitle",
      "articleSummary",
      "articleCategory",
      "articleKeywords",
      "articleTargetRoles",
      "articleTargetInterests",
      "userRoles",
      "userInterests",
      "userFocusAreas",
      "userExperienceLevel",
    ],
  },
  outputFormat: "json",
};

/**
 * News summary prompt
 */
export const NEWS_SUMMARY_PROMPT: PromptTemplate = {
  metadata: {
    id: "news-summary",
    name: "News Summary",
    description: "Generate concise summary of news article",
    category: "generation",
    version: "1.0.0",
    recommendedModel: "chatFast",
    maxTokens: 200,
    temperature: 0.3,
    tags: ["news", "summary"],
  },
  system: {
    base: `You are a news summarizer for a defense technology company.
Create concise, informative summaries that capture the key points.
Focus on relevance to the counter-UAS and defense technology industry.`,
  },
  user: {
    template: `Summarize this news article in 2-3 sentences:

Title: {{title}}

{{content}}`,
    requiredVariables: ["title", "content"],
  },
  outputFormat: "text",
};

/**
 * News digest generation prompt
 */
export const NEWS_DIGEST_PROMPT: PromptTemplate = {
  metadata: {
    id: "news-digest",
    name: "News Digest",
    description: "Generate personalized news digest for users",
    category: "generation",
    version: "1.0.0",
    recommendedModel: "chat",
    maxTokens: 1500,
    temperature: 0.5,
    tags: ["news", "digest", "personalization"],
  },
  system: {
    base: `You are a defense industry news analyst specializing in counter-drone technology.

Generate a brief news digest covering recent developments in the specified topics.
Focus on:
- Recent contracts and funding announcements
- Technology breakthroughs
- Regulatory changes
- Market trends
- Notable incidents or deployments

Be factual and cite general knowledge. If you're unsure about recent events, indicate the information may not be current.`,
  },
  user: {
    template: `Generate a news digest for the following topics: {{topics}}

{{#userRoles}}
Focus on content relevant to these roles: {{userRoles}}
{{/userRoles}}

Format as a brief digest with 3-5 key items.`,
    requiredVariables: ["topics"],
    optionalVariables: { userRoles: "" },
  },
  outputFormat: "markdown",
};
