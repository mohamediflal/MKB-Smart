// @ts-nocheck
import { useState } from "react";
import { Card, PageHeader } from "../index";

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition cursor-pointer ${on ? "bg-primary" : "bg-muted"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

function Field({ label, defaultValue, readOnly = false }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input 
        defaultValue={defaultValue} 
        readOnly={readOnly}
        className={`mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ${readOnly ? "opacity-75 cursor-not-allowed bg-slate-50 dark:bg-slate-900/30" : "focus:ring-2 focus:ring-ring"}`} 
      />
    </div>
  );
}

function Row({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
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
    <div>
      <PageHeader title="Settings" subtitle="Configure store and notification preferences" />
      <div className="grid lg:grid-cols-2 gap-6 text-left">
        {/* Left Column: Store Details & Public Info */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Store Information</h3>
            <p className="text-xs text-muted-foreground">Basic details about your store and location</p>
            <div className="mt-5 space-y-4">
              <Field label="Store Name" defaultValue="MKB Supermarket" />
              <Field label="Support Email" defaultValue="support@mkbsmart.com" />
              <Field label="Address" defaultValue="38 Race Course Rd, Badulla, 90000, Sri Lanka" />
              <Field label="Currency" defaultValue="LKR (Rs.)" readOnly />
            </div>
            <button
              onClick={() => alert("Settings saved successfully (Simulated)")}
              className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 cursor-pointer"
            >
              Save changes
            </button>
          </Card>

          <Card>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Public Info & Analytics</h3>
            <p className="text-xs text-muted-foreground">Supermarket business hours and ratings</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">Opening Hours</label>
                <div className="mt-2 space-y-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Monday – Thursday:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">8 AM – 10 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Friday:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">8 AM – 12 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Saturday – Sunday:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">8 AM – 10 PM</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Supermarket Rating (Stars)" defaultValue="4.8" readOnly />
                <Field label="Reviews Count" defaultValue="579 reviews" readOnly />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Notifications */}
        <Card className="h-fit">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Notifications</h3>
          <p className="text-xs text-muted-foreground">Choose what you want to be notified about</p>
          <div className="mt-5 space-y-4">
            <Row label="Email notifications" desc="Receive updates and summaries via email">
              <Toggle on={emailNotif} onChange={setEmailNotif} />
            </Row>
            <Row label="New order alerts" desc="Get notified each time an order is placed">
              <Toggle on={orderAlerts} onChange={setOrderAlerts} />
            </Row>
            <Row label="Marketing emails" desc="Tips, product news and announcements">
              <Toggle on={marketing} onChange={setMarketing} />
            </Row>
          </div>
        </Card>
      </div>
    </div>
  );
}

