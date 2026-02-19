const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function getPathPrefix(): string {
  return basePath;
}

export function withPrefix(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}
