// components/CompanyManagement.tsx
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
  Card,
  CardContent,
  IconButton,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { companiesAPI, usersAPI } from '../../services/api';

interface Company {
  id: number;
  name: string;
  is_active: boolean;
  customer_count: number;
  ticket_count: number;
}

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCompanyDialogOpen, setNewCompanyDialogOpen] = useState(false);
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
  });

  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    company_id: '',
    role_id: '3', // Varsayılan müşteri
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await companiesAPI.getCompanies();
      setCompanies(response.data);
    } catch (error) {
      console.error('❌ Load companies error:', error);
      showSnackbar('Firmalar yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreateCompany = async () => {
    try {
      // Backend'de create company endpoint'i yoksa, şimdilik sadece frontend'de gösterim
      showSnackbar('Yeni firma oluşturma özelliği yakında eklenecek');
      setNewCompanyDialogOpen(false);
      setNewCompanyForm({ name: '' });
    } catch (error) {
      console.error('❌ Create company error:', error);
      showSnackbar('Firma oluşturulurken hata oluştu', 'error');
    }
  };

  const handleCreateUser = async () => {
    try {
      // Kullanıcı oluşturma endpoint'ini kullan
      await usersAPI.createUser(newUserForm);
      showSnackbar('Kullanıcı başarıyla oluşturuldu');
      setNewUserDialogOpen(false);
      setNewUserForm({
        full_name: '',
        email: '',
        company_id: '',
        role_id: '3',
      });
      loadCompanies();
    } catch (error: any) {
      console.error('❌ Create user error:', error);
      showSnackbar(error.response?.data?.error || 'Kullanıcı oluşturulurken hata oluştu', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🏢 Firma Yönetimi
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setNewUserDialogOpen(true)}
          >
            Yeni Kullanıcı
          </Button>
          <Button
            variant="contained"
            startIcon={<BusinessIcon />}
            onClick={() => setNewCompanyDialogOpen(true)}
          >
            Yeni Firma
          </Button>
        </Box>
      </Box>

      {/* FIRMA İSTATİSTİKLERİ */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BusinessIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {companies.length}
                  </Typography>
                  <Typography color="text.secondary">
                    Toplam Firma
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PeopleIcon color="secondary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {companies.reduce((sum, company) => sum + company.customer_count, 0)}
                  </Typography>
                  <Typography color="text.secondary">
                    Müşteri Sayısı
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssignmentIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {companies.reduce((sum, company) => sum + company.ticket_count, 0)}
                  </Typography>
                  <Typography color="text.secondary">
                    Toplam Talep
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FIRMA LİSTESİ */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Firma ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Firma Adı</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Müşteri Sayısı</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Talep Sayısı</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Durum</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id} hover>
                  <TableCell>#{company.id}</TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="600">
                      {company.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip 
                      label={company.customer_count} 
                      color="info" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip 
                      label={company.ticket_count} 
                      color="secondary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={company.is_active ? 'Aktif' : 'Pasif'} 
                      color={company.is_active ? 'success' : 'error'} 
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* YENİ FIRMA DIALOG */}
      <Dialog open={newCompanyDialogOpen} onClose={() => setNewCompanyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Firma Ekle</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Firma Adı"
              value={newCompanyForm.name}
              onChange={(e) => setNewCompanyForm({ name: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewCompanyDialogOpen(false)}>İptal</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateCompany}
            disabled={!newCompanyForm.name}
          >
            Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      {/* YENİ KULLANICI DIALOG */}
      <Dialog open={newUserDialogOpen} onClose={() => setNewUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Tam Ad"
              value={newUserForm.full_name}
              onChange={(e) => setNewUserForm(prev => ({ ...prev, full_name: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="E-posta"
              type="email"
              value={newUserForm.email}
              onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Firma</InputLabel>
              <Select
                value={newUserForm.company_id}
                label="Firma"
                onChange={(e) => setNewUserForm(prev => ({ ...prev, company_id: e.target.value }))}
              >
                {companies.map(company => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Rol</InputLabel>
              <Select
                value={newUserForm.role_id}
                label="Rol"
                onChange={(e) => setNewUserForm(prev => ({ ...prev, role_id: e.target.value }))}
              >
                <MenuItem value="3">Müşteri</MenuItem>
                <MenuItem value="2">Destek Personeli</MenuItem>
                <MenuItem value="1">Admin</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info" sx={{ mt: 2 }}>
              Varsayılan şifre: <strong>password</strong>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewUserDialogOpen(false)}>İptal</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateUser}
            disabled={!newUserForm.full_name || !newUserForm.email || !newUserForm.company_id}
          >
            Kullanıcı Oluştur
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

export default CompanyManagement;