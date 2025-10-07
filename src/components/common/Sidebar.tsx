import React, { useEffect, useMemo } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider, IconButton, Tooltip, useMediaQuery, useTheme, Paper
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ListAlt as ListIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  Assessment as ReportIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Support as SupportIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileToggle: () => void;
  collapsed: boolean;
  onCollapseToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileToggle, collapsed, onCollapseToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();

  const drawerWidth = collapsed ? 72 : 280;

  // mobilde rota değişince Drawer’ı kapat
  useEffect(() => {
    if (isMobile && mobileOpen) onMobileToggle();
  }, [location.pathname, isMobile, mobileOpen, onMobileToggle]);

  const can = useMemo(() => {
    const role = user?.role ?? '';
    const has = (r: string) => (typeof hasPermission === 'function' ? hasPermission(r) : role === r || role === 'admin');
    return {
      admin: has('admin'),
      support: role === 'support' || role === 'admin',
      customer: role === 'customer',
    };
  }, [user, hasPermission]);

  const menuItems = useMemo(() => {
  const list = [
    { 
      text: 'Taleplerim', 
      icon: <ListIcon sx={{ fontSize: 22 }} />, 
      path: '/tickets', 
      roles: ['admin', 'support', 'customer'], 
      tip: 'Tüm talepleriniz' 
    },
  ];

  // Sadece admin ve customer yeni talep oluşturabilir
  if (user?.role !== 'support') {
    list.push({ 
      text: 'Yeni Talep', 
      icon: <AddIcon sx={{ fontSize: 22 }} />, 
      path: '/new-ticket', 
      roles: ['admin', 'customer'], 
      tip: 'Yeni talep oluşturun' 
    });
  }

  if (can.admin) {
    list.unshift({ 
      text: 'Dashboard', 
      icon: <DashboardIcon sx={{ fontSize: 22 }} />, 
      path: '/dashboard', 
      roles: ['admin'], 
      tip: 'Sistem istatistikleri' 
    });
    list.push({ 
      text: 'Firma Yönetimi', 
      icon: <BusinessIcon sx={{ fontSize: 22 }} />, 
      path: '/companies', 
      roles: ['admin'], 
      tip: 'Firma yönetimi' 
    });
  }
  if (can.support) {
    list.push({ 
      text: 'Raporlar', 
      icon: <ReportIcon sx={{ fontSize: 22 }} />, 
      path: '/reports', 
      roles: ['admin', 'support'], 
      tip: 'Detaylı raporlar' 
    });
  }
  
  const role = user?.role ?? '';
  return list.filter(i => i.roles.includes(role));
}, [can, user?.role]);
  const userMenu = [
    { text: 'Profilim', icon: <ProfileIcon sx={{ fontSize: 22 }} />, path: '/profile', tip: 'Profil bilgileriniz' },
    { text: 'Ayarlar',   icon: <SettingsIcon sx={{ fontSize: 22 }} />, path: '/settings', tip: 'Sistem ayarları' },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) onMobileToggle();
  };

  const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Paper 
      elevation={6} 
      square 
      sx={{ 
        height: '100%', 
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {children}
    </Paper>
  );

  const drawerInner = (
    <Shell>
      {/* Header (logo + toggle her zaman görünür (desktop)) */}
      <Box sx={{ 
        p: 2, 
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SupportIcon sx={{ 
              fontSize: 28, color: '#3b82f6',
              filter: 'drop-shadow(0 2px 4px rgba(59,130,246,0.3))'
            }} />
            {!collapsed && (
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                  Aksan Yazılım
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Destek Sistemi
                </Typography>
              </Box>
            )}
          </Box>

          {/* Masaüstü toggle */}
          <Tooltip title={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'} placement="right">
            <IconButton
              onClick={onCollapseToggle}
              size="small"
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                color: 'rgba(255,255,255,0.85)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
              }}
              aria-label="Sidebar genişliğini değiştir"
            >
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Kullanıcı kartı (yalnızca açıkken) */}
      {!collapsed && (
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 44, height: 44, borderRadius: '50%', bgcolor: '#3b82f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 'bold', fontSize: 16,
                border: '2px solid rgba(255,255,255,0.2)'
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap sx={{ color: 'white', fontWeight: 600 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }} noWrap>
                {user?.role === 'admin' ? 'Sistem Yöneticisi' : user?.role === 'support' ? 'Destek Uzmanı' : 'Müşteri'}
              </Typography>
              {!!user?.companyName && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }} noWrap display="block">
                  {user.companyName}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* Menü */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? item.tip : ''} placement="right">
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNav(item.path)}
                  sx={{
                    borderRadius: 2,
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: collapsed ? 1.5 : 2,
                    minHeight: 48,
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                      '&:hover': { background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' },
                    },
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 'auto' : 2, justifyContent: 'center', color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: location.pathname === item.path ? 700 : 500, letterSpacing: '0.2px' }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Alt menü */}
      <Box sx={{ p: 1 }}>
        <List sx={{ px: 1 }}>
          {userMenu.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? item.tip : ''} placement="right">
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNav(item.path)}
                  sx={{
                    borderRadius: 2,
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: collapsed ? 1.5 : 2,
                    minHeight: 48,
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                    '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 'auto' : 2, justifyContent: 'center', color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.95rem' }} />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>
    </Shell>
  );

  return (
    <>
      {/* Mobil Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: 280, border: 'none', boxShadow: '4px 0 20px rgba(0,0,0,0.3)' },
        }}
      >
        {drawerInner}
      </Drawer>

      {/* Masaüstü Drawer */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            border: 'none',
            overflowX: 'hidden',
            boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        {drawerInner}
      </Drawer>
    </>
  );
};

export default Sidebar;
