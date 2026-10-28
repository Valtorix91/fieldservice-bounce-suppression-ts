import { z } from "zod";

export const followUpRequest = z.object({
  workOrderId: z.string().min(1),
  technicianEmail: z.string().email(),
  dispatchStatus: z.enum(["assigned", "en_route", "on_site", "complete"]),
  photoCount: z.number().int().min(0),
  followUpSubject: z.string().min(1)
});

export type FollowUpRequest = z.infer<typeof followUpRequest>;

export function parseFollowUpRequest(body: unknown): FollowUpRequest {
  return followUpRequest.parse(body);
}
