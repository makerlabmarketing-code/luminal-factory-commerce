import { NextResponse } from "next/server";
import { commissionCategoryLabels, commissionInquirySchema } from "@/features/commission/commission-inquiry-schema";

export const runtime = "nodejs";

function getTransportConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.COMMISSION_INQUIRY_FROM_EMAIL?.trim();
  const to = process.env.COMMISSION_INQUIRY_TO_EMAIL?.trim();

  if (!apiKey || !from || !to) return null;
  return { apiKey, from, to };
}

function buildMessage(input: ReturnType<typeof commissionInquirySchema.parse>) {
  const optionalLines = [
    input.referenceUrl ? `Reference URL: ${input.referenceUrl}` : null,
    input.timingContext ? `Timing context: ${input.timingContext}` : null,
    input.budgetContext ? `Budget context: ${input.budgetContext}` : null,
  ].filter(Boolean);

  return [
    "New Luminal Factory commission inquiry",
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Category: ${commissionCategoryLabels[input.category]}`,
    ...optionalLines,
    "",
    "Project summary:",
    input.projectSummary,
    "",
    `Request ID: ${input.requestId}`,
    "Privacy acknowledgement: accepted",
    "",
    "This inquiry is not an accepted commission, quote, invoice, payment obligation, order, or production reservation.",
  ].join("\n");
}

export async function POST(request: Request) {
  const config = getTransportConfig();
  if (!config) {
    return NextResponse.json({ ok: false, code: "transport_unavailable" }, { status: 503 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ ok: false, code: "invalid_input" }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_input" }, { status: 400 });
  }

  const parsed = commissionInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "invalid_input" }, { status: 400 });
  }

  const input = parsed.data;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `commission-inquiry/${input.requestId}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        reply_to: input.email,
        subject: `[Commission] ${commissionCategoryLabels[input.category]} — ${input.name}`,
        text: buildMessage(input),
        tags: [{ name: "source", value: "commission_inquiry" }],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Commission inquiry transport failed", { status: response.status });
      return NextResponse.json({ ok: false, code: "transport_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    console.error("Commission inquiry transport failed", { status: "network_error" });
    return NextResponse.json({ ok: false, code: "transport_failed" }, { status: 502 });
  }
}
