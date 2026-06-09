// @ts-nocheck
import { Card, PageHeader, users } from "../index";

export default function ManageUsers() {
  return (
    <div>
      <PageHeader title="Users" subtitle="All registered customers" />
      <Card className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[15px] text-[#64748b] border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Customer</th>
                <th className="px-6 py-3 text-left font-medium">Email</th>
                <th className="px-6 py-3 text-left font-medium">Orders</th>
                <th className="px-6 py-3 text-left font-medium">Spent</th>
                <th className="px-6 py-3 text-left font-medium">Joined</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-3 flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
                      {u.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                    </div>
                    <span className="font-medium">{u.name}</span>
                  </td>
                  <td className="px-6 py-3 text-black">{u.email}</td>
                  <td className="px-6 py-3">{u.orders}</td>
                  <td className="px-6 py-3">Rs. {u.spent.toFixed(2)}</td>
                  <td className="px-6 py-3 text-black">{u.joined}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${u.status === "Active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

