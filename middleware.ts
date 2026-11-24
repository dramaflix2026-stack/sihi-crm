import {NextRequest,NextResponse} from 'next/server';
import {cookieName,validSession} from './lib/session';
export async function middleware(req:NextRequest){
 const pathname=req.nextUrl.pathname;
 const isApi=pathname.startsWith('/api/');
 if(isApi&&!['GET','HEAD','OPTIONS'].includes(req.method)){
  // Railway termina HTTPS antes de encaminhar para o Next.js; req.nextUrl.origin
  // pode conter a origem interna do proxy e não a URL exibida no navegador.
  const origin=req.headers.get('origin');
  if(origin){
   let permitted=false;
   try{
    const parsed=new URL(origin);
    const forwardedHost=(req.headers.get('x-forwarded-host')||'').split(',')[0].trim().toLowerCase();
    const requestHost=(req.headers.get('host')||'').toLowerCase();
    const knownPublicHost='sihi-crm-web-production.up.railway.app';
    const incomingHost=parsed.host.toLowerCase();
    permitted=(parsed.protocol==='https:'||process.env.NODE_ENV!=='production')&&
      (incomingHost===knownPublicHost||incomingHost===forwardedHost||incomingHost===requestHost);
   }catch{}
   if(!permitted)return NextResponse.json({error:'Origem inválida'},{status:403});
  }
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
