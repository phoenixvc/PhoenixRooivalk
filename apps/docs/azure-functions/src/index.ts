/**
 * Azure Functions Entry Point
 * This file imports all function modules to register them with the Azure Functions runtime.
 * The v4 programming model uses app.http() etc. to auto-register functions on import.
 */

// Health & Status
import "./functions/health";

// Configuration & Admin
import "./functions/admin";
import "./functions/config";

// AI Functions
import "./functions/ai";
import "./functions/askDocumentation";
import "./functions/suggestImprovements";
import "./functions/analyzeCompetitors";
import "./functions/generateSWOT";
import "./functions/getMarketInsights";
import "./functions/summarizeContent";

// News & Content
import "./functions/news";
import "./functions/news-ingestion";
import "./functions/news-analytics";

// Documentation & Search
import "./functions/searchDocs";
import "./functions/indexDocuments";
import "./functions/indexing";
import "./functions/getReadingRecommendations";

// Access & Security
import "./functions/access-applications";
import "./functions/known-emails";

// Notifications & Communication
import "./functions/notifications";
import "./functions/send-email";

// Reports & Scheduling
import "./functions/weekly-reports";
import "./functions/scheduled";

// Support & Utilities
import "./functions/support";
import "./functions/cosmos-proxy";

// Export for potential testing
export {};
