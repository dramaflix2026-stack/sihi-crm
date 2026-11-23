import {NextResponse} from 'next/server';
import {db} from '../../../lib/db';
export const dynamic='force-dynamic';
let checked=false;
export async function GET(){
 try{
  const r=await db().query("SELECT (SELECT COUNT(*)::int FROM clients WHERE member_id = ANY($1::text[])) AS customers,(SELECT COUNT(*)::int FROM historical_notes) AS notes",[['U105244','U089761','U016802','U098290','U014376','U097349','U000209','U098592','U014764','U100101','U102179','U098291','U105635']]);
  if(!checked){const {customers,notes}=r.rows[0];console.info('SIHI dataset verification: customers='+customers+', historical_notes='+notes);checked=true;}
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({ok:false},{status:503})}
}
