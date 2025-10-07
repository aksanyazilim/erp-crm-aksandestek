// pages/Dashboard.tsx - GÜNCELLENMİŞ
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  alpha,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  BugReport as BugIcon,
  CheckCircle as ResolvedIcon,
  Schedule as PendingIcon,
  Warning as CriticalIcon,
  TrendingUp as TrendingIcon,
  Add as AddIcon,
  ListAlt as ListIcon,
  Assessment as ReportIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Assignment as AssignedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  total: number;
  new: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  critical: number;
  waiting: number;
}

interface RecentTicket {
  id: number;
  subject: string;
  company_name: string;
  module_name: string;
  status_id: number;
  status_name: string;
  priority_id: number;
  priority_name: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    new: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
    waiting: 0
  });
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading dashboard data...');
      
      const response = await dashboardAPI.getStats();
      const data = response.data;
      
      setStats(data.stats);
      setRecentTickets(data.recentTickets);
      
      console.log('✅ Dashboard data loaded:', data.stats);
    } catch (err: any) {
      console.error('❌ Dashboard load error:', err);
      setError('Dashboard verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Öncelik chip'i (TicketList'ten aynısı)
  const getPriorityChip = (priorityId: number) => {
    const priorityConfig: any = {
      1: { color: 'success', icon: '🟢', label: 'Düşük' },
      2: { color: 'info', icon: '🔵', label: 'Orta' },
      3: { color: 'warning', icon: '🟠', label: 'Yüksek' },
      4: { color: 'error', icon: '🔴', label: 'Acil' },
    };

    const config = priorityConfig[priorityId] || { color: 'default', icon: '❓', label: 'Bilinmeyen' };
    return <Chip label={`${config.icon} ${config.label}`} color={config.color} size="small" />;
  };

  // Durum chip'i (TicketList'ten aynısı)
  const getStatusChip = (statusId: number) => {
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

    const config = statusConfig[statusId] || { icon: '❓', label: 'Bilinmeyen' };
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

const StatCard: React.FC<{ 
  title: string; 
  value: number | string;
  icon: React.ReactNode; 
  color: string; // sadece icon/yazı rengi
  description: string;
}> = ({ title, value, icon, color, description }) => {
  // Tüm kartlar için sabit değer boyutu ve satır yüksekliği:
  const VALUE_FONT_SIZE = '2.3rem';
  const VALUE_LINE_HEIGHT = 1;       // tam sıkı
  const VALUE_ROW_HEIGHT = '2.6rem'; // hepsi için aynı yükseklik alanı

  return (
    <Card sx={{ 
      height: '140px',
      background: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: 2,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        borderColor: color,
      }
    }}>
      <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
            {/* DEĞER: tüm kartlarda aynı boy ve aynı yükseklikte alan */}
            <Typography
              component="div"
              fontWeight="bold"
              color={color}
              sx={{
                fontSize: VALUE_FONT_SIZE,
                lineHeight: VALUE_LINE_HEIGHT,
                height: VALUE_ROW_HEIGHT,          // hizayı eşitle
                display: 'flex',
                alignItems: 'flex-end',             // baseline benzeri görünüm
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={String(value)}
            >
              {value}
            </Typography>

            {/* BAŞLIK ve AÇIKLAMA */}
            <Typography
              component="div"
              fontWeight={600}
              color="text.primary"
              sx={{ mt: 0.5, fontSize: '0.9rem' }}
            >
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {description}
            </Typography>
          </Box>

          {/* İKON */}
          <Box sx={{ color, opacity: 0.8, fontSize: '2rem', flexShrink: 0 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};



const QuickAction: React.FC<{ 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  onClick: () => void;
  color: string;
}> = ({ title, description, icon, onClick, color }) => (
  <Paper 
    sx={{ 
      p: 2, 
      borderRadius: 3,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: `1px solid ${alpha(color, 0.2)}`,
      background: `linear-gradient(135deg, ${alpha(color, 0.08)} 0%, ${alpha(color, 0.02)} 100%)`,
      height: '120px', // Sabit yükseklik
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: `0 6px 20px ${alpha(color, 0.2)}`,
        borderColor: alpha(color, 0.4),
      }
    }}
    onClick={onClick}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <Box sx={{ 
        color, 
        fontSize: '1.5rem',
        background: `linear-gradient(135deg, ${alpha(color, 0.2)} 0%, ${alpha(color, 0.1)} 100%)`,
        borderRadius: 2,
        p: 1,
        flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight="600" color="text.primary" noWrap>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ 
          mt: 0.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {description}
        </Typography>
      </Box>
    </Box>
    <Button 
      variant="outlined" 
      size="small" 
      sx={{ 
        alignSelf: 'flex-start',
        borderColor: color,
        color: color,
        fontSize: '0.75rem',
        minWidth: 'auto',
        px: 1,
        '&:hover': {
          backgroundColor: alpha(color, 0.1),
          borderColor: color,
        }
      }}
    >
      Git →
    </Button>
  </Paper>
);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Dashboard yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadDashboardData}>
          Tekrar Dene
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
          🚀 Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Hoş geldiniz, {authUser?.name}
        </Typography>
      </Box>
      
      {/* İSTATİSTİK KARTLARI */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam Talep"
            value={stats.total}
            description="Tüm talepler"
            icon={<BugIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Yeni Talepler"
            value={stats.new}
            description="İnceleme bekleyen"
            icon={<PendingIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Kritik"
            value={stats.critical}
            description="Acil müdahale"
            icon={<CriticalIcon />}
            color="#d32f2f"
          />
        </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Rolünüz"
          value={authUser?.role === 'admin' ? 'Admin' : authUser?.role === 'support' ? 'Destek' : 'Müşteri'}
          description="Sistem yetkiniz"
          icon={<PersonIcon />}
          color="#7b1fa2"
        />
      </Grid>
      </Grid>

{/* HIZLI ERİŞİM VE SON TALEPLER */}
<Grid container spacing={3}>
  <Grid item xs={12} md={6}>
    <Paper sx={{ p: 3, borderRadius: 3, height: 'fit-content' }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
        ⚡ Hızlı İşlemler
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <QuickAction
            title="Talep Yönetimi"
            description="Tüm talepleri görüntüle ve yönet"
            icon={<ListIcon />}
            onClick={() => navigate('/tickets')}
            color="#0288d1" 
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <QuickAction
            title="Yeni Talep"
            description="Yeni talep oluştur"
            icon={<AddIcon />}
            onClick={() => navigate('/new-ticket')}
            color="#2e7d32"
          />
        </Grid>
        {(authUser?.role === 'admin' || authUser?.role === 'customer') && (
          <Grid item xs={12} sm={6}>
            <QuickAction
              title="Firma Yönetimi"
              description="Firma bilgilerini düzenle"
              icon={<BusinessIcon />}
              onClick={() => navigate('/companies')}
              color="#ed6c02"
            />
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <QuickAction
            title="Raporlar"
            description="Detaylı analiz ve istatistikler"
            icon={<ReportIcon />}
            onClick={() => navigate('/reports')}
            color="#9c27b0"
          />
        </Grid>
      </Grid>
    </Paper>
  </Grid>

  <Grid item xs={12} md={6}>
    <Paper sx={{ p: 3, borderRadius: 3, minHeight: '400px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          📋 Son Talepler
        </Typography>
        <Button 
          size="small" 
          onClick={() => navigate('/tickets')}
          variant="outlined"
          startIcon={<ListIcon />}
        >
          Tümünü Gör
        </Button>
      </Box>
      
      {recentTickets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary" gutterBottom>
            Henüz talep bulunmuyor
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/tickets')}
            sx={{ mt: 2 }}
          >
            İlk Talebi Oluştur
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {recentTickets.map((ticket) => (
            <Paper 
              key={ticket.id} 
              sx={{ 
                p: 2, 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  transform: 'translateX(4px)',
                }
              }}
            >
              <Typography variant="subtitle1" fontWeight="500" gutterBottom sx={{ color: 'primary.main' }}>
                {ticket.subject}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {ticket.company_name} • {ticket.module_name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {getStatusChip(ticket.status_id)}
                  {getPriorityChip(ticket.priority_id)}
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {new Date(ticket.created_at).toLocaleString('tr-TR')}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Paper>
  </Grid>
</Grid>
    </Box>
  );
};

export default Dashboard;