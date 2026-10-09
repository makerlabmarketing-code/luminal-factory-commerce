import { timingSafeEqual } from 'node:crypto';
import { processRaffleConfirmation } from '@/lib/supabase/raffle-confirmation-server';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request:Request) {
  const secret=process.env.RAFFLE_EMAIL_WORKER_SECRET;
  const received=request.headers.get('authorization')??'';
  const expected=`Bearer ${secret??''}`;
  const receivedBytes=Buffer.from(received),expectedBytes=Buffer.from(expected);
  if(!secret || secret.length<32 || receivedBytes.length!==expectedBytes.length || !timingSafeEqual(receivedBytes,expectedBytes))return Response.json({ok:false},{status:401,headers:{'Cache-Control':'no-store'}});
  const state=await processRaffleConfirmation();
  return Response.json({ok:state!=='unavailable',state},{status:state==='unavailable'?503:200,headers:{'Cache-Control':'private, no-store'}});
}
