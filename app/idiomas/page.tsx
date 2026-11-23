'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import styles from './idiomas.module.css';
type Customer={id:number;member_id:string|null;customer_name:string};
type Note={id:number;source_label:string;content:string};
type Translation={id:number;note_id:number;language:string;translated_text:string;method:string;updated_at:string};
const languages={'pt-BR':'Português (Brasil)','en':'English','zh-CN':'简体中文 (Chinês simplificado)'};
export default function LanguagesPage(){
 const [clients,setClients]=useState<Customer[]>([]),[clientId,setClientId]=useState(''),[notes,setNotes]=useState<Note[]>([]),[noteId,setNoteId]=useState(''),[translations,setTranslations]=useState<Translation[]>([]);
 const [language,setLanguage]=useState('pt-BR'),[draft,setDraft]=useState(''),[method,setMethod]=useState('manual'),[busy,setBusy]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 useEffect(()=>{fetch('/api/clients',{cache:'no-store'}).then(r=>r.json()).then(j=>setClients(j.clients||[])).catch(()=>setError('Falha ao carregar clientes'))},[]);
 useEffect(()=>{if(!clientId){setNotes([]);setTranslations([]);setNoteId('');return}setBusy(true);setError('');Promise.all([fetch('/api/clients/'+clientId+'/history',{cache:'no-store'}),fetch('/api/translations?client_id='+clientId,{cache:'no-store'})]).then(async responses=>{const [a,b]=await Promise.all(responses.map(r=>r.json()));if(!responses[0].ok||!responses[1].ok)throw Error(a.error||b.error||'Falha ao carregar');setNotes(a.original||[]);setTranslations(b.translations||[]);setNoteId('')}).catch(e=>setError(e.message)).finally(()=>setBusy(false))},[clientId]);
 const note=notes.find(n=>String(n.id)===noteId);
 const saved=useMemo(()=>translations.find(t=>String(t.note_id)===noteId&&t.language===language),[translations,noteId,language]);
 useEffect(()=>{setDraft(saved?.translated_text||'');setMethod(saved?.method||'manual');setSuccess('')},[saved,noteId,language]);
 async function generate(){
  if(!noteId)return;setSaving(true);setError('');setSuccess('');
  try{
   const r=await fetch('/api/translations/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_id:Number(clientId),note_id:Number(noteId),language})});
   const j=await r.json();if(!r.ok)throw Error(j.error||'Falha ao traduzir');
   setDraft(j.translated_text);setMethod('ai');setSuccess('Tradução gerada. Revise o conteúdo e salve.');
  }catch(e){setError((e as Error).message)}finally{setSaving(false)}
 }
 async function save(){
  if(!draft.trim()||!noteId)return;setSaving(true);setError('');setSuccess('');
  try{
   const r=await fetch('/api/translations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_id:Number(clientId),note_id:Number(noteId),language,translated_text:draft,method})});
   const j=await r.json();if(!r.ok)throw Error(j.error||'Falha ao salvar');
   setTranslations(prev=>[...prev.filter(t=>!(t.note_id===Number(noteId)&&t.language===language)),j.translation]);setSuccess('Tradução revisada salva no histórico do cliente.');
  }catch(e){setError((e as Error).message)}finally{setSaving(false)}
 }
 async function copy(){if(!note)return;try{await navigator.clipboard.writeText('Traduza fielmente para '+languages[language as keyof typeof languages]+', preservando nomes, códigos, números de rastreio e incertezas, sem acrescentar fatos:\n\n'+note.content);setSuccess('Instrução de tradução copiada.')}catch{setError('Não foi possível copiar automaticamente.')}}
 return <main className={styles.page}><div className={styles.wrap}><header className={styles.top}><div className={styles.logo}><span>S</span><strong>SIHI CRM</strong></div><div className={styles.links}><Link href="/">Dashboard</Link><Link href="/historico">Histórico</Link></div></header><div className={styles.eyebrow}>EQUIPE BRASIL / CHINA</div><h1>Central multilíngue</h1><p className={styles.lead}>Organize traduções comerciais em português, inglês e chinês. O texto original permanece preservado para conferência.</p><div className={styles.notice}>A tradução automática exige uma chave de API configurada no servidor. Sem ela, você pode copiar o texto para tradução e registrar a versão revisada manualmente. Nenhum dado é enviado a um serviço externo sem acionar o botão de tradução.</div><section className={styles.panel}><div className={styles.selectors}><label>Cliente<select value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">Selecionar cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.customer_name} — {c.member_id}</option>)}</select></label><label>Registro de origem<select value={noteId} onChange={e=>setNoteId(e.target.value)} disabled={!clientId||busy}><option value="">Selecionar anotação</option>{notes.map(n=><option value={n.id} key={n.id}>{n.source_label}</option>)}</select></label><label>Idioma de destino<select value={language} onChange={e=>setLanguage(e.target.value)}>{Object.entries(languages).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></label></div>{error&&<div role="alert" className={styles.error}>{error}</div>}{success&&<div className={styles.success}>{success}</div>}{note?<div className={styles.columns}><div><h2>Texto original</h2><p className={styles.context}>{note.source_label} · Registro preservado</p><div className={styles.source}>{note.content}</div><button className={styles.secondary} onClick={()=>void copy()}>Copiar instrução de tradução</button></div><div><h2>Tradução para revisão</h2><p className={styles.context}>{saved?'Existe uma versão salva para este idioma.':'Nenhuma tradução salva para este idioma.'}</p><textarea value={draft} onChange={e=>{setDraft(e.target.value);setMethod('manual')}} placeholder="Cole ou escreva a tradução revisada aqui..."/><div className={styles.actions}><button className={styles.secondary} onClick={()=>void generate()} disabled={saving}>Gerar com IA</button><button className={styles.primary} onClick={()=>void save()} disabled={!draft.trim()||saving}>{saving?'Processando...':'Salvar tradução'}</button></div>{saved&&<p className={styles.context}>Último registro: {new Date(saved.updated_at).toLocaleString('pt-BR')} · Origem {saved.method==='ai'?'IA':'manual'}</p>}</div></div>:<div className={styles.empty}>{busy?'Carregando...':clientId?'Selecione uma anotação.':'Selecione um cliente para iniciar.'}</div>}</section></div></main>
}
