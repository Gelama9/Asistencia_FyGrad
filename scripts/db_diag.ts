import { neon } from '@neondatabase/serverless';

async function main() {
    const sql = neon(process.env.DATABASE_URL!);
    
    console.log("--- DEVICES COLUMNS ---");
    const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'devices';
    `;
    console.table(columns);

    console.log("--- DEVICES CONSTRAINTS ---");
    const constraints = await sql`
        SELECT conname, contype
        FROM pg_constraint
        JOIN pg_class ON pg_class.oid = pg_constraint.conrelid
        WHERE relname = 'devices';
    `;
    console.table(constraints);
}

main();
