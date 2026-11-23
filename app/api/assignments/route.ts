import {NextRequest,NextResponse} from 'next/server';import {admin,identity,denied} from '../../../lib/access';import {db} from '../../../lib/db';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 try{if(!await identity(req))return NextResponse.json({error:'Não autorizado'},{status:401});
 const r=await db().query('SELECT c.id,c.member_id,c.customer_name,c.segmentation,c.status,c.assigned_user_id,u.full_name AS responsible_name FROM clients c LEFT JOIN crm_users u ON u.id=c.assigned_user_id ORDER BY c.id');
 return NextResponse.json({clients:r.rows},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Erro ao consultar distribuição'},{status:500})}
}
export async function POST(req:NextRequest){
 const me=await admin(req);if(!me)return denied();
 const b=await req.json().catch(()=>null);
 if(!Array.isArray(b?.client_ids)||b.client_ids.length<1||b.client_ids.length>200||b.client_ids.some((n:unknown)=>!Number.isSafeInteger(n)||Number(n)<=0))return NextResponse.json({error:'Selecione até 200 clientes.'},{status:400});
 const ids=[...new Set<number>(b.client_ids as number[])];
 const userId=b.user_id===null?null:Number(b.user_id);
 if(userId!==null&&(!Number.isSafeInteger(userId)||userId<=0))return NextResponse.json({error:'Responsável inválido'},{status:400});
 const conn=await db().connect();
 try{
  await conn.query('BEGIN');
  if(userId!==null){const u=await conn.query('SELECT 1 FROM crm_users WHERE id=$1 AND active=TRUE',[userId]);if(!u.rowCount)throw Error('Responsável não encontrado ou inativo.')}
  const current=await conn.query('SELECT id,assigned_user_id FROM clients WHERE id=ANY($1::bigint[]) FOR UPDATE',[ids]);
  if(current.rows.length!==ids.length)throw Error('Cliente não encontrado.');
  let count=0;
  for(const row of current.rows){
   if(row.assigned_user_id===userId||(row.assigned_user_id!==null&&userId!==null&&Number(row.assigned_user_id)===userId))continue;
   await conn.query('UPDATE clients SET assigned_user_id=$1,updated_at=NOW() WHERE id=$2',[userId,row.id]);
   await conn.query('INSERT INTO client_assignments(client_id,assigned_user_id,previous_user_id,assigned_by) VALUES($1,$2,$3,$4)',[row.id,userId,row.assigned_user_id,me.username]);
   count++;
  }
  await conn.query('COMMIT');return NextResponse.json({assigned:count});
 }catch(e){await conn.query('ROLLBACK');return NextResponse.json({error:e instanceof Error?e.message:'Falha na atribuição'},{status:400})}finally{conn.release()}
}
