# AGENTS.md - AI Agent Instructions

This file provides context for AI coding agents working with this repository.

## Project Overview

**opencode-firmware-quota** is an OpenCode plugin that displays Firmware.ai API quota usage.

## Architecture

```
src/
└── index.ts    # Single-file plugin with all functionality
```

### Key Components

1. **`getApiKey()`** - Retrieves API key from environment or config files
2. **`fetchQuota()`** - Calls Firmware.ai API to get quota data
3. **`FirmwareQuotaPlugin`** - Main plugin export that hooks into OpenCode events

## API Reference

### Firmware.ai Quota API

```
GET https://app.firmware.ai/api/v1/quota
Authorization: Bearer <api_key>

Response:
{
  "used": 0.047,      // Fraction used (0-1)
  "reset": "2026-01-21T03:16:01.459Z"  // ISO 8601 reset time
}
```

### OpenCode Plugin Hooks Used

- **`client.app.log()`** - Display messages in OpenCode
- **`event` hook** - Listen for `session.idle` events

## Configuration Sources (Priority Order)

1. `FIRMWARE_API_KEY` environment variable
2. `~/Projects/LLM-API-Key-Proxy/.env` (FIRMWARE_API_KEY_* pattern)
3. `~/.firmware/credentials`
4. `~/.config/firmware/api_key`

## Common Tasks

### Building
```bash
npm install
npm run build
```

### Testing Locally
```bash
cp dist/index.js ~/.config/opencode/plugins/firmware-quota.js
```

### Adding New Config Source
Edit `getApiKey()` in `src/index.ts`, add path to `envPaths` array.

## Code Style

- TypeScript strict mode
- ES modules (`"type": "module"`)
- Minimal dependencies (only `@opencode-ai/plugin` peer dep)
- No comments except JSDoc for public API
