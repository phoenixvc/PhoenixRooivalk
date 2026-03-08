export const downloadWhitepaper = (customUrl?: string): void => {
  if (typeof window === "undefined") return; // SSR guard

  const url = customUrl || "/technical-whitepaper.md";
  const link = document.createElement("a");

  link.href = url;
  link.download = "Phoenix-Rooivalk-Technical-Whitepaper.md";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
