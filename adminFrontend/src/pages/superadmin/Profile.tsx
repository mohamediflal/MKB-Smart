// @ts-nocheck
import { useState } from "react";
import { Card, PageHeader } from "../index";

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${on ? "bg-primary" : "bg-muted-foreground/30"
        }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${on ? "translate-x-5" : "translate-x-0"
          }`}
      />
    </button>
  );
}

function Field({ label, defaultValue, readOnly = false }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        defaultValue={defaultValue}
        readOnly={readOnly}
        className={`w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-all ${readOnly
          ? "opacity-85 cursor-not-allowed bg-muted/40"
          : "focus:border-primary focus:ring-2 focus:ring-primary/20"
          }`}
      />
    </div>
  );
}

function Row({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3.5 last:border-0 last:pb-0 first:pt-0">
      <div className="space-y-0.5">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}

export default function Profile() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [marketing, setMarketing] = useState(false);

  return (
    <div className="space-y-6 text-left max-w-6xl">
      <PageHeader title="Settings" subtitle="Configure store preferences, business details, and notifications" />
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Store Details & Public Info */}
        <div className="space-y-6">
          <Card className="p-6 border border-border/80 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Store Information</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Basic details about your store and locale</p>
              </div>
              <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Global</span>
            </div>
            <div className="mt-5 space-y-4">
              <Field label="Store Name" defaultValue="MKB-Smart" readOnly />
              <Field label="Address" defaultValue="Badulla, 90000, Sri Lanka" readOnly />
              <Field label="Currency" defaultValue="LKR (Rs.)" readOnly />
            </div>
            <button
              type="button"
              onClick={() => alert("Settings saved successfully (Simulated)")}
              className="mt-6 w-full sm:w-auto rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.98] cursor-pointer transition-all duration-200"
            >
              Save changes
            </button>
          </Card>

          <Card className="p-6 border border-border/80 shadow-sm transition-all hover:shadow-md">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Public Info & Analytics</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Supermarket operating hours and ratings</p>
            <div className="mt-5 space-y-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Opening Hours</label>
                <div className="mt-2 space-y-2.5 text-sm bg-muted/40 p-4 rounded-xl border border-border/60">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">Monday – Thursday</span>
                    <span className="font-semibold text-foreground bg-background px-2.5 py-1 rounded-md border border-border/40 text-xs">8 AM – 10 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">Friday</span>
                    <span className="font-semibold text-foreground bg-background px-2.5 py-1 rounded-md border border-border/40 text-xs">8 AM – 12 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">Saturday – Sunday</span>
                    <span className="font-semibold text-foreground bg-background px-2.5 py-1 rounded-md border border-border/40 text-xs">8 AM – 10 PM</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Supermarket Rating" defaultValue="⭐ 4.8 / 5" readOnly />
                <Field label="Reviews Count" defaultValue="579 reviews" readOnly />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Notifications */}
        <Card className="p-6 border border-border/80 shadow-sm transition-all hover:shadow-md">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Notifications</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Choose what updates you want to receive</p>
          <div className="mt-5 space-y-1">
            <Row label="Email notifications" desc="Receive daily store updates and summaries via email">
              <Toggle on={emailNotif} onChange={setEmailNotif} />
            </Row>
            <Row label="New order alerts" desc="Get real-time push alert each time an order is placed">
              <Toggle on={orderAlerts} onChange={setOrderAlerts} />
            </Row>
            <Row label="Marketing emails" desc="Tips, new feature releases and promotional announcements">
              <Toggle on={marketing} onChange={setMarketing} />
            </Row>
          </div>
        </Card>
      </div>
    </div>
  );
}


