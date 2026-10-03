import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { ComplianceDashboard } from "@/components/ComplianceDashboard";
import { CoverageHeatmap } from "@/components/CoverageHeatmap";
import { EmployeePortal } from "@/components/EmployeePortal";
import { ShiftCalendar } from "@/components/ShiftCalendar";
import { PayrollPreview } from "@/components/PayrollPreview";
import { AuditLogPanel } from "@/components/AuditLogPanel";
import { Activity, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, ShieldCheck, Users, Wifi, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

function MetricCard({ icon: Icon, label, value, detail, tone = "emerald" }: { icon: typeof Activity; label: string; value: string; detail: string; tone?: "emerald" | "amber" | "slate" }) {
  const toneClasses = {
    emerald: "border-emerald-200/20 bg-emerald-300/[0.08] text-emerald-200",
    amber: "border-amber-200/20 bg-amber-300/[0.08] text-amber-200",
    slate: "border-white/10 bg-white/[0.04] text-white/75",
  }[tone];

  return (
    <div className={`rounded-2xl border p-5 ${toneClasses}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-black/15"><Icon className="h-5 w-5" /></div>
        <ArrowUpRight className="h-4 w-4 opacity-45" />
      </div>
      <p className="mt-7 text-xs uppercase tracking-[0.18em] opacity-60">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">{value}</p>
      <p className="mt-1 text-xs opacity-55">{detail}</p>
    </div>
  );
}

function Overview({ tenantId }: { tenantId: number }) {
  const { t } = useLanguage();
  const statsQuery = trpc.workforce.getComplianceStats.useQuery({ tenantId }, { retry: false, enabled: tenantId > 0 });
  const stats = statsQuery.data;
  const hasSnapshot = stats !== undefined;
  const hasOperationalData = Boolean(stats && ((stats.totalShifts ?? 0) > 0 || (stats.totalEmployees ?? 0) > 0 || (stats.criticalViolations ?? 0) > 0));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={CalendarDays} label="Escalas ativas" value={hasOperationalData ? String(stats?.totalShifts ?? "—") : "—"} detail={hasOperationalData ? "dados do tenant" : hasSnapshot ? "sem registros operacionais" : "conecte um tenant para iniciar"} />
        <MetricCard icon={ShieldCheck} label="Compliance" value={hasOperationalData ? `${stats?.complianceScore ?? "—"}%` : "—"} detail={hasOperationalData ? "score operacional" : "aguardando dados verificáveis"} />
        <MetricCard icon={Users} label="Cobertura" value={hasOperationalData ? `${stats?.coverageRate ?? "—"}%` : "—"} detail={hasOperationalData ? "turnos cobertos" : "sem escala publicada"} tone="slate" />
        <MetricCard icon={Clock3} label="Zonas críticas" value={hasOperationalData ? String(stats?.criticalViolations ?? "—") : "—"} detail={hasOperationalData ? "revisão necessária" : "nenhuma leitura disponível"} tone={hasOperationalData && (stats?.criticalViolations ?? 0) > 0 ? "amber" : "emerald"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/75">{t.signalBoard}</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{t.operationAtAGlance}</h2>
              <p className="mt-1 text-sm text-white/45">{t.tenantOnlyData}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-300/[0.06] px-3 py-1.5 text-xs text-emerald-200"><Wifi className="h-3.5 w-3.5" /> {t.liveChannel}</div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[{ label: t.schedule, icon: CalendarDays, status: hasOperationalData ? t.synced : t.noData }, { label: t.compliance, icon: ShieldCheck, status: hasOperationalData ? t.monitored : t.waiting }, { label: t.audit, icon: CheckCircle2, status: hasSnapshot ? t.ledgerActive : t.waiting }].map(({ label, icon: Icon, status }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-black/10 p-4">
                <Icon className="h-5 w-5 text-emerald-300" />
                <p className="mt-6 text-sm font-medium text-white">{label}</p>
                <p className="mt-1 text-xs text-white/45">{status}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200/15 bg-gradient-to-br from-emerald-300/15 to-transparent p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">{t.criticalProtocol}</p>
          <h2 className="mt-3 text-xl font-semibold text-white">{t.confirmationBeforePublishing}</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">{t.sensitiveOperations}</p>
          <div className="mt-8 flex items-center gap-3 text-sm text-emerald-200"><span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_16px_#6ee7b7]" /> {t.ledgerAvailable}</div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><CoverageHeatmap tenantId={tenantId} /></div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [location, setLocation] = useLocation();
  const view = useMemo(() => new URLSearchParams(location.split("?")[1] ?? "").get("view") ?? "overview", [location]);

  const tenantsQuery = trpc.tenants.listUserTenants.useQuery(undefined, { retry: false });
  const tenantsList = tenantsQuery.data ?? [];
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  const tenantId = useMemo(() => {
    if (selectedTenantId !== null) return selectedTenantId;
    if (tenantsList.length > 0) return tenantsList[0].id;
    return user?.id ?? 0;
  }, [selectedTenantId, tenantsList, user?.id]);

  const content = view === "schedule" ? <ShiftCalendar tenantId={tenantId} />
    : view === "compliance" ? <ComplianceDashboard tenantId={tenantId} />
      : view === "employees" ? <EmployeePortal tenantId={tenantId} />
        : view === "payroll" ? <PayrollPreview tenantId={tenantId} />
          : view === "audit" ? <AuditLogPanel tenantId={tenantId} />
            : <Overview tenantId={tenantId} />;

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-3rem)] rounded-[1.7rem] bg-[#071712] p-5 text-white sm:p-7 lg:p-9">
        <div className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-emerald-300/75"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Docker Workforce · Command Center</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Bom dia, {user?.name?.split(" ")[0] ?? "operador"}.</h1>
            <p className="mt-2 text-sm text-white/45">{t.operationalView} · {new Date().toLocaleDateString(language === "en" ? "en-US" : "pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-200/20 bg-black/30 px-3.5 py-2 text-xs text-emerald-200">
              <Building2 className="h-3.5 w-3.5 text-emerald-300" />
              <span>Tenant:</span>
              {tenantsList.length > 0 ? (
                <select
                  value={tenantId}
                  onChange={(e) => setSelectedTenantId(Number(e.target.value))}
                  className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
                >
                  {tenantsList.map((item) => (
                    <option key={item.id} value={item.id} className="bg-zinc-900 text-white">
                      {item.name} ({item.role})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-white/60">Carregando...</span>
              )}
            </div>
            <button onClick={() => setLocation("/dashboard?view=compliance")} className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-300/[0.08] px-4 py-2.5 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-300/[0.16]"><ShieldCheck className="h-4 w-4" /> {t.reviewCompliance}</button>
          </div>
        </div>
        {content}
      </div>
    </DashboardLayout>
  );
}
