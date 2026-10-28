import { InfraiEmail, infrai } from "./infrai-email.js";
import { parseFollowUpRequest } from "./follow-up-request.js";
import { decideFollowUp } from "./suppression-decision.js";

export async function handleFollowUp(body: unknown, client: InfraiEmail) {
  const input = parseFollowUpRequest(body);
  const suppression = await client.checkSuppression(input.technicianEmail);
  const decision = decideFollowUp(input, suppression.suppressed);
  if (decision.action === "suppress") return { ...decision, workOrderId: input.workOrderId };

  const sent = await infrai.email.send(client, {
    to: input.technicianEmail,
    subject: decision.subject,
    html: `<p>Work order ${input.workOrderId} is ${input.dispatchStatus}; ${input.photoCount} photo(s) are ready for your follow-up.</p>`
  });
  return { ...decision, workOrderId: input.workOrderId, message_id: sent.message_id };
}
