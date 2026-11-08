#!/usr/bin/env node
// C2 — suite index and contract gate.
//
// Reads every benchmark meta.json plus the staticweb wording-source index,
// validates the canonical contracts (docs/plans/README.md §1–§6), and writes
// benchmarks.json plus the index table inside benchmarks/README.md between
// the INDEX markers. Zero dependencies: node:fs, node:path, node:url only.
//
// Modes:
//   node scripts/index.mjs           regenerate outputs (default)
//   node scripts/index.mjs --check   exit 1 if regeneration differs from disk
//   node scripts/index.mjs --strict  additionally reject plan: null (C9 gate)
//
// Plan-text checks (banner variant, milestone ids, remote-reference deny-list)
// are skipped entirely when plan is null; structural checks always apply.
// Error output: one line per violation naming the benchmark id and field;
// exit 1; a bare stack trace is never the only output.

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BENCH = join(ROOT, "benchmarks");
const RUNTIMES = new Set(["native", "browser", "container", "jvm", "dotnet", "go", "python", "node"]);
const SPEC_LANGUAGES = new Set(["it", "en"]);
const SLICE_MIN = 30;
const SLICE_MAX = 50;
// Remote runtime asset/service references denied in plan bodies. Bare words
// like openai/smtp/rss are deliberately NOT denied (C8 reworks paper-feed).
// Build-time pinned dependency fetches (e.g. the raylib tarball on
// https://github.com/raysan5/...) are allowed: github.com is not denied.
const DENY_TERMS = [
  "cdn.", "cdnjs", "unpkg.com", "jsdelivr", "fonts.googleapis.com",
  "fonts.gstatic.com", "images.unsplash.com", "unsplash", "placehold.",
  "placekitten", "gravatar", "imgur", "youtube.com", "vimeo.com", "googleapis.com",
];
// Skills a run may never declare, whatever the tier (docs/agents/skills-policy.md).
const EXCLUDED_SKILL_PREFIXES = ["grill"];
const EXCLUDED_SKILLS = new Set([
  "research", "wizard", "ask-matt", "to-questionnaire", "handoff",
  "setup-matt-pocock-skills",
]);

const violations = [];
const fail = (line) => violations.push(line);
const norm = (s) => s.replace(/\r\n/g, "\n");
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const subdirs = (p) =>
  readdirSync(p, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name);

function readJson(path, label) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    fail(`${label}: file — mancante o illeggibile (${path})`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    fail(`${label}: json — ${err.message}`);
    return null;
  }
}

// --- constraint banner (canonical text in docs/agents/constraint-banner.md) ---
function loadBanner(lang) {
  const doc = norm(readFileSync(join(ROOT, "docs/agents/constraint-banner.md"), "utf8"));
  const re = new RegExp(`<!-- constraint-banner:${lang}:begin -->\\n([\\s\\S]*?)\\n<!-- constraint-banner:${lang}:end -->`);
  const m = doc.match(re);
  if (!m) {
    fail(`docs/agents/constraint-banner.md: marker — variante ${lang} non trovata`);
    return null;
  }
  return m[1];
}

// --- skills catalogue: root .agents/skills plus benchmark-local .agents/skills ---
function skillCatalogue(benchDir) {
  const cat = new Set(subdirs(join(ROOT, ".agents", "skills")));
  const local = join(benchDir, ".agents", "skills");
  if (isDir(local)) for (const s of subdirs(local)) cat.add(s);
  return cat;
}

// --- discover the ten benchmark directories and their meta.json ---
function discoverBenchmarks() {
  const found = [];
  for (const name of subdirs(BENCH)) {
    if (name === "staticweb") {
      for (const sub of subdirs(join(BENCH, "staticweb"))) {
        if (sub === "_wording-source") continue;
        found.push({ id: sub, dir: join(BENCH, "staticweb", sub) });
      }
    } else {
      found.push({ id: name, dir: join(BENCH, name) });
    }
  }
  return found;
}

