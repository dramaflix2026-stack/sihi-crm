import {NextRequest,NextResponse} from 'next/server';
import {db} from '../../../../lib/db';
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^\d+$/.test(id))return NextResponse.json({error:'ID inválido.'},{status:400});
 try{
 const body=await req.json();
 if(!['pendente','concluida','cancelada'].includes(body.status))return NextResponse.json({error:'Status inválido.'},{status:400});
 const r=await db().query("UPDATE follow_up_tasks SET status=$1,completed_at=CASE WHEN $1='concluida' THEN NOW() ELSE NULL END WHERE id=$2 RETURNING *",[body.status,id]);
 if(!r.rows.length)return NextResponse.json({error:'Tarefa não encontrada.'},{status:404});
 return NextResponse.json({task:r.rows[0]});
 }catch{return NextResponse.json({error:'Não foi possível atualizar.'},{status:500})}
}
