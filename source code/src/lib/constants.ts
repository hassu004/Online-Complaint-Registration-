export const CATEGORIES = [
  "Water Supply",
  "Electricity",
  "Roads & Transport",
  "Sanitation",
  "Public Safety",
  "Healthcare",
  "Education",
  "Housing",
  "Corruption",
  "Other",
] as const;

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const STATUSES = [
  "pending",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
] as const;

export type Priority = (typeof PRIORITIES)[number];
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const STATUS_COLORS: Record<Status, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  assigned: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  in_progress: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  medium: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  urgent: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};
