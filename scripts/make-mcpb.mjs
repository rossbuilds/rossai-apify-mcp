import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stage = resolve(root, '.mcpb-stage');
const outDir = resolve(root, 'bundle');
const archive = resolve(outDir, 'rossai-apify-mcp-1.0.0.mcpb');

rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
mkdirSync(outDir, { recursive: true });
cpSync(resolve(root, 'dist'), resolve(stage, 'dist'), { recursive: true });
cpSync(resolve(root, 'mcpb/manifest.json'), resolve(stage, 'manifest.json'));
cpSync(resolve(root, 'package.json'), resolve(stage, 'package.json'));
cpSync(resolve(root, 'package-lock.json'), resolve(stage, 'package-lock.json'));
cpSync(resolve(root, 'README.md'), resolve(stage, 'README.md'));

const install = spawnSync('npm', ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], {
    cwd: stage,
    stdio: 'inherit',
});
if (install.status !== 0) process.exit(install.status ?? 1);

rmSync(archive, { force: true });
const zip = spawnSync('zip', ['-r', '-q', '-X', archive, '.'], { cwd: stage, stdio: 'inherit' });
if (zip.status !== 0) process.exit(zip.status ?? 1);
const bytes = readFileSync(archive);
const sha256 = createHash('sha256').update(bytes).digest('hex');
writeFileSync(resolve(outDir, 'SHA256'), `${sha256}  rossai-apify-mcp-1.0.0.mcpb\n`);
console.log(JSON.stringify({ archive, bytes: bytes.length, sha256 }));
rmSync(stage, { recursive: true, force: true });
