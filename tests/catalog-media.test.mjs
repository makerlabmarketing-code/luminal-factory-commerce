import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function load(path,deps={},append='') {const compiled={exports:{}};const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;new Function('require','module','exports',code+append)(k=>deps[k]??require(k),compiled,compiled.exports);return compiled.exports;}
const contract=load('src/features/management/catalog-media-contract.ts');
const pid='550e8400-e29b-41d4-a716-446655440000';const vid='550e8400-e29b-41d4-a716-446655440001';const aid='550e8400-e29b-41d4-a716-446655440002';
const target={productId:pid,variantId:null};const asset={id:aid,path:contract.mediaPath(target,aid),fileName:'test.webp',sizeBytes:100,width:10,height:10,alt:'Photo',removed:false};
const manifest={...target,revision:1,assets:[asset],primaryId:aid};
test('media contracts reject wrong parent paths, invalid cover, duplicate IDs and excess active images',()=>{
 assert.equal(contract.mediaManifestSchema.safeParse(manifest).success,true);
 const tooMany=Array.from({length:21},(_,i)=>{const id=`550e8400-e29b-41d4-a716-${String(300+i).padStart(12,'0')}`;return {...asset,id,path:contract.mediaPath(target,id)};});
 assert.equal(contract.mediaManifestSchema.safeParse({...manifest,assets:tooMany,primaryId:tooMany[0].id}).success,false);
 for(const row of [{...manifest,primaryId:null},{...manifest,assets:[asset,asset]},{...manifest,variantId:vid},{...manifest,assets:[{...asset,removed:true}]}])assert.equal(contract.mediaManifestSchema.safeParse(row).success,false);
 for(const bad of [{...asset,sizeBytes:2*1024*1024+1},{...asset,width:2049},{...asset,alt:'x'.repeat(501)},{...asset,fileName:'../test.webp'},{...asset,script:1}])assert.equal(contract.mediaAssetSchema.safeParse(bad).success,false);
});
test('signed media route denies before storage/RPC access and separates read/write scopes',async()=>{
 let allowed=false,calls=0;const scopes=[];
 class ServiceError extends Error{}
 const route=load('src/features/management/catalog-media-route.ts',{
  './catalog-media-contract':contract,'./catalog-raffle-admin-service':{CatalogRaffleAdminServiceError:ServiceError},
  './catalog-media-service':{readMediaManifest:async()=>{calls++;return manifest;},presentMedia:async(_c,m)=>m,saveMedia:async()=>{calls++;return manifest;},createMediaTicket:async()=>{calls++;return {}; }},
  './commerce-admin-route-runtime':{authorizeCommerceAdminRoute:async(_r,s)=>{scopes.push(s);return allowed?{identity:{requestId:aid,clientId:'erp'},requestFingerprint:'8'.repeat(64),rawBodyText:'{}'}:new Response(null,{status:401});},commerceAdminSuccess:d=>Response.json(d),commerceAdminFailure:(_id,s)=>new Response(null,{status:s}),recordCommerceAdminAudit:async()=>{},parseCommerceAdminJson:JSON.parse},
 });
 assert.equal((await route.handleCatalogMedia(new Request('https://test'),Promise.resolve({id:pid}))).status,401);assert.equal(calls,0);
 allowed=true;assert.equal((await route.handleCatalogMedia(new Request('https://test'),Promise.resolve({id:pid}))).status,200);assert.equal(calls,1);
 assert.equal((await route.handleCatalogMedia(new Request('https://test',{method:'POST'}),Promise.resolve({id:pid}))).status,400);assert.equal(calls,1);
 assert.deepEqual(scopes,[['commerce.product.read'],['commerce.product.read'],['commerce.product.write']]);
});
test('catalog media service verifies real WebP bytes and rejects non-draft attachment',async()=>{
 class ServiceError extends Error{constructor(code,message){super(message);this.code=code;}}
 const service=load('src/features/management/catalog-media-service.ts',{'server-only':{},'./catalog-media-contract':contract,'./catalog-raffle-admin-service':{CatalogRaffleAdminServiceError:ServiceError}});
 const sharp=require('sharp');const bytes=await sharp({create:{width:10,height:10,channels:3,background:'#123'}}).webp().toBuffer();const good={...asset,sizeBytes:bytes.length};let saved=0,status='draft',blob=new Blob([bytes]);
 const client={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{status},error:null})})})}),storage:{from:()=>({download:async()=>({data:blob,error:null})})},rpc:async()=>{saved++;return {data:{...manifest,assets:[good]},error:null};}};
 const input={operationId:aid,expectedRevision:0,asset:good};const identity={clientId:'erp',requestFingerprint:'8'.repeat(64)};
 assert.equal((await service.saveMedia(client,target,'append',input,identity)).revision,1);assert.equal(saved,1);
 blob=new Blob([new Uint8Array(bytes.length)]);await assert.rejects(service.saveMedia(client,target,'append',input,identity),e=>e.code==='CONFLICT');assert.equal(saved,1);
 status='published';await assert.rejects(service.saveMedia(client,target,'append',input,identity),e=>e.code==='CONFLICT');assert.equal(saved,1);
});
test('public gallery maps only public images and active matching variants, keeps main cover and deduplicates',()=>{
 const old=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 try{process.env.NEXT_PUBLIC_SUPABASE_URL='https://catalog.test';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='public';
 const adapter=load('src/features/shop/catalog-adapter.ts',{'server-only':{},'./catalog-translations':{},'react':{cache:x=>x},'./shop-content':{}},'\nmodule.exports.mapProduct=mapProduct;');
 const media=(path,variant_id=null,product_variants=null)=>({storage_path:path,media_type:'image',alt_text:'Photo',sort_order:0,is_primary:false,variant_id,product_variants});
 const row={id:pid,slug:'meowhe',name:'Meowhe',description:null,product_type:'artisan_keycap',release_type:'informational',published_at:'today',product_prices:[],product_media:[{...media('/cover.webp'),is_primary:true},media('/cover.webp'),media('/variant.webp',vid,{id:vid,name:'Lolipop',is_active:true}),media('/hidden.webp',aid,{id:aid,name:'Private',is_active:false}),media('/missing.webp',aid,null),media('https://evil.test/private.webp')]};
 const result=adapter.mapProduct(row);assert.equal(result.media.src,'/cover.webp');assert.deepEqual(result.gallery.map(a=>a.media.src),['/cover.webp','/variant.webp']);assert.equal(result.gallery[1].variantName,'Lolipop');
 }finally{if(old===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=old;if(key===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=key;}
});