function validateBenchmark({ id, dir }, banners, strict) {
  const label = `benchmarks/${id}`;
  const metaPath = join(dir, "meta.json");
  if (!existsSync(metaPath)) {
    fail(`${label}: meta.json — mancante in ${dir}`);
    return null;
  }
  const meta = readJson(metaPath, label);
  if (!meta) return null;

  if (meta.id !== id) fail(`${label}: id — "${meta.id}" non coincide col nome della directory "${id}"`);
  if (typeof meta.title !== "string" || !meta.title.trim()) fail(`${label}: title — mancante o vuoto`);
  if (meta.kind !== "benchmark") fail(`${label}: kind — "${meta.kind}" deve essere "benchmark"`);
  if (!Number.isInteger(meta.tier) || meta.tier < 1 || meta.tier > 5) fail(`${label}: tier — ${meta.tier} fuori dall'intervallo 1–5`);
  if (!SPEC_LANGUAGES.has(meta.spec_language)) fail(`${label}: spec_language — "${meta.spec_language}" deve essere "it" o "en"`);
  if (!Array.isArray(meta.impl_languages) || meta.impl_languages.length === 0 || meta.impl_languages.some((x) => typeof x !== "string" || !x.trim())) {
    fail(`${label}: impl_languages — deve essere un array di stringhe non vuote`);
  }
  if (!Array.isArray(meta.stack) || meta.stack.some((x) => typeof x !== "string")) fail(`${label}: stack — deve essere un array di stringhe`);
  if (!RUNTIMES.has(meta.runtime)) fail(`${label}: runtime — "${meta.runtime}" fuori dall'enum ${[...RUNTIMES].join("|")}`);

  // plan: null is legal only for the staticweb stubs and only without --strict.
  if (meta.plan === null) {
    if (strict) fail(`${label}: plan — null non ammesso in modalità --strict`);
  } else if (typeof meta.plan === "string" && meta.plan) {
    if (!existsSync(join(dir, meta.plan))) fail(`${label}: plan — il file ${meta.plan} non esiste`);
  } else {
    fail(`${label}: plan — deve essere un path o null`);
  }
  if (meta.audit !== null && (typeof meta.audit !== "string" || !meta.audit)) {
    fail(`${label}: audit — deve essere un path o null`);
  } else if (typeof meta.audit === "string" && !existsSync(join(dir, meta.audit))) {
    fail(`${label}: audit — il file ${meta.audit} non esiste`);
  }
  if (typeof meta.verify !== "string" || !meta.verify.trim()) fail(`${label}: verify — path del contratto mancante`);
  if (meta.verify_timeout_s !== undefined && (!Number.isInteger(meta.verify_timeout_s) || meta.verify_timeout_s <= 0)) {
    fail(`${label}: verify_timeout_s — deve essere un intero positivo`);
  }

  // skills: subset of the catalogue (root + benchmark-local), never excluded ones.
  if (!Array.isArray(meta.skills) || meta.skills.length === 0 || meta.skills.some((s) => typeof s !== "string")) {
    fail(`${label}: skills — deve essere un array non vuoto di stringhe`);
  } else {
    const catalogue = skillCatalogue(dir);
    for (const s of meta.skills) {
      if (EXCLUDED_SKILLS.has(s) || EXCLUDED_SKILL_PREFIXES.some((p) => s.startsWith(p))) {
        fail(`${label}: skills — "${s}" è esclusa dalla policy (docs/agents/skills-policy.md)`);
      } else if (!catalogue.has(s)) {
        fail(`${label}: skills — "${s}" non esiste nel catalogo (.agents/skills/ o .agents/skills/ del benchmark)`);
      }
    }
  }

  // milestones: weights sum 100, slice weights within [30, 50], unique ids.
  if (!Array.isArray(meta.milestones) || meta.milestones.length === 0) {
    fail(`${label}: milestones — array mancante o vuoto`);
    return meta;
  }
  const seen = new Set();
  let weightSum = 0;
  let sliceSum = 0;
  for (const ms of meta.milestones) {
    if (!ms || typeof ms.id !== "string" || !ms.id.trim()) { fail(`${label}: milestones[].id — mancante o vuoto`); continue; }
    if (seen.has(ms.id)) fail(`${label}: milestones[].id — "${ms.id}" duplicato`);
    seen.add(ms.id);
    if (!Number.isInteger(ms.weight) || ms.weight <= 0) fail(`${label}: milestones[${ms.id}].weight — ${ms.weight} deve essere un intero positivo`);
    else weightSum += ms.weight;
    if (typeof ms.slice !== "boolean") fail(`${label}: milestones[${ms.id}].slice — deve essere booleano`);
    else if (ms.slice) sliceSum += ms.weight;
    if (typeof ms.title !== "string" || !ms.title.trim()) fail(`${label}: milestones[${ms.id}].title — mancante o vuoto`);
  }
  if (weightSum !== 100) fail(`${label}: milestones — somma pesi ${weightSum} ≠ 100`);
  if (sliceSum < SLICE_MIN || sliceSum > SLICE_MAX) fail(`${label}: milestones — somma pesi slice ${sliceSum} fuori dall'intervallo ${SLICE_MIN}–${SLICE_MAX}`);
  return meta;
}

