import {NextRequest,NextResponse} from 'next/server';import {admin,identity,denied} from '../../../lib/access';import {db} from '../../../lib/db';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 try{if(!await identity(req))return NextResponse.json({error:'Não autorizado'},{status:401});
 const r=await db().query("SELECT o.*,c.customer_name,c.member_id,u.full_name AS responsible_name,ROUND(o.amount*o.commission_rate,2)::text AS commission_amount FROM recovered_orders o JOIN clients c ON c.id=o.client_id JOIN crm_users u ON u.id=o.responsible_user_id ORDER BY o.created_at DESC LIMIT 500");
 return NextResponse.json({orders:r.rows},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Falha ao carregar pedidos'},{status:500})}
}
export async function POST(req:NextRequest){
 const actor=await identity(req);if(!actor)return NextResponse.json({error:'Não autorizado'},{status:401});
 try{
 const b=await req.json();const clientId=Number(b.client_id),responsibleId=Number(b.responsible_user_id);
 const ref=String(b.order_reference||'').trim().slice(0,120);
 const amount=Number(b.amount),currency=String(b.currency||'USD');
 if(!Number.isSafeInteger(clientId)||clientId<=0||!Number.isSafeInteger(responsibleId)||responsibleId<=0||!ref||ref.length>120||!Number.isFinite(amount)||amount<=0||amount>999999999999||Math.round(amount*100)!==amount*100||!['USD','BRL'].includes(currency))return NextResponse.json({error:'Preencha cliente, referência, valor válido e moeda.'},{status:400});
 const assigned=await db().query('SELECT assigned_user_id FROM clients WHERE id=$1',[clientId]);
 if(!assigned.rows.length)return NextResponse.json({error:'Cliente não encontrado'},{status:404});
 if(assigned.rows[0].assigned_user_id===null||Number(assigned.rows[0].assigned_user_id)!==responsibleId)return NextResponse.json({error:'O pedido deve pertencer ao responsável atribuído ao cliente.'},{status:409});
 if(actor.role!=='admin'&&actor.userId!==responsibleId)return denied();
 const r=await db().query("INSERT INTO recovered_orders(client_id,responsible_user_id,order_reference,amount,currency,notes,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",[clientId,responsibleId,ref,amount.toFixed(2),currency,String(b.notes||'').slice(0,3000),actor.username]);
 return NextResponse.json({id:r.rows[0].id},{status:201});
 }catch(e){if((e as {code?:string}).code==='23505')return NextResponse.json({error:'Referência do pedido já cadastrada.'},{status:409});return NextResponse.json({error:'Falha ao registrar pedido'},{status:500})}
}
