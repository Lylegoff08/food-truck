import Link from "next/link";
import { loginAction } from "@/app/(auth)/actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main>
      <h1>Login</h1>
      {params.error ? <p className="error">{params.error}</p> : null}
      <form action={loginAction} className="card stack">
        <label>
          Email
          <input type="email" name="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" required />
        </label>
        <button type="submit">Login</button>
      </form>
      <p>
        Need a company account? <Link href="/register">Register</Link>
      </p>
    </main>
  );
}
