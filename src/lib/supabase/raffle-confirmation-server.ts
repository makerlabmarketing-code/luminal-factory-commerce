import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { confirmationPayloadSchema, sendRaffleConfirmation } from '@/features/raffle/raffle-confirmation-email';

const claimedSchema=z.object({entry_id:z.uuid(),lease_token:z.uuid(),payload:confirmationPayloadSchema,attempts:z.number().int().min(1).max(5)});
export async function processRaffleConfirmation(entryId?:string):Promise<'disabled'|'idle'|'sent'|'pending'|'failed'|'unavailable'> {
  if(process.env.COMMERCE_RAFFLE_CONFIRMATION_ENABLED!=='true')return 'disabled';
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),secret=process.env.SUPABASE_SECRET_KEY?.trim();
  const apiKey=process.env.RESEND_API_KEY?.trim(),from=process.env.RAFFLE_CONFIRMATION_FROM?.trim();
  if(!url||!secret||!apiKey||!from||!/@luminalfactory\.com>$/.test(from))return 'unavailable';
  if(entryId && !z.uuid().safeParse(entryId).success)return 'unavailable';
  const client=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  try {
    const claimed=await client.rpc('claim_raffle_entry_confirmations',{p_entry_id:entryId??null});
    if(claimed.error || !Array.isArray(claimed.data))return 'unavailable';
    if(!claimed.data.length)return 'idle';
    const parsed=claimedSchema.safeParse(claimed.data[0]);
    if(!parsed.success || parsed.data.entry_id!==parsed.data.payload.entryId)return 'unavailable';
    const job=parsed.data;
    const sent=await sendRaffleConfirmation(job.payload,{apiKey,from});
    const finished=await client.rpc('finish_raffle_entry_confirmation',{p_entry_id:job.entry_id,p_lease_token:job.lease_token,p_provider_id:sent.providerId,p_retryable:sent.retryable,p_failure_code:sent.failureCode});
    if(finished.error || finished.data!==true)return 'unavailable';
    return sent.providerId ? 'sent' : sent.retryable && job.attempts<5 ? 'pending' : 'failed';
  }catch{return 'unavailable';}
}
