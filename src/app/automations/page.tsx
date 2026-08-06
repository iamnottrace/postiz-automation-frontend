"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Zap, Play, Pause, Trash2, Loader2, Newspaper, Sparkles, Heart, Upload, Recycle } from "lucide-react";
import { templates, getTemplate, type TemplateParam } from "@/lib/n8n-templates";
import type { N8nWorkflow } from "@/types/n8n";

const iconMap: Record<string, any> = { Newspaper, Sparkles, Heart, Upload, Recycle };

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  async function loadWorkflows() {
    setLoading(true);
    try {
      const res = await fetch("/api/n8n/workflows");
      const data = await res.json();
      setWorkflows(data.data || []);
    } catch {
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }

  function openTemplate(templateId: string) {
    const template = getTemplate(templateId);
    if (!template) return;
    const defaults: Record<string, string> = {};
    template.params.forEach((p) => (defaults[p.key] = p.default));
    setParamValues(defaults);
    setSelectedTemplate(templateId);
    setDialogOpen(true);
  }

  async function createWorkflow() {
    if (!selectedTemplate) return;
    const template = getTemplate(selectedTemplate);
    if (!template) return;
    setCreating(true);
    try {
      const workflowInput = template.build(paramValues);
      const res = await fetch("/api/n8n/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflowInput),
      });
      if (res.ok) {
        await res.json();
        setDialogOpen(false);
        loadWorkflows();
      } else {
        alert("Failed to create workflow. Check n8n connection in Settings.");
      }
    } catch {
      alert("Failed to create workflow");
    } finally {
      setCreating(false);
    }
  }

  async function toggleWorkflow(id: string, active: boolean) {
    await fetch(`/api/n8n/workflows/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: active ? "deactivate" : "activate" }),
    });
    loadWorkflows();
  }

  async function deleteWorkflow(id: string) {
    if (!confirm("Delete this automation?")) return;
    await fetch(`/api/n8n/workflows/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadWorkflows();
  }

  async function triggerWorkflow(id: string) {
    await fetch("/api/n8n/executions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowId: id }),
    });
    alert("Workflow triggered! Check n8n for execution status.");
  }

  const template = selectedTemplate ? getTemplate(selectedTemplate) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Automations</h2>
        <p className="text-muted-foreground">Pre-built workflows powered by n8n</p>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Templates</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const Icon = iconMap[t.icon] || Zap;
            return (
              <Card key={t.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{t.name}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="mt-2">{t.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => openTemplate(t.id)}>
                    <Zap className="mr-2 h-4 w-4" /> Create Automation
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Active Automations</h3>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <p className="text-muted-foreground">No automations yet. Create one from a template above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${workflow.active ? "bg-green-500/10" : "bg-muted"}`}>
                      <Zap className={`h-5 w-5 ${workflow.active ? "text-green-500" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium">{workflow.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={workflow.active ? "default" : "secondary"}>
                          {workflow.active ? "Active" : "Inactive"}
                        </Badge>
                        {workflow.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => triggerWorkflow(workflow.id)}>
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleWorkflow(workflow.id, workflow.active)}
                    >
                      {workflow.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteWorkflow(workflow.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{template?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {template?.params.map((param: TemplateParam) => (
              <div key={param.key} className="space-y-2">
                <Label htmlFor={param.key}>{param.label}</Label>
                {param.type === "textarea" ? (
                  <Textarea
                    id={param.key}
                    value={paramValues[param.key] || ""}
                    onChange={(e) => setParamValues((prev) => ({ ...prev, [param.key]: e.target.value }))}
                    placeholder={param.placeholder}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={param.key}
                    type={param.type === "number" ? "number" : "text"}
                    value={paramValues[param.key] || ""}
                    onChange={(e) => setParamValues((prev) => ({ ...prev, [param.key]: e.target.value }))}
                    placeholder={param.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={createWorkflow} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Create & Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
