import { resolve } from "node:path";
import { execa, type ExecaError } from "execa";
import type { ProjectConfig } from "./types.js";

async function runStep(
  label: string,
  cwd: string,
  args: string[],
  onStep?: (message: string) => void,
): Promise<void> {
  onStep?.(label);
  try {
    await execa("pnpm", args, { cwd, stdio: "pipe" });
  } catch (error) {
    const execError = error as ExecaError;
    const stderr = execError.stderr?.toString().trim();
    const stdout = execError.stdout?.toString().trim();
    const detail = stderr || stdout || execError.message;
    throw new Error(`${label} failed:\n${detail}`);
  }
}

export async function runPostInstall(
  config: ProjectConfig,
  onStep?: (message: string) => void,
): Promise<void> {
  const targetDir = resolve(config.targetDir);

  if (config.runInstall) {
    await runStep(
      "Installing dependencies (root)",
      targetDir,
      ["install"],
      onStep,
    );

    if (config.includeLanding) {
      await runStep(
        "Installing dependencies (landing)",
        resolve(targetDir, "landing"),
        ["install"],
        onStep,
      );
    }

    await runStep(
      "Generating Prisma client",
      targetDir,
      ["db:generate"],
      onStep,
    );
  }

  if (config.initGit) {
    onStep?.("Initializing git repository...");
    try {
      await execa("git", ["init"], { cwd: targetDir, stdio: "pipe" });
      await execa("git", ["add", "."], { cwd: targetDir, stdio: "pipe" });
      await execa(
        "git",
        ["commit", "-m", "Initial commit from create-shuriken"],
        { cwd: targetDir, stdio: "pipe" },
      );
    } catch {
      onStep?.("Git init skipped (configure git user.name and user.email)");
    }
  }
}

export async function verifyPnpm(): Promise<string | undefined> {
  try {
    await execa("pnpm", ["--version"]);
    return undefined;
  } catch {
    return "pnpm is required. Install with: npm install -g pnpm";
  }
}
