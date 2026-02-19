"use client";

import { useState } from "react";
import { Bot, Send, Package } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function AIPage() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<
    { itemId: string; name: string; suggestedQuantity: number; reason: string }[]
  >([]);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const { addToast } = useToast();

  async function handleAsk() {
    if (!query.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setAnswer(data.answer ?? "No response.");
      else addToast(data.error || "Failed", "error");
    } catch {
      addToast("Request failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadPredictions() {
    setPredictionsLoading(true);
    try {
      const res = await fetch("/api/ai/reorder-prediction", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setPredictions(data.predictions ?? []);
      else addToast(data.error || "Failed to load", "error");
    } catch {
      addToast("Request failed", "error");
    } finally {
      setPredictionsLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
      <p className="mt-1 text-muted-foreground">Ask questions and get reorder predictions</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Bot className="h-5 w-5" />
            Chat
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try: &quot;Which items are low in stock?&quot; or &quot;What should I reorder this week?&quot;
          </p>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask about inventory..."
              className="input flex-1"
            />
            <button
              type="button"
              onClick={handleAsk}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {loading ? "…" : "Ask"}
            </button>
          </div>
          {answer && (
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-foreground">
              {answer}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Package className="h-5 w-5" />
            AI Reorder Prediction
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Items likely to need restocking based on current levels.
          </p>
          <button
            type="button"
            onClick={loadPredictions}
            disabled={predictionsLoading}
            className="btn-secondary mt-4"
          >
            {predictionsLoading ? "Loading…" : "Load predictions"}
          </button>
          {predictions.length > 0 && (
            <ul className="mt-4 space-y-2">
              {predictions.map((p) => (
                <li key={p.itemId} className="rounded-lg border border-border p-3 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <p className="mt-1 text-muted-foreground">Suggested quantity: {p.suggestedQuantity}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
