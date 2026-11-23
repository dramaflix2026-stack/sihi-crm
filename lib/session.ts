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
export async function createSession(): Promise<string> {
  const payload=JSON.stringify({v:1,exp:Math.floor(Date.now()/1000)+ttlSeconds});
  const data=toBase64Url(encoder.encode(payload));
  const signature=new Uint8Array(await crypto.subtle.sign("HMAC",await key(),encoder.encode(data)));
  return data+"."+toBase64Url(signature);
}
export async function validSession(token?:string):Promise<boolean> {
  if(!token) return false;
  try {
    const [data,signature,extra] = token.split(".");
    if(!data||!signature||extra||data.length>1024) return false;
    const payload=JSON.parse(new TextDecoder().decode(fromBase64Url(data)));
    if(payload.v!==1||typeof payload.exp!=="number"||payload.exp<=Date.now()/1000||payload.exp>Date.now()/1000+ttlSeconds) return false;
    const sig = fromBase64Url(signature);
    const signatureBuffer = new Uint8Array(new ArrayBuffer(sig.length));
    signatureBuffer.set(sig);
    return crypto.subtle.verify("HMAC",await key(),signatureBuffer.buffer,encoder.encode(data));
  } catch {return false}
}
export function equalSecrets(a:string,b:string):boolean {
  const x=encoder.encode(a),y=encoder.encode(b);
  let d=x.length^y.length;
  for(let i=0;i<Math.max(x.length,y.length);i++)d|=(x[i]||0)^(y[i]||0);
  return d===0;
}
