import { requireSession } from "@/lib/auth/server";
import { listConfigVersions } from "@/lib/data/config-service";
import { listEmployees } from "@/lib/data/employees-service";
import { listProducts } from "@/lib/data/products-service";
import { listTimeEntries } from "@/lib/data/time-service";
import { listTrucks } from "@/lib/data/trucks-service";

export default async function DashboardPage() {
  const user = await requireSession();
  const [trucks, products, employees, timeEntries, configVersionsResult] = await Promise.all([
    listTrucks(user),
    listProducts(user),
    listEmployees(user),
    listTimeEntries(user),
    listConfigVersions(user)
  ]);
  const configVersions = configVersionsResult.ok ? configVersionsResult.data : [];

  return (
    <section className="stack">
      <div className="card">
        <h2>Overview</h2>
        <p>Tenant ID: {user.companyId}</p>
        <p>Trucks: {trucks.length}</p>
        <p>Products: {products.length}</p>
        <p>Employees: {employees.length}</p>
        <p>Open time entries: {timeEntries.filter((entry) => !entry.clockOut).length}</p>
        <p>Config versions: {configVersions.length}</p>
      </div>
    </section>
  );
}
