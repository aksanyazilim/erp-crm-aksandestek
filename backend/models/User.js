const { getPool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async findByEmail(email) {
        const pool = getPool();
        try {
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .query(`
                    SELECT 
                        u.UserId as id,
                        u.FullName as name,
                        u.Username as email,
                        u.Password as password,
                        u.RoleId as role_id,
                        r.RoleTanim as role,
                        u.FirmaId as company_id,
                        f.FirmaUnvani as company_name,
                        u.Active as is_active
                    FROM UserTbl u
                    LEFT JOIN RoleTbl r ON u.RoleId = r.RoleId
                    LEFT JOIN FirmaTbl f ON u.FirmaId = f.FirmaId
                    WHERE u.Username = @email AND u.Active = 1
                `);
            return result.recordset[0];
        } catch (error) {
            console.error('User findByEmail error:', error);
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
                        u.UserId as id,
                        u.FullName as name,
                        u.Username as email,
                        u.Password as password,
                        u.RoleId as role_id,
                        r.RoleTanim as role,
                        u.FirmaId as company_id,
                        f.FirmaUnvani as company_name,
                        u.Active as is_active
                    FROM UserTbl u
                    LEFT JOIN RoleTbl r ON u.RoleId = r.RoleId
                    LEFT JOIN FirmaTbl f ON u.FirmaId = f.FirmaId
                    WHERE u.UserId = @id AND u.Active = 1
                `);
            return result.recordset[0];
        } catch (error) {
            console.error('User findById error:', error);
            throw error;
        }
    }

    static async getSupportUsers() {
        const pool = getPool();
        try {
            const result = await pool.request()
                .query(`
                    SELECT 
                        u.UserId as id,
                        u.FullName as name,
                        u.Username as email,
                        u.RoleId as role_id,
                        r.RoleTanim as role,
                        u.Active as is_active
                    FROM UserTbl u
                    LEFT JOIN RoleTbl r ON u.RoleId = r.RoleId
                    WHERE u.RoleId IN (1, 2) AND u.Active = 1  -- Admin ve Support
                    ORDER BY u.FullName
                `);
            return result.recordset;
        } catch (error) {
            console.error('Get support users error:', error);
            throw error;
        }
    }

    static async getAllUsers() {
        const pool = getPool();
        try {
            const result = await pool.request()
                .query(`
                    SELECT 
                        u.UserId as id,
                        u.FullName as name,
                        u.Username as email,
                        u.RoleId as role_id,
                        r.RoleTanim as role,
                        u.FirmaId as company_id,
                        f.FirmaUnvani as company_name,
                        u.Active as is_active
                    FROM UserTbl u
                    LEFT JOIN RoleTbl r ON u.RoleId = r.RoleId
                    LEFT JOIN FirmaTbl f ON u.FirmaId = f.FirmaId
                    WHERE u.Active = 1
                    ORDER BY u.RoleId, u.FullName
                `);
            return result.recordset;
        } catch (error) {
            console.error('Get all users error:', error);
            throw error;
        }
    }

    static async updateLastLogin(userId) {
        const pool = getPool();
        try {
            // UserTbl'de last_login alanı yoksa bu metodu kaldırabiliriz
            // veya gerekli alanı tabloya ekleyebiliriz
            console.log('Last login update not implemented');
        } catch (error) {
            console.error('Update last login error:', error);
            throw error;
        }
    }
}

module.exports = User;