import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

interface CoverageData {
  timeSlot: string;
  required: number;
  scheduled: number;
  coverage: number;
  status: "critical" | "warning" | "ok";
}

export function CoverageHeatmap({ tenantId }: { tenantId: number }) {
  const { language } = useLanguage();
  const { data: shiftsData, isLoading } = trpc.shifts.list.useQuery({ tenantId });
  const isEnglish = language === "en";

  const coverageData = useMemo(() => {
    if (!shiftsData) return [];

    const timeSlots = ["6–14", "14–22", "22–6"];
    const requiredCoverage = [5, 4, 3];

    return timeSlots.map((slot, index) => {
      const scheduled = shiftsData.filter((shift) => {
        const hour = new Date(shift.startTime).getHours();
        if (index === 0) return hour >= 6 && hour < 14;
        if (index === 1) return hour >= 14 && hour < 22;
        return hour >= 22 || hour < 6;
      }).length;
      const required = requiredCoverage[index];
      const coverage = Math.round((scheduled / required) * 100);
      return {
        timeSlot: slot,
        required,
        scheduled,
        coverage,
        status: coverage >= 100 ? "ok" : coverage >= 75 ? "warning" : "critical",
      } satisfies CoverageData;
    });
  }, [shiftsData]);

  const hasCoverage = coverageData.some((data) => data.scheduled > 0);
  const getColor = (status: CoverageData["status"]) => status === "ok" ? "#55e6b1" : status === "warning" ? "#f6c65b" : "#ff6f61";
  const copy = isEnglish
    ? { title: "Coverage by shift", required: "Required", scheduled: "Scheduled", people: "people", waiting: "Waiting for published shifts", empty: "Connect a tenant and publish a schedule to activate the coverage signal." }
    : { title: "Cobertura por turno", required: "Necessário", scheduled: "Programado", people: "pessoas", waiting: "Aguardando escalas publicadas", empty: "Conecte um tenant e publique uma escala para ativar o sinal de cobertura." };

  return (
    <section className="rounded-[28px] border border-emerald-100/10 bg-[#0b211b] p-6 text-white shadow-[0_18px_70px_rgba(0,0,0,0.16)] sm:p-8" aria-label={copy.title}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-300/70">Signal / Coverage</p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">{copy.title}</h2>
        </div>
        <span className="w-fit rounded-full border border-emerald-200/15 bg-emerald-200/5 px-3 py-1.5 text-xs text-emerald-100/70">
          {isLoading ? "Syncing" : hasCoverage ? "Live signal" : "No live data"}
        </span>
      </div>

      {!hasCoverage && !isLoading ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-100/15 bg-[#071712] px-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-200/10 text-xl text-emerald-200">⌁</div>
          <p className="text-sm font-medium text-white/80">{copy.waiting}</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/45">{copy.empty}</p>
        </div>
      ) : (
        <>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coverageData} margin={{ top: 12, right: 12, left: -18, bottom: 4 }}>
                <CartesianGrid stroke="#b9f8de" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="timeSlot" tick={{ fill: "#8eb8a7", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6f9b89", fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
                <Tooltip contentStyle={{ background: "#102e24", border: "1px solid rgba(185,248,222,.14)", borderRadius: 12, color: "#fff" }} />
                <Legend wrapperStyle={{ color: "#91b9a6", fontSize: 12 }} />
                <Bar dataKey="required" fill="#315446" radius={[5, 5, 0, 0]} name={copy.required} />
                <Bar dataKey="scheduled" fill="#55e6b1" radius={[5, 5, 0, 0]} name={copy.scheduled} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {coverageData.map((data) => (
              <div key={data.timeSlot} className="rounded-2xl border border-emerald-100/10 bg-[#102e24] p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-white/90"><span>{data.timeSlot}</span><span style={{ color: getColor(data.status) }}>{data.coverage}%</span></div>
                <div className="mt-2 text-xs text-white/45">{data.scheduled}/{data.required} {copy.people}</div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${Math.min(data.coverage, 100)}%`, backgroundColor: getColor(data.status) }} /></div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
