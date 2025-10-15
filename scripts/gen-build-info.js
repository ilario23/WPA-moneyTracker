import fs from 'fs';
import path from 'path';

function isoNow() {
  return new Date().toISOString();
}

function readPkgVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return pkg.version || null;
  } catch {
    return null;
  }
}

const outDir = path.resolve('src', 'generated');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive: true});

const buildDate = isoNow();
const version = readPkgVersion();

const content = `// Auto-generated at build time
export const BUILD_DATE = ${JSON.stringify(buildDate)};
export const APP_VERSION = ${JSON.stringify(version)};`;

fs.writeFileSync(path.join(outDir, 'build-info.ts'), content, 'utf8');
console.log(`🕒 Build info generated: ${buildDate} (v${version})`);
