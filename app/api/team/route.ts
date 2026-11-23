import {NextRequest,NextResponse} from 'next/server';
import {admin,identity,denied} from '../../../lib/access';
import {db} from '../../../lib/db';
import {hashPassword} from '../../../lib/passwords';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 try{if(!await identity(req))return NextResponse.json({error:'Não autorizado'},{status:401});
  const r=await db().query("SELECT u.id,u.full_name,u.username,u.role,u.active,u.created_at,COUNT(c.id)::int AS clients_count FROM crm_users u LEFT JOIN clients c ON c.assigned_user_id=u.id GROUP BY u.id ORDER BY u.full_name");
  return NextResponse.json({users:r.rows},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Falha ao listar equipe'},{status:500})}
}
export async function POST(req:NextRequest){
 try{if(!await admin(req))return denied();
  const b=await req.json(),name=String(b.full_name||'').trim().slice(0,160),username=String(b.username||'').trim().toLowerCase(),password=String(b.password||'');
  if(name.length<3||!/^[a-z0-9._-]{3,40}$/.test(username)||password.length<12||password.length>128)return NextResponse.json({error:'Informe nome, usuário válido e senha forte com ao menos 12 caracteres.'},{status:400});
  if(username===process.env.CRM_ADMIN_USER?.toLowerCase())return NextResponse.json({error:'Usuário reservado ao administrador principal.'},{status:409});
  const r=await db().query('INSERT INTO crm_users(full_name,username,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,full_name,username,role,active',[name,username,hashPassword(password),'agent']);
  return NextResponse.json({user:r.rows[0]},{status:201});
 }catch(e){if((e as {code?:string}).code==='23505')return NextResponse.json({error:'Esse nome de usuário já existe.'},{status:409});return NextResponse.json({error:'Erro ao criar integrante.'},{status:500})}
}
