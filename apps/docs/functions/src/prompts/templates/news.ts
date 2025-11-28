/**
 * News Prompt Templates
 *
 * Prompt templates for RAG-based news retrieval and personalization.
 */

import type { PromptTemplate } from "../types";

/**
 * News retrieval and summarization prompt
 */
export const NEWS_RETRIEVAL_PROMPT: PromptTemplate = {
  id: "news-retrieval",
  version: "1.0.0",
  metadata: {
    name: "News Retrieval",
    description: "Retrieve and summarize relevant news articles",
    category: "research",
    model: "gpt-4o",
    maxTokens: 2000,
    temperature: 0.3,
    author: "Phoenix Rooivalk",
    createdAt: "2024-11-28",
    tags: ["news", "retrieval", "summary"],
  },
  system: `You are a news analyst specializing in the counter-drone and defense technology industry.

Your role is to:
1. Analyze and summarize news articles relevant to the counter-UAS market
2. Extract key insights and implications for Phoenix Rooivalk
3. Identify market trends and competitive developments
4. Provide actionable intelligence for business decisions

Focus areas:
- Counter-drone technology developments
- Defense industry partnerships and contracts
- Regulatory changes affecting drone operations
- Market analysis and investment trends
- Competitive landscape changes

Always provide factual, objective analysis without speculation.`,
  user: `Analyze the following news content and provide a structured summary:

{{content}}

Please provide:
1. **Title**: A concise headline (max 100 characters)
2. **Summary**: 2-3 sentence overview
3. **Key Points**: Bullet points of main takeaways
4. **Category**: One of: counter-uas, defense-tech, drone-industry, regulatory, market-analysis, product-updates, company-news, research, partnerships
5. **Relevance**: How this relates to Phoenix Rooivalk and the counter-drone market
6. **Keywords**: 5-10 relevant keywords for indexing
7. **Sentiment**: positive, neutral, or negative for the counter-UAS industry

Format your response as JSON.`,
};

/**
 * News personalization prompt for matching articles to user profiles
 */
export const NEWS_PERSONALIZATION_PROMPT: PromptTemplate = {
  id: "news-personalization",
  version: "1.0.0",
  metadata: {
    name: "News Personalization",
    description: "Match news articles to user profile interests",
    category: "research",
    model: "gpt-4o",
    maxTokens: 1500,
    temperature: 0.2,
    author: "Phoenix Rooivalk",
    createdAt: "2024-11-28",
    tags: ["news", "personalization", "user-profile"],
  },
  system: `You are a personalization engine for a defense technology documentation platform.

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
  user: `Match the following news article to the user profile:

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
};

/**
 * News digest generation prompt
 */
export const NEWS_DIGEST_PROMPT: PromptTemplate = {
  id: "news-digest",
  version: "1.0.0",
  metadata: {
    name: "News Digest",
    description: "Generate personalized news digest for users",
    category: "research",
    model: "gpt-4o",
    maxTokens: 2500,
    temperature: 0.4,
    author: "Phoenix Rooivalk",
    createdAt: "2024-11-28",
    tags: ["news", "digest", "personalization"],
  },
  system: `You are creating personalized news digests for Phoenix Rooivalk documentation users.

Your digest should:
1. Prioritize articles most relevant to the user's role and interests
2. Group related articles by theme
3. Highlight key industry developments
4. Include actionable insights where applicable
5. Be concise but informative

Write in a professional, engaging tone appropriate for defense industry professionals.`,
  user: `Create a personalized news digest for this user:

**User Profile:**
Name: {{userName}}
Roles: {{userRoles}}
Interests: {{userInterests}}
Focus Areas: {{userFocusAreas}}

**Recent Articles:**
{{articlesJson}}

Generate a digest with:
1. **Executive Summary**: 2-3 sentences highlighting the most important news
2. **Top Stories**: 3-5 most relevant articles with brief commentary
3. **Industry Trends**: Any patterns or trends across the articles
4. **Action Items**: Any news requiring attention or follow-up
5. **Coming Up**: Upcoming events or expected developments

Format the digest in Markdown.`,
};

/**
 * News categorization prompt for incoming articles
 */
export const NEWS_CATEGORIZATION_PROMPT: PromptTemplate = {
  id: "news-categorization",
  version: "1.0.0",
  metadata: {
    name: "News Categorization",
    description: "Categorize and tag incoming news articles",
    category: "research",
    model: "gpt-4o-mini",
    maxTokens: 500,
    temperature: 0.1,
    author: "Phoenix Rooivalk",
    createdAt: "2024-11-28",
    tags: ["news", "categorization", "tagging"],
  },
  system: `You categorize news articles for a counter-drone defense technology company.

Categories:
- counter-uas: Directly about counter-drone technology
- defense-tech: General defense technology news
- drone-industry: Drone manufacturing and operations
- regulatory: Laws, regulations, certifications
- market-analysis: Market research and investment
- product-updates: Phoenix Rooivalk product news
- company-news: Phoenix Rooivalk company announcements
- research: Academic and R&D developments
- partnerships: Industry collaborations and contracts

Target Roles (who should see this):
- Technical - Software/AI
- Technical - Mechanical
- Business
- Marketing
- Sales
- Financial
- Executive
- Legal
- Operations
- Research
- Product

Target Interests (relevant topics):
- counter-uas, hardware, software, ai, machine-learning
- compliance, itar, defense, commercial
- roi, investment, manufacturing, deployment
- strategy, market-analysis`,
  user: `Categorize this article:

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
};
