const encoder = new TextEncoder();
const cookieName = "sihi_session";
const ttlSeconds = 8 * 60 * 60;
export {cookieName,ttlSeconds};

function toBase64Url(data: Uint8Array): string {
  let s = "";
  for (const byte of data) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromBase64Url(s: string): Uint8Array {
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length/4)*4, "="));
  return Uint8Array.from(binary, ch=>ch.charCodeAt(0));
}
async function key(): Promise<CryptoKey> {
  const secret = process.env.CRM_ADMIN_PASSWORD;
  if (!secret) throw new Error("CRM_ADMIN_PASSWORD não configurada");
  return crypto.subtle.importKey("raw",encoder.encode("SIHI CRM session v1:"+secret),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);
}
export type SessionIdentity={userId:number|null;role:'admin'|'agent';username:string};
export async function createSession(identity:SessionIdentity={userId:null,role:'admin',username:'admin'}): Promise<string> {
  const payload=JSON.stringify({v:2,exp:Math.floor(Date.now()/1000)+ttlSeconds,...identity});
  const data=toBase64Url(encoder.encode(payload));
  const signature=new Uint8Array(await crypto.subtle.sign("HMAC",await key(),encoder.encode(data)));
  return data+"."+toBase64Url(signature);
}
export async function readSession(token?:string):Promise<SessionIdentity|null> {
  if(!token) return null;
  try {
    const [data,signature,extra] = token.split(".");
    if(!data||!signature||extra||data.length>1024) return null;
    const payload=JSON.parse(new TextDecoder().decode(fromBase64Url(data)));
    if(![1,2].includes(payload.v)||typeof payload.exp!=="number"||payload.exp<=Date.now()/1000||payload.exp>Date.now()/1000+ttlSeconds) return null;
    const sig = fromBase64Url(signature);
    const signatureBuffer = new Uint8Array(new ArrayBuffer(sig.length));
    signatureBuffer.set(sig);
    const valid=await crypto.subtle.verify("HMAC",await key(),signatureBuffer.buffer,encoder.encode(data));
    if(!valid)return null;
    if(payload.v===1)return {userId:null,role:'admin',username:process.env.CRM_ADMIN_USER||'admin'};
    if(!['admin','agent'].includes(payload.role)||typeof payload.username!=='string'||payload.username.length>80)return null;
    if(payload.userId!==null&&(!Number.isSafeInteger(payload.userId)||payload.userId<=0))return null;
    if(payload.role==='agent'&&payload.userId===null)return null;
    return {userId:payload.userId,role:payload.role,username:payload.username};
  } catch {return null}
}
export async function validSession(token?:string):Promise<boolean>{return !!(await readSession(token))}
export function equalSecrets(a:string,b:string):boolean {
  const x=encoder.encode(a),y=encoder.encode(b);
  let d=x.length^y.length;
  for(let i=0;i<Math.max(x.length,y.length);i++)d|=(x[i]||0)^(y[i]||0);
  return d===0;
}
