import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Language = "pt-BR" | "en";

type Dictionary = {
  access: string;
  platform: string;
  operations: string;
  protectedAccess: string;
  signIn: string;
  dashboard: string;
  schedule: string;
  compliance: string;
  employees: string;
  payroll: string;
  audit: string;
  overview: string;
  language: string;
  signalBoard: string;
  operationAtAGlance: string;
  tenantOnlyData: string;
  liveChannel: string;
  criticalProtocol: string;
  confirmationBeforePublishing: string;
  sensitiveOperations: string;
  ledgerAvailable: string;
  synced: string;
  noData: string;
  monitored: string;
  waiting: string;
  ledgerActive: string;
  reviewCompliance: string;
  operationalView: string;
};

const dictionaries: Record<Language, Dictionary> = {
  "pt-BR": {
    access: "Acessar plataforma",
    platform: "Plataforma",
    operations: "Para operações",
    protectedAccess: "Acesso protegido",
    signIn: "Entrar / Sign in",
    dashboard: "Command Center",
    schedule: "Escalas",
    compliance: "Compliance",
    employees: "Colaboradores",
    payroll: "Pré-folha",
    audit: "Auditoria",
    overview: "Visão geral",
    language: "Idioma",
    signalBoard: "Painel de sinal",
    operationAtAGlance: "Operação em uma leitura",
    tenantOnlyData: "O command center mostra apenas dados do tenant autenticado.",
    liveChannel: "Canal ao vivo",
    criticalProtocol: "Protocolo crítico",
    confirmationBeforePublishing: "Confirmação antes de publicar.",
    sensitiveOperations: "Operações sensíveis devem ser validadas e registradas antes de alterarem a escala ou a pré-folha.",
    ledgerAvailable: "Ledger disponível",
    synced: "Sincronizadas",
    noData: "Sem dados",
    monitored: "Monitorado",
    waiting: "Aguardando",
    ledgerActive: "Ledger ativo",
    reviewCompliance: "Revisar compliance",
    operationalView: "Visão operacional",
  },
  en: {
    access: "Access platform",
    platform: "Platform",
    operations: "For operations",
    protectedAccess: "Protected access",
    signIn: "Sign in",
    dashboard: "Command Center",
    schedule: "Schedules",
    compliance: "Compliance",
    employees: "Employees",
    payroll: "Pre-payroll",
    audit: "Audit",
    overview: "Overview",
    language: "Language",
    signalBoard: "Signal board",
    operationAtAGlance: "Operations at a glance",
    tenantOnlyData: "The command center shows only data from the authenticated tenant.",
    liveChannel: "Live channel",
    criticalProtocol: "Critical protocol",
    confirmationBeforePublishing: "Confirmation before publishing.",
    sensitiveOperations: "Sensitive operations must be validated and recorded before changing schedules or pre-payroll.",
    ledgerAvailable: "Ledger available",
    synced: "Synced",
    noData: "No data",
    monitored: "Monitored",
    waiting: "Waiting",
    ledgerActive: "Ledger active",
    reviewCompliance: "Review compliance",
    operationalView: "Operational view",
  },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("docker-workforce-language");
    return saved === "en" ? "en" : "pt-BR";
  });

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: (next) => {
      setLanguage(next);
      localStorage.setItem("docker-workforce-language", next);
    },
    toggleLanguage: () => {
      const next = language === "pt-BR" ? "en" : "pt-BR";
      setLanguage(next);
      localStorage.setItem("docker-workforce-language", next);
    },
    t: dictionaries[language],
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
