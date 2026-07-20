import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, PRIORITY_COLORS, STATUSES, STATUS_COLORS, STATUS_LABELS, type Status } from "@/lib/constants";
import { PlusCircle, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Complaint = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: keyof typeof PRIORITY_COLORS;
  status: Status;
  created_at: string;
};

const PAGE_SIZE = 6;

function Dashboard() {
  const [items, setItems] = useState<Complaint[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    supabase
      .from("complaints" as never)
      .select("id,title,description,category,priority,status,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Complaint[] | null) ?? []));
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (category !== "all" && c.category !== category) return false;
      if (q && !(c.title.toLowerCase().includes(q.toLowerCase()) || c.description.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [items, q, status, category]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const stats = useMemo(() => {
    const s: Record<Status, number> = { pending: 0, assigned: 0, in_progress: 0, resolved: 0, closed: 0 };
    (items ?? []).forEach((c) => (s[c.status] = (s[c.status] ?? 0) + 1));
    return s;
  }, [items]);

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My complaints</h1>
          <p className="text-sm text-muted-foreground">Track and manage your submitted complaints.</p>
        </div>
        <Button asChild><Link to="/complaints/new"><PlusCircle className="mr-2 h-4 w-4" /> New complaint</Link></Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        {STATUSES.map((s) => (
          <Card key={s}>
            <CardContent className="p-4">
              <div className="text-xs uppercase text-muted-foreground">{STATUS_LABELS[s]}</div>
              <div className="mt-1 text-2xl font-bold">{items ? stats[s] : "—"}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Complaints</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search..." className="pl-8 w-48" />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {items === null ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : pageItems.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No complaints found.</div>
          ) : (
            <ul className="divide-y divide-border">
              {pageItems.map((c) => (
                <li key={c.id}>
                  <Link to="/complaints/$id" params={{ id: c.id }} className="flex flex-col gap-2 py-4 hover:bg-accent/40 -mx-2 px-2 rounded-md">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{c.title}</span>
                      <Badge variant="outline" className={STATUS_COLORS[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                      <Badge variant="outline" className={PRIORITY_COLORS[c.priority]}>{c.priority}</Badge>
                      <Badge variant="secondary">{c.category}</Badge>
                      <span className="ml-auto text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{c.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Page {page} of {pageCount}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
