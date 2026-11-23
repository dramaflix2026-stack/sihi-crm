import {NextRequest,NextResponse} from 'next/server';
import {db} from '../../../lib/db';
export async function GET(req:NextRequest){
 const id=req.nextUrl.searchParams.get('client_id');
 if(!id||!/^\d+$/.test(id))return NextResponse.json({error:'ID inválido'},{status:400});
 try{const {rows}=await db().query('SELECT * FROM interactions WHERE client_id=$1 ORDER BY created_at DESC LIMIT 100',[id]);return NextResponse.json({interactions:rows});}catch{return NextResponse.json({error:'Falha ao carregar histórico'},{status:500});}
}
export async function POST(req:NextRequest){
 try{
 const b=await req.json();
 if(!/^\d+$/.test(String(b.client_id)))return NextResponse.json({error:'Cliente inválido'},{status:400});
 if(!['ligacao','whatsapp','email','nota'].includes(b.kind))return NextResponse.json({error:'Canal inválido'},{status:400});
 const description=String(b.description||'').trim().slice(0,10000);
 if(!description)return NextResponse.json({error:'Descrição obrigatória'},{status:400});
 const {rows}=await db().query('INSERT INTO interactions(client_id,kind,description,outcome) VALUES($1,$2,$3,$4) RETURNING *',[b.client_id,b.kind,description,String(b.outcome||'pendente').slice(0,32)]);
 await db().query('UPDATE clients SET updated_at=NOW() WHERE id=$1',[b.client_id]);
 return NextResponse.json({interaction:rows[0]},{status:201});
 }catch{return NextResponse.json({error:'Falha ao salvar registro'},{status:500});}
}
