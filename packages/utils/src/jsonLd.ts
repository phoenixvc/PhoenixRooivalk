/**
 * Safely serializes an object to a JSON string for use in JSON-LD script blocks.
 * Escapes characters that could be used to break out of a <script> tag.
 *
 * @param data The object to serialize
 * @returns A safely escaped JSON string, or an empty object string if serialization fails
 */
export function serializeJsonLd(data: unknown): string {
  const json = JSON.stringify(data);

  if (json === undefined) {
    return "{}";
  }

  // Escape '<' and '>' to prevent </script> tags from ending the script block early
  // and other characters that might be problematic in some contexts.
  return json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}
