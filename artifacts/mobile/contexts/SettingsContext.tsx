import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as db from "@/lib/db";

const GROQ_KEY = "groq_api_key";
const MODEL_KEY = "groq_model";

export const GROQ_MODELS = [
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B" },
  { id: "meta-llama/llama-prompt-guard-2-86m", label: "Llama Guard 2 86m" },
];

interface SettingsContextType {
  groqApiKey: string;
  groqModel: string;
  setGroqApiKey: (key: string) => Promise<void>;
  setGroqModel: (model: string) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [groqApiKey, setKey] = useState("");
  const [groqModel, setModel] = useState(GROQ_MODELS[0].id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [k, m] = await Promise.all([
        db.getSetting(GROQ_KEY),
        db.getSetting(MODEL_KEY),
      ]);
      if (k) setKey(k);
      if (m) setModel(m);
      setLoading(false);
    })();
  }, []);

  const setGroqApiKey = useCallback(async (key: string) => {
    setKey(key);
    await db.setSetting(GROQ_KEY, key);
  }, []);

  const setGroqModel = useCallback(async (model: string) => {
    setModel(model);
    await db.setSetting(MODEL_KEY, model);
  }, []);

  return (
    <SettingsContext.Provider value={{ groqApiKey, groqModel, setGroqApiKey, setGroqModel, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
