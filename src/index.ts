import type { Plugin } from "@opencode-ai/plugin";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

interface QuotaResponse {
  used: number;
  reset: string;
}

interface QuotaInfo {
  remaining: string;
  used: string;
  reset: string;
  resetLocal: string;
}

const FIRMWARE_API_URL = "https://app.firmware.ai/api/v1/quota";
const ENV_VAR_NAME = "FIRMWARE_API_KEY";

function getApiKey(): string | null {
  if (process.env[ENV_VAR_NAME]) {
    return process.env[ENV_VAR_NAME]!;
  }

  const envPaths = [
    path.join(os.homedir(), "Projects", "LLM-API-Key-Proxy", ".env"),
    path.join(os.homedir(), ".firmware", "credentials"),
    path.join(os.homedir(), ".config", "firmware", "api_key"),
  ];

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const match = content.match(/(?:FIRMWARE_API_KEY[_\d]*=['"]?)([^'"\s\n]+)/);
        if (match) return match[1];
      }
    } catch {}
  }

  return null;
}

async function fetchQuota(apiKey: string): Promise<QuotaInfo | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(FIRMWARE_API_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = (await response.json()) as QuotaResponse;
    const remaining = ((1 - data.used) * 100).toFixed(1);
    const used = (data.used * 100).toFixed(1);

    let resetLocal = data.reset;
    if (data.reset) {
      try {
        const resetDate = new Date(data.reset);
        resetLocal = resetDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZoneName: "short",
        });
      } catch {}
    }

    return { remaining, used, reset: data.reset, resetLocal };
  } catch {
    return null;
  }
}

function formatQuotaMessage(quota: QuotaInfo): string {
  return `🔋 Firmware.ai: ${quota.remaining}% remaining (${quota.used}% used) | Resets: ${quota.resetLocal}`;
}

export const FirmwareQuotaPlugin: Plugin = async ({ client }) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    await client.app.log({
      body: {
        service: "firmware-quota",
        level: "warn",
        message:
          "No Firmware.ai API key found. Set FIRMWARE_API_KEY environment variable.",
      },
    });
    return {};
  }

  const quota = await fetchQuota(apiKey);
  if (quota) {
    await client.app.log({
      body: {
        service: "firmware-quota",
        level: "info",
        message: formatQuotaMessage(quota),
      },
    });
  }

  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        const quota = await fetchQuota(apiKey);
        if (quota) {
          await client.app.log({
            body: {
              service: "firmware-quota",
              level: "debug",
              message: `🔋 ${quota.remaining}% remaining`,
            },
          });
        }
      }
    },
  };
};

export default FirmwareQuotaPlugin;
