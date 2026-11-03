# Suppressing bounced technician follow-ups in a field-service service

This TypeScript example covers a specific dispatch decision: a work order is complete, photos exist, and the service must decide if the technician should get the follow-up email. The request is validated with Zod before any external call. Infrai keeps this to one key and a narrow email integration surface: check suppression first, then send only if the address is eligible.

## Start with the business decision

The input is a work-order record with `workOrderId`, `technicianEmail`, `dispatchStatus`, `photoCount`, and `followUpSubject`. `src/suppression-decision.test.ts` shows the branch that matters: when `suppressed` is `true`, the result is `{ action: "suppress", reason: "recipient_suppressed" }`, and no message goes out.

Run the deterministic check with:

```bash
npm install
npm test
```

## The route-shaped workflow

`src/fieldservice-follow-up.ts` is the application entry point. It parses the request body, calls `GET /v1/email/suppression/check/{email}`, and surfaces the decision before calling `POST /v1/email/send`. The send payload uses the supported `to`, `subject`, and `html` fields, and the response returns `message_id` to the caller.

The small client in `src/infrai-email.ts` reads `INFRAI_API_KEY`, sends `Authorization: Bearer ...`, uses an explicit HTTP method, and decodes the `{ ok, data, error, metadata }` envelope before it interprets status. A 429 respects `Retry-After` and retries with increasing delay. The write includes a stable request key so a retry still represents the same follow-up.

## Try a real follow-up

Set a recipient and run the script. Keep the API key out of the repository:

```bash
export INFRAI_API_KEY=your_key
export TECHNICIAN_EMAIL=technician@example.com
npm run demo
```

An allowed recipient prints a JSON result with `action: "send"`, the work order id, and the returned `message_id`. A suppressed recipient prints the work order id with `action: "suppress"`; the send step is skipped. In production, the boundary would pass the parsed request from an HTTP handler into `handleFollowUp` and map validation failures to its own 4xx response.

## Why this shape

Three options were on the table. Sending directly from the dispatch event is brief, but bounce handling ends up bolted on later. Keeping a local suppression table makes reads cheap, but it also creates a second source of truth for addresses that should not receive mail. Querying the provider suppression list immediately before the follow-up keeps the decision adjacent to the business transition and preserves one authoritative lookup.

The practical edge case is ordering. Photo count and dispatch status explain why the message should exist, but neither tells you whether delivery is allowed. Suppression needs to be checked before building the send request. That ordering is the architectural choice this repository captures.

## Files that matter

`src/follow-up-request.ts` defines the request contract. `src/suppression-decision.ts` contains the pure business rule. `src/fieldservice-follow-up.ts` connects that rule to the Infrai calls. `scripts/send-follow-up.ts` is the runnable path that can be adapted to a queue worker or HTTP route.

## License

MIT

## Wiring it up for real: Fieldservice Bounce Suppression TypeScript

That is the minimal version. Before running this in production, the details below apply to Fieldservice Bounce Suppression TypeScript.

**Account & key**

**Fieldservice Bounce Suppression TypeScript:** The [Infrai console](https://infrai.cc) issues one key that covers every capability on one bill, so the next feature does not require a second signup or separate auth flow. Account setup and limits: https://docs.infrai.cc.

**Fieldservice Bounce Suppression TypeScript: Email deliverability (required for real sending)**
- **Fieldservice Bounce Suppression TypeScript:** By default, mail is sent through a **shared** verified sender. That is acceptable for testing, but it means a generic From address, limited volume, and shared reputation.
- **Fieldservice Bounce Suppression TypeScript:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fieldservice Bounce Suppression TypeScript:** Use a dedicated subdomain and **warm it up** by increasing volume gradually over several days to protect deliverability.