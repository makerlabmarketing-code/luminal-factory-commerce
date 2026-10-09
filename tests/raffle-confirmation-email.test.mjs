import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),mod={exports:{}};
new Function('require','module','exports',ts.transpileModule(readFileSync('src/features/raffle/raffle-confirmation-email.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(require,mod,mod.exports);
const {buildRaffleConfirmation,sendRaffleConfirmation,confirmationPayloadSchema}=mod.exports;
const payload={entryId:'550e8400-e29b-41d4-a716-446655440000',email:'guest@example.test',displayName:'<img src=x onerror=alert(1)>',title:'Comeback\r\nNew',slug:'comeback-2026'};
test('confirmation escapes customer input, strips subject newlines and says entry is not a win',()=>{
 const mail=buildRaffleConfirmation(payload);
 assert(!mail.html.includes('<img'));assert(mail.html.includes('&lt;img'));
 assert(!/[\r\n]/.test(mail.subject));assert(mail.text.includes('chưa phải xác nhận được chọn mua'));
 assert(!confirmationPayloadSchema.safeParse({...payload,slug:'//evil.test'}).success);
});
test('retries reuse the same provider key and send only the transactional recipient',async()=>{
 const requests=[];
 const fetcher=async(url,options)=>{requests.push({url,...options});return Response.json({id:'email-id'});};
 for(let i=0;i<2;i++)assert.equal((await sendRaffleConfirmation(payload,{apiKey:'test-key',from:'Luminal <notifications@luminalfactory.com>'},fetcher)).providerId,'email-id');
 assert.equal(requests[0].headers['Idempotency-Key'],requests[1].headers['Idempotency-Key']);
 assert.deepEqual(JSON.parse(requests[0].body).to,[payload.email]);
 assert.equal(requests[0].redirect,'error');assert.equal(requests[0].url,'https://api.resend.com/emails');
});
test('provider failures are classified without exposing credentials or provider messages',async()=>{
 for(const [status,retryable] of [[429,true],[500,true],[422,false],[401,false]]){
  const result=await sendRaffleConfirmation(payload,{apiKey:'secret',from:'sender'},async()=>new Response('private-provider-error',{status}));
  assert.equal(result.retryable,retryable);assert.equal(result.failureCode,`provider_http_${status}`);
  assert(!JSON.stringify(result).includes('secret'));
 }
 assert.equal((await sendRaffleConfirmation(payload,{apiKey:'secret',from:'sender'},async()=>{throw Error('network');})).retryable,true);
 assert.equal((await sendRaffleConfirmation(payload,{apiKey:'secret',from:'sender'},async()=>Response.json(null))).retryable,true);
});
