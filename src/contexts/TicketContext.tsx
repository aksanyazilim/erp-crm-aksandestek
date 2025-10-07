// contexts/TicketContext.tsx - YENİLEME SORUNU ÇÖZÜLDÜ
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Ticket, Company, User, ModuleType } from '../types';
import { ticketsAPI, companiesAPI, usersAPI } from '../services/api';

interface TicketContextType {
  tickets: Ticket[];
  companies: Company[];
  users: User[];
  loading: boolean;
  
  // State'ler
  selectedCompany: Company | null;
  selectedModule: ModuleType | null;
  setSelectedCompany: (company: Company | null) => void;
  setSelectedModule: (module: ModuleType | null) => void;
  
  // Methods
  getTickets: () => Promise<void>;
  getTicket: (id: number) => Promise<Ticket | null>;
  addTicket: (ticketData: any) => Promise<void>;
  updateTicket: (id: number, updates: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: number) => Promise<void>;
  getCompanies: () => Promise<void>;
  getUsers: () => Promise<void>;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const TicketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false); // Başlangıçta false yapıldı
  
  // State'ler
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleType | null>(null);

  // SADECE İLK YÜKLEMEDE VERİLERİ ÇEK - useEffect dependency array boş
  useEffect(() => {
    console.log('🔄 TicketContext initial data loading...');
    loadInitialData();
  }, []); // Boş dependency array - sadece component mount olduğunda çalışır

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([getCompanies(), getUsers()]);
      // Tickets'ı otomatik yükleme - kullanıcı talep ettiğinde yüklenecek
      console.log('✅ Initial data loaded successfully');
    } catch (error) {
      console.error('❌ Initial data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getTickets();
      setTickets(response.data);
      console.log('✅ Tickets loaded:', response.data.length);
    } catch (error) {
      console.error('❌ Get tickets error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getTicket = async (id: number): Promise<Ticket | null> => {
    try {
      const response = await ticketsAPI.getTicket(id);
      return response.data;
    } catch (error) {
      console.error('❌ Get ticket error:', error);
      return null;
    }
  };

  const addTicket = async (ticketData: any) => {
    try {
      setLoading(true);
      const response = await ticketsAPI.createTicket(ticketData);
      
      // Yeni ticket'ı listeye ekle
      setTickets(prev => [response.data, ...prev]);
      
      console.log('✅ Ticket created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Add ticket error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTicket = async (id: number, updates: Partial<Ticket>) => {
    try {
      setLoading(true);
      const response = await ticketsAPI.updateTicket(id, updates);
      
      // Ticket'ı güncelle
      setTickets(prev => prev.map(ticket => 
        ticket.id === id ? { ...ticket, ...response.data } : ticket
      ));
      
      console.log('✅ Ticket updated successfully:', id);
      return response.data;
    } catch (error) {
      console.error('❌ Update ticket error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTicket = async (id: number) => {
    try {
      setLoading(true);
      await ticketsAPI.updateTicket(id, { is_active: 0 });
      
      // Ticket'ı listeden kaldır
      setTickets(prev => prev.filter(ticket => ticket.id !== id));
      
      console.log('✅ Ticket deleted successfully:', id);
    } catch (error) {
      console.error('❌ Delete ticket error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getCompanies = async () => {
    try {
      const response = await companiesAPI.getCompanies();
      setCompanies(response.data);
      console.log('✅ Companies loaded:', response.data.length);
    } catch (error) {
      console.error('❌ Get companies error:', error);
      throw error;
    }
  };

  const getUsers = async () => {
    try {
      const response = await usersAPI.getSupportUsers();
      setUsers(response.data);
      console.log('✅ Users loaded:', response.data.length);
    } catch (error) {
      console.error('❌ Get users error:', error);
      throw error;
    }
  };

  return (
    <TicketContext.Provider value={{
      tickets,
      companies,
      users,
      loading,
      
      // State'ler
      selectedCompany,
      selectedModule,
      setSelectedCompany,
      setSelectedModule,
      
      // Methods
      getTickets,
      getTicket,
      addTicket,
      updateTicket,
      deleteTicket,
      getCompanies,
      getUsers,
    }}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTicket = () => {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTicket must be used within a TicketProvider');
  }
  return context;
};