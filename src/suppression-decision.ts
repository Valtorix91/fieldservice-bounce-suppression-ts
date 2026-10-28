import type { FollowUpRequest } from "./follow-up-request.js";

export type FollowUpDecision =
  | { action: "send"; reason: "recipient_allowed"; subject: string }
  | { action: "suppress"; reason: "recipient_suppressed" };

export function decideFollowUp(input: FollowUpRequest, suppressed: boolean): FollowUpDecision {
  if (suppressed) return { action: "suppress", reason: "recipient_suppressed" };
  return { action: "send", reason: "recipient_allowed", subject: input.followUpSubject };
}
