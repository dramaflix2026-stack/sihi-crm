import { NextRequest, NextResponse } from 'next/server';
export function middleware(req: NextRequest) {
  const user = process.env.CRM_ADMIN_USER;
  const pass = process.env.CRM_ADMIN_PASSWORD;
  if (!user || !pass) return new NextResponse('Acesso não configurado.', { status: 503 });
  const header = req.headers.get('authorization');
  let allowed = false;
  if (header?.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const split = decoded.indexOf(':');
      const u = decoded.slice(0,split), p = decoded.slice(split+1);
      const a = new TextEncoder().encode(u), b = new TextEncoder().encode(user);
      const c = new TextEncoder().encode(p), d = new TextEncoder().encode(pass);
      let diff = a.length ^ b.length ^ c.length ^ d.length;
      for(let i=0;i<Math.max(a.length,b.length);i++) diff |= (a[i]||0) ^ (b[i]||0);
      for(let i=0;i<Math.max(c.length,d.length);i++) diff |= (c[i]||0) ^ (d[i]||0);
      allowed = diff===0;
    } catch { allowed = false; }
  }
  if (!allowed) return new NextResponse('Acesso restrito ao SIHI CRM.', { status:401, headers:{'WWW-Authenticate':'Basic realm="SIHI CRM"', 'Cache-Control':'no-store'} });
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
