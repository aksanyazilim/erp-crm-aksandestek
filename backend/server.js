const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult, param } = require('express-validator');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { connectDB, getPool, sql } = require('./config/database');

const app = express();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/tickets';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ticket-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('📎 File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype
    });

    // ✅ GENİŞLETİLMİŞ DOSYA TİPLERİ
    const allowedExtensions = /jpeg|jpg|png|gif|bmp|svg|pdf|doc|docx|xls|xlsx|txt|zip|rar|7z|csv|ppt|pptx/;
    const allowedMimeTypes = [
      // Resimler
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml',
      // PDF
      'application/pdf',
      // Word
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      // Excel
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      // PowerPoint
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      // Text
      'text/plain', 'text/csv',
      // Zip
      'application/zip', 'application/x-zip-compressed',
      'application/x-rar-compressed', 'application/x-7z-compressed',
      // Genel binary
      'application/octet-stream'
    ];

    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    // ✅ Extension VEYA mimetype eşleşirse kabul et
    if (mimetype || extname) {
      console.log('✅ File accepted:', file.originalname);
      return cb(null, true);
    } else {
      console.log('❌ File rejected:', {
        name: file.originalname,
        mimetype: file.mimetype,
        extension: path.extname(file.originalname)
      });
      cb(new Error(`Desteklenmeyen dosya formatı: ${file.originalname}`));
    }
  }
});

