// types.ts - TAMAMEN GÜNCELLENDİ
export enum TicketStatus {
  NEW = 'new',
  ASSIGNED = 'assigned', 
  IN_PROGRESS = 'in_progress',
  TEST = 'test',
  TEST_FAILED = 'test_failed',
  COMPLETED = 'completed',
  WAITING = 'waiting',
  CLOSED = 'closed'
}

export enum ModuleType {
  CRM = 'crm',
  ERP = 'erp', 
  CUSTOM = 'custom'
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'support' | 'customer';
  companyId?: number;
  companyName?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Company {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// YENİ SQL YAPISINA GÖRE TAMAMEN GÜNCELLENDİ
export interface Ticket {
  // Temel bilgiler
  id: number;
  company_id: number;
  company_name: string;
  module_id: number;
  module_name: string;
  subject: string;
  description: string;
  email: string;
  
  // Status ve priority
  status_id: number;
  status_name: string;
  priority_id: number;
  priority_name: string;
  
  // Atama bilgileri
  assigned_to?: number;
  assigned_to_name?: string;
  created_by: number;
  created_by_name?: string;
  
  // Tarih bilgileri
  created_at: string;
  updated_by?: number;
  updated_at: string;
  due_date?: string;
  resolved_at?: string;
  
  // Diğer
  is_active: boolean;
  
  // İlişkili veriler
  attachments: Attachment[];
  statusHistory: StatusHistory[];
}

export interface Attachment {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: number;
}

// STATUS HISTORY GÜNCELLENDİ
export interface StatusHistory {
  id: number;
  status_id: number;
  status_name: string;
  changed_at: string;
  changed_by: number;
  changed_by_name?: string;
  notes?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface TicketContextType {
  tickets: Ticket[];
  companies: Company[];
  users: User[];
  loading: boolean;
  getTickets: () => Promise<void>;
  getTicket: (id: number) => Promise<Ticket | null>;
  addTicket: (ticket: Ticket) => Promise<void>;
  updateTicket: (id: number, updates: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: number) => Promise<void>;
  getCompanies: () => Promise<void>;
  getUsers: () => Promise<void>;
}