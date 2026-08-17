export const SERVICE_WORKER_URL = "/sw.js";

export function registerServiceWorker(
  container: Pick<ServiceWorkerContainer, "register"> | undefined = globalThis.navigator
    ?.serviceWorker,
): Promise<unknown> | undefined {
  return container?.register(SERVICE_WORKER_URL);
}
