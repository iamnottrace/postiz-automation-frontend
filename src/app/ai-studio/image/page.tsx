"use client";

import { useState, useEffect } from "react";
import { ImageStudio } from "studio";
import { Toaster } from "react-hot-toast";

export default function AiImageStudioPage() {
  const [apiKey, setApiKey] = useState("");
  useEffect(() => {
    setApiKey(localStorage.getItem("ppq_api_key") || "");
  }, []);
  if (!apiKey) return <div className="p-8 text-center text-muted-foreground">Please set your API key in the AI Video Gen page first.</div>;
  return (
    <div className="h-full">
      <Toaster position="top-right" />
      <ImageStudio
        apiKey={apiKey}
        onGenerationStart={undefined}
        onGenerationEnd={undefined}
        onGenerationComplete={undefined}
        onGenerationError={undefined}
        historyItems={undefined}
        droppedFiles={undefined}
        onFilesHandled={undefined}
      />
    </div>
  );
}
