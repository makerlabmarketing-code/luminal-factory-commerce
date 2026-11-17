import { z } from 'zod';

export const confirmationPayloadSchema = z.object({
  entryId:z.uuid(), email:z.email().max(254), displayName:z.string().min(1).max(120),
  title:z.string().min(1).max(180), slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
});
export type ConfirmationPayload = z.infer<typeof confirmationPayloadSchema>;
const escapeHtml = (value:string) => value.replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!));
export function buildRaffleConfirmation(payload: ConfirmationPayload) {
  const title = payload.title.replace(/[\r\n]/g, ' ').trim();
  const url = `https://luminalfactory.com/en/raffle/${payload.slug}`;
  const name = escapeHtml(payload.displayName);
  const safeTitle = escapeHtml(title);
  const reference = escapeHtml(payload.entryId);
  const text = [
    `Hello ${payload.displayName},`,
    '',
    `Your entry for ${title} has been received by Luminal Factory.`,
    `Entry reference: ${payload.entryId}`,
    '',
    'Your entry is confirmed. This is not a winning notification or a purchase confirmation.',
    'If selected, you will receive a separate email with the next steps and payment deadline.',
    'Your shipping details have been saved for raffle fulfillment. Please contact Luminal Factory if they need updating.',
    '',
    `View the raffle: ${url}`,
    '',
    'Luminal Factory',
  ].join('\n');
  return {
    subject: `Entry confirmed | ${title} | Luminal Factory`,
    text,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Raffle entry confirmed</title></head><body style="margin:0;padding:24px 12px;background:#0b0c10;color:#f5f4fa;font-family:Arial,Helvetica,sans-serif"><div style="max-width:560px;margin:0 auto;border:1px solid #393441;background:#14121b"><div style="padding:28px 30px 20px;border-bottom:1px solid #393441"><p style="margin:0;font-size:12px;letter-spacing:3px;font-weight:700;color:#ded0f8">LUMINAL FACTORY</p><p style="margin:14px 0 0;font-size:12px;letter-spacing:2px;color:#b7abc6">RAFFLE ENTRY CONFIRMATION</p></div><div style="padding:30px"><h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;color:#fff">You're in the draw.</h1><p style="font-size:15px;line-height:1.7;color:#dedbe7">Hello ${name},</p><p style="font-size:15px;line-height:1.7;color:#dedbe7">We've received your entry for <strong style="color:#fff">${safeTitle}</strong>.</p><div style="padding:18px;margin:22px 0;background:#231e2c;border:1px solid #50415e"><p style="margin:0 0 8px;font-size:11px;letter-spacing:1px;color:#c8b7d9">ENTRY REFERENCE</p><p style="margin:0;font-size:14px;overflow-wrap:anywhere;color:#fff">${reference}</p></div><p style="font-size:15px;line-height:1.7;color:#dedbe7">Your entry is confirmed, but this does not mean you've won or placed an order. Winners will receive a separate email with next steps and the payment deadline.</p><p style="font-size:14px;line-height:1.7;color:#bbb3c7">Your shipping information has been securely recorded for fulfillment if selected. Need to update it? Contact Luminal Factory before shipping.</p><p style="margin:26px 0"><a href="${url}" style="display:inline-block;background:#e6d6ff;color:#1b1525;padding:14px 20px;font-size:13px;font-weight:700;text-decoration:none">VIEW RAFFLE</a></p></div><div style="padding:18px 30px;border-top:1px solid #393441;font-size:12px;color:#a9a0b4">Luminal Factory · Hand-finished objects with character</div></div></body></html>`,
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
