import {NextRequest,NextResponse} from 'next/server';import {admin,denied} from '../../../../lib/access';import {db} from '../../../../lib/db';import {hashPassword} from '../../../../lib/passwords';
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await admin(req))return denied();const {id}=await params;
 if(!/^\d+$/.test(id))return NextResponse.json({error:'ID inválido'},{status:400});
 try{
  const b=await req.json();let r;
  if(typeof b.active==='boolean'){
   r=await db().query('UPDATE crm_users SET active=$1 WHERE id=$2 RETURNING id,full_name,username,role,active',[b.active,id]);
  }else if(typeof b.password==='string'&&b.password.length>=12&&b.password.length<=128){
   r=await db().query('UPDATE crm_users SET password_hash=$1 WHERE id=$2 RETURNING id,full_name,username,role,active',[hashPassword(b.password),id]);
  }else return NextResponse.json({error:'Alteração inválida'},{status:400});
  if(!r.rows.length)return NextResponse.json({error:'Integrante não encontrado'},{status:404});
  return NextResponse.json({user:r.rows[0]});
 }catch{return NextResponse.json({error:'Falha ao atualizar integrante'},{status:500})}
}
