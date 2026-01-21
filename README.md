# opencode-firmware-quota

[![npm version](https://img.shields.io/npm/v/opencode-firmware-quota)](https://www.npmjs.com/package/opencode-firmware-quota)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An [OpenCode](https://opencode.ai) plugin that displays your [Firmware.ai](https://firmware.ai) API quota usage and reset time.

## Features

- **Automatic quota display** - Shows remaining quota when OpenCode starts
- **Session tracking** - Updates quota display after each session completes  
- **Multiple config sources** - Reads API key from environment variable or common config locations
- **Timezone-aware** - Displays reset time in your local timezone

## Installation

### Option 1: Add to OpenCode config (Recommended)

Add the plugin to your OpenCode configuration file:

**Project-level** (`opencode.json` in your project root):
```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-firmware-quota"]
}
```

**Global** (`~/.config/opencode/opencode.json`):
```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-firmware-quota"]
}
```

### Option 2: Local plugin file

Copy the plugin directly to your OpenCode plugins directory:

```bash
# Global plugins
mkdir -p ~/.config/opencode/plugins
curl -o ~/.config/opencode/plugins/firmware-quota.js \
  https://raw.githubusercontent.com/urgood2/FirmwareAIQuota/main/dist/index.js

# Or project-level
mkdir -p .opencode/plugins
curl -o .opencode/plugins/firmware-quota.js \
  https://raw.githubusercontent.com/urgood2/FirmwareAIQuota/main/dist/index.js
```

## Configuration

### Set your Firmware.ai API Key

The plugin looks for your API key in the following order:

1. **Environment variable** (recommended):
   ```bash
   export FIRMWARE_API_KEY="fw_api_your_key_here"
   ```

2. **LLM Proxy config** (for users of [LLM-API-Key-Proxy](https://github.com/Mirrowel/LLM-API-Key-Proxy)):
   ```
   ~/Projects/LLM-API-Key-Proxy/.env
   ```

3. **Firmware config files**:
   ```
   ~/.firmware/credentials
   ~/.config/firmware/api_key
   ```

### Getting a Firmware.ai API Key

1. Go to [app.firmware.ai](https://app.firmware.ai)
2. Sign in or create an account
3. Navigate to Settings → API Keys
4. Create a new API key and copy it

## Usage

Once configured, the plugin runs automatically:

- **On startup**: Displays your current quota
- **After each response**: Shows updated quota (debug level)

Example output:
```
🔋 Firmware.ai: 95.3% remaining (4.7% used) | Resets: 12:16 KST
```

## Troubleshooting

### "No Firmware.ai API key found"

Make sure you've set the `FIRMWARE_API_KEY` environment variable:

```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export FIRMWARE_API_KEY="fw_api_your_key_here"
```

### Quota not displaying

1. Verify your API key is valid by testing manually:
   ```bash
   curl -s https://app.firmware.ai/api/v1/quota \
     -H "Authorization: Bearer $FIRMWARE_API_KEY"
   ```

2. Check OpenCode logs for errors

## Development

```bash
# Clone the repository
git clone https://github.com/urgood2/FirmwareAIQuota.git
cd FirmwareAIQuota

# Install dependencies
npm install

# Build
npm run build

# Test locally by copying to plugins directory
cp dist/index.js ~/.config/opencode/plugins/firmware-quota.js
```

## License

MIT - See [LICENSE](LICENSE) for details.

## Related

- [OpenCode](https://opencode.ai) - The open source AI coding agent
- [Firmware.ai](https://firmware.ai) - LLM API provider
- [OpenCode Plugins Documentation](https://opencode.ai/docs/plugins/)
