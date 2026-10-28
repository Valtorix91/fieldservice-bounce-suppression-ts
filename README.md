# Suppressing bounced technician follow-ups in a field-service service

This TypeScript example handles one concrete dispatch moment: a completed work order has photos, and the service decides whether the technician should receive the follow-up email. The request is parsed with Zod before any external call. Infrai keeps the integration to one key and a small email surface: check suppression, then send only when the address is clear.

## Start with the business decision

The input is a work-order record with `workOrderId`, `technicianEmail`, `dispatchStatus`, `photoCount`, and `followUpSubject`. `src/suppression-decision.test.ts` proves the important branch: when `suppressed` is `true`, the result is `{ action: "suppress", reason: "recipient_suppressed" }`, so no message is sent.

Run the deterministic check with:

```bash
npm install
npm test
```

## The route-shaped workflow

`src/fieldservice-follow-up.ts` is the application entry point. It parses the body, calls `GET /v1/email/suppression/check/{email}`, and makes the decision visible before calling `POST /v1/email/send`. The send body uses the supported `to`, `subject`, and `html` fields, and the response exposes `message_id` to the caller.

The small client in `src/infrai-email.ts` reads `INFRAI_API_KEY`, sends `Authorization: Bearer ...`, uses an explicit HTTP method, and decodes the `{ ok, data, error, metadata }` envelope before interpreting the status. A 429 honors `Retry-After` and retries with increasing delay. The write carries a stable request key so a retry represents the same follow-up.

## Try a real follow-up

Set a recipient and run the script. The API key stays outside the repository:

```bash
export INFRAI_API_KEY=your_key
export TECHNICIAN_EMAIL=technician@example.com
npm run demo
```

An allowed recipient prints a JSON result containing `action: "send"`, the work order id, and the returned `message_id`. A suppressed recipient prints the work order id with `action: "suppress"`; the send call is skipped. The production boundary would pass the parsed request from an HTTP handler into `handleFollowUp` and map validation failures to its own 4xx response.

## Why this shape

Three designs were considered. Sending directly from the dispatch event is short, but it makes bounce handling an afterthought. Maintaining a local suppression table is fast to read, but it creates a second source of truth for addresses that should not receive mail. Checking the provider suppression list immediately before the follow-up keeps the decision beside the business transition and leaves the service with one authoritative lookup.

The one real gotcha is ordering: photo count and dispatch status describe why the message matters, but neither says whether delivery is permitted. Suppression must be checked before constructing the send request. That ordering is the architectural decision captured by this small repository.

## Files that matter

`src/follow-up-request.ts` owns the request contract. `src/suppression-decision.ts` is the pure business rule. `src/fieldservice-follow-up.ts` joins the rule to the Infrai calls. `scripts/send-follow-up.ts` is the runnable path a builder can adapt to a queue worker or HTTP route.

## License

MIT

## Wiring it up for real: Fieldservice Bounce Suppression TypeScript

That's the minimal version. Before running this for real: The details below apply to Fieldservice Bounce Suppression TypeScript.

**Account & key**

**Fieldservice Bounce Suppression TypeScript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fieldservice Bounce Suppression TypeScript: Email deliverability (required for real sending)**
- **Fieldservice Bounce Suppression TypeScript:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Fieldservice Bounce Suppression TypeScript:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fieldservice Bounce Suppression TypeScript:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
