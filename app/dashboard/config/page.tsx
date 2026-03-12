import { generateConfigAction } from "@/app/dashboard/actions";
import { requireSession } from "@/lib/auth/server";
import { listConfigVersions } from "@/lib/data/config-service";

export default async function ConfigPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const user = await requireSession();
  const query = await searchParams;
  const versionsResult = await listConfigVersions(user);
  const versions = versionsResult.ok ? versionsResult.data : [];

  return (
    <section className="stack">
      <h2>Config Rollout</h2>
      {query.error ? <p className="error">{query.error}</p> : null}
      {query.success ? <p>Generated config version {query.success}.</p> : null}
      <form action={generateConfigAction}>
        <button type="submit">Generate nightly config now</button>
      </form>
      {versions.map((version) => (
        <div key={version.id} className="card">
          <p>Version: {version.versionNumber}</p>
          <p>Generated: {version.generatedAt.toISOString()}</p>
          <p>Release: {version.releaseDate.toISOString()}</p>
          <ul>
            {version.truckStatuses.map((status) => (
              <li key={status.id}>
                {status.truck.name}: {status.status}
                {status.acknowledgedAt ? ` at ${status.acknowledgedAt.toISOString()}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
