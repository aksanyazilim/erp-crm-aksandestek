// pages/Companies.tsx - GÜNCELLENDİ
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
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Company } from '../types';
import { companiesAPI, ticketsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface CompanyWithStats extends Company {
  totalTickets: number;
  activeTickets: number;
  resolvedTickets: number;
}

const Companies: React.FC = () => {
  const { user: authUser, hasPermission } = useAuth();
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [companiesRes, ticketsRes] = await Promise.all([
        companiesAPI.getCompanies(),
        ticketsAPI.getTickets()
      ]);
      
      setCompanies(companiesRes.data);
      setTickets(ticketsRes.data);
      
      // İstatistikleri hesapla
      const companiesWithStats = companiesRes.data.map((company: Company) => {
        const companyTickets = ticketsRes.data.filter((ticket: any) => 
          ticket.company_id === company.id
        );
        const activeTickets = companyTickets.filter((ticket: any) => 
          [1, 2].includes(ticket.status_id) // Yeni ve Başlandı
        ).length;
        const resolvedTickets = companyTickets.filter((ticket: any) => 
          [5, 7].includes(ticket.status_id) // Tamamlandı ve Kapandı
        ).length;
        
        return {
          ...company,
          totalTickets: companyTickets.length,
          activeTickets,
          resolvedTickets,
        };
      });
      
      setCompanies(companiesWithStats);
    } catch (error) {
      console.error('❌ Load data error:', error);
      showSnackbar('Veriler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddCompany = () => {
    setSelectedCompany(null);
    setOpenDialog(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCompany(null);
  };

  const handleSaveCompany = () => {
    // Burada API çağrısı yapılacak
    showSnackbar(selectedCompany ? 'Firma başarıyla güncellendi' : 'Firma başarıyla eklendi');
    handleCloseDialog();
  };

  const handleDeleteCompany = (company: Company) => {
    if (window.confirm(`${company.name} firmasını silmek istediğinizden emin misiniz?`)) {
      // Burada API çağrısı yapılacak
      showSnackbar('Firma başarıyla silindi');
    }
  };

  // Toplam istatistikler
  const totalStats = {
    companies: companies.length,
    totalTickets: tickets.length,
    activeTickets: tickets.filter((t: any) => [1, 2].includes(t.status_id)).length,
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Firmalar yükleniyor...</Typography>
      </Box>
    );
  }

  if (!hasPermission('admin')) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          ⚠️ Bu sayfaya erişim izniniz yok
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Sadece admin kullanıcılar firma yönetim sayfasına erişebilir.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🏢 Firmalar ({companies.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCompany}
        >
          Yeni Firma
        </Button>
      </Box>

      {/* İstatistik Kartları */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Typography variant="h6" color="primary.main">
            {totalStats.companies}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Toplam Firma
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Typography variant="h6" color="primary.main">
            {totalStats.totalTickets}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Toplam Talep
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Typography variant="h6" color="warning.main">
            {totalStats.activeTickets}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aktif Talep
          </Typography>
        </Paper>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Firma Adı</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>İletişim</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Toplam Talep</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Aktif Talep</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Çözülen Talep</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="600">
                      {company.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        📧 {company.email || 'Belirtilmemiş'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        📞 {company.phone || 'Belirtilmemiş'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip 
                      label={company.totalTickets}
                      color="primary" 
                      variant="filled"
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip 
                      label={company.activeTickets}
                      color={company.activeTickets > 0 ? "warning" : "default"}
                      variant="filled"
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip 
                      label={company.resolvedTickets}
                      color="success" 
                      variant="filled"
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleEditCompany(company)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error"
                        onClick={() => handleDeleteCompany(company)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Firma Ekleme/Düzenleme Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedCompany ? '✏️ Firma Düzenle' : '🏢 Yeni Firma Ekle'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Firma Adı"
              margin="normal"
              defaultValue={selectedCompany?.name || ''}
              size="small"
            />
            <TextField
              fullWidth
              label="Email"
              margin="normal"
              type="email"
              defaultValue={selectedCompany?.email || ''}
              size="small"
            />
            <TextField
              fullWidth
              label="Telefon"
              margin="normal"
              defaultValue={selectedCompany?.phone || ''}
              size="small"
            />
            <TextField
              fullWidth
              label="Adres"
              margin="normal"
              multiline
              rows={3}
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button variant="contained" onClick={handleSaveCompany}>
            {selectedCompany ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Companies;