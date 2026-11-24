import {NextRequest,NextResponse} from 'next/server';
import {readSession,cookieName} from './session';
export async function identity(req:NextRequest){return readSession(req.cookies.get(cookieName)?.value)}
export async function admin(req:NextRequest){return identity(req)}
export function denied(){return NextResponse.json({error:'Acesso negado'},{status:403})}