// Middleware
app.use(cors({
    origin: [
        'https://aksandestek-mwp6bun0y-bediraksans-projects.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware (sadece development'ta)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// ✅ Yüklenebilir dosya tiplerini göster
console.log('📋 Yüklenebilir Dosya Tipleri:');
console.log('  🖼️  Resim: JPG, PNG, GIF, BMP, SVG');
console.log('  📄 PDF: PDF');
console.log('  📝 Word: DOC, DOCX');
console.log('  📊 Excel: XLS, XLSX, CSV');
console.log('  📽️  PowerPoint: PPT, PPTX');
console.log('  📦 Arşiv: ZIP, RAR, 7Z');
console.log('  📃 Metin: TXT');
console.log('  💾 Maksimum Boyut: 10MB');

// Database bağlantısını başlat
connectDB().then(() => {
    console.log('🚀 Backend MSSQL ile hazır!');
}).catch(error => {
    console.error('❌ Database bağlantısı başarısız:', error.message);
    process.exit(1);
});

// Rate limiting benzeri basit koruma
const requestTimestamps = new Map();
const RATE_LIMIT_WINDOW = 15 * 1000; // 15 saniye
const MAX_REQUESTS_PER_WINDOW = 50;

const checkRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Eski timestamp'leri temizle
  for (const [key, timestamp] of requestTimestamps.entries()) {
    if (timestamp < windowStart) {
      requestTimestamps.delete(key);
    }
  }

  const userRequests = Array.from(requestTimestamps.entries())
    .filter(([key]) => key.startsWith(ip))
    .map(([, timestamp]) => timestamp)
    .filter(timestamp => timestamp > windowStart);

  if (userRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ 
      error: 'Too many requests. Please slow down.' 
    });
  }

  requestTimestamps.set(`${ip}-${now}`, now);
  next();
};
app.post('/api/tickets/:id/upload', checkRateLimit, upload.array('files', 5), async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const ticketId = parseInt(req.params.id);
    const pool = getPool();

    console.log(`📎 File upload for ticket ${ticketId} by user ${decoded.userId}`);
    console.log(`📦 Files received:`, req.files?.length || 0);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    // Ticket'ın var olduğunu kontrol et
    const ticketResult = await pool.request()
      .input('ticketId', sql.Int, ticketId)
      .query('SELECT TicketId FROM TicketTbl WHERE TicketId = @ticketId AND Active = 1');

    if (ticketResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

 const uploadedFiles = [];
    
for (const file of req.files) {
  try {
    console.log(`💾 Saving file: ${file.originalname} (${file.size} bytes)`);
    
    // ✅ FileType'ı kısalt (güvenlik için)
    const shortFileType = file.mimetype.substring(0, 50);
    
    const result = await pool.request()
      .input('TicketId', sql.Int, ticketId)
      .input('FileName', sql.NVarChar, file.originalname)
      .input('FilePath', sql.NVarChar, file.path)
      .input('FileSize', sql.Int, file.size)
      .input('UploadUserId', sql.Int, decoded.userId)
      .input('FileType', sql.NVarChar, shortFileType) // ✅ Kısaltılmış FileType
      .query(`
        INSERT INTO TicketFilesTbl (TicketId, FileName, FilePath, FileSize, UploadUserId, UploadDate, FileType)
        OUTPUT INSERTED.FileId, INSERTED.FileName, INSERTED.FilePath, INSERTED.FileSize, 
               INSERTED.UploadDate, INSERTED.UploadUserId, INSERTED.FileType
        VALUES (@TicketId, @FileName, @FilePath, @FileSize, @UploadUserId, GETDATE(), @FileType)
      `);

    if (result.recordset && result.recordset[0]) {
      uploadedFiles.push(result.recordset[0]);
      console.log(`✅ File saved: ${file.originalname}`);
    }
  } catch (fileError) {
    console.error(`❌ Error saving file ${file.originalname}:`, fileError);
  }
}
console.log(`🎉 Total files uploaded: ${uploadedFiles.length}/${req.files.length}`);

    res.json({
      message: `${uploadedFiles.length} dosya başarıyla yüklendi`,
      files: uploadedFiles.map(file => ({
        id: file.FileId,
        name: file.FileName,
        filePath: file.FilePath,
        size: file.FileSize,
        uploaded_at: file.UploadDate,
        uploaded_by: file.UploadUserId,
        type: file.FileType
      }))
    });

  } catch (error) {
    console.error('❌ File upload error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});
// Dosya listeleme endpoint'i - TicketFilesTbl için
app.get('/api/tickets/:id/files', checkRateLimit, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const ticketId = parseInt(req.params.id);
    const pool = getPool();

    const filesResult = await pool.request()
      .input('ticketId', sql.Int, ticketId)
      .query(`
        SELECT 
          FileId as id,
          FileName as name,
          FilePath as filePath,
          FileSize as size,
          UploadDate as uploaded_at,
          UploadUserId as uploaded_by,
          FileType as type
        FROM TicketFilesTbl 
        WHERE TicketId = @ticketId
        ORDER BY UploadDate DESC
      `);

    console.log(`📁 Found ${filesResult.recordset.length} files for ticket ${ticketId}`);
    res.json(filesResult.recordset);

  } catch (error) {
    console.error('❌ Get files error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Dosya indirme endpoint'i
// Dosya indirme endpoint'i - TicketFilesTbl için
app.get('/api/tickets/files/download', checkRateLimit, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const fileId = parseInt(req.query.fileId);
    const pool = getPool();

    console.log(`📥 Download request for fileId: ${fileId}`);

    // Dosya bilgilerini al
    const fileResult = await pool.request()
      .input('fileId', sql.Int, fileId)
      .query(`
        SELECT FileId, FileName, FilePath, FileSize 
        FROM TicketFilesTbl 
        WHERE FileId = @fileId
      `);

    if (fileResult.recordset.length === 0) {
      console.log(`❌ File not found in database: ${fileId}`);
      return res.status(404).json({ error: 'File not found.' });
    }

    const file = fileResult.recordset[0];
    const filePath = file.FilePath;

    console.log(`📄 File found: ${file.FileName}, path: ${filePath}`);

    // Dosya var mı kontrol et
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Physical file not found: ${filePath}`);
      return res.status(404).json({ error: 'Physical file not found.' });
    }

    // İndirme için header'ları ayarla
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.FileName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', file.FileSize);

    // Dosyayı stream et
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('❌ File stream error:', error);
      res.status(500).json({ error: 'File stream error.' });
    });

  } catch (error) {
    console.error('❌ Download endpoint error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Dosya silme endpoint'i - TicketFilesTbl için
app.delete('/api/tickets/files/:fileId', checkRateLimit, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const fileId = parseInt(req.params.fileId);
    const pool = getPool();

    console.log(`🗑️ Delete request for fileId: ${fileId}`);

    // Önce dosya bilgilerini al
    const fileResult = await pool.request()
      .input('fileId', sql.Int, fileId)
      .query('SELECT FilePath FROM TicketFilesTbl WHERE FileId = @fileId');

    if (fileResult.recordset.length === 0) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const filePath = fileResult.recordset[0].FilePath;

    // Dosyayı fiziksel olarak sil
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Physical file deleted: ${filePath}`);
    } else {
      console.log(`⚠️ Physical file not found, but deleting from DB: ${filePath}`);
    }

    // Veritabanından sil
    await pool.request()
      .input('fileId', sql.Int, fileId)
      .query('DELETE FROM TicketFilesTbl WHERE FileId = @fileId');

    console.log(`✅ File ${fileId} deleted successfully from database`);
    res.json({ message: 'Dosya başarıyla silindi' });

  } catch (error) {
    console.error('❌ Delete file error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});
// Health check route
app.get('/api/health', async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query('SELECT 1 as status');
        
        res.json({ 
            status: 'OK', 
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'ERROR', 
            database: 'disconnected',
            error: error.message
        });
    }
});

app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 1 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        const pool = getPool();
        
        console.log('🔐 Login attempt:', email);

        // Kullanıcıyı bul
        const userResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT 
                    u.UserId as id,
                    u.FullName as name,
                    u.Username as email,
                    u.Password as password,
                    u.RoleId as role_id,
                    r.RoleTanim as role_name,  -- RoleTanim olarak al
                    u.FirmaId as company_id,
                    f.FirmaUnvani as company_name,
                    u.Active as is_active
                FROM UserTbl u
                LEFT JOIN RoleTbl r ON u.RoleId = r.RoleId
                LEFT JOIN FirmaTbl f ON u.FirmaId = f.FirmaId
                WHERE u.Username = @email AND u.Active = 1
            `);

        if (userResult.recordset.length === 0) {
            console.log('❌ User not found:', email);
            return res.status(400).json({ error: 'Geçersiz email veya şifre' });
        }

        const user = userResult.recordset[0];
        console.log('✅ User found:', user.name, 'Role Name:', user.role_name);

        // ROLE MAPPING - Türkçe'den İngilizce'ye çevir
        const roleMapping = {
            'Admin': 'admin',
            'Destek': 'support', 
            'Müşteri': 'customer'
        };

        const mappedRole = roleMapping[user.role_name] || 'customer';
        
        console.log('🔄 Role mapping:', {
            turkish: user.role_name,
            english: mappedRole,
            role_id: user.role_id
        });

        // Şifre kontrolü
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.password);
            console.log('🔑 BCrypt match result:', isMatch);
            
            // Eğer false ise, acil durum kontrolü
            if (!isMatch && process.env.NODE_ENV === 'development') {
                console.log('🆘 ACİL: Development fallback aktif');
                isMatch = (password === 'password');
            }
        } catch (bcryptError) {
            console.error('❌ BCrypt error:', bcryptError.message);
            if (process.env.NODE_ENV === 'development') {
                isMatch = (password === 'password');
            }
        }
        
        if (!isMatch) {
            console.log('❌ Password mismatch');
            return res.status(400).json({ error: 'Geçersiz email veya şifre' });
        }

        // BAŞARILI LOGIN
        console.log('🎉 Login successful! Role:', mappedRole);
        
        // Token oluştur - MAPPED ROLE kullan
        const token = jwt.sign(
            { 
                userId: user.id, 
                role: mappedRole,  // mapped role kullan
                email: user.email 
            },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Response hazırla - mapped role kullan
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            role_id: user.role_id,
            role: mappedRole,  // mapped role kullan
            company_id: user.company_id,
            company_name: user.company_name,
            is_active: user.is_active
        };

        res.json({
            message: 'Login successful',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});
// server.js - VERIFY ENDPOINT GÜNCELLEMESİ
app.get('/api/auth/verify', checkRateLimit, async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        const pool = getPool();
        
        const userResult = await pool.request()
            .input('id', sql.Int, decoded.userId)
            .query(`
                SELECT 
                    u.UserId as id,
                    u.FullName as name,
                    u.Username as email,
                    u.RoleId as role_id,
                    r.RoleTanim as role_name,  -- RoleTanim olarak al
                    u.FirmaId as company_id,
                    f.FirmaUnvani as company_name,
                    u.Active as is_active
                FROM UserTbl u
                LEFT JOIN RoleTbl r ON u.RoleId = r.RoleId
                LEFT JOIN FirmaTbl f ON u.FirmaId = f.FirmaId
                WHERE u.UserId = @id AND u.Active = 1
            `);

        if (userResult.recordset.length === 0) {
            return res.status(401).json({ error: 'Token is not valid.' });
        }

        const user = userResult.recordset[0];

        // Aynı role mapping'i verify'de de uygula
        const roleMapping = {
            'Admin': 'admin',
            'Destek': 'support',
            'Müşteri': 'customer'
        };

        const mappedRole = roleMapping[user.role_name] || 'customer';

        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            role_id: user.role_id,
            role: mappedRole,  // mapped role kullan
            company_id: user.company_id,
            company_name: user.company_name,
            is_active: user.is_active
        };

        res.json({ user: userResponse });
    } catch (error) {
        console.error('❌ Verify error:', error);
        res.status(401).json({ error: 'Token is not valid.' });
    }
});

// server.js - DÜZELTİLMİŞ TICKETS ENDPOINT
app.get('/api/tickets', checkRateLimit, async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        const pool = getPool();
        
        console.log(`👤 User ${decoded.userId} (${decoded.role}) fetching tickets`);

        // Önce kullanıcı bilgilerini al
        const userResult = await pool.request()
            .input('userId', sql.Int, decoded.userId)
            .query(`
                SELECT 
                    u.UserId as id,
                    u.FullName as name,
                    u.RoleId as role_id,
                    r.RoleTanim as role_name,
                    u.FirmaId as company_id
                FROM UserTbl u
                LEFT JOIN RoleTbl r ON u.RoleId = r.RoleId
                WHERE u.UserId = @userId AND u.Active = 1
            `);
        
        if (userResult.recordset.length === 0) {
            return res.status(401).json({ error: 'User not found.' });
        }

        const user = userResult.recordset[0];
        
        // Role mapping
        const roleMapping = {
            'Admin': 'admin',
            'Destek': 'support', 
            'Müşteri': 'customer'
        };
        const userRole = roleMapping[user.role_name] || 'customer';

        console.log(`🔍 User details:`, {
            id: user.id,
            name: user.name,
            role_id: user.role_id,
            role_name: user.role_name,
            mapped_role: userRole,
            company_id: user.company_id
        });

        // ROLE-BASED TICKET QUERY - DOĞRU FİLTRELEME
        let query = `
            SELECT 
                t.TicketId as id,
                t.CompanyId as company_id,
                f.FirmaUnvani as company_name,
                t.ModuleId as module_id,
                m.ModuleAdi as module_name,  -- ✅ MODULE NAME EKLENDİ
                t.Subject as subject,
                t.Description as description,
                t.Email as email,
                t.MailContent as mail_content,
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
            LEFT JOIN ModuleTbl m ON t.ModuleId = m.ModuleId  -- ✅ MODULE JOIN
            LEFT JOIN StatusTbl s ON t.StatusId = s.StatusId
            LEFT JOIN PriorityTbl p ON t.PriorityId = p.PriorityId
            LEFT JOIN UserTbl u_assigned ON t.AssignedUserId = u_assigned.UserId
            LEFT JOIN UserTbl u_created ON t.CreatedUserId = u_created.UserId
            WHERE t.Active = 1
        `;

        const request = pool.request();

        // DOĞRU ROLE-BASED FILTERING
        if (userRole === 'customer') {
            query += ` AND t.CompanyId = @companyId`;
            request.input('companyId', sql.Int, user.company_id);
            console.log(`🔒 Customer filter: company_id = ${user.company_id}`);
            
        } else if (userRole === 'support') {
            query += ` AND t.AssignedUserId = @userId`;
            request.input('userId', sql.Int, user.id);
            console.log(`🔧 Support filter: assigned_to = ${user.id} (ONLY ASSIGNED TICKETS)`);
        }

        query += ` ORDER BY t.CreatedDate DESC`;

        console.log(`📋 Executing query for ${userRole} user`);
        const ticketsResult = await request.query(query);
        
        console.log(`✅ ${userRole} kullanıcısı için ${ticketsResult.recordset.length} talep bulundu`);

        // Status history'leri al
        const ticketsWithHistory = await Promise.all(
            ticketsResult.recordset.map(async (ticket) => {
                try {
                    const historyResult = await pool.request()
                        .input('ticketId', sql.Int, ticket.id)
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
                    
                    return {
                        ...ticket,
                        statusHistory: historyResult.recordset
                    };
                } catch (historyError) {
                    console.error(`❌ Error fetching history for ticket ${ticket.id}:`, historyError);
                    return {
                        ...ticket,
                        statusHistory: []
                    };
                }
            })
        );

        res.json(ticketsWithHistory);

    } catch (error) {
        console.error('❌ Get tickets error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

app.post('/api/tickets', checkRateLimit, [
    body('subject').notEmpty().withMessage('Subject is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('company_id').isInt({ min: 1 }).withMessage('Valid company is required'),
    body('module_id').isInt({ min: 1 }).withMessage('Valid module is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        const pool = getPool();
        
        console.log('📝 Create ticket request by user:', decoded.userId);
        console.log('📦 Request body:', req.body);

        // Kullanıcı bilgilerini al
        const userResult = await pool.request()
            .input('userId', sql.Int, decoded.userId)
            .query(`
                SELECT 
                    u.UserId as id,
                    u.FullName as name,
                    u.RoleId as role_id,
                    r.RoleTanim as role_name,
                    u.FirmaId as company_id
                FROM UserTbl u
                LEFT JOIN RoleTbl r ON u.RoleId = r.RoleId
                WHERE u.UserId = @userId AND u.Active = 1
            `);
        
        if (userResult.recordset.length === 0) {
            return res.status(401).json({ error: 'User not found.' });
        }

        const user = userResult.recordset[0];
        const roleMapping = {
            'Admin': 'admin',
            'Destek': 'support', 
            'Müşteri': 'customer'
        };
        const userRole = roleMapping[user.role_name] || 'customer';

        console.log(`👤 Creating ticket as ${userRole}:`, user.name);

        const {
            company_id,
            module_id,
            subject,
            description,
            email,
            priority_id = 2,
            assigned_to = null,
            due_date = null,
            mail_content = ''
        } = req.body;

        // ROLE-BASED VALIDATION
        let finalCompanyId = company_id;
        
        if (userRole === 'customer') {
            finalCompanyId = user.company_id;
            console.log(`🔒 Customer forced to use company_id: ${finalCompanyId}`);
        } else if (userRole === 'support') {
            return res.status(403).json({ 
                error: 'Destek personeli yeni talep oluşturulamaz' 
            });
        }

        console.log('🎯 Final ticket data:', {
            company_id: finalCompanyId,
            module_id,
            subject,
            description,
            email,
            priority_id,
            assigned_to,
            due_date,
            mail_content,
            created_by: user.id
        });

        // Ticket oluştur
        const ticketResult = await pool.request()
            .input('CompanyId', sql.Int, finalCompanyId)
            .input('ModuleId', sql.Int, module_id)
            .input('Subject', sql.NVarChar, subject)
            .input('Description', sql.NVarChar, description)
            .input('Email', sql.NVarChar, email || '')
            .input('MailContent', sql.NVarChar, mail_content)
            .input('StatusId', sql.Int, 1)
            .input('PriorityId', sql.Int, priority_id)
            .input('AssignedUserId', sql.Int, assigned_to)
            .input('CreatedUserId', sql.Int, user.id)
            .input('DueDate', sql.DateTime, due_date)
            .query(`
                INSERT INTO TicketTbl (
                    CompanyId, ModuleId, Subject, Description, Email, MailContent,
                    StatusId, PriorityId, AssignedUserId, CreatedUserId, DueDate,
                    CreatedDate, Active
                )
                OUTPUT INSERTED.TicketId as id
                VALUES (
                    @CompanyId, @ModuleId, @Subject, @Description, @Email, @MailContent,
                    @StatusId, @PriorityId, @AssignedUserId, @CreatedUserId, @DueDate,
                    GETUTCDATE(), 1
                )
            `);

        const ticketId = ticketResult.recordset[0].id;

        // Status history ekle
        await pool.request()
            .input('TicketId', sql.Int, ticketId)
            .input('StatusId', sql.Int, 1)
            .input('UserId', sql.Int, user.id)
            .input('Aciklama', sql.NVarChar, 'Talep oluşturuldu')
            .query(`
                INSERT INTO TicketHistoryTbl (TicketId, StatusId, UserId, Aciklama, CreatedDate)
                VALUES (@TicketId, @StatusId, @UserId, @Aciklama, GETUTCDATE())
            `);

        console.log(`✅ New ticket created by ${userRole}:`, {
            ticketId: ticketId,
            companyId: finalCompanyId,
            subject: subject,
            mailContent: mail_content ? 'with mail content' : 'no mail content',
            createdBy: user.name
        });

        // Oluşturulan ticket'ı getir - MODULE NAME EKLENDİ
        const newTicketResult = await pool.request()
            .input('ticketId', sql.Int, ticketId)
            .query(`
                SELECT 
                    t.TicketId as id,
                    t.CompanyId as company_id,
                    f.FirmaUnvani as company_name,
                    t.ModuleId as module_id,
                    m.ModuleAdi as module_name,  -- ✅ MODULE NAME EKLENDİ
                    t.Subject as subject,
                    t.Description as description,
                    t.Email as email,
                    t.MailContent as mail_content,
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
                    t.EndDate as resolved_at
                FROM TicketTbl t
                LEFT JOIN FirmaTbl f ON t.CompanyId = f.FirmaId
                LEFT JOIN ModuleTbl m ON t.ModuleId = m.ModuleId  -- ✅ MODULE JOIN
                LEFT JOIN StatusTbl s ON t.StatusId = s.StatusId
                LEFT JOIN PriorityTbl p ON t.PriorityId = p.PriorityId
                LEFT JOIN UserTbl u_assigned ON t.AssignedUserId = u_assigned.UserId
                LEFT JOIN UserTbl u_created ON t.CreatedUserId = u_created.UserId
                WHERE t.TicketId = @ticketId
            `);

        const newTicket = newTicketResult.recordset[0];

        // Status history getir
        const historyResult = await pool.request()
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

        const ticketWithHistory = {
            ...newTicket,
            statusHistory: historyResult.recordset
        };

        res.status(201).json(ticketWithHistory);

    } catch (error) {
        console.error('❌ Create ticket error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});
// ================== UPDATE TICKET (PUT) ==================
app.put(
  '/api/tickets/:id',
  checkRateLimit,
  [
    param('id').isInt({ min: 1 }),
    body('status_id').optional().isInt({ min: 1 }),
    body('priority_id').optional().isInt({ min: 1 }),
    body('assigned_to').optional({ nullable: true }).isInt({ min: 1 }),
    body('notes').optional().isString().isLength({ max: 500 }),
    body('due_date').optional({ nullable: true }).isISO8601().toDate(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      const ticketId = parseInt(req.params.id, 10);
      const pool = getPool();

      // Kullanıcı ve rolünü çek
      const meRes = await pool.request()
        .input('userId', sql.Int, decoded.userId)
        .query(`
          SELECT u.UserId id, u.FullName name, u.RoleId role_id, r.RoleTanim role_name
          FROM UserTbl u
          LEFT JOIN RoleTbl r ON u.RoleId = r.RoleId
          WHERE u.UserId = @userId AND u.Active = 1
        `);
      if (meRes.recordset.length === 0) return res.status(401).json({ error: 'User not found.' });

      const me = meRes.recordset[0];
      const roleMap = { 'Admin': 'admin', 'Destek': 'support', 'Müşteri': 'customer' };
      const myRole = roleMap[me.role_name] || 'customer';

      console.log(`👤 User ${me.name} (${myRole}) updating ticket ${ticketId}`);

      // Mevcut ticket
      const curRes = await pool.request()
        .input('ticketId', sql.Int, ticketId)
        .query(`
          SELECT TicketId id, StatusId status_id, PriorityId priority_id, AssignedUserId assigned_to,
                 DueDate due_date, Active
          FROM TicketTbl
          WHERE TicketId = @ticketId AND Active = 1
        `);
      if (curRes.recordset.length === 0) return res.status(404).json({ error: 'Ticket not found.' });

      const current = curRes.recordset[0];

      // Yetki kontrolü
      if (myRole === 'customer') {
        return res.status(403).json({ error: 'Müşteriler talep güncelleyemez.' });
      }
      if (myRole === 'support' && current.assigned_to !== me.id) {
        return res.status(403).json({ error: 'Bu talep size atanmadı; güncelleyemezsiniz.' });
      }

      const {
        status_id = current.status_id,
        priority_id = current.priority_id,
        assigned_to = current.assigned_to,
        notes = null,
        due_date = current.due_date
      } = req.body;

      console.log('📝 Update data:', {
        status_id,
        priority_id,
        assigned_to,
        notes: notes ? 'with notes' : 'no notes',
        due_date
      });

      // ÖNEMLİ: Mühendisler öncelik değiştiremez
      let finalPriorityId = priority_id;
      if (myRole === 'support') {
        finalPriorityId = current.priority_id; // Önceliği değiştiremez
        console.log(`🔒 Support user cannot change priority, keeping: ${finalPriorityId}`);
      }

      // ÖNEMLİ: Admin atama yapınca otomatik "Atandı" durumu
      let finalStatusId = status_id;
      let finalAssignedTo = assigned_to;
      
      // Eğer admin atama yapıyorsa ve önceki durum "Yeni" (1) ise otomatik "Atandı" (2) yap
      if (myRole === 'admin' && assigned_to && assigned_to !== current.assigned_to && current.status_id === 1) {
        finalStatusId = 2; // "Atandı" durumu
        console.log(`🔄 Admin assigned ticket, auto-changing status to "Atandı" (2)`);
      }

      // Mühendisler "Yeni" durumuna geri dönemez
      if (myRole === 'support' && finalStatusId === 1) {
        return res.status(403).json({ error: 'Talep "Yeni" durumuna geri döndürülemez.' });
      }

      // Admin değilse atama değişikliğini engelle
      if (myRole !== 'admin' && assigned_to !== undefined && assigned_to !== current.assigned_to) {
        return res.status(403).json({ error: 'Sadece admin atama yapabilir.' });
      }

      // Ana update
      await pool.request()
        .input('TicketId', sql.Int, ticketId)
        .input('StatusId', sql.Int, finalStatusId)
        .input('PriorityId', sql.Int, finalPriorityId)
        .input('AssignedUserId', sql.Int, finalAssignedTo)
        .input('EditUserId', sql.Int, me.id)
        .input('DueDate', due_date ? sql.DateTime : sql.DateTime, due_date || null)
        .query(`
          UPDATE TicketTbl
          SET StatusId = @StatusId,
              PriorityId = @PriorityId,
              AssignedUserId = @AssignedUserId,
              EditUserId = @EditUserId,
              EditUserDate = GETUTCDATE(),
              DueDate = @DueDate
          WHERE TicketId = @TicketId AND Active = 1
        `);

      // Kapanış durumları için EndDate yönetimi
      const isClosing = Number(finalStatusId) === 6 || Number(finalStatusId) === 8; // Tamamlandı veya Kapandı
      const wasClosing = Number(current.status_id) === 6 || Number(current.status_id) === 8;

      if (isClosing) {
        await pool.request()
          .input('TicketId', sql.Int, ticketId)
          .query(`UPDATE TicketTbl SET EndDate = GETUTCDATE() WHERE TicketId = @TicketId AND Active = 1`);
      } else if (wasClosing && !isClosing) {
        await pool.request()
          .input('TicketId', sql.Int, ticketId)
          .query(`UPDATE TicketTbl SET EndDate = NULL WHERE TicketId = @TicketId AND Active = 1`);
      }

      // Status history: durum değiştiyse veya not varsa kayıt aç
      const statusChanged = Number(finalStatusId) !== Number(current.status_id);
      const assignmentChanged = finalAssignedTo !== current.assigned_to;
      
      if (statusChanged || assignmentChanged || (notes && notes.trim())) {
        let historyNote = '';
        
        if (notes && notes.trim()) {
          historyNote += historyNote ? ' | ' : '';
          historyNote += `Not: ${notes}`;
        }

        await pool.request()
          .input('TicketId', sql.Int, ticketId)
          .input('StatusId', sql.Int, finalStatusId)
          .input('UserId', sql.Int, me.id)
          .input('Aciklama', sql.NVarChar, historyNote || 'Güncelleme yapıldı')
          .query(`
            INSERT INTO TicketHistoryTbl (TicketId, StatusId, UserId, Aciklama, CreatedDate)
            VALUES (@TicketId, @StatusId, @UserId, @Aciklama, GETUTCDATE())
          `);
      }

      console.log(`✅ Ticket ${ticketId} updated successfully`);

      // Güncellenmiş kaydı ve history'yi geri döndür
      const ticketRes = await pool.request()
        .input('ticketId', sql.Int, ticketId)
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
            t.MailContent as mail_content,
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
            t.EndDate as resolved_at
          FROM TicketTbl t
          LEFT JOIN FirmaTbl f ON t.CompanyId = f.FirmaId
          LEFT JOIN ModuleTbl m ON t.ModuleId = m.ModuleId
          LEFT JOIN StatusTbl s ON t.StatusId = s.StatusId
          LEFT JOIN PriorityTbl p ON t.PriorityId = p.PriorityId
          LEFT JOIN UserTbl u_assigned ON t.AssignedUserId = u_assigned.UserId
          LEFT JOIN UserTbl u_created ON t.CreatedUserId = u_created.UserId
          WHERE t.TicketId = @ticketId
        `);

      const histRes = await pool.request()
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

      const updated = ticketRes.recordset[0];
      if (!updated) return res.status(404).json({ error: 'Ticket not found after update.' });

      res.json({ ...updated, statusHistory: histRes.recordset });
    } catch (error) {
      console.error('❌ Update ticket error:', error);
      res.status(500).json({ error: 'Server error: ' + error.message });
    }
  }
);

