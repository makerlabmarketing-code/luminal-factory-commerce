import { z } from 'zod';

export const confirmationPayloadSchema = z.object({
  entryId:z.uuid(), email:z.email().max(254), displayName:z.string().min(1).max(120),
  title:z.string().min(1).max(180), slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
});
export type ConfirmationPayload = z.infer<typeof confirmationPayloadSchema>;
const escapeHtml = (value:string) => value.replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!));
export function buildRaffleConfirmation(payload: ConfirmationPayload) {
  const title = payload.title.replace(/[\r\n]/g, ' ').trim();
  const origin = "https://luminalfactory.com";
  const url = new URL(`/en/raffle/${payload.slug}`, origin).href;
  const heading = "Entry recorded";
  const greeting = `Hello ${payload.displayName},`;
  const confirmation = `We received your entry for ${title}.`;
  const outcome = "We'll email you the next steps if you're selected. This confirmation does not place an order or require payment.";
  const action = "View raffle";
  const logo = new URL("/brand/luminal-factory-email-mark.png", origin).href;
  const text = [
    heading, "", greeting, "", confirmation, `Entry reference: ${payload.entryId}`, "",
    outcome, "", `${action}: ${url}`, "", "Luminal Factory",
  ].join("\n");

  return {
    subject: `Entry confirmed | ${title} | Luminal Factory`,
    text,
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${heading} | Luminal Factory</title>
</head>
<body bgcolor="#0a080c" style="margin:0;padding:0;background:#0a080c;color:#f2ece6;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0a080c">
    <tr><td align="center" style="padding:24px 12px">
      <!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#171117" style="width:100%;max-width:560px;border:1px solid #634a35;background:#171117">
        <tr><td style="padding:20px 24px;border-bottom:1px solid #634a35">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td width="38"><img src="${logo}" width="32" height="32" alt="" style="display:block;border:0"></td>
              <td style="color:#f2ece6;font-size:12px;font-weight:bold;letter-spacing:2px">LUMINAL FACTORY</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:26px 24px;color:#f2ece6">
          <p style="margin:0 0 9px;color:#e5be88;font-size:11px;font-weight:bold;letter-spacing:2px">RAFFLE CONFIRMATION</p>
          <h1 style="margin:0 0 18px;color:#f2ece6;font-size:28px;line-height:1.2;font-weight:normal">${heading}</h1>
          <p style="margin:0 0 12px;color:#e4dbd5;font-size:15px;line-height:1.6">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 18px;color:#e4dbd5;font-size:15px;line-height:1.6">${escapeHtml(confirmation)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#251b22" style="border:1px solid #634a35">
            <tr><td style="padding:14px 16px">
              <p style="margin:0 0 6px;color:#e5be88;font-size:11px;font-weight:bold;letter-spacing:1px">ENTRY REFERENCE</p>
              <p style="margin:0;color:#f2ece6;font-size:14px;line-height:1.5;overflow-wrap:anywhere;word-break:break-word">${escapeHtml(payload.entryId)}</p>
            </td></tr>
          </table>
          <p style="margin:18px 0;color:#e4dbd5;font-size:15px;line-height:1.6">${outcome}</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td bgcolor="#f2ece6" style="border-radius:6px;mso-padding-alt:14px 18px">
              <a href="${url}" style="display:inline-block;padding:14px 18px;color:#171117;font-size:14px;font-weight:bold;text-decoration:none;mso-padding-alt:0">${action}</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`,
  };
}
export type ConfirmationSendResult = {providerId:string;retryable:false;failureCode:null} | {providerId:null;retryable:boolean;failureCode:string};
export async function sendRaffleConfirmation(payload:ConfirmationPayload,config:{apiKey:string;from:string},fetcher:typeof fetch=fetch):Promise<ConfirmationSendResult> {
  try {
    const response=await fetcher('https://api.resend.com/emails',{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(10_000),
      headers:{Authorization:`Bearer ${config.apiKey}`,'Content-Type':'application/json','Idempotency-Key':`raffle-entry-confirmation/${payload.entryId}`},
      body:JSON.stringify({from:config.from,to:[payload.email],...buildRaffleConfirmation(payload)}),
    });
    if(!response.ok)return {providerId:null,retryable:response.status===429 || response.status>=500,failureCode:`provider_http_${response.status}`};
    const result=await response.json();
    if(typeof result.id!=='string' || !result.id || result.id.length>128)return {providerId:null,retryable:true,failureCode:'invalid_provider_response'};
    return {providerId:result.id,retryable:false,failureCode:null};
  }catch {return {providerId:null,retryable:true,failureCode:'provider_network_error'};}
}
