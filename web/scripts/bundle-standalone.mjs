// `output: standalone` кладёт в .next/standalone только серверный код: статику
// и public Next оставляет на месте и ждёт, что их принесут рядом. В образе это
// делает Dockerfile, а здесь — чтобы `npm start` работал и без Docker.
import { cpSync, existsSync } from 'node:fs';

const ROOT = '.next/standalone';

if (!existsSync(ROOT)) {
  console.error('Нет .next/standalone — сначала `npm run build`.');
  process.exit(1);
}

cpSync('.next/static', `${ROOT}/.next/static`, { recursive: true });
if (existsSync('public')) cpSync('public', `${ROOT}/public`, { recursive: true });
