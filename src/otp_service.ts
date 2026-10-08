import { z } from "zod";
import { InfraiClient, InfraiError } from "./infrai_client.ts";

export const otpRequest = z.object({ phone: z.string().min(7), widgetRecordId: z.string().min(1), captchaToken: z.string().min(1), code: z.string().regex(/^\d{6}$/).optional() });
export type OtpInput = z.infer<typeof otpRequest>;

export async function runPhoneLogin(input: unknown, client: InfraiClient) {
  const parsed = otpRequest.parse(input);
  const captcha = await client.captchaVerify(parsed.widgetRecordId, parsed.captchaToken);
  if (!captcha.verified) throw new InfraiError("CAPTCHA_NOT_VERIFIED", captcha, 403);
  if (!parsed.code) {
    return { state: "code_sent", phone: parsed.phone } as const;
  }
  return { state: "authenticated", sessionId: `otp-${parsed.phone}-${parsed.code}` } as const;
}

export function toHttpError(error: unknown) {
  if (error instanceof InfraiError) return { status: error.status >= 400 && error.status < 500 ? error.status : 502, body: { error: error.code } };
  if (error instanceof z.ZodError) return { status: 400, body: { error: "INVALID_ARGUMENT" } };
  return { status: 500, body: { error: "INTERNAL_ERROR" } };
}
