export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const RELEASE_ID = import.meta.env.VITE_RELEASE_ID || 'dev-local';
export const BUILD_ENV = import.meta.env.MODE || 'development';

export function getFrontendReleaseInfo() {
  return {
    app: 'blueprint-ia-frontend',
    version: APP_VERSION,
    releaseId: RELEASE_ID,
    environment: BUILD_ENV,
  };
}
