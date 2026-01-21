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
const TIMEOUT_MS = 3000;

function getApiKey(): string | null {
  if (process.env[ENV_VAR_NAME]) {
    return process.env[ENV_VAR_NAME]!;
  }

  const envPaths = [
    path.join(os.homedir(), "Projects", "LLM-API-Key-Proxy", ".env"),
    path.join(os.homedir(), ".firmware", "credentials"),
    path.join(os.homedir(), ".config", "firmware", "api_key"),
    ...(process.platform === "win32" && process.env.APPDATA
      ? [path.join(process.env.APPDATA, "firmware", "api_key")]
      : []),
  ];

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const match = content.match(/(?:FIRMWARE_API_KEY[_\d]*=['"]?)([^'"\s\n]+)/);
        if (match) return match[1];
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function fetchWithHardTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = (await Promise.race([
      fetch(url, { ...options, signal: controller.signal }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Hard timeout")), timeoutMs),
      ),
    ])) as Response;
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function fetchQuota(apiKey: string): Promise<QuotaInfo | null> {
  try {
    const response = await fetchWithHardTimeout(
      FIRMWARE_API_URL,
      { headers: { Authorization: `Bearer ${apiKey}` } },
      TIMEOUT_MS,
    );

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
      } catch {
        resetLocal = data.reset;
      }
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
    void client.app
      .log({
        body: {
          service: "firmware-quota",
          level: "warn",
          message:
            "No Firmware.ai API key found. Set FIRMWARE_API_KEY environment variable.",
        },
    })
      .catch(() => undefined);
    return {};
  }

  void (async () => {
    try {
      const quota = await fetchQuota(apiKey);
      if (quota) {
        await client.tui
          .showToast({
            body: {
              message: formatQuotaMessage(quota),
              variant: "info",
            },
          })
          .catch(() => undefined);

        await client.app
          .log({
            body: {
              service: "firmware-quota",
              level: "info",
              message: formatQuotaMessage(quota),
            },
          })
          .catch(() => undefined);
      }
    } catch {
      return;
    }
  })();

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
