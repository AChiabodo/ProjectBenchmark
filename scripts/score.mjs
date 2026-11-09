#!/usr/bin/env node
// C2 — scoring rule (docs/agents/scoring.md), executable definition.
//
//   node scripts/score.mjs <meta.json> <verify.json> [--exit N]
//   node scripts/score.mjs --self-test
//
// Reads a benchmark meta.json and the verify.json produced by ./verify.sh,
// validates the verify contract (schema 1, benchmark, milestones[{id,pass,
// detail}], optional notes; every meta milestone id exactly once; optional
// per-milestone weight must match meta.json; ./verify.sh exit code must agree
// with the file when passed via --exit), then computes the score:
//
//   score = sum of weights of milestones with pass true
//   if any slice milestone fails, score is capped at the sum of the weights
//   of the *passing* slice milestones (no credit for work beyond the slice)
//
// Disagreements are reported violations, never silently resolved. One line
// per violation naming the benchmark id and the offending field; exit 1;
// never a bare stack trace as the only output. Zero dependencies.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

function readJson(path, label, violations) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    violations.push(`${label}: file — mancante o illeggibile (${path})`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    violations.push(`${label}: json — malformed: ${err.message}`);
    return null;
  }
}

// Validates meta + verify and returns { meta, verify, violations }.
function loadAndValidate(metaPath, verifyPath, exitCode) {
  const violations = [];
  const meta = readJson(metaPath, `${metaPath}`, violations);
  const verify = readJson(verifyPath, `${verifyPath}`, violations);
  if (!meta || !verify) return { meta, verify, violations };

  if (typeof meta.id !== "string" || !meta.id.trim()) violations.push(`${metaPath}: id — mancante o vuoto`);
  if (!Array.isArray(meta.milestones) || meta.milestones.length === 0) {
    violations.push(`${metaPath}: milestones — array mancante o vuoto`);
    return { meta, verify, violations };
  }
  const weights = new Map();
  let weightSum = 0;
  for (const ms of meta.milestones) {
    if (!ms || typeof ms.id !== "string" || !ms.id.trim()) { violations.push(`${metaPath}: milestones[].id — mancante o vuoto`); continue; }
    if (weights.has(ms.id)) violations.push(`${metaPath}: milestones[].id — "${ms.id}" duplicato`);
    if (!Number.isInteger(ms.weight) || ms.weight <= 0) violations.push(`${metaPath}: milestones[${ms.id}].weight — ${ms.weight} deve essere un intero positivo`);
    else { weights.set(ms.id, ms); weightSum += ms.weight; }
    if (typeof ms.slice !== "boolean") violations.push(`${metaPath}: milestones[${ms.id}].slice — deve essere booleano`);
  }
  if (weights.size > 0 && weightSum !== 100) violations.push(`${metaPath}: milestones — somma pesi ${weightSum} ≠ 100`);

  if (verify.schema !== 1) violations.push(`${verifyPath}: schema — ${JSON.stringify(verify.schema)} deve essere 1`);
  if (verify.benchmark !== meta.id) violations.push(`${verifyPath}: benchmark — "${verify.benchmark}" ≠ "${meta.id}" del meta.json`);
  if (!Array.isArray(verify.milestones)) {
    violations.push(`${verifyPath}: milestones — deve essere un array di {id, pass, detail}`);
    return { meta, verify, violations };
  }
  const seen = new Set();
  for (const vm of verify.milestones) {
    if (!vm || typeof vm.id !== "string" || !vm.id.trim()) { violations.push(`${verifyPath}: milestones[].id — mancante o vuoto`); continue; }
    if (seen.has(vm.id)) violations.push(`${verifyPath}: milestones[].id — "${vm.id}" compare più di una volta`);
    seen.add(vm.id);
    if (typeof vm.pass !== "boolean") violations.push(`${verifyPath}: milestones[${vm.id}].pass — deve essere booleano`);
    if (typeof vm.detail !== "string") violations.push(`${verifyPath}: milestones[${vm.id}].detail — mancante o non stringa`);
    if (!weights.has(vm.id)) violations.push(`${meta.id}: verify.json/milestones — l'id "${vm.id}" non esiste nel meta.json`);
    else if (vm.weight !== undefined && vm.weight !== weights.get(vm.id).weight) {
      violations.push(`${meta.id}: verify.json/milestones[${vm.id}].weight — ${vm.weight} ≠ ${weights.get(vm.id).weight} del meta.json (peso divergente fra i due file)`);
    }
  }
  for (const id of weights.keys()) {
    if (!seen.has(id)) violations.push(`${meta.id}: verify.json/milestones — l'id "${id}" del meta.json non compare in verify.json`);
  }
  if (verify.notes !== undefined && typeof verify.notes !== "string") {
    violations.push(`${verifyPath}: notes — deve essere una stringa`);
  }
  if (exitCode !== undefined) {
    const allPass = [...weights.keys()].every((id) => verify.milestones.some((vm) => vm.id === id && vm.pass === true));
    const exitOk = exitCode === 0;
    if (exitOk !== allPass) {
      violations.push(`${meta.id}: verify.json/exit-code — ./verify.sh è uscito con ${exitCode} ma il file dichiara ${allPass ? "tutte le milestone superate" : "almeno una milestone fallita"}: disaccordo, non risolto in silenzio`);
    }
  }
  return { meta, verify, violations };
}