// server.js - DELETE TICKET ENDPOINT DÜZELTMESİ
app.delete('/api/tickets/:id', checkRateLimit, async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        const ticketId = parseInt(req.params.id);
        const pool = getPool();

        console.log(`🗑️ Delete ticket request: ${ticketId} by user ${decoded.userId}`);

        // Önce kullanıcı rolünü kontrol et
        const userResult = await pool.request()
            .input('userId', sql.Int, decoded.userId)
            .query(`
                SELECT 
                    u.RoleId as role_id,
                    r.RoleTanim as role_name
                FROM UserTbl u
                LEFT JOIN RoleTbl r ON u.RoleId = r.RoleId
                WHERE u.UserId = @userId AND u.Active = 1
            `);
        
        if (userResult.recordset.length === 0) {
            return res.status(401).json({ error: 'User not found.' });
        }

        const user = userResult.recordset[0];
        const roleMapping = {
            'Admin': 'admin',
            'Destek': 'support', 
            'Müşteri': 'customer'
        };
        const userRole = roleMapping[user.role_name] || 'customer';

        // Sadece admin silebilir
        if (userRole !== 'admin') {
            return res.status(403).json({ error: 'Sadece admin talepleri silebilir.' });
        }

        // Ticket'ı soft delete yap (Active = 0) - @userId değişkenini ekledik
        const result = await pool.request()
            .input('ticketId', sql.Int, ticketId)
            .input('userId', sql.Int, decoded.userId) // Bu satırı ekledik
            .query(`
                UPDATE TicketTbl 
                SET Active = 0, EditUserId = @userId, EditUserDate = GETUTCDATE()
                WHERE TicketId = @ticketId AND Active = 1
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Ticket not found or already deleted.' });
        }

        console.log(`✅ Ticket ${ticketId} deleted successfully`);
        res.json({ message: 'Ticket deleted successfully' });

    } catch (error) {
        console.error('❌ Delete ticket error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get companies endpoint
app.get('/api/companies', checkRateLimit, async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        const pool = getPool();
        
        // Önce kullanıcıyı al
        const userResult = await pool.request()
            .input('id', sql.Int, decoded.userId)
            .query(`
                SELECT 
                    u.UserId as id,
                    u.RoleId as role_id,
                    r.RoleTanim as role_name
                FROM UserTbl u
                LEFT JOIN RoleTbl r ON u.RoleId = r.RoleId
                WHERE u.UserId = @id AND u.Active = 1
            `);
        
        if (userResult.recordset.length === 0) {
            return res.status(401).json({ error: 'User not found.' });
        }

        const user = userResult.recordset[0];
        const roleMapping = {
            'Admin': 'admin',
            'Destek': 'support', 
            'Müşteri': 'customer'
        };
        const userRole = roleMapping[user.role_name] || 'customer';

        console.log(`🏢 Get companies request by ${userRole}:`, user.id);

        if (userRole !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }

        // Tüm aktif firmaları getir
        const companiesResult = await pool.request().query(`
            SELECT 
                f.FirmaId as id,
                f.FirmaUnvani as name,
                f.Aktif as is_active,
                (SELECT COUNT(*) FROM UserTbl u WHERE u.FirmaId = f.FirmaId AND u.Active = 1 AND u.RoleId = 3) as customer_count,
                (SELECT COUNT(*) FROM TicketTbl t WHERE t.CompanyId = f.FirmaId AND t.Active = 1) as ticket_count
            FROM FirmaTbl f
            WHERE f.Aktif = 1
            ORDER BY f.FirmaUnvani
        `);

        console.log(`✅ ${companiesResult.recordset.length} firmalar yüklendi`);

        res.json(companiesResult.recordset);
    } catch (error) {
        console.error('❌ Get companies error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});
// server.js - CREATE USER ENDPOINT
app.post('/api/users', checkRateLimit, [
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('company_id').isInt({ min: 1 }).withMessage('Valid company is required'),
    body('role_id').isInt({ min: 1, max: 3 }).withMessage('Valid role is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        const pool = getPool();
        
        // Sadece admin kullanıcı oluşturabilir
        const userResult = await pool.request()
            .input('userId', sql.Int, decoded.userId)
            .query(`
                SELECT 
                    u.RoleId as role_id,
                    r.RoleTanim as role_name
                FROM UserTbl u
                LEFT JOIN RoleTbl r ON u.RoleId = r.RoleId
                WHERE u.UserId = @userId AND u.Active = 1
            `);
        
        const user = userResult.recordset[0];
        const userRole = user.role_name === 'Admin' ? 'admin' : 'user';

        if (userRole !== 'admin') {
            return res.status(403).json({ error: 'Sadece admin kullanıcı oluşturabilir.' });
        }

        const { full_name, email, company_id, role_id } = req.body;

        // Email kontrolü
        const existingUser = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT UserId FROM UserTbl WHERE Username = @email AND Active = 1');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ error: 'Bu email adresi zaten kullanılıyor.' });
        }

        // Varsayılan şifre (password)
        const hashedPassword = await bcrypt.hash('password', 10);

        // Kullanıcı oluştur
        const userInsertResult = await pool.request()
            .input('FullName', sql.NVarChar, full_name)
            .input('Username', sql.NVarChar, email)
            .input('Password', sql.NVarChar, hashedPassword)
            .input('RoleId', sql.Int, role_id)
            .input('FirmaId', sql.Int, company_id)
            .query(`
                INSERT INTO UserTbl (FullName, Username, Password, RoleId, FirmaId, Active)
                OUTPUT INSERTED.UserId as id
                VALUES (@FullName, @Username, @Password, @RoleId, @FirmaId, 1)
            `);

        const newUserId = userInsertResult.recordset[0].id;

        console.log(`✅ New user created:`, {
            id: newUserId,
            name: full_name,
            email: email,
            company_id: company_id,
            role_id: role_id
        });

        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu',
            user: {
                id: newUserId,
                name: full_name,
                email: email,
                company_id: company_id,
                role_id: role_id
            }
        });

    } catch (error) {
        console.error('❌ Create user error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});
// Get support users endpoint
app.get('/api/users/support', checkRateLimit, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key'); // sadece doğrula
    const pool = getPool();

    const result = await pool.request().query(`
      SELECT 
        u.UserId     AS id,
        u.FullName   AS name,
        u.Username   AS email,
        u.RoleId     AS role_id,
        r.RoleTanim  AS role,
        u.Active     AS is_active
      FROM UserTbl u
      LEFT JOIN RoleTbl r ON u.RoleId = r.RoleId
      WHERE u.RoleId = 2 AND u.Active = 1   -- SADECE Destek
      ORDER BY u.FullName
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Get support users error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});


