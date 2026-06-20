#!/usr/bin/env tsx
/**
 * Build a template snapshot from the {{APP_NAME}} repo for the create-shuriken CLI.
 * Copies the repo to dist/template/, respecting .templateignore patterns,
 * then replaces project-specific values with {{TOKEN}} placeholders.
 */

import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = join(ROOT, "dist", "template");
const ARCHIVE_PATH = join(ROOT, "dist", "shuriken-template.tar.gz");

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
]);

/** Applied longest-first to avoid partial replacements */
const TOKEN_REPLACEMENTS: [string, string][] = [
  ["{{GITHUB_REPO}}", "{{GITHUB_REPO}}"],
  ["{{LANDING_URL}}", "{{LANDING_URL}}"],
  ["{{MAIN_APP_URL}}", "{{MAIN_APP_URL}}"],
  ["{{DOCKER_PREFIX}}-postgres", "{{DOCKER_PREFIX}}-postgres"],
  ["{{DOCKER_PREFIX}}-redis", "{{DOCKER_PREFIX}}-redis"],
  ["{{DOCKER_PREFIX}}-app", "{{DOCKER_PREFIX}}-app"],
  ["{{DB_NAME_PROD}}", "{{DB_NAME_PROD}}"],
  ["{{DB_NAME}}", "{{DB_NAME}}"],
  ['"name": "{{PROJECT_NAME}}"', '"name": "{{PROJECT_NAME}}"'],
  ["{{APP_NAME}}", "{{APP_NAME}}"],
  ["next dev -p {{LANDING_PORT}}", "next dev -p {{LANDING_PORT}}"],
  ["next start -p {{LANDING_PORT}}", "next start -p {{LANDING_PORT}}"],
  ['- "{{MAIN_PORT}}:3000"', '- "{{MAIN_PORT}}:3000"'],
];

function loadIgnorePatterns(): string[] {
  const ignoreFile = join(ROOT, ".templateignore");
  if (!existsSync(ignoreFile)) {
    return [];
  }

  return readFileSync(ignoreFile, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function normalizePattern(pattern: string): string {
  let p = pattern.replace(/\/$/, "");
  if (p.startsWith("/")) {
    p = p.slice(1);
  }
  return p;
}

function shouldIgnore(relativePath: string, patterns: string[]): boolean {
  const normalized = relativePath.replace(/\\/g, "/");

  for (const pattern of patterns) {
    const p = normalizePattern(pattern);

    if (p.endsWith("/**")) {
      const prefix = p.slice(0, -3);
      if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
        return true;
      }
      continue;
    }

    if (p.includes("*")) {
      const regex = new RegExp(
        `^${p.replace(/\./g, "\\.").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*")}$`,
      );
      if (regex.test(normalized)) {
        return true;
      }
      continue;
    }

    if (normalized === p || normalized.startsWith(`${p}/`)) {
      return true;
    }
  }

  return false;
}

function tokenizeContent(content: string): string {
  let result = content;
  for (const [from, to] of TOKEN_REPLACEMENTS) {
    result = result.replaceAll(from, to);
  }
  return result;
}

function isTextFile(filePath: string): boolean {
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return !BINARY_EXTENSIONS.has(ext);
}

function copyAndTokenize(src: string, dest: string, patterns: string[]): void {
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const relPath = relative(ROOT, srcPath);

    if (shouldIgnore(relPath, patterns)) {
      continue;
    }

    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyAndTokenize(srcPath, destPath, patterns);
    } else if (entry.isFile()) {
      if (isTextFile(srcPath)) {
        const content = readFileSync(srcPath, "utf8");
        writeFileSync(destPath, tokenizeContent(content), "utf8");
      } else {
        cpSync(srcPath, destPath);
      }
    }
  }
}

function main() {
  const patterns = loadIgnorePatterns();

  console.log("Building template snapshot...");
  console.log(`Source: ${ROOT}`);
  console.log(`Output: ${OUTPUT_DIR}`);

  if (existsSync(OUTPUT_DIR)) {
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  copyAndTokenize(ROOT, OUTPUT_DIR, patterns);

  console.log("Creating archive...");
  mkdirSync(join(ROOT, "dist"), { recursive: true });
  if (existsSync(ARCHIVE_PATH)) {
    rmSync(ARCHIVE_PATH);
  }

  execSync(`tar -czf "${ARCHIVE_PATH}" -C "${join(ROOT, "dist")}" template`, {
    stdio: "inherit",
  });

  const sizeMb = (statSync(ARCHIVE_PATH).size / (1024 * 1024)).toFixed(2);
  console.log(`Template built: ${OUTPUT_DIR}`);
  console.log(`Archive: ${ARCHIVE_PATH} (${sizeMb} MB)`);
}

main();
