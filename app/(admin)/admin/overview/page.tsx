import { AdminNav } from "@/components/navigation";
import { AppShell, MetricCard, Panel } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { getAdminOverview } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireRole("admin", "/admin/login");
  const overview = await getAdminOverview();

  return (
    <AppShell title="전체 현황" description="운영에 필요한 핵심 수치만 먼저 제공합니다." actions={<AdminNav />}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="전체 참가자 수" value={String(overview.participantCount)} />
        <MetricCard label="승인 기록 수" value={String(overview.approvedCount)} />
        <MetricCard label="경고 기록 수" value={String(overview.warningCount)} />
        <MetricCard label="반려 기록 수" value={String(overview.rejectedCount)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="지점별 참가자 수">
          <div className="grid gap-3">
            {Object.entries(overview.branchCounts).map(([name, count]) => (
              <div key={name} className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3 text-sm">
                <span>{name}</span>
                <span>{count}명</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="챌린지별 참가자 수">
          <div className="grid gap-3">
            {Object.entries(overview.challengeCounts).map(([name, count]) => (
              <div key={name} className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3 text-sm">
                <span>{name}</span>
                <span>{count}명</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
