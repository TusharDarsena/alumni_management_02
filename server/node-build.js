import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

fs.mkdirSync(join(__dirname, 'dist'), { recursive: true });

const buildConfig = {
  entryPoints: [join(__dirname, 'index.js')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: join(__dirname, 'dist', 'server.js'),
  external: [
    'mongoose',
    'express',
    'cors',
    'cookie-parser',
    'bcryptjs',
    'jsonwebtoken',
    'dotenv'
  ],
  sourcemap: true,
  minify: false,
  keepNames: true,
  logLevel: 'info'
};

try {
  await build(buildConfig);
  console.log('✅ Server build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
