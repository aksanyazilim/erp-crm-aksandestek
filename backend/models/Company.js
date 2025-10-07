// models/Company.js - YENİ SQL'E GÖRE
const { getPool, sql } = require('../config/database');

class Company {
    static async findAll() {
        const pool = getPool();
        try {
            const result = await pool.request()
                .query(`
                    SELECT 
                        f.FirmaId as id,
                        f.FirmaUnvani as name,
                        f.Aktif as is_active
                    FROM FirmaTbl f
                    WHERE f.Aktif = 1
                    ORDER BY f.FirmaUnvani
                `);
            return result.recordset;
        } catch (error) {
            console.error('Company findAll error:', error);
            throw error;
        }
    }

    static async findById(id) {
        const pool = getPool();
        try {
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        f.FirmaId as id,
                        f.FirmaUnvani as name,
                        f.Aktif as is_active
                    FROM FirmaTbl f
                    WHERE f.FirmaId = @id AND f.Aktif = 1
                `);
            return result.recordset[0];
        } catch (error) {
            console.error('Company findById error:', error);
            throw error;
        }
    }
}

module.exports = Company;