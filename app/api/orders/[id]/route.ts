import {NextRequest,NextResponse} from 'next/server';import {admin,denied} from '../../../../lib/access';import {db} from '../../../../lib/db';
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const me=await admin(req);if(!me)return denied();const {id}=await params;
 if(!/^\d+$/.test(id))return NextResponse.json({error:'ID inválido'},{status:400});
 try{
  const b=await req.json();let r;
  if(b.action==='confirm'){
   r=await db().query("UPDATE recovered_orders SET purchase_confirmed=TRUE,confirmed_by=$1,confirmed_at=NOW() WHERE id=$2 AND purchase_confirmed=FALSE AND commission_status='pending' RETURNING id",[me.username,id]);
  }else if(b.action==='approve'){
   r=await db().query("UPDATE recovered_orders SET commission_status='approved',approved_by=$1,approved_at=NOW() WHERE id=$2 AND purchase_confirmed=TRUE AND commission_status='pending' RETURNING id",[me.username,id]);
  }else if(b.action==='paid'){
   r=await db().query("UPDATE recovered_orders SET commission_status='paid',paid_at=NOW() WHERE id=$1 AND purchase_confirmed=TRUE AND commission_status='approved' RETURNING id",[id]);
  }else if(b.action==='reject'){
   r=await db().query("UPDATE recovered_orders SET commission_status='rejected' WHERE id=$1 AND commission_status='pending' RETURNING id",[id]);
  }else return NextResponse.json({error:'Ação inválida'},{status:400});
  if(!r.rowCount)return NextResponse.json({error:'Pedido não encontrado ou etapa inválida.'},{status:409});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Falha ao validar o pedido.'},{status:500})}
}
