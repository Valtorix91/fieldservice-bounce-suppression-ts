import { InfraiEmail } from "../src/infrai-email.js";
import { handleFollowUp } from "../src/fieldservice-follow-up.js";

const key = process.env.INFRAI_API_KEY;
const email = process.env.TECHNICIAN_EMAIL;
if (!key || !email) throw new Error("INFRAI_API_KEY and TECHNICIAN_EMAIL are required");

const result = await handleFollowUp({
  workOrderId: process.env.WORK_ORDER_ID ?? "WO-1042",
  technicianEmail: email,
  dispatchStatus: "complete",
  photoCount: 3,
  followUpSubject: "Work-order photos ready"
}, new InfraiEmail(key));
console.log(JSON.stringify(result, null, 2));
