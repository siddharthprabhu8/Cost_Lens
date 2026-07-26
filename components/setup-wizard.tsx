"use client";

import { FormEvent, useEffect, useState } from "react";

type SetupProfile = {
  ownerName: string;
  organizationName: string;
  defaults: { environment: "development" | "staging" | "production"; feature?: string; customer?: string };
};

type SetupState = {
  configured: boolean;
  canSaveKey: boolean;
  profile?: SetupProfile | null;
};

export function SetupWizard() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [environment, setEnvironment] = useState<"development" | "staging" | "production">("development");
  const [feature, setFeature] = useState("");
  const [customer, setCustomer] = useState("");
  const [state, setState] = useState<SetupState>({ configured: false, canSaveKey: false });
  const [returningWorkspace, setReturningWorkspace] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/setup").then((response) => response.json()).then((data: SetupState) => {
      setState(data);
      if (data.profile) {
        setName(data.profile.ownerName);
        setOrganization(data.profile.organizationName);
        setEnvironment(data.profile.defaults.environment);
        setFeature(data.profile.defaults.feature ?? "");
        setCustomer(data.profile.defaults.customer ?? "");
        setReturningWorkspace(true);
      }
    }).catch(() => undefined);
  }, []);

  function next() {
    if (step === 1 && (!name.trim() || !organization.trim())) { setError("Add your name and organization to continue."); return; }
    setError(""); setStep(Math.min(step + 1, 3));
  }

  async function finish(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    const response = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerName: name, organizationName: organization, apiKey, environment, feature, customer }) });
    const data = await response.json() as { error?: string };
    setSaving(false);
    if (!response.ok) { setError(data.error ?? "Unable to complete setup."); return; }
    window.location.assign("/");
  }

  return <main className="setup-shell"><section className="setup-card"><div className="setup-brand"><span className="brand-mark">◒</span><b>CostLens</b></div><div className="setup-progress" aria-label={`Step ${step} of 3`}><i className={step >= 1 ? "active" : ""} /><i className={step >= 2 ? "active" : ""} /><i className={step >= 3 ? "active" : ""} /></div><form onSubmit={finish}>{step === 1 && <><p className="eyebrow">{returningWorkspace ? "WORKSPACE SETTINGS" : "WELCOME TO COSTLENS"}</p><h1>{returningWorkspace ? "Update your cost workspace." : "Set up your cost workspace."}</h1><p className="setup-copy">CostLens is self-hosted AI cost intelligence. Start by naming the workspace that will own this usage data.</p><label>Your name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ada Lovelace" /></label><label>Organization or project<input value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder="Acme Engineering" /></label></>}{step === 2 && <><p className="eyebrow">CONNECT OPENROUTER</p><h1>Where CostLens gets usage data.</h1><p className="setup-copy">CostLens uses OpenRouter exclusively. Your key stays on this server and is never sent to the browser after setup.</p>{state.canSaveKey ? <><label>{state.configured ? "Replace OpenRouter API key" : "OpenRouter API key"}<input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={state.configured ? "Leave blank to keep the current key" : "sk-or-…"} autoComplete="off" /></label>{state.configured && <p className="setup-help">An OpenRouter key is already configured for this installation. Leave this blank to keep it.</p>}</> : state.configured ? <div className="setup-notice success">OpenRouter is already configured for this installation. You can continue without entering a key.</div> : <div className="setup-notice">Set <code>OPENROUTER_API_KEY</code> in your hosting provider’s environment settings, redeploy, then return to this step.</div>}{state.canSaveKey && <p className="setup-help">You can add or replace a local development key here. For cloud hosting, set it as a server-side environment variable.</p>}</>}{step === 3 && <><p className="eyebrow">TRACKING DEFAULTS</p><h1>Make every request easier to explain.</h1><p className="setup-copy">These optional values are starting points for your integration. You can override them on every tracked request.</p><label>Default environment<select value={environment} onChange={(event) => setEnvironment(event.target.value as typeof environment)}><option value="development">Development</option><option value="staging">Staging</option><option value="production">Production</option></select></label><label>Example feature <input value={feature} onChange={(event) => setFeature(event.target.value)} placeholder="Document summary" /></label><label>Example customer <input value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="Acme Inc." /></label></>}{error && <p className="setup-error" role="alert">{error}</p>}<div className="setup-actions">{step > 1 && <button className="button button-secondary" type="button" onClick={() => { setError(""); setStep(step - 1); }}>Back</button>}{step < 3 ? <button key="continue" className="button button-primary" type="button" onClick={next}>Continue</button> : <button key="submit" className="button button-primary" type="submit" disabled={saving}>{saving ? "Saving…" : returningWorkspace ? "Save changes" : "Open CostLens"}</button>}</div></form></section></main>;
}
