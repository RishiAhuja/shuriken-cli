export interface ProjectConfig {
  projectName: string;
  appName: string;
  targetDir: string;
  mainPort: number;
  landingPort: number;
  mainAppUrl: string;
  landingUrl: string;
  dbName: string;
  dbNameProd: string;
  dockerPrefix: string;
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
}

export interface TokenMap {
  PROJECT_NAME: string;
  APP_NAME: string;
  MAIN_PORT: string;
  LANDING_PORT: string;
  MAIN_APP_URL: string;
  LANDING_URL: string;
  DB_NAME: string;
  DB_NAME_PROD: string;
  DOCKER_PREFIX: string;
  GITHUB_REPO: string;
}
