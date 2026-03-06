import { neon } from '@neondatabase/serverless';

async function main() {
    const sql = neon(process.env.DATABASE_URL!);
    
    console.log("Applying manual fixes to 'devices' table...");
    
    try {
        // 1. Add missing columns first (handling if they don't exist)
        await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_id TEXT;`;
        await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS display_name TEXT;`;
        await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS salary_per_block DECIMAL(10, 2) DEFAULT '46.00';`;
        await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`;

        // 2. If 'id' is currently the PK, drop it (we'll use device_id as PK in schema)
        // Check if device_id is already the PK. If not, make it.
        // For simplicity in a script, let's just make it if it has data.
        
        console.log("Columns added successfully.");

        // Check if there's an 'id' column to drop
        const hasId = await sql`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'devices' AND column_name = 'id';
        `;
        
        if (hasId.length > 0) {
            console.log("Dropping old primary key constraint...");
            await sql`ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_pkey;`;
            console.log("Dropping 'id' column...");
            await sql`ALTER TABLE devices DROP COLUMN id;`;
        }

        console.log("Setting device_id as primary key...");
        await sql`ALTER TABLE devices ADD PRIMARY KEY (device_id);`;

    } catch (e) {
        console.error("Error applying fixes:", e);
    }
}

main();
