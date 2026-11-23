'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import styles from './tarefas.module.css';
type Client={id:number;customer_name:string;member_id:string|null};
type Task={id:number;client_id:number;customer_name:string;member_id:string|null;title:string;description:string;due_date:string;priority:string;status:string;assigned_to:string;created_at:string};
const initial={client_id:'',title:'',description:'',due_date:'',priority:'normal',assigned_to:''};
const day=(s:string)=>s.slice(0,10);
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
export default function TaskPage(){
 const [clients,setClients]=useState<Client[]>([]),[tasks,setTasks]=useState<Task[]>([]);
 const [filter,setFilter]=useState('pendente'),[draft,setDraft]=useState({...initial});
 const [error,setError]=useState(''),[success,setSuccess]=useState(''),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[open,setOpen]=useState(false);
 const load=useCallback(async()=>{
  try{
   const [a,b]=await Promise.all([fetch('/api/tasks',{cache:'no-store'}),fetch('/api/clients',{cache:'no-store'})]);
   const t=await a.json(),c=await b.json();if(!a.ok||!b.ok)throw Error(t.error||c.error||'Não foi possível carregar.');
   setTasks(t.tasks||[]);setClients(c.clients||[]);setError('');
  }catch(e){setError((e as Error).message)}finally{setLoading(false)}
 },[]);
 useEffect(()=>{void load()},[load]);
 const stats=useMemo(()=>{
  const pending=tasks.filter(t=>t.status==='pendente');
  return {pending:pending.length,overdue:pending.filter(t=>day(t.due_date)<today()).length,today:pending.filter(t=>day(t.due_date)===today()).length,done:tasks.filter(t=>t.status==='concluida').length}
 },[tasks]);
 const shown=useMemo(()=>tasks.filter(t=>filter==='todas'||(filter==='atrasadas'?t.status==='pendente'&&day(t.due_date)<today():filter==='hoje'?t.status==='pendente'&&day(t.due_date)===today():t.status===filter)),[tasks,filter]);
 async function create(){
  setError('');setSuccess('');setSaving(true);
  try{
   const r=await fetch('/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...draft,client_id:Number(draft.client_id)})});
   const j=await r.json();if(!r.ok)throw Error(j.error||'Falha ao salvar');
   setOpen(false);setDraft({...initial});setSuccess('Tarefa criada com sucesso.');await load();
  }catch(e){setError((e as Error).message)}finally{setSaving(false)}
 }
 async function update(id:number,status:string){
  setError('');setSuccess('');setSaving(true);
  try{
   const r=await fetch('/api/tasks/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
   const j=await r.json();if(!r.ok)throw Error(j.error||'Falha ao atualizar');
   setSuccess(status==='concluida'?'Acompanhamento concluído.':'Tarefa atualizada.');await load();
  }catch(e){setError((e as Error).message)}finally{setSaving(false)}
 }
 return <main className={styles.page}><div className={styles.container}><header className={styles.header}><div className={styles.brand}><span>S</span><strong>SIHI CRM</strong></div><div className={styles.links}><Link href="/">Visão geral</Link><Link href="/import">Importar clientes</Link></div></header>
 <div className={styles.eyebrow}>GESTÃO COMERCIAL / ACOMPANHAMENTOS</div><div className={styles.title}><div><h1>Tarefas e próximos contatos</h1><p>Organize ligações, mensagens e negociações. Nenhuma tarefa será criada automaticamente sem sua ação.</p></div><button className={styles.primary} onClick={()=>{setError('');setOpen(true)}}>+ Nova tarefa</button></div>
 <section className={styles.stats}>{[['Pendentes',stats.pending],['Atrasadas',stats.overdue],['Para hoje',stats.today],['Concluídas',stats.done]].map(([label,value])=><div className={styles.stat} key={label}><small>{label}</small><strong>{value}</strong></div>)}</section>
 <section className={styles.panel}><div className={styles.toolbar}><h2>Agenda de acompanhamentos</h2><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="pendente">Pendentes</option><option value="atrasadas">Atrasadas</option><option value="hoje">Para hoje</option><option value="concluida">Concluídas</option><option value="cancelada">Canceladas</option><option value="todas">Todas</option></select></div>
 {error&&<div role="alert" className={styles.error}>{error}</div>}{success&&<div className={styles.success}>{success}</div>}
 {loading?<p className={styles.empty}>Carregando...</p>:shown.length===0?<div className={styles.empty}>Nenhuma tarefa nesta categoria. Crie um acompanhamento para começar.</div>:<div className={styles.tasklist}>{shown.map(t=><article className={styles.task} key={t.id}><div className={styles.taskmain}><div className={styles.tags}><span className={styles.priority}>{t.priority.toUpperCase()}</span><span className={t.status==='pendente'&&day(t.due_date)<today()?styles.overdue:styles.date}>{day(t.due_date).split('-').reverse().join('/')}{t.status==='pendente'&&day(t.due_date)<today()?' · ATRASADA':''}</span></div><h3>{t.title}</h3><p><b>{t.customer_name}</b> · {t.member_id||'Sem Member ID'}</p>{t.description&&<p className={styles.desc}>{t.description}</p>}{t.assigned_to&&<small>Responsável: {t.assigned_to}</small>}</div><div className={styles.taskActions}>{t.status==='pendente'?<><button disabled={saving} onClick={()=>void update(t.id,'concluida')}>✓ Concluir</button><button disabled={saving} onClick={()=>void update(t.id,'cancelada')}>Cancelar</button></>:<button disabled={saving} onClick={()=>void update(t.id,'pendente')}>Reabrir</button>}</div></article>)}</div>}</section>
 </div>{open&&<div className={styles.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><section className={styles.modal}><h2>Agendar acompanhamento</h2><p>Vincule a tarefa ao cliente e defina a próxima ação comercial.</p><label>Cliente<select value={draft.client_id} onChange={e=>setDraft({...draft,client_id:e.target.value})}><option value="">Selecione o cliente</option>{clients.map(c=><option value={c.id} key={c.id}>{c.customer_name} — {c.member_id||'Sem ID'}</option>)}</select></label><label>O que precisa ser feito?<input maxLength={250} value={draft.title} placeholder="Ex.: Ligar para entender por que não responde" onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label>Detalhes<textarea value={draft.description} maxLength={5000} onChange={e=>setDraft({...draft,description:e.target.value})}/></label><div className={styles.grid}><label>Data prevista<input type="date" value={draft.due_date} onChange={e=>setDraft({...draft,due_date:e.target.value})}/></label><label>Prioridade<select value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value})}><option value="baixa">Baixa</option><option value="normal">Normal</option><option value="alta">Alta</option></select></label></div><label>Responsável<input maxLength={120} value={draft.assigned_to} placeholder="Nome do responsável (opcional)" onChange={e=>setDraft({...draft,assigned_to:e.target.value})}/></label><div className={styles.footer}><button onClick={()=>setOpen(false)}>Cancelar</button><button className={styles.primary} disabled={saving||!draft.client_id||!draft.title.trim()||!draft.due_date} onClick={()=>void create()}>{saving?'Salvando...':'Criar tarefa'}</button></div></section></div>}</main>
}
