import dotenv from 'dotenv';
dotenv.config();
export const env = {
    PORT: process.env.PORT || 3000,
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
    DB_NAME: process.env.DB_NAME || 'tickets_db',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
    QR_SECRET: process.env.QR_SECRET || 'default-secret-key',
    JWT_SECRET: process.env.JWT_SECRET || 'default-jwt-secret'
};
