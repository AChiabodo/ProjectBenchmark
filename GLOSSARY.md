# Benchmark Suite

A collection of specifications used to measure how well a model can design and build a
complete software project from a written plan, inside one session on one host.

## Language

**Benchmark**:
A directory holding the specification a model must satisfy; it scores the model's output,
not the specification's own quality.
_Avoid_: project, exercise, task, test

**Plan**:
The `PLAN.md` that constitutes a Benchmark's specification: scope, constraints, milestones
and Definition of Done.
_Avoid_: spec, brief, prompt, doc

**Wording source**:
A file that is a plain product prompt rather than a Plan; retained only as an easier
variant for low-capability models.
_Avoid_: legacy prompt, old prompt

**Constraint banner**:
The identical block at the top of every Plan that states the shared rules: one session, one
host, no external requests at runtime, Docker Compose when more than one node is needed, no
deployment or publishing.
_Avoid_: preamble, prerequisites, requirements

**Vertical slice**:
The smallest end-to-end runnable path of a Benchmark, exercised by a real user action and
required to pass before any stretch content is scored.
_Avoid_: MVP, prototype, demo, walking skeleton

**Weighted milestone**:
A Plan checkpoint carrying an explicit score weight, so partial completion is measured
proportionally instead of pass/fail.
_Avoid_: step, phase, stage, task

**Offline source**:
Bundled fixture data standing in for a remote service a Benchmark would otherwise call.
_Avoid_: mock, stub, sample data, seed data
