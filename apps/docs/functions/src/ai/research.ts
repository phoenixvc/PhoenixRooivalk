/**
 * Person Research AI Function
 *
 * Generates fun facts about users from their LinkedIn profile.
 */

import * as functions from "firebase-functions";
import { chatCompletion } from "../ai-provider";
import { checkRateLimit, logUsage } from "./rate-limit";
import { PROMPTS } from "./prompts";

interface ResearchPersonRequest {
  firstName: string;
  lastName: string;
  linkedInUrl: string;
}

interface FunFact {
  id: string;
  fact: string;
  category: "professional" | "education" | "achievement" | "interest" | "other";
}

interface FunFactsResult {
  facts: FunFact[];
  summary: string;
}

// LinkedIn URL validation regex
const LINKEDIN_REGEX =
  /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|profile)\/[\w-]+\/?$/i;

/**
 * Research a person and generate fun facts
 */
export const researchPerson = functions.https.onCall(
  async (data: ResearchPersonRequest, context): Promise<FunFactsResult> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to use AI features",
      );
    }

    const canProceed = await checkRateLimit(context.auth.uid, "research");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Try again later.",
      );
    }

    // Safe destructuring with fallback to prevent null/undefined errors
    const { firstName, lastName, linkedInUrl } = (data ?? {}) as ResearchPersonRequest;

    // Validate that all required fields are strings
    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof linkedInUrl !== "string" ||
      !firstName.trim() ||
      !lastName.trim() ||
      !linkedInUrl.trim()
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "First name, last name, and LinkedIn URL are required",
      );
    }

    // Validate LinkedIn URL format
    if (!LINKEDIN_REGEX.test(linkedInUrl)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid LinkedIn URL format",
      );
    }

    try {
      const { content, metrics } = await chatCompletion(
        [
          { role: "system", content: PROMPTS.research.system },
          {
            role: "user",
            content: PROMPTS.research.user(firstName, lastName, linkedInUrl),
          },
        ],
        { model: "chat", maxTokens: 1500, temperature: 0.7 },
      );

      // Parse the JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as FunFactsResult;

        // Validate and sanitize the response
        if (parsed.facts && Array.isArray(parsed.facts)) {
          const validCategories = [
            "professional",
            "education",
            "achievement",
            "interest",
            "other",
          ];

          // Ensure each fact has required fields
          parsed.facts = parsed.facts
            .filter((f) => f.fact && f.category)
            .map((f, index) => ({
              id: f.id || `fact-${index + 1}`,
              fact: f.fact,
              category: validCategories.includes(f.category)
                ? f.category
                : "other",
            })) as FunFact[];

          // Isolate logUsage in its own try/catch so logging errors don't fail the function
          try {
            await logUsage(context.auth.uid, "research_person", {
              provider: metrics.provider,
              model: metrics.model,
              tokens: metrics.totalTokens,
            });
          } catch (logError) {
            functions.logger.warn("Failed to log usage for research_person:", logError);
          }

          return {
            facts: parsed.facts,
            summary:
              parsed.summary || `Welcome ${firstName} to Phoenix Rooivalk!`,
          };
        }
      }

      // Fallback response if parsing fails
      functions.logger.warn(
        "Failed to parse fun facts response, using fallback",
      );
      return createFallbackResponse(firstName, lastName);
    } catch (error) {
      functions.logger.error("Research person error:", error);
      return createFallbackResponse(firstName, lastName);
    }
  },
);

/**
 * Create fallback response when AI fails
 */
function createFallbackResponse(
  firstName: string,
  lastName: string,
): FunFactsResult {
  return {
    facts: [
      {
        id: "fact-1",
        fact: `${firstName} is joining the Phoenix Rooivalk documentation team.`,
        category: "professional",
      },
      {
        id: "fact-2",
        fact: "Ready to explore cutting-edge counter-drone technology.",
        category: "interest",
      },
    ],
    summary: `Welcome ${firstName} ${lastName} to Phoenix Rooivalk!`,
  };
}
