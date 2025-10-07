import React, { useState, useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const theme = useTheme();

  // Mobil drawer (üstteki hamburger)
  const [mobileOpen, setMobileOpen] = useState(false);

  // Masaüstü için sidebar dar/geniş (kalıcı)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_open');
    // eski kaydı okuyalım: '1' = açık, '0' = kapalı… yoksa açık başlat
    if (saved === '0') return true;      // collapsed = true => 72px
    return false;                         // collapsed = false => 280px
  });

  const sidebarWidth = useMemo(() => (collapsed ? 72 : 280), [collapsed]);

  const handleMobileToggle = () => setMobileOpen(p => !p);
  const handleCollapseToggle = () => {
    setCollapsed(prev => {
      const next = !prev;
      // next=true -> kapalı; kaydı '0' yaz (uyumluluk için)
      localStorage.setItem('sidebar_open', next ? '0' : '1');
      return next;
    });
  };

  if (!user) return <>{children}</>;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
      <Header 
        onMenuToggle={handleMobileToggle}
        collapsed={collapsed}
        onCollapseToggle={handleCollapseToggle}
      />

      <Sidebar
        mobileOpen={mobileOpen}
        onMobileToggle={handleMobileToggle}
        collapsed={collapsed}
        onCollapseToggle={handleCollapseToggle}
      />

      {/* İçerik */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, md: 3 },
          pb: 3,
          ml: { xs: 0, md: `${sidebarWidth}px` },
          transition: theme.transitions.create(['margin', 'padding'], {
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Header altında kalmayı önleyen spacer */}
        <Box sx={theme.mixins.toolbar} />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
