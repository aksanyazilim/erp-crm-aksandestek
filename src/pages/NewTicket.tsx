// pages/NewTicket.tsx - GÜNCELLENDİ
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Alert, Container } from '@mui/material';
import { useTicket } from '../contexts/TicketContext';
import TicketForm from '../components/forms/TicketForm';

const NewTicket: React.FC = () => {
  const { addTicket, selectedCompany, selectedModule } = useTicket();
  const navigate = useNavigate();

  const handleSubmit = async (ticketData: any) => {
    try {
      console.log('🎫 Creating new ticket with data:', ticketData);
      
      // created_by bilgisini ekle (gerçek uygulamada auth context'ten alınacak)
      const ticketWithUser = {
        ...ticketData,
        created_by: 1, // TODO: Auth user'dan alınacak
      };

      await addTicket(ticketWithUser);
      
      // Başarı mesajı ve yönlendirme
      console.log('✅ Ticket created successfully, navigating to tickets page...');
      navigate('/tickets', { 
        state: { message: 'Talep başarıyla oluşturuldu!' } 
      });
      
    } catch (error) {
      console.error('❌ Error creating ticket:', error);
      alert('Talep oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleCancel = () => {
    navigate('/tickets');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold', 
            color: 'primary.main',
            mb: 3 
          }}
        >
          📝 Yeni Talep Oluştur
        </Typography>
        
        {!selectedCompany || !selectedModule ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Uyarı:</strong> Talep oluşturmak için lütfen firma ve modül seçin.
          </Alert>
        ) : (
          <Alert severity="success" sx={{ mb: 3 }}>
            <strong>Seçilen:</strong> {selectedCompany.name} - {selectedModule.toUpperCase()}
          </Alert>
        )}

        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)'
          }}
        >
          <TicketForm 
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            selectedCompany={selectedCompany}
            selectedModule={selectedModule}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default NewTicket;