// Incremental SFTP deploy of specific site files to the cPanel host.
//   node deploy.mjs css/landing.css assets/lockedin/devices/iphone-17-pro-max-880.webp ...
// Safety: connection details are read from the gitignored supabase/migrations/sftp.md at runtime and
// never printed. Files are uploaded to a temp name then renamed; every remote file that is replaced
// is first copied to a private backup OUTSIDE public_html; nothing is ever deleted. Files are
// deployed in the order given (put assets before the CSS/HTML that references them).
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import SftpClient from 'ssh2-sftp-client';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const siteRoot = path.join(repo, 'marketing/lockedinmissions');
const files = process.argv.slice(2);
if (files.length === 0) throw new Error('Pass the site-relative files to deploy.');

const note = await readFile(path.join(repo, 'supabase/migrations/sftp.md'), 'utf8');
const field = (label) => {
  const match = note.match(new RegExp(`^${label}\\s*[\\t:]+\\s*(.+?)\\s*$`, 'mi'));
  if (!match) throw new Error(`"${label}" not found in the connection note`);
  return match[1];
};
const host = field('Server hostname');
const port = Number(field('SFTP Port'));
const username = field('cPanel username');
const password = field('cPanel password');

const sha = (buffer) => createHash('sha256').update(buffer).digest('hex');
const releaseId = `landing-v2-frames-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const docRoot = 'public_html';
const backupDir = `.lockedin-deployments/${releaseId}/backup`;

const sftp = new SftpClient();
await sftp.connect({
  host,
  port,
  username,
  password,
  readyTimeout: 30000,
  hostVerifier: (key) => {
    console.log('host key sha256:', createHash('sha256').update(key).digest('base64'));
    return true;
  },
});

const home = await sftp.cwd();
console.log('connected; home =', home, '| doc root exists:', Boolean(await sftp.exists(docRoot)));
const record = [];

async function ensureDir(remote) {
  if (!(await sftp.exists(remote))) await sftp.mkdir(remote, true);
}

for (const rel of files) {
  const local = await readFile(path.join(siteRoot, rel));
  const remote = `${docRoot}/${rel}`;
  const existed = Boolean(await sftp.exists(remote));

  if (existed) {
    const backupPath = `${backupDir}/${rel}`;
    await ensureDir(path.posix.dirname(backupPath));
    await sftp.rcopy(remote, backupPath);
  }
  await ensureDir(path.posix.dirname(remote));
  const temp = `${remote}.uploading`;
  await sftp.put(local, temp);
  if (existed) await sftp.posixRename(temp, remote);
  else await sftp.rename(temp, remote);
  record.push({ path: rel, sha256: sha(local), previouslyExisted: existed });
  console.log(existed ? 'replaced' : 'created ', rel);
}
await sftp.end();

await writeFile(
  path.join(repo, `marketing/releases/${releaseId}.deployed.json`),
  JSON.stringify({ releaseId, documentRoot: docRoot, backupDirectory: backupDir, files: record }, null, 2),
);
console.log('release record written:', releaseId);
