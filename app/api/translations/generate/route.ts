import {NextRequest,NextResponse} from 'next/server';
import {db} from '../../../../lib/db';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 const key=process.env.OPENAI_API_KEY;
 if(!key)return NextResponse.json({error:'Tradução automática indisponível. Configure OPENAI_API_KEY na Railway ou registre uma tradução manual.'},{status:503});
 try{
  const b=await req.json();
  const clientId=Number(b.client_id),noteId=Number(b.note_id);
  const language=String(b.language||'');
  if(!Number.isSafeInteger(clientId)||!Number.isSafeInteger(noteId)||!['pt-BR','en','zh-CN'].includes(language))return NextResponse.json({error:'Parâmetros inválidos'},{status:400});
  const r=await db().query('SELECT content FROM historical_notes WHERE id=$1 AND client_id=$2',[noteId,clientId]);
  if(!r.rows.length)return NextResponse.json({error:'Registro não encontrado'},{status:404});
  const source=String(r.rows[0].content).slice(0,12000);
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
  let result:Response;
  try{
   result=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',signal:controller.signal,
    headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},
    body:JSON.stringify({model:process.env.SIHI_TRANSLATION_MODEL||'gpt-4.1-mini',store:false,
      instructions:'You are a professional translator for a logistics CRM. Translate faithfully into '+({'pt-BR':'Brazilian Portuguese','en':'English','zh-CN':'Simplified Chinese'}[language])+'. Preserve names, identifiers, tracking numbers, currencies, uncertainty, and commercial terms. Do not add suggestions, summaries, fabricated details, or extra commentary. Output only translated text.',
      input:source,max_output_tokens:2000})
   });
  }finally{clearTimeout(timer)}
  if(!result.ok)return NextResponse.json({error:'Serviço de tradução temporariamente indisponível'},{status:502});
  const json=await result.json();
  const text=(json.output||[]).flatMap((x:{content?:Array<{type?:string;text?:string}>})=>x.content||[]).filter((x:{type?:string})=>x.type==='output_text').map((x:{text?:string})=>x.text||'').join('\n').trim();
  if(!text)return NextResponse.json({error:'A tradução não retornou texto'},{status:502});
  return NextResponse.json({translated_text:text},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Falha na solicitação de tradução'},{status:502})}
}
