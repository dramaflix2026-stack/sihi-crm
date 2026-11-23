import { NextRequest,NextResponse } from 'next/server';
import {db} from '../../../../lib/db';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 try{
  const body=await req.json();
  if(!Array.isArray(body.clients)||body.clients.length<1||body.clients.length>200)return NextResponse.json({error:'Envie entre 1 e 200 clientes.'},{status:400});
  const prepared: Array<{member_id:string;customer_name:string;segmentation:string;profile:string;countries:string;products:string;phone:string;original_notes:string;issues:string;benefits:string}> = (body.clients as Record<string,unknown>[]).map((c:Record<string,unknown>,i:number)=>{
   const val=(k:string,max=12000)=>typeof c?.[k]==='string'?String(c[k]).trim().slice(0,max):'';
   const member_id=val('member_id',32);
   const customer_name=val('customer_name',200);
   if(!member_id||!customer_name)throw new Error('Linha '+(i+1)+': nome e Member ID são obrigatórios.');
   return {member_id,customer_name,segmentation:['Level 1','Level 2','Level 3','In progress'].includes(val('segmentation'))?val('segmentation'):'In progress',profile:val('profile'),countries:val('countries',400),products:val('products',1000),phone:val('phone',500),original_notes:val('original_notes'),issues:val('issues'),benefits:val('benefits')};
  });
  if(new Set(prepared.map(c=>c.member_id)).size!==prepared.length)return NextResponse.json({error:'Há IDs duplicados na importação.'},{status:400});
  const conn=await db().connect();
  try{
   await conn.query('BEGIN');
   let imported=0,skipped=0;
   for(const c of prepared){
    const values=[c.member_id,c.customer_name,c.segmentation,c.profile,c.countries,c.products,c.phone,c.original_notes,c.issues,c.benefits];
    const result=await conn.query('INSERT INTO clients(member_id,customer_name,segmentation,profile,countries,products,phone,original_notes,issues,benefits) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(member_id) DO NOTHING RETURNING id',values);
    if(result.rowCount)imported++;else skipped++;
   }
   await conn.query('COMMIT');
   return NextResponse.json({imported,skipped,total:prepared.length},{headers:{'Cache-Control':'no-store'}});
  }catch(e){await conn.query('ROLLBACK');throw e}finally{conn.release()}
 }catch(e){const message=e instanceof Error?e.message:'Falha ao importar';return NextResponse.json({error:message.startsWith('Linha')?message:'Não foi possível importar os clientes.'},{status:400});}
}
