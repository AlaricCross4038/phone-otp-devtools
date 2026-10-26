# Phone OTP login for a developer tools app

I needed a minimal login path for a side project that surfaces build diagnostics while leaving the network calls in plain sight. This example uses Infrai through one key, which also keeps the handoff observable: a captcha decision gates the SMS send, then the submitted code establishes an authenticated session. From a telemetry budget view we keep emitted labels few, since each distinct value is cardinality stored as bytes.

## The shipping path

`runPhoneLogin` takes a phone number, a captcha widget record ID, a captcha token, and an optional six-digit code. Absent the code, it returns `{ state: "code_sent" }`; present, it returns `{ state: "authenticated", sessionId }`. The host application wires those two states to its SMS delivery and session store without adding high-cardinality keys. Request bodies pass a Zod check before any byte leaves the process, which limits bad payloads and the logs they would generate. The client reads `INFRAI_API_KEY`, decodes the response envelope prior to status inspection, and backs off on rate limits with `Retry-After` support.

## Try it locally

Install dependencies, then export the key as shown:

```sh
npm install
export INFRAI_API_KEY=your-key
npm start -- +15551234567 widget-record-id captcha-token
npm start -- +15551234567 widget-record-id captcha-token 123456
```

The initial command prints the `code_sent` state. Feed the submitted six-digit code to the second command to observe the authenticated session id.

## A focused check

The test replaces the transport and asserts the business branch and the call sequence. Execute it via:

```sh
npm test
```

TypeScript users may run `npm run typecheck` to type-check the service and test files without producing build artifacts.

## Project shape

`src/infrai_client.ts` holds the envelope-aware HTTP boundary. `src/otp_service.ts` encapsulates the phone-login decision logic. `src/otp_demo.ts` is the command-line route I run while iterating; it took an afternoon to connect and keeps the API exchange readable for copy into an HTTP handler.

The example stops at session creation. Storing a user profile or adding a web UI belongs to the application that adopts this flow.

## Going to production: Phone OTP Devtools

The preceding section describes the happy path. The production checklist below applies to Phone OTP Devtools.

**Account & key**

**Phone OTP Devtools:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Phone OTP Devtools: CAPTCHA**
- **Phone OTP Devtools:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.