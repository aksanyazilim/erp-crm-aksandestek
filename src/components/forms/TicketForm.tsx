// components/forms/TicketForm.tsx - ESKİ KODUNUZA GÖRE GÜNCELLENDİ
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  Chip,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ModuleType, Company } from '../../types';

// Schema
const schema = yup.object({
  subject: yup.string().required('Konu zorunludur'),
  description: yup.string().required('Açıklama zorunludur'),
  email: yup.string().email('Geçerli bir email adresi girin').optional(),
});

interface TicketFormData {
  subject: string;
  description: string;
  email: string;
  priority: string;
  due_date: string;
  assigned_to: string;
}

interface TicketFormProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void; 
  selectedCompany: Company | null;
  selectedModule: ModuleType | null;
}

const TicketForm: React.FC<TicketFormProps> = ({ 
  onSubmit, 
  onCancel,
  selectedCompany,
  selectedModule
}) => {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<TicketFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      subject: '',
      description: '',
      email: '',
      priority: '2', // Orta - SQL ID'si
      due_date: '',
      assigned_to: '',
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachments(Array.from(event.target.files));
    }
  };

  const handleFormSubmit = async (data: TicketFormData) => {
    if (!selectedCompany || !selectedModule) {
      alert('Lütfen firma ve modül seçiniz');
      return;
    }

    try {
      setSubmitting(true);
      
      // Yeni SQL yapısına uygun formata çevir
      const ticketData = {
        company_id: selectedCompany.id,
        module_id: getModuleId(selectedModule),
        subject: data.subject,
        description: data.description,
        email: data.email || '',
        priority_id: parseInt(data.priority),
        assigned_to: data.assigned_to ? parseInt(data.assigned_to) : null,
        due_date: data.due_date || null,
        // created_by: current user ID buraya gelecek
      };

      console.log('📤 Submitting ticket data:', ticketData);
      await onSubmit(ticketData);
      
    } catch (error) {
      console.error('❌ Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // ModuleType'ı module_id'ye çevir
  const getModuleId = (module: ModuleType): number => {
    const moduleMap = {
      [ModuleType.CRM]: 1,
      [ModuleType.ERP]: 2,
      [ModuleType.CUSTOM]: 3,
    };
    return moduleMap[module];
  };

  // Priority ID'sini label'a çevir (display için)
  const getPriorityLabel = (priorityId: string) => {
    const priorityMap: { [key: string]: string } = {
      '1': 'Düşük',
      '2': 'Orta', 
      '3': 'Yüksek',
      '4': 'Kritik'
    };
    return priorityMap[priorityId] || 'Orta';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        📝 Yeni Destek Talebi
      </Typography>

      {selectedCompany && selectedModule ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          <strong>Firma:</strong> {selectedCompany.name} | <strong>Modül:</strong> {selectedModule.toUpperCase()}
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Lütfen firma ve modül seçiniz
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <Controller
          name="subject"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Talep Konusu *"
              fullWidth
              margin="normal"
              error={!!errors.subject}
              helperText={errors.subject?.message}
              size="small"
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="E-posta"
              fullWidth
              margin="normal"
              type="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              size="small"
              placeholder="destek@firma.com"
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Sorun Açıklaması *"
              fullWidth
              multiline
              rows={4}
              margin="normal"
              error={!!errors.description}
              helperText={errors.description?.message}
              size="small"
            />
          )}
        />

        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Öncelik</InputLabel>
                <Select {...field} label="Öncelik">
                  <MenuItem value="1">
                    <Chip label="Düşük" color="info" size="small" />
                  </MenuItem>
                  <MenuItem value="2">
                    <Chip label="Orta" color="warning" size="small" />
                  </MenuItem>
                  <MenuItem value="3">
                    <Chip label="Yüksek" color="error" size="small" />
                  </MenuItem>
                  <MenuItem value="4">
                    <Chip label="Kritik" color="error" variant="outlined" size="small" />
                  </MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="assigned_to"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Atanan Personel</InputLabel>
                <Select {...field} label="Atanan Personel">
                  <MenuItem value="">Atanmadı</MenuItem>
                  <MenuItem value="2">Destek Personeli</MenuItem>
                  <MenuItem value="3">Mühendis Ahmet</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="due_date"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Son Tarih"
                type="date"
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            )}
          />
        </Box>

        {/* Dosya Yükleme Bölümü */}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            component="label"
            size="small"
            sx={{ mb: 2 }}
          >
            Dosya Ekle
            <input
              type="file"
              hidden
              multiple
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
          </Button>
          
          {attachments.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Eklenen Dosyalar:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {attachments.map((file, index) => (
                  <Chip
                    key={index}
                    label={`${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                    variant="outlined"
                    size="small"
                    onDelete={() => removeAttachment(index)}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Butonlar */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
          {onCancel && (
            <Button 
              onClick={onCancel} 
              variant="outlined" 
              size="large"
              disabled={submitting}
            >
              İptal
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={!selectedCompany || !selectedModule || submitting}
            sx={{ minWidth: 120 }}
          >
            {submitting ? 'Kaydediliyor...' : 'Talep Oluştur'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default TicketForm;