// Pure scoring arithmetic over validated inputs.
function computeScore(meta, verify) {
  const byId = new Map(verify.milestones.map((vm) => [vm.id, vm]));
  let raw = 0;
  let passingSliceSum = 0;
  const anySliceFailed = meta.milestones.some((ms) => ms.slice && byId.get(ms.id)?.pass !== true);
  const breakdown = meta.milestones.map((ms) => {
    const pass = byId.get(ms.id)?.pass === true;
    if (pass) raw += ms.weight;
    if (pass && ms.slice) passingSliceSum += ms.weight;
    return { id: ms.id, pass, weight: ms.weight, slice: ms.slice, title: ms.title };
  });
  const capped = anySliceFailed;
  const score = capped ? passingSliceSum : raw;
  return { score, raw, capped, capValue: passingSliceSum, breakdown };
}

function runCli(metaPath, verifyPath, exitCode) {
  const { meta, verify, violations } = loadAndValidate(metaPath, verifyPath, exitCode);
  if (violations.length > 0 || !meta || !verify || !Array.isArray(verify.milestones)) {
    for (const v of violations) console.error(`score.mjs: VIOLAZIONE ${v}`);
    if (violations.length === 0) console.error("score.mjs: VIOLAZIONE input incompleto");
    process.exit(1);
  }
  const { score, raw, capped, capValue, breakdown } = computeScore(meta, verify);
  const capNote = capped
    ? `cap attivo: slice fallita; il punteggio si ferma alla somma dei pesi slice superati (${capValue}); credito grezzo ${raw} azzerato oltre la slice`
    : "cap non attivo";
  console.log(`score.mjs: benchmark ${meta.id} — punteggio ${score}/100 (${capNote})`);
  for (const b of breakdown) {
    console.log(`score.mjs: milestone ${b.id}: ${b.pass ? "pass" : "FAIL"} — peso ${b.weight}, slice ${b.slice ? "sì" : "no"} — ${b.title}`);
  }
  if (verify.notes) console.log(`score.mjs: note: ${verify.notes}`);
  process.exit(0);
}