// Get modules endpoint
app.get('/api/modules', checkRateLimit, async (req, res) => {
    try {
        const pool = getPool();
        const modulesResult = await pool.request().query(`
            SELECT 
                ModuleId as id,
                ModuleAdi as name,
                Aciklama as description
            FROM ModuleTbl
            ORDER BY ModuleAdi
        `);

        res.json(modulesResult.recordset);
    } catch (error) {
        console.error('❌ Get modules error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get statuses endpoint
app.get('/api/statuses', checkRateLimit, async (req, res) => {
    try {
        const pool = getPool();
        const statusesResult = await pool.request().query(`
            SELECT 
                StatusId as id,
                StatusAdi as name,
                Aciklama as description
            FROM StatusTbl
            ORDER BY StatusId
        `);

        res.json(statusesResult.recordset);
    } catch (error) {
        console.error('❌ Get statuses error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get priorities endpoint
app.get('/api/priorities', checkRateLimit, async (req, res) => {
    try {
        const pool = getPool();
        const prioritiesResult = await pool.request().query(`
            SELECT 
                PriorityId as id,
                Priority as name
            FROM PriorityTbl
            ORDER BY PriorityId
        `);

        res.json(prioritiesResult.recordset);
    } catch (error) {
        console.error('❌ Get priorities error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});
// server.js - DASHBOARD STATS ENDPOINT EKLE
app.get('/api/dashboard/stats', checkRateLimit, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const pool = getPool();

    // Kullanıcı bilgilerini al
    const userResult = await pool.request()
      .input('userId', sql.Int, decoded.userId)
      .query(`
        SELECT 
          u.UserId as id,
          u.FullName as name,
          u.RoleId as role_id,
          r.RoleTanim as role_name,
          u.FirmaId as company_id
        FROM UserTbl u
        LEFT JOIN RoleTbl r ON u.RoleId = r.RoleId
        WHERE u.UserId = @userId AND u.Active = 1
      `);
    
    if (userResult.recordset.length === 0) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const user = userResult.recordset[0];
    const roleMapping = {
      'Admin': 'admin',
      'Destek': 'support', 
      'Müşteri': 'customer'
    };
    const userRole = roleMapping[user.role_name] || 'customer';

    console.log(`📊 Dashboard stats request by ${userRole}:`, user.name);

    // Role-based query
    let whereClause = 'WHERE t.Active = 1';
    const request = pool.request();

    if (userRole === 'customer') {
      whereClause += ' AND t.CompanyId = @companyId';
      request.input('companyId', sql.Int, user.company_id);
    } else if (userRole === 'support') {
      whereClause += ' AND t.AssignedUserId = @userId';
      request.input('userId', sql.Int, user.id);
    }

    // Dashboard istatistikleri
    const statsQuery = `
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN t.StatusId = 1 THEN 1 ELSE 0 END) as new_tickets,
        SUM(CASE WHEN t.StatusId = 2 THEN 1 ELSE 0 END) as assigned_tickets,
        SUM(CASE WHEN t.StatusId = 3 THEN 1 ELSE 0 END) as in_progress_tickets,
        SUM(CASE WHEN t.StatusId IN (6, 8) THEN 1 ELSE 0 END) as resolved_tickets,
        SUM(CASE WHEN t.PriorityId = 4 THEN 1 ELSE 0 END) as critical_tickets,
        SUM(CASE WHEN t.StatusId = 7 THEN 1 ELSE 0 END) as waiting_tickets
      FROM TicketTbl t
      ${whereClause}
    `;

    const statsResult = await request.query(statsQuery);
    const stats = statsResult.recordset[0];

    // Son 5 talep
    const recentTicketsQuery = `
      SELECT TOP 5
        t.TicketId as id,
        t.Subject as subject,
        t.CompanyId as company_id,
        f.FirmaUnvani as company_name,
        t.ModuleId as module_id,
        m.ModuleAdi as module_name,
        t.StatusId as status_id,
        s.StatusAdi as status_name,
        t.PriorityId as priority_id,
        p.Priority as priority_name,
        t.CreatedDate as created_at
      FROM TicketTbl t
      LEFT JOIN FirmaTbl f ON t.CompanyId = f.FirmaId
      LEFT JOIN ModuleTbl m ON t.ModuleId = m.ModuleId
      LEFT JOIN StatusTbl s ON t.StatusId = s.StatusId
      LEFT JOIN PriorityTbl p ON t.PriorityId = p.PriorityId
      ${whereClause}
      ORDER BY t.CreatedDate DESC
    `;

    const recentTicketsResult = await request.query(recentTicketsQuery);

    const dashboardData = {
      stats: {
        total: stats.total_tickets,
        new: stats.new_tickets,
        assigned: stats.assigned_tickets,
        inProgress: stats.in_progress_tickets,
        resolved: stats.resolved_tickets,
        critical: stats.critical_tickets,
        waiting: stats.waiting_tickets
      },
      recentTickets: recentTicketsResult.recordset,
      userRole: userRole
    };

    console.log(`✅ Dashboard stats loaded for ${userRole}:`, dashboardData.stats);
    res.json(dashboardData);

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Optimized server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🚀 Rate limiting active: ${MAX_REQUESTS_PER_WINDOW} requests per ${RATE_LIMIT_WINDOW}ms`);
});