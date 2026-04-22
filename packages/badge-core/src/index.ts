export interface BadgeRenderModel {
  label: string;
  value: string;
  accentColor?: string;
}

export interface ProgrammersBadgeModel {
  solvedCount: number;
  badgeTier: "starter" | "intermediate" | "advanced";
}

const DEFAULT_ACCENT_COLOR = "#1d4ed8";
const TIER_ACCENT_COLORS: Record<ProgrammersBadgeModel["badgeTier"], string> = {
  starter: "#1d4ed8",
  intermediate: "#7c3aed",
  advanced: "#ea580c",
};

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const renderBadgeSvg = ({
  label,
  value,
  accentColor = DEFAULT_ACCENT_COLOR,
}: BadgeRenderModel): string => {
  const safeLabel = escapeXml(label);
  const safeValue = escapeXml(value);

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="280" height="72" viewBox="0 0 280 72" role="img" aria-label="Programmers badge">',
    '<rect width="280" height="72" rx="16" fill="#0f172a" />',
    `<rect x="12" y="12" width="6" height="48" rx="3" fill="${escapeXml(accentColor)}" />`,
    `<text x="32" y="30" fill="#cbd5e1" font-size="14" font-family="Verdana, sans-serif">${safeLabel}</text>`,
    `<text x="32" y="52" fill="#f8fafc" font-size="22" font-weight="700" font-family="Verdana, sans-serif">${safeValue}</text>`,
    "</svg>",
  ].join("");
};

const formatTierLabel = (badgeTier: ProgrammersBadgeModel["badgeTier"]): string =>
  `${badgeTier.slice(0, 1).toUpperCase()}${badgeTier.slice(1)}`;

export const createProgrammersBadgeRenderModel = ({
  solvedCount,
  badgeTier,
}: ProgrammersBadgeModel): BadgeRenderModel => ({
  label: "Programmers Badge",
  value: `${formatTierLabel(badgeTier)} · ${solvedCount} solved`,
  accentColor: TIER_ACCENT_COLORS[badgeTier],
});
