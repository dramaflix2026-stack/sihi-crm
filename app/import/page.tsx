'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import styles from './style.module.css';
type Client={member_id:string;customer_name:string;segmentation:string;profile:string;countries:string;products:string;phone:string;original_notes:string;issues:string;benefits:string};
function parseTable(input:string):string[][]{
 const src=input.replace(/^\uFEFF/,'');
 const first=src.split(/\r?\n/,1)[0]||'';
 const delimiter=(first.match(/\t/g)||[]).length>(first.match(/;/g)||[]).length&&((first.match(/\t/g)||[]).length>(first.match(/,/g)||[]).length)?'\t':(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';
 const rows:string[][]=[];let current:string[]=[];let value='';let quoted=false;
 for(let i=0;i<src.length;i++){
  const c=src[i];
  if(c==='"'){if(quoted&&src[i+1]==='"'){value+='"';i++}else quoted=!quoted;continue}
  if(!quoted&&c===delimiter){current.push(value);value='';continue}
  if(!quoted&&(c==='\r'||c==='\n')){
   if(c==='\r'&&src[i+1]==='\n')i++;
   current.push(value);value='';if(current.some(x=>x.trim()))rows.push(current);current=[];continue;
  }
  value+=c;
 }
 if(quoted)throw Error('Há aspas não fechadas no arquivo.');
 current.push(value);if(current.some(x=>x.trim()))rows.push(current);
 return rows;
}
function normalize(s:string){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/<br\s*\/?>/gi,' ').replace(/[^a-z0-9]+/g,' ').trim()}
const fieldAliases:Record<string,string[]>={
 member_id:['member id','member','id membro','id cliente'],
 customer_name:['customer name','nome do cliente','cliente','name'],
 segmentation:['customer segmentation','segmentacao do cliente','segmentacao','nivel'],
 profile:['client profile','perfil do cliente','perfil'],
 countries:['countries of sale','paises de venda','paises'],
 products:['key products sold','principais produtos','produtos vendidos','produtos'],
 phone:['telephone number','numero de telefone','telefone','phone'],
 issues:['current customer issues and improvement proposals','problemas atuais','problemas'],
 benefits:['what benefits can it bring to customers','beneficios','oportunidades']
};
const weekFields=['week 11 2 key follow up points','week of nov 9 key follow up points','weeks 11 16 key follow up points','telephone assistance required'];
function prepare(input:string):Client[]{
 const rows=parseTable(input);
 if(rows.length<2)throw Error('Inclua o cabeçalho e pelo menos uma linha de cliente.');
 const headers=rows[0].map(normalize);
 const index=(field:string)=>headers.findIndex(h=>fieldAliases[field]?.includes(h));
 if(index('member_id')<0||index('customer_name')<0)throw Error('Não encontrei as colunas Member ID e Customer Name.');
 const result:Client[]=[];
 for(const row of rows.slice(1)){
  const get=(k:string)=>{const i=index(k);return i>=0?(row[i]||'').trim():''};
  if(!get('member_id')&&!get('customer_name'))continue;
  if(!get('member_id')||!get('customer_name'))throw Error('Há clientes sem Member ID ou nome.');
  const notes:string[]=[];
  headers.forEach((h,i)=>{if(weekFields.includes(h)&&row[i]?.trim())notes.push(rows[0][i]+':\n'+row[i].trim())});
  result.push({member_id:get('member_id'),customer_name:get('customer_name'),segmentation:get('segmentation')||'In progress',profile:get('profile'),countries:get('countries'),products:get('products'),phone:get('phone'),original_notes:notes.join('\n\n'),issues:get('issues'),benefits:get('benefits')});
 }
 if(result.length>200)throw Error('Limite de 200 clientes por importação.');
 return result;
}
export default function ImportPage(){
 const [raw,setRaw]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[loading,setLoading]=useState(false);
 const parsed=useMemo(()=>{try{return {clients:prepare(raw),error:''}}catch(e){return {clients:[] as Client[],error:raw?(e as Error).message:''}}},[raw]);
 async function upload(file:File){if(!/\.(csv|tsv|txt)$/i.test(file.name)){setError('Use CSV, TSV ou TXT. Para Excel, copie as células e cole no campo.');return}setRaw(await file.text());setError('');setMessage('')}
 async function submit(){
  setError('');setMessage('');setLoading(true);
  try{
   if(parsed.error||!parsed.clients.length)throw Error(parsed.error||'Nenhum cliente válido.');
   const r=await fetch('/api/clients/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clients:parsed.clients})});
   const j=await r.json();
   if(!r.ok)throw Error(j.error||'Erro na importação.');
   setMessage(j.imported+' cliente(s) importado(s). '+j.skipped+' já existente(s), preservado(s).');
  }catch(e){setError((e as Error).message)}finally{setLoading(false)}
 }
 return <main className={styles.page}><div className={styles.wrap}><div className={styles.top}><div className={styles.brand}><span>S</span><strong>SIHI CRM</strong></div><Link href="/" className={styles.back}>← Voltar ao CRM</Link></div><div className={styles.title}>IMPORTAÇÃO DE DADOS</div><h1>Importar clientes</h1><p className={styles.lead}>Copie a tabela do Excel (incluindo o cabeçalho) e cole abaixo, ou selecione um arquivo CSV/TSV. Os dados são enviados diretamente ao banco apenas quando você confirmar a importação.</p><div className={styles.panel}><div className={styles.buttons}><label className={styles.upload}>Selecionar CSV ou TSV<input type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file)}}/></label><span>ou cole as células copiadas do Excel</span></div><textarea value={raw} onChange={e=>{setRaw(e.target.value);setError('');setMessage('')}} placeholder={'Member ID\tCustomer Segmentation\tClient Profile\tCountries of Sale\tCustomer Name\tKey Products Sold\ttelephone number\nU000001\tLevel 1\tPerfil de exemplo\tBrazil\tNome de exemplo\tProdutos\tTelefone'} spellCheck={false}/><div className={styles.summary}><strong>{parsed.clients.length} cliente(s) identificado(s)</strong><span>Amostra e pré-visualização antes de salvar</span></div>{parsed.clients.length>0&&<div className={styles.preview}><table><thead><tr><th>Member ID</th><th>Cliente</th><th>Segmentação</th><th>Países</th></tr></thead><tbody>{parsed.clients.slice(0,10).map(c=><tr key={c.member_id}><td>{c.member_id}</td><td>{c.customer_name}</td><td>{c.segmentation}</td><td>{c.countries||'—'}</td></tr>)}</tbody></table>{parsed.clients.length>10&&<p>Exibindo os 10 primeiros registros.</p>}</div>}{(error||parsed.error)&&<div className={styles.error}>{error||parsed.error}</div>}{message&&<div className={styles.success}>{message} <Link href="/">Visualizar clientes</Link></div>}<div className={styles.actions}><span>IDs já cadastrados serão ignorados, sem sobrescrever históricos.</span><button onClick={()=>void submit()} disabled={!parsed.clients.length||!!parsed.error||loading}>{loading?'Importando...':'Confirmar importação'}</button></div></div></div></main>
}
