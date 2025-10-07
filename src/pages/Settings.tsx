import React from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';

const Settings: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ayarlar
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Bildirim Ayarları
            </Typography>
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Email bildirimleri"
              sx={{ mb: 2, display: 'block' }}
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Yeni talep bildirimleri"
              sx={{ mb: 2, display: 'block' }}
            />
            <FormControlLabel
              control={<Switch />}
              label="Haftalık raporlar"
              sx={{ mb: 2, display: 'block' }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Görünüm Ayarları
            </Typography>
            
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Tema</FormLabel>
              <RadioGroup defaultValue="light">
                <FormControlLabel value="light" control={<Radio />} label="Açık Tema" />
                <FormControlLabel value="dark" control={<Radio />} label="Koyu Tema" />
                <FormControlLabel value="auto" control={<Radio />} label="Sistemle Aynı" />
              </RadioGroup>
            </FormControl>

            <FormControl component="fieldset">
              <FormLabel component="legend">Dil</FormLabel>
              <RadioGroup defaultValue="tr">
                <FormControlLabel value="tr" control={<Radio />} label="Türkçe" />
                <FormControlLabel value="en" control={<Radio />} label="İngilizce" />
              </RadioGroup>
            </FormControl>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Şifre Değiştir
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Mevcut Şifre"
                  type="password"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Yeni Şifre"
                  type="password"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Yeni Şifre (Tekrar)"
                  type="password"
                  margin="normal"
                />
              </Grid>
            </Grid>
            <Button variant="contained" sx={{ mt: 2 }}>
              Şifreyi Güncelle
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;