// --- self-test on committed fixtures (the contract's executable definition) ---
function selfTest() {
  const fx = (name) => join(HERE, "fixtures", name);
  const results = [];
  const assert = (name, cond, proof) => {
    results.push({ name, ok: !!cond, proof });
    console.log(`score.mjs self-test: ${name} — ${cond ? "OK" : "FAILED"} (${proof})`);
  };

  // 1. full pass: score 100, no cap, exit-code agreement with 0.
  {
    const { meta, verify, violations } = loadAndValidate(fx("meta.json"), fx("verify-full-pass.json"), 0);
    const s = violations.length === 0 ? computeScore(meta, verify) : null;
    assert("full-pass", s && s.score === 100 && !s.capped && violations.length === 0,
      `score ${s?.score}/100, cap ${s?.capped ? "attivo" : "non attivo"}, violazioni ${violations.length}, --exit 0 concorde`);
  }
  // 2. slice failed: score capped exactly at the sum of passing slice weights.
  {
    const { meta, verify, violations } = loadAndValidate(fx("meta.json"), fx("verify-slice-failed.json"), 1);
    const s = violations.length === 0 ? computeScore(meta, verify) : null;
    const expected = meta.milestones.filter((m) => m.slice && verify.milestones.find((v) => v.id === m.id)?.pass).reduce((a, m) => a + m.weight, 0);
    assert("slice-failed", s && s.capped && s.score === expected && s.score === 10 && s.raw === 75,
      `score ${s?.score}/100 = somma pesi slice superati (${expected}), credito grezzo ${s?.raw} ignorato, violazioni ${violations.length}`);
  }
  // 3. milestone missing from verify.json: violation, never silently scored.
  {
    const { violations } = loadAndValidate(fx("meta.json"), fx("verify-missing-milestone.json"), 1);
    const hit = violations.some((v) => v.includes("demo") && v.includes('"M2"') && v.includes("non compare"));
    assert("milestone-missing", violations.length > 0 && hit,
      `violazione attesa: ${violations.find((v) => v.includes("M2")) ?? "non trovata"}`);
  }
  // 4. weight mismatch between the two files: violation.
  {
    const { violations } = loadAndValidate(fx("meta.json"), fx("verify-weight-mismatch.json"), 1);
    const hit = violations.some((v) => v.includes("weight") && v.includes("12") && v.includes("10"));
    assert("weight-mismatch", violations.length > 0 && hit,
      `violazione attesa: ${violations.find((v) => v.includes("weight")) ?? "non trovata"}`);
  }
  // 5. malformed JSON: readable violation, no stack trace.
  {
    const { violations } = loadAndValidate(fx("meta.json"), fx("verify-malformed.json"), undefined);
    assert("malformed-json", violations.length > 0 && violations.every((v) => !v.includes("at ")),
      `violazione attesa: ${violations[0] ?? "non trovata"}`);
  }
  // 6. exit-code disagreement with an all-pass file: reported, not resolved.
  {
    const { violations } = loadAndValidate(fx("meta.json"), fx("verify-full-pass.json"), 1);
    const hit = violations.some((v) => v.includes("exit-code"));
    assert("exit-code-disagreement", hit,
      `violazione attesa: ${violations.find((v) => v.includes("exit-code")) ?? "non trovata"}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`score.mjs self-test: ${results.length - failed.length}/${results.length} assert superati`);
  process.exit(failed.length > 0 ? 1 : 0);
}

const args = process.argv.slice(2);
try {
  if (args.includes("--self-test")) {
    selfTest();
  } else {
    const exitIdx = args.indexOf("--exit");
    const exitCode = exitIdx >= 0 ? Number(args[exitIdx + 1]) : undefined;
    const paths = exitIdx >= 0 ? args.filter((_, i) => i !== exitIdx && i !== exitIdx + 1) : args;
    if (paths.length !== 2 || (exitIdx >= 0 && !Number.isInteger(exitCode))) {
      console.error("score.mjs: uso — node scripts/score.mjs <meta.json> <verify.json> [--exit N] | --self-test");
      process.exit(1);
    }
    runCli(paths[0], paths[1], exitCode);
  }
} catch (err) {
  console.error(`score.mjs: errore — ${err && err.message ? err.message : err}`);
  process.exit(1);
}
