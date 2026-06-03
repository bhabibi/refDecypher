#!/usr/bin/env node
"use strict";

/* Phase 11 — generate data/GAPS_REPORT.md from the scraped master list + run metadata. */

const fs   = require("fs");
const path = require("path");

const DATA   = path.join(__dirname, "data", "Superbase JSON");
const master = JSON.parse(fs.readFileSync(path.join(DATA, "refdecoder_table16_new_refs_scraped.json"), "utf8"));
const meta   = JSON.parse(fs.readFileSync(path.join(__dirname, ".expansion-meta.json"), "utf8"));

const before = meta.existingBefore;
const added  = master.length;
const now    = before + added;

// completeness buckets (over the newly-added refs)
const complete = master.filter(r => r.family && r.case_material).length;          // family + material decoded
const partial  = master.filter(r => r.family && !r.case_material).length;         // family only
const minimal  = master.filter(r => !r.family).length;                            // number only

// high-priority gaps: corroborated (3+ sources) but no editorial why_it_matters
const hiGaps = master
  .filter(r => r.source_count >= 3 && !r.why_it_matters)
  .sort((a, b) => b.source_count - a.source_count || a.ref_number.localeCompare(b.ref_number))
  .slice(0, 20);

// families with most missing data
const famMap = new Map();
for (const r of master) {
  const f = r.family || "(undecoded / unknown family)";
  if (!famMap.has(f)) famMap.set(f, { total: 0, withMat: 0, withWhy: 0 });
  const g = famMap.get(f);
  g.total++;
  if (r.case_material) g.withMat++;
  if (r.why_it_matters) g.withWhy++;
}
const famRows = [...famMap.entries()]
  .map(([f, g]) => ({ f, total: g.total, pct: Math.round((g.withMat / g.total) * 100) }))
  .sort((a, b) => b.total - a.total);

const perSource = meta.perSource
  .map(s => `  ${s.name.padEnd(20)} ${String(s.found).padStart(4)} found, ${String(s.neu).padStart(4)} new`)
  .join("\n");

const md = `# RefDecoder — Reference Gaps Report
Generated: ${meta.today}

## Summary
| Metric | Count |
|---|---|
| Total refs in database before this run | ${before} |
| New refs added this run | ${added} |
| Total refs now | ${now} |
| New refs with model family + decoded material | ${complete} |
| New refs with family only (material null) | ${partial} |
| New refs with number only (no family) | ${minimal} |
| High-confidence new refs (appeared on 3+ sources) | ${master.filter(r => r.high_confidence).length} |

Per-source contribution this run:
\`\`\`
${perSource}
\`\`\`

> Note: \`why_it_matters\` (editorial market significance) cannot be auto-decoded from
> digits, so every newly-scraped ref currently has it null. These are the prime
> candidates for manual enrichment below.

## High Priority Gaps
References that appear on **3+ sources** (well-corroborated, clearly real) but still
have a null \`why_it_matters\`. These are the highest-value targets for hand-written
significance notes:

| Reference | Family | Sources |
|---|---|---|
${hiGaps.map(r => `| ${r.ref_number} | ${r.family || "—"} | ${r.sources.join(", ")} |`).join("\n")}

## Families with Most Missing Data
Ranked by number of newly-added references; "% material" = share with a confidently
decoded case material (the rest need manual material/dial/era data):

| Family | New refs | % material decoded |
|---|---|---|
${famRows.map(r => `| ${r.f} | ${r.total} | ${r.pct}% |`).join("\n")}

## Recommended Next Sources to Scrape
Based on what these five sources covered well (modern 6-digit refs) versus what is
still thin (vintage 4-digit families, ladies' references, and editorial significance):

1. **Jake's Rolex World — Reference Library** — https://www.jakehassociates.com / rolexmagazine.com
   Strongest vintage coverage (4-digit Submariner/Daytona/GMT), good for the
   ${minimal} number-only refs that currently have no family.
3. **Rolex official current collection** — https://www.rolex.com/watches
   Authoritative for current-production 12x/22x refs, dial colors, and exact materials —
   the cleanest source for filling dial_color and case_material.
4. **WatchSleuth Rolex Reference Search** — http://www.watchsleuth.com/oysterinfo/
   Structured reference→model/year database, ideal for batch-filling era and family
   on the ladies' (6xxxx/7xxxx) and Cellini (4xxx/5xxx) references.
5. **r/rolex & RolexForums reference threads** — https://www.rolexforums.com
   Community nicknames and "why it matters" context — the editorial layer that the
   five structured catalogues above lack.
`;

const out = path.join(DATA, "..", "GAPS_REPORT.md");
fs.writeFileSync(out, md);
console.log("Wrote", path.resolve(out));
console.log(`Summary: before=${before} added=${added} now=${now} complete=${complete} partial=${partial} minimal=${minimal}`);
