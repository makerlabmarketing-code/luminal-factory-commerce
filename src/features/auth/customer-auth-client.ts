import { z } from "zod";

const CUSTOMER_AUTH_REQUEST_HEADER = "x-luminal-auth-request";
const CUSTOMER_AUTH_REQUEST_HEADER_VALUE = "1";

const customerAuthResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    state: z.enum(["otp_sent", "authenticated", "signed_out"]),
  }).strict(),
  z.object({
    ok: z.literal(false),
    code: z.enum(["auth_unavailable", "invalid_request", "invalid_or_expired_otp", "rate_limited"]),
  }).strict(),
]);

export type CustomerAuthClientResponse = z.infer<typeof customerAuthResponseSchema>;

export type CustomerAuthClientRequest =
  | Readonly<{ action: "request_otp"; email: string; captchaToken: string }>
  | Readonly<{ action: "verify_otp"; email: string; token: string }>
  | Readonly<{ action: "sign_out" }>;

export async function submitCustomerAuthRequest(
  input: CustomerAuthClientRequest,
): Promise<CustomerAuthClientResponse> {
  try {
    const response = await fetch("/api/account/auth", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [CUSTOMER_AUTH_REQUEST_HEADER]: CUSTOMER_AUTH_REQUEST_HEADER_VALUE,
      },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    const body: unknown = await response.json();
    const parsed = customerAuthResponseSchema.safeParse(body);
    return parsed.success ? parsed.data : { ok: false, code: "auth_unavailable" };
  } catch {
    return { ok: false, code: "auth_unavailable" };
  }
}
