import { ConvexHttpClient } from 'convex/browser';
import { internal } from '../convex/_generated/api';

const url = process.env.CONVEX_URL;
if (!url) {
  console.error('CONVEX_URL env var required (e.g., the deployment URL)');
  process.exit(2);
}
const client = new ConvexHttpClient(url);

async function main() {
  // Cast through any: convex codegen has not yet regenerated api.d.ts
  // for the new `lib/migrate_v2.ts` module in the worktree. Once `npx
  // convex dev` runs from main, _generated/api.d.ts gains lib.migrate_v2
  // and this cast becomes unnecessary.
  const fn = (internal as any).lib.migrate_v2.migrateAllToV2;
  const result: {
    qInserted: number; qSkipped: number; qTotalSource: number;
    dhPatched: number; dhSkipped: number; dhTotal: number;
  } = await client.mutation(fn, {});
  console.log('migration result:', result);
  const ok =
    result.qInserted + result.qSkipped === result.qTotalSource &&
    result.dhPatched + result.dhSkipped === result.dhTotal;
  if (!ok) {
    console.error('MISMATCH: counts do not balance');
    process.exit(1);
  }
  console.log('OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
