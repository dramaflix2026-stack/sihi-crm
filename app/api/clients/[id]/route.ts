import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^\d+$/.test(id)) return NextResponse.json({error:'ID inválido'},{status:400});
 try{
 const b=await req.json();
 const status=['sem_contato','tentativa','em_negociacao','recuperado','perdido'].includes(b.status)?b.status:null;
 const date=b.next_follow_up===null?null:(typeof b.next_follow_up==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(b.next_follow_up)?b.next_follow_up:undefined);
 if(!status&&date===undefined)return NextResponse.json({error:'Nenhuma alteração válida'},{status:400});
 const {rows}=await db().query('UPDATE clients SET status=COALESCE($1,status),next_follow_up=CASE WHEN $2::boolean THEN $3::date ELSE next_follow_up END,updated_at=NOW() WHERE id=$4 RETURNING *',[status,date!==undefined,date??null,id]);
 if(!rows.length) return NextResponse.json({error:'Cliente não encontrado'},{status:404});
 return NextResponse.json({client:rows[0]});
 }catch{return NextResponse.json({error:'Erro ao atualizar'},{status:500});}
}
