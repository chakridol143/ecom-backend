// import mysql from 'mysql2/promise';
// import dotenv from 'dotenv';
// dotenv.config();

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_NAME, 
//   port: Number(process.env.DB_PORT || 3306),
//   connectionLimit: 10
// });
// export default pool;

// import mysql from 'mysql2/promise';
// import dotenv from 'dotenv';
// dotenv.config();
// export const db = mysql.createPool({
//   host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
//   user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
//   password: process.env.MYSQLPASSWORD || process.env.DB_PASS || '',
//   database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'ecom-db',
//   port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
//   connectionLimit: 10
// });
// export default db;
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
});

export default db;
