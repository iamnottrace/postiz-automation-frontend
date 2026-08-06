"use client";

import { useState, useEffect } from "react";
import { AudioStudio } from "studio";
import { Toaster } from "react-hot-toast";

export default function AudioStudioPage() {
  const [apiKey, setApiKey] = useState("");
  useEffect(() => {
    setApiKey(localStorage.getItem("ppq_api_key") || "");
  }, []);
  if (!apiKey) return <div className="p-8 text-center text-muted-foreground">Please set your API key in the AI Video Gen page first.</div>;
  return (
    <div className="h-full">
      <Toaster position="top-right" />
      <AudioStudio apiKey={apiKey} />
    </div>
  );
}
