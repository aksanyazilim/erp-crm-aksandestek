// components/forms/ModuleSelect.tsx - GÜNCELLENDİ
import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Typography,
} from '@mui/material';
import { useTicket } from '../../contexts/TicketContext';
import { ModuleType } from '../../types';

const ModuleSelect: React.FC = () => {
  const { selectedCompany, selectedModule, setSelectedModule } = useTicket();

  const modules = [
    { value: ModuleType.CRM, label: 'CRM', color: 'primary' },
    { value: ModuleType.ERP, label: 'ERP', color: 'secondary' },
    { value: ModuleType.CUSTOM, label: 'Özel', color: 'success' },
  ];

  const handleModuleChange = (event: any) => {
    const moduleValue = event.target.value as ModuleType;
    setSelectedModule(moduleValue);
  };

  if (!selectedCompany) {
    return (
      <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Lütfen önce firma seçin
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <FormControl fullWidth variant="outlined" size="small">
        <InputLabel>Modül Seçin</InputLabel>
        <Select
          value={selectedModule || ''}
          onChange={handleModuleChange}
          label="Modül Seçin"
        >
          <MenuItem value="">
            <em>Modül seçin</em>
          </MenuItem>
          {modules.map((module) => (
            <MenuItem key={module.value} value={module.value}>
              <Chip 
                label={module.label} 
                color={module.color as any} 
                size="small" 
                variant="outlined"
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {selectedModule && (
        <Box sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="white">
            <strong>Seçilen Modül:</strong> {selectedModule.toUpperCase()}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ModuleSelect;