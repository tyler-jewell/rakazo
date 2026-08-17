export function embeddableScreenUrl(url: string | null, pageHref?: string): string | null {
  if (!url) return null;
  const page = pageHref ?? (typeof location === "undefined" ? undefined : location.href);
  if (!page) return /^https?:\/\//i.test(url) ? url : null;
  try {
    const parsed = new URL(url, page);
    const current = new URL(page);
    const local = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
    const pagePort = current.port || (current.protocol === "https:" ? "443" : "80");
    if (local && parsed.port && parsed.port !== pagePort) {
      return null;
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