function validatePlanText({ id, dir }, meta, banners) {
  if (!meta || meta.plan === null || typeof meta.plan !== "string" || !meta.plan) return;
  const label = `benchmarks/${id}`;
  let plan;
  try {
    plan = norm(readFileSync(join(dir, meta.plan), "utf8"));
  } catch {
    fail(`${label}: plan — illeggibile (${meta.plan})`);
    return;
  }
  // 1. verbatim banner variant matching spec_language.
  const banner = banners[meta.spec_language];
  if (banner && !plan.includes(banner)) {
    fail(`${label}: plan/banner — la variante ${meta.spec_language.toUpperCase()} del banner di vincolo non è presente verbatim`);
  }
  // 2. every milestone id occurs in the plan.
  for (const ms of meta.milestones || []) {
    if (typeof ms?.id === "string" && !plan.includes(ms.id)) {
      fail(`${label}: plan/milestones — l'id "${ms.id}" non compare nel ${meta.plan}`);
    }
  }
  // 3. remote-reference deny-list on the plan body.
  const lower = plan.toLowerCase();
  for (const term of DENY_TERMS) {
    if (lower.includes(term)) fail(`${label}: plan/deny-list — riferimento remoto vietato "${term}" nel ${meta.plan}`);
  }
}

function validateWordingSources() {
  const dir = join(BENCH, "staticweb", "_wording-source");
  const label = "benchmarks/staticweb/_wording-source";
  const idx = readJson(join(dir, "index.meta.json"), `${label}/index.meta.json`);
  const listed = new Set();
  if (idx) {
    if (!Array.isArray(idx.entries) || idx.entries.length === 0) {
      fail(`${label}/index.meta.json: entries — array mancante o vuoto`);
    } else {
      for (const e of idx.entries) {
        if (!e || typeof e.file !== "string" || !e.file.trim()) { fail(`${label}/index.meta.json: entries[].file — mancante o vuoto`); continue; }
        if (listed.has(e.file)) fail(`${label}/index.meta.json: entries[].file — "${e.file}" duplicato`);
        listed.add(e.file);
        if (!existsSync(join(dir, e.file))) fail(`${label}: entries[].file — "${e.file}" non esiste su disco`);
        if (e.kind !== "wording-source") fail(`${label}: entries["${e.file}"].kind — "${e.kind}" deve essere "wording-source"`);
        if (e.tier !== 1) fail(`${label}: entries["${e.file}"].tier — ${e.tier} deve essere 1`);
        if (typeof e.title !== "string" || !e.title.trim()) fail(`${label}: entries["${e.file}"].title — mancante o vuoto`);
      }
    }
  }
  for (const f of readdirSync(dir)) {
    if (f.startsWith(".") || !f.endsWith(".txt")) continue;
    if (!listed.has(f)) fail(`${label}: file — "${f}" presente su disco ma non indicizzato in index.meta.json`);
  }
  return idx && Array.isArray(idx.entries) ? idx.entries : [];
}

