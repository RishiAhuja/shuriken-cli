import * as p from "@clack/prompts";
import pc from "picocolors";
import { writeEnvFile } from "./env.js";
import { runPostInstall, verifyPnpm } from "./post-install.js";
import { collectConfig, printNextSteps, type CliArgs } from "./prompts.js";
import { setupSops, verifySopsTools } from "./sops.js";
import { scaffoldProject } from "./template.js";
import { printBanner } from "./ui/banner.js";

export async function runCli(args: CliArgs): Promise<void> {
  printBanner();

  const pnpmError = await verifyPnpm();
  if (pnpmError && !args.noInstall) {
    p.cancel(pnpmError);
    process.exit(1);
  }

  const config = await collectConfig(args);

  if (config.useSops) {
    const sopsError = await verifySopsTools();
    if (sopsError) {
      p.cancel(sopsError);
      process.exit(1);
    }
  }

  const spinner = p.spinner();

  try {
    spinner.start("Scaffolding project...");
    scaffoldProject(config);
    spinner.stop("Project files written");

    if (!config.useSops) {
      spinner.start("Writing .env...");
      writeEnvFile(config);
      spinner.stop(".env created");
    }

    if (config.useSops) {
      spinner.start("Setting up SOPS secrets...");
      await setupSops(config);
      spinner.stop("SOPS secrets encrypted");
    }

    if (config.runInstall || config.initGit) {
      await runPostInstall(config, (message) => {
        spinner.start(message);
      });
      spinner.stop("Post-install complete");
    }

    printNextSteps(config);
  } catch (error) {
    spinner.stop(pc.red("Failed"));
    p.log.error(
      error instanceof Error ? error.message : "Unknown error occurred",
    );
    process.exit(1);
  }
}
