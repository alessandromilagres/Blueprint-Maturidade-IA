import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

function readPackageVersion() {
  try {
    const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
    return pkg.version || '1.0.0'
  } catch {
    return '1.0.0'
  }
}

function resolveReleaseId() {
  if (process.env.VITE_RELEASE_ID?.trim()) {
    return process.env.VITE_RELEASE_ID.trim()
  }
  if (process.env.RELEASE_ID?.trim()) {
    return process.env.RELEASE_ID.trim()
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'dev-local'
  }
}

const appVersion = process.env.VITE_APP_VERSION?.trim() || readPackageVersion()
const releaseId = resolveReleaseId()

const apiProxy = {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true
  }
};

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.VITE_RELEASE_ID': JSON.stringify(releaseId),
  },
  server: {
    port: 5173,
    proxy: { ...apiProxy }
  },
  preview: {
    port: 5173,
    proxy: { ...apiProxy }
  }
})
