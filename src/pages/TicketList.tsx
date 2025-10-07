// components/TicketList.tsx - BİRLEŞTİRİLMİŞ VE MÜKEMMEL
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  DateRange as DateRangeIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { ticketsAPI, companiesAPI, usersAPI, systemAPI } from '../services/api';

const TicketList: React.FC = () => {

  const { user: authUser } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [mailContent, setMailContent] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketFiles, setTicketFiles] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newTicketDialogOpen, setNewTicketDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });
// Dosya yükleme fonksiyonu
const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  if (event.target.files) {
    const newFiles = Array.from(event.target.files);
    
    // Dosya boyutu kontrolü (10MB)
    const oversizedFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      showSnackbar('Bazı dosyalar çok büyük (max 10MB)', 'error');
      return;
    }

    // Maksimum 5 dosya kontrolü
    if (files.length + newFiles.length > 5) {
      showSnackbar('Maksimum 5 dosya yükleyebilirsiniz', 'error');
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
  }
};
// Belirli bir ticket'ın eklerini getir
const loadTicketFiles = async (ticketId: number) => {
  try {
    setFilesLoading(true);
    console.log(`📁 Loading files for ticket: ${ticketId}`);
    
    const { data } = await ticketsAPI.getFiles(ticketId);
    console.log(`✅ Files loaded:`, data);
    
    setTicketFiles(data);
  } catch (e) {
    console.error('❌ Files load error:', e);
    showSnackbar('Dosyalar yüklenirken hata oluştu', 'error');
  } finally {
    setFilesLoading(false);
  }
};

// İndirme fonksiyonunu güncelle
const handleDownload = async (file: any) => {
  try {
    console.log(`📥 Downloading file: ${file.id} - ${file.name}`);
    
    const response = await ticketsAPI.downloadFile(file.id);
    
    // Blob'dan URL oluştur
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.name || 'dosya');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    console.log(`✅ File downloaded successfully: ${file.name}`);
    showSnackbar('Dosya indirildi');
  } catch (e) {
    console.error('❌ File download error:', e);
    showSnackbar('Dosya indirilemedi', 'error');
  }
};

// Dosya silme fonksiyonu
const handleRemoveFile = (index: number) => {
  setFiles(prev => prev.filter((_, i) => i !== index));
};

// Dosya formatına göre ikon belirleme
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return '🖼️';
    default:
      return '📎';
  }
};

// Dosya boyutunu formatlama
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
  // Filtre state'leri
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state'leri
  const [newTicketForm, setNewTicketForm] = useState({
    company_id: '',
    module_id: '',
    subject: '',
    description: '',
    email: '',
    priority_id: '2',
  });

  const [editForm, setEditForm] = useState({
    status_id: '',
    priority_id: '',
    assigned_to: '',
    notes: '',
  });

  // Verileri yükle
  useEffect(() => {
    loadInitialData();
  }, []);

