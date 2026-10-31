import { configure } from "@failproofai/sdk";
import { getFailproofConfig } from "@/lib/failproof/config";
import { logger } from "@/lib/logger";

let configured = false;

/** Configure the official SDK once. Events spool locally until `shipSpool` uploads them. */
export function ensureFailproof(): boolean {
  if (configured) return true;
  const config = getFailproofConfig();
  try {
    configure({
      environment: config.environment,
      baseDir: config.spoolDir,
      flushInterval: 0.5,
    });
    configured = true;
    return true;
  } catch (error) {
    logger.warn("Failproof SDK configuration failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
