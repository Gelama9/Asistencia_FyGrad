import { neon } from '@neondatabase/serverless';

async function main() {
    const sql = neon(process.env.DATABASE_URL!);
    console.log("DROPPING PUBLIC SCHEMA...");
    await sql`DROP SCHEMA public CASCADE;`;
    await sql`CREATE SCHEMA public;`;
    console.log("SCHEMA RESET DONE!");
}

main().catch(console.error);
