# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

slack2md exports Slack conversations to Markdown files optimized for NotebookLM. It fetches data via Slack API, stores it in SQLite, and generates partitioned Markdown output.

## Commands

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run a single test file
pnpm vitest run src/formatters/__tests__/mentions.test.ts

# Type check
npx tsc --noEmit

# CLI commands (require SLACK_BOT_TOKEN env var via direnv)
pnpm run load:metadata                    # Fetch users, channels, usergroups
pnpm run load:messages --channels C123 --from 2024-01-01 --to 2024-01-31 --timezone Asia/Tokyo
pnpm run generate --partition weekly --output-dir ./output
```

## Architecture

```
src/
├── commands/     # CLI entry points (load-metadata, load-messages, generate)
├── api/          # Slack API wrappers with pagination
├── db/           # SQLite layer (better-sqlite3)
│   └── repositories/  # UPSERT operations per table
├── formatters/   # Pure functions: POJO → Markdown string
│   └── __tests__/     # Unit tests for formatters
├── types/        # TypeScript interfaces
└── utils/        # Date/partition helpers
```

### Data Flow

1. **load:metadata** → Slack API → SQLite (users, channels, user_groups tables)
2. **load:messages** → Slack API → SQLite (messages table with thread support)
3. **generate** → SQLite → Formatters → Markdown files (channel + threads, partitioned by day/week/month)

### Key Design Decisions

- **Formatters are pure functions**: Take Map/POJO inputs, return strings. No DB/IO calls. Fully unit testable.
- **UPSERT with ON CONFLICT**: Idempotent operations for re-running commands safely.
- **Mention conversion**: `<@USERID>` → `@email`, `<#CHANNELID>` → `#channel-name` (applies to message text AND attachment text).
