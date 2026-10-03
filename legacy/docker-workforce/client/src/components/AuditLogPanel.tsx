import { useState } from "react";
import { CheckCircle2, Copy, Fingerprint, Loader2, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function AuditLogPanel({ tenantId }: { tenantId: number }) {
  const [copied, setCopied] = useState<string | null>(null);
  const query = trpc.audit.list.useQuery({ tenantId, limit: 40 }, { retry: false });

  const copyHash = async (hash: string) => {
    await navigator.clipboard?.writeText(hash);
    setCopied(hash);
    window.setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:flex-row sm:items-end">
        <div><div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-300/75"><Fingerprint className="h-4 w-4" /> Immutable audit ledger</div><h2 className="mt-3 text-2xl font-semibold text-white">A prova de cada decisão.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Eventos são encadeados por SHA-256. O painel expõe a integridade retornada pelo servidor, não um indicador decorativo.</p></div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${query.data?.integrity ? "border-emerald-200/20 bg-emerald-300/[0.08] text-emerald-200" : "border-amber-200/20 bg-amber-300/[0.08] text-amber-100"}`}>
          {query.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : query.data?.integrity ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
          {query.isLoading ? "Verificando cadeia" : query.data?.integrity ? "Cadeia íntegra" : "Sem confirmação"}
        </div>
      </div>
      {query.error ? <div className="rounded-2xl border border-amber-200/20 bg-amber-300/[0.07] p-6 text-sm text-amber-100">O ledger ainda não pode ser consultado para este tenant. A interface não substitui autorização ou conexão de dados.</div> : (query.data?.logs?.length ?? 0) === 0 ? <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center"><Fingerprint className="mx-auto h-7 w-7 text-emerald-300/70" /><p className="mt-4 text-sm font-medium text-white">Nenhum evento registrado ainda.</p><p className="mt-2 text-xs text-white/40">Quando uma operação autorizada ocorrer, o hash e seu predecessor aparecerão aqui.</p></div> : <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.16em] text-white/35"><tr><th className="px-5 py-4">Evento</th><th className="px-5 py-4">Recurso</th><th className="px-5 py-4">Horário</th><th className="px-5 py-4">Hash</th></tr></thead><tbody className="divide-y divide-white/5">{(query.data?.logs ?? []).map((log) => <tr key={log.id} className="text-sm text-white/65"><td className="px-5 py-4"><span className="font-medium text-white">{log.action}</span><span className="mt-1 block text-xs text-white/35">#{log.id}</span></td><td className="px-5 py-4">{log.resourceType} <span className="text-white/30">/ {log.resourceId}</span></td><td className="px-5 py-4 text-xs text-white/40">{new Date(log.occurredAt).toLocaleString("pt-BR")}</td><td className="px-5 py-4"><button onClick={() => copyHash(log.hash)} className="group flex max-w-[230px] items-center gap-2 font-mono text-[10px] text-emerald-200/65 hover:text-emerald-100" title="Copiar hash"><span className="truncate">{log.hash}</span>{copied === log.hash ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Copy className="h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100" />}</button></td></tr>)}</tbody></table></div></div>}
    </div>
  );
}
