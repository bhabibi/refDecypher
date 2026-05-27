#!/usr/bin/env node
"use strict";

const fs   = require("fs");
const path = require("path");

// ── Config ─────────────────────────────────────────────────────────────────
// SECRET_KEY is read from the environment so it is never committed to git.
// Set it before running:
//   export SUPABASE_SECRET_KEY="sb_secret_..."
//   node setup-db.js --skip-ddl
const SUPABASE_URL  = process.env.SUPABASE_URL  || "https://ajqhtrthdqjijzuihtmz.supabase.co";
const PROJECT_REF   = "ajqhtrthdqjijzuihtmz";
const SECRET_KEY    = process.env.SUPABASE_SECRET_KEY;
const ANON_KEY      = process.env.SUPABASE_ANON_KEY || "sb_publishable_FKpUI7h11urJ3e8PVHIjdw_nT7yPDkU";
const DATA_DIR      = process.env.DATA_DIR || path.join(__dirname, "data", "Superbase JSON");

// Supabase Management API — runs arbitrary SQL with a service/PAT token
const MGMT_SQL_URL  = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

// ── SQL definitions ────────────────────────────────────────────────────────
const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS families (
  id           SERIAL PRIMARY KEY,
  family_name  TEXT NOT NULL UNIQUE,
  intro_year   INTEGER,
  description  TEXT,
  known_for    TEXT,
  price_tier   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS era_prefixes (
  id             SERIAL PRIMARY KEY,
  prefix         TEXT NOT NULL UNIQUE,
  decade_range   TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bezel_codes (
  id                   SERIAL PRIMARY KEY,
  code                 TEXT NOT NULL UNIQUE,
  type                 TEXT,
  description          TEXT,
  applicable_families  TEXT[],
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bracelet_codes (
  id                   SERIAL PRIMARY KEY,
  code                 TEXT NOT NULL UNIQUE,
  description          TEXT,
  material             TEXT,
  applicable_families  TEXT[],
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS models (
  id                   SERIAL PRIMARY KEY,
  ref_number           TEXT NOT NULL UNIQUE,
  model_name           TEXT,
  nickname             TEXT,
  family               TEXT,
  case_material        TEXT,
  dial_color           TEXT,
  bezel_material       TEXT,
  bezel_color          TEXT,
  bracelet_type        TEXT,
  bracelet_material    TEXT,
  production_start     INTEGER,
  production_end       INTEGER,
  movement             TEXT,
  water_resistance_m   INTEGER,
  case_size_mm         INTEGER,
  why_it_matters       TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
`;

const RLS_SQL = `
ALTER TABLE families      ENABLE ROW LEVEL SECURITY;
ALTER TABLE era_prefixes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bezel_codes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracelet_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE models        ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='families' AND policyname='Public read access') THEN
    CREATE POLICY "Public read access" ON families FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='era_prefixes' AND policyname='Public read access') THEN
    CREATE POLICY "Public read access" ON era_prefixes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bezel_codes' AND policyname='Public read access') THEN
    CREATE POLICY "Public read access" ON bezel_codes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bracelet_codes' AND policyname='Public read access') THEN
    CREATE POLICY "Public read access" ON bracelet_codes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='models' AND policyname='Public read access') THEN
    CREATE POLICY "Public read access" ON models FOR SELECT USING (true);
  END IF;
END $$;
`;

// ── Helpers ────────────────────────────────────────────────────────────────
async function runSQL(sql, label) {
  // 1) Try Supabase Management API (works with service_role or PAT)
  try {
    const res = await fetch(MGMT_SQL_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${SECRET_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    const text = await res.text();
    if (res.ok) {
      console.log(`  ✓ ${label} via Management API (${res.status})`);
      return { ok: true, via: "management-api", status: res.status };
    }
    // 401 = wrong token type; try project-level RPC
    console.log(`  ⚠ Management API returned ${res.status}: ${text.slice(0, 200)}`);
  } catch (e) {
    console.log(`  ⚠ Management API network error: ${e.message}`);
  }

  // 2) Try PostgREST /rest/v1/rpc/exec (available on some Supabase projects)
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "apikey":        SECRET_KEY,
        "Authorization": `Bearer ${SECRET_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    const text = await res.text();
    if (res.ok) {
      console.log(`  ✓ ${label} via RPC exec (${res.status})`);
      return { ok: true, via: "rpc-exec", status: res.status };
    }
    console.log(`  ⚠ RPC exec returned ${res.status}: ${text.slice(0, 200)}`);
  } catch (e) {
    console.log(`  ⚠ RPC exec network error: ${e.message}`);
  }

  return { ok: false, message: "Both SQL execution routes failed — see notes below." };
}

async function insertBatch(table, rows) {
  // Service role key bypasses RLS, so inserts always work regardless of policies
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "apikey":        SECRET_KEY,
      "Authorization": `Bearer ${SECRET_KEY}`,
      "Prefer":        "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  const body = res.ok ? "" : await res.text();
  return { status: res.status, ok: res.ok, body };
}

async function countRows(table) {
  // HEAD with Prefer: count=exact — returns Content-Range: 0-N/TOTAL or */TOTAL
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    method:  "HEAD",
    headers: {
      "apikey":        ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
      "Prefer":        "count=exact",
    },
  });
  const cr = res.headers.get("content-range") || "";
  const match = cr.match(/\/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  // Pass --skip-ddl flag when tables are already created via the Dashboard
  const skipDDL = process.argv.includes("--skip-ddl");

  if (!SECRET_KEY) {
    console.error("Error: SUPABASE_SECRET_KEY env var is not set.");
    console.error("  export SUPABASE_SECRET_KEY='sb_secret_...'");
    console.error("  node setup-db.js --skip-ddl");
    process.exit(1);
  }

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   RefDecoder — Supabase Database Setup       ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // ── TASK 1: Create tables ────────────────────────────────────────────────
  console.log("── TASK 1: Creating tables ──────────────────────");
  let createResult = { ok: false };
  if (skipDDL) {
    console.log("  → --skip-ddl flag set: assuming tables already exist in Dashboard.");
    createResult = { ok: true, via: "skipped" };
  } else {
    createResult = await runSQL(CREATE_SQL, "CREATE TABLE (all 5)");
  }

  // ── TASK 2: Enable RLS + public read policies ────────────────────────────
  console.log("\n── TASK 2: Enabling RLS + policies ──────────────");
  let rlsResult = { ok: false };
  if (skipDDL) {
    console.log("  → --skip-ddl flag set: assuming RLS already configured in Dashboard.");
    rlsResult = { ok: true, via: "skipped" };
  } else if (createResult.ok) {
    rlsResult = await runSQL(RLS_SQL, "RLS + policies (all 5 tables)");
  } else {
    console.log("  ⚠ Skipping RLS setup — table creation did not succeed via API.");
    console.log("  → Run the SQL in the Supabase Dashboard → SQL Editor manually.");
    console.log("  → Then re-run: node setup-db.js --skip-ddl");
  }

  const ddlOk = createResult.ok && rlsResult.ok;

  // ── TASK 3: Insert data ──────────────────────────────────────────────────
  console.log("\n── TASK 3: Inserting data ───────────────────────");

  const insertPlan = [
    { table: "families",      file: "refdecoder_table5_families.json" },
    { table: "era_prefixes",  file: "refdecoder_table4_era_prefixes.json" },
    { table: "bezel_codes",   file: "refdecoder_table2_bezel_codes.json" },
    { table: "bracelet_codes",file: "refdecoder_table3_bracelet_codes.json" },
    { table: "models",        file: "refdecoder_table1_models.json" },
  ];

  const insertResults = {};
  for (const { table, file } of insertPlan) {
    const raw  = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
    const data = JSON.parse(raw);
    const rows = data.rows.map(row => {
      // Trim any accidental leading/trailing whitespace from code fields
      if (typeof row.code === "string") row = { ...row, code: row.code.trim() };
      return row;
    });

    const r = await insertBatch(table, rows);
    if (r.ok) {
      console.log(`  ✓ ${table.padEnd(16)} ${rows.length} rows → HTTP ${r.status}`);
      insertResults[table] = { ok: true, count: rows.length };
    } else {
      const snippet = r.body.slice(0, 300);
      console.log(`  ✗ ${table.padEnd(16)} HTTP ${r.status} — ${snippet}`);
      insertResults[table] = { ok: false, error: snippet };
    }
  }

  // ── TASK 4: Verify row counts ────────────────────────────────────────────
  console.log("\n── TASK 4: Row count verification ───────────────");
  const allTables = ["models","bezel_codes","bracelet_codes","era_prefixes","families"];
  for (const table of allTables) {
    const n = await countRows(table);
    if (n === null) {
      console.log(`  ${table.padEnd(16)}: unable to read count (RLS may be blocking anonymous reads)`);
    } else if (n === 0) {
      console.log(`  ${table.padEnd(16)}: 0 rows ⚠  — inserts may have failed or tables don't exist`);
    } else {
      console.log(`  ${table.padEnd(16)}: ${n} rows ✓`);
    }
  }

  // ── If DDL failed, print the SQL for manual copy-paste ──────────────────
  if (!ddlOk) {
    console.log("\n── Manual SQL (copy into Dashboard → SQL Editor) ───");
    console.log("\n--- CREATE TABLES ---");
    console.log(CREATE_SQL);
    console.log("\n--- RLS + POLICIES ---");
    console.log(RLS_SQL);
  }

  console.log("\n── Done ─────────────────────────────────────────\n");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
