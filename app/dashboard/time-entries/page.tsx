import { editTimeEntryAction } from "@/app/dashboard/actions";
import { requireSession } from "@/lib/auth/server";
import { listTimeEntries } from "@/lib/data/time-service";
import { listTrucks } from "@/lib/data/trucks-service";

export default async function TimeEntriesPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await requireSession();
  const query = await searchParams;
  const [entries, trucks] = await Promise.all([listTimeEntries(user), listTrucks(user)]);

  return (
    <section className="stack">
      <h2>Time Entry Management</h2>
      {query.error ? <p className="error">{query.error}</p> : null}
      {query.success ? <p>Time entry updated.</p> : null}
      {entries.map((entry) => (
        <form key={entry.id} action={editTimeEntryAction} className="card stack">
          <input type="hidden" name="id" value={entry.id} />
          <p>
            {entry.employee.name} on {entry.truck.name}
          </p>
          <label>
            Truck
            <select name="truckId" defaultValue={entry.truckId}>
              {trucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {truck.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Clock in
            <input
              type="datetime-local"
              name="clockIn"
              defaultValue={entry.clockIn.toISOString().slice(0, 16)}
              required
            />
          </label>
          <label>
            Clock out
            <input
              type="datetime-local"
              name="clockOut"
              defaultValue={entry.clockOut ? entry.clockOut.toISOString().slice(0, 16) : ""}
            />
          </label>
          <label>
            Edit reason
            <input type="text" name="reason" required />
          </label>
          <button type="submit">Save edit</button>
        </form>
      ))}
    </section>
  );
}
