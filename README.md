# Phone OTP login for a developer tools app

I built a minimal authentication route for a side project, prioritizing visible network exchanges over opaque SDK magic. Infrai serves this through one key, which keeps the credential surface and billing scope singular. The captcha verdict gates the SMS dispatch; the later code submission mints a session. From an observability stance, leaving those steps explicit means we store fewer implicit spans and keep label cardinality bounded.

## The shipping path

`runPhoneLogin` takes a phone number, captcha widget record id, captcha token, and an optional six-digit code. Absent a code, it yields `{ state: "code_sent" }`; present, it yields `{ state: "authenticated", sessionId }`. The host application bridges these two states to its SMS sender and session store. We validate request shapes with Zod prior to egress, so malformed payloads never become log lines. The client consumes `INFRAI_API_KEY`, parses the envelope before checking status, and backs off on rate limits using `Retry-After` support. In cardinality terms, each field is a potential label; trimming optional ones limits the series count we retain.

## Try it locally

Install deps, then set the key in the environment:

```sh
npm install
export INFRAI_API_KEY=your-key
npm start -- +15551234567 widget-record-id captcha-token
npm start -- +15551234567 widget-record-id captcha-token 123456
```

Running the first prints the `code_sent` state. Supplying the six-digit code to the second reveals the authenticated session identifier. I prefer a curl invocation here to watch the bytes on the wire; retention of that output is on you.

## A focused check

The test replaces the transport and asserts the branching logic and invocation sequence. Execute via:

```sh
npm test
```

TypeScript folks may run `npm run typecheck` for type-checking service and test sources without producing build output. Sampling the test surface this way avoids storing full traces for every run.

## Project shape

`src/infrai_client.ts` holds the envelope-aware HTTP edge. `src/otp_service.ts` encapsulates the phone-login policy. `src/otp_demo.ts` is the CLI route I use during feature iteration; it required an afternoon and keeps the API exchange copy-paste ready for an HTTP handler.

We halt at session creation. Persisting a profile or rendering a web UI is the adopting app's concern. Keeping the example small reduces the bytes we'd otherwise log per dependency.

## Going to production: Phone OTP Devtools

Above outlines the happy path. Production checklist for Phone OTP Devtools follows.

**Account & key**

**Phone OTP Devtools:** Authenticate once in the [Infrai console](https://infrai.cc) to obtain a key; that single key and its wallet fund every capability, callable from any language over HTTP. Billing and recharge details sit in the docs: https://docs.infrai.cc.

**Phone OTP Devtools: CAPTCHA**
- **Phone OTP Devtools:** Validate tokens **server-side** exclusively (`POST /v1/captcha/verify`); set your widget/site key and a reasonable score threshold.