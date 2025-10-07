import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface TicketAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number;
  currentAssignee?: string;
  onAssignmentComplete: () => void;
}

const TicketAssignment: React.FC<TicketAssignmentProps> = ({
  isOpen,
  onClose,
  ticketId,
  currentAssignee,
  onAssignmentComplete,
}) => {
  const [supportUsers, setSupportUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string>('');
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchSupportUsers();
      setError('');
    }
  }, [isOpen]);

  const fetchSupportUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      }

      const response = await fetch('http://localhost:5000/api/users/support', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const users = await response.json();
        setSupportUsers(users);
      } else if (response.status === 401) {
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      } else {
        throw new Error('Destek kullanıcıları yüklenemedi');
      }
    } catch (error) {
      console.error('❌ Destek kullanıcıları yükleme hatası:', error);
      setError(error instanceof Error ? error.message : 'Destek kullanıcıları yüklenemedi');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) {
      setError('Lütfen bir kullanıcı seçin');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Oturum bulunamadı');
      }

      const response = await fetch(`http://localhost:5000/api/tickets/${ticketId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          assigned_to: parseInt(selectedUserId),
        }),
      });

      if (response.ok) {
        onAssignmentComplete();
        handleClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Atama başarısız');
      }
    } catch (error) {
      console.error('❌ Atama hatası:', error);
      setError(error instanceof Error ? error.message : 'Atama başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          👤 Talep Atama
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Talep ID: #{ticketId}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {currentAssignee && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Mevcut Atanan:</strong> {currentAssignee}
          </Alert>
        )}

        <Box sx={{ pt: 1 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="assignee-select-label">Destek Personeli</InputLabel>
            <Select
              labelId="assignee-select-label"
              value={selectedUserId}
              label="Destek Personeli"
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isLoadingUsers}
            >
              <MenuItem value="">
                <em>Kullanıcı seçin...</em>
              </MenuItem>
              {supportUsers.map((user) => (
                <MenuItem key={user.id} value={user.id.toString()}>
                  {user.name} ({user.email}) - {user.role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {isLoadingUsers && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {supportUsers.length === 0 && !isLoadingUsers && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Atanabilecek destek personeli bulunamadı.
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose}
          disabled={isLoading}
          color="inherit"
        >
          İptal
        </Button>
        <Button
          onClick={handleAssign}
          disabled={isLoading || !selectedUserId || isLoadingUsers}
          variant="contained"
          color="primary"
        >
          {isLoading ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Atanıyor...
            </>
          ) : (
            'Ata'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketAssignment;