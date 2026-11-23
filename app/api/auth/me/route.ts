import {NextRequest,NextResponse} from 'next/server';import {identity} from '../../../../lib/access';
export async function GET(req:NextRequest){try{const s=await identity(req);if(!s)return NextResponse.json({error:'Sessão expirada'},{status:401});return NextResponse.json({user:s},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Falha na sessão'},{status:500})}}
