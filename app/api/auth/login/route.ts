import {NextRequest,NextResponse} from 'next/server';
import {createSession,cookieName,equalSecrets,ttlSeconds,type SessionIdentity} from '../../../../lib/session';
import {db} from '../../../../lib/db';
import {verifyPassword} from '../../../../lib/passwords';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 try{
  const body=await req.json();
  const user=typeof body.user==='string'?body.user.trim():'';
  const password=typeof body.password==='string'?body.password:'';
  if(!user||!password||user.length>80||password.length>256)return NextResponse.json({error:'Credenciais inválidas'},{status:401});
  let identity:SessionIdentity|null=null;
  const adminUser=process.env.CRM_ADMIN_USER,adminPassword=process.env.CRM_ADMIN_PASSWORD;
  if(adminUser&&adminPassword&&equalSecrets(user,adminUser)&&equalSecrets(password,adminPassword)){
   identity={userId:null,role:'admin',username:user};
  }else{
   const found=await db().query('SELECT id,username,password_hash,role,active FROM crm_users WHERE username=$1',[user]);
   const row=found.rows[0];
   if(row?.active&&verifyPassword(password,row.password_hash))
     identity={userId:Number(row.id),role:row.role,username:row.username};
  }
  if(!identity)return NextResponse.json({error:'Credenciais inválidas'},{status:401,headers:{'Cache-Control':'no-store'}});
  const response=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  response.cookies.set(cookieName,await createSession(identity),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:ttlSeconds});
  return response;
 }catch{return NextResponse.json({error:'Falha ao autenticar'},{status:500})}
}
