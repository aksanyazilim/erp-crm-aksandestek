import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Warning as WarningIcon } from '@mui/icons-material';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        padding: 3
      }}
    >
      <Paper
        sx={{
          padding: 4,
          textAlign: 'center',
          maxWidth: 500,
          width: '100%'
        }}
      >
        <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        
        <Typography variant="h4" gutterBottom color="error">
          Erişim Engellendi
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Bu sayfaya erişim izniniz bulunmamaktadır. 
          Lütfen sistem yöneticinizle iletişime geçin.
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate('/')}
          size="large"
        >
          Ana Sayfaya Dön
        </Button>
      </Paper>
    </Box>
  );
};

export default Unauthorized;