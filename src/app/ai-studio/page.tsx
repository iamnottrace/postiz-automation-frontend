"use client";

import { useState, useEffect } from "react";
import { VideoStudio } from "studio";
import { Toaster } from "react-hot-toast";

export default function AiStudioPage() {
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("ppq_api_key") || "";
    setApiKey(stored);
  }, []);

  return (
    <div className="h-full">
      <Toaster position="top-right" />
      {apiKey ? (
        <VideoStudio apiKey={apiKey} />
      ) : (
        <ApiKeyPrompt onSet={setApiKey} />
      )}
    </div>
  );
}

function ApiKeyPrompt({ onSet }: { onSet: (key: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold">ppq.ai API Key required</h2>
        <p className="text-muted-foreground">
          Enter your ppq.ai API key to start generating videos. It will be stored locally in your browser.
        </p>
        <input
          type="password"
          placeholder="sk-..."
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-full rounded-md border bg-background px-4 py-2 text-sm"
        />
        <button
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => {
            localStorage.setItem("ppq_api_key", val);
            onSet(val);
          }}
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}
