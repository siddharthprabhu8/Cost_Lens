import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { UsageRecord } from "./usage-record";

const ledgerDirectory = path.join(process.cwd(), "data", ".ledger");
const ledgerPath = path.join(ledgerDirectory, "usage.json");
const maximumRecords = 10_000;

let pendingWrite = Promise.resolve();

function isUsageRecord(value: unknown): value is UsageRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<UsageRecord>;
  return typeof record.id === "string" && typeof record.timestamp === "string" && typeof record.model === "string";
}

async function readLedger(): Promise<UsageRecord[]> {
  try {
    const contents = await readFile(ledgerPath, "utf8");
    const parsed = JSON.parse(contents) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isUsageRecord) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw new Error("CostLens could not read the local usage ledger.");
  }
}

async function writeLedger(records: UsageRecord[]) {
  await mkdir(ledgerDirectory, { recursive: true });
  const temporaryPath = `${ledgerPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  await rename(temporaryPath, ledgerPath);
}

/**
 * Adds a record to the local development ledger. The write queue prevents two
 * concurrent requests in the same server process from overwriting each other.
 */
export async function appendUsageRecord(record: UsageRecord): Promise<void> {
  const write = pendingWrite.then(async () => {
    const records = await readLedger();
    const withoutDuplicate = records.filter((item) => item.id !== record.id);
    await writeLedger([record, ...withoutDuplicate].slice(0, maximumRecords));
  });

  pendingWrite = write.catch(() => undefined);
  await write;
}

export async function listUsageRecords(limit = 100): Promise<UsageRecord[]> {
  const records = await readLedger();
  return records
    .sort((first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime())
    .slice(0, Math.min(Math.max(limit, 1), maximumRecords));
}

export async function findUsageRecord(id: string): Promise<UsageRecord | null> {
  const records = await readLedger();
  return records.find((record) => record.id === id) ?? null;
}
