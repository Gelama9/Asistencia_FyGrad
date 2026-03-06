import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function setup() {
  try {
    console.log('Creating attendance_overrides table...');
    await sql`
      CREATE TABLE IF NOT EXISTS attendance_overrides (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        date_key TEXT NOT NULL,
        block_type TEXT NOT NULL, -- 'morning' or 'afternoon'
        status TEXT NOT NULL, -- 'Puntual', 'Tardanza', 'Permiso', 'Ninguno'
        notes TEXT,
        payment_amount NUMERIC(10, 2) DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date_key, block_type)
      );
    `;
    console.log('Table created successfully.');
  } catch (error) {
    console.error('Error creating table:', error);
  }
}

setup();
