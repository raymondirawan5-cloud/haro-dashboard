export function getPathPrefix(): string {
  // Runtime detection for client-side navigation behind Tailscale path proxy.
  if (typeof window !== "undefined") {
    const p = window.location.pathname || "";
    if (p === "/haro" || p.startsWith("/haro/")) return "/haro";
    if (p === "/haro-dev" || p.startsWith("/haro-dev/")) return "/haro-dev";
    return "";
  }

  // Server-side fallback (build/runtime env)
  const raw = process.env.HARO_ASSET_PREFIX || "";
  if (!raw || raw === "/") return "";
  return raw.replace(/\/$/, "");
}

export function withPrefix(path: string): string {
  const prefix = getPathPrefix();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${normalized}`;
}
