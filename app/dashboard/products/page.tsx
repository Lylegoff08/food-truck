import { saveProductAction } from "@/app/dashboard/actions";
import { requireSession } from "@/lib/auth/server";
import { listProducts } from "@/lib/data/products-service";
import { listTrucks } from "@/lib/data/trucks-service";
import { toMoneyNumber } from "@/lib/db-utils";

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireSession();
  const params = await searchParams;
  const [products, trucks] = await Promise.all([listProducts(user), listTrucks(user)]);

  return (
    <section className="stack">
      <h2>Products</h2>
      {params.error ? <p className="error">{params.error}</p> : null}
      <form action={saveProductAction} className="card stack">
        <h3>Create product</h3>
        <label>
          Name
          <input type="text" name="name" required />
        </label>
        <label>
          Category
          <input type="text" name="category" required />
        </label>
        <label>
          Price
          <input type="number" name="price" step="0.01" min="0" required />
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
        <label>
          <input type="checkbox" name="archived" /> Archived
        </label>
        <button type="submit">Save product</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Active</th>
            <th>Archived</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <form action={saveProductAction} className="row">
                  <input type="hidden" name="id" value={product.id} />
                  <input type="text" name="name" defaultValue={product.name} required />
                  <button type="submit">Save</button>
                </form>
              </td>
              <td>{product.category}</td>
              <td>${toMoneyNumber(product.price).toFixed(2)}</td>
              <td>
                <form action={saveProductAction}>
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="name" value={product.name} />
                  <input type="hidden" name="category" value={product.category} />
                  <input type="hidden" name="price" value={toMoneyNumber(product.price)} />
                  <label>
                    <input type="checkbox" name="active" defaultChecked={product.active} /> Active
                  </label>
                  <label>
                    <input type="checkbox" name="archived" defaultChecked={product.archived} /> Archived
                  </label>
                  <button type="submit">Update flags</button>
                </form>
              </td>
              <td>{product.archived ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
