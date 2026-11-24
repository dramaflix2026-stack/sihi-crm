import {NextRequest,NextResponse} from 'next/server';
import {db} from '../../../../../lib/db';
import {traducoesConferidas} from '../../../../../lib/traducoes-conferidas';
import {traduzirTrechosConferidos} from '../../../../../lib/trechos-ptbr';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const fields=['profile','countries','products','original_notes','issues','benefits'] as const;

async function traduzirTrecho(texto:string):Promise<string>{
 const rotas=[
  'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q='+encodeURIComponent(texto),
  'https://api.mymemory.translated.net/get?langpair=en%7Cpt-BR&q='+encodeURIComponent(texto)
 ];
 for(let i=0;i<rotas.length;i++){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
  try{
   const resposta=await fetch(rotas[i],{signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}});
   if(!resposta.ok)continue;
   const j=await resposta.json();
   const resultado=i===0?(Array.isArray(j?.[0])?j[0].map((s:unknown)=>Array.isArray(s)?String(s[0]||''):'').join(''):''):String(j?.responseData?.translatedText||'');
   if(resultado.trim()&&resultado.toLowerCase()!=='null'&&!/MYMEMORY WARNING/i.test(resultado))return resultado;
  }catch{}finally{clearTimeout(timeout)}
 }
 throw Error('Nenhum tradutor respondeu');
}
async function traduzirSemChave(texto:string):Promise<string>{
 if(!texto.trim())return texto;
 const partes=texto.match(/[\\s\\S]{1,430}/g)||[];
 const resultado:string[]=[];
 for(const parte of partes)resultado.push(await traduzirTrecho(parte));
 return resultado.join('');
}
export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^\d+$/.test(id))return NextResponse.json({error:'Cliente inválido'},{status:400});
 try{
  const r=await db().query('SELECT c.member_id,c.profile,c.countries,c.products,c.original_notes,c.issues,c.benefits,c.updated_at,t.translations,t.source_updated_at FROM clients c LEFT JOIN client_ptbr_translations t ON t.client_id=c.id WHERE c.id=$1',[id]);
  if(!r.rows.length)return NextResponse.json({error:'Cliente não encontrado'},{status:404});
  const cliente=r.rows[0] as Record<string,unknown>;
  const manual=traducoesConferidas[String(cliente.member_id||'')]||{};
  const vigente=!!cliente.source_updated_at&&new Date(String(cliente.source_updated_at)).getTime()===new Date(String(cliente.updated_at)).getTime();
  const cache=(vigente&&cliente.translations&&typeof cliente.translations==='object'?cliente.translations:{}) as Record<string,string>;
  const dados:Record<string,string>={...cache,...manual};
  let houveTraducaoConferida=Object.keys(manual).length>0;
  for(const campo of fields){
    if(manual[campo])continue;
    const original=String(cliente[campo]||'');
    if(!original.trim())continue;
    const revisado=traduzirTrechosConferidos(original);
    if(revisado!==original){dados[campo]=revisado;houveTraducaoConferida=true}
  }
  return NextResponse.json({translations:Object.keys(dados).length?dados:null,source_updated_at:houveTraducaoConferida?null:cliente.source_updated_at||null},{headers:{'Cache-Control':'no-store'}});
 }
 catch{return NextResponse.json({error:'Falha ao consultar tradução'},{status:500})}
}
export async function POST(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^\d+$/.test(id))return NextResponse.json({error:'Cliente inválido'},{status:400});
 const apiKey=process.env.OPENAI_API_KEY;
 try{
  const r=await db().query('SELECT member_id,profile,countries,products,original_notes,issues,benefits,updated_at FROM clients WHERE id=$1',[id]);
  if(!r.rows.length)return NextResponse.json({error:'Cliente não encontrado'},{status:404});
  const source=r.rows[0] as Record<string,string>;
  const original=Object.fromEntries(fields.map(f=>[f,source[f]||'']));
  let translated:Record<string,string>;
  const revisadas=traducoesConferidas[String(source.member_id||'')];
  if(revisadas){return NextResponse.json({translations:revisadas,method:'manual_reviewed'},{headers:{'Cache-Control':'no-store'}})}
  if(apiKey){
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),45000);
   let response:Response;
   try{response=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.SIHI_TRANSLATION_MODEL||'gpt-4.1-mini',store:false,instructions:'Traduza integralmente os valores textuais recebidos para português brasileiro profissional de CRM. Preserve nomes próprios, marcas, identificadores, números, preços, códigos e datas. Não resuma e não invente. Responda apenas um objeto JSON válido com as mesmas seis chaves recebidas e valores string traduzidos.',input:JSON.stringify(original),max_output_tokens:7500})})}finally{clearTimeout(timeout)}
   if(!response.ok)throw Error('Falha no serviço de tradução');
   const j=await response.json();
   const output=(j.output||[]).flatMap((x:{content?:Array<{type?:string;text?:string}>})=>x.content||[]).filter((x:{type?:string})=>x.type==='output_text').map((x:{text?:string})=>x.text||'').join('\n').trim();
   const parsed=JSON.parse(output.replace(/^\x60\x60\x60(?:json)?\s*/,'').replace(/\s*\x60\x60\x60$/,'')) as Record<string,unknown>;
   if(fields.some(f=>typeof parsed[f]!=='string'))throw Error('Formato de tradução incompleto');
   translated=Object.fromEntries(fields.map(f=>[f,String(parsed[f])]));
  }else{
   translated={};
   for(const f of fields){
    if(!original[f].trim()){translated[f]='';continue}
    try{translated[f]=await traduzirSemChave(original[f])}catch{translated[f]=''}
   }
  }
  if(!Object.values(translated).some(x=>x.trim()))return NextResponse.json({error:'Tradução temporariamente indisponível. Conteúdo original preservado.'},{status:503});
  await db().query('INSERT INTO client_ptbr_translations(client_id,translations,source_updated_at) VALUES($1,$2::jsonb,$3) ON CONFLICT(client_id) DO UPDATE SET translations=EXCLUDED.translations,source_updated_at=EXCLUDED.source_updated_at,created_at=NOW()',[id,JSON.stringify(translated),source.updated_at]);
  return NextResponse.json({translations:translated},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Não foi possível traduzir este registro automaticamente. Os dados originais foram preservados.'},{status:502})}
}
