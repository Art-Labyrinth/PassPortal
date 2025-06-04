import pg from 'pg';
import { env } from '../config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Создаем аналоги __dirname и __filename для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  max: 20, // Максимальное количество подключений в пуле
  idleTimeoutMillis: 30000, // Таймаут ожидания подключения
  password: env.DB_PASSWORD
});


pool.on('error', (err) => {
  console.error('Неожиданная ошибка в клиенте пула PostgreSQL', err);
});

// Проверка подключения при запуске приложения
pool.connect()
  .then(() => console.log('Успешное подключение к базе данных'))
  .catch((err) => console.error('Ошибка подключения к базе данных:', err));


export async function initializeDatabase() {
  try {
    // Подключаемся к БД
    const client = await pool.connect();
    console.log('Успешное подключение к базе данных PostgreSQL');
    
    //Если вы загружаете SQL-файлы, используйте новые пути:
    const sqlPath = path.join(__dirname, '../sql/init.sql');
    
    client.release();
    return true;
  } catch (err) {
    console.error('Ошибка инициализации базы данных:', err);
    throw err;
  }
}

export default pool;
