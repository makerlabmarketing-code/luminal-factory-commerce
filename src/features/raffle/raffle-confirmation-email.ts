import { z } from 'zod';

export const confirmationPayloadSchema = z.object({
  entryId:z.uuid(), email:z.email().max(254), displayName:z.string().min(1).max(120),
  title:z.string().min(1).max(180), slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
});
export type ConfirmationPayload = z.infer<typeof confirmationPayloadSchema>;
const escapeHtml = (value:string) => value.replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!));
export function buildRaffleConfirmation(payload:ConfirmationPayload) {
  const title = payload.title.replace(/[\r\n]/g,' ');
  const url=`https://luminalfactory.com/vi/raffle/${payload.slug}`;
  const text=`Xin chào ${payload.displayName},\n\nLuminal Factory đã nhận đăng ký tham gia ${title} của bạn.\nMã đăng ký: ${payload.entryId}\n\nĐây là xác nhận tham gia, chưa phải xác nhận được chọn mua hoặc thanh toán. Kết quả và hướng dẫn tiếp theo sẽ được thông báo riêng.\n\nXem đợt raffle: ${url}\n\nLuminal Factory`;
  return {
    subject:`Đăng ký thành công · ${title} · Luminal Factory`, text,
    html:`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Xác nhận tham gia raffle</title></head><body style="margin:0;background:#f4f4f5;color:#18181b;font-family:Arial,sans-serif"><div style="max-width:560px;margin:24px auto;padding:28px;background:white"><p style="font-size:14px">LUMINAL FACTORY</p><h1 style="font-size:24px">Đã nhận đăng ký của bạn</h1><p style="font-size:16px;line-height:1.6">Xin chào ${escapeHtml(payload.displayName)},</p><p style="font-size:16px;line-height:1.6">Bạn đã đăng ký tham gia <strong>${escapeHtml(title)}</strong> thành công.</p><p style="font-size:16px;line-height:1.6;overflow-wrap:anywhere">Mã đăng ký: ${escapeHtml(payload.entryId)}</p><p style="font-size:16px;line-height:1.6">Đây là xác nhận tham gia, chưa phải xác nhận được chọn mua hoặc thanh toán. Kết quả và hướng dẫn tiếp theo sẽ được thông báo riêng.</p><p><a href="${url}" style="display:inline-block;background:#18181b;color:white;padding:16px 20px;text-decoration:none">Xem đợt raffle</a></p></div></body></html>`,
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
