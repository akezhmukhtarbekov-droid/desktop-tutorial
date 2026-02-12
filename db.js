const pool = new Pool({
  user: 'qoldau_db_user',           // ← Замените!
  host: 'postgresql://qoldau_db_user:ggCsyJXk9niFYoO0b1yLJNNKNwhTOmqU@dpg-d66qmbumcj7s73doiakg-a/qoldau_db',               // Или адрес вашего сервера
  database: 'qoldau_db',           // Имя вашей базы
  password: 'ggCsyJXk9niFYoO0b1yLJNNKNwhTOmqU',          // ← Замените!
  port: 5432,
});const { Pool } = require('pg');
// Проверка подключения
pool.on('connect', () => {
  console.log('✅ Подключено к базе данных PostgreSQL');
});
pool.on('error', (err) => {
  console.error('❌ Ошибка базы данных:', err);
});
// Создание таблиц при первом запуске
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
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица записей в больницу
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        user_iin VARCHAR(12) NOT NULL,
        hospital VARCHAR(255) NOT NULL,
        department VARCHAR(255),
        doctor VARCHAR(255),
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'Ожидает подтверждения',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_iin) REFERENCES users(iin)
      )
    `);

    // Таблица заявок на документы
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_requests (
        id SERIAL PRIMARY KEY,
        user_iin VARCHAR(12) NOT NULL,
        document_type VARCHAR(255) NOT NULL,
        reason VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Принято',
        request_number VARCHAR(50) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_iin) REFERENCES users(iin)
      )
    `);

    // Таблица справок
    await client.query(`
      CREATE TABLE IF NOT EXISTS certificate_requests (
        id SERIAL PRIMARY KEY,
        user_iin VARCHAR(12) NOT NULL,
        certificate_type VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'В обработке',
        request_number VARCHAR(50) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_iin) REFERENCES users(iin)
      )
    `);

    // Таблица штрафов
    await client.query(`
      CREATE TABLE IF NOT EXISTS fines (
        id SERIAL PRIMARY KEY,
        user_iin VARCHAR(12) NOT NULL,
        fine_type VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        is_paid BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_iin) REFERENCES users(iin)
      )
    `);

    // Таблица пособий
    await client.query(`
      CREATE TABLE IF NOT EXISTS benefit_requests (
        id SERIAL PRIMARY KEY,
        user_iin VARCHAR(12) NOT NULL,
        benefit_type VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'На рассмотрении',
        request_number VARCHAR(50) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_iin) REFERENCES users(iin)
      )
    `);

    console.log('✅ Все таблицы созданы успешно!');
    
    // Добавить тестового пользователя
    await client.query(`
      INSERT INTO users (iin, password, full_name, phone)
      VALUES ('091206551005', 'qwerty123', 'Тестовый Пользователь', '+77001234567')
      ON CONFLICT (iin) DO NOTHING
    `);
    
    console.log('✅ Тестовый пользователь добавлен');

  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
  } finally {
    client.release();
  }require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

}