import * as p from "@clack/prompts";
import { resolve } from "node:path";
import pc from "picocolors";
import type { ProjectConfig } from "./types.js";
import {
  parsePort,
  toDbName,
  toDisplayName,
  toDockerPrefix,
  validateProjectName,
} from "./validate.js";
import { brand } from "./ui/theme.js";

export interface CliArgs {
  dir?: string;
  name?: string;
  appName?: string;
  mainPort?: string;
  landingPort?: string;
  githubRepo?: string;
  noLanding?: boolean;
  noDocker?: boolean;
  noHusky?: boolean;
  noGit?: boolean;
  noInstall?: boolean;
  sops?: boolean;
  force?: boolean;
  yes?: boolean;
}

function cancelIfNeeded(value: unknown): void {
  if (p.isCancel(value)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }
}

export async function collectConfig(args: CliArgs): Promise<ProjectConfig> {
  const defaults = buildDefaults(args);

  if (args.yes) {
    return defaults;
  }

  p.intro(brand(" create-shuriken "));

  let projectName = args.name;
  if (!projectName) {
    const answer = await p.text({
      message: "Project name",
      placeholder: "my-app",
      defaultValue: defaults.projectName,
      validate: (value) => validateProjectName(value || "") || undefined,
    });
    cancelIfNeeded(answer);
    projectName = answer as string;
  }

  const defaultDir = args.dir || projectName;
  let targetDir = defaultDir;
  if (!args.dir) {
    const dirAnswer = await p.text({
      message: "Target directory",
      defaultValue: defaultDir,
    });
    cancelIfNeeded(dirAnswer);
    targetDir = dirAnswer as string;
  }

  let appName = args.appName || toDisplayName(projectName);
  if (!args.appName) {
    const appNameAnswer = await p.text({
      message: "App display name",
      defaultValue: appName,
    });
    cancelIfNeeded(appNameAnswer);
    appName = appNameAnswer as string;
  }

  let mainPort = defaults.mainPort;
  let landingPort = defaults.landingPort;
  let githubRepo = defaults.githubRepo;

  if (!args.yes) {
    const customize = await p.confirm({
      message: "Customize ports and GitHub URL?",
      initialValue: false,
    });
    cancelIfNeeded(customize);

    if (customize) {
      const mainPortAnswer = await p.text({
        message: "Main app port",
        defaultValue: String(mainPort),
        validate: (v) => {
          try {
            parsePort(v || "3000", "Main app port");
            return undefined;
          } catch (e) {
            return e instanceof Error ? e.message : "Invalid port";
          }
        },
      });
      cancelIfNeeded(mainPortAnswer);
      mainPort = parsePort(mainPortAnswer as string, "Main app port");

      const landingPortAnswer = await p.text({
        message: "Landing app port",
        defaultValue: String(landingPort),
        validate: (v) => {
          try {
            parsePort(v || "3001", "Landing app port");
            return undefined;
          } catch (e) {
            return e instanceof Error ? e.message : "Invalid port";
          }
        },
      });
      cancelIfNeeded(landingPortAnswer);
      landingPort = parsePort(landingPortAnswer as string, "Landing app port");

      const githubAnswer = await p.text({
        message: "GitHub repository URL",
        defaultValue: githubRepo,
      });
      cancelIfNeeded(githubAnswer);
      githubRepo = githubAnswer as string;
    }
  }

  let includeLanding = !args.noLanding;
  let includeDocker = !args.noDocker;
  let includeHusky = !args.noHusky;
  let initGit = !args.noGit;
  let runInstall = !args.noInstall;
  let useSops = args.sops ?? false;
  let seedAdmin = true;

  if (!args.yes) {
    const features = await p.multiselect({
      message: "Include features",
      options: [
        {
          value: "landing",
          label: "Landing app",
          hint: "Marketing site on separate port",
        },
        {
          value: "docker",
          label: "Docker Compose",
          hint: "Postgres + Redis for local dev",
        },
        {
          value: "husky",
          label: "Husky pre-commit",
          hint: "Biome + migration guard",
        },
        { value: "git", label: "Initialize git", hint: "git init + commit" },
        {
          value: "install",
          label: "Install dependencies",
          hint: "pnpm install + prisma generate",
        },
        {
          value: "seed",
          label: "Seed admin user",
          hint: "Write ADMIN_* to .env",
        },
      ],
      initialValues: ["landing", "docker", "husky", "git", "install", "seed"],
      required: false,
    });
    cancelIfNeeded(features);

    const selected = (features as string[]) || [];
    includeLanding = selected.includes("landing");
    includeDocker = selected.includes("docker");
    includeHusky = selected.includes("husky");
    initGit = selected.includes("git");
    runInstall = selected.includes("install");
    seedAdmin = selected.includes("seed");

    if (!args.sops) {
      const sopsAnswer = await p.confirm({
        message: "Set up SOPS encrypted secrets?",
        initialValue: false,
      });
      cancelIfNeeded(sopsAnswer);
      useSops = Boolean(sopsAnswer);
    }
  }

  let adminEmail = "admin@example.com";
  let adminPassword = "Admin@123";
  let adminName = "System Administrator";

  if (seedAdmin && !args.yes) {
    const configureAdmin = await p.confirm({
      message: "Customize admin seed credentials?",
      initialValue: false,
    });
    cancelIfNeeded(configureAdmin);

    if (configureAdmin) {
      adminEmail = (await p.text({
        message: "Admin email",
        defaultValue: adminEmail,
      })) as string;
      adminPassword = (await p.text({
        message: "Admin password",
        defaultValue: adminPassword,
      })) as string;
      adminName = (await p.text({
        message: "Admin name",
        defaultValue: adminName,
      })) as string;
    }
  }

  return buildConfig({
    projectName,
    appName,
    targetDir: resolve(targetDir),
    mainPort,
    landingPort,
    githubRepo,
    includeLanding,
    includeDocker,
    includeHusky,
    initGit,
    runInstall,
    useSops,
    seedAdmin,
    adminEmail,
    adminPassword,
    adminName,
    force: args.force ?? false,
    yes: args.yes ?? false,
  });
}

