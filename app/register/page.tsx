import Link from "next/link";
import { registerAction } from "@/app/(auth)/actions";

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main>
      <h1>Register Company</h1>
      {params.error ? <p className="error">{params.error}</p> : null}
      <form action={registerAction} className="card stack">
        <label>
          Company name
          <input type="text" name="companyName" required />
        </label>
        <label>
          Company slug
          <input type="text" name="companySlug" required />
        </label>
        <label>
          Owner name
          <input type="text" name="ownerName" required />
        </label>
        <label>
          Email
          <input type="email" name="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" required minLength={8} />
        </label>
        <button type="submit">Create company</button>
      </form>
      <p>
        Already registered? <Link href="/login">Login</Link>
      </p>
    </main>
  );
}
