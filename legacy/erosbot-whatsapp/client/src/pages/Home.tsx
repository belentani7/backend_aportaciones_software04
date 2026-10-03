import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Sparkles, Languages, MessageSquare, Activity, Send, LockKeyhole } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [phone, setPhone] = useState("demo-user");
  const [text, setText] = useState("Hola, kuanto cuesta el acceso premium?");
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const snapshot = trpc.demo.snapshot.useQuery();
  const process = trpc.demo.processMessage.useMutation({
    onSuccess: result => {
      setLastReply(result.reply);
      setLastError(null);
      snapshot.refetch();
    },
    onError: () => setLastError("No se pudo procesar el mensaje. No se han expuesto datos internos; inténtalo de nuevo."),
  });

  return (
    <div className="min-h-screen bg-[#0b1020] text-white">
      <header className="border-b border-white/10 bg-[#0b1020]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3"><div className="rounded-2xl bg-[#d8b477] p-2.5 text-[#17120c]"><Sparkles size={20} /></div><div><p className="text-sm font-medium tracking-[0.25em] text-[#d8b477]">AUREA</p><p className="text-xs text-white/45">Private communication assistant</p></div></div>
          <Badge className="border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"><span className="mr-2 h-2 w-2 rounded-full bg-emerald-300" />Demo online</Badge>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <section className="max-w-3xl"><p className="mb-3 text-sm uppercase tracking-[0.25em] text-[#d8b477]">Control centre</p><h1 className="text-4xl font-semibold tracking-tight md:text-6xl">Responde mejor.<br /><span className="text-white/45">Sin perder el control.</span></h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">Un espacio privado para traducir, organizar y preparar respuestas en 12 idiomas. El acceso premium es la única relación de pago gestionada por esta plataforma.</p></section>
        <section className="grid gap-5 md:grid-cols-4">
          {[{ icon: ShieldCheck, label: "Safety layer", value: "Pre-AI" }, { icon: Languages, label: "Languages", value: "12 active" }, { icon: MessageSquare, label: "Sessions", value: String(snapshot.data?.activeSessions ?? 0) }, { icon: LockKeyhole, label: "Premium", value: "Active" }].map(item => <Card key={item.label} className="border-white/10 bg-white/[0.045] text-white shadow-2xl shadow-black/20"><CardContent className="p-5"><item.icon className="mb-6 text-[#d8b477]" size={20} /><p className="text-sm text-white/45">{item.label}</p><p className="mt-1 text-xl font-medium">{item.value}</p></CardContent></Card>)}
        </section>
        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <Card className="border-white/10 bg-white/[0.045] text-white"><CardHeader><div className="flex items-center justify-between"><div><CardTitle className="text-xl">Message studio</CardTitle><p className="mt-1 text-sm text-white/45">Simulación segura del contestador y traductor.</p></div><Badge variant="outline" className="border-[#d8b477]/40 text-[#d8b477]">MOCK MODE</Badge></div></CardHeader><CardContent className="space-y-4" aria-busy={process.isPending}><div><label htmlFor="conversation-id" className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Conversation ID</label><Input id="conversation-id" value={phone} onChange={e => setPhone(e.target.value)} aria-describedby="conversation-help" className="border-white/10 bg-black/20 text-white" /><p id="conversation-help" className="mt-1 text-xs text-white/40">Identificador de demo; no introduzcas un teléfono real.</p></div><div><label htmlFor="incoming-message" className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Incoming message</label><Textarea id="incoming-message" value={text} onChange={e => setText(e.target.value)} maxLength={4000} aria-describedby="message-limit" className="min-h-32 border-white/10 bg-black/20 text-white" /><p id="message-limit" className="mt-1 text-xs text-white/40">{text.length}/4000 caracteres. Las señales de riesgo se derivan a revisión humana.</p></div><Button disabled={process.isPending || phone.trim().length < 3 || !text.trim()} onClick={() => process.mutate({ from: phone, text })} className="bg-[#d8b477] text-[#17120c] hover:bg-[#e5c992]"><Send size={16} className="mr-2" />{process.isPending ? "Analizando…" : "Procesar mensaje"}</Button>{lastError && <div role="alert" className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100">{lastError}</div>}{lastReply && <div aria-live="polite" className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4"><p className="mb-2 text-xs uppercase tracking-[0.18em] text-emerald-200">Assistant reply</p><p className="whitespace-pre-wrap leading-7 text-white/80">{lastReply}</p></div>}</CardContent></Card>
          <div className="space-y-6"><Card className="border-white/10 bg-white/[0.045] text-white"><CardHeader><CardTitle className="text-xl">Operating principles</CardTitle></CardHeader><CardContent className="space-y-5 text-sm leading-6 text-white/60"><div className="flex gap-3"><ShieldCheck className="mt-1 shrink-0 text-[#d8b477]" size={18} /><p>La detección de patrones ocurre antes de cualquier generación. Las señales críticas pausan la conversación y piden revisión humana.</p></div><div className="flex gap-3"><Activity className="mt-1 shrink-0 text-[#d8b477]" size={18} /><p>El sistema no fija precios, no recibe dinero de terceros, no negocia ni actúa como intermediario.</p></div><div className="flex gap-3"><LockKeyhole className="mt-1 shrink-0 text-[#d8b477]" size={18} /><p>Los secretos reales nunca se buscan en GitHub. El adaptador demo usa datos simulados y puede sustituirse por Meta Cloud API.</p></div></CardContent></Card><Card className="border-emerald-300/20 bg-emerald-300/[0.05] text-white"><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-xl">Service health</CardTitle><Badge variant="outline" className={snapshot.data?.observability?.healthy ? "border-emerald-300/30 text-emerald-100" : "border-rose-300/30 text-rose-100"}>{snapshot.data?.observability?.healthy ? "Stable" : "Attention"}</Badge></div></CardHeader><CardContent className="space-y-3 text-sm text-white/60"><p>{snapshot.data?.observability?.alerts?.length ? `${snapshot.data.observability.alerts.length} alertas agregadas sin contenido sensible.` : "Sin alertas críticas en el buffer operativo."}</p><div className="flex flex-wrap gap-2">{Object.entries(snapshot.data?.observability?.counters ?? {}).slice(0, 4).map(([name, count]) => <Badge key={name} variant="outline" className="border-white/15 text-white/65">{name}: {count}</Badge>)}</div></CardContent></Card><Card className="border-amber-200/20 bg-amber-200/[0.05] text-white"><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-xl">Safety review queue</CardTitle><Badge variant="outline" className="border-amber-200/30 text-amber-100">{snapshot.data?.pendingReviews?.length ?? 0} pending</Badge></div></CardHeader><CardContent className="space-y-3">{snapshot.data?.pendingReviews?.length ? snapshot.data.pendingReviews.slice(0, 4).map(item => <div key={item.id} className="rounded-xl border border-white/10 bg-black/15 p-3"><div className="flex items-center justify-between"><span className="text-sm font-medium text-white/85">{item.code}</span><span className="text-[10px] uppercase tracking-[0.15em] text-amber-100">{item.severity}</span></div><p className="mt-1 text-xs text-white/45">Session {"from" in item ? item.from : item.sessionKey} · {item.status}</p></div>) : <p className="text-sm text-white/50">No hay incidentes pendientes en esta demo.</p>}</CardContent></Card></div>
        </section>
      </main>
    </div>
  );
}
