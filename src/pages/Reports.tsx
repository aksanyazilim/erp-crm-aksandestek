// pages/Reports.tsx - GÜNCELLENDİ
import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useTicket } from '../contexts/TicketContext';

const Reports: React.FC = () => {
  const { tickets } = useTicket();

  // Yeni SQL yapısına göre aylık istatistikler
  const currentYear = new Date().getFullYear();
  const monthlyData = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthTickets = tickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at);
      return ticketDate.getFullYear() === currentYear && ticketDate.getMonth() === monthIndex;
    });

    const resolvedTickets = monthTickets.filter(ticket => 
      [5, 7].includes(ticket.status_id) // Tamamlandı ve Kapandı
    );

    return {
      name: new Date(currentYear, monthIndex).toLocaleDateString('tr-TR', { month: 'short' }),
      talepler: monthTickets.length,
      cozulen: resolvedTickets.length,
      cozulmeOrani: monthTickets.length > 0 ? (resolvedTickets.length / monthTickets.length) * 100 : 0,
    };
  });

  // Durum dağılımı - Yeni SQL ID'lerine göre
  const statusData = [
    { name: 'Yeni', value: tickets.filter(t => t.status_id === 1).length },
    { name: 'Devam Ediyor', value: tickets.filter(t => t.status_id === 2).length },
    { name: 'Test', value: tickets.filter(t => t.status_id === 3).length },
    { name: 'Çözüldü', value: tickets.filter(t => t.status_id === 5).length },
    { name: 'Kapandı', value: tickets.filter(t => t.status_id === 7).length },
  ];

  // Modül dağılımı - Yeni SQL ID'lerine göre
  const moduleData = [
    { name: 'CRM', value: tickets.filter(t => t.module_id === 1).length },
    { name: 'ERP', value: tickets.filter(t => t.module_id === 2).length },
    { name: 'Özel', value: tickets.filter(t => t.module_id === 3).length },
  ];

  // Öncelik dağılımı - Yeni SQL ID'lerine göre
  const priorityData = [
    { name: 'Düşük', value: tickets.filter(t => t.priority_id === 1).length },
    { name: 'Orta', value: tickets.filter(t => t.priority_id === 2).length },
    { name: 'Yüksek', value: tickets.filter(t => t.priority_id === 3).length },
    { name: 'Öncelikli', value: tickets.filter(t => t.priority_id === 4).length },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const MODULE_COLORS = ['#8884d8', '#82ca9d', '#ffc658'];
  const PRIORITY_COLORS = ['#bae637', '#ffa940', '#ff7a45', '#ff4d4f'];

  // Genel istatistikler
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(t => 
    [5, 7].includes(t.status_id) // Tamamlandı ve Kapandı
  ).length;
  const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;
  
  // Ortalama çözüm süresini hesapla (gün cinsinden)
  const calculateAvgResolutionTime = () => {
    const resolvedTicketsWithTime = tickets.filter(t => 
      [5, 7].includes(t.status_id) && t.resolved_at && t.created_at
    );
    
    if (resolvedTicketsWithTime.length === 0) return 0;
    
    const totalDays = resolvedTicketsWithTime.reduce((sum, ticket) => {
      const created = new Date(ticket.created_at);
      const resolved = new Date(ticket.resolved_at!);
      const diffTime = Math.abs(resolved.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    
    return (totalDays / resolvedTicketsWithTime.length).toFixed(1);
  };

  const avgResolutionTime = calculateAvgResolutionTime();
  const activeTickets = tickets.filter(t => 
    [1, 2].includes(t.status_id) // Yeni ve Başlandı
  ).length;

  // Pie chart için custom label fonksiyonu
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, value, name
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${value}`}
      </text>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        📊 Raporlar ve Analizler
      </Typography>

      {/* İstatistik Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold">
                {totalTickets}
              </Typography>
              <Typography variant="h6">Toplam Talep</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold">
                {resolutionRate.toFixed(1)}%
              </Typography>
              <Typography variant="h6">Çözülme Oranı</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold">
                {avgResolutionTime}g
              </Typography>
              <Typography variant="h6">Ort. Çözüm Süresi</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold">
                {activeTickets}
              </Typography>
              <Typography variant="h6">Aktif Talepler</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Aylık Talep Dağılımı */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              {currentYear} Yılı Aylık Talep Dağılımı
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="talepler" fill="#8884d8" name="Toplam Talepler" />
                <Bar dataKey="cozulen" fill="#82ca9d" name="Çözülenler" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Talep Durumları */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Talep Durumları
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Modül Dağılımı */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Modül Dağılımı
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={moduleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {moduleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MODULE_COLORS[index % MODULE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Öncelik Dağılımı */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Öncelik Dağılımı
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Çözülme Oranı Trendi */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Aylık Çözülme Oranı Trendi
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Çözülme Oranı']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cozulmeOrani" 
                  stroke="#8884d8" 
                  name="Çözülme Oranı (%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;