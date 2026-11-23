import {NextRequest,NextResponse} from 'next/server';
import {db} from '../../../lib/db';
export const dynamic='force-dynamic';
export async function GET(){
 try{
 const {rows}=await db().query("SELECT t.*,c.customer_name,c.member_id,c.segmentation FROM follow_up_tasks t JOIN clients c ON c.id=t.client_id ORDER BY CASE WHEN t.status='pendente' THEN 0 ELSE 1 END,t.due_date ASC,t.created_at DESC LIMIT 500");
 return NextResponse.json({tasks:rows},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Não foi possível consultar as tarefas.'},{status:500})}
}
export async function POST(req:NextRequest){
 try{
 const body=await req.json();
 const clientId=Number(body.client_id);
 const title=typeof body.title==='string'?body.title.trim().slice(0,250):'';
 const description=typeof body.description==='string'?body.description.trim().slice(0,5000):'';
 const assignedTo=typeof body.assigned_to==='string'?body.assigned_to.trim().slice(0,120):'';
 const due=typeof body.due_date==='string'?body.due_date:'';
 const priority=['baixa','normal','alta'].includes(body.priority)?body.priority:'normal';
 if(!Number.isSafeInteger(clientId)||clientId<=0||!title||!/^\d{4}-\d{2}-\d{2}$/.test(due)||Number.isNaN(Date.parse(due)))return NextResponse.json({error:'Cliente, título e data válida são obrigatórios.'},{status:400});
 const r=await db().query("INSERT INTO follow_up_tasks(client_id,title,description,due_date,priority,assigned_to) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",[clientId,title,description,due,priority,assignedTo]);
 return NextResponse.json({task:r.rows[0]},{status:201});
 }catch(e){if((e as {code?:string}).code==='23503')return NextResponse.json({error:'Cliente não encontrado.'},{status:404});return NextResponse.json({error:'Não foi possível salvar a tarefa.'},{status:500})}
}
