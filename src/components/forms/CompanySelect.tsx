// components/forms/CompanySelect.tsx - GÜNCELLENDİ
import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import { useTicket } from '../../contexts/TicketContext';
import { Company } from '../../types';

const CompanySelect: React.FC = () => {
  const { companies, selectedCompany, setSelectedCompany, setSelectedModule } = useTicket();

  const handleCompanyChange = (event: any) => {
    const companyId = event.target.value;
    const company = companies.find(c => c.id === companyId) || null;
    setSelectedCompany(company);
    setSelectedModule(null); // Firma değişince modülü sıfırla
  };

  return (
    <Box>
      <FormControl fullWidth variant="outlined" size="small">
        <InputLabel>Firma Seçin</InputLabel>
        <Select
          value={selectedCompany?.id || ''}
          onChange={handleCompanyChange}
          label="Firma Seçin"
        >
          <MenuItem value="">
            <em>Firma seçin</em>
          </MenuItem>
          {companies.map((company: Company) => (
            <MenuItem key={company.id} value={company.id}>
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {company.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {company.email}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {selectedCompany && (
        <Box sx={{ mt: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
          <Typography variant="body2" color="white">
            <strong>Seçilen Firma:</strong> {selectedCompany.name}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CompanySelect;