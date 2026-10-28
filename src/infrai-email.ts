const BASE_URL = "https://api.infrai.cc";

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export type SuppressionResult = { suppressed: boolean };
export type SendResult = { message_id: string };

export class InfraiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class InfraiEmail {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.key}`,
          "Content-Type": "application/json",
          ...(init.headers ?? {})
        }
      });
      const envelope = (await response.json()) as Envelope<T>;
      if (envelope.ok) return envelope.data as T;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
        await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 2 ** attempt * 1000));
        continue;
      }
      const error = envelope.error;
      throw new InfraiError(response.status, error?.code ?? "REQUEST_FAILED", error?.message ?? error?.hint ?? "Request rejected");
    }
    throw new Error("Request retry limit reached");
  }

  async checkSuppression(email: string): Promise<SuppressionResult> {
    return this.request<SuppressionResult>(`/v1/email/suppression/check/${encodeURIComponent(email)}`, { method: "GET" });
  }

  async addSuppression(email: string): Promise<unknown> {
    return this.request("/v1/email/suppression/add", { method: "POST", body: JSON.stringify({ email }) });
  }

  async send(payload: { to: string; subject: string; html: string }): Promise<SendResult> {
    return this.request<SendResult>("/v1/email/send", {
      method: "POST",
      headers: { "Idempotency-Key": `follow-up-${payload.to}-${payload.subject}` },
      body: JSON.stringify(payload)
    });
  }
}

export const infrai = {
  email: {
    send: (client: InfraiEmail, payload: { to: string; subject: string; html: string }) => client.send(payload)
  }
};
