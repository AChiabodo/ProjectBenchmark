# Offline fixtures for paper-feed

paper-feed replaces every live source (Miniflux RSS, arXiv, Hugging Face, GitHub, LLM and embedding providers, SMTP delivery) with recorded offline fixtures and a local MailHog for the delivery channel, behind the same internal adapter interfaces the plan already mandates. Trade-off: we lose true end-to-end integration with real services, and gain deterministic, offline, repeatable runs in a suite where runtime network access is banned outright (ADR-0001); C8 turns this decision into the revised plan.
