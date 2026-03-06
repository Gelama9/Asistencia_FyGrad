const { neon } = require('@neondatabase/serverless');

// Using DATABASE_URL from process.env (passed via dotenv-cli)
const sql = neon(process.env.DATABASE_URL);

async function init() {
    try {
        console.log('--- Initializing Neon Database ---');
        console.log('Creating "attendance" table...');

        await sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        bssid TEXT,
        timestamp TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

        console.log('✅ Table "attendance" created or already exists.');

        // Optional: add an index for faster queries on timestamp and user_id
        await sql`CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance (timestamp DESC)`;
        console.log('✅ Index on timestamp created.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    }
}

init();