function buildDefaults(args: CliArgs): ProjectConfig {
  const projectName = args.name || "my-app";
  return buildConfig({
    projectName,
    appName: args.appName || toDisplayName(projectName),
    targetDir: resolve(args.dir || projectName),
    mainPort: args.mainPort ? parsePort(args.mainPort, "Main port") : 3000,
    landingPort: args.landingPort
      ? parsePort(args.landingPort, "Landing port")
      : 3001,
    githubRepo:
      args.githubRepo || "https://github.com/rishiahuja/shuriken",
    includeLanding: !args.noLanding,
    includeDocker: !args.noDocker,
    includeHusky: !args.noHusky,
    initGit: !args.noGit,
    runInstall: !args.noInstall,
    useSops: args.sops ?? false,
    seedAdmin: true,
    adminEmail: "admin@example.com",
    adminPassword: "Admin@123",
    adminName: "System Administrator",
    force: args.force ?? false,
    yes: args.yes ?? false,
  });
}

function buildConfig(input: {
  projectName: string;
  appName: string;
  targetDir: string;
  mainPort: number;
  landingPort: number;
  githubRepo: string;
  includeLanding: boolean;
  includeDocker: boolean;
  includeHusky: boolean;
  initGit: boolean;
  runInstall: boolean;
  useSops: boolean;
  seedAdmin: boolean;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  force: boolean;
  yes: boolean;
}): ProjectConfig {
  return {
    ...input,
    mainAppUrl: `http://localhost:${input.mainPort}`,
    landingUrl: `http://localhost:${input.landingPort}`,
    dbName: toDbName(input.projectName, "dev"),
    dbNameProd: toDbName(input.projectName, "prod"),
    dockerPrefix: toDockerPrefix(input.projectName),
  };
}

export function printNextSteps(config: ProjectConfig): void {
  p.note(
    [
      `${pc.bold("cd")} ${config.targetDir}`,
      `${pc.bold("pnpm docker:dev")}        # start Postgres + Redis`,
      `${pc.bold("pnpm db:migrate")} && ${pc.bold("pnpm db:seed")}`,
      config.includeLanding
        ? `${pc.bold("mprocs")}                 # or run both apps separately`
        : `${pc.bold("pnpm dev")}                 # start main app`,
      "",
      `Main app:    ${config.mainAppUrl}`,
      config.includeLanding
        ? `Landing app: ${config.landingUrl}`
        : undefined,
    ]
      .filter(Boolean)
      .join("\n"),
    "Next steps",
  );

  p.outro(pc.green("Project created successfully."));
}
