import {NextRequest,NextResponse} from 'next/server';
export function middleware(req:NextRequest){
 if(req.nextUrl.pathname==='/login')return NextResponse.redirect(new URL('/',req.url));
 if(req.nextUrl.pathname.startsWith('/api/')&&!['GET','HEAD','OPTIONS'].includes(req.method)){
  const origin=req.headers.get('origin');
  if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:'Origem inválida'},{status:403});
 }
 return NextResponse.next();
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
