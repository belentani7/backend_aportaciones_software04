import { createHash } from "node:crypto";

export const ESOCIAL_SOURCES = {
  portal: "https://www.gov.br/esocial/pt-br/documentacao-tecnica",
  manual: "https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/mos-s-1-3-consolidada-ate-a-no-s-1-3-07-2026.pdf",
  version: "S-1.3",
  manualSnapshot: "MOS S-1.3 consolidado até a NO S-1.3 07/2026",
} as const;

export type EsocialEnvironment = "production" | "restricted";
export type EsocialEventType = "S-1200" | "S-2299";

export interface EmployerIdentity {
  tpInsc: "1" | "2";
  nrInsc: string;
}

export interface EsocialValidationIssue {
  path: string;
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface EsocialDraft<TPayload extends Record<string, unknown>> {
  eventType: EsocialEventType;
  schemaVersion: typeof ESOCIAL_SOURCES.version;
  environment: EsocialEnvironment;
  generatedAt: string;
  payload: TPayload;
  payloadDigest: string;
  transmissionReady: false;
  transmissionBoundary: "validation-only";
}

export interface S1200Payload extends Record<string, unknown> {
  evtRemun: {
    ideEvento: {
      indRetif: 1 | 2;
      nrRecibo?: string;
      perApur: string;
      tpAmb: 1 | 2;
      procEmi: number;
      verProc: string;
    };
    ideEmpregador: EmployerIdentity;
    ideTrabalhador: { cpfTrab: string };
    dmDev: Array<{
      ideDmDev: string;
      codCateg: number;
      infoPerApur: {
        ideEstabLot: { tpInsc: "1" | "2"; nrInsc: string; codLotacao: string };
        itensRemun: Array<{
          codRubr: string;
          ideTabRubr: string;
          qtdRubr?: number;
          fatorRubr?: number;
          vrRubr: number;
          indApurIR?: 0 | 1 | 2;
        }>;
      };
    }>;
  };
}

export interface S2299Payload extends Record<string, unknown> {
  evtDeslig: {
    ideEvento: {
      indRetif: 1 | 2;
      nrRecibo?: string;
      tpAmb: 1 | 2;
      procEmi: number;
      verProc: string;
    };
    ideEmpregador: EmployerIdentity;
    ideVinculo: { cpfTrab: string; matricula?: string };
    infoDeslig: {
      dtDeslig: string;
      mtvDeslig: string;
      tpAmb: 1 | 2;
      indPagtoAPI: 1 | 2;
      dtProjFimAPI?: string;
      pensAlim?: 0 | 1 | 2 | 3;
    };
  };
}

function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let index = 0; index < 9; index++) sum += Number(digits[index]) * (10 - index);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(digits[9])) return false;
  sum = 0;
  for (let index = 0; index < 10; index++) sum += Number(digits[index]) * (11 - index);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === Number(digits[10]);
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function baseIssues(payload: Record<string, unknown>): EsocialValidationIssue[] {
  const issues: EsocialValidationIssue[] = [];
  if (!payload || typeof payload !== "object") issues.push({ path: "payload", code: "required", message: "O payload do evento é obrigatório.", severity: "error" });
  return issues;
}

export function validateS1200(payload: S1200Payload): EsocialValidationIssue[] {
  const issues = baseIssues(payload);
  const event = payload?.evtRemun;
  if (!event) return [...issues, { path: "evtRemun", code: "required", message: "evtRemun é obrigatório.", severity: "error" }];
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(event.ideEvento?.perApur ?? "")) issues.push({ path: "evtRemun.ideEvento.perApur", code: "invalid_competence", message: "perApur deve estar no formato AAAA-MM.", severity: "error" });
  if (!event.ideEmpregador?.nrInsc) issues.push({ path: "evtRemun.ideEmpregador.nrInsc", code: "required", message: "A inscrição do empregador é obrigatória.", severity: "error" });
  if (!isValidCpf(event.ideTrabalhador?.cpfTrab ?? "")) issues.push({ path: "evtRemun.ideTrabalhador.cpfTrab", code: "invalid_cpf", message: "CPF do trabalhador inválido.", severity: "error" });
  if (!Array.isArray(event.dmDev) || event.dmDev.length === 0) issues.push({ path: "evtRemun.dmDev", code: "required", message: "Ao menos um demonstrativo de valores deve ser informado.", severity: "error" });
  for (const [index, item] of (event.dmDev ?? []).entries()) {
    if (item?.codCateg === undefined) issues.push({ path: `evtRemun.dmDev[${index}].codCateg`, code: "required", message: "Categoria do trabalhador obrigatória.", severity: "error" });
    if (!item?.infoPerApur?.ideEstabLot?.codLotacao) issues.push({ path: `evtRemun.dmDev[${index}].infoPerApur.ideEstabLot.codLotacao`, code: "required", message: "Lotação tributária obrigatória.", severity: "error" });
    if (!Array.isArray(item?.infoPerApur?.itensRemun) || item.infoPerApur.itensRemun.length === 0) issues.push({ path: `evtRemun.dmDev[${index}].infoPerApur.itensRemun`, code: "required", message: "Ao menos uma rubrica deve ser informada.", severity: "error" });
  }
  return issues;
}

export function validateS2299(payload: S2299Payload): EsocialValidationIssue[] {
  const issues = baseIssues(payload);
  const event = payload?.evtDeslig;
  if (!event) return [...issues, { path: "evtDeslig", code: "required", message: "evtDeslig é obrigatório.", severity: "error" }];
  if (!event.ideEmpregador?.nrInsc) issues.push({ path: "evtDeslig.ideEmpregador.nrInsc", code: "required", message: "A inscrição do empregador é obrigatória.", severity: "error" });
  if (!isValidCpf(event.ideVinculo?.cpfTrab ?? "")) issues.push({ path: "evtDeslig.ideVinculo.cpfTrab", code: "invalid_cpf", message: "CPF do trabalhador inválido.", severity: "error" });
  if (!isValidDate(event.infoDeslig?.dtDeslig ?? "")) issues.push({ path: "evtDeslig.infoDeslig.dtDeslig", code: "invalid_date", message: "A data de desligamento deve estar no formato AAAA-MM-DD.", severity: "error" });
  if (!event.infoDeslig?.mtvDeslig) issues.push({ path: "evtDeslig.infoDeslig.mtvDeslig", code: "required", message: "Motivo do desligamento obrigatório.", severity: "error" });
  if (event.infoDeslig?.indPagtoAPI === undefined) issues.push({ path: "evtDeslig.infoDeslig.indPagtoAPI", code: "required", message: "Indicador de pagamento após desligamento obrigatório.", severity: "error" });
  return issues;
}

export function createEsocialDraft<TPayload extends Record<string, unknown>>(eventType: EsocialEventType, payload: TPayload, environment: EsocialEnvironment = "restricted"): EsocialDraft<TPayload> {
  const issues = eventType === "S-1200"
    ? validateS1200(payload as unknown as S1200Payload)
    : validateS2299(payload as unknown as S2299Payload);
  if (issues.some((issue) => issue.severity === "error")) {
    throw new Error(`Invalid ${eventType} payload: ${issues.map((issue) => `${issue.path}:${issue.code}`).join(",")}`);
  }
  const canonical = JSON.stringify(payload);
  return {
    eventType,
    schemaVersion: ESOCIAL_SOURCES.version,
    environment,
    generatedAt: new Date().toISOString(),
    payload,
    payloadDigest: createHash("sha256").update(canonical).digest("hex"),
    transmissionReady: false,
    transmissionBoundary: "validation-only",
  };
}
