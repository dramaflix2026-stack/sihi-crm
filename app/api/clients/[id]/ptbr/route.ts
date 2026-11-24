import {NextRequest,NextResponse} from 'next/server';
import {db} from '../../../../../lib/db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const fields=['profile','countries','products','original_notes','issues','benefits'] as const;
export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^\d+$/.test(id))return NextResponse.json({error:'Cliente inválido'},{status:400});
 try{const r=await db().query('SELECT translations,source_updated_at FROM client_ptbr_translations WHERE client_id=$1',[id]);return NextResponse.json({translations:r.rows[0]?.translations||null,source_updated_at:r.rows[0]?.source_updated_at||null},{headers:{'Cache-Control':'no-store'}})}
 catch{return NextResponse.json({error:'Falha ao consultar tradução'},{status:500})}
}
export async function POST(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^\d+$/.test(id))return NextResponse.json({error:'Cliente inválido'},{status:400});
 const apiKey=process.env.OPENAI_API_KEY;
 if(!apiKey)return NextResponse.json({error:'A tradução dos textos importados ainda precisa de uma chave OPENAI_API_KEY configurada no serviço SIHI CRM do Railway. Nenhum texto original foi alterado.'},{status:503});
 try{
  const r=await db().query('SELECT profile,countries,products,original_notes,issues,benefits,updated_at FROM clients WHERE id=$1',[id]);
  if(!r.rows.length)return NextResponse.json({error:'Cliente não encontrado'},{status:404});
  const source=r.rows[0] as Record<string,string>;
  const original=Object.fromEntries(fields.map(f=>[f,source[f]||'']));
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),45000);
  let response:Response;
  try{response=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.SIHI_TRANSLATION_MODEL||'gpt-4.1-mini',store:false,instructions:'Traduza integralmente os valores textuais recebidos para português brasileiro profissional de CRM. Preserve rigorosamente nomes próprios, marcas, endereços, identificadores, números, preços, códigos, nomes de produtos e datas. Não resuma, não remova detalhes, não invente informações. Responda apenas um objeto JSON válido com as mesmas seis chaves recebidas e valores string traduzidos.',input:JSON.stringify(original),max_output_tokens:7500})})}finally{clearTimeout(timeout)}
  if(!response.ok)return NextResponse.json({error:'O serviço de tradução não conseguiu processar os dados.'},{status:502});
  const j=await response.json();const output=(j.output||[]).flatMap((x:{content?:Array<{type?:string;text?:string}>})=>x.content||[]).filter((x:{type?:string})=>x.type==='output_text').map((x:{text?:string})=>x.text||'').join('\n').trim();
  const parsed=JSON.parse(output.replace(/^\x60\x60\x60(?:json)?\s*/,'').replace(/\s*\x60\x60\x60$/,'')) as Record<string,unknown>;
  if(fields.some(f=>typeof parsed[f]!=='string'))throw Error('Formato de tradução incompleto');
  const translated=Object.fromEntries(fields.map(f=>[f,parsed[f]]));
  await db().query('INSERT INTO client_ptbr_translations(client_id,translations,source_updated_at) VALUES($1,$2::jsonb,$3) ON CONFLICT(client_id) DO UPDATE SET translations=EXCLUDED.translations,source_updated_at=EXCLUDED.source_updated_at,created_at=NOW()',[id,JSON.stringify(translated),source.updated_at]);
  return NextResponse.json({translations:translated},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Não foi possível concluir a tradução. O conteúdo original foi preservado.'},{status:502})}
}
