import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execa, type ExecaError } from "execa";
import type { ProjectConfig } from "./types.js";

interface AgeKeyPair {
  publicKey: string;
  privateKey: string;
}

async function commandExists(command: string): Promise<boolean> {
  try {
    await execa("which", [command]);
    return true;
  } catch {
    return false;
  }
}

async function generateAgeKeyPair(): Promise<AgeKeyPair> {
  const tempDir = mkdtempSync(join(tmpdir(), "create-shuriken-age-"));
  const keyPath = join(tempDir, "identity.txt");

  try {
    await execa("age-keygen", ["-o", keyPath]);
    const content = readFileSync(keyPath, "utf8");
    const lines = content.trim().split("\n");
    const publicLine = lines.find((line) => line.startsWith("# public key:"));
    const privateKey = lines.find((line) => line.startsWith("AGE-SECRET-KEY-"));

    if (!publicLine || !privateKey) {
      throw new Error("Failed to parse age-keygen output");
    }

    return {
      publicKey: publicLine.replace("# public key:", "").trim(),
      privateKey: privateKey.trim(),
    };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function buildSecretsYaml(config: ProjectConfig): string {
  return [
    `DATABASE_URL: postgresql://postgres:postgres@localhost:5432/${config.dbName}`,
    `NEXT_PUBLIC_MAIN_APP_URL: ${config.mainAppUrl}`,
    `NEXT_PUBLIC_LANDING_URL: ${config.landingUrl}`,
    `NEXT_PUBLIC_APP_NAME: ${config.appName}`,
    `LOG_LEVEL: debug`,
    config.seedAdmin ? `ADMIN_EMAIL: ${config.adminEmail}` : "",
    config.seedAdmin ? `ADMIN_PASSWORD: ${config.adminPassword}` : "",
    config.seedAdmin ? `ADMIN_NAME: ${config.adminName}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function verifySopsTools(): Promise<string | undefined> {
  const hasAge = await commandExists("age-keygen");
  const hasSops = await commandExists("sops");

  if (!hasAge || !hasSops) {
    return (
      "SOPS setup requires age and sops on your PATH.\n" +
      "Install with: brew install age sops"
    );
  }

  return undefined;
}

export async function setupSops(config: ProjectConfig): Promise<void> {
  const targetDir = resolve(config.targetDir);
  const secretsDir = join(targetDir, "secrets");
  mkdirSync(secretsDir, { recursive: true });

  const { publicKey, privateKey } = await generateAgeKeyPair();

  writeFileSync(
    join(targetDir, ".sops.yaml"),
    [
      "creation_rules:",
      "  - path_regex: secrets/.*\\.yaml$",
      `    age: ${publicKey}`,
      "",
    ].join("\n"),
    "utf8",
  );

  const ageKeyPath = join(targetDir, ".age-key.txt");
  writeFileSync(ageKeyPath, `${privateKey}\n`, { mode: 0o600 });
  chmodSync(ageKeyPath, 0o600);

  const plainSecretsRel = "secrets/local.yaml";
  const encSecretsRel = "secrets/local.enc.yaml";
  writeFileSync(
    join(targetDir, plainSecretsRel),
    `${buildSecretsYaml(config)}\n`,
    "utf8",
  );

  try {
    // Flags before positional args; --age avoids creation-rule mismatch on plain local.yaml
    await execa(
      "sops",
      [
        "--encrypt",
        "--age",
        publicKey,
        "--output",
        encSecretsRel,
        plainSecretsRel,
      ],
      {
        cwd: targetDir,
        env: {
          ...process.env,
          SOPS_AGE_KEY_FILE: ageKeyPath,
        },
      },
    );
  } catch (error) {
    const execError = error as ExecaError;
    const detail =
      execError.stderr?.toString().trim() ||
      execError.stdout?.toString().trim() ||
      execError.message;
    throw new Error(`SOPS encryption failed:\n${detail}`);
  }

  unlinkSync(join(targetDir, plainSecretsRel));
}
