export type SpendRange = 7 | 30 | 90 | 365;

// Use the same UTC calendar boundaries for the totals and the plotted buckets.
export function rangeStart(range: SpendRange, now = new Date()) {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - range + 1);
}

export function dailySpend(records: { recordedAt: string; cost: number }[], range: SpendRange, now = new Date()) {
  const totals = new Map<string, number>();
  for (const record of records) {
    if (new Date(record.recordedAt).getTime() > now.getTime()) continue;
    const key = record.recordedAt.slice(0, 10);
    totals.set(key, (totals.get(key) ?? 0) + record.cost);
  }
  const start = rangeStart(range, now);
  return Array.from({ length: range }, (_, index) => {
    const key = new Date(start + index * 86_400_000).toISOString().slice(0, 10);
    return { key, value: totals.get(key) ?? 0 };
  });
}
