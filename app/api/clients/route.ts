import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
export const dynamic='force-dynamic';
export async function GET() {
 try {
 const {rows}=await db().query("SELECT c.*, COALESCE((SELECT COUNT(*)::int FROM interactions i WHERE i.client_id=c.id),0) AS interactions_count FROM clients c ORDER BY c.updated_at DESC LIMIT 500");
 return NextResponse.json({clients:rows},{headers:{'Cache-Control':'no-store'}});
 } catch {return NextResponse.json({error:'Falha na consulta ao banco'},{status:500});}
}
export async function POST(req:NextRequest) {
 try{
 const b=await req.json();
 const name=String(b.customer_name||'').trim().slice(0,200);
 if(!name) return NextResponse.json({error:'Nome é obrigatório'},{status:400});
 const id=String(b.member_id||'').trim().slice(0,32)||null;
 const segmentation=['Level 1','Level 2','Level 3','In progress'].includes(b.segmentation)?b.segmentation:'In progress';
 const cols=['customer_name','member_id','segmentation','profile','countries','products','phone','original_notes','issues','benefits'];
 const values=[name,id,segmentation,...['profile','countries','products','phone','original_notes','issues','benefits'].map(k=>String(b[k]||'').slice(0,10000))];
 const sql='INSERT INTO clients ('+cols.join(',')+') VALUES ('+cols.map((_,i)=>'$'+(i+1)).join(',')+') RETURNING *';
 const {rows}=await db().query(sql,values);
 return NextResponse.json({client:rows[0]},{status:201});
 }catch(e){if((e as {code?:string}).code==='23505')return NextResponse.json({error:'Member ID já cadastrado'},{status:409});return NextResponse.json({error:'Falha ao salvar cliente'},{status:500});}
}
