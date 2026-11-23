import {NextResponse} from 'next/server';
import {db} from '../../../../../lib/db';
export const dynamic='force-dynamic';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^\d+$/.test(id))return NextResponse.json({error:'ID inválido'},{status:400});
 try{
  const [original,actions]=await Promise.all([
    db().query('SELECT id,source_label,content,created_at FROM historical_notes WHERE client_id=$1 ORDER BY id ASC',[id]),
    db().query('SELECT id,kind,description,outcome,created_at FROM interactions WHERE client_id=$1 ORDER BY created_at DESC LIMIT 100',[id])
  ]);
  return NextResponse.json({original:original.rows,actions:actions.rows},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Falha ao buscar histórico'},{status:500})}
}
