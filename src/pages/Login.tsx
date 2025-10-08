import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  alpha,
  Fade,
  Zoom,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  LockOutlined,
  Security,
  SupportAgent,
  Business,
  Person,
  Email,
  Visibility,
  VisibilityOff,
  CorporateFare,
  Dashboard,
  Group,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Eğer zaten giriş yapılmışsa ana sayfaya yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Geçersiz email veya şifre');
      }
    } catch (err) {
      setError('Giriş sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Eğer zaten giriş yapılmışsa loading göster
  if (isAuthenticated) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <Fade in={true} timeout={1000}>
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <CircularProgress sx={{ color: 'white', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Yönlendiriliyor...
              </Typography>
            </Box>
          </Fade>
        </Box>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
          `,
        },
      }}
    >
      <Container component="main" maxWidth="lg">
        <Box
          sx={{
            py: 4,
            position: 'relative',
            zIndex: 1,
          }}
        >


              {/* Sağ Taraf - Login Form */}
              <Grid item xs={12} lg={6}>
                <Fade in={true} timeout={1600}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Paper
                      elevation={0}
                      sx={{
                        width: '100%',
                        maxWidth: 450,
                        padding: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 4,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 3,
                          color: theme.palette.primary.main,
                        }}
                      >
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                          }}
                        >
                          <LockOutlined sx={{ fontSize: 24, color: 'white' }} />
                        </Box>
                        <Box>
                          <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold' }}>
                            Giriş Yap
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Hesabınıza erişim sağlayın
                          </Typography>
                        </Box>
                      </Box>

                      {error && (
                        <Alert 
                          severity="error" 
                          sx={{ 
                            width: '100%', 
                            mb: 3,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.error.light}`,
                          }}
                        >
                          {error}
                        </Alert>
                      )}

                      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          id="email"
                          label="Email Adresi"
                          name="email"
                          autoComplete="email"
                          autoFocus
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Email color="primary" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                              },
                            },
                          }}
                        />
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          name="password"
                          label="Şifre"
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockOutlined color="primary" />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={handleClickShowPassword}
                                  edge="end"
                                  disabled={loading}
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                              },
                            },
                          }}
                        />
                        <Button
                          type="submit"
                          fullWidth
                          variant="contained"
                          size="large"
                          disabled={loading}
                          sx={{
                            mt: 1,
                            mb: 2,
                            py: 1.5,
                            borderRadius: 2,
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
                            },
                            '&:disabled': {
                              background: theme.palette.grey[300],
                              transform: 'none',
                              boxShadow: 'none',
                            },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {loading ? (
                            <CircularProgress size={24} sx={{ color: 'white' }} />
                          ) : (
                            'Giriş Yap'
                          )}
                        </Button>
                      </Box>

                      {/* Demo Bilgileri */}
                      <Box
                        sx={{
                          mt: 3,
                          p: 3,
                          background: alpha(theme.palette.primary.main, 0.05),
                          borderRadius: 3,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                          width: '100%',
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                          🚀 Demo Hesap Bilgileri
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                              Email:
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: theme.palette.success.main,
                              fontWeight: 'bold',
                              fontFamily: 'monospace'
                            }}>
                              admin@erp.com
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                              Şifre:
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: theme.palette.success.main,
                              fontWeight: 'bold',
                              fontFamily: 'monospace'
                            }}>
                              password
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                </Fade>
              </Grid>
          
         
        </Box>
      </Container>
    </Box>
  );
};

export default Login;