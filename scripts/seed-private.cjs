const {Pool}=require('pg');
async function main(){
 const encoded=process.env.SIHI_INITIAL_IMPORT;
 if(!encoded){console.log('SIHI private seed not provided; skipping.');return}
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL ausente');
 const entries=JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));
 if(!Array.isArray(entries)||entries.length!==12)throw Error('Expected 12 initial customer records');
 const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});
 const client=await pool.connect();let added=0,existing=0,notes=0;
 try{
  await client.query('BEGIN');
  for(const c of entries){
   if(!/^U\d{6}$/.test(c.id)||!c.name)throw Error('Invalid initial record');
   const result=await client.query("INSERT INTO clients(member_id,customer_name,segmentation,profile,countries,products,phone,original_notes,issues,benefits) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(member_id) DO NOTHING RETURNING id",[c.id,c.name,c.level||'In progress',c.profile||'',c.countries||'',c.products||'',c.phone||'',(c.notes||[]).map(n=>n.label+':\n'+n.text).join('\n\n'),c.issues||'',c.benefits||'']);
   if(result.rowCount)added++;else existing++;
   const row=await client.query('SELECT id FROM clients WHERE member_id=$1',[c.id]);
   const clientId=row.rows[0].id;
   for(const n of c.notes||[]){
    if(!n.label||!n.text)continue;
    const x=await client.query('INSERT INTO historical_notes(client_id,source_label,content) VALUES($1,$2,$3) ON CONFLICT(client_id,source_label) DO NOTHING',[clientId,n.label,n.text]);
    notes+=x.rowCount||0;
   }
  }
  await client.query('COMMIT');
  console.log('SIHI initial import finished: added='+added+',existing='+existing+',notes='+notes);
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release();await pool.end()}
}
main().catch(e=>{console.error('Initial private import failed',e.message);process.exit(1)});
