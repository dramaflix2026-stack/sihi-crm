import {NextRequest,NextResponse} from 'next/server';
import {cookieName,createSession,equalSecrets,ttlSeconds} from '../../../../lib/session';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 try{
  const body=await req.json();
  const username=typeof body?.username==='string'?body.username:'';
  const password=typeof body?.password==='string'?body.password:'';
  if(username.length>100||password.length>200)return NextResponse.json({error:'Usuário ou senha inválidos.'},{status:401});
  const configuredUser=process.env.CRM_ADMIN_USER;
  const configuredPassword=process.env.CRM_ADMIN_PASSWORD;
  if(!configuredUser||!configuredPassword)return NextResponse.json({error:'Login temporariamente indisponível.'},{status:503});
  if(!equalSecrets(username,configuredUser)||!equalSecrets(password,configuredPassword))return NextResponse.json({error:'Usuário ou senha inválidos.'},{status:401,headers:{'Cache-Control':'no-store'}});
  const session=await createSession({userId:null,role:'admin',username:configuredUser});
  const response=NextResponse.json({ok:true,user:{username:configuredUser}},{headers:{'Cache-Control':'no-store'}});
  response.cookies.set(cookieName,session,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:ttlSeconds});
  return response;
 }catch{return NextResponse.json({error:'Não foi possível entrar. Tente novamente.'},{status:400})}
}
