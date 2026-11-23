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

 CREATE TABLE IF NOT EXISTS follow_up_tasks (
 id BIGSERIAL PRIMARY KEY,
 client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
 title VARCHAR(250) NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 due_date DATE NOT NULL,
 priority VARCHAR(12) NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa','normal','alta')),
 status VARCHAR(12) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','concluida','cancelada')),
 assigned_to VARCHAR(120) NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 completed_at TIMESTAMPTZ
 );
 CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_due ON follow_up_tasks(status,due_date);
 CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_client ON follow_up_tasks(client_id);

 CREATE TABLE IF NOT EXISTS historical_notes (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source_label TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id,source_label)
 );
 CREATE INDEX IF NOT EXISTS idx_historical_notes_client ON historical_notes(client_id,id);

 CREATE TABLE IF NOT EXISTS client_translations (
 id BIGSERIAL PRIMARY KEY,
 client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
 note_id BIGINT NOT NULL REFERENCES historical_notes(id) ON DELETE CASCADE,
 language VARCHAR(5) NOT NULL CHECK (language IN ('pt-BR','en','zh-CN')),
 translated_text TEXT NOT NULL,
 method VARCHAR(12) NOT NULL DEFAULT 'manual' CHECK (method IN ('manual','ai')),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(note_id,language)
 );
 CREATE INDEX IF NOT EXISTS idx_client_translations_client ON client_translations(client_id,note_id);



 `);
 console.log('SIHI CRM schema atualizado');
 } finally {await pool.end();}
}
main().catch(e=>{console.error(e);process.exit(1)});
