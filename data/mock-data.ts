export type RequestStatus = "Success" | "Rate limited" | "Failed";

export type AIRequest = {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  feature: string;
  customer: string;
  inputTokens: number;
  outputTokens: number;
  latency: string;
  cost: number;
  status: RequestStatus;
};

export const trend = [
  108, 112, 101, 116, 125, 118, 137, 128, 142, 151, 145, 162, 157, 170, 164, 178, 185, 174, 189, 202, 194, 217, 209, 228, 219, 238, 232, 245, 239, 257,
];

export const requests: AIRequest[] = [
  { id: "req_01J9KM3VSXN3", timestamp: "Today, 10:42 AM", provider: "Anthropic", model: "Claude 3.5 Sonnet", feature: "Support copilot", customer: "Arcade Labs", inputTokens: 2840, outputTokens: 612, latency: "1.24s", cost: 0.0218, status: "Success" },
  { id: "req_01J9KJYF7H40", timestamp: "Today, 10:37 AM", provider: "OpenAI", model: "GPT-4o", feature: "Document summary", customer: "Meridian", inputTokens: 6210, outputTokens: 948, latency: "2.04s", cost: 0.0341, status: "Success" },
  { id: "req_01J9KHJ23V9M", timestamp: "Today, 10:31 AM", provider: "Google", model: "Gemini 1.5 Pro", feature: "Research assistant", customer: "Northstar", inputTokens: 4520, outputTokens: 1260, latency: "1.86s", cost: 0.0187, status: "Success" },
  { id: "req_01J9KFXQT17K", timestamp: "Today, 10:26 AM", provider: "OpenAI", model: "GPT-4o mini", feature: "Data extraction", customer: "Arcade Labs", inputTokens: 1340, outputTokens: 208, latency: "0.74s", cost: 0.0013, status: "Success" },
  { id: "req_01J9KDX8Y8PA", timestamp: "Today, 10:19 AM", provider: "Anthropic", model: "Claude 3 Haiku", feature: "Content review", customer: "Atlas Health", inputTokens: 980, outputTokens: 144, latency: "0.42s", cost: 0.0007, status: "Success" },
  { id: "req_01J9KBW4BFT2", timestamp: "Today, 10:12 AM", provider: "OpenAI", model: "GPT-4o", feature: "Support copilot", customer: "Meridian", inputTokens: 3840, outputTokens: 702, latency: "1.72s", cost: 0.0264, status: "Success" },
  { id: "req_01J9K9NQ7X21", timestamp: "Today, 10:04 AM", provider: "Google", model: "Gemini 1.5 Flash", feature: "Data extraction", customer: "Northstar", inputTokens: 1870, outputTokens: 340, latency: "0.66s", cost: 0.0009, status: "Success" },
  { id: "req_01J9K7Z3ZWPN", timestamp: "Today, 9:56 AM", provider: "Anthropic", model: "Claude 3.5 Sonnet", feature: "Research assistant", customer: "Atlas Health", inputTokens: 7930, outputTokens: 1675, latency: "3.18s", cost: 0.0526, status: "Success" },
  { id: "req_01J9K5RFM6CE", timestamp: "Today, 9:48 AM", provider: "OpenAI", model: "GPT-4o mini", feature: "Content review", customer: "Arcade Labs", inputTokens: 1240, outputTokens: 356, latency: "0.81s", cost: 0.0018, status: "Success" },
  { id: "req_01J9K3D9H2YS", timestamp: "Today, 9:39 AM", provider: "OpenAI", model: "GPT-4o", feature: "Document summary", customer: "Northstar", inputTokens: 4920, outputTokens: 880, latency: "1.95s", cost: 0.0296, status: "Success" },
];

export const modelCosts = [
  { label: "Claude 3.5 Sonnet", value: "$1,942.80", detail: "42.6%", width: 100, tone: "violet" },
  { label: "GPT-4o", value: "$1,418.22", detail: "31.1%", width: 73, tone: "indigo" },
  { label: "Gemini 1.5 Pro", value: "$706.46", detail: "15.5%", width: 38, tone: "cyan" },
  { label: "GPT-4o mini", value: "$302.87", detail: "6.6%", width: 18, tone: "sky" },
];

export const providerCosts = [
  { label: "Anthropic", value: "$2,215.06", detail: "48.6%", color: "#8b5cf6" },
  { label: "OpenAI", value: "$1,721.09", detail: "37.8%", color: "#4f46e5" },
  { label: "Google", value: "$620.20", detail: "13.6%", color: "#06b6d4" },
];

export const featureCosts = [
  { label: "Support copilot", value: "$1,486.32", detail: "32.6%", width: 100 },
  { label: "Document summary", value: "$1,083.75", detail: "23.8%", width: 73 },
  { label: "Research assistant", value: "$894.08", detail: "19.6%", width: 60 },
  { label: "Data extraction", value: "$612.40", detail: "13.4%", width: 41 },
];

export const customerCosts = [
  { label: "Arcade Labs", value: "$1,328.52", detail: "29.2%", initials: "AL", color: "#e0e7ff" },
  { label: "Northstar", value: "$1,098.86", detail: "24.1%", initials: "N", color: "#cffafe" },
  { label: "Meridian", value: "$986.40", detail: "21.7%", initials: "M", color: "#ede9fe" },
  { label: "Atlas Health", value: "$724.10", detail: "15.9%", initials: "AH", color: "#dcfce7" },
];
