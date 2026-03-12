import { saveTruckAction } from "@/app/dashboard/actions";
import { requireSession } from "@/lib/auth/server";
import { listTrucks } from "@/lib/data/trucks-service";

export default async function TrucksPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireSession();
  const params = await searchParams;
  const trucks = await listTrucks(user);

  return (
    <section className="stack">
      <h2>Trucks</h2>
      {params.error ? <p className="error">{params.error}</p> : null}
      <form action={saveTruckAction} className="card stack">
        <h3>Create truck</h3>
        <label>
          Name
          <input type="text" name="name" required />
        </label>
        <label>
          <input type="checkbox" name="active" defaultChecked /> Active
        </label>
        <button type="submit">Save truck</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {trucks.map((truck) => (
            <tr key={truck.id}>
              <td>
                <form action={saveTruckAction} className="row">
                  <input type="hidden" name="id" value={truck.id} />
                  <input type="text" name="name" defaultValue={truck.name} required />
                  <button type="submit">Update</button>
                </form>
              </td>
              <td>
                <form action={saveTruckAction}>
                  <input type="hidden" name="id" value={truck.id} />
                  <input type="hidden" name="name" value={truck.name} />
                  <label>
                    <input type="checkbox" name="active" defaultChecked={truck.active} /> Active
                  </label>
                  <button type="submit">Save</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
