"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { generateDemoRecords, type DemoSession } from "../data/demo-data";
import { CostLensApp } from "./costlens-app";
import { DemoContext } from "./demo-context";
import "./demo.css";

// This presentation workspace runs entirely in the browser, independently of live APIs.
const sessionKey = "costlens-presentation-session-v2";
const steps = ["Loading API configuration", "Syncing workspace activity", "Preparing your dashboard"];
const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
function newSession(email: string): DemoSession {
  return { email, seed: randomSeed(), generatedAt: new Date().toISOString(), updates: [] };
}
function remember(session: DemoSession) {
  try { sessionStorage.setItem(sessionKey, JSON.stringify(session)); } catch { /* Continue in memory when storage is unavailable. */ }
}
function withActivity(session: DemoSession): DemoSession {
  return { ...session, updates: [...(session.updates ?? []), { at: new Date().toISOString(), seed: randomSeed() }] };
}

export function DemoExperience({ page, requestId }: { page: "overview" | "requests" | "analytics" | "request-detail" | "settings"; requestId?: string }) {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [restored, setRestored] = useState(false);
  const [email, setEmail] = useState("");
  const [loadingStep, setLoadingStep] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(sessionKey) ?? "null") as DemoSession | null;
      if (saved && typeof saved.email === "string" && Number.isInteger(saved.seed) && Number.isFinite(Date.parse(saved.generatedAt)) && (!saved.updates || (Array.isArray(saved.updates) && saved.updates.every(update => Number.isInteger(update.seed) && Number.isFinite(Date.parse(update.at)))))) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restore browser-only session after hydration
        setSession(saved);
      }
    } catch { /* Invalid saved sessions return to sign-in. */ }
    setRestored(true);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    if (loadingStep === null) return;
    const timeout = setTimeout(() => {
      if (loadingStep < steps.length - 1) setLoadingStep(loadingStep + 1);
      else {
        const next = newSession(email.trim());
        remember(next); setSession(next); setLoadingStep(null); router.replace("/workspace");
      }
    }, 850);
    return () => clearTimeout(timeout);
  }, [loadingStep, email, router]);

  const active = Boolean(session);
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setSession(current => current ? withActivity(current) : current);
    }, 20_000);
    return () => clearInterval(interval);
  }, [active]);
  useEffect(() => { if (session) remember(session); }, [session]);

  const records = useMemo(() => session ? generateDemoRecords(session) : [], [session]);
  function enter(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoadingStep(0); }
  function refresh() {
    if (!session || refreshing) return;
    setRefreshing(true);
    timer.current = setTimeout(() => {
      setSession(current => current ? withActivity(current) : current);
      setRefreshing(false);
    }, 650);
  }
  function exit() {
    if (timer.current) clearTimeout(timer.current);
    try { sessionStorage.removeItem(sessionKey); } catch { /* Nothing persisted. */ }
    setSession(null); setEmail(""); setRefreshing(false); router.replace("/workspace");
  }

  if (!restored || loadingStep !== null) return <main className="demo-entry loading-entry"><section className="demo-loading" aria-live="polite" aria-busy="true"><div className="loading-wordmark">COSTLENS</div><p className="eyebrow">WORKSPACE INITIALIZATION</p><h1>{loadingStep === null ? "Opening workspace" : steps[loadingStep]}</h1><p>Your cost intelligence, coming into focus.</p><div className="demo-loading-track"><i style={{ width: `${loadingStep === null ? 10 : (loadingStep + 1) / steps.length * 100}%` }} /></div><ol>{steps.map((step, index) => <li key={step} className={index <= (loadingStep ?? -1) ? "complete" : ""}><span>{index < (loadingStep ?? 0) ? "✓" : `0${index + 1}`}</span>{step}</li>)}</ol><span className="loading-footer">COSTLENS / AI COST INTELLIGENCE</span></section></main>;

  if (!session) return <main className="demo-entry"><header className="entry-nav"><Link className="brand" href="/workspace">COSTLENS<span className="wordmark-orbit">↗</span></Link><span>AI COST INTELLIGENCE</span><Link href="/setup">Workspace setup ↗</Link></header><div className="demo-login-layout"><section className="demo-story"><p className="eyebrow">CL / MISSION CONTROL FOR AI SPEND</p><h1>Every dollar.<br />In your orbit.</h1><p>A complete view of your AI operations.<br />From the first token to the bottom line.</p><div className="entry-coordinates"><span>01 / OBSERVE</span><span>02 / UNDERSTAND</span><span>03 / OPTIMIZE</span></div></section><section className="demo-login-card"><p className="eyebrow">ACCESS YOUR WORKSPACE</p><h2>Welcome<br />back.</h2><p>Enter your email to open your workspace.</p><form onSubmit={enter}><label htmlFor="workspace-email">Email address</label><input id="workspace-email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /><button className="button button-primary" type="submit">Continue <span>↗</span></button></form><div className="entry-card-footer"><span>YOUR MODELS. YOUR METRICS.</span><span>ONE CLEAR PICTURE.</span></div></section></div><footer className="entry-footer"><span>© {new Date().getFullYear()} COSTLENS</span><span>BUILT FOR WHAT COMES NEXT.</span><a href="https://www.nasa.gov/image-article/milky-way-glittering-above-earths-horizon/" target="_blank" rel="noreferrer">IMAGE: NASA / ISS</a></footer></main>;

  const generatedAt = session.updates?.at(-1)?.at ?? session.generatedAt;
  return <DemoContext.Provider value={{ email: session.email, records, refreshing, generatedAt, refresh, exit }}><CostLensApp page={page} requestId={requestId} /></DemoContext.Provider>;
}
