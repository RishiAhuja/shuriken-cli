import pc from "picocolors";

export const theme = {
  brand: (text: string) => `\x1b[38;2;225;29;72m${text}\x1b[0m`,
  muted: pc.dim,
  success: pc.green,
  error: pc.red,
  warn: pc.yellow,
  bold: pc.bold,
  cyan: pc.cyan,
};

export function brand(text: string): string {
  return theme.brand(text);
}
