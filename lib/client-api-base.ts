export function getClientBasePath(): string {
  if (typeof window === "undefined") return "";
  const p = window.location.pathname || "";
  if (p === "/haro" || p.startsWith("/haro/")) return "/haro";
  if (p === "/haro-dev" || p.startsWith("/haro-dev/")) return "/haro-dev";
  return "";
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getClientBasePath()}${normalized}`;
}