const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading initial data for:', authUser?.role);

      // Temel verileri yükle
      const [ticketsRes, modulesRes, statusesRes, prioritiesRes] = await Promise.all([
        ticketsAPI.getTickets(),
        systemAPI.getModules(),
        systemAPI.getStatuses(),
        systemAPI.getPriorities()
      ]);

      setTickets(ticketsRes.data);
      setModules(modulesRes.data);
      setStatuses(statusesRes.data);
      setPriorities(prioritiesRes.data);

      // Admin için ekstra veriler
      if (authUser?.role === 'admin') {
        try {
          const [companiesRes, usersRes] = await Promise.all([
            companiesAPI.getCompanies(),
            usersAPI.getSupportUsers()
          ]);
          setCompanies(companiesRes.data);
          setUsers(usersRes.data);
          console.log('👥 Admin users loaded:', usersRes.data);
        } catch (error) {
          console.error('❌ Admin data loading error:', error);
        }
      }

      // Support için kullanıcı listesi
      if (authUser?.role === 'support') {
        try {
          const usersRes = await usersAPI.getSupportUsers();
          setUsers(usersRes.data);
        } catch (error) {
          console.error('❌ Support users loading error:', error);
        }
      }

      console.log('✅ Data loaded successfully:', {
        tickets: ticketsRes.data.length,
        companies: companies.length,
        users: users.length,
        userRole: authUser?.role
      });

    } catch (error: any) {
      console.error('❌ Data loading error:', error);
      showSnackbar('Veriler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // GÖZ İKONU - TIKLAMA
  const handleView = (ticket: any) => {
    console.log('👁️ Viewing ticket:', ticket.id);
    setSelectedTicket(ticket);
    setViewDialogOpen(true);
    loadTicketFiles(ticket.id);
  };

  // KALEM İKONU - TIKLAMA
const handleEdit = async (ticket: any) => {
  console.log('✏️ Editing ticket:', ticket.id);

  // Admin ise ve liste boşsa (veya stale olabilir) tazele
  if (authUser?.role === 'admin' && users.length === 0) {
    try {
      const { data } = await usersAPI.getSupportUsers();
      setUsers(data);
      console.log('👥 Support users refreshed on edit:', data.length);
    } catch (e) {
      console.error('❌ Support users refresh error:', e);
    }
  }

  setSelectedTicket(ticket);
  setEditForm({
    status_id: ticket.status_id?.toString() || '',
    priority_id: ticket.priority_id?.toString() || '',
    assigned_to: ticket.assigned_to?.toString() || '',
    notes: '',
  });
  setEditDialogOpen(true);
};


  // SİLME İKONU - TIKLAMA
  const handleDelete = async (ticketId: number) => {
    if (window.confirm('Bu talebi silmek istediğinizden emin misiniz?')) {
      try {
        console.log('🗑️ Deleting ticket:', ticketId);
        await ticketsAPI.deleteTicket(ticketId);
        showSnackbar('Talep başarıyla silindi');
        loadInitialData();
      } catch (error: any) {
        console.error('❌ Delete ticket error:', error);
        showSnackbar(error.response?.data?.error || 'Talep silinirken hata oluştu', 'error');
      }
    }
  };

  // YENİ TALEP OLUŞTURMA
 const handleNewTicket = async () => {
    setNewTicketDialogOpen(true);
  };

const handleCreateTicket = async () => {
  try {
    if (!newTicketForm.module_id || !newTicketForm.subject || !newTicketForm.description) {
      showSnackbar('Lütfen zorunlu alanları doldurun', 'error');
      return;
    }

      // Müşteri için otomatik company_id
      const ticketData = {
      ...newTicketForm,
      company_id: authUser?.role === 'customer' ? '1' : newTicketForm.company_id,
      assigned_to: null, // Müşteri atama yapamaz
      mail_content: mailContent // Mail içeriğini ekle
    };

      console.log('📤 Creating ticket:', ticketData);
      const response = await ticketsAPI.createTicket(ticketData);
    
    const newId = response?.data?.id; // backend create endpoint'i id döndürüyor
    if (files.length > 0 && newId) {
      try {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file); // field adı backend'de 'files'
        });

        await ticketsAPI.uploadFiles(newId, formData);
        console.log('✅ Files uploaded successfully');
      } catch (uploadError) {
        console.error('❌ File upload error:', uploadError);
        // Dosya yükleme hatası talebi engellemesin
      }
    }

    showSnackbar('Talep başarıyla oluşturuldu' + (files.length > 0 ? ' ve dosyalar yüklendi' : ''));
    
    // Formu temizle
    setNewTicketDialogOpen(false);
    setNewTicketForm({
      company_id: '',
      module_id: '',
      subject: '',
      description: '',
      email: '',
      priority_id: '2',
    });
    setFiles([]);
    setMailContent('');
    
    loadInitialData();
  } catch (error: any) {
    console.error('❌ Create ticket error:', error);
    showSnackbar(error.response?.data?.error || 'Talep oluşturulamadı', 'error');
  }
};

  // TALEP GÜNCELLEME
