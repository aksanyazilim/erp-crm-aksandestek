import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Box, IconButton, Menu, MenuItem,
  Avatar, useTheme, useMediaQuery
} from '@mui/material';
import { 
  AccountCircle, 
  Settings, 
  Logout,
  Menu as MenuIcon,
  ChevronLeft,
  ChevronRight,
  Build,
  Support as SupportIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle: () => void;
  collapsed: boolean;
  onCollapseToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, collapsed, onCollapseToggle }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleProfile = () => { setAnchorEl(null); navigate('/profile'); };
  const handleLogout  = () => { logout(); setAnchorEl(null); navigate('/login'); };

  return (
    <AppBar
      position="fixed"
      elevation={2}
      sx={{
        zIndex: (t) => t.zIndex.drawer + 2,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        color: 'text.primary',
        borderBottom: '1px solid #e2e8f0',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}
    >
      <Toolbar sx={{ minHeight: 70, px: { xs: 2, md: 3 }, gap: 1 }}>
        {/* Sol grup: Mobil hamburger + Desktop collapse toggle + Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Mobil menü (drawer) */}
          <IconButton 
            color="inherit" 
            onClick={onMenuToggle} 
            sx={{ display: { md: 'none' } }}
            aria-label="Menüyü aç/kapat"
          >
            <MenuIcon />
          </IconButton>

          {/* Masaüstü sidebar aç/kapa (HER ZAMAN görünür md+) */}
          <IconButton
            color="inherit"
            onClick={onCollapseToggle}
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            aria-label="Sidebar genişliğini değiştir"
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>

          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, ml: { xs: 0.5, md: 0 } }}>
            <Build sx={{ 
                fontSize: 28, 
                color: '#1e40af', // Sadece mavi renk
              }} /><Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 800, 
                color: '#1e293b',
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2
              }}
            >
              Aksan Yazılım Destek
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Sağ grup: kullanıcı menüsü */}
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 3,
            background: 'rgba(30, 64, 175, 0.03)',
            border: '1px solid rgba(30, 64, 175, 0.1)',
            cursor: 'pointer',
            '&:hover': {
              background: 'rgba(30, 64, 175, 0.06)',
              borderColor: 'rgba(30, 64, 175, 0.2)',
            },
            transition: 'all 0.2s ease'
          }}
        >
          {!isMobile && (
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b' }}>
              {user?.name}
            </Typography>
          )}
          <Avatar 
            sx={{ 
              width: 32, height: 32, bgcolor: '#1e40af',
              fontSize: '14px', fontWeight: 'bold', border: '2px solid #e2e8f0',
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
        </Box>

        <Menu
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              mt: 1.5, minWidth: 200, borderRadius: 2,
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              '& .MuiMenuItem-root': { fontSize: '0.9rem', py: 1.5 }
            },
          }}
        >
          <MenuItem onClick={handleProfile}>
            <AccountCircle sx={{ mr: 2, fontSize: 22, color: '#64748b' }} />
            Profilim
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
            <Settings sx={{ mr: 2, fontSize: 22, color: '#64748b' }} />
            Ayarlar
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 2, fontSize: 22, color: '#64748b' }} />
            Çıkış Yap
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
