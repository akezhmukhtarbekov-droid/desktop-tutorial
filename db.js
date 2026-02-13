import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgres://postgres@localhost:5432/postgres',
  ssl: false
});

pool.on('error', (err) => {
  console.error('Ошибка подключения к БД:', err);
});

export default pool;