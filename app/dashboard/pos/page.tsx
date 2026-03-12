import { PosClient } from "@/components/pos-client";
import { requireSession } from "@/lib/auth/server";
import { listEmployees } from "@/lib/data/employees-service";
import { listPosProducts } from "@/lib/data/products-service";
import { listTrucks } from "@/lib/data/trucks-service";
import { toMoneyNumber } from "@/lib/db-utils";

export default async function PosPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await requireSession();
  const params = await searchParams;
  const [products, trucks, employees] = await Promise.all([
    listPosProducts(user),
    listTrucks(user),
    listEmployees(user)
  ]);

  return (
    <PosClient
      products={products.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: toMoneyNumber(product.price)
      }))}
      trucks={trucks.map((truck) => ({ id: truck.id, name: truck.name }))}
      employees={employees.map((employee) => ({ id: employee.id, name: employee.name }))}
      error={params.error}
      success={params.success}
    />
  );
}
