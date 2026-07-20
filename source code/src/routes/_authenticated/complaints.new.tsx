import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, PRIORITIES } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/complaints/new")({
  component: NewComplaint,
});

const schema = z.object({
  title: z.string().trim().min(3, "Title min 3 chars").max(140),
  description: z.string().trim().min(10, "Describe with at least 10 chars").max(4000),
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
});

function NewComplaint() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>("Water Supply");
  const [priority, setPriority] = useState<string>("medium");
  const [file, setFile] = useState<File | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      title: fd.get("title"),
      description: fd.get("description"),
      category,
      priority,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user!;
    let attachment_url: string | null = null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setLoading(false); return toast.error("File must be under 5MB"); }
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("complaint-attachments").upload(path, file);
      if (upErr) { setLoading(false); return toast.error(upErr.message); }
      attachment_url = path;
    }
    const { data, error } = await supabase.from("complaints" as never).insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      priority: parsed.data.priority,
      attachment_url,
    } as never).select("id").single();
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Complaint submitted");
    navigate({ to: "/complaints/$id", params: { id: (data as { id: string }).id } });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader><CardTitle>New complaint</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required maxLength={140} placeholder="Brief summary" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" required rows={6} maxLength={4000} placeholder="Explain the issue in detail" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="file">Attachment (optional, max 5MB)</Label>
                <Input id="file" type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit complaint"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
