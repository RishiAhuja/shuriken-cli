import { runCli } from "./cli.js";
import type { CliArgs } from "./prompts.js";

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case "--name":
        args.name = argv[++i];
        break;
      case "--app-name":
        args.appName = argv[++i];
        break;
      case "--main-port":
        args.mainPort = argv[++i];
        break;
      case "--landing-port":
        args.landingPort = argv[++i];
        break;
      case "--github-repo":
        args.githubRepo = argv[++i];
        break;
      case "--no-landing":
        args.noLanding = true;
        break;
      case "--no-docker":
        args.noDocker = true;
        break;
      case "--no-husky":
        args.noHusky = true;
        break;
      case "--no-git":
        args.noGit = true;
        break;
      case "--no-install":
        args.noInstall = true;
        break;
      case "--sops":
        args.sops = true;
        break;
      case "--force":
        args.force = true;
        break;
      case "--yes":
      case "-y":
        args.yes = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        if (!arg.startsWith("-")) {
          positional.push(arg);
        }
    }
  }

  if (positional[0]) {
    args.dir = positional[0];
  }

  return args;
}

function printHelp(): void {
  console.log(`
Usage: create-shuriken [dir] [options]

Options:
  --name <name>           npm package / project name
  --app-name <name>       display name shown in UI
  --main-port <port>      main app port (default: 3000)
  --landing-port <port>   landing app port (default: 3001)
  --github-repo <url>     GitHub link for landing page
  --no-landing            skip landing app
  --no-docker             skip Docker Compose files
  --no-husky              skip Husky pre-commit hooks
  --no-git                skip git init
  --no-install            skip pnpm install
  --sops                  enable SOPS secret setup
  --force                 scaffold into non-empty directory
  -y, --yes               use defaults, skip prompts
  -h, --help              show help
`);
}

runCli(parseArgs(process.argv.slice(2))).catch((error) => {
  console.error(error);
  process.exit(1);
});
