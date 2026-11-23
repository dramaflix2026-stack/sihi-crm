import {NextRequest,NextResponse} from 'next/server';import {db} from '../../../../lib/db';
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^\d+$/.test(id))return NextResponse.json({error:'ID inválido'},{status:400});
 try{const b=await req.json();if(typeof b.active!=='boolean')return NextResponse.json({error:'Informe o status do integrante'},{status:400});
 const r=await db().query('UPDATE crm_users SET active=$1 WHERE id=$2 RETURNING id,full_name,username,role,active',[b.active,id]);
 if(!r.rows.length)return NextResponse.json({error:'Integrante não encontrado'},{status:404});
 return NextResponse.json({user:r.rows[0]})
 }catch{return NextResponse.json({error:'Erro ao atualizar integrante'},{status:500})}
}