const handleUpdateTicket = async () => {
  if (!selectedTicket) return;

  try {
    const updates: any = {
      status_id: parseInt(editForm.status_id),
      priority_id: parseInt(editForm.priority_id),
    };

    // Sadece admin atama yapabilir
    if (authUser?.role === 'admin') {
      updates.assigned_to = editForm.assigned_to ? parseInt(editForm.assigned_to) : null;
      
      // Eğer atama yapılıyorsa ve önceki durum "Yeni" ise otomatik "Atandı" durumuna geç
      if (editForm.assigned_to && selectedTicket.status_id === 1) {
        updates.status_id = 2; // "Atandı" durumu
      }
    }

    // Mühendisler "Yeni" durumuna geri döndüremez
    if (authUser?.role === 'support' && parseInt(editForm.status_id) === 1) {
      showSnackbar('Talep "Yeni" durumuna geri döndürülemez', 'error');
      return;
    }

    // Eğer not varsa ekle
    if (editForm.notes) {
      updates.notes = editForm.notes;
    }

    console.log('📝 Updating ticket:', selectedTicket.id, updates);
    await ticketsAPI.updateTicket(selectedTicket.id, updates);
    showSnackbar('Talep başarıyla güncellendi');
    setEditDialogOpen(false);
    loadInitialData();
  } catch (error: any) {
    console.error('❌ Update ticket error:', error);
    showSnackbar('Talep güncellenirken hata oluştu', 'error');
  }
};

  // FİLTRELEME
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status_id?.toString() === filterStatus;
    const matchesModule = filterModule === 'all' || ticket.module_id?.toString() === filterModule;
    const matchesSearch = !searchTerm || 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.company_name && ticket.company_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesModule && matchesSearch;
  });

  // CHIP RENKLERİ
const getStatusChip = (statusId: number) => {
  const status = statuses.find(s => s.id === statusId);
  if (!status) return <Chip label="❓ Bilinmeyen" size="small" variant="outlined" />;

  const statusConfig: any = {
    1: { icon: '🆕', label: 'Yeni' },
    2: { icon: '👤', label: 'Atandı' },
    3: { icon: '🚀', label: 'Başlandı' },
    4: { icon: '🧪', label: 'Test' },
    5: { icon: '↩️', label: 'Testten Döndü' },
    6: { icon: '✅', label: 'Tamamlandı' },
    7: { icon: '⏳', label: 'Bekliyor' },
    8: { icon: '🔒', label: 'Kapandı' },
  };

  const config = statusConfig[statusId] || { icon: '❓', label: status.name };
  return (
    <Chip 
      label={`${config.icon} ${config.label}`} 
      size="small" 
      variant="outlined"
      sx={{ 
        borderColor: 'grey.300',
        backgroundColor: 'transparent',
        '& .MuiChip-label': { px: 1 }
      }}
    />
  );
};

const getPriorityChip = (priorityId: number) => {
  const priority = priorities.find(p => p.id === priorityId);
  if (!priority) return <Chip label="❓ Bilinmeyen" size="small" />;

  const priorityConfig: any = {
    1: { 
      color: 'success', 
      icon: '🟢', 
      label: 'Düşük',
      bgColor: '#e8f5e8',
      textColor: '#2e7d32'
    },
    2: { 
      color: 'info', 
      icon: '🔵', 
      label: 'Orta',
      bgColor: '#e3f2fd',
      textColor: '#1565c0'
    },
    3: { 
      color: 'warning', 
      icon: '🟠', 
      label: 'Yüksek',
      bgColor: '#fff3e0',
      textColor: '#ef6c00'
    },
    4: { 
      color: 'error', 
      icon: '🔴', 
      label: 'Acil',
      bgColor: '#ffebee',
      textColor: '#c62828'
    },
  };

  const config = priorityConfig[priorityId] || { 
    color: 'default', 
    icon: '❓', 
    label: priority.name,
    bgColor: '#f5f5f5',
    textColor: '#616161'
  };
return (
    <Chip 
      label={`${config.icon} ${config.label}`} 
      color={config.color}
      size="small"
      sx={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        fontWeight: 'bold',
        border: `1px solid ${config.textColor}20`,
        '& .MuiChip-label': { px: 1 }
      }}
    />
  );
};

