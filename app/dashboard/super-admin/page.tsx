import { toggleCompanySuspensionAction } from "@/app/dashboard/actions";
import { requireSuperAdminSession } from "@/lib/auth/server";
import { getPlatformSummary } from "@/lib/data/platform-service";
import { toMoneyNumber } from "@/lib/db-utils";

export default async function SuperAdminPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await requireSuperAdminSession();
  const query = await searchParams;
  const summaryResult = await getPlatformSummary(user);
  const summary = summaryResult.ok ? summaryResult.data : null;

  return (
    <section className="stack">
      <h2>Super Admin</h2>
      {query.error ? <p className="error">{query.error}</p> : null}
      {query.success ? <p>Updated company state.</p> : null}
      {summary ? (
        <div className="card">
          <p>Company count: {summary.companyCount}</p>
        </div>
      ) : null}
      {summary?.companies.map((company, index) => (
        <div key={company.id} className="card">
          <p>{company.name}</p>
          <p>Stripe connected: {company.stripeConnected ? "Yes" : "No"}</p>
          <p>Stripe status: {company.stripeConnectionStatus || "-"}</p>
          <p>Suspended: {company.suspended ? "Yes" : "No"}</p>
          <p>Trucks: {company._count.trucks}</p>
          <p>Employees: {company._count.employees}</p>
          <p>Orders: {company._count.orders}</p>
          <p>
            Latest weekly gross: $
            {summary.weeklySummaries[index]
              ? toMoneyNumber(summary.weeklySummaries[index].grossSales).toFixed(2)
              : "0.00"}
          </p>
          <form action={toggleCompanySuspensionAction}>
            <input type="hidden" name="companyId" value={company.id} />
            <input
              type="hidden"
              name="suspended"
              value={company.suspended ? "false" : "true"}
            />
            <button type="submit">
              {company.suspended ? "Unsuspend company" : "Suspend company"}
            </button>
          </form>
        </div>
      ))}
    </section>
  );
}
