# AGENTS.md

- This is a public repository: assume all tracked content and diffs are public. Never commit secrets, `.env` files, private URLs, personal/customer data, or real production data; use fake placeholders. Review `git status` and the staged diff before committing, and never force-add ignored files. If private data appears, stop and alert the maintainer.
- Rakazo targets a PWA web app and an Electron desktop app for macOS; Electron hosts the web UI. Consider both surfaces when changing features or contracts.
- Prefer shared packages for domain logic, contracts, API behavior, and reusable UI. Keep genuinely native navigation, storage, permissions, and interactions platform-specific.
- Treat auth, secret handling, sandbox boundaries, host commands, and integrations as security-sensitive. Keep tests deterministic and offline by default.
