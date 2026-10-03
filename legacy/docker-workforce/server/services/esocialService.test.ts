import { describe, expect, it } from "vitest";
import { createEsocialDraft, validateS1200, validateS2299, type S1200Payload, type S2299Payload } from "./esocialService";

const employer = { tpInsc: "1" as const, nrInsc: "12345678000195" };
const cpf = "52998224725";

const validS1200: S1200Payload = {
  evtRemun: {
    ideEvento: { indRetif: 1, perApur: "2026-07", tpAmb: 2, procEmi: 1, verProc: "docker-workforce-1.0.0" },
    ideEmpregador: employer,
    ideTrabalhador: { cpfTrab: cpf },
    dmDev: [{
      ideDmDev: "folha-2026-07-001",
      codCateg: 101,
      infoPerApur: {
        ideEstabLot: { tpInsc: "1", nrInsc: employer.nrInsc, codLotacao: "OPERACAO-01" },
        itensRemun: [{ codRubr: "SALARIO", ideTabRubr: "TAB-001", vrRubr: 2500, indApurIR: 0 }],
      },
    }],
  },
};

const validS2299: S2299Payload = {
  evtDeslig: {
    ideEvento: { indRetif: 1, tpAmb: 2, procEmi: 1, verProc: "docker-workforce-1.0.0" },
    ideEmpregador: employer,
    ideVinculo: { cpfTrab: cpf, matricula: "MAT-001" },
    infoDeslig: { dtDeslig: "2026-07-31", mtvDeslig: "02", indPagtoAPI: 1 },
  },
};

describe("eSocial adapter", () => {
  it("accepts a valid S-1200 draft but marks it validation-only", () => {
    expect(validateS1200(validS1200)).toEqual([]);
    const draft = createEsocialDraft("S-1200", validS1200);
    expect(draft.transmissionReady).toBe(false);
    expect(draft.transmissionBoundary).toBe("validation-only");
    expect(draft.schemaVersion).toBe("S-1.3");
  });

  it("rejects S-1200 with invalid CPF and missing remuneration items", () => {
    const issues = validateS1200({ ...validS1200, evtRemun: { ...validS1200.evtRemun, ideTrabalhador: { cpfTrab: "00000000000" }, dmDev: [] } });
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["invalid_cpf", "required"]));
  });

  it("accepts a valid S-2299 and rejects malformed dates", () => {
    expect(validateS2299(validS2299)).toEqual([]);
    const issues = validateS2299({ ...validS2299, evtDeslig: { ...validS2299.evtDeslig, infoDeslig: { ...validS2299.evtDeslig.infoDeslig, dtDeslig: "31/07/2026" } } });
    expect(issues[0]?.code).toBe("invalid_date");
  });
});
