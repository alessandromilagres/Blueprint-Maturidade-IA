import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readPackageVersion() {
  try {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, '../../package.json'), 'utf8')
    );
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function resolveReleaseId() {
  if (process.env.RELEASE_ID?.trim()) {
    return process.env.RELEASE_ID.trim();
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'dev-local';
  }
}

export const APP_VERSION = process.env.APP_VERSION?.trim() || readPackageVersion();
export const RELEASE_ID = resolveReleaseId();
export const BUILD_ENV = process.env.NODE_ENV || 'development';

export function getReleaseInfo() {
  return {
    app: 'blueprint-ia-backend',
    version: APP_VERSION,
    releaseId: RELEASE_ID,
    environment: BUILD_ENV,
    timestamp: new Date().toISOString(),
  };
}
