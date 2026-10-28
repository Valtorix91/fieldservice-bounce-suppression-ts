import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFollowUpRequest } from "./follow-up-request.js";
import { decideFollowUp } from "./suppression-decision.js";

test("a suppressed technician does not receive a work-order follow-up", () => {
  const request = parseFollowUpRequest({
    workOrderId: "WO-1042",
    technicianEmail: "tech@example.com",
    dispatchStatus: "complete",
    photoCount: 3,
    followUpSubject: "WO-1042 photos ready"
  });
  assert.deepEqual(decideFollowUp(request, true), { action: "suppress", reason: "recipient_suppressed" });
});
