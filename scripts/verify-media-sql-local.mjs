// Offline PostgreSQL fixture. Never connects to a hosted database.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
if (!process.env.PGLITE_MODULE) throw new Error('Set PGLITE_MODULE to the local PGlite module.');
const { PGlite } = await import(pathToFileURL(resolve(process.env.PGLITE_MODULE)).href);
const db = new PGlite();
const root='supabase/drafts/catalog-media/';const read=n=>readFileSync(root+n+'.sql','utf8');
const product='550e8400-e29b-41d4-a716-446655440000';const other='550e8400-e29b-41d4-a716-446655440010';const variant='550e8400-e29b-41d4-a716-446655440020';const id='550e8400-e29b-41d4-a716-446655440030';
const asset={id,path:`${product}/product/${id}.webp`,fileName:'test.webp',sizeBytes:400,width:100,height:100,alt:'Photo',removed:false};
let n=100;const op=()=>`550e8400-e29b-41d4-a716-${String(n++).padStart(12,'0')}`;
const save=(action,revision,payload,operation=op(),pid=product,vid=null)=>db.query('select public.save_catalog_media_draft($1,$2,$3,$4,$5,$6,$7,$8) result',[pid,vid,action,operation,'local-test','8'.repeat(64),revision,JSON.stringify(payload)]).then(r=>r.rows[0].result);
const get=(pid=product,vid=null)=>db.query('select public.read_catalog_media_draft($1,$2) result',[pid,vid]).then(r=>r.rows[0].result);
const rejected=(p,c)=>assert.rejects(p,e=>e.code===c);
try {
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema private;create schema storage;
 grant usage on schema public,private,storage to service_role;
 create table public.products(id uuid primary key,status text,name text);
 create table public.product_variants(product_id uuid references public.products,id uuid primary key,is_active boolean,unique(product_id,id));
 grant all on public.products,public.product_variants to service_role;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 insert into public.products values('${product}','draft','Original'),('${other}','draft','Other');
 insert into public.product_variants values('${product}','${variant}',false);`);
 await db.exec(read('forward'));await db.exec(read('validation'));await db.exec('set role service_role');
 assert.equal((await get()).revision,0);assert.deepEqual((await get()).assets,[]);
 const firstOp=op();const first=await save('append',0,{asset},firstOp);assert.equal(first.revision,1);assert.equal(first.primaryId,id);
 assert.deepEqual(await save('append',0,{asset},firstOp),first);
 await rejected(save('append',0,{asset}), '40001');
 await rejected(save('append',0,{asset:{...asset,alt:'Different'}},firstOp),'22023');
 await rejected(save('append',0,{asset},op(),other,variant),'P0002');
 for(const broken of [{...asset,path:'outside.webp'},{...asset,width:3000},{...asset,removed:true},{...asset,unexpected:1}]) await rejected(save('append',1,{asset:broken}),'22023');
 await rejected(save('update',1,{assets:[],primaryId:null}),'22023');
 const removed=await save('update',1,{assets:[{id,alt:'Changed',removed:true}],primaryId:null});assert.equal(removed.revision,2);assert.equal(removed.assets[0].removed,true);
 const restored=await save('update',2,{assets:[{id,alt:'Photo',removed:false}],primaryId:id});assert.equal(restored.revision,3);assert.equal(restored.assets[0].removed,false);
 await rejected(save('update',3,{assets:[{id,alt:'Photo',removed:false}],primaryId:null}),'22023');
 assert.deepEqual(await save('append',0,{asset},firstOp),first);
 const variantAsset={...asset,path:`${product}/${variant}/${id}.webp`};assert.equal((await save('append',0,{asset:variantAsset},op(),product,variant)).variantId,variant);
 await db.exec('reset role');assert.equal((await db.query('select name from public.products where id=$1',[product])).rows[0].name,'Original');
 for(const role of ['anon','authenticated']) {
  await db.exec('set role '+role);await rejected(get(),'42501');await rejected(save('append',0,{asset}),'42501');await rejected(db.query('select * from public.catalog_media_drafts'),'42501');await rejected(db.query('select * from private.catalog_media_receipts'),'42501');await db.exec('reset role');
 }
 await db.query("update public.products set status='published' where id=$1",[product]);await db.exec('set role service_role');await rejected(save('update',3,{assets:[{id,alt:'Photo',removed:false}],primaryId:id}),'22023');await db.exec('reset role');
 assert.equal((await db.query("select public from storage.buckets where id='catalog-media-drafts'")).rows[0].public,false);
 const count=(await db.query('select count(*)::int n from public.catalog_media_drafts')).rows[0].n;
 await db.exec(read('rollback'));assert.equal((await db.query('select count(*)::int n from public.catalog_media_drafts')).rows[0].n,count);await db.exec('set role service_role');await rejected(get(),'42501');
 console.log('PASS: offline PG manifest, replay, stale revisions, wrong parent, path/size/pixel validation, cover invariants, reversible removal/restore, browser denial, published guard and data-preserving rollback.');
} finally { await db.close(); }
