export type N8nWorkflow = {
  id: string;
  name: string;
  active: boolean;
  nodes: N8nNode[];
  connections: Record<string, unknown>;
  settings: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type N8nNode = {
  type: string;
  name: string;
  parameters: Record<string, unknown>;
  typeVersion: number;
  position: [number, number];
  id?: string;
  credentials?: Record<string, { id: string; name: string }>;
};

export type N8nWorkflowListResponse = {
  data: N8nWorkflow[];
};

export type N8nExecution = {
  id: string;
  finished: boolean;
  mode: string;
  retrySuccess: boolean;
  startedAt: string;
  stoppedAt: string | null;
  workflowId: string;
  workflowData: {
    name: string;
  };
  status: "success" | "failed" | "running" | "waiting" | "unknown";
};

export type N8nExecutionListResponse = {
  data: N8nExecution[];
  nextCursor: string | null;
};

export type N8nCreateWorkflowInput = {
  name: string;
  nodes: N8nNode[];
  connections: Record<string, unknown>;
  settings?: Record<string, unknown>;
  tags?: string[];
};

export type N8nCredential = {
  id: string;
  name: string;
  type: string;
};
