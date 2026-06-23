export function formatOrderCode(code?: number | string | null): string {
  const value = String(code ?? "").replace(/\D/g, "");
  return `#${(value || "0").padStart(4, "0")}`;
}
