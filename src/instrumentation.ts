export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ensureFailproof } = await import("@/lib/failproof/runtime");
  ensureFailproof();
}
