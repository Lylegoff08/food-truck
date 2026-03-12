"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PosProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
};

type Truck = {
  id: string;
  name: string;
};

type Employee = {
  id: string;
  name: string;
};

export function PosClient({
  products,
  trucks,
  employees,
  error,
  success
}: {
  products: PosProduct[];
  trucks: Truck[];
  employees: Employee[];
  error?: string;
  success?: string;
}) {
  const router = useRouter();
  const [cart, setCart] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [truckId, setTruckId] = useState(trucks[0]?.id ?? "");
  const [employeeId, setEmployeeId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const cartDetails = useMemo(() => {
    return cart
      .map((entry) => {
        const product = products.find((item) => item.id === entry.productId);
        if (!product) {
          return null;
        }

        return {
          ...entry,
          name: product.name,
          price: product.price,
          total: Number((product.price * entry.quantity).toFixed(2))
        };
      })
      .filter(Boolean) as Array<{
      productId: string;
      quantity: number;
      name: string;
      price: number;
      total: number;
    }>;
  }, [cart, products]);

  const subtotal = useMemo(
    () => Number(cartDetails.reduce((sum, item) => sum + item.total, 0).toFixed(2)),
    [cartDetails]
  );

  function addItem(productId: string) {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { productId, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.productId !== productId));
      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  }

  async function handleCheckout() {
    setSubmitError("");
    setIsSaving(true);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        truckId,
        employeeId: employeeId || null,
        paymentMethod,
        items: cart,
        paymentPayload:
          paymentMethod === "card"
            ? { paymentToken: "mock_card_token" }
            : undefined
      })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setSubmitError(payload.error || "Order failed");
      setIsSaving(false);
      return;
    }

    setCart([]);
    setIsSaving(false);
    router.push("/dashboard/pos?success=1");
    router.refresh();
  }

  return (
    <section className="stack">
      <h2>POS</h2>
      {error ? <p className="error">{error}</p> : null}
      {submitError ? <p className="error">{submitError}</p> : null}
      {success ? <p>Order saved.</p> : null}

      <div className="row">
        <div className="card" style={{ flex: 1 }}>
          <h3>Products</h3>
          <ul>
            {products.map((product) => (
              <li key={product.id}>
                {product.name} ({product.category}) - ${product.price.toFixed(2)}{" "}
                <button type="button" onClick={() => addItem(product.id)}>
                  Add
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <h3>Cart</h3>
          {cartDetails.length === 0 ? <p>No items yet.</p> : null}
          <ul>
            {cartDetails.map((item) => (
              <li key={item.productId}>
                {item.name} - ${item.price.toFixed(2)} x{" "}
                <input
                  type="number"
                  min="0"
                  value={item.quantity}
                  onChange={(event) =>
                    changeQuantity(item.productId, Number(event.target.value))
                  }
                />{" "}
                = ${item.total.toFixed(2)}
                <button type="button" onClick={() => changeQuantity(item.productId, 0)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <p>Subtotal: ${subtotal.toFixed(2)}</p>

          <label>
            Truck
            <select
              name="truckId"
              value={truckId}
              onChange={(event) => setTruckId(event.target.value)}
              required
            >
              {trucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {truck.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Employee
            <select
              name="employeeId"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
            >
              <option value="">None</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Payment method
            <select
              name="paymentMethod"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </label>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={!cartDetails.length || !truckId || isSaving}
          >
            {isSaving ? "Saving..." : "Checkout"}
          </button>
        </div>
      </div>
    </section>
  );
}
