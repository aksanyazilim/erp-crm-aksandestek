// pages/NewTicket.tsx - TICKETLIST'TEKİ DIALOG İLE AYNI TASARIM
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Container,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Alert,
  Snackbar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { companiesAPI, systemAPI, ticketsAPI } from '../services/api';

const NewTicket: React.FC = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    company_id: '',
    module_id: '',
    subject: '',
    description: '',
    email: '',
    priority_id: '1', 
  });
  
  const [mailContent, setMailContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [modulesRes, prioritiesRes] = await Promise.all([
        systemAPI.getModules(),
        systemAPI.getPriorities()
      ]);

      setModules(modulesRes.data);
      setPriorities(prioritiesRes.data);

      // Admin ise firmaları da yükle
      if (authUser?.role === 'admin') {
        try {
          const companiesRes = await companiesAPI.getCompanies();
          setCompanies(companiesRes.data);
        } catch (error) {
          console.error('❌ Companies load error:', error);
        }
      }

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

  // E-posta validasyonu
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

  // Dosya silme fonksiyonu
  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Dosya formatına göre ikon belirleme
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc': case 'docx': return '📝';
      case 'xls': case 'xlsx': return '📊';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return '🖼️';
      default: return '📎';
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

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.module_id || !formData.subject || !formData.description) {
        showSnackbar('Lütfen zorunlu alanları doldurun', 'error');
        return;
      }

      // E-posta validasyonu
      if (formData.email && !isValidEmail(formData.email)) {
        showSnackbar('Lütfen geçerli bir e-posta adresi giriniz', 'error');
        return;
      }

      // Müşteri için otomatik company_id
      const ticketData = {
        ...formData,
        company_id: authUser?.role === 'customer' ? '1' : formData.company_id,
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
      
      // Formu temizle ve tickets sayfasına yönlendir
      setFormData({
        company_id: '',
        module_id: '',
        subject: '',
        description: '',
        email: '',
        priority_id: '2',
      });
      setMailContent('');
      setFiles([]);
      
      navigate('/tickets');
      
    } catch (error: any) {
      console.error('❌ Create ticket error:', error);
      showSnackbar(error.response?.data?.error || 'Talep oluşturulamadı', 'error');
    }
  };

  const handleCancel = () => {
    navigate('/tickets');
  };

  // Öncelik chip'leri
  const getPriorityChip = (priorityId: number) => {
    const priority = priorities.find(p => p.id === priorityId);
    if (!priority) return <Chip label="❓ Bilinmeyen" size="small" />;

    const priorityConfig: any = {
      1: { color: 'success', icon: '🟢', label: 'Düşük' },
      2: { color: 'info', icon: '🔵', label: 'Orta' },
      3: { color: 'warning', icon: '🟠', label: 'Yüksek' },
      4: { color: 'error', icon: '🔴', label: 'Acil' },
    };

    const config = priorityConfig[priorityId] || { color: 'default', icon: '❓', label: priority.name };
    
    return (
      <Chip 
        label={`${config.icon} ${config.label}`} 
        color={config.color}
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box>
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold', 
            color: 'primary.main',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          📝 Yeni Talep Oluştur
        </Typography>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box component="form">
            {/* Firma Seçimi - Sadece Admin */}
            {authUser?.role === 'admin' && (
              <FormControl fullWidth margin="normal" size="medium">
                <InputLabel>Firma *</InputLabel>
                <Select
                  value={formData.company_id}
                  label="Firma *"
                  onChange={(e) => handleFormChange('company_id', e.target.value)}
                >
                  {companies.map(company => (
                    <MenuItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Program Seçimi */}
            <FormControl fullWidth margin="normal" size="medium">
              <InputLabel>Program *</InputLabel>
              <Select
                value={formData.module_id}
                label="Program *"
                onChange={(e) => handleFormChange('module_id', e.target.value)}
              >
                {modules.map(module => (
                  <MenuItem key={module.id} value={module.id.toString()}>
                    {module.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Email ve Konu */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="E-posta"
                  margin="normal"
                  size="medium"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder="musteri@firma.com"
                  error={formData.email !== '' && !isValidEmail(formData.email)}
                  helperText={formData.email !== '' && !isValidEmail(formData.email) ? 'Geçerli bir e-posta adresi giriniz' : ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Talep Konusu *"
                  margin="normal"
                  size="medium"
                  value={formData.subject}
                  onChange={(e) => handleFormChange('subject', e.target.value)}
                  placeholder="Kısa ve net bir konu giriniz..."
                />
              </Grid>
            </Grid>

            {/* Mail İçeriği */}
            <TextField
              fullWidth
              label="Gelen Mail İçeriği"
              margin="normal"
              multiline
              rows={4}
              value={mailContent}
              onChange={(e) => setMailContent(e.target.value)}
              placeholder="Müşteriden gelen mail içeriğini buraya yapıştırabilirsiniz..."
              helperText="Müşteri mail içeriğini bu alana kopyalayabilirsiniz"
            />

            {/* Sorun Açıklaması */}
            <TextField
              fullWidth
              label="Aksan Yazılım Tarafından Sorunun Açıklaması *"
              margin="normal"
              multiline
              rows={5}
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Sorunu detaylı bir şekilde açıklayın..."
            />

            {/* Öncelik Seçimi */}
            <FormControl fullWidth margin="normal" size="medium">
              <InputLabel>Öncelik</InputLabel>
              <Select
                value={formData.priority_id}
                label="Öncelik"
                onChange={(e) => handleFormChange('priority_id', e.target.value)}
              >
                {priorities.map(priority => (
                  <MenuItem key={priority.id} value={priority.id.toString()}>
                    {getPriorityChip(priority.id)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Dosya Yükleme */}
            <Card variant="outlined" sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
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
              </CardContent>
            </Card>

            {/* Butonlar */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button onClick={handleCancel}>
                İptal
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSubmit}
                disabled={
                  !formData.module_id || 
                  !formData.subject || 
                  !formData.description
                }
                size="large"
              >
                Talep Oluştur
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NewTicket;