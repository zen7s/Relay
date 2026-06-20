export function getSafeRedirectPath(
  value: FormDataEntryValue | string | null | undefined,
  fallback = "/",
) {
  if (typeof value !== "string") {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "http://relay.local");

    if (parsed.origin !== "http://relay.local") {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
