import { addPayRateAction } from "@/app/dashboard/actions";
import { requireSession } from "@/lib/auth/server";
import { getEmployee } from "@/lib/data/employees-service";
import { getCurrentPayRate, listPayRateHistory } from "@/lib/data/pay-rates-service";
import { toMoneyNumber } from "@/lib/db-utils";

export default async function EmployeeDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await requireSession();
  const { employeeId } = await params;
  const query = await searchParams;
  const [employee, currentRate, history] = await Promise.all([
    getEmployee(user, employeeId),
    getCurrentPayRate(user, employeeId),
    listPayRateHistory(user, employeeId)
  ]);

  if (!employee) {
    return (
      <section>
        <h2>Employee not found</h2>
      </section>
    );
  }

  return (
    <section className="stack">
      <h2>{employee.name}</h2>
      {query.error ? <p className="error">{query.error}</p> : null}
      {query.success ? <p>Pay rate added.</p> : null}
      <div className="card">
        <p>Title: {employee.title || "-"}</p>
        <p>Assigned truck: {employee.assignedTruck?.name || "-"}</p>
        <p>
          Current pay rate:{" "}
          {currentRate ? `$${toMoneyNumber(currentRate.hourlyRate).toFixed(2)}` : "Not set"}
        </p>
      </div>
      <form action={addPayRateAction} className="card stack">
        <h3>Add pay rate</h3>
        <input type="hidden" name="employeeId" value={employee.id} />
        <label>
          Hourly rate
          <input type="number" name="hourlyRate" min="0" step="0.01" required />
        </label>
        <label>
          Effective date
          <input type="datetime-local" name="effectiveDate" required />
        </label>
        <button type="submit">Add pay rate</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Effective</th>
            <th>Hourly rate</th>
          </tr>
        </thead>
        <tbody>
          {history.map((rate) => (
            <tr key={rate.id}>
              <td>{rate.effectiveDate.toISOString()}</td>
              <td>${toMoneyNumber(rate.hourlyRate).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
