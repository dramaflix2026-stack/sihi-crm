import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
export function hashPassword(password:string):string{
 const salt=randomBytes(16).toString('hex');
 const hash=scryptSync(password,salt,64).toString('hex');
 return salt+':'+hash;
}
export function verifyPassword(password:string,stored:string):boolean{
 try{
  const [salt,hex]=stored.split(':');
  const expected=Buffer.from(hex,'hex');
  const actual=scryptSync(password,salt,expected.length);
  return expected.length===actual.length&&timingSafeEqual(expected,actual);
 }catch{return false}
}
