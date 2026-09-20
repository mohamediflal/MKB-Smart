// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, PageHeader, getSession } from "../index";

export default function AdminProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getSession());
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6 text-left max-w-4xl">
      <PageHeader title="Profile" subtitle="Manage and view your personal account details" />
      <Card className="p-8 shadow-sm border border-border/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-border/60">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary text-3xl font-bold ring-4 ring-primary/15 shadow-inner">
            {user.initials}
          </div>
          <div className="space-y-1.5">
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{user.name}</div>
            <div className="text-sm font-medium text-muted-foreground">{user.email}</div>
            <div className="pt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Admin
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                {user.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Account Details</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Full Name" defaultValue={user.name} />
            <Field label="Email Address" defaultValue={user.email} />
            <Field label="Role" defaultValue="Administrator" />
            <Field label="Account Status" defaultValue={user.status || 'Active'} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, defaultValue, readOnly = true }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        defaultValue={defaultValue}
        readOnly={readOnly}
        className={`w-full rounded-xl border border-border/80 bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-all ${
          readOnly ? "cursor-not-allowed opacity-90" : "focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background"
        }`}
      />
    </div>
  );
}


