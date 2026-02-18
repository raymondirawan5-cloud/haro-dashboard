export function getClientBasePath(): string {
  if (typeof window === "undefined") return "";
  const p = window.location.pathname || "";
  return p === "/haro" || p.startsWith("/haro/") ? "/haro" : "";
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getClientBasePath()}${normalized}`;
}
