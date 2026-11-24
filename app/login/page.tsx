'use client';
import {useState} from 'react';
export default function Login(){
 const [usuario,setUsuario]=useState(''),[senha,setSenha]=useState(''),[erro,setErro]=useState(''),[carregando,setCarregando]=useState(false),[mostrar,setMostrar]=useState(false);
 async function entrar(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setErro('');setCarregando(true);
  try{const r=await fetch('/api/auth/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:usuario,password:senha})});const d=await r.json();if(!r.ok)throw Error(d.error||'Não foi possível entrar.');window.location.replace('/');}catch(e){setErro((e as Error).message);setCarregando(false)}
 }
 return <main style={{minHeight:'100dvh',background:'#f7f7f5',display:'grid',placeItems:'center',padding:'24px 16px',fontFamily:'Poppins, Arial, sans-serif'}}>
 <section style={{width:'100%',maxWidth:440,padding:'clamp(24px,6vw,42px)',border:'1px solid #e8e8e4',borderRadius:22,background:'#fff',boxShadow:'0 12px 40px rgba(0,0,0,.045)',textAlign:'center'}}>
 <div aria-hidden="true" style={{width:76,height:76,margin:'0 auto 22px',display:'grid',placeItems:'center',borderRadius:20,background:'#ffd426',color:'#171717',fontSize:43,fontWeight:800}}>S</div>
 <div style={{fontSize:12,letterSpacing:2.4,fontWeight:700,color:'#a08000',marginBottom:12}}>GESTÃO DE RELACIONAMENTO</div>
 <h1 style={{fontSize:'clamp(25px,6vw,33px)',letterSpacing:'-.8px',lineHeight:1.2,color:'#191919',margin:'0 0 12px'}}>Bem-vindo ao SIHI CRM</h1>
 <p style={{color:'#727272',fontSize:14,lineHeight:1.65,margin:'0 0 24px'}}>Entre com suas credenciais para acessar o painel.</p>
 <form onSubmit={entrar} style={{textAlign:'left',display:'grid',gap:14}}>
 <label htmlFor="usuario" style={{fontWeight:600,fontSize:13}}>Usuário</label>
 <input id="usuario" name="username" type="text" autoComplete="username" value={usuario} onChange={e=>setUsuario(e.target.value)} required placeholder="Digite seu usuário" style={{padding:'13px 14px',borderRadius:10,border:'1px solid #d8d8d8',width:'100%',fontSize:15}}/>
 <label htmlFor="senha" style={{fontWeight:600,fontSize:13}}>Senha</label>
 <div style={{display:'flex',border:'1px solid #d8d8d8',borderRadius:10,overflow:'hidden'}}>
 <input id="senha" name="password" type={mostrar?'text':'password'} autoComplete="current-password" value={senha} onChange={e=>setSenha(e.target.value)} required placeholder="Digite sua senha" style={{padding:'13px 14px',border:0,minWidth:0,flex:1,fontSize:15,outline:'none'}}/>
 <button type="button" aria-label={mostrar?'Ocultar senha':'Mostrar senha'} onClick={()=>setMostrar(!mostrar)} style={{padding:'0 13px',border:0,background:'#f8f8f8',color:'#555',fontSize:12}}>{mostrar?'Ocultar':'Mostrar'}</button>
 </div>
 {erro&&<p role="alert" style={{color:'#b42318',fontSize:13,margin:'0 0 4px'}}>{erro}</p>}
 <button type="submit" disabled={carregando} style={{marginTop:10,background:'#ffd426',color:'#161616',display:'block',width:'100%',padding:'15px 20px',border:0,borderRadius:12,fontSize:16,fontWeight:700,cursor:carregando?'wait':'pointer'}}>{carregando?'Entrando...':'Entrar no CRM'}</button>
 </form>
 </section></main>;
}
