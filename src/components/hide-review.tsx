"use client";

/** Knappen på /recensioner/dolj. Länken (#t=…) kommer från mejlet om en ny recension. */
import { useEffect, useState } from "react";
import { buttonClasses } from "@/components/ui";

type State =
  | { s: "loading" }
  | { s: "missing" }
  | { s: "ready"; token: string }
  | { s: "sending"; token: string }
  | { s: "done" }
  | { s: "error"; token: string; message: string };

export function HideReview() {
  const [state, setState] = useState<State>({ s: "loading" });

  useEffect(() => {
    const m = /^#t=([A-Za-z0-9_.-]+)$/.exec(window.location.hash);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- läser webbläsarens adress en gång
    setState(m ? { s: "ready", token: m[1] } : { s: "missing" });
  }, []);

  async function hide(token: string) {
    setState({ s: "sending", token });
    try {
      const res = await fetch("/api/reviews/hide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (data?.ok) setState({ s: "done" });
      else setState({ s: "error", token, message: data?.message ?? "Något gick fel. Försök igen." });
    } catch {
      setState({ s: "error", token, message: "Ingen kontakt med servern. Försök igen." });
    }
  }

  const box = "max-w-xl rounded-2xl border border-white/10 bg-ink-850 p-6 sm:p-8";
  if (state.s === "loading") return <div className={`${box} h-32`} />;
  if (state.s === "missing")
    return <p className={`${box} text-mist-200`}>Länken saknas. Öppna länken ”Dölj recensionen” direkt från mejlet.</p>;
  if (state.s === "done")
    return (
      <p role="status" className={`${box} font-semibold text-white`}>
        Klart! Recensionen syns inte längre på hemsidan.
      </p>
    );
  return (
    <div className={box}>
      <p className="text-mist-200">Vill du dölja recensionen från mejlet? Den syns då inte längre på hemsidan.</p>
      {state.s === "error" && (
        <p role="alert" className="mt-4 font-semibold text-red-200">
          {state.message}
        </p>
      )}
      <button
        type="button"
        disabled={state.s === "sending"}
        onClick={() => hide(state.token)}
        className={buttonClasses("primary", "md", "mt-6")}
      >
        {state.s === "sending" ? "Döljer…" : "Dölj recensionen"}
      </button>
    </div>
  );
}
