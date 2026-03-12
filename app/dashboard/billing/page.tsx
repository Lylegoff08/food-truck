import {
  disconnectStripeAction,
  saveStripeConnectAction,
  startStripeConnectAction
} from "@/app/dashboard/actions";
import { requireSession } from "@/lib/auth/server";
import { getBillingStatus, getWeeklyRevenueSummary, BILLING_THRESHOLD } from "@/lib/data/billing-service";
import { listPaymentTransactions } from "@/lib/data/payment-service";
import { toMoneyNumber } from "@/lib/db-utils";

export default async function BillingPage({
  searchParams
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    connectUrl?: string;
    accountId?: string;
  }>;
}) {
  const user = await requireSession();
  const query = await searchParams;
  const [billingStatusResult, revenueResult, paymentsResult] = await Promise.all([
    getBillingStatus(user),
    getWeeklyRevenueSummary(user),
    listPaymentTransactions(user)
  ]);

  const billingStatus = billingStatusResult.ok ? billingStatusResult.data : null;
  const revenue = revenueResult.ok ? revenueResult.data : null;
  const payments = paymentsResult.ok ? paymentsResult.data : [];

  return (
    <section className="stack">
      <h2>Billing / Payments</h2>
      {query.error ? <p className="error">{query.error}</p> : null}
      {query.success ? <p>Updated billing settings.</p> : null}
      {billingStatus ? (
        <div className="card">
          <p>Stripe connected: {billingStatus.stripeConnected ? "Yes" : "No"}</p>
          <p>Stripe account ID: {billingStatus.stripeAccountId || "-"}</p>
          <p>Connection status: {billingStatus.stripeConnectionStatus || "not_started"}</p>
          {query.connectUrl ? <p>Mock connect URL: {query.connectUrl}</p> : null}
          <form action={startStripeConnectAction}>
            <button type="submit">Start Stripe connect flow</button>
          </form>
          <form action={saveStripeConnectAction} className="stack card">
            <label>
              Stripe account ID
              <input
                type="text"
                name="stripeAccountId"
                defaultValue={query.accountId || billingStatus.stripeAccountId || ""}
                required
              />
            </label>
            <label>
              Connection status
              <input
                type="text"
                name="stripeConnectionStatus"
                defaultValue={billingStatus.stripeConnectionStatus || "connected"}
                required
              />
            </label>
            <button type="submit">Save linked account metadata</button>
          </form>
          <form action={disconnectStripeAction}>
            <button type="submit">Disconnect Stripe</button>
          </form>
        </div>
      ) : null}

      {revenue ? (
        <div className="card">
          <p>Current week gross sales: ${toMoneyNumber(revenue.currentWeek.grossSales).toFixed(2)}</p>
          <p>Threshold: ${BILLING_THRESHOLD.toFixed(2)}</p>
          <p>Threshold met: {revenue.currentWeek.thresholdMet ? "Yes" : "No"}</p>
          <p>
            Estimated platform fee: $
            {toMoneyNumber(revenue.currentWeek.platformFeeDue).toFixed(2)}
          </p>
        </div>
      ) : null}

      <table>
        <thead>
          <tr>
            <th>Week start</th>
            <th>Gross sales</th>
            <th>Threshold met</th>
            <th>Platform fee due</th>
          </tr>
        </thead>
        <tbody>
          {revenue?.history.map((summary) => (
            <tr key={summary.id}>
              <td>{summary.weekStart.toISOString()}</td>
              <td>${toMoneyNumber(summary.grossSales).toFixed(2)}</td>
              <td>{summary.thresholdMet ? "Yes" : "No"}</td>
              <td>${toMoneyNumber(summary.platformFeeDue).toFixed(2)}</td>
            </tr>
          )) || null}
        </tbody>
      </table>

      <table>
        <thead>
          <tr>
            <th>Created</th>
            <th>Provider</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.createdAt.toISOString()}</td>
              <td>{payment.provider}</td>
              <td>${toMoneyNumber(payment.amount).toFixed(2)}</td>
              <td>{payment.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
