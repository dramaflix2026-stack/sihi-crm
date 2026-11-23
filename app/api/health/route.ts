import {NextResponse} from 'next/server';
import {db} from '../../../lib/db';
export const dynamic='force-dynamic';
export async function GET(){try{await db().query('SELECT 1 FROM clients LIMIT 1');return NextResponse.json({ok:true});}catch{return NextResponse.json({ok:false},{status:503});}}
