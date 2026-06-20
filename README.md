# create-shuriken

Scaffold a new [Shuriken](https://github.com/RishiAhuja/shuriken) project with a sharp terminal UI.

## Usage

```bash
npm create shuriken@latest
# or
npx create-shuriken my-app
```

Non-interactive:

```bash
npx create-shuriken my-app --yes
npx create-shuriken my-app --yes --no-install   # skip pnpm install
```

## Requirements

- Node.js 20+
- pnpm
- Optional: [age](https://github.com/FiloSottile/age) and [sops](https://github.com/mozilla/sops) for encrypted secrets

## Options

```
create-shuriken [dir] [options]

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
```

## Template version

This package bundles Shuriken template version **1.0.0**. See `templateVersion` in `package.json`.

## Development

```bash
pnpm install
pnpm build
node dist/index.js my-test-app --yes --no-install
```

### Sync template from Shuriken repo

```bash
cd ../shuriken && pnpm template:build
rm -rf ../shuriken-cli/template && cp -R dist/template ../shuriken-cli/template
cd ../shuriken-cli && pnpm build
```

## Publish to npm

### One-time setup

1. Create an account at [npmjs.com](https://www.npmjs.com/signup)
2. Log in locally:

```bash
npm login
npm whoami   # should print your username
```

3. Create an **Automation** token at [npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~/tokens) for CI (optional)

### Publish manually

From the `shuriken-cli` directory:

```bash
pnpm build
npm publish --access public
```

`prepublishOnly` runs `pnpm build` automatically if you skip the build step.

Verify:

```bash
npm view create-shuriken
npx create-shuriken@latest /tmp/test-app --yes --no-install
```

### Publish via GitHub Actions

Add `NPM_TOKEN` (Automation token) to your repo secrets, then create a GitHub Release — the workflow in `.github/workflows/publish.yml` publishes automatically.

### Releasing updates

Bump version in `package.json`, sync template if needed, then:

```bash
npm version patch   # 1.0.0 → 1.0.1
npm publish --access public
git push && git push --tags
```

## License

MIT
