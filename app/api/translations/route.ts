import {NextRequest,NextResponse} from 'next/server';
import {db} from '../../../lib/db';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 const id=req.nextUrl.searchParams.get('client_id');
 if(!id||!/^\d+$/.test(id))return NextResponse.json({error:'Cliente inválido'},{status:400});
 try{
  const r=await db().query('SELECT t.id,t.note_id,t.language,t.translated_text,t.method,t.updated_at FROM client_translations t WHERE t.client_id=$1 ORDER BY t.updated_at DESC',[id]);
  return NextResponse.json({translations:r.rows},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Falha ao buscar traduções'},{status:500})}
}
export async function POST(req:NextRequest){
 try{
  const body=await req.json();
  const clientId=Number(body.client_id),noteId=Number(body.note_id);
  const lang=String(body.language||'');
  const text=typeof body.translated_text==='string'?body.translated_text.trim():'';
  const method=body.method==='ai'?'ai':'manual';
  if(!Number.isSafeInteger(clientId)||!Number.isSafeInteger(noteId)||clientId<=0||noteId<=0||!['pt-BR','en','zh-CN'].includes(lang)||!text||text.length>20000)return NextResponse.json({error:'Dados inválidos'},{status:400});
  const owner=await db().query('SELECT 1 FROM historical_notes WHERE id=$1 AND client_id=$2',[noteId,clientId]);
  if(!owner.rowCount)return NextResponse.json({error:'Histórico não pertence ao cliente'},{status:404});
  const r=await db().query("INSERT INTO client_translations(client_id,note_id,language,translated_text,method) VALUES($1,$2,$3,$4,$5) ON CONFLICT(note_id,language) DO UPDATE SET translated_text=EXCLUDED.translated_text,method=EXCLUDED.method,updated_at=NOW() RETURNING *",[clientId,noteId,lang,text,method]);
  return NextResponse.json({translation:r.rows[0]});
 }catch{return NextResponse.json({error:'Não foi possível salvar tradução'},{status:500})}
}
