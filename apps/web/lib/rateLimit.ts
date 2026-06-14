type Entry = { windowStart: number; count: number };
const buckets = new Map<string, Entry>();

export function checkRateLimit(key: string, maxPerMinute = 120) {
  const now = Date.now();
  const minute = 60_000;
  const current = buckets.get(key);
  if (!current || now - current.windowStart > minute) {
    buckets.set(key, { windowStart: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= maxPerMinute;
}
