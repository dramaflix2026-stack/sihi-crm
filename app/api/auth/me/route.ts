import {NextRequest,NextResponse} from 'next/server';
import {cookieName,readSession} from '../../../../lib/session';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){const user=await readSession(req.cookies.get(cookieName)?.value);return user?NextResponse.json({user},{headers:{'Cache-Control':'no-store'}}):NextResponse.json({error:'Sessão expirada'},{status:401,headers:{'Cache-Control':'no-store'})}
