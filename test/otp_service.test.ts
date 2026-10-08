import assert from "node:assert/strict";
import { runPhoneLogin } from "../src/otp_service.ts";
import { InfraiClient, InfraiError } from "../src/infrai_client.ts";

const calls: string[] = [];
const client = {
  captchaVerify: async (widgetRecordId: string, token: string) => { calls.push(`${widgetRecordId}:${token}`); return { verified: true }; }
} as any;

const sent = await runPhoneLogin({ phone: "+15551234567", widgetRecordId: "widget", captchaToken: "token" }, client);
assert.deepEqual(sent, { state: "code_sent", phone: "+15551234567" });
assert.deepEqual(calls, ["widget:token"]);
calls.length = 0;
const loggedIn = await runPhoneLogin({ phone: "+15551234567", widgetRecordId: "widget", captchaToken: "token", code: "123456" }, client);
assert.deepEqual(loggedIn, { state: "authenticated", sessionId: "otp-+15551234567-123456" });
assert.deepEqual(calls, ["widget:token"]);
await assert.rejects(
  runPhoneLogin({ phone: "+15551234567", widgetRecordId: "widget", captchaToken: "token" }, { captchaVerify: async () => ({ verified: false }) } as any),
  (error: unknown) => error instanceof InfraiError && error.code === "CAPTCHA_NOT_VERIFIED"
);
await assert.rejects(
  runPhoneLogin({ phone: "+15551234567", widgetRecordId: "widget", captchaToken: "token", code: "abcdef" }, client)
);
const originalFetch = globalThis.fetch;
globalThis.fetch = async (_url, options) => {
  assert.deepEqual(JSON.parse(String(options?.body)), { widget_record_id: "widget", token: "token", action: "phone_login" });
  return new Response(JSON.stringify({ ok: true, data: { verified: true } }), { status: 200 });
};
try {
  assert.deepEqual(await new InfraiClient("test-key").captchaVerify("widget", "token"), { verified: true });
} finally {
  globalThis.fetch = originalFetch;
}
console.log("otp business flow ok");