// --- generation ---
function renderIndexSection(benchmarks, wordingSources) {
  const rows = [...benchmarks].sort((a, b) => (a.tier - b.tier) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const lines = [
    "| id | titolo | tier | runtime | impl | piano |",
    "|----|--------|:----:|---------|------|-------|",
    ...rows.map((m) =>
      `| ${m.id} | ${m.title} | T${m.tier} | ${m.runtime} | ${(m.impl_languages || []).join(", ")} | ${m.plan ?? "—"} |`),
    "",
    "Wording source (T1, prompt prodotto, fuori dal punteggio della suite):",
    "",
    "| file | titolo | tier |",
    "|------|--------|:----:|",
    ...wordingSources.map((e) => `| ${e.file} | ${e.title} | T${e.tier} |`),
  ];
  return lines.join("\n");
}

function renderBenchmarksJson(benchmarks, wordingSources) {
  const rows = [...benchmarks].sort((a, b) => (a.tier - b.tier) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return JSON.stringify({ schema: 1, benchmarks: rows, wordingSources }, null, 2) + "\n";
}

function regenerate(benchmarks, wordingSources) {
  return {
    json: renderBenchmarksJson(benchmarks, wordingSources),
    section: renderIndexSection(benchmarks, wordingSources),
  };
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const strict = args.includes("--strict");
  for (const a of args) {
    if (a !== "--check" && a !== "--strict") {
      console.error(`index.mjs: flag sconosciuta "${a}" (ammesse: --check, --strict)`);
      process.exit(1);
    }
  }

  const banners = { it: loadBanner("it"), en: loadBanner("en") };
  const discovered = discoverBenchmarks();
  const seenIds = new Set();
  const metas = [];
  for (const entry of discovered) {
    if (seenIds.has(entry.id)) fail(`benchmarks/${entry.id}: id — duplicato nella suite`);
    seenIds.add(entry.id);
    const meta = validateBenchmark(entry, banners, strict);
    if (meta) {
      validatePlanText(entry, meta, banners);
      metas.push(meta);
    }
  }
  const wordingSources = validateWordingSources();

  if (violations.length > 0) {
    for (const v of violations) console.error(`index.mjs: VIOLAZIONE ${v}`);
    console.error(`index.mjs: ${violations.length} violazione/i; nessun output generato o verificato.`);
    process.exit(1);
  }

  const { json, section } = regenerate(metas, wordingSources);
  const jsonPath = join(ROOT, "benchmarks.json");
  const readmePath = join(BENCH, "README.md");

  if (check) {
    let stale = false;
    if (!existsSync(jsonPath)) {
      fail("benchmarks.json: file — mancante; rigenera con node scripts/index.mjs");
      stale = true;
    } else if (norm(readFileSync(jsonPath, "utf8")) !== json) {
      fail("benchmarks.json: stale — differisce dalla rigenerazione; lancia node scripts/index.mjs");
      stale = true;
    }
    if (!existsSync(readmePath)) {
      fail("benchmarks/README.md: file — mancante");
      stale = true;
    } else {
      const readme = norm(readFileSync(readmePath, "utf8"));
      const re = /<!-- INDEX:START -->\n?([\s\S]*?)\n?<!-- INDEX:END -->/;
      const m = readme.match(re);
      if (!m) {
        fail("benchmarks/README.md: marker — blocchi INDEX:START/INDEX:END assenti o malformati");
        stale = true;
      } else if (m[1] !== section) {
        fail("benchmarks/README.md: index — la tabella differisce dalla rigenerazione; lancia node scripts/index.mjs");
        stale = true;
      }
    }
    if (stale) {
      for (const v of violations) console.error(`index.mjs: VIOLAZIONE ${v}`);
      process.exit(1);
    }
    console.log(`index.mjs: check OK — ${metas.length} benchmark, ${wordingSources.length} wording source, output aggiornato.`);
    return;
  }

  if (!existsSync(jsonPath) || norm(readFileSync(jsonPath, "utf8")) !== json) {
    writeFileSync(jsonPath, json);
    console.log("index.mjs: scritto benchmarks.json");
  }
  if (!existsSync(readmePath)) {
    fail("benchmarks/README.md: file — mancante; crealo con i marker INDEX:START/INDEX:END");
    for (const v of violations) console.error(`index.mjs: VIOLAZIONE ${v}`);
    process.exit(1);
  }
  const readme = norm(readFileSync(readmePath, "utf8"));
  const re = /<!-- INDEX:START -->\n?([\s\S]*?)\n?<!-- INDEX:END -->/;
  if (!re.test(readme)) {
    fail("benchmarks/README.md: marker — blocchi INDEX:START/INDEX:END assenti o malformati");
    for (const v of violations) console.error(`index.mjs: VIOLAZIONE ${v}`);
    process.exit(1);
  }
  const updated = readme.replace(re, `<!-- INDEX:START -->\n${section}\n<!-- INDEX:END -->`);
  if (updated !== readme) {
    writeFileSync(readmePath, updated);
    console.log("index.mjs: aggiornata la tabella in benchmarks/README.md");
  }
  console.log(`index.mjs: OK — ${metas.length} benchmark, ${wordingSources.length} wording source.`);
}

try {
  main();
} catch (err) {
  console.error(`index.mjs: errore — ${err && err.message ? err.message : err}`);
  process.exit(1);
}
