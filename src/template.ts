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
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ProjectConfig, TokenMap } from "./types.js";

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

const SKIP_DIRS = new Set([".git", "node_modules"]);

function getTemplateRoot(): string {
  const cliRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
  return join(cliRoot, "template");
}

function buildTokenMap(config: ProjectConfig): TokenMap {
  return {
    PROJECT_NAME: config.projectName,
    APP_NAME: config.appName,
    MAIN_PORT: String(config.mainPort),
    LANDING_PORT: String(config.landingPort),
    MAIN_APP_URL: config.mainAppUrl,
    LANDING_URL: config.landingUrl,
    DB_NAME: config.dbName,
    DB_NAME_PROD: config.dbNameProd,
    DOCKER_PREFIX: config.dockerPrefix,
    GITHUB_REPO: config.githubRepo,
  };
}

function applyTokens(content: string, tokens: TokenMap): string {
  let result = content;
  for (const [key, value] of Object.entries(tokens)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

function shouldSkipPath(relativePath: string, config: ProjectConfig): boolean {
  if (!config.includeLanding && relativePath.startsWith("landing")) {
    return true;
  }
  if (
    !config.includeDocker &&
    relativePath.startsWith("infrastructure")
  ) {
    return true;
  }
  if (!config.includeHusky && relativePath.startsWith(".husky")) {
    return true;
  }
  return false;
}

function isTextFile(filePath: string): boolean {
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return !BINARY_EXTENSIONS.has(ext);
}

function copyTemplateDir(
  src: string,
  dest: string,
  templateRoot: string,
  tokens: TokenMap,
  config: ProjectConfig,
): void {
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }

    const srcPath = join(src, entry.name);
    const relPath = relative(templateRoot, srcPath);

    if (shouldSkipPath(relPath, config)) {
      continue;
    }

    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyTemplateDir(srcPath, destPath, templateRoot, tokens, config);
    } else if (entry.isFile()) {
      if (isTextFile(srcPath)) {
        const content = readFileSync(srcPath, "utf8");
        writeFileSync(destPath, applyTokens(content, tokens), "utf8");
      } else {
        cpSync(srcPath, destPath);
      }
    }
  }
}

export function scaffoldProject(config: ProjectConfig): void {
  const templateRoot = getTemplateRoot();

  if (!existsSync(templateRoot)) {
    throw new Error(
      `Template not found at ${templateRoot}. Run pnpm template:build in the Shuriken repo.`,
    );
  }

  const targetDir = resolve(config.targetDir);

  if (existsSync(targetDir)) {
    const entries = readdirSync(targetDir);
    if (entries.length > 0 && !config.force) {
      throw new Error(
        `Directory "${targetDir}" is not empty. Use --force to scaffold anyway.`,
      );
    }
  } else {
    mkdirSync(targetDir, { recursive: true });
  }

  const tokens = buildTokenMap(config);
  copyTemplateDir(templateRoot, targetDir, templateRoot, tokens, config);
}

export function getTargetSize(targetDir: string): number {
  let total = 0;

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        total += statSync(full).size;
      }
    }
  }

  walk(resolve(targetDir));
  return total;
}
