import {NextRequest,NextResponse} from 'next/server';
import {cookieName,readSession} from './lib/session';
const adminPaths=['/api/team','/api/assignments','/api/orders'];
export async function middleware(req:NextRequest){
 const path=req.nextUrl.pathname;
 if(path==='/api/health'||path==='/api/auth/login'||path==='/api/auth/logout')return NextResponse.next();
 const session=await readSession(req.cookies.get(cookieName)?.value);
 if(path==='/login'){
  if(session)return NextResponse.redirect(new URL('/',req.url));
  return NextResponse.next();
 }
 if(!session){
  if(path.startsWith('/api/'))return NextResponse.json({error:'Não autorizado'},{status:401,headers:{'Cache-Control':'no-store'}});
  return NextResponse.redirect(new URL('/login',req.url));
 }
 if(path.startsWith('/api/')&&!['GET','HEAD','OPTIONS'].includes(req.method)){
  const origin=req.headers.get('origin');
  if(origin&&new URL(origin).host!==req.nextUrl.host)return NextResponse.json({error:'Origem inválida'},{status:403});
 }
 // Financial records and assignment mutations have server-side authorization;
 // UI pages stay visible to the shared team.
 if(session.role!=='admin'&&adminPaths.some(prefix=>path.startsWith(prefix))&&req.method!=='GET')
   return NextResponse.json({error:'Operação reservada ao administrador'},{status:403});
 return NextResponse.next();
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
