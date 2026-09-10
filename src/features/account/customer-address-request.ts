import "server-only";
import { z } from "zod";
import { getCustomerAuthEnvironment } from "@/features/auth/customer-auth-request";
import { customerAddressMutationSchema } from "@/features/account/customer-address-contract";
import {
  deleteCustomerAddress,
  listCustomerAddresses,
  saveCustomerAddress,
  setDefaultCustomerAddress,
} from "@/features/account/customer-address-server";

const MAX_BYTES = 4096;
const responseHeaders = { "Cache-Control": "private, no-store" };
const failure = (status: number, code: string) => Response.json({ ok: false, code }, { status, headers: responseHeaders });

export async function handleAddressRequest(request: Request): Promise<Response> {
  const environment = getCustomerAuthEnvironment();
  if (!environment.ready || process.env.COMMERCE_SAVED_ADDRESSES_ENABLED !== "true") {
    return failure(404, "unavailable");
  }

  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (
    request.method !== "GET" &&
    (!origin ||
      !environment.allowedOrigins.has(origin) ||
      (site !== null && site !== "same-origin") ||
      request.headers.get("x-luminal-address-request") !== "1" ||
      request.headers.get("content-type")?.split(";")[0] !== "application/json")
  ) {
    return failure(403, "invalid_request");
  }
  if (request.method === "GET" && origin && !environment.allowedOrigins.has(origin)) {
    return failure(403, "invalid_request");
  }

  try {
    if (request.method === "GET") {
      return Response.json({ ok: true, addresses: await listCustomerAddresses() }, { headers: responseHeaders });
    }
    if (request.method !== "POST") return failure(405, "invalid_request");

    const length = Number(request.headers.get("content-length") ?? "0");
    if (length > MAX_BYTES) return failure(413, "invalid_request");
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > MAX_BYTES) return failure(413, "invalid_request");

    const parsed: unknown = JSON.parse(text);
    const result = customerAddressMutationSchema.safeParse(parsed);
    if (!result.success) return failure(400, "invalid_request");

    const body = result.data;
    if (body.action === "create") await saveCustomerAddress(body.address);
    else if (body.action === "update") await saveCustomerAddress(body.address, body.id);
    else if (body.action === "delete") await deleteCustomerAddress(body.id);
    else await setDefaultCustomerAddress(body.id);

    return Response.json({ ok: true }, { headers: responseHeaders });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return failure(400, "invalid_request");
    return failure(503, "unavailable");
  }
}
