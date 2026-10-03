export type MessageChannel = "email" | "whatsapp";

export type DeliveryRequest = {
  channel: MessageChannel;
  to: string;
  subject?: string;
  body: string;
  idempotencyKey: string;
};

export type DeliveryResult = {
  status: "simulated" | "sent";
  providerMessageId: string;
};

/**
 * Safe default provider. It deliberately never calls a network service.
 * A real provider must implement the same contract with timeout, signed
 * webhooks, bounded retries and idempotency before production activation.
 */
export class SimulationMessagingProvider {
  async deliver(request: DeliveryRequest): Promise<DeliveryResult> {
    return {
      status: "simulated",
      providerMessageId: `sim_${request.channel}_${request.idempotencyKey}`,
    };
  }
}

export function getMessagingProvider() {
  return new SimulationMessagingProvider();
}
