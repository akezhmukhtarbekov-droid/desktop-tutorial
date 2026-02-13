const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',              // ← ЗАМЕНИ НА СВОЙ
  password: 'your_password',     // ← ЗАМЕНИ НА СВОЙ ПАРОЛЬ
  database: 'city-complaints',
  host: 'localhost',
  port: 5432,
});

pool.on('connect', () => {
  console.log('✅ Подключено к базе данных PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка базы данных:', err);
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    // Таблица пользователей
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        iin VARCHAR(12) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'citizen',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица жалоб от граждан
    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        user_iin VARCHAR(12) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        address VARCHAR(500) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        photo_before TEXT,
        status VARCHAR(50) DEFAULT 'Принято',
        assigned_worker VARCHAR(12),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица работ (для сотрудников)
    await client.query(`
      CREATE TABLE IF NOT EXISTS work_reports (
        id SERIAL PRIMARY KEY,
        complaint_id INTEGER REFERENCES complaints(id),
        worker_iin VARCHAR(12) NOT NULL,
        photo_after TEXT,
        work_duration INTEGER,
        comment TEXT,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица статистики
    await client.query(`
      CREATE TABLE IF NOT EXISTS statistics (
        id SERIAL PRIMARY KEY,
        complaint_id INTEGER REFERENCES complaints(id),
        category VARCHAR(100),
        resolution_time INTEGER,
        worker_rating INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Все таблицы созданы успешно!');

    // Создаём тестовых пользователей
    await client.query(`
      INSERT INTO users (iin, password, full_name, phone, role)
      VALUES 
        ('091206551005', 'qwerty123', 'Тестовый Житель', '+77001234567', 'citizen'),
        ('990101500123', 'worker123', 'Рабочий Иванов', '+77001111111', 'worker'),
        ('880202600456', 'admin123', 'Администратор Петров', '+77002222222', 'admin')
      ON CONFLICT (iin) DO NOTHING
    `);

    console.log('✅ Тестовые пользователи созданы!');

  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
  } finally {
    client.release();
  }
}

initDatabase();

module.exports = pool;