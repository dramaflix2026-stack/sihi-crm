import {NextRequest,NextResponse} from 'next/server';
import {db} from '../../../../lib/db';
const allowedText=['customer_name','segmentation','profile','countries','products','phone','original_notes','issues','benefits'] as const;
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^\d+$/.test(id))return NextResponse.json({error:'ID inválido'},{status:400});
 try{
  const b=await req.json();
  if(!b||typeof b!=='object'||Array.isArray(b))return NextResponse.json({error:'Dados inválidos'},{status:400});
  const setters:string[]=[];const values:(string|null|boolean)[]=[];
  const set=(col:string,v:string|null|boolean,cast='')=>{values.push(v);setters.push(col+'=$'+values.length+cast)};
  if(Object.prototype.hasOwnProperty.call(b,'status')){
   if(!['sem_contato','tentativa','em_negociacao','recuperado','perdido'].includes(b.status))return NextResponse.json({error:'Status inválido'},{status:400});
   set('status',b.status);
  }
  if(Object.prototype.hasOwnProperty.call(b,'next_contact_owner')){
   if(typeof b.next_contact_owner!=='string'||!['','João','William','Guilherme','Nathan','Giovane'].includes(b.next_contact_owner))return NextResponse.json({error:'Responsável inválido'},{status:400});
   set('next_contact_owner',b.next_contact_owner);
  }
  if(Object.prototype.hasOwnProperty.call(b,'next_follow_up')){
   if(b.next_follow_up!==null&&!(typeof b.next_follow_up==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(b.next_follow_up)&&!Number.isNaN(Date.parse(b.next_follow_up))))return NextResponse.json({error:'Data inválida'},{status:400});
   set('next_follow_up',b.next_follow_up,'::date');
  }
  for(const field of allowedText){
   if(!Object.prototype.hasOwnProperty.call(b,field))continue;
   if(typeof b[field]!=='string')return NextResponse.json({error:'Campo inválido: '+field},{status:400});
   const text=String(b[field]).trim();
   if(field==='customer_name'&&!text)return NextResponse.json({error:'O nome é obrigatório'},{status:400});
   if(field==='segmentation'&&!['Level 1','Level 2','Level 3','In progress'].includes(text))return NextResponse.json({error:'Segmentação inválida'},{status:400});
   set(field,text.slice(0,field==='customer_name'?200:12000));
  }
  if(!setters.length)return NextResponse.json({error:'Nenhuma alteração enviada'},{status:400});
  values.push(id);
  const q='UPDATE clients SET '+setters.join(',')+',updated_at=NOW() WHERE id=$'+values.length+' RETURNING *';
  const {rows}=await db().query(q,values);
  if(!rows.length)return NextResponse.json({error:'Cliente não encontrado'},{status:404});
  return NextResponse.json({client:rows[0]});
 }catch{return NextResponse.json({error:'Falha ao atualizar o cliente'},{status:500})}
}
