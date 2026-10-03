interface LLMResponse {
  choices: Array<{ message: { content: string } }>;
}

export class LLMService {
  private apiUrl = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";
  private apiKey = process.env.OPENROUTER_API_KEY || "";
  private model = "meta-llama/llama-3.1-8b-instruct:free";

  async validateLegalQuery(userQuery: string, legalContext: string): Promise<string> {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const payload = {
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "Você é um auditor de conformidade trabalhista brasileira. Considere CLT, LGPD e eSocial; trate S-1200 e S-2299 como integrações que exigem validação de leiautes e regras oficiais vigentes. Não invente requisitos e sinalize quando a validação jurídica ou fiscal externa for necessária.",
        },
        {
          role: "user",
          content: `Contexto Legal: ${legalContext}\n\nPregunta: ${userQuery}`,
        },
      ],
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`LLM request failed with status ${response.status}`);
      }
      const data = (await response.json()) as LLMResponse;
      return data.choices[0]?.message?.content || "No response";
    } catch (error) {
      console.error("LLM Service error:", error);
      throw error;
    }
  }

  async generateComplianceReport(shifts: any[], employees: any[]): Promise<string> {
    const context = `
      Turnos: ${JSON.stringify(shifts.slice(0, 3))}
      Empleados: ${JSON.stringify(employees.slice(0, 3))}
    `;

    return this.validateLegalQuery(
      "Genera un resumen de cumplimiento legal de estos turnos",
      context
    );
  }

  async validateShiftCompliance(shift: any, employee: any): Promise<boolean> {
    const context = `
      Turno: ${JSON.stringify(shift)}
      Empleado: ${JSON.stringify(employee)}
    `;

    const response = await this.validateLegalQuery(
      "Este turno parece cumprir as regras brasileiras configuradas de descanso, jornada e trabalho noturno? Separe regras internas de requisitos legais e indique incertezas.",
      context
    );

    return response.toLowerCase().includes("sí") || response.toLowerCase().includes("cumple");
  }
}

export const llmService = new LLMService();
