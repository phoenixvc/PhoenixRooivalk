/**
 * AI Chat Components
 *
 * Integrated AI assistant for the documentation site.
 */

export { AIChatInterface } from "./AIChatInterface";
export { AISearchBar } from "./AISearchBar";
export { AIContextButton } from "./AIContextButton";
export { AIFloatingWidget } from "./AIFloatingWidget";

export default {
  AIChatInterface: () => import("./AIChatInterface"),
  AISearchBar: () => import("./AISearchBar"),
  AIContextButton: () => import("./AIContextButton"),
  AIFloatingWidget: () => import("./AIFloatingWidget"),
};
