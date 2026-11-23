import {NextRequest,NextResponse} from 'next/server';
import {cookieName,validSession} from './lib/session';
export async function middleware(req:NextRequest){
 const path=req.nextUrl.pathname;
 if(path==='/api/health'||path==='/api/auth/login'||path==='/api/auth/logout')return NextResponse.next();
 const authorized=await validSession(req.cookies.get(cookieName)?.value);
 if(path==='/login'){
  if(authorized)return NextResponse.redirect(new URL('/',req.url));
  return NextResponse.next();
 }
 if(authorized)return NextResponse.next();
 if(path.startsWith('/api/'))return NextResponse.json({error:'Não autorizado'},{status:401,headers:{'Cache-Control':'no-store'}});
 return NextResponse.redirect(new URL('/login',req.url));
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
