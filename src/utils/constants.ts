export const TICKET_STATUS_OPTIONS = [
  { value: 'new', label: 'Yeni', color: 'primary' },
  { value: 'assigned', label: 'Atandı', color: 'info' },
  { value: 'in_progress', label: 'Başlandı', color: 'warning' },
  { value: 'test', label: 'Test', color: 'secondary' },
  { value: 'test_failed', label: 'Testten Döndü', color: 'error' },
  { value: 'completed', label: 'Tamamlandı', color: 'success' },
  { value: 'waiting', label: 'Bekliyor', color: 'default' },
  { value: 'closed', label: 'Kapandı', color: 'default' },
];

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Düşük', color: 'info' },
  { value: 'medium', label: 'Orta', color: 'warning' },
  { value: 'high', label: 'Yüksek', color: 'error' },
  { value: 'critical', label: 'Kritik', color: 'error' },
];

export const MODULE_OPTIONS = [
  { value: 'crm', label: 'CRM' },
  { value: 'erp', label: 'ERP' },
  { value: 'custom', label: 'Özel' },
];