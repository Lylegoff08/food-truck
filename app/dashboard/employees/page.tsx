import Link from "next/link";
import { saveEmployeeAction } from "@/app/dashboard/actions";
import { requireSession } from "@/lib/auth/server";
import { listEmployees } from "@/lib/data/employees-service";
import { listTrucks } from "@/lib/data/trucks-service";

export default async function EmployeesPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireSession();
  const params = await searchParams;
  const [employees, trucks] = await Promise.all([listEmployees(user), listTrucks(user)]);

  return (
    <section className="stack">
      <h2>Employees</h2>
      {params.error ? <p className="error">{params.error}</p> : null}
      <form action={saveEmployeeAction} className="card stack">
        <h3>Create employee</h3>
        <label>
          Name
          <input type="text" name="name" required />
        </label>
        <label>
          Title
          <input type="text" name="title" />
        </label>
        <label>
          Assigned truck
          <select name="assignedTruckId" defaultValue="">
            <option value="">None</option>
            {trucks.map((truck) => (
              <option key={truck.id} value={truck.id}>
                {truck.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" name="active" defaultChecked /> Active
        </label>
        <button type="submit">Save employee</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>Active</th>
            <th>Assigned truck</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>
                <form action={saveEmployeeAction} className="row">
                  <input type="hidden" name="id" value={employee.id} />
                  <input type="text" name="name" defaultValue={employee.name} required />
                  <button type="submit">Save</button>
                </form>
                <Link href={`/dashboard/employees/${employee.id}`}>Pay rates</Link>
              </td>
              <td>{employee.title || "-"}</td>
              <td>
                <form action={saveEmployeeAction}>
                  <input type="hidden" name="id" value={employee.id} />
                  <input type="hidden" name="name" value={employee.name} />
                  <input type="hidden" name="title" value={employee.title || ""} />
                  <label>
                    <input type="checkbox" name="active" defaultChecked={employee.active} /> Active
                  </label>
                  <button type="submit">Update</button>
                </form>
              </td>
              <td>{employee.assignedTruck?.name || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
