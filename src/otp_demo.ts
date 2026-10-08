import { InfraiClient } from "./infrai_client.ts";
import { runPhoneLogin } from "./otp_service.ts";

const [phone, widgetRecordId, captchaToken, code] = process.argv.slice(2);
if (!phone || !widgetRecordId || !captchaToken) {
  console.error("Usage: npm start -- +15551234567 widget-record-id captcha-token [123456]");
  process.exit(1);
}
try {
  const result = await runPhoneLogin({ phone, widgetRecordId, captchaToken, code }, new InfraiClient());
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(JSON.stringify({ error: "phone login rejected", detail: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
}
