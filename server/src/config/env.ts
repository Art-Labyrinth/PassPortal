import dotenv from 'dotenv';

// Загрузка переменных из файла .env
dotenv.config();

export const env = {
  PORT: process.env.PORT || '3000',
  
  // База данных
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_NAME: process.env.DB_NAME || 'tickets',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  
  // Секреты
  JWT_SECRET: process.env.JWT_SECRET || 'default-jwt-secret-key-change-in-production',
  QR_SECRET: process.env.QR_SECRET || 'default-qr-secret-key-change-in-production',
  
  // Другие настройки
  NODE_ENV: process.env.NODE_ENV || 'development',
};
