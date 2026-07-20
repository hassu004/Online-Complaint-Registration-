import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Zap, BarChart3, FileCheck2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <AppShell>
      <section className="py-16 text-center sm:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Secure complaint management platform
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
          Register complaints. <span className="text-primary">Get them resolved.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          A modern, end-to-end complaint registration and tracking system. File a complaint in seconds,
          receive status updates in real time, and communicate directly with administrators.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" asChild><Link to="/auth">Get started</Link></Button>
          <Button size="lg" variant="outline" asChild><Link to="/dashboard">My complaints</Link></Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: FileCheck2, title: "Easy filing", desc: "Submit with categories, priority and attachments." },
          { icon: Zap, title: "Live tracking", desc: "Follow status from Pending to Resolved." },
          { icon: ShieldCheck, title: "Secure by default", desc: "JWT auth, RLS-backed data isolation." },
          { icon: BarChart3, title: "Admin analytics", desc: "Dashboards for teams to prioritize work." },
        ].map((f) => (
          <Card key={f.title} className="border-border">
            <CardContent className="p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
