const {Pool} = require('pg');
async function main() {
 if(!process.env.DATABASE_URL) throw Error('DATABASE_URL ausente');
 const pool=new Pool({connectionString:process.env.DATABASE_URL, max:2});
 try { await pool.query(`
 CREATE TABLE IF NOT EXISTS clients (
 id BIGSERIAL PRIMARY KEY,
 member_id VARCHAR(32) UNIQUE,
 customer_name TEXT NOT NULL,
 segmentation VARCHAR(32) NOT NULL DEFAULT 'In progress',
 profile TEXT NOT NULL DEFAULT '',
 countries TEXT NOT NULL DEFAULT '',
 products TEXT NOT NULL DEFAULT '',
 phone TEXT NOT NULL DEFAULT '',
 original_notes TEXT NOT NULL DEFAULT '',
 issues TEXT NOT NULL DEFAULT '',
 benefits TEXT NOT NULL DEFAULT '',
 status VARCHAR(32) NOT NULL DEFAULT 'sem_contato' CHECK (status IN ('sem_contato','tentativa','em_negociacao','recuperado','perdido')),
 next_follow_up DATE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );
 CREATE TABLE IF NOT EXISTS interactions (
 id BIGSERIAL PRIMARY KEY,
 client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
 kind VARCHAR(16) NOT NULL CHECK (kind IN ('ligacao','whatsapp','email','nota')),
 description TEXT NOT NULL,
 outcome VARCHAR(32) NOT NULL DEFAULT 'pendente',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );
 CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
 CREATE INDEX IF NOT EXISTS idx_clients_follow_up ON clients(next_follow_up);
 CREATE INDEX IF NOT EXISTS idx_interactions_client ON interactions(client_id, created_at DESC);
 `);
 console.log('SIHI CRM schema atualizado');
 } finally {await pool.end();}
}
main().catch(e=>{console.error(e);process.exit(1)});
