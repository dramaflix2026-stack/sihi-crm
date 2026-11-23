import {NextResponse} from 'next/server';
export function POST(){return NextResponse.json({ok:true,openAccess:true,message:'O SIHI CRM não exige login.'},{headers:{'Cache-Control':'no-store'}})}
