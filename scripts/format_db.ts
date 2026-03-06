import { neon } from '@neondatabase/serverless';

async function main() {
    const sql = neon(process.env.DATABASE_URL!);
    
    console.log("DROPPING ALL TABLES...");
    
    const tables = [
        'attendance',
        'attendance_overrides',
        'late_fee_rules',
        'employee_monthly_summaries',
        'devices',
        '__drizzle_migrations'
    ];

    for (const table of tables) {
        try {
            await sql(`DROP TABLE IF EXISTS "${table}" CASCADE`);
            console.log(`Dropped ${table}`);
        } catch (e) {
            console.error(`Error dropping ${table}:`, e);
        }
    }
    
    console.log("Database formatted!");
}

main().catch(console.error);
