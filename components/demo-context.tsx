"use client";

import { createContext, useContext } from "react";
import type { UsageRecord } from "../lib/usage-record";

export type DemoState = {
  email: string;
  records: UsageRecord[];
  refreshing: boolean;
  generatedAt: string;
  refresh: () => void;
  exit: () => void;
};

export const DemoContext = createContext<DemoState | null>(null);
export const useDemo = () => useContext(DemoContext);
