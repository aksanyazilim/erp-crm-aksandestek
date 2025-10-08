// components/TicketList.tsx - GÜNCELLENMİŞ FİLTRELEME
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
  Tooltip,
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

  // Filtre state'leri - GELİŞMİŞ
  const [filters, setFilters] = useState({
    status: 'all',
    module: 'all',
    priority: 'all',
    assigned_to: 'all',
    search: '',
    dateRange: {
      start: '',
      end: ''
    }
  });

  // Form state'leri
  const [newTicketForm, setNewTicketForm] = useState({
    company_id: '',
    module_id: '',
    subject: '',
    description: '',
    email: '',
    priority_id: '1',
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

      // Ticket'ları oluşturma tarihine göre sırala (yeni -> eski)
      const sortedTickets = ticketsRes.data.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setTickets(sortedTickets);
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

    } catch (error: any) {
      console.error('❌ Data loading error:', error);
      showSnackbar('Veriler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // GELİŞMİŞ FİLTRELEME FONKSİYONU
// FİLTRELEME FONKSİYONU - DÜZELTİLMİŞ
const filteredTickets = tickets.filter(ticket => {
  const {
    status,
    module,
    priority,
    assigned_to,
    search,
    dateRange
  } = filters;

  // Durum filtresi
  const matchesStatus = status === 'all' || ticket.status_id?.toString() === status;
  
  // Program/modül filtresi
  const matchesModule = module === 'all' || ticket.module_id?.toString() === module;
  
  // Öncelik filtresi
  const matchesPriority = priority === 'all' || ticket.priority_id?.toString() === priority;
  
  // Atanan kişi filtresi
  const matchesAssigned = assigned_to === 'all' || 
    (assigned_to === 'unassigned' && !ticket.assigned_to) ||
    ticket.assigned_to?.toString() === assigned_to;

  // Arama filtresi - NULL KONTROLÜ EKLENDİ
  const matchesSearch = !search || 
    (ticket.subject && ticket.subject.toLowerCase().includes(search.toLowerCase())) ||
    (ticket.company_name && ticket.company_name.toLowerCase().includes(search.toLowerCase())) ||
    (ticket.module_name && ticket.module_name.toLowerCase().includes(search.toLowerCase())) ||
    (ticket.assigned_to_name && ticket.assigned_to_name.toLowerCase().includes(search.toLowerCase())) ||
    (ticket.description && ticket.description.toLowerCase().includes(search.toLowerCase())) ||
    (ticket.id && ticket.id.toString().includes(search));

  // Tarih aralığı filtresi
  const ticketDate = new Date(ticket.created_at);
  const startDate = dateRange.start ? new Date(dateRange.start) : null;
  const endDate = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : null;
  
  const matchesDateRange = 
    (!startDate || ticketDate >= startDate) &&
    (!endDate || ticketDate <= endDate);

  return matchesStatus && matchesModule && matchesPriority && matchesAssigned && matchesSearch && matchesDateRange;
});
  // FİLTRE DEĞİŞİKLİK FONKSİYONLARI
  const handleFilterChange = (filterName: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleDateRangeChange = (range: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [range]: value
      }
    }));
  };

  // FİLTRELERİ SIFIRLA
  const clearFilters = () => {
    setFilters({
      status: 'all',
      module: 'all',
      priority: 'all',
      assigned_to: 'all',
      search: '',
      dateRange: {
        start: '',
        end: ''
      }
    });
  };

  // SADECE ROLEID=2 OLAN KULLANICILARI FİLTRELE
  const supportUsers = users.filter(u => Number(u.role_id) === 2);

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

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
      const { data } = await ticketsAPI.getFiles(ticketId);
      setTicketFiles(data);
    } catch (e) {
      console.error('❌ Files load error:', e);
      showSnackbar('Dosyalar yüklenirken hata oluştu', 'error');
    } finally {
      setFilesLoading(false);
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

  // GÖZ İKONU - TIKLAMA
  const handleView = (ticket: any) => {
    console.log('👁️ Ticket details:', ticket);
    console.log('📧 Mail content from API:', ticket.mail_content);
    setSelectedTicket(ticket);
    setViewDialogOpen(true);
    loadTicketFiles(ticket.id);
  };

  // KALEM İKONU - TIKLAMA
  const handleEdit = async (ticket: any) => {
    if (authUser?.role === 'admin' && users.length === 0) {
      try {
        const { data } = await usersAPI.getSupportUsers();
        setUsers(data);
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

  // E-posta validasyonu
  const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
  };

  const handleCreateTicket = async () => {
    try {
      if (!newTicketForm.module_id || !newTicketForm.subject || !newTicketForm.description) {
        showSnackbar('Lütfen zorunlu alanları doldurun', 'error');
        return;
      }

      // E-posta validasyonu
      if (newTicketForm.email && !isValidEmail(newTicketForm.email)) {
        showSnackbar('Lütfen geçerli bir e-posta adresi giriniz', 'error');
        return;
      }

      // Müşteri için otomatik company_id
      const ticketData = {
        ...newTicketForm,
        company_id: authUser?.role === 'customer' ? '1' : newTicketForm.company_id,
        assigned_to: null,
        mail_content: mailContent
      };
      console.log('📤 Creating ticket:', ticketData);
      const response = await ticketsAPI.createTicket(ticketData);
      
      const newId = response?.data?.id;
      if (files.length > 0 && newId) {
        try {
          const formData = new FormData();
          files.forEach(file => {
            formData.append('files', file);
          });
          await ticketsAPI.uploadFiles(newId, formData);
        } catch (uploadError) {
          console.error('❌ File upload error:', uploadError);
        }
      }

      showSnackbar('Talep başarıyla oluşturuldu' + (files.length > 0 ? ' ve dosyalar yüklendi' : ''));
      
      setNewTicketDialogOpen(false);
      setNewTicketForm({
        company_id: '',
        module_id: '',
        subject: '',
        description: '',
        email: '',
        priority_id: '1',
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
        
        if (editForm.assigned_to && selectedTicket.status_id === 1) {
          updates.status_id = 2;
        }
      }

      // Mühendisler "Yeni" durumuna geri döndüremez
      if (authUser?.role === 'support' && parseInt(editForm.status_id) === 1) {
        showSnackbar('Talep "Yeni" durumuna geri döndürülemez', 'error');
        return;
      }

      if (editForm.notes) {
        updates.notes = editForm.notes;
      }

      await ticketsAPI.updateTicket(selectedTicket.id, updates);
      showSnackbar('Talep başarıyla güncellendi');
      setEditDialogOpen(false);
      loadInitialData();
    } catch (error: any) {
      console.error('❌ Update ticket error:', error);
      showSnackbar('Talep güncellenirken hata oluştu', 'error');
    }
  };

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
      1: '🆕', 2: '👤', 3: '🚀', 4: '🧪', 5: '↩️', 6: '✅', 7: '⏳', 8: '🔒',
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
        {history.changed_by_name} • {new Date(history.changed_at).toLocaleString('tr-TR')}
      </Typography>
      
      {/* SADECE NOT VARSA GÖSTER */}
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
<DialogTitle sx={{ 
  pt: 2,
  pb: 0.1,
  display: 'flex',
  alignItems: 'center',
  gap: 1
}}>
  <Typography variant="h5" sx={{ 
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: 1.5 // ← İkon ile yazı arası
  }}>
    💼 Talep Detayları
  </Typography>
  
  <Chip 
    label={`#${ticket.id}`} 
    color="primary" 
    variant="filled"
    sx={{ 
      fontWeight: 'bold',
      fontSize: '1rem',
      ml: 1 // ← Soldan boşluk
    }}
  />
</DialogTitle>
        
      <DialogContent sx={{ pt: 0.5 }}> 
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
                  <InfoRow label="Program" value={ticket.module_name || modules.find(m => m.id === ticket.module_id)?.name || 'Belirtilmemiş'} />               
                  {/* Müşteri değilse öncelik göster */}
                  {authUser?.role !== 'customer' && (
                    <InfoRow label="Öncelik" value={getPriorityChip(ticket.priority_id)} />
                  )}
                  
                  <InfoRow label="Durum" value={getStatusChip(ticket.status_id)} />
                  <InfoRow label="Atanan Personel" value={ticket.assigned_to_name || 'Atanmadı'} />
                  <InfoRow label="E-posta" value={ticket.email || 'Belirtilmemiş'} />
                </Box>
              </CardContent>
            </Card>

            {/* EKLER */}
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
            {/* TALEP KONUSU - HERKES GÖRÜR */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid', borderColor: 'warning.main', pb: 1 }}>
                  📝 Talep Konusu
                </Typography>
                <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap', fontSize: '0.9rem'  }}>
                  {ticket.subject}
                </Typography>
              </CardContent>
            </Card>
            {/* GELEN MAİL İÇERİĞİ - HERKES GÖRÜR */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid', borderColor: 'info.main', pb: 1 }}>
                  📧 Gelen Mail İçeriği
                </Typography>
                <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap', fontSize: '0.9rem'  }}>
                  {ticket.mail_content || 'Mail içeriği bulunmuyor'}  {/* ✅ API'den gelen veriyi kullan */}
                </Typography>
              </CardContent>
            </Card>

            {/* SORUN AÇIKLAMASI - SADECE MÜŞTERİ DEĞİLSE GÖSTER */}
            {authUser?.role !== 'customer' && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid', borderColor: 'error.main', pb: 1 }}>
                    🔍 Aksan Yazılım Sorunun Açıklaması
                  </Typography>
                  <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap', fontSize: '0.9rem'  }}>
                    {ticket.description}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* DURUM GEÇMİŞİ */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ borderBottom: '2px solid', borderColor: 'primary.main', pb: 1 }}>
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

          {/* GELİŞMİŞ FİLTRELEME - TEK SATIR */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              {/* ARAMA */}
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Talep ara..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon fontSize="small" color="action" />,
                  }}
                />
              </Grid>

              {/* DURUM */}
              <Grid item xs={12} md={1.6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Durum</InputLabel>
                  <Select 
                    value={filters.status} 
                    label="Durum" 
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="all">Tüm Durumlar</MenuItem>
                    {statuses.map(status => (
                      <MenuItem key={status.id} value={status.id.toString()}>
                        {status.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* PROGRAM */}
              <Grid item xs={12} md={1.6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Program</InputLabel>
                  <Select 
                    value={filters.module} 
                    label="Program" 
                    onChange={(e) => handleFilterChange('module', e.target.value)}
                  >
                    <MenuItem value="all">Tüm Programlar</MenuItem>
                    {modules.map(module => (
                      <MenuItem key={module.id} value={module.id.toString()}>
                        {module.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* ÖNCELİK */}
              <Grid item xs={12} md={1.6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Öncelik</InputLabel>
                  <Select 
                    value={filters.priority} 
                    label="Öncelik" 
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                  >
                    <MenuItem value="all">Tüm Öncelikler</MenuItem>
                    {priorities.map(priority => (
                      <MenuItem key={priority.id} value={priority.id.toString()}>
                        {priority.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* ATANAN KİŞİ - SADECE ADMIN VE SUPPORT */}
              {(authUser?.role === 'admin' || authUser?.role === 'support') && (
                <Grid item xs={12} md={1.6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Atanan</InputLabel>
                    <Select 
                      value={filters.assigned_to} 
                      label="Atanan" 
                      onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                    >
                      <MenuItem value="all">Tümü</MenuItem>
                      <MenuItem value="unassigned">Atanmamış</MenuItem>
                      {supportUsers.map(user => (
                        <MenuItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* TARİH ARALIĞI - TEK SATIRDA */}
              <Grid item xs={12} md={2.8}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Başlangıç"
                    value={filters.dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: '1rem' },
                      '& .MuiInputBase-input': { fontSize: '1rem' }
                    }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Bitiş"
                    value={filters.dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ 
                      '& .MuiInputLabel-root': { fontSize: '1rem' },
                      '& .MuiInputBase-input': { fontSize: '1rem' }
                    }}
                  />
                </Box>
              </Grid>

            {/* FİLTRE SIFIRLAMA - MODERN KIRMIZI */}
            <Grid item xs={12} md={0.5}>
              <Tooltip title="Tüm filtreleri temizle">
                <IconButton 
                  onClick={clearFilters}
                  size="small"
                  sx={{ 
                    border: '2px solid',
                    borderColor: 'error.main',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: 'error.main',
                      color: 'white',
                      boxShadow: '0 4px 14px rgba(211, 47, 47, 0.4)',
                      transform: 'translateY(-1px)'
                    },
                    width: '40px',
                    height: '40px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Grid>
            </Grid>

            {/* AKTİF FİLTRELER GÖSTERGESİ - SADELEŞTİRİLMİŞ */}
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filters.status !== 'all' && (
                <Chip 
                  label={`Durum: ${statuses.find(s => s.id.toString() === filters.status)?.name}`}
                  onDelete={() => handleFilterChange('status', 'all')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {filters.module !== 'all' && (
                <Chip 
                  label={`Program: ${modules.find(m => m.id.toString() === filters.module)?.name}`}
                  onDelete={() => handleFilterChange('module', 'all')}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              )}
              {filters.priority !== 'all' && (
                <Chip 
                  label={`Öncelik: ${priorities.find(p => p.id.toString() === filters.priority)?.name}`}
                  onDelete={() => handleFilterChange('priority', 'all')}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
              {filters.assigned_to !== 'all' && (
                <Chip 
                  label={`Atanan: ${filters.assigned_to === 'unassigned' ? 'Atanmamış' : supportUsers.find(u => u.id.toString() === filters.assigned_to)?.name}`}
                  onDelete={() => handleFilterChange('assigned_to', 'all')}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
              {filters.search && (
                <Chip 
                  label={`Arama: ${filters.search}`}
                  onDelete={() => handleFilterChange('search', '')}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
              {(filters.dateRange.start || filters.dateRange.end) && (
                <Chip 
                  label={`Tarih: ${filters.dateRange.start || 'Başlangıç'} - ${filters.dateRange.end || 'Bitiş'}`}
                  onDelete={() => handleFilterChange('dateRange', { start: '', end: '' })}
                  size="small"
                  color="default"
                  variant="outlined"
                />
              )}
            </Box>
          </Paper>

      {/* TABLO */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Firma</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Program</TableCell>
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
                <TableCell sx={{ fontWeight: 700 }}>#{ticket.id}</TableCell>
                  <TableCell>{ticket.company_name}</TableCell>
                  <TableCell>{ticket.module_name || modules.find(m => m.id === ticket.module_id)?.name || 'Belirtilmemiş'}</TableCell>                 
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
                      <IconButton 
                        color="primary" 
                        onClick={() => handleView(ticket)}
                        size="small"
                        title="Detayları Gör"
                      >
                        <ViewIcon />
                      </IconButton>

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

        {/* SONUÇ BULUNAMADI */}
        {filteredTickets.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              {tickets.length === 0 ? 'Henüz hiç talep bulunmuyor' : 'Filtrelere uygun talep bulunamadı'}
            </Typography>
            {tickets.length > 0 && (
              <Button 
                variant="outlined" 
                onClick={clearFilters}
                sx={{ mt: 2 }}
              >
                Filtreleri Temizle
              </Button>
            )}
          </Box>
        )}
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
                disabled={authUser?.role === 'support'}
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
              <InputLabel>Program *</InputLabel>
              <Select
                value={newTicketForm.module_id}
                label="Program *"
                onChange={(e) => setNewTicketForm(prev => ({ ...prev, module_id: e.target.value }))}
              >
                {modules.map(module => (
                  <MenuItem key={module.id} value={module.id}>{module.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="E-posta"
                  margin="normal"
                  size="medium"
                  value={newTicketForm.email}
                  onChange={(e) => setNewTicketForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="musteri@firma.com"
                  error={newTicketForm.email !== '' && !isValidEmail(newTicketForm.email)}
                  helperText={newTicketForm.email !== '' && !isValidEmail(newTicketForm.email) ? 'Geçerli bir e-posta adresi giriniz' : ''}
                  InputProps={{
                    sx: { fontSize: '0.875rem' }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Talep Konusu *"
                  margin="normal"
                  size="medium"
                  value={newTicketForm.subject}
                  onChange={(e) => setNewTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Kısa ve net bir konu giriniz..."
                  InputProps={{
                    sx: { fontSize: '0.875rem' }
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Gelen Mail İçeriği"
              margin="normal"
              multiline
              rows={5}
              value={mailContent}
              onChange={(e) => setMailContent(e.target.value)}
              placeholder="Müşteriden gelen mail içeriğini buraya yapıştırabilirsiniz..."
              InputProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />

            <TextField
              fullWidth
              label="Aksan Yazılım Tarafından Sorunun Açıklaması *"
              margin="normal"
              multiline
              rows={5}
              value={newTicketForm.description}
              onChange={(e) => setNewTicketForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Sorunu detaylı bir şekilde açıklayın..."
            />

            <FormControl fullWidth margin="normal" size="medium">
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
                accept=".jpg,.jpeg,.png,.gif,.bmp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
              />
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                Maksimum 5 dosya, her dosya max 10MB. 
                İzin verilen formatlar: Resim (JPG, PNG, GIF), Döküman (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX), 
                Arşiv (ZIP, RAR), Metin (TXT, CSV)
              </Typography>

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
          disabled={
            !newTicketForm.module_id || 
            !newTicketForm.subject || 
            !newTicketForm.description
          }
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