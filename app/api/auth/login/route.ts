import {NextRequest,NextResponse} from 'next/server';
import {createSession,cookieName,equalSecrets,ttlSeconds} from '../../../../lib/session';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 try{
  const body=await req.json();
  const user=typeof body.user==='string'?body.user:'';
  const password=typeof body.password==='string'?body.password:'';
  if(user.length>256||password.length>512)return NextResponse.json({error:'Credenciais inválidas'},{status:401});
  const expectedUser=process.env.CRM_ADMIN_USER;
  const expectedPassword=process.env.CRM_ADMIN_PASSWORD;
  if(!expectedUser||!expectedPassword)return NextResponse.json({error:'Login indisponível'},{status:503});
  const allowed=equalSecrets(user,expectedUser) && equalSecrets(password,expectedPassword);
  if(!allowed)return NextResponse.json({error:'Credenciais inválidas'},{status:401,headers:{'Cache-Control':'no-store'}});
  const response=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  response.cookies.set(cookieName,await createSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:ttlSeconds});
  return response;
 }catch{return NextResponse.json({error:'Solicitação inválida'},{status:400});}
}
