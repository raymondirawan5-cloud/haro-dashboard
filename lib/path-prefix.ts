export function getPathPrefix(): string {
  const raw = process.env.HARO_ASSET_PREFIX || "";
  if (!raw || raw === "/") return "";
  return raw.replace(/\/$/, "");
}

export function withPrefix(path: string): string {
  const prefix = getPathPrefix();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${normalized}`;
}
