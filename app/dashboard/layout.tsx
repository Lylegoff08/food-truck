import { DashboardNav } from "@/components/dashboard-nav";
import { requireSession } from "@/lib/auth/server";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();

  return (
    <main>
      <header>
        <h1>Food Truck POS</h1>
        <p>
          Signed in as {user.name} ({user.role})
        </p>
      </header>
      <DashboardNav role={user.role} />
      {children}
    </main>
  );
}
