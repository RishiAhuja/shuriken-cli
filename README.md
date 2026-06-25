# create-shuriken

Scaffold a production-ready [Shuriken](https://github.com/RishiAhuja/shuriken) project — split Next.js apps, auth, Prisma, and a clean UI — with an interactive terminal setup.

```bash
npm create shuriken@latest
```

## Quick start

```bash
npm create shuriken@latest my-app
cd my-app
pnpm docker:dev
pnpm db:migrate && pnpm db:seed
mprocs
```

- **Main app:** http://localhost:3000  
- **Landing app:** http://localhost:3001

## What you get

Shuriken is a sharp, opinionated starter — not a library grab bag.

| | |
|---|---|
| **Split architecture** | Marketing site (`landing/`) + product app (root), deploy independently |
| **Auth** | Custom sessions, login/signup UI, rate-limited API routes |
| **Database** | PostgreSQL + Prisma, migrations, admin seed |
| **UI** | Tailwind CSS 4, shadcn/ui, design tokens |
| **Tooling** | Biome, Husky, SOPS-ready secrets, Docker Compose |

Learn more about the template itself in the [Shuriken repo](https://github.com/RishiAhuja/shuriken).

## Requirements

- **Node.js** 20+
- **pnpm**
- **Docker** (recommended for local Postgres + Redis)

Optional, for encrypted secrets during setup:

- [age](https://github.com/FiloSottile/age)
- [sops](https://github.com/mozilla/sops)

## Usage

Interactive (recommended):

```bash
npm create shuriken@latest
```

Non-interactive:

```bash
npx create-shuriken my-app --yes
```

Skip dependency install (faster, install manually later):

```bash
npx create-shuriken my-app --yes --no-install
```

## Options

| Flag | Description |
|------|-------------|
| `--name <name>` | npm package / project name |
| `--app-name <name>` | Display name in the UI |
| `--main-port <port>` | Main app port (default: `3000`) |
| `--landing-port <port>` | Landing app port (default: `3001`) |
| `--github-repo <url>` | GitHub link on the landing page |
| `--no-landing` | Skip the landing app |
| `--no-docker` | Skip Docker Compose files |
| `--no-husky` | Skip Husky pre-commit hooks |
| `--no-git` | Skip `git init` |
| `--no-install` | Skip `pnpm install` and Prisma generate |
| `--sops` | Set up SOPS encrypted secrets |
| `--force` | Scaffold into a non-empty directory |
| `-y`, `--yes` | Use defaults, skip prompts |

## After scaffolding

```bash
cd my-app

# Start Postgres + Redis
pnpm docker:dev

# Run migrations and seed admin user
pnpm db:migrate
pnpm db:seed

# Run everything (main app, landing, database)
mprocs
```

Default admin credentials (if you kept the seed defaults):

- Email: `admin@example.com`
- Password: `Admin@123`

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local development, template sync, and release instructions.

## Links

- [Shuriken template](https://github.com/RishiAhuja/shuriken)
- [CLI source](https://github.com/RishiAhuja/shuriken-cli)
- [Report an issue](https://github.com/RishiAhuja/shuriken-cli/issues)

## License

MIT © [Rishi Ahuja](https://github.com/RishiAhuja)
