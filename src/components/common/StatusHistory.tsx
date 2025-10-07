// components/common/StatusHistory.tsx - GÜNCELLENDİ
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { StatusHistory } from '../../types';

interface StatusHistoryProps {
  history: StatusHistory[];
}

const StatusHistoryComponent: React.FC<StatusHistoryProps> = ({ history }) => {
  const getStatusConfig = (statusId: number) => {
    const statusConfig: { [key: number]: { color: any, label: string, icon: string } } = {
      1: { color: 'primary', label: 'Yeni', icon: '🆕' },
      2: { color: 'warning', label: 'Başlandı', icon: '🚀' },
      3: { color: 'secondary', label: 'Test', icon: '🧪' },
      4: { color: 'error', label: 'Testten Döndü', icon: '↩️' },
      5: { color: 'success', label: 'Tamamlandı', icon: '✅' },
      6: { color: 'default', label: 'Bekliyor', icon: '⏳' },
      7: { color: 'default', label: 'Kapandı', icon: '🔒' },
    };
    return statusConfig[statusId] || { color: 'default', label: 'Bilinmeyen', icon: '❓' };
  };

  const calculateDuration = (currentIndex: number) => {
    if (currentIndex >= history.length - 1) return 'Devam ediyor';
    
    const current = history[currentIndex];
    const next = history[currentIndex + 1];
    const duration = new Date(next.changed_at).getTime() - new Date(current.changed_at).getTime();
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}sa ${minutes}dk`;
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        ⏱️ Durum Geçmişi
      </Typography>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '150px' }}>Durum</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Değişim Zamanı</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Değiştiren</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', width: '120px' }}>Süre</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Notlar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((record, index) => {
                const config = getStatusConfig(record.status_id);
                return (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Chip 
                        label={`${config.icon} ${record.status_name || config.label}`}
                        color={config.color}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">
                        {new Date(record.changed_at).toLocaleString('tr-TR')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={record.changed_by_name || 'Sistem'} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={calculateDuration(index)} 
                        color="info" 
                        size="small"
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontSize="0.875rem">
                        {record.notes || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default StatusHistoryComponent;