// DETAYLI GÖRÜNÜM COMPONENT'İ
const DetailViewDialog = ({ ticket, open, onClose }: any) => {
  if (!ticket) return null;

  const getStatusIcon = (statusId: number) => {
    const icons: any = {
      1: '🆕',  // Yeni
      2: '👤',  // Atandı
      3: '🚀',  // Başlandı
      4: '🧪',  // Test
      5: '↩️',  // Testten Döndü
      6: '✅',  // Tamamlandı
      7: '⏳',  // Bekliyor
      8: '🔒',  // Kapandı
    };
    return icons[statusId] || '📝';
  };

  const TimelineItem = ({ history, isLast }: any) => (
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      pb: isLast ? 0 : 2,
      position: 'relative',
      '&:not(:last-child)::after': {
        content: '""',
        position: 'absolute',
        left: 20,
        bottom: 0,
        width: 2,
        height: '100%',
        backgroundColor: '#e0e0e0',
      }
    }}>
      <Box sx={{ 
        width: 40,
        height: 40,
        borderRadius: '50%',
        backgroundColor: 'grey.100',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.primary',
        fontWeight: 'bold',
        fontSize: 16,
        flexShrink: 0,
        zIndex: 1,
        border: '2px solid #e0e0e0'
      }}>
        {getStatusIcon(history.status_id)}
      </Box>

      <Box sx={{ flex: 1 }}>
        <Typography variant="body1" fontWeight="bold">
          {history.status_name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {history.changed_by_name} tarafından
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(history.changed_at).toLocaleString('tr-TR')}
        </Typography>
        {history.notes && (
          <Paper variant="outlined" sx={{ p: 1, mt: 1, backgroundColor: 'grey.50' }}>
            <Typography variant="body2">
              {history.notes}
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );

  const InfoRow = ({ label, value }: any) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #f0f0f0' }}>
      <Typography variant="body2" fontWeight="bold" color="text.secondary">
        {label}:
      </Typography>
      <Typography variant="body2">
        {value}
      </Typography>
    </Box>
  );


 return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5">Talep Detayları</Typography>
          <Chip 
            label={`#${ticket.id}`} 
            color="primary" 
            variant="outlined" 
          />
        </Box>
      </DialogTitle>
        
  <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* SOL TARAF - TEMEL BİLGİLER */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
                  📋 Talep Bilgileri
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <InfoRow label="Firma" value={ticket.company_name} />
                  <InfoRow label="Modül" value={modules.find(m => m.id === ticket.module_id)?.name} />
                  <InfoRow label="Konu" value={ticket.subject} />
                  <InfoRow label="Öncelik" value={getPriorityChip(ticket.priority_id)} />
                  <InfoRow label="Durum" value={getStatusChip(ticket.status_id)} />
                  <InfoRow label="Atanan Personel" value={ticket.assigned_to_name || 'Atanmadı'} />
                  <InfoRow label="E-posta" value={ticket.email || 'Belirtilmemiş'} />
                </Box>
              </CardContent>
            </Card>
{/* ⬇⬇⬇ EKLER (BURAYA KOY) ⬇⬇⬇ */}
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid', borderColor: 'success.main', pb: 1 }}>
          📎 Ekler
        </Typography>

        {filesLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
            <CircularProgress size={20} />
            <Typography>Dosyalar yükleniyor...</Typography>
          </Box>
        ) : ticketFiles.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 1 }}>
            Bu talebe eklenmiş dosya bulunmuyor.
          </Typography>
        ) : (
          <List dense>
            {ticketFiles.map((f) => (
              <ListItem
                key={f.id}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* İndir */}
                    <IconButton
                      edge="end"
                      onClick={async () => {
                        try {
                          const res = await ticketsAPI.downloadFile(f.id);
                          const url = window.URL.createObjectURL(new Blob([res.data]));
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = f.name || 'dosya';
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          window.URL.revokeObjectURL(url);
                        } catch (e) {
                          console.error('❌ File download error:', e);
                          showSnackbar('Dosya indirilemedi', 'error');
                        }
                      }}
                      title="İndir"
                      size="small"
                    >
                      <FileIcon />
                    </IconButton>

                    {/* Sil (sadece admin) */}
                    {authUser?.role === 'admin' && (
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={async () => {
                          if (!window.confirm('Bu dosyayı silmek istiyor musunuz?')) return;
                          try {
                            await ticketsAPI.deleteFile(f.id);
                            showSnackbar('Dosya silindi');
                            loadTicketFiles(ticket.id);
                          } catch (e) {
                            console.error('❌ File delete error:', e);
                            showSnackbar('Dosya silinemedi', 'error');
                          }
                        }}
                        title="Sil"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                }
              >
                <ListItemIcon>
                  <Typography fontSize="18px">📄</Typography>
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2" noWrap title={f.name}>{f.name}</Typography>}
                  secondary={<Typography variant="caption" color="text.secondary">{(f.size / 1024).toFixed(1)} KB • {f.uploaded_at}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
 {/* ZAMAN BİLGİLERİ */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid', borderColor: 'secondary.main', pb: 1 }}>
                  ⏰ Zaman Bilgileri
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <InfoRow label="Oluşturulma" value={new Date(ticket.created_at).toLocaleString('tr-TR')} />
                  <InfoRow label="Son Güncelleme" value={ticket.updated_at ? new Date(ticket.updated_at).toLocaleString('tr-TR') : '-'} />
                  <InfoRow label="Son Teslim Tarihi" value={ticket.due_date ? new Date(ticket.due_date).toLocaleDateString('tr-TR') : 'Belirtilmemiş'} />
                  <InfoRow label="Kapanış Tarihi" value={ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString('tr-TR') : 'Açık'} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* SAĞ TARAF - AÇIKLAMA VE GEÇMİŞ */}
          <Grid item xs={12} md={6}>
            {/* AÇIKLAMA */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid', borderColor: 'info.main', pb: 1 }}>
                  📝 Açıklama
                </Typography>
                <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                  {ticket.description}
                </Typography>
              </CardContent>
            </Card>

            {/* DURUM GEÇMİŞİ */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid', borderColor: 'warning.main', pb: 1 }}>
                  🔄 Durum Geçmişi
                </Typography>
                
                <Box sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
                  {ticket.statusHistory && ticket.statusHistory.length > 0 ? (
                    ticket.statusHistory.map((history: any, index: number) => (
                      <TimelineItem 
                        key={history.id}
                        history={history}
                        isLast={index === ticket.statusHistory.length - 1}
                      />
                    ))
                  ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      Henüz durum geçmişi bulunmuyor
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
        {(authUser?.role === 'admin' || 
          (authUser?.role === 'support' && ticket.assigned_to === authUser?.id)) && (
          <Button 
            variant="contained" 
            onClick={() => {
              onClose();
              handleEdit(ticket);
            }}
          >
            Talep Düzenle
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

  // SADECE ROLEID=2 OLAN KULLANICILARI FİLTRELE
  const supportUsers = users.filter(u => Number(u.role_id) === 2);
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Talepler yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* BAŞLIK VE BUTON */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          📋 {authUser?.role === 'admin' ? 'Tüm Talepler' : 'Taleplerim'} ({filteredTickets.length})
        </Typography>
        
        {(authUser?.role === 'admin' || authUser?.role === 'customer') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewTicket}
          >
            Yeni Talep
          </Button>
        )}
      </Box>

      {/* FİLTRELEME */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Talep ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" color="action" />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Durum</InputLabel>
              <Select value={filterStatus} label="Durum" onChange={(e) => setFilterStatus(e.target.value)}>
                <MenuItem value="all">Tüm Durumlar</MenuItem>
                {statuses.map(status => (
                  <MenuItem key={status.id} value={status.id}>{status.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Modül</InputLabel>
              <Select value={filterModule} label="Modül" onChange={(e) => setFilterModule(e.target.value)}>
                <MenuItem value="all">Tüm Modüller</MenuItem>
                {modules.map(module => (
                  <MenuItem key={module.id} value={module.id}>{module.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="outlined" onClick={() => { setFilterStatus('all'); setFilterModule('all'); setSearchTerm(''); }}>
              Temizle
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* TABLO */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Firma</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Modül</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Konu</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Durum</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Öncelik</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Atanan</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Oluşturulma</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} hover>
                  <TableCell>#{ticket.id}</TableCell>
                  <TableCell>{ticket.company_name}</TableCell>
                  <TableCell>{modules.find(m => m.id === ticket.module_id)?.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ticket.subject}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(ticket.status_id)}</TableCell>
                  <TableCell>{getPriorityChip(ticket.priority_id)}</TableCell>
                  <TableCell>{ticket.assigned_to_name || '-'}</TableCell>
                  <TableCell>
                    {new Date(ticket.created_at).toLocaleDateString('tr-TR')}
                    <Typography variant="caption" display="block">
                      {new Date(ticket.created_at).toLocaleTimeString('tr-TR')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {/* GÖZ İKONU - HERKES GÖREBİLİR */}
                      <IconButton 
                        color="primary" 
                        onClick={() => handleView(ticket)}
                        size="small"
                        title="Detayları Gör"
                      >
                        <ViewIcon />
                      </IconButton>

                      {/* KALEM İKONU - ADMIN VE SUPPORT (kendine atanmışsa) */}
                      {(authUser?.role === 'admin' || 
                        (authUser?.role === 'support' && ticket.assigned_to === authUser?.id)) && (
                        <IconButton 
                          color="secondary" 
                          onClick={() => handleEdit(ticket)}
                          size="small"
                          title="Düzenle"
                        >
                          <EditIcon />
                        </IconButton>
                      )}

                      {/* SİLME İKONU - SADECE ADMIN */}
                      {authUser?.role === 'admin' && (
                        <IconButton 
                          color="error" 
                          onClick={() => handleDelete(ticket.id)}
                          size="small"
                          title="Sil"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* DETAYLI GÖRÜNÜM DIALOG'u */}
      <DetailViewDialog 
        ticket={selectedTicket}
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
      />

      {/* DÜZENLEME DIALOG */}
<Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            Talep Düzenle - #{selectedTicket?.id}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Durum *</InputLabel>
              <Select
                value={editForm.status_id}
                label="Durum *"
                onChange={(e) => setEditForm(prev => ({ ...prev, status_id: e.target.value }))}
              >
                {statuses
                  .filter(status => {
                    // Mühendisler "Yeni" durumuna geri dönemez
                    if (authUser?.role === 'support' && status.id === 1) {
                      return false;
                    }
                    return true;
                  })
                  .map(status => (
                    <MenuItem key={status.id} value={status.id.toString()}>
                      {getStatusChip(status.id)}
                    </MenuItem>
                  ))
                }
              </Select>
              {authUser?.role === 'support' && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  "Yeni" durumuna geri dönülemez
                </Typography>
              )}
            </FormControl>

          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Öncelik *</InputLabel>
            <Select
              value={editForm.priority_id}
              label="Öncelik *"
              onChange={(e) => setEditForm(prev => ({ ...prev, priority_id: e.target.value }))}
              disabled={authUser?.role === 'support'} // Mühendisler için disabled
            >
              {priorities.map(priority => (
                <MenuItem key={priority.id} value={priority.id.toString()}>
                  {getPriorityChip(priority.id)}
                </MenuItem>
              ))}
            </Select>
            {authUser?.role === 'support' && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Öncelik sadece admin veya müşteri tarafından değiştirilebilir
              </Typography>
            )}
          </FormControl>

            {/* SADECE ADMIN ATAMA YAPABİLİR - VE SADECE ROLEID=2 OLANLARI GÖSTER */}
            {authUser?.role === 'admin' && (
              <FormControl fullWidth margin="normal" size="small" disabled={users.length === 0}>
                <InputLabel>Atanan Personel</InputLabel>
                <Select
                  value={editForm.assigned_to}
                  label="Atanan Personel"
                  onChange={(e) => setEditForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                >
                  <MenuItem value="">
                    <em>Atanmadı</em>
                  </MenuItem>
                  {supportUsers.map(user => (
                    <MenuItem key={user.id} value={user.id.toString()}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({user.email})
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {users.length === 0
                    ? 'Liste yükleniyor...'
                    : (supportUsers.length === 0 ? 'Destek personeli bulunamadı' : 'Sadece destek personelleri listelenmektedir')}
                </Typography>
              </FormControl>
            )}

            <TextField
              fullWidth
              label="Durum Değişiklik Notu"
              margin="normal"
              multiline
              rows={3}
              value={editForm.notes}
              onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Bu durum değişikliği hakkında notunuz..."
              helperText="Bu not durum geçmişine eklenecektir"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleUpdateTicket}>
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>

{/* YENİ TALEP DIALOG */}
<Dialog open={newTicketDialogOpen} onClose={() => {
  setNewTicketDialogOpen(false);
  setFiles([]);
  setMailContent('');
}} maxWidth="md" fullWidth>
  <DialogTitle>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <AddIcon />
      Yeni Talep Oluştur
    </Box>
  </DialogTitle>
  <DialogContent>
    <Box sx={{ pt: 2 }}>
      {/* ADMIN İÇİN FİRMA SEÇİMİ */}
      {authUser?.role === 'admin' && (
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel>Firma *</InputLabel>
          <Select
            value={newTicketForm.company_id}
            label="Firma *"
            onChange={(e) => setNewTicketForm(prev => ({ ...prev, company_id: e.target.value }))}
          >
            {companies.map(company => (
              <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <FormControl fullWidth margin="normal" size="small">
        <InputLabel>Modül *</InputLabel>
        <Select
          value={newTicketForm.module_id}
          label="Modül *"
          onChange={(e) => setNewTicketForm(prev => ({ ...prev, module_id: e.target.value }))}
        >
          {modules.map(module => (
            <MenuItem key={module.id} value={module.id}>{module.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* E-POSTA VE TALEP KONUSU - YAN YANA KÜÇÜK BOYUTTA */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="E-posta"
            margin="normal"
            size="small"
            value={newTicketForm.email}
            onChange={(e) => setNewTicketForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="musteri@firma.com"
            InputProps={{
              sx: { fontSize: '0.875rem' } // Daha küçük font
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Talep Konusu *"
            margin="normal"
            size="small"
            value={newTicketForm.subject}
            onChange={(e) => setNewTicketForm(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Kısa ve net bir konu giriniz..."
            InputProps={{
              sx: { fontSize: '0.875rem' } // Daha küçük font
            }}
          />
        </Grid>
      </Grid>

      {/* MAIL İÇERİĞİ */}
      <TextField
        fullWidth
        label="Mail İçeriği"
        margin="normal"
        multiline
        rows={3}
        size="small"
        value={mailContent}
        onChange={(e) => setMailContent(e.target.value)}
        placeholder="Müşteriden gelen mail içeriğini buraya yapıştırabilirsiniz..."
        helperText="Müşteri mail içeriğini bu alana kopyalayabilirsiniz"
        InputProps={{
          sx: { fontSize: '0.875rem' }
        }}
      />

      {/* SORUN AÇIKLAMASI */}
      <TextField
        fullWidth
        label="Sorun Açıklaması *"
        margin="normal"
        multiline
        rows={4}
        value={newTicketForm.description}
        onChange={(e) => setNewTicketForm(prev => ({ ...prev, description: e.target.value }))}
        placeholder="Sorunu detaylı bir şekilde açıklayın..."
      />

      {/* ÖNCELİK SEÇİMİ - RENKLER GÜNCELLENDİ */}
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel>Öncelik</InputLabel>
        <Select
          value={newTicketForm.priority_id}
          label="Öncelik"
          onChange={(e) => setNewTicketForm(prev => ({ ...prev, priority_id: e.target.value }))}
        >
          {priorities.map(priority => (
            <MenuItem key={priority.id} value={priority.id}>
              {getPriorityChip(priority.id)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* DOSYA YÜKLEME BÖLÜMÜ */}
      <Box sx={{ mt: 3, p: 2, border: '1px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
          📎 Dosya Ekle (Opsiyonel)
        </Typography>
        
        <Button
          variant="outlined"
          component="label"
          startIcon={<AttachFileIcon />}
          sx={{ mb: 2 }}
          size="small"
        >
          Dosya Seç
          <input
            type="file"
            hidden
            multiple
            onChange={handleFileUpload}
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
        </Button>

        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
          Maksimum 5 dosya, her dosya max 10MB. İzin verilen formatlar: JPG, PNG, PDF, DOC, XLS, TXT
        </Typography>

        {/* YÜKLENEN DOSYA LİSTESİ */}
        {files.length > 0 && (
          <List dense>
            {files.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    onClick={() => handleRemoveFile(index)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                }
                sx={{ py: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Typography fontSize="18px">
                    {getFileIcon(file.name)}
                  </Typography>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem' }}>
                      {file.name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {/* DOSYA SAYISI BİLGİSİ */}
        {files.length > 0 && (
          <Chip 
            label={`${files.length}/5 dosya seçildi`} 
            color="primary" 
            variant="outlined"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Box>
    </Box>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => {
      setNewTicketDialogOpen(false);
      setFiles([]);
      setMailContent('');
    }}>
      İptal
    </Button>
    <Button 
      variant="contained" 
      onClick={handleCreateTicket}
      disabled={!newTicketForm.module_id || !newTicketForm.subject || !newTicketForm.description}
    >
      Oluştur
    </Button>
  </DialogActions>
</Dialog>

<Snackbar 
  open={snackbar.open} 
  autoHideDuration={3000} 
  onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
>
  <Alert severity={snackbar.severity}>
    {snackbar.message}
  </Alert>
</Snackbar>
</Box>
);
};

export default TicketList;