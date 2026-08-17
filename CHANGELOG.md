# Changelog

Notable product changes in Rakazo. This is for people following the repo, not a dump of every commit. GitHub Releases still mark tagged builds.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- GitHub Copilot and SuperGrok / X Premium sign-in via Pi device-code OAuth (`openai-codex`, `github-copilot`, `xai`). Claude Pro is still omitted because Pi's Claude login uses a localhost callback that does not work from the web app.
- Spawn peer bots (each with its own thread and computer) and short-lived in-thread subagents.
- ChatGPT Plus or Pro sign-in for model access.
- Mobile: point the app at a self-hosted API origin, a native iOS inbox, and take control of the live desktop.
- Revoke for connected Composio plugins.
- Routines in plain language instead of raw cron.

### Removed

- Native macOS shell and first-run host-computer prompt. The only frontend is the installable web PWA. Host-user command execution remains available by setting `SANDBOX_PROVIDER=desktop`.

## [0.1.0-beta] - 2026-08-13

Initial public beta: web PWA frontend; Pi runtime; Docker and E2B computers; plugins; one thread, computer, memory, routines, and history per bot.
