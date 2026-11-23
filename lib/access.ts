import {NextRequest,NextResponse} from 'next/server';
import type {SessionIdentity} from './session';
// Shared CRM: roles represent organizational responsibility, not login permissions.
// Actions are open to all people with access to the application.
const shared:SessionIdentity={userId:null,role:'admin',username:'equipe'};
export async function identity(_req:NextRequest):Promise<SessionIdentity>{return shared}
export async function admin(_req:NextRequest):Promise<SessionIdentity>{return shared}
export function denied(){return NextResponse.json({error:'Operação indisponível'},{status:403})}
