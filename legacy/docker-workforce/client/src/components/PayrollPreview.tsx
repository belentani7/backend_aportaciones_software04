import { useMemo, useState } from "react";
import { Calculator, FileCheck2, Loader2, LockKeyhole, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function PayrollPreview({ tenantId }: { tenantId: number }) {
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const employeesQuery = trpc.employees.list.useQuery({ tenantId });
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const selectedEmployeeId = employeeId ?? employeesQuery.data?.[0]?.id ?? 0;
  const payrollQuery = trpc.workforce.calculatePayroll.useQuery(
    { tenantId, employeeId: selectedEmployeeId, period },
    { enabled: tenantId > 0 && selectedEmployeeId > 0, retry: false },
  );

  const currency = useMemo(() => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }), []);
  const calculation = payrollQuery.data;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-300/75"><Calculator className="h-4 w-4" /> Pré-folha · cálculo rastreável</div>
            <h2 className="mt-3 text-2xl font-semibold text-white">Simular competência sem perder a evidência.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">O resultado abaixo vem do motor de payroll. Ele é uma prévia operacional e não substitui a validação contábil, fiscal ou o envio oficial ao eSocial.</p>
          </div>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="payroll-period">Competência</label>
            <input id="payroll-period" type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/60" />
            <button onClick={() => payrollQuery.refetch()} className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-white/70 transition-colors hover:border-emerald-300/50 hover:text-emerald-200" aria-label="Atualizar cálculo"><RefreshCw className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="payroll-employee" className="text-xs uppercase tracking-[0.15em] text-white/45">Colaborador</label>
          <select id="payroll-employee" value={selectedEmployeeId || ""} onChange={(event) => setEmployeeId(Number(event.target.value))} className="rounded-xl border border-white/15 bg-[#0b211a] px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/60 sm:min-w-72">
            <option value="">Selecione um colaborador</option>
            {(employeesQuery.data ?? []).map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
          </select>
        </div>
      </div>

      {payrollQuery.isLoading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-sm text-white/55"><Loader2 className="h-4 w-4 animate-spin text-emerald-300" /> Calculando com os turnos concluídos da competência…</div>
      ) : payrollQuery.error ? (
        <div className="rounded-2xl border border-amber-200/20 bg-amber-300/[0.07] p-8 text-sm text-amber-100">Ainda não há base suficiente para calcular esta competência. Conecte um colaborador e turnos concluídos para liberar a prévia.</div>
      ) : calculation ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[["Bruto", currency.format(calculation.gross)], ["Líquido estimado", currency.format(calculation.net)], ["Horas trabalhadas", `${calculation.hoursWorked.toFixed(1)} h`], ["Adicional noturno", currency.format(calculation.nightBonus)]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><p className="text-xs uppercase tracking-[0.16em] text-white/45">{label}</p><p className="mt-3 text-2xl font-semibold text-white">{value}</p></div>)}
          <div className="sm:col-span-2 xl:col-span-4 flex flex-col gap-3 rounded-2xl border border-emerald-200/15 bg-emerald-300/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><FileCheck2 className="h-5 w-5 text-emerald-300" /><div><p className="text-sm font-medium text-emerald-100">Prévia calculada</p><p className="text-xs text-emerald-100/50">Horas extras: {calculation.overtimeHours.toFixed(1)} h · Ausências aprovadas: {calculation.absenceDays} dias</p></div></div><div className="flex items-center gap-2 text-xs text-emerald-200/65"><LockKeyhole className="h-3.5 w-3.5" /> pronta para revisão autorizada</div></div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center"><Calculator className="mx-auto h-7 w-7 text-emerald-300/70" /><p className="mt-4 text-sm font-medium text-white">Selecione um colaborador para calcular</p><p className="mt-2 text-xs text-white/40">Nenhum valor é preenchido sem dados reais do tenant.</p></div>
      )}
    </div>
  );
}
