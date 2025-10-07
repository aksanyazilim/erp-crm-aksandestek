const { getPool, sql } = require('../config/database');

class Ticket {
    static async findAll(user = null) {
        const pool = getPool();
        try {
            let query = `
                SELECT 
                    t.TicketId as id,
                    t.CompanyId as company_id,
                    f.FirmaUnvani as company_name,
                    t.ModuleId as module_id,
                    m.ModuleAdi as module_name,
                    t.Subject as subject,
                    t.Description as description,
                    t.Email as email,
                    t.StatusId as status_id,
                    s.StatusAdi as status_name,
                    t.PriorityId as priority_id,
                    p.Priority as priority_name,
                    t.AssignedUserId as assigned_to,
                    u_assigned.FullName as assigned_to_name,
                    t.CreatedUserId as created_by,
                    u_created.FullName as created_by_name,
                    t.CreatedDate as created_at,
                    t.EditUserId as updated_by,
                    t.EditUserDate as updated_at,
                    t.DueDate as due_date,
                    t.EndDate as resolved_at,
                    t.Active as is_active
                FROM TicketTbl t
                LEFT JOIN FirmaTbl f ON t.CompanyId = f.FirmaId
                LEFT JOIN ModuleTbl m ON t.ModuleId = m.ModuleId
                LEFT JOIN StatusTbl s ON t.StatusId = s.StatusId
                LEFT JOIN PriorityTbl p ON t.PriorityId = p.PriorityId
                LEFT JOIN UserTbl u_assigned ON t.AssignedUserId = u_assigned.UserId
                LEFT JOIN UserTbl u_created ON t.CreatedUserId = u_created.UserId
                WHERE t.Active = 1
            `;

            // Role-based filtering
            if (user) {
                if (user.role === 'customer' && user.company_id) {
                    query += ` AND t.CompanyId = ${user.company_id}`;
                } else if (user.role === 'support') {
                    query += ` AND t.AssignedUserId = ${user.id}`;
                }
            }

            query += ` ORDER BY t.CreatedDate DESC`;

            const result = await pool.request().query(query);
            
            // Status history'leri ekle
            const ticketsWithHistory = await Promise.all(
                result.recordset.map(async (ticket) => {
                    const history = await this.getStatusHistory(ticket.id);
                    return {
                        ...ticket,
                        statusHistory: history
                    };
                })
            );

            return ticketsWithHistory;
        } catch (error) {
            console.error('Ticket findAll error:', error);
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
                        t.TicketId as id,
                        t.CompanyId as company_id,
                        f.FirmaUnvani as company_name,
                        t.ModuleId as module_id,
                        m.ModuleAdi as module_name,
                        t.Subject as subject,
                        t.Description as description,
                        t.Email as email,
                        t.StatusId as status_id,
                        s.StatusAdi as status_name,
                        t.PriorityId as priority_id,
                        p.Priority as priority_name,
                        t.AssignedUserId as assigned_to,
                        u_assigned.FullName as assigned_to_name,
                        t.CreatedUserId as created_by,
                        u_created.FullName as created_by_name,
                        t.CreatedDate as created_at,
                        t.EditUserId as updated_by,
                        t.EditUserDate as updated_at,
                        t.DueDate as due_date,
                        t.EndDate as resolved_at,
                        t.Active as is_active
                    FROM TicketTbl t
                    LEFT JOIN FirmaTbl f ON t.CompanyId = f.FirmaId
                    LEFT JOIN ModuleTbl m ON t.ModuleId = m.ModuleId
                    LEFT JOIN StatusTbl s ON t.StatusId = s.StatusId
                    LEFT JOIN PriorityTbl p ON t.PriorityId = p.PriorityId
                    LEFT JOIN UserTbl u_assigned ON t.AssignedUserId = u_assigned.UserId
                    LEFT JOIN UserTbl u_created ON t.CreatedUserId = u_created.UserId
                    WHERE t.TicketId = @id AND t.Active = 1
                `);
            
            if (result.recordset.length === 0) {
                return null;
            }

            const ticket = result.recordset[0];
            const history = await this.getStatusHistory(ticket.id);
            
            return {
                ...ticket,
                statusHistory: history
            };
        } catch (error) {
            console.error('Ticket findById error:', error);
            throw error;
        }
    }

    static async create(ticketData) {
        const pool = getPool();
        const transaction = new sql.Transaction(pool);
        
        try {
            await transaction.begin();
            
            // Yeni ticket oluştur
            const ticketResult = await transaction.request()
                .input('CompanyId', sql.Int, ticketData.company_id)
                .input('ModuleId', sql.Int, ticketData.module_id)
                .input('Subject', sql.NVarChar, ticketData.subject)
                .input('Description', sql.NVarChar, ticketData.description)
                .input('Email', sql.NVarChar, ticketData.email || '')
                .input('StatusId', sql.Int, 1) // Varsayılan: Yeni
                .input('PriorityId', sql.Int, ticketData.priority_id)
                .input('AssignedUserId', sql.Int, ticketData.assigned_to || null)
                .input('CreatedUserId', sql.Int, ticketData.created_by)
                .input('DueDate', sql.DateTime, ticketData.due_date || null)
                .query(`
                    INSERT INTO TicketTbl (
                        CompanyId, ModuleId, Subject, Description, Email, 
                        StatusId, PriorityId, AssignedUserId, CreatedUserId, DueDate
                    )
                    OUTPUT INSERTED.TicketId as id
                    VALUES (
                        @CompanyId, @ModuleId, @Subject, @Description, @Email,
                        @StatusId, @PriorityId, @AssignedUserId, @CreatedUserId, @DueDate
                    )
                `);
            
            const ticketId = ticketResult.recordset[0].id;
            
            // Status history ekle
            await transaction.request()
                .input('TicketId', sql.Int, ticketId)
                .input('StatusId', sql.Int, 1) // Yeni
                .input('UserId', sql.Int, ticketData.created_by)
                .input('Aciklama', sql.NVarChar, 'Talep oluşturuldu')
                .query(`
                    INSERT INTO TicketHistoryTbl (TicketId, StatusId, UserId, Aciklama)
                    VALUES (@TicketId, @StatusId, @UserId, @Aciklama)
                `);
            
            await transaction.commit();
            
            // Oluşturulan ticket'ı getir
            return await this.findById(ticketId);
        } catch (error) {
            await transaction.rollback();
            console.error('Ticket create error:', error);
            throw error;
        }
    }

    static async update(id, updates) {
        const pool = getPool();
        const transaction = new sql.Transaction(pool);
        
        try {
            await transaction.begin();
            
            // Eski status'u al
            const oldTicketResult = await transaction.request()
                .input('id', sql.Int, id)
                .query('SELECT StatusId FROM TicketTbl WHERE TicketId = @id');
            
            const oldStatusId = oldTicketResult.recordset[0]?.StatusId;
            
            // Ticket'ı güncelle
            const updateQuery = `
                UPDATE TicketTbl 
                SET 
                    CompanyId = @CompanyId,
                    ModuleId = @ModuleId,
                    Subject = @Subject,
                    Description = @Description,
                    Email = @Email,
                    StatusId = @StatusId,
                    PriorityId = @PriorityId,
                    AssignedUserId = @AssignedUserId,
                    EditUserId = @EditUserId,
                    EditUserDate = GETDATE(),
                    DueDate = @DueDate,
                    EndDate = @EndDate
                WHERE TicketId = @TicketId
            `;
            
            await transaction.request()
                .input('TicketId', sql.Int, id)
                .input('CompanyId', sql.Int, updates.company_id)
                .input('ModuleId', sql.Int, updates.module_id)
                .input('Subject', sql.NVarChar, updates.subject)
                .input('Description', sql.NVarChar, updates.description)
                .input('Email', sql.NVarChar, updates.email || '')
                .input('StatusId', sql.Int, updates.status_id)
                .input('PriorityId', sql.Int, updates.priority_id)
                .input('AssignedUserId', sql.Int, updates.assigned_to || null)
                .input('EditUserId', sql.Int, updates.updated_by)
                .input('DueDate', sql.DateTime, updates.due_date || null)
                .input('EndDate', sql.DateTime, updates.end_date || null)
                .query(updateQuery);
            
            // Status değiştiyse history ekle
            if (oldStatusId !== updates.status_id) {
                await transaction.request()
                    .input('TicketId', sql.Int, id)
                    .input('StatusId', sql.Int, updates.status_id)
                    .input('UserId', sql.Int, updates.updated_by)
                    .input('Aciklama', sql.NVarChar, updates.notes || 'Durum güncellendi')
                    .query(`
                        INSERT INTO TicketHistoryTbl (TicketId, StatusId, UserId, Aciklama)
                        VALUES (@TicketId, @StatusId, @UserId, @Aciklama)
                    `);
            }
            
            await transaction.commit();
            
            // Güncellenmiş ticket'ı getir
            return await this.findById(id);
        } catch (error) {
            await transaction.rollback();
            console.error('Ticket update error:', error);
            throw error;
        }
    }

    static async getStatusHistory(ticketId) {
        const pool = getPool();
        try {
            const result = await pool.request()
                .input('ticketId', sql.Int, ticketId)
                .query(`
                    SELECT 
                        th.HistoryId as id,
                        th.TicketId as ticket_id,
                        th.StatusId as status_id,
                        s.StatusAdi as status_name,
                        th.UserId as changed_by,
                        u.FullName as changed_by_name,
                        th.Aciklama as notes,
                        th.CreatedDate as changed_at
                    FROM TicketHistoryTbl th
                    LEFT JOIN StatusTbl s ON th.StatusId = s.StatusId
                    LEFT JOIN UserTbl u ON th.UserId = u.UserId
                    WHERE th.TicketId = @ticketId
                    ORDER BY th.CreatedDate ASC
                `);
            return result.recordset;
        } catch (error) {
            console.error('Get status history error:', error);
            throw error;
        }
    }

    static async getDashboardStats(user = null) {
        const pool = getPool();
        try {
            let query = `
                SELECT 
                    COUNT(*) as total_tickets,
                    SUM(CASE WHEN t.StatusId = 1 THEN 1 ELSE 0 END) as new_tickets,
                    SUM(CASE WHEN t.StatusId = 2 THEN 1 ELSE 0 END) as in_progress_tickets,
                    SUM(CASE WHEN t.StatusId IN (5, 7) THEN 1 ELSE 0 END) as resolved_tickets,
                    SUM(CASE WHEN t.PriorityId = 4 THEN 1 ELSE 0 END) as critical_tickets
                FROM TicketTbl t
                WHERE t.Active = 1
            `;

            // Role-based filtering
            if (user) {
                if (user.role === 'customer' && user.company_id) {
                    query += ` AND t.CompanyId = ${user.company_id}`;
                } else if (user.role === 'support') {
                    query += ` AND t.AssignedUserId = ${user.id}`;
                }
            }

            const result = await pool.request().query(query);
            return result.recordset[0];
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            throw error;
        }
    }
}

module.exports = Ticket;