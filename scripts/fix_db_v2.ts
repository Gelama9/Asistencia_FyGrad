import { neon } from '@neondatabase/serverless';

async function main() {
    const sql = neon(process.env.DATABASE_URL!);
    
    console.log("1. Adding columns...");
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_id TEXT;`;
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS display_name TEXT;`;
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS salary_per_block DECIMAL(10, 2) DEFAULT '46.00';`;
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`;

    console.log("2. Migrating 'id' to 'device_id' if needed...");
    // If device_id is null, put something there
    await sql`UPDATE devices SET device_id = id::text WHERE device_id IS NULL;`;

    console.log("3. Dropping PK constraint...");
    await sql`ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_pkey;`;

    console.log("4. Dropping id column...");
    await sql`ALTER TABLE devices DROP COLUMN IF EXISTS id;`;

    console.log("5. Setting new PK...");
    await sql`ALTER TABLE devices ADD PRIMARY KEY (device_id);`;
    
    console.log("All done!");
}

main().catch(console.error);
