import {NextRequest,NextResponse} from 'next/server';
import {cookieName,validSession} from './lib/session';
export async function middleware(req:NextRequest){
 const pathname=req.nextUrl.pathname;
 const isApi=pathname.startsWith('/api/');
 if(isApi&&!['GET','HEAD','OPTIONS'].includes(req.method)){
  const origin=req.headers.get('origin');
  if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:'Origem inválida'},{status:403});
 }
 if(pathname==='/sair'){
  const res=NextResponse.redirect(new URL('/login',req.url));
  res.cookies.set(cookieName,'',{path:'/',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:0});
  return res;
 }
 if(pathname==='/login'||pathname==='/api/auth/login'||pathname==='/api/health'||pathname==='/icon.svg')return NextResponse.next();
 const verified=await validSession(req.cookies.get(cookieName)?.value);
 if(!verified){
  if(isApi)return NextResponse.json({error:'Sessão expirada. Faça login novamente.'},{status:401,headers:{'Cache-Control':'no-store'}});
  const login=new URL('/login',req.url);
  return NextResponse.redirect(login);
 }
 return NextResponse.next();
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
