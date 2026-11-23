'use client';
import {FormEvent,useState} from 'react';
import styles from './login.module.css';
export default function Login(){
 const [user,setUser]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setLoading(true);setError('');
  try{
   const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user,password})});
   if(!r.ok){setError('Usuário ou senha incorretos.');return}
   window.location.replace('/');
  }catch{setError('Não foi possível entrar. Verifique sua conexão.')}
  finally{setLoading(false)}
 }
 return <main className={styles.outer}>
  <div className={styles.glow}></div>
  <section className={styles.left}>
   <div className={styles.logo}><span className={styles.symbol}>S</span><div><strong>SIHI <span>CRM</span></strong><small>Customer Relationship Management</small></div></div>
   <div className={styles.message}><div className={styles.eyebrow}><span></span> RELACIONAMENTO QUE GERA RESULTADOS</div><h1>Conectando pessoas.<br/><em>Recuperando oportunidades.</em></h1><p>Gerencie seus clientes, acompanhe cada negociação e construa relacionamentos duradouros em um único lugar.</p><div className={styles.features}><div><i>✓</i> Gestão inteligente de clientes</div><div><i>✓</i> Acompanhamentos em tempo real</div><div><i>✓</i> Informações em um ambiente protegido</div></div></div>
   <footer>© 2026 SIHI CRM · Plataforma de gestão comercial</footer>
  </section>
  <section className={styles.right}><div className={styles.formCard}><div className={styles.icon}>↗</div><div className={styles.caption}>ÁREA RESTRITA</div><h2>Bem-vindo de volta</h2><p>Acesse sua conta para continuar gerenciando seus clientes.</p><form onSubmit={submit}><label htmlFor="user">Nome de usuário</label><input id="user" required autoComplete="username" placeholder="Digite seu usuário" value={user} onChange={e=>setUser(e.target.value)}/><div className={styles.passwordLabel}><label htmlFor="password">Senha</label></div><div className={styles.passwordWrap}><input id="password" required autoComplete="current-password" type={show?'text':'password'} placeholder="Digite sua senha" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" onClick={()=>setShow(!show)} aria-label={show?'Ocultar senha':'Mostrar senha'}>{show?'Ocultar':'Mostrar'}</button></div>{error&&<div role="alert" className={styles.error}>{error}</div>}<button className={styles.submit} type="submit" disabled={loading}>{loading?'Entrando...':'Entrar na plataforma'}<span>→</span></button></form><div className={styles.safe}>🔒 Acesso seguro e restrito à equipe autorizada</div></div><div className={styles.mobileFooter}>SIHI CRM · Todos os direitos reservados</div></section>
 </main>
}
