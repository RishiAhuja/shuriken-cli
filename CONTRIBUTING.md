# Contributing

Internal notes for maintaining `create-shuriken`. Not shown on npm — see `package.json` `"files"` field.

## Local development

```bash
pnpm install
pnpm build
node dist/index.js my-test-app --yes --no-install
```

Type-check:

```bash
pnpm type-check
```

## Sync template from Shuriken

When the [Shuriken](https://github.com/RishiAhuja/shuriken) template changes:

```bash
cd ../shuriken && pnpm template:build
rm -rf ../shuriken-cli/template && cp -R dist/template ../shuriken-cli/template
cd ../shuriken-cli && pnpm build
```

Update `templateVersion` in `package.json` to match the Shuriken release tag.

## Release to npm

### Prerequisites

- npm account with 2FA enabled for publishing
- Logged in: `npm login && npm whoami`

### Publish

```bash
pnpm build
npm version patch   # or minor / major
npm publish --access public
git push && git push --tags
```

### CI publish

Add `NPM_TOKEN` (Automation token) to GitHub repo secrets. Creating a GitHub Release triggers `.github/workflows/publish.yml`.

### Sync template via CI

Use `.github/workflows/sync-template.yml` with a Shuriken release tag to pull `shuriken-template.tar.gz` from GitHub Releases.
