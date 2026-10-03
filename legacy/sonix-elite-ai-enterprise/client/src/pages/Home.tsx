import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { isLegacyAmbientUrl, useAudioPreview } from "@/lib/audioPreview";
import { Language, translations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Music, Mic, Radio, ShieldCheck, Library, UserCheck, Settings, 
  Globe, Play, Download, Crown, Sparkles, Activity, Shield, Users, LogOut, ExternalLink 
} from "lucide-react";

const waveformBars = [18, 34, 26, 58, 40, 72, 32, 48, 24, 66, 44, 82, 30, 52, 22, 64, 36, 74, 28, 56, 20, 46, 32, 68, 38, 54, 24, 76, 34, 60, 22, 42];

type AudioPreviewProps = {
  seed: string;
  sourceUrl?: string | null;
  label: string;
  enabled?: boolean;
};

function AudioPreview({ seed, sourceUrl, label, enabled = true }: AudioPreviewProps) {
  const audioUrl = useAudioPreview(seed, sourceUrl, enabled);
  if (!audioUrl) return null;

  return <audio controls preload="metadata" src={audioUrl} aria-label={label} className="w-full h-8 accent-champagne" />;
}

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [lang, setLang] = useState<Language>('es');
  const t = translations[lang];

  // Estados para Generación de Canciones
  const [songTitle, setSongTitle] = useState("");
  const [songGenre, setSongGenre] = useState("Pop Sinfónico");
  const [songMood, setSongMood] = useState("Épico e Inspirador");
  const [songLang, setSongLang] = useState("Español");
  const [customPrompt, setCustomPrompt] = useState("");

  // Estados para Clonación de Voz
  const [voiceName, setVoiceName] = useState("");
  const [sampleUrl, setSampleUrl] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);

  // Estados para Instrumentales
  const [instTitle, setInstTitle] = useState("");
  const [instGenre, setInstGenre] = useState("Cinemático Orchestral");
  const [instBpm, setInstBpm] = useState(120);
  const [instKey, setInstKey] = useState("A Minor");
  const [instInstruments, setInstInstruments] = useState("Cuerdas, Piano de Cola, Percusión Épica");
  const [instDuration, setInstDuration] = useState(180);

  // tRPC mutations & queries
  const utils = trpc.useUtils();
  const createSong = trpc.songs.create.useMutation({
    onSuccess: () => {
      toast.success("¡Canción generada con éxito por la IA!");
      utils.songs.list.invalidate();
    },
    onError: (err) => toast.error(`Error: ${err.message}`)
  });

  const cloneVoice = trpc.voice.clone.useMutation({
    onSuccess: () => {
      toast.success("¡Voz clonada con éxito bajo consentimiento verificado!");
      utils.voice.list.invalidate();
    },
    onError: (err) => toast.error(`Error: ${err.message}`)
  });

  const createInstrumental = trpc.instrumentals.create.useMutation({
    onSuccess: () => {
      toast.success("¡Instrumental profesional generada con éxito!");
      utils.instrumentals.list.invalidate();
    },
    onError: (err) => toast.error(`Error: ${err.message}`)
  });

  const { data: songsList } = trpc.songs.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: voicesList } = trpc.voice.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: instrumentalsList } = trpc.instrumentals.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: auditLogs } = trpc.audit.logs.useQuery(undefined, { enabled: isAuthenticated });
  const { data: adminStats } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === 'admin' });
  const { data: adminUsers } = trpc.admin.usersList.useQuery(undefined, { enabled: isAuthenticated && user?.role === 'admin' });

  return (
    <div className="min-h-screen bg-obsidian text-mist flex flex-col font-sans selection:bg-champagne selection:text-obsidian">
      {/* Header Corporativo Ultra-Premium */}
      <header className="border-b border-white/10 bg-ink/85 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="brand-gradient soft-glow p-2.5 rounded-xl text-obsidian">
            <Crown className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-xl font-bold tracking-wider brand-gradient-text truncate">
              {t.brandName}
            </h1>
            <p className="hidden sm:block text-xs text-fog font-medium">{t.tagline}</p>
          </div>
        </div>

        {/* Selector de Idioma (6 idiomas requeridos) */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 bg-slate-premium/80 px-3 py-1.5 rounded-lg border border-white/15">
            <Globe className="w-4 h-4 text-champagne" />
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as Language)}
              className="bg-transparent text-xs font-semibold text-mist outline-none cursor-pointer"
            >
              <option value="es" className="bg-ink">Español</option>
              <option value="en" className="bg-ink">English</option>
              <option value="pt" className="bg-ink">Português (Brasil)</option>
              <option value="ca" className="bg-ink">Català</option>
              <option value="it" className="bg-ink">Italiano</option>
              <option value="fr" className="bg-ink">Français</option>
            </select>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-mist">{user?.name || 'Usuario'}</p>
                <Badge variant="outline" className="text-[10px] border-champagne/50 text-champagne">
                  {user?.role === 'admin' ? 'Administrador' : 'Pro Creator'}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => logout()}
                className="border-white/15 hover:bg-slate-premium text-mist/80 px-2 sm:px-3"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{t.logout}</span>
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => startLogin()} 
              className="brand-gradient soft-glow premium-interaction text-obsidian font-bold"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {t.login}
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-6 text-center border-b border-white/10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-ink via-obsidian to-obsidian">
        <div className="absolute inset-0 premium-grid" aria-hidden="true"></div>
        <div className="pointer-events-none absolute left-1/2 top-24 flex h-32 w-[min(70rem,90%)] -translate-x-1/2 items-center justify-center gap-1 opacity-20" aria-hidden="true">
          {waveformBars.map((height, index) => (
            <span key={index} className="w-1 rounded-full bg-gradient-to-t from-teal-smoke to-champagne" style={{ height: `${height}%` }} />
          ))}
        </div>
        <div className="relative max-w-4xl mx-auto space-y-6">
          <Badge className="mx-auto w-full sm:w-auto max-w-full text-center bg-champagne/10 text-champagne border border-champagne/30 px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-[0.12em] sm:tracking-widest leading-relaxed whitespace-normal">
            Corporativo Sólido • Auditoría Rigurosa • Grado Billonario
          </Badge>
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-mist leading-tight">
            {t.heroTitle}
          </h2>
          <p className="text-lg sm:text-xl text-fog max-w-2xl mx-auto font-normal leading-relaxed">
            {t.heroSubtitle}
          </p>

          {!isAuthenticated && (
            <div className="pt-4 flex justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => startLogin()}
                className="brand-gradient soft-glow premium-interaction text-obsidian font-bold px-8 py-6 text-base hover:scale-[1.02]"
              >
                Comenzar Ahora con Autonomía Total
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10">
        {isAuthenticated ? (
          <Tabs defaultValue="songs" className="space-y-8">
            <TabsList className="bg-ink border border-white/10 p-1.5 rounded-2xl grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2">
              <TabsTrigger value="songs" className="data-[state=active]:bg-champagne data-[state=active]:text-obsidian w-full sm:w-auto rounded-xl px-3 sm:px-4 py-2.5 font-semibold transition-all">
                <Music className="w-4 h-4 mr-2" /> {t.createSong}
              </TabsTrigger>
              <TabsTrigger value="voice" className="data-[state=active]:bg-champagne data-[state=active]:text-obsidian w-full sm:w-auto rounded-xl px-3 sm:px-4 py-2.5 font-semibold transition-all">
                <Mic className="w-4 h-4 mr-2" /> {t.cloneVoice}
              </TabsTrigger>
              <TabsTrigger value="instrumentals" className="data-[state=active]:bg-champagne data-[state=active]:text-obsidian w-full sm:w-auto rounded-xl px-3 sm:px-4 py-2.5 font-semibold transition-all">
                <Radio className="w-4 h-4 mr-2" /> {t.createInstrumental}
              </TabsTrigger>
              <TabsTrigger value="library" className="data-[state=active]:bg-champagne data-[state=active]:text-obsidian w-full sm:w-auto rounded-xl px-3 sm:px-4 py-2.5 font-semibold transition-all">
                <Library className="w-4 h-4 mr-2" /> {t.myLibrary}
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-champagne data-[state=active]:text-obsidian w-full sm:w-auto rounded-xl px-3 sm:px-4 py-2.5 font-semibold transition-all">
                <ShieldCheck className="w-4 h-4 mr-2" /> {t.auditPanel}
              </TabsTrigger>
              {user?.role === 'admin' && (
                <TabsTrigger value="admin" className="data-[state=active]:bg-champagne data-[state=active]:text-obsidian w-full sm:w-auto rounded-xl px-3 sm:px-4 py-2.5 font-semibold transition-all">
                  <Settings className="w-4 h-4 mr-2" /> {t.adminPanel}
                </TabsTrigger>
              )}
            </TabsList>

            {/* TAB 1: Generador de Canciones */}
            <TabsContent value="songs" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="premium-surface premium-interaction">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-mist flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-champagne" />
                      Motor de Creación de Canciones por IA
                    </CardTitle>
                    <CardDescription className="text-fog">
                      Configure los parámetros creativos y de género para generar una obra maestra completa con letra y audio.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist/80">Título de la Obra</label>
                      <Input 
                        placeholder="Ej. Sinfonía del Destino" 
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        className="bg-obsidian border-white/10 text-mist"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-mist/80">Género Musical</label>
                        <Select value={songGenre} onValueChange={setSongGenre}>
                          <SelectTrigger className="bg-obsidian border-white/10 text-mist">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-ink border-white/10 text-mist">
                            <SelectItem value="Pop Sinfónico">Pop Sinfónico</SelectItem>
                            <SelectItem value="Rock Épico">Rock Épico</SelectItem>
                            <SelectItem value="Electro House">Electro House</SelectItem>
                            <SelectItem value="Jazz Contemporáneo">Jazz Contemporáneo</SelectItem>
                            <SelectItem value="R&B Soul">R&B Soul</SelectItem>
                            <SelectItem value="Orquestal Cinematográfico">Orquestal Cinematográfico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-mist/80">Estado de Ánimo (Mood)</label>
                        <Select value={songMood} onValueChange={setSongMood}>
                          <SelectTrigger className="bg-obsidian border-white/10 text-mist">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-ink border-white/10 text-mist">
                            <SelectItem value="Épico e Inspirador">Épico e Inspirador</SelectItem>
                            <SelectItem value="Melancólico y Profundo">Melancólico y Profundo</SelectItem>
                            <SelectItem value="Energético y Vibrante">Energético y Vibrante</SelectItem>
                            <SelectItem value="Místico y Sofisticado">Místico y Sofisticado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist/80">Idioma de Producción</label>
                      <Select value={songLang} onValueChange={setSongLang}>
                        <SelectTrigger className="bg-obsidian border-white/10 text-mist">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-ink border-white/10 text-mist">
                          <SelectItem value="Español">Español</SelectItem>
                          <SelectItem value="Inglés">Inglés</SelectItem>
                          <SelectItem value="Portugués (Brasil)">Português (Brasil)</SelectItem>
                          <SelectItem value="Catalán">Català</SelectItem>
                          <SelectItem value="Italiano">Italiano</SelectItem>
                          <SelectItem value="Francés">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist/80">Prompt Creativo Opcional (Temática o Detalles)</label>
                      <Textarea 
                        placeholder="Ej. Inspirado en la grandeza del cosmos y la superación personal..."
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="bg-obsidian border-white/10 text-mist resize-none h-24"
                      />
                    </div>
                    <Button 
                      onClick={() => {
                        if (!songTitle) {
                          toast.error("Por favor ingrese un título para la canción.");
                          return;
                        }
                        createSong.mutate({ title: songTitle, genre: songGenre, mood: songMood, language: songLang, customPrompt });
                      }}
                      disabled={createSong.isPending}
                      className="w-full bg-gradient-to-r from-champagne-soft to-champagne hover:from-champagne hover:to-champagne-soft text-obsidian font-bold py-3 shadow-lg shadow-champagne/20"
                    >
                      {createSong.isPending ? "Sintetizando Obra Maestra..." : "Generar Canción Completa"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Vista previa de canciones creadas */}
                <Card className="premium-surface premium-interaction flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-mist flex items-center gap-2">
                      <Library className="w-5 h-5 text-champagne" />
                      Últimas Producciones Musicales
                    </CardTitle>
                    <CardDescription className="text-fog">
                      Reproduzca o descargue las canciones generadas en su sesión.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto space-y-4 max-h-[450px]">
                    {(!songsList || songsList.length === 0) ? (
                      <div className="text-center py-12 text-mist0">
                        <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No hay canciones generadas todavía. ¡Comience arriba!</p>
                      </div>
                    ) : (
                      songsList.map((song) => (
                        <div key={song.id} className="p-4 rounded-xl bg-obsidian border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-mist">{song.title}</h4>
                              <p className="text-xs text-champagne">{song.genre} • {song.mood} ({song.language})</p>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Completado</Badge>
                          </div>
                          <div className="bg-ink p-3 rounded-lg text-xs text-mist/80 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                            {song.lyrics}
                          </div>
                          {song.audioUrl && (
                            <div className="flex items-center gap-3 pt-1">
                              <AudioPreview seed={`song:${song.id}:${song.title}:${song.genre}:${song.mood}`} sourceUrl={song.audioUrl} label={`Reproducir ${song.title}`} />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 2: Clonación de Voz con Consentimiento Verificable */}
            <TabsContent value="voice" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="premium-surface premium-interaction">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-mist flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-champagne" />
                      Clonación de Voz con Consentimiento Ético
                    </CardTitle>
                    <CardDescription className="text-fog">
                      Sube una muestra de voz nítida y acepta los términos legales de autorización biométrica obligatoria.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist/80">Nombre del Modelo de Voz</label>
                      <Input 
                        placeholder="Ej. Voz Principal Estudio A" 
                        value={voiceName}
                        onChange={(e) => setVoiceName(e.target.value)}
                        className="bg-obsidian border-white/10 text-mist"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist/80">URL de la Muestra de Audio (.WAV / .MP3)</label>
                      <Input 
                        value={sampleUrl}
                        onChange={(e) => setSampleUrl(e.target.value)}
                        className="bg-obsidian border-white/10 text-mist"
                      />
                    </div>

                    {/* Términos legales de consentimiento verificable */}
                    <div className="p-4 rounded-xl bg-obsidian border border-champagne/30 space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          id="consent" 
                          checked={consentAccepted}
                          onCheckedChange={(val) => setConsentAccepted(val === true)}
                          className="mt-1 border-amber-500 data-[state=checked]:bg-champagne data-[state=checked]:text-obsidian"
                        />
                        <label htmlFor="consent" className="text-xs text-mist/80 leading-relaxed cursor-pointer">
                          <strong className="text-champagne block mb-1">Declaración Obligatoria de Consentimiento y Titularidad:</strong>
                          Certifico bajo pena de responsabilidad legal que poseo los derechos explícitos sobre la muestra de voz proporcionada o que cuento con autorización expresa e inivocable del titular para realizar esta clonación sintética. Autorizo el registro inmutable de mi dirección IP y metadatos con fines de auditoría global.
                        </label>
                      </div>
                    </div>

                    <Button 
                      onClick={() => {
                        if (!voiceName) {
                          toast.error("Ingrese el nombre del modelo de voz.");
                          return;
                        }
                        if (!sampleUrl) {
                          toast.error("Proporcione una URL de muestra de voz válida.");
                          return;
                        }
                        if (!consentAccepted) {
                          toast.error("Debe aceptar los términos de consentimiento explícito.");
                          return;
                        }
                        cloneVoice.mutate({ voiceName, sampleUrl, consentAccepted });
                      }}
                      disabled={cloneVoice.isPending}
                      className="w-full bg-gradient-to-r from-champagne-soft to-champagne hover:from-champagne hover:to-champagne-soft text-obsidian font-bold py-3 shadow-lg shadow-champagne/20"
                    >
                      {cloneVoice.isPending ? "Verificando y Procesando Clon..." : "Procesar Clonación con Consentimiento"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Lista de Voces Clonadas */}
                <Card className="premium-surface premium-interaction flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-mist flex items-center gap-2">
                      <Mic className="w-5 h-5 text-champagne" />
                      Voces Clonadas Autorizadas
                    </CardTitle>
                    <CardDescription className="text-fog">
                      Modelos vocales listos para producción con trazabilidad legal verificada.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto space-y-4 max-h-[420px]">
                    {(!voicesList || voicesList.length === 0) ? (
                      <div className="text-center py-12 text-mist0">
                        <Mic className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No hay modelos de voz clonados en su cuenta.</p>
                      </div>
                    ) : (
                      voicesList.map((voice) => (
                        <div key={voice.id} className="p-4 rounded-xl bg-obsidian border border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-mist">{voice.voiceName}</h4>
                            <Badge className="bg-champagne/10 text-champagne border-champagne/30">Consentimiento Verificado</Badge>
                          </div>
                          <p className="text-xs text-fog font-mono">IP de Registro: {voice.consentIp || '127.0.0.1'}</p>
                          <AudioPreview seed={`voice:${voice.id}:${voice.voiceName}`} sourceUrl={voice.sampleUrl} enabled={!isLegacyAmbientUrl(voice.sampleUrl)} label={`Muestra de voz ${voice.voiceName}`} />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 3: Creación de Instrumentales */}
            <TabsContent value="instrumentals" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="premium-surface premium-interaction">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-mist flex items-center gap-2">
                      <Radio className="w-5 h-5 text-champagne" />
                      Generador de Instrumentales Profesionales
                    </CardTitle>
                    <CardDescription className="text-fog">
                      Diseñe pistas de acompañamiento con control avanzado de BPM, tonalidad e instrumentación.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist/80">Título de la Instrumental</label>
                      <Input 
                        placeholder="Ej. Horizon Cinematic Beat" 
                        value={instTitle}
                        onChange={(e) => setInstTitle(e.target.value)}
                        className="bg-obsidian border-white/10 text-mist"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-mist/80">Género</label>
                        <Select value={instGenre} onValueChange={setInstGenre}>
                          <SelectTrigger className="bg-obsidian border-white/10 text-mist">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-ink border-white/10 text-mist">
                            <SelectItem value="Cinemático Orchestral">Cinemático Orchestral</SelectItem>
                            <SelectItem value="Lo-Fi Chill Hop">Lo-Fi Chill Hop</SelectItem>
                            <SelectItem value="Synthwave 80s">Synthwave 80s</SelectItem>
                            <SelectItem value="Trap Melódico">Trap Melódico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-mist/80">BPM (Tempo)</label>
                        <Input 
                          type="number" 
                          value={instBpm} 
                          onChange={(e) => setInstBpm(Number(e.target.value))}
                          className="bg-obsidian border-white/10 text-mist"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-mist/80">Tonalidad (Key)</label>
                        <Input 
                          value={instKey} 
                          onChange={(e) => setInstKey(e.target.value)}
                          className="bg-obsidian border-white/10 text-mist"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-mist/80">Duración (Segundos)</label>
                        <Input 
                          type="number" 
                          value={instDuration} 
                          onChange={(e) => setInstDuration(Number(e.target.value))}
                          className="bg-obsidian border-white/10 text-mist"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-mist/80">Instrumentación Detallada</label>
                      <Input 
                        value={instInstruments} 
                        onChange={(e) => setInstInstruments(e.target.value)}
                        className="bg-obsidian border-white/10 text-mist"
                      />
                    </div>
                    <Button 
                      onClick={() => {
                        if (!instTitle) {
                          toast.error("Ingrese un título para la instrumental.");
                          return;
                        }
                        createInstrumental.mutate({ title: instTitle, genre: instGenre, bpm: instBpm, keySignature: instKey, instruments: instInstruments, durationSeconds: instDuration });
                      }}
                      disabled={createInstrumental.isPending}
                      className="w-full bg-gradient-to-r from-champagne-soft to-champagne hover:from-champagne hover:to-champagne-soft text-obsidian font-bold py-3 shadow-lg shadow-champagne/20"
                    >
                      {createInstrumental.isPending ? "Produciendo Instrumental..." : "Generar Instrumental Profesional"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Lista de Instrumentales */}
                <Card className="premium-surface premium-interaction flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-mist flex items-center gap-2">
                      <Library className="w-5 h-5 text-champagne" />
                      Instrumentales Generadas
                    </CardTitle>
                    <CardDescription className="text-fog">
                      Pistas de acompañamiento listas para masterización.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto space-y-4 max-h-[420px]">
                    {(!instrumentalsList || instrumentalsList.length === 0) ? (
                      <div className="text-center py-12 text-mist0">
                        <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No hay instrumentales generadas todavía.</p>
                      </div>
                    ) : (
                      instrumentalsList.map((inst) => (
                        <div key={inst.id} className="p-4 rounded-xl bg-obsidian border border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-mist">{inst.title}</h4>
                            <Badge className="bg-champagne/10 text-champagne border-champagne/30">{inst.bpm} BPM • {inst.keySignature}</Badge>
                          </div>
                          <p className="text-xs text-fog">Instrumentos: {inst.instruments}</p>
                          {inst.audioUrl && (
                            <AudioPreview seed={`instrumental:${inst.id}:${inst.title}:${inst.genre}:${inst.bpm}:${inst.keySignature}`} sourceUrl={inst.audioUrl} label={`Reproducir ${inst.title}`} />
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 4: Biblioteca Personal */}
            <TabsContent value="library" className="space-y-6">
              <Card className="premium-surface premium-interaction">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-mist flex items-center gap-2">
                    <Library className="w-5 h-5 text-champagne" />
                    Biblioteca Completa de Activos Musicales
                  </CardTitle>
                  <CardDescription className="text-fog">
                    Historial unificado de todas sus canciones, voces y pistas instrumentales.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-champagne uppercase tracking-wider">Canciones ({songsList?.length || 0})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {songsList?.map((song) => (
                        <div key={song.id} className="p-4 rounded-xl bg-obsidian border border-white/10 space-y-2">
                          <h4 className="font-bold text-mist">{song.title}</h4>
                          <p className="text-xs text-fog">{song.genre} • {song.language}</p>
                          {song.audioUrl && <AudioPreview seed={`library-song:${song.id}:${song.title}`} sourceUrl={song.audioUrl} label={`Reproducir ${song.title}`} />}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: Panel de Auditoría y Cumplimiento */}
            <TabsContent value="audit" className="space-y-6">
              <Card className="premium-surface premium-interaction">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-mist flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-champagne" />
                    Panel de Auditoría y Trazabilidad Inmutable
                  </CardTitle>
                  <CardDescription className="text-fog">
                    Registro detallado de acciones, consentimientos biométricos y operaciones bajo rigor normativo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-white/10 overflow-hidden bg-obsidian">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-mist/80 font-mono">
                        <thead className="bg-ink text-fog border-b border-white/10 uppercase">
                          <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Acción</th>
                            <th className="p-3">Detalles</th>
                            <th className="p-3">IP Origen</th>
                            <th className="p-3">Fecha / Hora</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {auditLogs?.map((log) => (
                            <tr key={log.id} className="hover:bg-ink/50">
                              <td className="p-3">#{log.id}</td>
                              <td className="p-3 font-bold text-champagne">{log.action}</td>
                              <td className="p-3 text-mist">{log.details}</td>
                              <td className="p-3 text-fog">{log.ipAddress}</td>
                              <td className="p-3 text-fog">{new Date(log.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 6: Panel de Administración (Solo Admin) */}
            {user?.role === 'admin' && (
              <TabsContent value="admin" className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Card className="bg-ink border-white/10 p-6">
                    <p className="text-xs text-fog uppercase font-semibold">Usuarios Totales</p>
                    <p className="text-3xl font-extrabold text-champagne mt-2">{adminStats?.usersCount || 0}</p>
                  </Card>
                  <Card className="bg-ink border-white/10 p-6">
                    <p className="text-xs text-fog uppercase font-semibold">Canciones Generadas</p>
                    <p className="text-3xl font-extrabold text-champagne mt-2">{adminStats?.songsCount || 0}</p>
                  </Card>
                  <Card className="bg-ink border-white/10 p-6">
                    <p className="text-xs text-fog uppercase font-semibold">Voces Clonadas</p>
                    <p className="text-3xl font-extrabold text-champagne mt-2">{adminStats?.voicesCount || 0}</p>
                  </Card>
                  <Card className="bg-ink border-white/10 p-6">
                    <p className="text-xs text-fog uppercase font-semibold">Instrumentales</p>
                    <p className="text-3xl font-extrabold text-champagne mt-2">{adminStats?.instrumentalsCount || 0}</p>
                  </Card>
                </div>

                <Card className="premium-surface premium-interaction">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-mist">Gestión de Usuarios del Sistema</CardTitle>
                    <CardDescription className="text-fog">Listado de cuentas registradas en la plataforma corporativa.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border border-white/10 overflow-hidden bg-obsidian">
                      <table className="w-full text-left text-xs text-mist/80 font-mono">
                        <thead className="bg-ink text-fog border-b border-white/10 uppercase">
                          <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Nombre</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Rol</th>
                            <th className="p-3">Último Acceso</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {adminUsers?.map((u) => (
                            <tr key={u.id} className="hover:bg-ink/50">
                              <td className="p-3">#{u.id}</td>
                              <td className="p-3 font-bold text-mist">{u.name}</td>
                              <td className="p-3 text-fog">{u.email}</td>
                              <td className="p-3">
                                <Badge className={u.role === 'admin' ? 'bg-champagne/20 text-champagne' : 'bg-slate-premium text-mist/80'}>
                                  {u.role}
                                </Badge>
                              </td>
                              <td className="p-3 text-fog">{new Date(u.lastSignedIn).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        ) : (
          /* Landing Page Informativa para Visitantes no Autenticados */
          <div className="space-y-20 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="premium-surface premium-interaction p-6 space-y-4 hover:border-champagne/50">
                <div className="bg-champagne/10 p-3 rounded-xl w-fit text-champagne">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-mist">{t.songGeneratorTitle}</h3>
                <p className="text-sm text-fog leading-relaxed">{t.songGeneratorDesc}</p>
              </Card>

              <Card className="premium-surface premium-interaction p-6 space-y-4 hover:border-champagne/50">
                <div className="bg-champagne/10 p-3 rounded-xl w-fit text-champagne">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-mist">{t.voiceCloneTitle}</h3>
                <p className="text-sm text-fog leading-relaxed">{t.voiceCloneDesc}</p>
              </Card>

              <Card className="premium-surface premium-interaction p-6 space-y-4 hover:border-champagne/50">
                <div className="bg-champagne/10 p-3 rounded-xl w-fit text-champagne">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-mist">{t.auditTitle}</h3>
                <p className="text-sm text-fog leading-relaxed">{t.auditDesc}</p>
              </Card>
            </div>

            <div className="bg-gradient-to-r from-ink to-obsidian p-10 rounded-3xl border border-white/10 text-center space-y-6">
              <h3 className="text-3xl font-extrabold text-mist">¿Listo para Liderar la Industria Musical con Inteligencia Artificial?</h3>
              <p className="text-fog max-w-2xl mx-auto">
                Acceda ahora a la plataforma con autenticación segura y experimente el poder de la soberanía tecnológica corporativa.
              </p>
              <Button 
                size="lg" 
                onClick={() => startLogin()}
                className="bg-gradient-to-r from-champagne-soft to-champagne text-obsidian font-bold px-8 py-6 text-base shadow-xl shadow-champagne/20"
              >
                Acceder al Sistema
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs text-mist0 bg-obsidian">
        <p>{t.footerText}</p>
      </footer>
    </div>
  );
}
