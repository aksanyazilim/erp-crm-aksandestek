import React from 'react';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  Chip,
  Box,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { Ticket, TicketStatus, ModuleType } from '../../types';

interface TicketsTableProps {
  onEdit: (ticket: Ticket) => void;
  onView: (ticket: Ticket) => void;
  onDelete: (ticketId: number) => void;
  tickets: Ticket[];
}

const TicketsTable: React.FC<TicketsTableProps> = ({ onEdit, onView, onDelete, tickets }) => {
// TicketsTable.tsx - Status config'i güncelleyelim
const getStatusChip = (status: TicketStatus) => {
  const statusConfig = {
    [TicketStatus.NEW]: { color: 'primary' as const, label: 'Yeni' },
    [TicketStatus.ASSIGNED]: { color: 'info' as const, label: 'Atandı' },
    [TicketStatus.IN_PROGRESS]: { color: 'warning' as const, label: 'Başlandı' },
    [TicketStatus.TEST]: { color: 'secondary' as const, label: 'Test' },
    [TicketStatus.TEST_FAILED]: { color: 'error' as const, label: 'Testten Döndü' },
    [TicketStatus.COMPLETED]: { color: 'success' as const, label: 'Tamamlandı' },
    [TicketStatus.WAITING]: { color: 'default' as const, label: 'Bekliyor' },
    [TicketStatus.CLOSED]: { color: 'default' as const, label: 'Kapandı' },
  };

  const config = statusConfig[status];
  return <Chip label={config.label} color={config.color} size="small" />;
};

  const getPriorityChip = (priority: string) => {
    const priorityConfig = {
      low: { color: 'info' as const, label: 'Düşük' },
      medium: { color: 'warning' as const, label: 'Orta' },
      high: { color: 'error' as const, label: 'Yüksek' },
      critical: { color: 'error' as const, label: 'Kritik' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getModuleChip = (module: ModuleType) => {
    const moduleConfig = {
      [ModuleType.CRM]: { color: 'primary' as const, label: 'CRM' },
      [ModuleType.ERP]: { color: 'secondary' as const, label: 'ERP' },
      [ModuleType.CUSTOM]: { color: 'success' as const, label: 'Özel' },
    };

    const config = moduleConfig[module];
    return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
  };

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
    },
    {
      field: 'companyName',
      headerName: 'Firma',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'module',
      headerName: 'Modül',
      width: 90,
      renderCell: (params: GridRenderCellParams) => getModuleChip(params.value),
    },
    {
      field: 'subject',
      headerName: 'Konu',
      width: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value}>
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'status',
      headerName: 'Durum',
      width: 120,
      renderCell: (params: GridRenderCellParams) => getStatusChip(params.value),
    },
    {
      field: 'priority',
      headerName: 'Öncelik',
      width: 100,
      renderCell: (params: GridRenderCellParams) => getPriorityChip(params.value),
    },
    {
      field: 'assignedTo',
      headerName: 'Atanan',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontSize="0.875rem">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Oluşturulma',
      width: 120,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('tr-TR'),
    },
    {
      field: 'dueDate',
      headerName: 'Son Tarih',
      width: 120,
      valueFormatter: (params) => 
        params.value ? new Date(params.value).toLocaleDateString('tr-TR') : '-',
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Görüntüle">
            <IconButton 
              size="small" 
              onClick={() => onView(params.row)}
              color="primary"
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Düzenle">
            <IconButton 
              size="small" 
              onClick={() => onEdit(params.row)}
              color="secondary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sil">
            <IconButton 
              size="small" 
              onClick={() => onDelete(params.row.id)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={tickets}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        sx={{
          border: 0,
          '& .MuiDataGrid-cell': {
            fontSize: '0.875rem',
          },
          '& .MuiDataGrid-columnHeaders': {
            fontSize: '0.875rem',
            fontWeight: 'bold',
          },
          '& .MuiDataGrid-cell:hover': {
            backgroundColor: 'action.hover',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        localeText={{
          noRowsLabel: 'Gösterilecek talep bulunamadı',
          footerRowSelected: (count) =>
            count !== 1
              ? `${count.toLocaleString()} satır seçildi`
              : `${count.toLocaleString()} satır seçildi`,
        }}
      />
    </Box>
  );
};

export default TicketsTable;