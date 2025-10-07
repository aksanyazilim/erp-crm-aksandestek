// config/database.js - GÜNCELLENMİŞ
const sql = require('mssql');

const dbConfig = {
    server: 'erp3.aksanteknoloji.com',
    port: 9749,
    database: 'AksanDestek',
    user: 'aksandestek_user',
    password: '11qqaaZZ',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 60000,
        requestTimeout: 60000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool;

const connectDB = async () => {
    try {
        console.log('🔄 Database bağlantısı kuruluyor...');
        pool = await sql.connect(dbConfig);
        
        // Bağlantı testi
        const result = await pool.request().query('SELECT DB_NAME() as dbname');
        console.log('✅ MSSQL veritabanına bağlanıldı!');
        console.log('💾 Database:', result.recordset[0].dbname);
        
        return pool;
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        throw error;
    }
};

const getPool = () => {
    if (!pool) {
        throw new Error('Database bağlantısı yok. Önce connectDB() çağırın.');
    }
    return pool;
};

module.exports = { connectDB, getPool, sql };