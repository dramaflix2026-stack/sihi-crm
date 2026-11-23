import {NextResponse} from 'next/server';
export function GET(){return NextResponse.json({user:{userId:null,role:'admin',username:'equipe'},openAccess:true},{headers:{'Cache-Control':'no-store'}})}
