import {NextRequest,NextResponse} from 'next/server';
import {db} from '../../../lib/db';
import {randomBytes,scryptSync} from 'node:crypto';
export const runtime='nodejs';
export async function GET(){
 try{const r=await db().query("SELECT u.id,u.full_name,u.username,u.role,u.active,u.created_at,COUNT(c.id)::int AS clients_count FROM crm_users u LEFT JOIN clients c ON c.assigned_user_id=u.id GROUP BY u.id ORDER BY u.full_name");return NextResponse.json({users:r.rows},{headers:{'Cache-Control':'no-store'}})}
 catch{return NextResponse.json({error:'Falha ao listar equipe'},{status:500})}
}
export async function POST(req:NextRequest){
 try{
  const b=await req.json();const name=String(b.full_name||'').trim().slice(0,160);
  const username=String(b.username||name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'')).slice(0,40);
  if(name.length<3||!/^[a-z0-9._-]{3,40}$/.test(username))return NextResponse.json({error:'Informe nome e identificador válido.'},{status:400});
  const salt=randomBytes(16).toString('hex');const hash=salt+':'+scryptSync(randomBytes(32),salt,64).toString('hex');
  const r=await db().query("INSERT INTO crm_users(full_name,username,password_hash,role,active) VALUES($1,$2,$3,'agent',TRUE) RETURNING id,full_name,username,role,active",[name,username,hash]);
  return NextResponse.json({user:r.rows[0]},{status:201});
 }catch(e){if((e as {code?:string}).code==='23505')return NextResponse.json({error:'Integrante já cadastrado.'},{status:409});return NextResponse.json({error:'Falha ao salvar integrante.'},{status:500})}
}
