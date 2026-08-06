declare module "studio" {
  import React from "react";

  interface StudioProps {
    apiKey: string;
    onGenerationStart?: (data: any) => void;
    onGenerationEnd?: (data: any) => void;
    onGenerationComplete?: (data: any) => void;
    onGenerationError?: (err: any) => void;
    historyItems?: any[];
    droppedFiles?: File[];
    onFilesHandled?: () => void;
  }

  export const VideoStudio: React.FC<StudioProps>;
  export const ImageStudio: React.FC<StudioProps>;
  export const CinemaStudio: React.FC<StudioProps>;
  export const AudioStudio: React.FC<StudioProps>;
  export const LipSyncStudio: React.FC<StudioProps>;
  export const ClippingStudio: React.FC<StudioProps>;
  export const VibeMotionStudio: React.FC<StudioProps>;
  export const RecastStudio: React.FC<StudioProps>;
  export const MarketingStudio: React.FC<StudioProps>;
  export const WorkflowStudio: React.FC<StudioProps>;
  export const AgentStudio: React.FC<StudioProps>;
  export const DesignAgentStudio: React.FC<StudioProps>;
  export const AppsStudio: React.FC<StudioProps>;
  export const McpCliStudio: React.FC<StudioProps>;
  export const AiInfluencerStudio: React.FC<StudioProps>;

  export function generateImage(apiKey: string, params: any): Promise<any>;
  export function generateI2I(apiKey: string, params: any): Promise<any>;
  export function generateVideo(apiKey: string, params: any): Promise<any>;
  export function generateI2V(apiKey: string, params: any): Promise<any>;
  export function processV2V(apiKey: string, params: any): Promise<any>;
  export function processRecast(apiKey: string, params: any): Promise<any>;
  export function processLipSync(apiKey: string, params: any): Promise<any>;
  export function processAudio(apiKey: string, params: any): Promise<any>;
  export function uploadFile(apiKey: string, file: File): Promise<string>;
  export function runClipping(apiKey: string, params: any): Promise<any>;
  export function runMotionGraphics(apiKey: string, params: any): Promise<any>;
  export function runMotionGraphicsEdit(apiKey: string, params: any): Promise<any>;
  export function getHistory(apiKey: string, opts?: any): Promise<any>;
}
