import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRIORITY_COLORS, STATUSES, STATUS_COLORS, STATUS_LABELS, type Status } from "@/lib/constants";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { Paperclip, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/complaints/$id")({
  component: ComplaintDetail,
});

type Complaint = {
  id: string; user_id: string; title: string; description: string; category: string;
  priority: keyof typeof PRIORITY_COLORS; status: Status; attachment_url: string | null;
  created_at: string; updated_at: string;
};
type Update = { id: string; author_id: string; message: string; status_change: Status | null; created_at: string };

function ComplaintDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [c, setC] = useState<Complaint | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [msg, setMsg] = useState("");
  const [newStatus, setNewStatus] = useState<Status | "none">("none");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("complaints" as never).select("*").eq("id", id).single();
    setC(data as Complaint | null);
    const { data: u } = await supabase.from("complaint_updates" as never).select("*").eq("complaint_id", id).order("created_at");
    setUpdates((u as Update[]) ?? []);
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!c?.attachment_url) return;
    supabase.storage.from("complaint-attachments").createSignedUrl(c.attachment_url, 3600).then(({ data }) => {
      setAttachmentUrl(data?.signedUrl ?? null);
    });
  }, [c?.attachment_url]);

  if (!c) return <AppShell><div className="py-10 text-center text-muted-foreground">Loading...</div></AppShell>;

  const isOwner = user?.id === c.user_id;
  const canEdit = isOwner && c.status === "pending";

  const postUpdate = async () => {
    if (!msg.trim() && newStatus === "none") return;
    const payload: Record<string, unknown> = { complaint_id: id, author_id: user!.id, message: msg.trim() || "(status updated)" };
    if (newStatus !== "none") payload.status_change = newStatus;
    const { error } = await supabase.from("complaint_updates" as never).insert(payload as never);
    if (error) return toast.error(error.message);
    if (newStatus !== "none" && isAdmin) {
      await supabase.from("complaints" as never).update({ status: newStatus } as never).eq("id", id);
    }
    setMsg(""); setNewStatus("none");
    toast.success("Update posted");
    load();
  };

  const remove = async () => {
    const { error } = await supabase.from("complaints" as never).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Complaint deleted");
    navigate({ to: "/dashboard" });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{c.title}</CardTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className={STATUS_COLORS[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                <Badge variant="outline" className={PRIORITY_COLORS[c.priority]}>{c.priority}</Badge>
                <Badge variant="secondary">{c.category}</Badge>
                <span className="text-xs text-muted-foreground self-center">Filed {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
              </div>
            </div>
            {canEdit && (
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Delete</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Delete complaint?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={remove}>Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{c.description}</p>
            {attachmentUrl && (
              <a href={attachmentUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                <Paperclip className="h-4 w-4" />View attachment
              </a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {updates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No updates yet.</p>
            ) : (
              <ul className="space-y-3">
                {updates.map((u) => (
                  <li key={u.id} className="rounded-lg border border-border bg-secondary/40 p-3">
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{u.author_id === c.user_id ? "User" : "Admin"}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</span>
                      {u.status_change && <Badge variant="outline" className={STATUS_COLORS[u.status_change]}>Set to {STATUS_LABELS[u.status_change]}</Badge>}
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{u.message}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-2 border-t border-border pt-4">
              <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Add a message..." maxLength={1000} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                {isAdmin && (
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as Status | "none")}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Change status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keep current status</SelectItem>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>Set to {STATUS_LABELS[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Button onClick={postUpdate} className="ml-auto">Post update</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
