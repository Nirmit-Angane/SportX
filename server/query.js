const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DEFAULT_URL = 'postgresql://sportx_jg4g_user:qL7le915KtvQ8N6xNnmKGoRongaCVKdj@dpg-danr8m142hec73feuvcg-a.oregon-postgres.render.com/sportx_jg4g';
const connectionString = process.env.DATABASE_URL || DEFAULT_URL;

const input = process.argv.slice(2).join(' ').trim();

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    if (!input) {
      console.log('\n Connected to PostgreSQL Database (Render)');
      console.log('--------------------------------------------------');
      
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);

      const summary = [];
      for (const row of tablesRes.rows) {
        const countRes = await client.query(`SELECT count(*) FROM "${row.table_name}"`);
        summary.push({
          Table: row.table_name,
          'Total Rows': parseInt(countRes.rows[0].count, 10)
        });
      }

      console.log('\n Available Tables & Row Counts:');
      console.table(summary);

      console.log('\n Usage Examples:');
      console.log('   node query.js <table_name>           e.g. node query.js teams');
      console.log('   node query.js "<sql_query>"          e.g. node query.js "SELECT * FROM matches LIMIT 5"');
      console.log('   npm run db:view teams\n');
      return;
    }

    // Check if input is a simple table name
    const isSingleWord = /^[a-zA-Z0-9_]+$/.test(input);
    let sql = input;
    if (isSingleWord) {
      sql = `SELECT * FROM "${input}" LIMIT 50;`;
      console.log(`\n Showing up to 50 rows from table: "${input}"\n`);
    } else {
      console.log(`\n Executing query: ${sql}\n`);
    }

    const res = await client.query(sql);

    if (res.rows && res.rows.length > 0) {
      console.table(res.rows);
      console.log(`Total rows returned: ${res.rows.length}\n`);
    } else if (res.command) {
      console.log(`Command ${res.command} executed successfully. Rows affected: ${res.rowCount || 0}\n`);
    } else {
      console.log('Query returned 0 rows.\n');
    }
  } catch (err) {
    console.error('\n Database Error:', err.message, '\n');
  } finally {
    await client.end();
  }
}

run();
