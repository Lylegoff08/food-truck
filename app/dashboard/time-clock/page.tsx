import { clockInAction, clockOutAction } from "@/app/dashboard/actions";
import { requireSession } from "@/lib/auth/server";
import { listEmployees } from "@/lib/data/employees-service";
import { listTimeEntries } from "@/lib/data/time-service";
import { listTrucks } from "@/lib/data/trucks-service";

export default async function TimeClockPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await requireSession();
  const query = await searchParams;
  const [employees, trucks, timeEntries] = await Promise.all([
    listEmployees(user),
    listTrucks(user),
    listTimeEntries(user)
  ]);

  return (
    <section className="stack">
      <h2>Time Clock</h2>
      {query.error ? <p className="error">{query.error}</p> : null}
      {query.success ? <p>Saved.</p> : null}
      <div className="row">
        <form action={clockInAction} className="card stack" style={{ flex: 1 }}>
          <h3>Clock in</h3>
          <label>
            Employee
            <select name="employeeId" required>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Truck
            <select name="truckId" required>
              {trucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {truck.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Clock in</button>
        </form>

        <form action={clockOutAction} className="card stack" style={{ flex: 1 }}>
          <h3>Clock out</h3>
          <label>
            Employee
            <select name="employeeId" required>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Clock out</button>
        </form>
      </div>

      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Truck</th>
            <th>Clock in</th>
            <th>Clock out</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {timeEntries.slice(0, 10).map((entry) => (
            <tr key={entry.id}>
              <td>{entry.employee.name}</td>
              <td>{entry.truck.name}</td>
              <td>{entry.clockIn.toISOString()}</td>
              <td>{entry.clockOut ? entry.clockOut.toISOString() : "-"}</td>
              <td>{entry.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
