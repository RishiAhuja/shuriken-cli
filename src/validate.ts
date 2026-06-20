import { readdirSync } from "node:fs";
import validatePackageName from "validate-npm-package-name";

export function validateProjectName(name: string): string | undefined {
  const result = validatePackageName(name);
  if (!result.validForNewPackages) {
    return (
      result.errors?.[0] ||
      result.warnings?.[0] ||
      "Invalid package name"
    );
  }
  return undefined;
}

export function toDisplayName(projectName: string): string {
  return projectName
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function toDbName(projectName: string, suffix = "dev"): string {
  const base = projectName.replace(/-/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  return `${base}_${suffix}`;
}

export function toDockerPrefix(projectName: string): string {
  return projectName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
}

export function parsePort(value: string, label: string): number {
  const port = Number.parseInt(value, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`${label} must be a valid port (1-65535)`);
  }
  return port;
}

export function isDirectoryEmpty(dir: string): boolean {
  try {
    const entries = readdirSync(dir);
    return entries.length === 0;
  } catch {
    return true;
  }
}
