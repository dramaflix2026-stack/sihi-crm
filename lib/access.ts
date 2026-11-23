import {NextRequest,NextResponse} from 'next/server';
import {readSession,type SessionIdentity,cookieName} from './session';
import {db} from './db';
export async function identity(req:NextRequest):Promise<SessionIdentity|null>{
 const s=await readSession(req.cookies.get(cookieName)?.value);
 if(!s)return null;
 if(s.userId!==null){
   const result=await db().query('SELECT active,role,username FROM crm_users WHERE id=$1',[s.userId]);
   if(!result.rows[0]?.active||result.rows[0].role!==s.role||result.rows[0].username!==s.username)return null;
 }
 return s;
}
export async function admin(req:NextRequest):Promise<SessionIdentity|null>{
 const s=await identity(req);return s?.role==='admin'?s:null;
}
export function denied(){return NextResponse.json({error:'Acesso restrito ao administrador.'},{status:403,headers:{'Cache-Control':'no-store'}})}
