import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'utm_links' ORDER BY ORDINAL_POSITION");
console.log("utm_links columns:", rows.map(r => r.COLUMN_NAME));

const [rows2] = await conn.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'click_events' ORDER BY ORDINAL_POSITION");
console.log("click_events columns:", rows2.map(r => r.COLUMN_NAME));

const [rows3] = await conn.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'socials' ORDER BY ORDINAL_POSITION");
console.log("socials columns:", rows3.map(r => r.COLUMN_NAME));

await conn.end();
