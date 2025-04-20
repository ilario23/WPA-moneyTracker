import {execSync} from 'child_process';

const isProd = process.env.VERCEL_ENV === 'production';

const command = isProd ? 'pnpm run build' : 'pnpm run build:dev';

console.log(
  `🛠️  Running build: ${command} (VERCEL_ENV=${process.env.VERCEL_ENV})`
);

execSync(command, {stdio: 'inherit'});
