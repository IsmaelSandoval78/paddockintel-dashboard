import * as fs from 'fs';
import * as path from 'path';

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}
loadEnvLocal();

import { createClient } from '../lib/supabase/server';

async function main() {
  const sb = createClient();
  const { data: issues, error: e1 } = await sb.from('digest_issues').select('*').limit(1);
  const { data: items, error: e2 } = await sb.from('digest_items').select('*').limit(1);
  console.log('digest_issues:', e1 ? 'ERROR: ' + e1.message : 'OK, cols: ' + Object.keys(issues?.[0] ?? {}).join(', '));
  console.log('digest_items:', e2 ? 'ERROR: ' + e2.message : 'OK, cols: ' + Object.keys(items?.[0] ?? {}).join(', '));
}
main();
