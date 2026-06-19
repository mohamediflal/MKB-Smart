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
    <div>
      <PageHeader title="Profile" subtitle="Your personal information" />
      <Card>
        <div className="flex items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-primary/15 text-primary text-2xl font-bold">
            {user.initials}
          </div>
          <div>
            <div className="text-xl font-semibold text-slate-900 dark:text-white">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            <div className="mt-2 inline-flex rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
              Admin
            </div>
          </div>
        </div>
        {/* <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <Field label="Full name" defaultValue={user.name} />
          <Field label="Email" defaultValue={user.email} />

        </div> */}
        {/* <button
          onClick={() => alert("Profile updated successfully (Simulated)")}
          className="mt-6 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 cursor-pointer"
        >
          Save changes
        </button> */}
      </Card>
    </div>
  );
}

function Field({ label, defaultValue }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input defaultValue={defaultValue} className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}

