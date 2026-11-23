const {Pool}=require('pg');
const {randomBytes,scryptSync}=require('node:crypto');
const team=[
 ['João Montenegro','joao.montenegro'],
 ['William Santos','william.santos'],
 ['Guilherme Oliveira','guilherme.oliveira'],
 ['Nathan Augusto','nathan.augusto']
];
async function main(){
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL ausente');
 const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  let created=0;
  for(const [name,username] of team){
   const salt=randomBytes(16).toString('hex');
   const password=randomBytes(32).toString('base64url');
   const hash=salt+':'+scryptSync(password,salt,64).toString('hex');
   const result=await client.query("INSERT INTO crm_users(full_name,username,password_hash,role,active) VALUES($1,$2,$3,'agent',FALSE) ON CONFLICT (username) DO NOTHING RETURNING id",[name,username,hash]);
   created+=result.rowCount||0;
  }
  await client.query('COMMIT');
  console.log('SIHI team bootstrap: created='+created+' inactive accounts; manager must set passwords and activate.');
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release();await pool.end()}
}
main().catch(e=>{console.error('SIHI team bootstrap failed:',e.message);process.exit(1)});
