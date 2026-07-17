import { QRType } from "./api";

export const QR_TYPES: { value: QRType; label: string; icon: string }[] = [
  { value: "url", label: "Website", icon: "🌐" },
  { value: "text", label: "Text", icon: "📝" },
  { value: "wifi", label: "WiFi", icon: "📶" },
  { value: "contact", label: "Contact", icon: "👤" },
  { value: "email", label: "Email", icon: "📧" },
  { value: "location", label: "Location", icon: "📍" },
];

export const COLOR_PRESETS = [
  { name: "Classic Black", fill: "#000000", back: "#FFFFFF" },
  { name: "Ember", fill: "#FF6B35", back: "#14120F" },
  { name: "Ocean", fill: "#0EA5E9", back: "#0C1E2B" },
  { name: "Forest", fill: "#22C55E", back: "#0D1F13" },
];

/** Looks up display label + icon for a given QR type value, with a safe fallback. */
export function getTypeMeta(type: string) {
  return (
    QR_TYPES.find((t) => t.value === type) || { value: type, label: type, icon: "▦" }
  );
}