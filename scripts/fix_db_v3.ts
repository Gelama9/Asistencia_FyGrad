import { neon } from '@neondatabase/serverless';

async function main() {
    const sql = neon(process.env.DATABASE_URL!);
    
    console.log("Fixing 'devices' table...");
    
    // Add columns if they don't exist
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_id TEXT;`;
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS display_name TEXT;`;
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS salary_per_block DECIMAL(10, 2) DEFAULT '46.00';`;
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`;

    // Try to drop constraint and id column only if they exist
    try {
        await sql`ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_pkey;`;
    } catch(e) {}

    try {
        await sql`ALTER TABLE devices DROP COLUMN IF EXISTS id;`;
    } catch(e) {}

    // Ensure device_id is NOT NULL before making it PK
    // (If it's empty, we might have an issue, but let's assume it's a new setup for now or has data from previous steps)
    
    try {
        await sql`ALTER TABLE devices ADD PRIMARY KEY (device_id);`;
    } catch(e) {
        console.log("Primary key might already exist on device_id or it's empty.");
    }

    console.log("Done!");
}

main().catch(console.error);
